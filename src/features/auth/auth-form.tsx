"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { ensurePersonalWorkspace } from "@/lib/supabase/bootstrap";
import { isDevelopmentAuthBypassEnabled } from "@/lib/supabase/config";

type AuthMode = "login" | "register" | "forgot";
type AuthMethod = "password" | "otp";
type Notice = { tone: "error" | "success"; title: string; text?: string };

const labels: Record<AuthMode, { button: string; alternate: string; alternateHref: string; alternateLabel: string }> = {
  login: { button: "登录工作台", alternate: "还没有自己的学习空间？", alternateHref: "/register", alternateLabel: "创建一个 →" },
  register: { button: "创建学习空间", alternate: "已经有自己的学习空间？", alternateHref: "/login", alternateLabel: "登录 →" },
  forgot: { button: "发送恢复邮件", alternate: "想起密码了？", alternateHref: "/login", alternateLabel: "返回登录" },
};

function friendlyError(error: unknown): Notice {
  const message = error instanceof Error ? error.message : "";
  console.error("[auth]", error);
  if (message.includes("Missing NEXT_PUBLIC")) return { tone: "error", title: "当前登录服务尚未配置", text: "请配置 Supabase 环境变量后继续。" };
  if (message.toLowerCase().includes("invalid login credentials")) return { tone: "error", title: "邮箱或密码不正确", text: "请检查后再试。" };
  if (message.toLowerCase().includes("rate limit") || message.toLowerCase().includes("too many")) return { tone: "error", title: "发送次数已达上限", text: "请稍后再试，或检查 Supabase 邮件服务设置。" };
  if (message.toLowerCase().includes("token") || message.toLowerCase().includes("otp") || message.toLowerCase().includes("expired")) return { tone: "error", title: "验证码无效或已过期", text: "请重新发送验证码后再试。" };
  if (message.toLowerCase().includes("email")) return { tone: "error", title: "邮箱地址不可用", text: "请检查邮箱格式后再试。" };
  return { tone: "error", title: "操作没有完成", text: "请检查信息后稍后再试。" };
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [method, setMethod] = useState<AuthMethod>(mode === "register" ? "otp" : "password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setTimeout(() => setResendSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  function selectMethod(nextMethod: AuthMethod) {
    setMethod(nextMethod);
    setOtpSent(false);
    setResendSeconds(0);
    setToken("");
    setNotice(null);
  }

  async function sendOtp() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      setNotice({ tone: "error", title: "请输入有效邮箱", text: "验证码会发送到这个邮箱。" });
      return;
    }
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({ email: normalizedEmail, options: { shouldCreateUser: mode === "register", emailRedirectTo: window.location.origin + "/workspace/dashboard" } });
    if (error) throw error;
    setEmail(normalizedEmail);
    setOtpSent(true);
    setResendSeconds(60);
    setToken("");
    setNotice({ tone: "success", title: "验证码已发送", text: "请输入邮件中的 6 位验证码。" });
  }

  async function resendOtp() {
    if (pending || resendSeconds > 0) return;
    setPending(true);
    setNotice(null);
    try {
      await sendOtp();
    } catch (error) {
      setNotice(friendlyError(error));
    } finally {
      setPending(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setNotice(null);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (!isValidEmail(normalizedEmail)) {
        setNotice({ tone: "error", title: "请输入有效邮箱", text: "请检查邮箱格式后再试。" });
        return;
      }
      setEmail(normalizedEmail);
      const supabase = createSupabaseBrowserClient();
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, { redirectTo: window.location.origin + "/login" });
        if (error) throw error;
        setNotice({ tone: "success", title: "恢复邮件已发送", text: "请查看收件箱并按邮件提示继续。" });
      } else if (method === "otp" && !otpSent) {
        await sendOtp();
      } else if (method === "otp") {
        if (!/^\d{6}$/.test(token)) {
          setNotice({ tone: "error", title: "请输入 6 位验证码", text: "验证码只能包含数字。" });
          return;
        }
        const { error } = await supabase.auth.verifyOtp({ email: normalizedEmail, token, type: "email" });
        if (error) throw error;
        if (mode === "register") {
          const { error: passwordError } = await supabase.auth.updateUser({ password });
          if (passwordError) throw passwordError;
        }
        await ensurePersonalWorkspace(supabase);
        router.push("/workspace/dashboard");
        router.refresh();
        return;
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
        if (error) throw error;
        await ensurePersonalWorkspace(supabase);
        router.push("/workspace/dashboard");
        router.refresh();
        return;
      } else {
        const { data, error } = await supabase.auth.signUp({ email: normalizedEmail, password });
        if (error) throw error;
        if (data.session) await ensurePersonalWorkspace(supabase);
        setNotice({ tone: "success", title: data.session ? "学习空间已创建" : "账号已创建", text: data.session ? "正在准备你的学习空间。" : "请查看邮箱完成验证。" });
        if (data.session) {
          router.push("/workspace/dashboard");
          router.refresh();
          return;
        }
      }
    } catch (error) {
      setNotice(friendlyError(error));
    } finally {
      setPending(false);
    }
  }

  const copy = labels[mode];
  const showOtpToggle = mode !== "forgot";
  const showPassword = mode !== "forgot" && (method === "password" || mode === "register");
  const codeStep = method === "otp" && otpSent;
  const showDevelopmentBypass = mode === "login" && isDevelopmentAuthBypassEnabled();

  return <div className="auth-form-wrap">
    {showOtpToggle ? <div className="auth-method-switch" role="tablist" aria-label="登录方式"><button type="button" role="tab" aria-selected={method === "password"} className={method === "password" ? "is-active" : ""} onClick={() => selectMethod("password")}>{mode === "register" ? "密码注册" : "密码登录"}</button><button type="button" role="tab" aria-selected={method === "otp"} className={method === "otp" ? "is-active" : ""} onClick={() => selectMethod("otp")}>邮箱验证码</button></div> : null}
    <form onSubmit={handleSubmit} className="auth-form-fields">
      <div className="auth-field"><label htmlFor="email">Email</label><Input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></div>
      {showPassword ? <div className="auth-field"><div className="auth-label-row"><label htmlFor="password">Password</label>{mode === "login" && method === "password" ? <Link href="/forgot-password">忘记密码？</Link> : null}</div><Input id="password" type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="至少 6 位字符" />{mode === "register" && method === "otp" ? <p className="auth-field-help">验证码验证后，这个密码会用于之后的密码登录。</p> : null}</div> : null}
      {codeStep ? <div className="auth-field"><label htmlFor="verification-code">邮箱验证码</label><Input id="verification-code" inputMode="numeric" pattern="[0-9]{6}" autoComplete="one-time-code" required value={token} onChange={(event) => setToken(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="输入 6 位验证码" /><p className="auth-field-help">验证码有效期由 Supabase Email Auth 控制，请尽快完成验证。</p></div> : null}
      {notice ? <div role={notice.tone === "error" ? "alert" : "status"} className={"auth-notice is-" + notice.tone}><strong>{notice.title}</strong>{notice.text ? <span>{notice.text}</span> : null}</div> : null}
      <Button type="submit" size="lg" className="auth-submit" disabled={pending}>{pending ? codeStep ? "验证中…" : "处理中…" : codeStep ? "验证并进入工作台" : method === "otp" && mode !== "forgot" ? "发送验证码" : copy.button}</Button>
    </form>
    {codeStep ? <button type="button" className="auth-resend" disabled={pending || resendSeconds > 0} onClick={resendOtp}>{resendSeconds > 0 ? `重新发送验证码（${resendSeconds}s）` : "重新发送验证码"}</button> : null}
    {showDevelopmentBypass ? <div className="mt-5 border-t border-[var(--line-soft)] pt-5"><Button type="button" variant="outline" className="w-full" onClick={() => router.push("/workspace/dashboard")}>跳过登录进入工作台</Button><p className="mt-2 text-center text-xs text-muted-foreground">仅本地 development 环境可用，不会创建或伪造用户 Session。</p></div> : null}
    <p className="auth-alternate"><span>{copy.alternate}</span><Link href={copy.alternateHref}>{copy.alternateLabel}</Link></p>
  </div>;
}

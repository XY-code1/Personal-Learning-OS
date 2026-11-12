"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

/**
 * Supabase auth callback.
 *
 * Handles both the implicit flow (token in the URL hash) and the PKCE flow
 * (`?code=...`), then routes to the reset page for recovery links or to the
 * dashboard otherwise.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let active = true;

    const code = new URLSearchParams(window.location.search).get("code");
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const type = hash.get("type");
    const target = type === "recovery" ? "/reset-password" : "/dashboard";

    const go = () => {
      if (!active) return;
      active = false;
      router.replace(target);
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) go();
    });

    async function handle() {
      const hashError = hash.get("error");
      if (hashError) {
        if (active) setError(hash.get("error_description") ?? hashError);
        return;
      }
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (!active) return;
        if (exchangeError) {
          setError(exchangeError.message);
          return;
        }
      }
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (data.session) go();
    }

    handle();

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-sm text-muted-foreground">{error ? `登录失败：${error}` : "正在登录，请稍候…"}</p>
    </main>
  );
}

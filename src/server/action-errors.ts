import type { ActionResult } from "@/types/records";

export class InputError extends Error {}

export function requiredText(formData: FormData, key: string, maxLength: number): string {
  const value = String(formData.get(key) ?? "").trim();
  if (!value) throw new InputError(`${key} is required`);
  if (value.length > maxLength) throw new InputError(`${key} is too long`);
  return value;
}

export function optionalText(formData: FormData, key: string, maxLength: number): string {
  const value = String(formData.get(key) ?? "").trim();
  if (value.length > maxLength) throw new InputError(`${key} is too long`);
  return value;
}

export function requiredUuid(formData: FormData, key: string): string {
  const value = requiredText(formData, key, 64);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) throw new InputError(`${key} is invalid`);
  return value;
}

export function optionalUuid(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  if (!value) return null;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) throw new InputError(`${key} is invalid`);
  return value;
}

export function actionError(error: unknown): ActionResult {
  console.error("[server action]", error);
  if (error instanceof InputError) return { ok: false, message: "请检查输入内容后再试。" };
  if (error instanceof Error && error.message === "SUPABASE_NOT_CONFIGURED") return { ok: false, message: "当前登录服务尚未配置，请先填写 Supabase 环境变量。" };
  if (error instanceof Error && error.message === "AUTH_REQUIRED") return { ok: false, message: "登录状态已失效，请重新登录。" };
  return { ok: false, message: "保存失败，请稍后再试。" };
}

export function parseEnum<T extends string>(formData: FormData, key: string, values: readonly T[], fallback: T): T {
  const value = String(formData.get(key) ?? fallback);
  return values.includes(value as T) ? value as T : fallback;
}

export function parseInteger(formData: FormData, key: string, min: number, max: number, fallback: number): number {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) throw new InputError(`${key} is invalid`);
  return value;
}

import { AuthForm } from "@/features/auth/auth-form";
import { AuthShell } from "@/features/auth/auth-shell";

export default function ForgotPasswordPage() {
  return <AuthShell mode="forgot"><AuthForm mode="forgot" /></AuthShell>;
}
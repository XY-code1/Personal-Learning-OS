import { AuthForm } from "@/features/auth/auth-form";
import { AuthShell } from "@/features/auth/auth-shell";

export default function LoginPage() {
  return <AuthShell mode="login"><AuthForm mode="login" /></AuthShell>;
}
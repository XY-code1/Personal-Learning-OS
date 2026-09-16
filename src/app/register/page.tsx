import { AuthForm } from "@/features/auth/auth-form";
import { AuthShell } from "@/features/auth/auth-shell";

export default function RegisterPage() {
  return <AuthShell mode="register"><AuthForm mode="register" /></AuthShell>;
}
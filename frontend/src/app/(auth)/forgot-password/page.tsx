import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Forgot password</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Send a reset link to your email address.
        </p>
      </div>

      <ForgotPasswordForm />
    </div>
  );
}

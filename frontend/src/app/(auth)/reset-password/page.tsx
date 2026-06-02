import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function ResetPasswordPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Reset password</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Enter the token from your email and choose a new password.
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-44" />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}

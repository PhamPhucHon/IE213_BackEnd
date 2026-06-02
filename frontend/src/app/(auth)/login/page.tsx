import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Sign in</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Sign in to manage orders, cart, and account details.
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-40" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Login</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Sign in to manage orders, cart, and account details.
        </p>
      </div>

      <Suspense fallback={<div className="h-40 rounded-md bg-surface" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

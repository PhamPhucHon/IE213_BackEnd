import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Register</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Create an account to save cart, checkout, and track orders.
        </p>
      </div>

      <Suspense fallback={<div className="h-56 rounded-md bg-surface" />}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}

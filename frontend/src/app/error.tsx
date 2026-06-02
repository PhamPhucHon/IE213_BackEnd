"use client";

import Link from "next/link";
import { useEffect } from "react";
import { StatusAlert } from "@/components/ui/status-alert";
import { getButtonClassName } from "@/components/ui/style-primitives";

export default function RootError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="main-content" className="container-page flex min-h-[100dvh] items-center justify-center py-10" tabIndex={-1}>
      <section className="w-full max-w-lg rounded-lg border border-line bg-white p-6 text-center shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-wide text-danger-700">Page error</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">We could not load this page</h1>
        <StatusAlert tone="error" className="mt-5 text-left">
          Try again, or return home if the problem continues.
        </StatusAlert>
        <div className="mt-6 grid gap-2 min-[390px]:flex min-[390px]:justify-center">
          <button
            type="button"
            className={getButtonClassName("primary", "w-full min-[390px]:w-auto")}
            onClick={reset}
          >
            Try again
          </button>
          <Link
            href="/"
            className={getButtonClassName("secondary", "w-full min-[390px]:w-auto")}
          >
            Back home
          </Link>
        </div>
      </section>
    </main>
  );
}

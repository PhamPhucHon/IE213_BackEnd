"use client";

import Link from "next/link";
import { useEffect } from "react";

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
    <main className="container-page flex min-h-screen items-center justify-center py-10">
      <section className="w-full max-w-lg rounded-lg border border-line bg-white p-6 text-center shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-600">Error</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Something went wrong</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          The page failed to render. Try again, or return home if the problem persists.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            className="focus-ring rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white"
            onClick={reset}
          >
            Try again
          </button>
          <Link
            href="/"
            className="focus-ring rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-surface"
          >
            Back home
          </Link>
        </div>
      </section>
    </main>
  );
}

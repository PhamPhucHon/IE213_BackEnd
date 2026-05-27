"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function AdminError({
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
    <main className="container-page py-10">
      <section className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-800">
        <p className="text-sm font-semibold uppercase tracking-wide">Admin error</p>
        <h1 className="mt-2 text-2xl font-semibold">Dashboard could not finish loading</h1>
        <p className="mt-3 text-sm leading-6">
          Retry the screen after checking that the backend is reachable and your admin session is valid.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            className="focus-ring rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white"
            onClick={reset}
          >
            Try again
          </button>
          <Link
            href="/admin"
            className="focus-ring rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
          >
            Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}

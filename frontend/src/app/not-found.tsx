import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container-page flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">404</p>
      <h1 className="text-3xl font-semibold text-ink">Page not found</h1>
      <p className="max-w-md text-muted">
        The page may have moved or the route has not been implemented yet.
      </p>
      <Link
        href="/"
        className="focus-ring rounded-md bg-ink px-4 py-2 text-sm font-medium text-white"
      >
        Back to home
      </Link>
    </main>
  );
}

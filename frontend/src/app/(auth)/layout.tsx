import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-surface">
      <div className="container-page flex min-h-screen items-center justify-center py-10">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-6 block text-center text-xl font-bold text-ink">
            IE213 Eyewear
          </Link>
          <div className="rounded-lg border border-line bg-white p-6 shadow-soft">{children}</div>
        </div>
      </div>
    </main>
  );
}

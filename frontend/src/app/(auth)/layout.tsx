import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main-content" className="min-h-[100dvh] bg-surface" tabIndex={-1}>
      <div className="container-page flex min-h-[100dvh] items-center justify-center py-10">
        <div className="w-full max-w-md">
          <Link href="/" className="focus-ring mx-auto mb-6 block w-fit rounded-md text-center text-xl font-bold tracking-tight text-ink">
            IE213 <span className="text-brand-700">Eyewear</span>
          </Link>
          <div className="rounded-lg border border-line bg-white p-6 shadow-soft sm:p-7">
            {children}
          </div>
          <p className="mt-5 text-center text-xs leading-5 text-muted">
            Secure account access for IE213 orders, cart, and profile details.
          </p>
        </div>
      </div>
    </main>
  );
}

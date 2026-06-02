import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { getButtonClassName } from "@/components/ui/style-primitives";

export default function NotFound() {
  return (
    <main id="main-content" className="container-page flex min-h-[100dvh] items-center justify-center py-10" tabIndex={-1}>
      <EmptyState
        title="Page not found"
        description="The page may have moved, or the link may no longer be available."
        className="w-full max-w-lg bg-white"
        action={
          <Link href="/" className={getButtonClassName("primary")}>
            Back home
          </Link>
        }
      />
    </main>
  );
}

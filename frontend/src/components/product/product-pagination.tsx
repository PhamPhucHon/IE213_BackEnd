import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CatalogPagination } from "@/lib/catalog/product-utils";
import type { CatalogSearchState } from "@/lib/catalog/query";
import { buildCatalogHref } from "@/lib/catalog/query";
import { cn } from "@/lib/utils";

type ProductPaginationProps = {
  basePath: string;
  pagination: CatalogPagination;
  query: CatalogSearchState;
};

function pageHref(basePath: string, query: CatalogSearchState, page: number) {
  return buildCatalogHref(basePath, query, { page });
}

function visiblePages(currentPage: number, totalPages: number) {
  return Array.from(
    new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages])
  )
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);
}

export function ProductPagination({ basePath, pagination, query }: ProductPaginationProps) {
  const totalPages = Math.max(1, pagination.totalPages);
  const currentPage = Math.min(Math.max(1, pagination.currentPage), totalPages);

  if (totalPages <= 1) {
    return null;
  }

  const pages = visiblePages(currentPage, totalPages);

  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
      <p className="text-sm text-muted">
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={pageHref(basePath, query, Math.max(1, currentPage - 1))}
          aria-disabled={currentPage === 1}
          tabIndex={currentPage === 1 ? -1 : undefined}
          className={cn(
            "focus-ring inline-flex min-h-11 items-center gap-1 rounded-md border border-line bg-white px-3 text-sm font-medium text-ink transition hover:bg-surface",
            currentPage === 1 && "pointer-events-none opacity-50"
          )}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Previous
        </Link>
        {pages.map((page, index) => {
          const previous = pages[index - 1];
          const needsGap = previous && page - previous > 1;

          return (
            <span key={page} className="flex items-center gap-2">
              {needsGap ? <span className="px-1 text-sm text-muted">...</span> : null}
              <Link
                href={pageHref(basePath, query, page)}
                aria-current={page === currentPage ? "page" : undefined}
                className={cn(
                  "focus-ring inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-line px-3 text-sm font-medium transition",
                  page === currentPage
                    ? "bg-ink text-white"
                    : "bg-white text-ink hover:bg-surface"
                )}
              >
                {page}
              </Link>
            </span>
          );
        })}
        <Link
          href={pageHref(basePath, query, Math.min(totalPages, currentPage + 1))}
          aria-disabled={currentPage === totalPages}
          tabIndex={currentPage === totalPages ? -1 : undefined}
          className={cn(
            "focus-ring inline-flex min-h-11 items-center gap-1 rounded-md border border-line bg-white px-3 text-sm font-medium text-ink transition hover:bg-surface",
            currentPage === totalPages && "pointer-events-none opacity-50"
          )}
        >
          Next
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, Star, Trash2 } from "lucide-react";
import { useConfirm } from "@/components/ui/confirm-provider";
import { useToast } from "@/components/ui/toast-provider";
import { adminDeleteReview, getLocalReviewErrorMessage } from "@/lib/api/local-reviews";
import { adminReviewsQueryKey, useAdminReviews } from "@/lib/hooks/use-admin";
import { getReviewPagination } from "@/lib/reviews/review-utils";
import { cn, formatDate } from "@/lib/utils";
import type { Review } from "@/types/models";

const ratingFilters = [5, 4, 3, 2, 1] as const;

function pageFromSearchParams(searchParams: URLSearchParams) {
  const page = Number(searchParams.get("page"));
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function ratingFromSearchParams(value: string | null) {
  const rating = Number(value);
  return Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : undefined;
}

function pageHref(searchParams: URLSearchParams, page: number) {
  const params = new URLSearchParams(searchParams);

  if (page <= 1) {
    params.delete("page");
  } else {
    params.set("page", String(page));
  }

  const query = params.toString();
  return query ? `/admin/reviews?${query}` : "/admin/reviews";
}

function filterHref(searchParams: URLSearchParams, rating?: number) {
  const params = new URLSearchParams(searchParams);
  params.delete("page");

  if (rating) {
    params.set("rating", String(rating));
  } else {
    params.delete("rating");
  }

  const query = params.toString();
  return query ? `/admin/reviews?${query}` : "/admin/reviews";
}

function productInfo(review: Review) {
  if (typeof review.productId === "string") {
    return {
      id: review.productId,
      name: review.productId,
      brand: "",
      editHref: null
    };
  }

  return {
    id: review.productId._id,
    name: review.productId.name,
    brand: review.productId.brand,
    editHref: `/admin/products/${review.productId._id}/edit`
  };
}

function ReviewsSkeleton() {
  return (
    <div className="grid gap-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="h-32 rounded-lg bg-surface" />
      ))}
    </div>
  );
}

export function AdminReviewsView() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { showToast } = useToast();
  const page = pageFromSearchParams(searchParams);
  const rating = ratingFromSearchParams(searchParams.get("rating"));
  const { data: response, isLoading, error } = useAdminReviews(page, 10, rating);
  const reviews = response?.data ?? [];
  const pagination = getReviewPagination(response?.meta);
  const deleteMutation = useMutation({
    mutationFn: adminDeleteReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminReviewsQueryKey });
      showToast({ title: "Review deleted", variant: "success" });
    },
    onError: (mutationError) => {
      showToast({
        title: "Could not delete review",
        description: getLocalReviewErrorMessage(mutationError),
        variant: "error"
      });
    }
  });

  if (isLoading) {
    return <ReviewsSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {getLocalReviewErrorMessage(error)}
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Link
          href={filterHref(searchParams)}
          className={cn(
            "focus-ring inline-flex min-h-11 shrink-0 items-center rounded-md border px-3 text-sm font-semibold",
            !rating
              ? "border-ink bg-ink text-white"
              : "border-line bg-white text-ink hover:bg-surface"
          )}
          aria-current={!rating ? "page" : undefined}
        >
          All
        </Link>
        {ratingFilters.map((item) => (
          <Link
            key={item}
            href={filterHref(searchParams, item)}
            className={cn(
              "focus-ring inline-flex min-h-11 shrink-0 items-center rounded-md border px-3 text-sm font-semibold",
              rating === item
                ? "border-ink bg-ink text-white"
                : "border-line bg-white text-ink hover:bg-surface"
            )}
            aria-current={rating === item ? "page" : undefined}
          >
            {item} star
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {pagination.totalReviews} reviews{rating ? ` with ${rating} star` : ""}
        </p>
        <p className="text-sm text-muted">
          Page {pagination.currentPage} of {pagination.totalPages}
        </p>
      </div>

      {!reviews.length ? (
        <div className="rounded-lg border border-line bg-white p-8 text-center">
          <h2 className="text-xl font-semibold text-ink">No reviews found</h2>
          <p className="mt-2 text-sm text-muted">Try another rating filter or wait for product reviews.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {reviews.map((review) => {
            const product = productInfo(review);

            return (
              <article key={review._id} className="rounded-lg border border-line bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
                      <span className="inline-flex items-center gap-1 font-semibold text-brand-600">
                        <Star className="h-4 w-4 fill-brand-500 text-brand-500" />
                        {review.rating}
                      </span>
                      {review.isVerifiedPurchase ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          <ShieldCheck className="h-3 w-3" />
                          Verified purchase
                        </span>
                      ) : null}
                      <span>{formatDate(review.createdAt)}</span>
                    </div>
                    <h2 className="mt-2 break-words text-lg font-semibold text-ink">
                      {review.title || "Untitled review"}
                    </h2>
                    <p className="mt-1 break-words text-sm text-muted">
                      By <span className="font-medium text-ink">{review.userName}</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={deleteMutation.isPending}
                    onClick={async () => {
                      const confirmed = await confirm({
                        title: "Delete review?",
                        description: "This review will be removed and product rating stats will be recalculated.",
                        confirmLabel: "Delete",
                        destructive: true
                      });

                      if (confirmed) {
                        deleteMutation.mutate(review._id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>

                <p className="mt-4 break-words text-sm leading-6 text-muted">{review.comment}</p>

                <div className="mt-4 grid gap-2 rounded-md bg-surface p-3 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-muted">Product</p>
                    {product.editHref ? (
                      <Link href={product.editHref} className="break-words font-semibold text-ink">
                        {product.name}
                      </Link>
                    ) : (
                      <p className="break-all font-semibold text-ink">{product.name}</p>
                    )}
                    {product.brand ? <p className="mt-1 text-xs text-muted">{product.brand}</p> : null}
                  </div>
                  <div>
                    <p className="text-muted">Likes</p>
                    <p className="font-semibold text-ink">{review.likes ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-muted">Moderation</p>
                    <span
                      className={cn(
                        "mt-1 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
                        review.isApproved === false
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700"
                      )}
                    >
                      {review.isApproved === false ? "Hidden" : "Approved"}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {pagination.totalPages > 1 ? (
        <nav className="flex items-center justify-between border-t border-line pt-5">
          <p className="text-sm text-muted">
            Page {pagination.currentPage} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Link
              href={pageHref(searchParams, Math.max(1, pagination.currentPage - 1))}
              className="focus-ring inline-flex min-h-11 items-center rounded-md border border-line bg-white px-3 text-sm font-medium text-ink aria-disabled:pointer-events-none aria-disabled:opacity-50"
              aria-disabled={pagination.currentPage <= 1}
              tabIndex={pagination.currentPage <= 1 ? -1 : undefined}
            >
              Previous
            </Link>
            <Link
              href={pageHref(searchParams, Math.min(pagination.totalPages, pagination.currentPage + 1))}
              className="focus-ring inline-flex min-h-11 items-center rounded-md border border-line bg-white px-3 text-sm font-medium text-ink aria-disabled:pointer-events-none aria-disabled:opacity-50"
              aria-disabled={pagination.currentPage >= pagination.totalPages}
              tabIndex={pagination.currentPage >= pagination.totalPages ? -1 : undefined}
            >
              Next
            </Link>
          </div>
        </nav>
      ) : null}
    </div>
  );
}

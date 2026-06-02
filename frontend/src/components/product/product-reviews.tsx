"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, ShieldCheck, Star, ThumbsUp, Trash2 } from "lucide-react";
import { z } from "zod";
import {
  FieldError,
  FieldHelp,
  FormAlert,
  applyZodFieldErrors,
  getFieldDescribedBy,
  inputClassName,
  primaryButtonClassName
} from "@/components/auth/form-utils";
import {
  getButtonClassName,
  textareaClassName
} from "@/components/ui/style-primitives";
import {
  adminDeleteReview,
  createProductReview,
  deleteReview,
  getLocalReviewErrorMessage,
  likeReview,
  LocalReviewError,
  updateReview,
  type ReviewRatingFilter
} from "@/lib/api/local-reviews";
import { productReviewsQueryKey, productReviewsRootQueryKey, useProductReviews } from "@/lib/hooks/use-reviews";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { getReviewPagination } from "@/lib/reviews/review-utils";
import { reviewSchema } from "@/lib/validators/product";
import { cn, formatDate } from "@/lib/utils";
import { useConfirm } from "@/components/ui/confirm-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiResponse } from "@/types/api";
import type { Product, Review } from "@/types/models";

type ProductReviewsProps = {
  product: Product;
};

type ReviewFormValues = z.infer<typeof reviewSchema>;

const ratingFilters: ReviewRatingFilter[] = ["all", 5, 4, 3, 2, 1];
const stars = [1, 2, 3, 4, 5];

function reviewInitial(review: Review): string {
  return review.userName?.trim().charAt(0).toUpperCase() || "U";
}

function Stars({ rating, compact = false }: { rating: number; compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {stars.map((star) => (
        <Star
          key={star}
          className={cn(
            compact ? "h-3.5 w-3.5" : "h-4 w-4",
            star <= Math.round(rating) ? "fill-brand-500 text-brand-500" : "text-line"
          )}
        />
      ))}
    </span>
  );
}

function ReviewForm({
  initialReview,
  serverError,
  submitLabel,
  onCancel,
  onSubmit
}: {
  initialReview?: Review;
  serverError?: string | null;
  submitLabel: string;
  onCancel?: () => void;
  onSubmit: (payload: ReviewFormValues) => Promise<boolean>;
}) {
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ReviewFormValues>({
    defaultValues: {
      rating: initialReview?.rating ?? 5,
      title: initialReview?.title ?? "",
      comment: initialReview?.comment ?? ""
    }
  });
  const formId = useId();
  const selectedRating = Number(watch("rating") || 5);
  const ratingErrorId = `${formId}-rating-error`;
  const titleHelpId = `${formId}-title-help`;
  const titleErrorId = `${formId}-title-error`;
  const commentErrorId = `${formId}-comment-error`;

  useEffect(() => {
    reset({
      rating: initialReview?.rating ?? 5,
      title: initialReview?.title ?? "",
      comment: initialReview?.comment ?? ""
    });
  }, [initialReview, reset]);

  const submit = handleSubmit(async (values) => {
    const parsed = reviewSchema.safeParse({
      rating: Number(values.rating),
      title: values.title?.trim() || undefined,
      comment: values.comment?.trim(),
      images: values.images
    });

    if (!parsed.success) {
      applyZodFieldErrors(parsed.error, setError);
      return;
    }

    const didSave = await onSubmit(parsed.data);

    if (didSave && !initialReview) {
      reset({
        rating: 5,
        title: "",
        comment: ""
      });
    }
  });

  return (
    <form className="grid gap-4" onSubmit={submit}>
      {serverError ? <FormAlert>{serverError}</FormAlert> : null}

      <div className="grid gap-1">
        <span className="text-sm font-medium text-ink">Rating</span>
        <input type="hidden" {...register("rating", { valueAsNumber: true })} />
        <div
          className="flex flex-wrap gap-1"
          role="group"
          aria-describedby={getFieldDescribedBy(errors.rating && ratingErrorId)}
        >
          {stars.map((star) => (
            <button
              key={star}
              type="button"
              className="focus-ring rounded-md border border-transparent p-1 transition hover:border-line hover:bg-white"
              onClick={() => setValue("rating", star, { shouldDirty: true, shouldValidate: true })}
              aria-label={`Set ${star} star rating`}
              aria-pressed={star <= selectedRating}
            >
              <Star
                className={cn(
                  "h-5 w-5",
                  star <= selectedRating ? "fill-brand-500 text-brand-500" : "text-line"
                )}
              />
            </button>
          ))}
        </div>
        <FieldError id={ratingErrorId} message={errors.rating?.message} />
      </div>

      <label className="grid gap-1 text-sm font-medium text-ink">
        Title
        <input
          className={inputClassName}
          placeholder="Great fit and lens quality"
          aria-invalid={errors.title ? "true" : undefined}
          aria-describedby={getFieldDescribedBy(titleHelpId, errors.title && titleErrorId)}
          {...register("title")}
        />
        <FieldHelp id={titleHelpId}>Optional short summary for your review.</FieldHelp>
        <FieldError id={titleErrorId} message={errors.title?.message} />
      </label>

      <label className="grid gap-1 text-sm font-medium text-ink">
        Comment
        <textarea
          className={textareaClassName}
          placeholder="Share how the product worked for you."
          aria-invalid={errors.comment ? "true" : undefined}
          aria-describedby={getFieldDescribedBy(errors.comment && commentErrorId)}
          {...register("comment")}
        />
        <FieldError id={commentErrorId} message={errors.comment?.message} />
      </label>

      <div className="flex flex-wrap gap-2">
        <button type="submit" className={primaryButtonClassName} disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
        {onCancel ? (
          <button
            type="button"
            className={getButtonClassName("secondary")}
            onClick={onCancel}
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}

export function ProductReviews({ product }: ProductReviewsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { data: user, isLoading: isLoadingUser } = useCurrentUser();
  const [ratingFilter, setRatingFilter] = useState<ReviewRatingFilter>("all");
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const { data: response, error, isLoading, isFetching } = useProductReviews(
    product._id,
    page,
    ratingFilter
  );
  const reviews = response?.data ?? [];
  const pagination = getReviewPagination(response?.meta);

  useEffect(() => {
    if (response && page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }, [page, pagination.totalPages, response]);

  function redirectToLogin() {
    router.push(`/login?next=${encodeURIComponent(pathname)}`);
  }

  async function invalidateReviews() {
    await queryClient.invalidateQueries({
      queryKey: productReviewsRootQueryKey(product._id)
    });
  }

  function setCachedReview(nextReview: Review) {
    queryClient.setQueryData<ApiResponse<Review[]>>(
      productReviewsQueryKey(product._id, page, ratingFilter),
      (current) => {
        if (!current?.data) return current;

        return {
          ...current,
          data: current.data.map((review) => (review._id === nextReview._id ? nextReview : review))
        };
      }
    );
  }

  function removeCachedReview(reviewId: string) {
    queryClient.setQueryData<ApiResponse<Review[]>>(
      productReviewsQueryKey(product._id, page, ratingFilter),
      (current) => {
        if (!current?.data) return current;

        return {
          ...current,
          data: current.data.filter((review) => review._id !== reviewId)
        };
      }
    );
  }

  async function handleCreateReview(payload: ReviewFormValues) {
    setCreateError(null);
    setNotice(null);

    if (!user) {
      redirectToLogin();
      return false;
    }

    try {
      await createProductReview(product._id, {
        rating: payload.rating,
        title: payload.title?.trim() || undefined,
        comment: payload.comment.trim()
      });
      setNotice("Review submitted.");
      setRatingFilter("all");
      setPage(1);
      await invalidateReviews();
      router.refresh();
      return true;
    } catch (error) {
      if (error instanceof LocalReviewError && error.status === 401) {
        redirectToLogin();
        return false;
      }

      setCreateError(getLocalReviewErrorMessage(error));
      return false;
    }
  }

  async function handleUpdateReview(review: Review, payload: ReviewFormValues) {
    setRowErrors((current) => ({ ...current, [review._id]: "" }));
    setNotice(null);

    try {
      const nextReview = await updateReview(review._id, {
        rating: payload.rating,
        title: payload.title?.trim() || undefined,
        comment: payload.comment.trim()
      });
      setCachedReview(nextReview);
      setEditingId(null);
      setNotice("Review updated.");
      await invalidateReviews();
      router.refresh();
      return true;
    } catch (error) {
      if (error instanceof LocalReviewError && error.status === 401) {
        redirectToLogin();
        return false;
      }

      setRowErrors((current) => ({
        ...current,
        [review._id]: getLocalReviewErrorMessage(error)
      }));
      return false;
    }
  }

  async function handleLike(review: Review) {
    setRowErrors((current) => ({ ...current, [review._id]: "" }));

    if (!user) {
      redirectToLogin();
      return;
    }

    setPendingAction(`like-${review._id}`);

    try {
      const result = await likeReview(review._id);
      setCachedReview({
        ...review,
        likes: result.likes
      });
      setNotice(result.message);
    } catch (error) {
      if (error instanceof LocalReviewError && error.status === 401) {
        redirectToLogin();
        return;
      }

      setRowErrors((current) => ({
        ...current,
        [review._id]: getLocalReviewErrorMessage(error)
      }));
    } finally {
      setPendingAction(null);
    }
  }

  async function handleDelete(review: Review, isOwner: boolean) {
    setRowErrors((current) => ({ ...current, [review._id]: "" }));

    if (!user) {
      redirectToLogin();
      return;
    }

    const confirmed = await confirm({
      title: "Delete review?",
      description: "This review will be removed from the product page.",
      confirmLabel: "Delete",
      destructive: true
    });

    if (!confirmed) {
      return;
    }

    const action = user.isAdmin && !isOwner ? adminDeleteReview : deleteReview;
    setPendingAction(`delete-${review._id}`);

    try {
      await action(review._id);
      removeCachedReview(review._id);
      setNotice("Review deleted.");
      await invalidateReviews();
      router.refresh();
    } catch (error) {
      if (error instanceof LocalReviewError && error.status === 401) {
        redirectToLogin();
        return;
      }

      setRowErrors((current) => ({
        ...current,
        [review._id]: getLocalReviewErrorMessage(error)
      }));
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <section className="mt-12 rounded-lg border border-line bg-white p-5 shadow-subtle">
      <div className="flex flex-col gap-4 border-b border-line pb-5 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-ink">Customer reviews</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
            <Stars rating={product.rating?.avg ?? 0} />
            <span>{product.rating?.avg?.toFixed(1) ?? "0.0"}</span>
            <span>{product.rating?.count ?? 0} total reviews</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {ratingFilters.map((rating) => (
            <button
              key={rating}
              type="button"
              className={cn(
                "focus-ring h-10 rounded-md border px-3 text-sm font-medium transition",
                ratingFilter === rating
                  ? "border-ink bg-ink text-white"
                  : "border-line bg-white text-ink hover:bg-surface"
              )}
              onClick={() => {
                setRatingFilter(rating);
                setPage(1);
              }}
            >
              {rating === "all" ? "All" : `${rating} star`}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <aside className="self-start rounded-lg border border-line bg-surface p-4">
          <h3 className="text-lg font-semibold text-ink">Write a review</h3>
          <p className="mt-1 text-sm leading-6 text-muted">
            Share fit, lens feel, and daily-use notes for other shoppers.
          </p>
          {notice ? (
            <div className="mt-4">
              <FormAlert tone="success">{notice}</FormAlert>
            </div>
          ) : null}

          {isLoadingUser ? (
            <Skeleton className="mt-4 h-40" />
          ) : user ? (
            <div className="mt-4">
              <ReviewForm
                serverError={createError}
                submitLabel="Submit review"
                onSubmit={handleCreateReview}
              />
            </div>
          ) : (
            <div className="mt-4 rounded-md border border-line bg-white p-4">
              <p className="text-sm leading-6 text-muted">
                Sign in to review products you have received.
              </p>
              <button
                type="button"
                  className={cn(primaryButtonClassName, "mt-3")}
                onClick={redirectToLogin}
              >
                Sign in
              </button>
            </div>
          )}
        </aside>

        <div className="grid gap-4">
          {error ? <FormAlert>{getLocalReviewErrorMessage(error)}</FormAlert> : null}
          {isLoading ? (
            <div className="grid gap-3">
              <Skeleton className="h-36" />
              <Skeleton className="h-36" />
            </div>
          ) : reviews.length ? (
            reviews.map((review) => {
              const isOwner = Boolean(user && review.userId === user._id);
              const canDelete = isOwner || Boolean(user?.isAdmin);
              const isEditing = editingId === review._id;

              return (
                <article key={review._id} className="rounded-lg border border-line bg-white p-4 shadow-subtle">
                  <div className="flex gap-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-surface">
                      {review.userAvatar ? (
                        <Image
                          src={review.userAvatar}
                          alt={review.userName}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm font-semibold text-muted">
                          {reviewInitial(review)}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-ink">{review.userName}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                            <Stars rating={review.rating} compact />
                            {review.createdAt ? <span>{formatDate(review.createdAt)}</span> : null}
                            {review.isVerifiedPurchase ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-success-50 px-2 py-0.5 font-medium text-success-700">
                                <ShieldCheck className="h-3 w-3" />
                                Verified purchase
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            className={getButtonClassName("secondary", "h-8 px-2 text-xs disabled:opacity-60")}
                            onClick={() => handleLike(review)}
                            disabled={pendingAction === `like-${review._id}`}
                          >
                            <ThumbsUp className="h-3.5 w-3.5" />
                            {review.likes ?? 0}
                          </button>

                          {isOwner ? (
                            <button
                              type="button"
                              className={getButtonClassName("secondary", "h-8 px-2 text-xs")}
                              onClick={() => setEditingId(review._id)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </button>
                          ) : null}

                          {canDelete ? (
                            <button
                              type="button"
                              className={getButtonClassName("danger", "h-8 px-2 text-xs disabled:opacity-60")}
                              onClick={() => handleDelete(review, isOwner)}
                              disabled={pendingAction === `delete-${review._id}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              {user?.isAdmin && !isOwner ? "Admin delete" : "Delete"}
                            </button>
                          ) : null}
                        </div>
                      </div>

                      {rowErrors[review._id] ? (
                        <div className="mt-3">
                          <FormAlert>{rowErrors[review._id]}</FormAlert>
                        </div>
                      ) : null}

                      {isEditing ? (
                        <div className="mt-4 rounded-lg border border-line bg-surface p-4">
                          <ReviewForm
                            initialReview={review}
                            submitLabel="Save review"
                            onCancel={() => setEditingId(null)}
                            onSubmit={(payload) => handleUpdateReview(review, payload)}
                          />
                        </div>
                      ) : (
                        <div className="mt-3">
                          {review.title ? <h3 className="font-semibold text-ink">{review.title}</h3> : null}
                          <p className="mt-1 text-sm leading-6 text-muted">{review.comment}</p>

                          {review.images?.length ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {review.images.slice(0, 4).map((image) => (
                                <div
                                  key={image}
                                  className="relative h-20 w-20 overflow-hidden rounded-md border border-line bg-surface"
                                >
                                  <Image src={image} alt="" fill sizes="80px" className="object-cover" />
                                </div>
                              ))}
                            </div>
                          ) : null}

                          {review.replies?.length ? (
                            <div className="mt-3 grid gap-2">
                              {review.replies.map((reply) => (
                                <div key={reply._id ?? reply.comment} className="rounded-md bg-surface p-3">
                                  <p className="text-xs font-semibold text-ink">
                                    {reply.adminName ?? "Admin"}
                                  </p>
                                  <p className="mt-1 text-sm leading-6 text-muted">{reply.comment}</p>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <EmptyState
              title="No reviews match this filter"
              description="Try another rating filter or check back after more customers leave feedback."
              className="p-6"
            />
          )}

          {pagination.totalPages > 1 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <p className="text-sm text-muted">
                Page {pagination.currentPage} of {pagination.totalPages}
                {isFetching ? "..." : ""}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={getButtonClassName("secondary", "h-9 px-3 disabled:pointer-events-none disabled:opacity-50")}
                  disabled={pagination.currentPage <= 1}
                  aria-disabled={pagination.currentPage <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className={getButtonClassName("secondary", "h-9 px-3 disabled:pointer-events-none disabled:opacity-50")}
                  disabled={pagination.currentPage >= pagination.totalPages}
                  aria-disabled={pagination.currentPage >= pagination.totalPages}
                  onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

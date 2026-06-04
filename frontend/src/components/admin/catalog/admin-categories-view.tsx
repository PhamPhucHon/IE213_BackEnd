"use client";

import Image from "next/image";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { useEffect, useId, useState } from "react";
import type { Category } from "@/types/models";
import {
  createAdminCategory,
  deleteAdminCategory,
  getLocalAdminCatalogErrorMessage,
  updateAdminCategory,
  uploadAdminCatalogImage,
  type AdminCategoryPayload
} from "@/lib/api/local-admin-catalog";
import { adminCategoriesQueryKey, useAdminCategories } from "@/lib/hooks/use-admin-catalog";
import { cn, formatDate } from "@/lib/utils";
import { useConfirm } from "@/components/ui/confirm-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusAlert } from "@/components/ui/status-alert";
import {
  badgeClassName,
  fieldClassName,
  formLabelClassName,
  getButtonClassName,
  textareaClassName
} from "@/components/ui/style-primitives";
import { useToast } from "@/components/ui/toast-provider";

type CategoryFormState = {
  id?: string;
  name: string;
  description: string;
  image: string;
};

const emptyForm: CategoryFormState = {
  name: "",
  description: "",
  image: ""
};

function toPayload(form: CategoryFormState): AdminCategoryPayload {
  return {
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    image: form.image.trim() || undefined
  };
}

function CategoryImageField({
  image,
  isUploading = false,
  onUpload,
  onRemove
}: {
  image: string;
  isUploading?: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
}) {
  const inputId = useId();

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-ink">Category image</p>
        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/avif"
          className="sr-only"
          disabled={isUploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.currentTarget.value = "";
            if (file) onUpload(file);
          }}
        />
        <label
          htmlFor={inputId}
          className={cn(
            getButtonClassName("secondary", "h-9 cursor-pointer px-3"),
            isUploading && "pointer-events-none opacity-60"
          )}
          aria-disabled={isUploading}
        >
          <Upload className="h-4 w-4" />
          <span>{isUploading ? "Uploading..." : image ? "Replace image" : "Upload image"}</span>
        </label>
      </div>

      {image ? (
        <div className="group relative aspect-[4/3] overflow-hidden rounded-md bg-surface">
          <Image src={image} alt="Category preview" fill sizes="360px" className="object-cover" />
          <button
            type="button"
            aria-label="Remove category image"
            className={getButtonClassName("danger", "absolute right-2 top-2 h-11 w-11 px-0 shadow-soft")}
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="grid min-h-32 place-items-center rounded-md border border-dashed border-line bg-surface p-5 text-center text-sm text-muted">
          <div>
            <ImagePlus className="mx-auto h-6 w-6" />
            <p className="mt-2">No image yet</p>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryForm({
  form,
  isSaving,
  isUploadingImage,
  onChange,
  onCancel,
  onImageUpload,
  onSubmit
}: {
  form: CategoryFormState;
  isSaving: boolean;
  isUploadingImage: boolean;
  onChange: (form: CategoryFormState) => void;
  onCancel: () => void;
  onImageUpload: (file: File) => void;
  onSubmit: () => void;
}) {
  const isEditing = Boolean(form.id);

  return (
    <form
      className="rounded-lg border border-line bg-white p-5 shadow-subtle"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div>
        <h2 className="text-lg font-semibold text-ink">
          {isEditing ? "Edit category" : "Create category"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Categories power storefront navigation and product filters.
        </p>
      </div>

      <div className="mt-5 grid gap-4">
        <label className={formLabelClassName}>
          Name
          <input
            value={form.name}
            onChange={(event) => onChange({ ...form, name: event.target.value })}
            className={fieldClassName}
            required
          />
        </label>

        <label className={formLabelClassName}>
          Description
          <textarea
            value={form.description}
            onChange={(event) => onChange({ ...form, description: event.target.value })}
            className={textareaClassName}
          />
        </label>

        <CategoryImageField
          image={form.image}
          isUploading={isUploadingImage}
          onUpload={onImageUpload}
          onRemove={() => onChange({ ...form, image: "" })}
        />
      </div>

      <div className="mt-5 grid gap-2 min-[390px]:flex min-[390px]:flex-wrap">
        <button
          type="submit"
          className={getButtonClassName("primary", "w-full min-[390px]:w-auto")}
          disabled={isSaving || isUploadingImage}
          aria-busy={isSaving || isUploadingImage}
        >
          {isSaving ? "Saving..." : isEditing ? "Save category" : "Create category"}
        </button>
        {isEditing ? (
          <button
            type="button"
            className={getButtonClassName("secondary", "w-full min-[390px]:w-auto")}
            onClick={onCancel}
          >
            Cancel edit
          </button>
        ) : null}
      </div>
    </form>
  );
}

function CategoriesSkeleton() {
  return (
    <div className="grid gap-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-24" />
      ))}
    </div>
  );
}

export function AdminCategoriesView() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { showToast } = useToast();
  const { data: categories = [], isLoading, error } = useAdminCategories();
  const [form, setForm] = useState<CategoryFormState>(emptyForm);
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: (payload: CategoryFormState) => {
      const body = toPayload(payload);
      return payload.id ? updateAdminCategory(payload.id, body) : createAdminCategory(body);
    },
    onSuccess: (category) => {
      queryClient.invalidateQueries({ queryKey: adminCategoriesQueryKey });
      setForm(emptyForm);
      setActionError(null);
      setMessage(`Category ${category.name} saved.`);
      showToast({
        title: "Category saved",
        description: category.name,
        variant: "success"
      });
    },
    onError: (mutationError) => {
      const message = getLocalAdminCatalogErrorMessage(mutationError);
      setActionError(message);
      showToast({ title: "Could not save category", description: message, variant: "error" });
    }
  });

  const uploadMutation = useMutation({
    mutationFn: uploadAdminCatalogImage,
    onSuccess: ({ imageUrl }) => {
      setForm((current) => ({ ...current, image: imageUrl }));
      setActionError(null);
      setMessage("Image uploaded.");
      showToast({ title: "Image uploaded", variant: "success" });
    },
    onError: (mutationError) => {
      const message = getLocalAdminCatalogErrorMessage(mutationError);
      setActionError(message);
      showToast({ title: "Could not upload image", description: message, variant: "error" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminCategoriesQueryKey });
      setActionError(null);
      setMessage("Category deleted.");
      showToast({ title: "Category deleted", variant: "success" });
    },
    onError: (mutationError) => {
      const message = getLocalAdminCatalogErrorMessage(mutationError);
      setActionError(message);
      showToast({ title: "Could not delete category", description: message, variant: "error" });
    }
  });

  useEffect(() => {
    if (message || actionError) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [actionError, message]);

  function editCategory(category: Category) {
    setForm({
      id: category._id,
      name: category.name,
      description: category.description ?? "",
      image: category.image ?? ""
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <div className="xl:sticky xl:top-20 xl:self-start">
        <CategoryForm
          form={form}
          isSaving={saveMutation.isPending}
          isUploadingImage={uploadMutation.isPending}
          onChange={setForm}
          onCancel={() => setForm(emptyForm)}
          onImageUpload={(file) => uploadMutation.mutate(file)}
          onSubmit={() => {
            if (!form.name.trim()) {
              setActionError("Category name is required.");
              return;
            }
            saveMutation.mutate(form);
          }}
        />
      </div>

      <section className="grid gap-5">
        {message ? (
          <StatusAlert tone="success">
            {message}
          </StatusAlert>
        ) : null}
        {actionError ? (
          <StatusAlert tone="error">
            {actionError}
          </StatusAlert>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-ink">Categories</h2>
          <p className="text-sm text-muted">{categories.length} active categories</p>
        </div>

        {isLoading ? <CategoriesSkeleton /> : null}

        {error ? (
          <StatusAlert tone="error" className="p-5">
            {getLocalAdminCatalogErrorMessage(error)}
          </StatusAlert>
        ) : null}

        {!isLoading && !error && !categories.length ? (
          <EmptyState
            title="No categories yet"
            description="Create the first category to organize products."
          />
        ) : null}

        <div className="grid gap-4">
          {categories.map((category) => (
            <article key={category._id} className="rounded-lg border border-line bg-white p-4 shadow-subtle">
              <div className="grid gap-4 sm:grid-cols-[96px_1fr]">
                <div className="relative aspect-square overflow-hidden rounded-md bg-surface">
                  {category.image ? (
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="break-words text-lg font-semibold text-ink">{category.name}</h3>
                      <p className="mt-1 break-all text-sm text-muted">/{category.slug}</p>
                    </div>
                    <span className={badgeClassName}>
                      Order {category.order ?? 0}
                    </span>
                  </div>
                  {category.description ? (
                    <p className="mt-3 break-words text-sm leading-6 text-muted">{category.description}</p>
                  ) : null}
                  <p className="mt-3 text-xs text-muted">Updated {formatDate(category.updatedAt)}</p>
                  <div className="mt-4 grid gap-2 min-[390px]:flex min-[390px]:flex-wrap">
                    <button
                      type="button"
                      className={getButtonClassName("secondary", "w-full px-3 min-[390px]:w-auto")}
                      onClick={() => editCategory(category)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className={getButtonClassName("danger", "w-full px-3 min-[390px]:w-auto")}
                      disabled={deleteMutation.isPending}
                      onClick={async () => {
                        const confirmed = await confirm({
                          title: "Delete category?",
                          description: `${category.name} will be removed if no products still use it.`,
                          confirmLabel: "Delete",
                          destructive: true
                        });

                        if (confirmed) {
                          deleteMutation.mutate(category._id);
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

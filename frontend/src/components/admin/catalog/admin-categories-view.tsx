"use client";

import Image from "next/image";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { Category } from "@/types/models";
import {
  createAdminCategory,
  deleteAdminCategory,
  getLocalAdminCatalogErrorMessage,
  updateAdminCategory,
  type AdminCategoryPayload
} from "@/lib/api/local-admin-catalog";
import { adminCategoriesQueryKey, useAdminCategories } from "@/lib/hooks/use-admin-catalog";
import { formatDate } from "@/lib/utils";
import { useConfirm } from "@/components/ui/confirm-provider";
import { useToast } from "@/components/ui/toast-provider";

type CategoryFormState = {
  id?: string;
  name: string;
  description: string;
  image: string;
  order: string;
};

const emptyForm: CategoryFormState = {
  name: "",
  description: "",
  image: "",
  order: "0"
};

function toPayload(form: CategoryFormState): AdminCategoryPayload {
  return {
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    image: form.image.trim() || undefined,
    order: Number(form.order || 0)
  };
}

function CategoryForm({
  form,
  isSaving,
  onChange,
  onCancel,
  onSubmit
}: {
  form: CategoryFormState;
  isSaving: boolean;
  onChange: (form: CategoryFormState) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const isEditing = Boolean(form.id);

  return (
    <form
      className="rounded-lg border border-line bg-white p-5"
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
        <label className="grid gap-1 text-sm font-medium text-ink">
          Name
          <input
            value={form.name}
            onChange={(event) => onChange({ ...form, name: event.target.value })}
            className="focus-ring rounded-md border border-line px-3 py-2 text-sm"
            required
          />
        </label>

        <label className="grid gap-1 text-sm font-medium text-ink">
          Description
          <textarea
            value={form.description}
            onChange={(event) => onChange({ ...form, description: event.target.value })}
            className="focus-ring min-h-24 rounded-md border border-line px-3 py-2 text-sm"
          />
        </label>

        <label className="grid gap-1 text-sm font-medium text-ink">
          Image URL
          <input
            value={form.image}
            onChange={(event) => onChange({ ...form, image: event.target.value })}
            className="focus-ring rounded-md border border-line px-3 py-2 text-sm"
            placeholder="https://..."
            type="url"
          />
        </label>

        <label className="grid gap-1 text-sm font-medium text-ink">
          Display order
          <input
            value={form.order}
            onChange={(event) => onChange({ ...form, order: event.target.value })}
            className="focus-ring rounded-md border border-line px-3 py-2 text-sm"
            min={0}
            type="number"
          />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="submit"
          className="focus-ring rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : isEditing ? "Save category" : "Create category"}
        </button>
        {isEditing ? (
          <button
            type="button"
            className="focus-ring rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-surface"
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
        <div key={index} className="h-24 rounded-lg bg-surface" />
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
      image: category.image ?? "",
      order: String(category.order ?? 0)
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      <div className="lg:sticky lg:top-20 lg:self-start">
        <CategoryForm
          form={form}
          isSaving={saveMutation.isPending}
          onChange={setForm}
          onCancel={() => setForm(emptyForm)}
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
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {message}
          </p>
        ) : null}
        {actionError ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {actionError}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-ink">Categories</h2>
          <p className="text-sm text-muted">{categories.length} active categories</p>
        </div>

        {isLoading ? <CategoriesSkeleton /> : null}

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {getLocalAdminCatalogErrorMessage(error)}
          </div>
        ) : null}

        {!isLoading && !error && !categories.length ? (
          <div className="rounded-lg border border-line bg-white p-8 text-center">
            <h3 className="text-xl font-semibold text-ink">No categories yet</h3>
            <p className="mt-2 text-sm text-muted">Create the first category to organize products.</p>
          </div>
        ) : null}

        <div className="grid gap-4">
          {categories.map((category) => (
            <article key={category._id} className="rounded-lg border border-line bg-white p-4">
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
                    <div>
                      <h3 className="text-lg font-semibold text-ink">{category.name}</h3>
                      <p className="mt-1 text-sm text-muted">/{category.slug}</p>
                    </div>
                    <span className="rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-semibold text-muted">
                      Order {category.order ?? 0}
                    </span>
                  </div>
                  {category.description ? (
                    <p className="mt-3 text-sm leading-6 text-muted">{category.description}</p>
                  ) : null}
                  <p className="mt-3 text-xs text-muted">Updated {formatDate(category.updatedAt)}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="focus-ring rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-surface"
                      onClick={() => editCategory(category)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="focus-ring rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
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

"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type DragEvent } from "react";
import type { Product, ProductSpecifications } from "@/types/models";
import {
  createAdminProduct,
  getLocalAdminCatalogErrorMessage,
  updateAdminProduct,
  uploadAdminProductImage,
  type AdminProductPayload
} from "@/lib/api/local-admin-catalog";
import {
  adminProductQueryKey,
  adminProductsQueryKey,
  useAdminCategories,
  useAdminProduct
} from "@/lib/hooks/use-admin-catalog";
import { getProductCategoryId } from "@/lib/admin/catalog-utils";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusAlert } from "@/components/ui/status-alert";
import {
  checkboxClassName,
  fieldClassName,
  formLabelClassName,
  getButtonClassName,
  selectClassName,
  textareaClassName
} from "@/components/ui/style-primitives";
import { useToast } from "@/components/ui/toast-provider";

type VariantForm = {
  sku: string;
  color: string;
  price: string;
  originalPrice: string;
  images: string;
  isDefault: boolean;
};

type ProductFormState = {
  name: string;
  description: string;
  brand: string;
  categoryId: string;
  type: NonNullable<Product["type"]>;
  sale: boolean;
  availability: NonNullable<Product["availability"]>;
  isActive: boolean;
  images: string;
  specifications: {
    material: string;
    lensMaterial: string;
    origin: string;
    gender: NonNullable<NonNullable<ProductSpecifications["gender"]>>;
    dimensions: string;
    width: string;
    angle: string;
    bridge: string;
    totalWidth: string;
    longestDiameter: string;
  };
  variants: VariantForm[];
};

type ImageUploadTarget = { type: "product" } | { type: "variant"; index: number };
type ImageUploadProgress = {
  target: ImageUploadTarget;
  current: number;
  total: number;
};

const MAX_UPLOAD_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif"
]);
const ACCEPTED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".avif"];

const emptyVariant: VariantForm = {
  sku: "",
  color: "",
  price: "",
  originalPrice: "",
  images: "",
  isDefault: false
};

const emptyForm: ProductFormState = {
  name: "",
  description: "",
  brand: "",
  categoryId: "",
  type: "Sunglasses",
  sale: false,
  availability: "in_stock",
  isActive: true,
  images: "",
  specifications: {
    material: "",
    lensMaterial: "",
    origin: "",
    gender: "Unisex",
    dimensions: "",
    width: "",
    angle: "",
    bridge: "",
    totalWidth: "",
    longestDiameter: ""
  },
  variants: [{ ...emptyVariant, isDefault: true }]
};

function joinLines(values?: string[]) {
  return (values ?? []).filter(Boolean).join("\n");
}

function splitLines(value: string) {
  return Array.from(
    new Set(
      value
        .split(/\r?\n|,/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

function isSameUploadTarget(left?: ImageUploadTarget | null, right?: ImageUploadTarget | null) {
  if (!left || !right || left.type !== right.type) return false;
  if (left.type === "product") return true;
  return right.type === "variant" && left.index === right.index;
}

function acceptsImageFile(file: File) {
  const lowerName = file.name.toLowerCase();
  return (
    ACCEPTED_IMAGE_TYPES.has(file.type) ||
    ACCEPTED_IMAGE_EXTENSIONS.some((extension) => lowerName.endsWith(extension))
  );
}

function validateImageFiles(files: File[]) {
  const accepted: File[] = [];
  const rejected: string[] = [];

  files.forEach((file) => {
    if (!acceptsImageFile(file)) {
      rejected.push(`${file.name}: only JPG, PNG, WEBP, or AVIF images are allowed.`);
      return;
    }

    if (file.size > MAX_UPLOAD_IMAGE_SIZE_BYTES) {
      rejected.push(`${file.name}: image must be 5MB or smaller.`);
      return;
    }

    accepted.push(file);
  });

  return { accepted, rejected };
}

function summarizeUploadMessages(messages: string[]) {
  if (messages.length <= 2) return messages.join(" ");
  return `${messages.slice(0, 2).join(" ")} ${messages.length - 2} more not processed.`;
}

function pluralizeImages(count: number) {
  return `${count} image${count === 1 ? "" : "s"}`;
}

function optionalNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isValidNumberString(value: string, { required = false } = {}) {
  const trimmed = value.trim();
  if (!trimmed) return !required;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed >= 0;
}

function productToForm(product: Product): ProductFormState {
  const size = product.specifications?.size ?? {};

  return {
    name: product.name,
    description: product.description,
    brand: product.brand,
    categoryId: getProductCategoryId(product.categoryId),
    type: product.type ?? "Sunglasses",
    sale: product.sale ?? false,
    availability: product.availability ?? "in_stock",
    isActive: product.isActive !== false,
    images: joinLines(product.images),
    specifications: {
      material: product.specifications?.material ?? "",
      lensMaterial: product.specifications?.lensMaterial ?? "",
      origin: product.specifications?.origin ?? "",
      gender: product.specifications?.gender ?? "Unisex",
      dimensions: size.dimensions ?? "",
      width: size.width === undefined ? "" : String(size.width),
      angle: size.angle === undefined ? "" : String(size.angle),
      bridge: size.bridge === undefined ? "" : String(size.bridge),
      totalWidth: size.totalWidth === undefined ? "" : String(size.totalWidth),
      longestDiameter: size.longestDiameter === undefined ? "" : String(size.longestDiameter)
    },
    variants:
      product.variants.length > 0
        ? product.variants.map((variant, index) => ({
            sku: variant.sku,
            color: variant.color ?? "",
            price: String(variant.price ?? ""),
            originalPrice: variant.originalPrice === undefined ? "" : String(variant.originalPrice),
            images: joinLines(variant.images),
            isDefault: variant.isDefault ?? index === 0
          }))
        : [{ ...emptyVariant, isDefault: true }]
  };
}

function formToPayload(form: ProductFormState): AdminProductPayload {
  const firstDefaultIndex = form.variants.findIndex((variant) => variant.isDefault);
  const defaultIndex = firstDefaultIndex >= 0 ? firstDefaultIndex : 0;
  const specs = form.specifications;

  return {
    name: form.name.trim(),
    description: form.description.trim(),
    brand: form.brand.trim(),
    categoryId: form.categoryId,
    type: form.type,
    sale: form.sale,
    availability: form.availability,
    isActive: form.isActive,
    images: splitLines(form.images),
    specifications: {
      material: specs.material.trim() || undefined,
      lensMaterial: specs.lensMaterial.trim() || undefined,
      origin: specs.origin.trim() || undefined,
      gender: specs.gender,
      size: {
        dimensions: specs.dimensions.trim() || undefined,
        width: optionalNumber(specs.width),
        angle: optionalNumber(specs.angle),
        bridge: optionalNumber(specs.bridge),
        totalWidth: optionalNumber(specs.totalWidth),
        longestDiameter: optionalNumber(specs.longestDiameter)
      }
    },
    variants: form.variants.map((variant, index) => ({
      sku: variant.sku.trim(),
      color: variant.color.trim() || undefined,
      price: Number(variant.price),
      originalPrice: optionalNumber(variant.originalPrice),
      images: splitLines(variant.images),
      isDefault: index === defaultIndex
    }))
  };
}

function validateProductForm(form: ProductFormState) {
  if (!form.name.trim()) return "Product name is required.";
  if (!form.brand.trim()) return "Brand is required.";
  if (!form.categoryId) return "Category is required.";
  if (!form.description.trim()) return "Description is required.";
  if (!form.variants.length) return "Add at least one variant.";

  const skus = form.variants.map((variant) => variant.sku.trim()).filter(Boolean);
  if (skus.length !== form.variants.length) return "Every variant needs a SKU.";

  const duplicateSku = skus.find((sku, index) => {
    const normalized = sku.toLowerCase();
    return skus.findIndex((item) => item.toLowerCase() === normalized) !== index;
  });
  if (duplicateSku) return `SKU ${duplicateSku} is duplicated.`;

  const invalidPrice = form.variants.find(
    (variant) => !isValidNumberString(variant.price, { required: true })
  );
  if (invalidPrice) return "Every variant needs a non-negative price.";

  const invalidOriginalPrice = form.variants.find(
    (variant) => !isValidNumberString(variant.originalPrice)
  );
  if (invalidOriginalPrice) return "Original price must be a non-negative number.";

  const invalidSpecNumber = [
    form.specifications.width,
    form.specifications.angle,
    form.specifications.bridge,
    form.specifications.totalWidth,
    form.specifications.longestDiameter
  ].some((value) => !isValidNumberString(value));
  if (invalidSpecNumber) return "Specification numbers must be non-negative.";

  return null;
}

function FormField({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className={formLabelClassName}>
      {label}
      {children}
    </label>
  );
}

function ImageGalleryField({
  label,
  images,
  isDisabled = false,
  isUploading = false,
  progressLabel,
  onUpload,
  onRemove
}: {
  label: string;
  images: string[];
  isDisabled?: boolean;
  isUploading?: boolean;
  progressLabel?: string;
  onUpload: (files: File[]) => void;
  onRemove: (image: string) => void;
}) {
  const inputId = useId();
  const [isDragActive, setIsDragActive] = useState(false);
  const uploadLabel = isUploading ? progressLabel ?? "Uploading..." : images.length ? "Add images" : "Upload images";

  function handleFiles(files: FileList | File[]) {
    const nextFiles = Array.from(files);
    if (nextFiles.length) onUpload(nextFiles);
  }

  function handleDragEnter(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (isDisabled) {
      event.dataTransfer.dropEffect = "none";
      return;
    }

    event.dataTransfer.dropEffect = "copy";
    setIsDragActive(true);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = isDisabled ? "none" : "copy";
    if (!isDisabled) setIsDragActive(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    const nextTarget = event.relatedTarget;
    if (!nextTarget || !(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
      setIsDragActive(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragActive(false);
    if (isDisabled) return;
    handleFiles(event.dataTransfer.files);
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-ink">{label}</p>
        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/avif"
          className="sr-only"
          disabled={isDisabled}
          multiple
          onChange={(event) => {
            const files = event.target.files;
            event.currentTarget.value = "";
            if (files) handleFiles(files);
          }}
        />
        <label
          htmlFor={inputId}
          className={cn(
            getButtonClassName("secondary", "h-9 cursor-pointer px-3"),
            isDisabled && "pointer-events-none opacity-60"
          )}
          aria-disabled={isDisabled}
        >
          <Upload className="h-4 w-4" />
          <span>{uploadLabel}</span>
        </label>
      </div>

      <div
        className={cn(
          "rounded-md border border-dashed border-line bg-surface p-3 transition duration-200 ease-ui",
          isDragActive && "border-brand-200 bg-brand-50 shadow-soft",
          isDisabled && "cursor-not-allowed opacity-70"
        )}
        aria-label={`${label} drop zone`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragActive ? (
          <div className="grid min-h-32 place-items-center text-center text-sm font-semibold text-brand-700">
            Drop images here
          </div>
        ) : images.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {images.map((image, index) => (
              <div key={`${image}-${index}`} className="group relative aspect-square overflow-hidden rounded-md bg-white">
                <Image src={image} alt={`${label} ${index + 1}`} fill sizes="180px" className="object-cover" />
                <button
                  type="button"
                  aria-label="Remove image"
                  className={cn(
                    getButtonClassName("danger", "absolute right-2 top-2 h-11 w-11 px-0 shadow-soft"),
                    isDisabled && "pointer-events-none opacity-60"
                  )}
                  disabled={isDisabled}
                  onClick={() => onRemove(image)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid min-h-32 place-items-center p-5 text-center text-sm text-muted">
            <div>
              <ImagePlus className="mx-auto h-6 w-6" />
              <p className="mt-2">No images yet</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductFormSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Skeleton className="h-[720px]" />
      <Skeleton className="h-72" />
    </div>
  );
}

export function AdminProductFormView({ id }: { id?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const isEditing = Boolean(id);
  const productQuery = useAdminProduct(id ?? "", Boolean(id));
  const categoriesQuery = useAdminCategories();
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<ImageUploadProgress | null>(null);
  const hydratedProductId = useRef<string | null>(null);

  useEffect(() => {
    if (productQuery.data && hydratedProductId.current !== productQuery.data._id) {
      setForm(productToForm(productQuery.data));
      hydratedProductId.current = productQuery.data._id;
    }
  }, [productQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (payload: AdminProductPayload) =>
      id ? updateAdminProduct(id, payload) : createAdminProduct(payload),
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: adminProductsQueryKey });
      queryClient.setQueryData(adminProductQueryKey(product._id), product);
      setActionError(null);

      if (!id) {
        showToast({
          title: "Product created",
          description: `${product.name} is ready for inventory setup.`,
          variant: "success"
        });
        router.push(`/admin/products/${product._id}/edit`);
        return;
      }

      setMessage(`${product.name} saved.`);
      showToast({ title: "Product saved", description: product.name, variant: "success" });
    },
    onError: (mutationError) => {
      const message = getLocalAdminCatalogErrorMessage(mutationError);
      setActionError(message);
      showToast({ title: "Could not save product", description: message, variant: "error" });
    }
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file }: { file: File; target: ImageUploadTarget }) => uploadAdminProductImage(file)
  });

  const previewImages = useMemo(() => splitLines(form.images).slice(0, 4), [form.images]);
  const activeUploadTarget = uploadProgress?.target ?? uploadMutation.variables?.target;
  const isUploadingAny = Boolean(uploadProgress) || uploadMutation.isPending;
  const isUploadingTarget = (target: ImageUploadTarget) =>
    isUploadingAny && isSameUploadTarget(activeUploadTarget, target);
  const uploadProgressLabel = (target: ImageUploadTarget) =>
    uploadProgress && isSameUploadTarget(uploadProgress.target, target)
      ? `Uploading ${uploadProgress.current}/${uploadProgress.total}...`
      : undefined;

  if (productQuery.isLoading || categoriesQuery.isLoading) {
    return <ProductFormSkeleton />;
  }

  if (productQuery.error) {
    return (
      <StatusAlert tone="error" className="p-5">
        {getLocalAdminCatalogErrorMessage(productQuery.error)}
      </StatusAlert>
    );
  }

  if (categoriesQuery.error) {
    return (
      <StatusAlert tone="error" className="p-5">
        {getLocalAdminCatalogErrorMessage(categoriesQuery.error)}
      </StatusAlert>
    );
  }

  function updateVariant(index: number, nextVariant: VariantForm) {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) =>
        variantIndex === index ? nextVariant : variant
      )
    }));
  }

  function setDefaultVariant(index: number) {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) => ({
        ...variant,
        isDefault: variantIndex === index
      }))
    }));
  }

  function appendImageToTarget(target: ImageUploadTarget, imageUrl: string) {
    setForm((current) => {
      if (target.type === "product") {
        return {
          ...current,
          images: [...splitLines(current.images), imageUrl].join("\n")
        };
      }

      return {
        ...current,
        variants: current.variants.map((variant, variantIndex) =>
          variantIndex === target.index
            ? { ...variant, images: [...splitLines(variant.images), imageUrl].join("\n") }
            : variant
        )
      };
    });
  }

  async function uploadImages(files: File[], target: ImageUploadTarget) {
    if (isUploadingAny) {
      showToast({
        title: "Upload already running",
        description: "Please wait for the current image upload to finish.",
        variant: "info"
      });
      return;
    }

    const { accepted, rejected } = validateImageFiles(files);
    const skippedMessage = rejected.length ? summarizeUploadMessages(rejected) : null;

    if (skippedMessage) {
      setActionError(skippedMessage);
      showToast({
        title: accepted.length ? "Some images skipped" : "Images skipped",
        description: skippedMessage,
        variant: accepted.length ? "info" : "error"
      });
    }

    if (!accepted.length) return;

    let uploadedCount = 0;
    const failures: string[] = [];

    setMessage(null);
    setUploadProgress({ target, current: 0, total: accepted.length });

    try {
      for (const [index, file] of accepted.entries()) {
        setUploadProgress({ target, current: index + 1, total: accepted.length });

        try {
          const { imageUrl } = await uploadMutation.mutateAsync({ file, target });
          appendImageToTarget(target, imageUrl);
          uploadedCount += 1;
        } catch (uploadError) {
          failures.push(`${file.name}: ${getLocalAdminCatalogErrorMessage(uploadError)}`);
        }
      }
    } finally {
      setUploadProgress(null);
    }

    if (failures.length) {
      const failedMessage = summarizeUploadMessages(failures);
      const description = uploadedCount
        ? `${pluralizeImages(uploadedCount)} uploaded. ${failedMessage}`
        : failedMessage;

      setActionError(description);
      showToast({
        title: uploadedCount ? "Some images uploaded" : "Could not upload images",
        description,
        variant: uploadedCount ? "info" : "error"
      });
      return;
    }

    const uploadedMessage = `${pluralizeImages(uploadedCount)} uploaded.`;
    setActionError(skippedMessage);
    setMessage(uploadedMessage);
    showToast({ title: "Images uploaded", description: uploadedMessage, variant: "success" });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <form
        className="grid gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          const validationError = validateProductForm(form);
          if (validationError) {
            setActionError(validationError);
            showToast({ title: "Check product form", description: validationError, variant: "error" });
            return;
          }

          saveMutation.mutate(formToPayload(form));
        }}
      >
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

        <section className="rounded-lg border border-line bg-white p-5 shadow-subtle">
          <h2 className="text-lg font-semibold text-ink">Product details</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <FormField label="Name">
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className={fieldClassName}
                required
              />
            </FormField>
            <FormField label="Brand">
              <input
                value={form.brand}
                onChange={(event) => setForm({ ...form, brand: event.target.value })}
                className={fieldClassName}
                required
              />
            </FormField>
            <FormField label="Category">
              <select
                value={form.categoryId}
                onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
                className={selectClassName}
                required
              >
                <option value="">Select category</option>
                {(categoriesQuery.data ?? []).map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Type">
              <select
                value={form.type}
                onChange={(event) =>
                  setForm({ ...form, type: event.target.value as ProductFormState["type"] })
                }
                className={selectClassName}
              >
                <option value="Sunglasses">Sunglasses</option>
                <option value="Eyeglasses">Eyeglasses</option>
                <option value="All">All</option>
              </select>
            </FormField>
            <FormField label="Availability">
              <select
                value={form.availability}
                onChange={(event) =>
                  setForm({
                    ...form,
                    availability: event.target.value as ProductFormState["availability"]
                  })
                }
                className={selectClassName}
              >
                <option value="in_stock">In stock</option>
                <option value="out_of_stock">Out of stock</option>
                <option value="pre_order">Pre-order</option>
              </select>
            </FormField>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm font-medium text-ink">
                <input
                  type="checkbox"
                  className={checkboxClassName}
                  checked={form.sale}
                  onChange={(event) => setForm({ ...form, sale: event.target.checked })}
                />
                On sale
              </label>
              <label className="flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm font-medium text-ink">
                <input
                  type="checkbox"
                  className={checkboxClassName}
                  checked={form.isActive}
                  onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
                />
                Active
              </label>
            </div>
            <label className={`${formLabelClassName} md:col-span-2`}>
              Description
              <textarea
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                className={textareaClassName}
                required
              />
            </label>
          </div>
        </section>

        <section className="rounded-lg border border-line bg-white p-5 shadow-subtle">
          <h2 className="text-lg font-semibold text-ink">Images</h2>
          <div className="mt-5">
            <ImageGalleryField
              label="Product images"
              images={splitLines(form.images)}
              isDisabled={isUploadingAny}
              isUploading={isUploadingTarget({ type: "product" })}
              progressLabel={uploadProgressLabel({ type: "product" })}
              onUpload={(files) => uploadImages(files, { type: "product" })}
              onRemove={(image) =>
                setForm((current) => ({
                  ...current,
                  images: splitLines(current.images).filter((item) => item !== image).join("\n")
                }))
              }
            />
          </div>
        </section>

        <section className="rounded-lg border border-line bg-white p-5 shadow-subtle">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-ink">Variants</h2>
              <p className="mt-2 text-sm text-muted">Each variant creates or syncs one inventory SKU.</p>
            </div>
            <button
              type="button"
              className={getButtonClassName("secondary", "w-full px-3 min-[390px]:w-auto")}
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  variants: [...current.variants, { ...emptyVariant }]
                }))
              }
            >
              Add variant
            </button>
          </div>

          <div className="mt-5 grid gap-4">
            {form.variants.map((variant, index) => (
              <article key={index} className="rounded-lg border border-line bg-surface p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-semibold text-ink">Variant {index + 1}</h3>
                  <div className="grid gap-2 min-[390px]:flex min-[390px]:flex-wrap">
                    <button
                      type="button"
                      className={getButtonClassName(variant.isDefault ? "primary" : "secondary", "w-full px-3 min-[390px]:w-auto")}
                      onClick={() => setDefaultVariant(index)}
                    >
                      {variant.isDefault ? "Default" : "Set default"}
                    </button>
                    <button
                      type="button"
                      className={getButtonClassName("danger", "w-full px-3 min-[390px]:w-auto")}
                      disabled={form.variants.length <= 1}
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          variants: current.variants.filter((_, variantIndex) => variantIndex !== index)
                        }))
                      }
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <FormField label="SKU">
                    <input
                      value={variant.sku}
                      onChange={(event) =>
                        updateVariant(index, { ...variant, sku: event.target.value })
                      }
                      className={fieldClassName}
                      required
                    />
                  </FormField>
                  <FormField label="Color">
                    <input
                      value={variant.color}
                      onChange={(event) =>
                        updateVariant(index, { ...variant, color: event.target.value })
                      }
                      className={fieldClassName}
                    />
                  </FormField>
                  <FormField label="Price">
                    <input
                      value={variant.price}
                      onChange={(event) =>
                        updateVariant(index, { ...variant, price: event.target.value })
                      }
                      className={fieldClassName}
                      min={0}
                      required
                      type="number"
                    />
                  </FormField>
                  <FormField label="Original price">
                    <input
                      value={variant.originalPrice}
                      onChange={(event) =>
                        updateVariant(index, { ...variant, originalPrice: event.target.value })
                      }
                      className={fieldClassName}
                      min={0}
                      type="number"
                    />
                  </FormField>
                  <div className="md:col-span-2">
                    <ImageGalleryField
                      label="Variant images"
                      images={splitLines(variant.images)}
                      isDisabled={isUploadingAny}
                      isUploading={isUploadingTarget({ type: "variant", index })}
                      progressLabel={uploadProgressLabel({ type: "variant", index })}
                      onUpload={(files) => uploadImages(files, { type: "variant", index })}
                      onRemove={(image) =>
                        updateVariant(index, {
                          ...variant,
                          images: splitLines(variant.images).filter((item) => item !== image).join("\n")
                        })
                      }
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-line bg-white p-5 shadow-subtle">
          <h2 className="text-lg font-semibold text-ink">Specifications</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <FormField label="Material">
              <input
                value={form.specifications.material}
                onChange={(event) =>
                  setForm({
                    ...form,
                    specifications: { ...form.specifications, material: event.target.value }
                  })
                }
                className={fieldClassName}
              />
            </FormField>
            <FormField label="Lens material">
              <input
                value={form.specifications.lensMaterial}
                onChange={(event) =>
                  setForm({
                    ...form,
                    specifications: { ...form.specifications, lensMaterial: event.target.value }
                  })
                }
                className={fieldClassName}
              />
            </FormField>
            <FormField label="Origin">
              <input
                value={form.specifications.origin}
                onChange={(event) =>
                  setForm({
                    ...form,
                    specifications: { ...form.specifications, origin: event.target.value }
                  })
                }
                className={fieldClassName}
              />
            </FormField>
            <FormField label="Gender">
              <select
                value={form.specifications.gender}
                onChange={(event) =>
                  setForm({
                    ...form,
                    specifications: {
                      ...form.specifications,
                      gender: event.target.value as ProductFormState["specifications"]["gender"]
                    }
                  })
                }
                className={selectClassName}
              >
                <option value="Unisex">Unisex</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </FormField>
            {[
              ["Dimensions", "dimensions"],
              ["Width", "width"],
              ["Angle", "angle"],
              ["Bridge", "bridge"],
              ["Total width", "totalWidth"],
              ["Longest diameter", "longestDiameter"]
            ].map(([label, key]) => (
              <FormField key={key} label={label}>
                <input
                  value={form.specifications[key as keyof ProductFormState["specifications"]]}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      specifications: {
                        ...form.specifications,
                        [key]: event.target.value
                      }
                    })
                  }
                  className={fieldClassName}
                  type={key === "dimensions" ? "text" : "number"}
                />
              </FormField>
            ))}
          </div>
        </section>

        <div className="grid gap-2 min-[390px]:flex min-[390px]:flex-wrap">
          <button
            type="submit"
            className={getButtonClassName("primary", "w-full min-[390px]:w-auto")}
            disabled={saveMutation.isPending || isUploadingAny}
            aria-busy={saveMutation.isPending || isUploadingAny}
          >
            {saveMutation.isPending
              ? "Saving..."
              : isUploadingAny
                ? "Uploading images..."
                : isEditing
                  ? "Save product"
                  : "Create product"}
          </button>
          <button
            type="button"
            className={getButtonClassName("secondary", "w-full min-[390px]:w-auto")}
            onClick={() => router.push("/admin/products")}
          >
            Back to products
          </button>
        </div>
      </form>

      <aside className="grid gap-6 self-start xl:sticky xl:top-20">
        <section className="rounded-lg border border-line bg-white p-5 shadow-subtle">
          <h2 className="text-lg font-semibold text-ink">Preview</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {previewImages.length ? (
              previewImages.map((image) => (
                <div key={image} className="relative aspect-square overflow-hidden rounded-md bg-surface">
                  <Image src={image} alt={form.name || "Product image"} fill sizes="140px" className="object-cover" />
                </div>
              ))
            ) : (
              <div className="col-span-2 rounded-md bg-surface p-6 text-center text-sm text-muted">
                No images yet
              </div>
            )}
          </div>
          <div className="mt-5 grid gap-2 text-sm">
            <p className="break-words font-semibold text-ink">{form.name || "Untitled product"}</p>
            <p className="break-words text-muted">{form.brand || "No brand"}</p>
            <p className="text-muted">{form.variants.length} variants</p>
          </div>
        </section>

        {isEditing && productQuery.data ? (
          <section className="rounded-lg border border-line bg-white p-5 shadow-subtle">
            <h2 className="text-lg font-semibold text-ink">System data</h2>
            <div className="mt-4 grid gap-2 text-sm">
              <p className="break-all text-muted">ID: {productQuery.data._id}</p>
              <p className="break-all text-muted">Slug: /{productQuery.data.slug}</p>
              <p className="text-muted">
                Rating: {productQuery.data.rating?.avg ?? 0} ({productQuery.data.rating?.count ?? 0})
              </p>
            </div>
          </section>
        ) : null}
      </aside>
    </div>
  );
}

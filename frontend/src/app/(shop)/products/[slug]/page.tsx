import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogError } from "@/components/catalog/catalog-error";
import { ProductDetailView } from "@/components/product/product-detail-view";
import { ApiError } from "@/lib/api/http";
import { productsApi } from "@/lib/api/products";
import type { Product } from "@/types/models";
import {
  getCategoryId,
  getCatalogErrorMessage,
  getProductImage,
  getProductPrice
} from "@/lib/catalog/product-utils";

export const revalidate = 60;

type ProductDetailPageProps = {
  params: Promise<{ slug: string }>;
};

async function loadRelatedProducts(product: Product) {
  const categoryId = getCategoryId(product.categoryId);
  const requests = [
    categoryId
      ? productsApi.list({ categoryId, page: 1, limit: 8, sort: "topRated" })
      : Promise.resolve({ data: [] }),
    product.type && product.type !== "All"
      ? productsApi.list({ type: product.type, page: 1, limit: 8, sort: "topRated" })
      : Promise.resolve({ data: [] }),
    productsApi.list({ page: 1, limit: 8, sort: "newest" })
  ];
  const results = await Promise.allSettled(requests);
  const related = new Map<string, Product>();

  results.forEach((result) => {
    if (result.status !== "fulfilled") return;

    (result.value.data ?? []).forEach((candidate) => {
      if (candidate._id === product._id || candidate.slug === product.slug) return;
      related.set(candidate._id, candidate);
    });
  });

  return Array.from(related.values()).slice(0, 4);
}

export async function generateMetadata({
  params
}: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const product = await productsApi.getBySlug(slug);
    const image = getProductImage(product);
    const price = getProductPrice(product);
    const description =
      product.description ||
      `${product.brand} ${product.name} from IE213 Eyewear. Price starts at ${price}.`;

    return {
      title: product.name,
      description,
      alternates: {
        canonical: `/products/${product.slug}`
      },
      openGraph: {
        title: `${product.name} | IE213 Eyewear`,
        description,
        images: image ? [{ url: image, alt: product.name }] : undefined
      }
    };
  } catch {
    return {
      title: "Product",
      description: "View IE213 eyewear product details."
    };
  }
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;

  try {
    const product = await productsApi.getBySlug(slug);
    const relatedProducts = await loadRelatedProducts(product).catch(() => []);
    return <ProductDetailView product={product} relatedProducts={relatedProducts} />;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    return (
      <main className="container-page py-8 sm:py-10">
        <CatalogError message={getCatalogErrorMessage(error)} />
      </main>
    );
  }
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogError } from "@/components/catalog/catalog-error";
import { ProductDetailView } from "@/components/product/product-detail-view";
import { ApiError } from "@/lib/api/http";
import { productsApi } from "@/lib/api/products";
import {
  getCatalogErrorMessage,
  getProductImage,
  getProductPrice
} from "@/lib/catalog/product-utils";

export const revalidate = 60;

type ProductDetailPageProps = {
  params: Promise<{ slug: string }>;
};

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
    return <ProductDetailView product={product} />;
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

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { categoriesApi } from "@/lib/api/categories";
import { getActiveCategories } from "@/lib/catalog/product-utils";

export const revalidate = 60;

async function loadHeaderCategories() {
  return categoriesApi
    .list()
    .then((categories) => getActiveCategories(categories).slice(0, 4))
    .catch(() => []);
}

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const categories = await loadHeaderCategories();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader categories={categories} />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { categoriesApi } from "@/lib/api/categories";
import { fallbackHeaderCategories } from "@/lib/catalog/header-categories";
import { getActiveCategories } from "@/lib/catalog/product-utils";

export const revalidate = 60;

async function loadHeaderCategories() {
  return categoriesApi
    .list()
    .then((categories) => {
      const activeCategories = getActiveCategories(categories);
      return activeCategories.length ? activeCategories : fallbackHeaderCategories;
    })
    .catch(() => fallbackHeaderCategories);
}

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const categories = await loadHeaderCategories();

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <SiteHeader categories={categories} />
      <div id="main-content" className="flex-1" tabIndex={-1}>
        {children}
      </div>
      <SiteFooter />
    </div>
  );
}

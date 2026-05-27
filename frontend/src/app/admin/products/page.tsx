import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { AdminProductsView } from "@/components/admin/catalog/admin-products-view";

export default function AdminProductsPage() {
  return (
    <main className="container-page py-8 sm:py-10">
      <PageHeader
        eyebrow="Admin"
        title="Products"
        description="Manage product catalog, variants, images, category, brand, availability, and soft-hide actions."
      />
      <div className="mt-8">
        <Suspense fallback={<div className="h-72 rounded-lg bg-surface" />}>
          <AdminProductsView />
        </Suspense>
      </div>
    </main>
  );
}

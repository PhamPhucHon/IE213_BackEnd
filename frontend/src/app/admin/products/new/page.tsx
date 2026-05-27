import { PageHeader } from "@/components/layout/page-header";
import { AdminProductFormView } from "@/components/admin/catalog/admin-product-form-view";

export default function AdminNewProductPage() {
  return (
    <main className="container-page py-8 sm:py-10">
      <PageHeader
        eyebrow="Admin"
        title="Create product"
        description="Build a product with images, specifications, and at least one unique SKU variant."
      />
      <div className="mt-8">
        <AdminProductFormView />
      </div>
    </main>
  );
}

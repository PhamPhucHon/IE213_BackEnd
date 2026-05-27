import { PageHeader } from "@/components/layout/page-header";
import { AdminInventoryDetailView } from "@/components/admin/catalog/admin-inventory-detail-view";

type AdminInventoryDetailPageProps = {
  params: Promise<{ sku: string }>;
};

export default async function AdminInventoryDetailPage({ params }: AdminInventoryDetailPageProps) {
  const { sku } = await params;

  return (
    <main className="container-page py-8 sm:py-10">
      <PageHeader
        eyebrow="Admin"
        title="Inventory SKU detail"
        description="Inspect a single SKU, product link, stock, reserved quantity, available quantity, and restock action."
      />
      <div className="mt-8">
        <AdminInventoryDetailView sku={sku} />
      </div>
    </main>
  );
}

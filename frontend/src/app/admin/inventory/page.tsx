import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { AdminInventoryView } from "@/components/admin/catalog/admin-inventory-view";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminInventoryPage() {
  return (
    <main className="container-page py-8 sm:py-10">
      <PageHeader
        eyebrow="Admin"
        title="Inventory"
        description="Track stock, reserved quantity, available quantity, low-stock filters, and SKU update actions."
      />
      <div className="mt-8">
        <Suspense fallback={<Skeleton className="h-72 rounded-lg" />}>
          <AdminInventoryView />
        </Suspense>
      </div>
    </main>
  );
}

import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { AdminOrdersView } from "@/components/admin/admin-orders-view";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminOrdersPage() {
  return (
    <main className="container-page py-8 sm:py-10">
      <PageHeader
        eyebrow="Admin"
        title="Orders"
        description="Filter every order by status, inspect payment state, and move orders through valid transitions."
      />
      <div className="mt-8">
        <Suspense fallback={<Skeleton className="h-72 rounded-lg" />}>
          <AdminOrdersView />
        </Suspense>
      </div>
    </main>
  );
}

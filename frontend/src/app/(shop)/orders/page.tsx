import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { OrdersView } from "@/components/orders/orders-view";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrdersPage() {
  return (
    <main className="container-page py-8 sm:py-10">
      <PageHeader
        eyebrow="Account"
        title="Order history"
        description="Track order status, payment state, totals, and available actions from one place."
        variant="storefront"
      />
      <div className="mt-8">
        <Suspense fallback={<Skeleton className="h-72 rounded-lg" />}>
          <OrdersView />
        </Suspense>
      </div>
    </main>
  );
}

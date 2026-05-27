import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { OrdersView } from "@/components/orders/orders-view";

export default function OrdersPage() {
  return (
    <main className="container-page py-8 sm:py-10">
      <PageHeader
        eyebrow="Account"
        title="Order history"
        description="Track your orders, payment state, totals, and cancellation availability."
      />
      <div className="mt-8">
        <Suspense fallback={<div className="h-72 rounded-lg bg-surface" />}>
          <OrdersView />
        </Suspense>
      </div>
    </main>
  );
}

import { Suspense } from "react";
import { AccountShell } from "@/components/account/account-shell";
import { PageHeader } from "@/components/layout/page-header";
import { OrdersView } from "@/components/orders/orders-view";
import { Skeleton } from "@/components/ui/skeleton";

export default function AccountOrdersPage() {
  return (
    <main className="container-page py-8 sm:py-10">
      <PageHeader
        eyebrow="Account"
        title="Order history"
        description="Track order status, payment state, totals, and available actions from your account."
      />
      <div className="mt-8">
        <AccountShell>
          <Suspense fallback={<Skeleton className="h-72 rounded-lg" />}>
            <OrdersView />
          </Suspense>
        </AccountShell>
      </div>
    </main>
  );
}

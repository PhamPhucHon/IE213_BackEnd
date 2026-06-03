import { AccountShell } from "@/components/account/account-shell";
import { PageHeader } from "@/components/layout/page-header";
import { OrderDetailView } from "@/components/orders/order-detail-view";

type AccountOrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AccountOrderDetailPage({ params }: AccountOrderDetailPageProps) {
  const { id } = await params;

  return (
    <main className="container-page py-8 sm:py-10">
      <PageHeader
        eyebrow="Account"
        title="Order detail"
        description="Review shipment details, ordered items, totals, and the current status timeline."
      />
      <div className="mt-8">
        <AccountShell>
          <OrderDetailView id={id} />
        </AccountShell>
      </div>
    </main>
  );
}

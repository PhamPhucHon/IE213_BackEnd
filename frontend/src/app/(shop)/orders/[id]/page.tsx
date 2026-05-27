import { PageHeader } from "@/components/layout/page-header";
import { OrderDetailView } from "@/components/orders/order-detail-view";

type OrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;

  return (
    <main className="container-page py-8 sm:py-10">
      <PageHeader
        eyebrow="Account"
        title="Order detail"
        description="Review shipping information, items, totals, status timeline, and cancellation options."
      />
      <div className="mt-8">
        <OrderDetailView id={id} />
      </div>
    </main>
  );
}

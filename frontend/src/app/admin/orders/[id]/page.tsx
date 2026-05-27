import { PageHeader } from "@/components/layout/page-header";
import { AdminOrderDetailView } from "@/components/admin/admin-order-detail-view";

type AdminOrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminOrderDetailPage({ params }: AdminOrderDetailPageProps) {
  const { id } = await params;

  return (
    <main className="container-page py-8 sm:py-10">
      <PageHeader
        eyebrow="Admin"
        title="Order detail"
        description="View customer, shipping, items, totals, payment state, notes, and valid status actions."
      />
      <div className="mt-8">
        <AdminOrderDetailView id={id} />
      </div>
    </main>
  );
}

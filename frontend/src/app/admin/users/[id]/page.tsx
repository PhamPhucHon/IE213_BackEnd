import { PageHeader } from "@/components/layout/page-header";
import { AdminUserDetailView } from "@/components/admin/admin-user-detail-view";

type AdminUserDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminUserDetailPage({ params }: AdminUserDetailPageProps) {
  const { id } = await params;

  return (
    <main className="container-page py-8 sm:py-10">
      <PageHeader
        eyebrow="Admin"
        title="User detail"
        description="Inspect profile data, addresses, activity status, and account actions."
      />
      <div className="mt-8">
        <AdminUserDetailView id={id} />
      </div>
    </main>
  );
}

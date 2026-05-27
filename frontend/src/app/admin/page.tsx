import { PageHeader } from "@/components/layout/page-header";
import { AdminDashboardView } from "@/components/admin/admin-dashboard-view";

export default function AdminDashboardPage() {
  return (
    <main className="container-page py-8 sm:py-10">
      <PageHeader
        eyebrow="Admin"
        title="Dashboard"
        description="Overview KPIs, monthly delivered revenue, low-stock shortcuts, and top selling products."
      />
      <div className="mt-8">
        <AdminDashboardView />
      </div>
    </main>
  );
}

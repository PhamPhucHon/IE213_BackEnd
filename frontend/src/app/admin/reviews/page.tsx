import { AdminReviewsView } from "@/components/admin/admin-reviews-view";
import { PageHeader } from "@/components/layout/page-header";

export default function AdminReviewsPage() {
  return (
    <main className="container-page py-8 sm:py-10">
      <PageHeader
        eyebrow="Admin"
        title="Reviews"
        description="Moderate product reviews, filter by rating, and remove abusive or invalid content."
      />
      <div className="mt-8">
        <AdminReviewsView />
      </div>
    </main>
  );
}

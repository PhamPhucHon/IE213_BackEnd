import { PageHeader } from "@/components/layout/page-header";
import { AdminCategoriesView } from "@/components/admin/catalog/admin-categories-view";

export default function AdminCategoriesPage() {
  return (
    <main className="container-page py-8 sm:py-10">
      <PageHeader
        eyebrow="Admin"
        title="Categories"
        description="Create, edit, order, and delete categories used by storefront navigation and filters."
      />
      <div className="mt-8">
        <AdminCategoriesView />
      </div>
    </main>
  );
}

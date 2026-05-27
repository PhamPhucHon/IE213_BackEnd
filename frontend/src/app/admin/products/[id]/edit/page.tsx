import { PageHeader } from "@/components/layout/page-header";
import { AdminProductFormView } from "@/components/admin/catalog/admin-product-form-view";

type AdminEditProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminEditProductPage({ params }: AdminEditProductPageProps) {
  const { id } = await params;

  return (
    <main className="container-page py-8 sm:py-10">
      <PageHeader
        eyebrow="Admin"
        title="Edit product"
        description="Update product fields, images, specifications, variants, and active state."
      />
      <div className="mt-8">
        <AdminProductFormView id={id} />
      </div>
    </main>
  );
}

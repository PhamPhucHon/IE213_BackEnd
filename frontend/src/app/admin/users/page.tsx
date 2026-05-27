import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { AdminUsersView } from "@/components/admin/admin-users-view";

export default function AdminUsersPage() {
  return (
    <main className="container-page py-8 sm:py-10">
      <PageHeader
        eyebrow="Admin"
        title="Users"
        description="Manage customer and admin accounts with status toggles, detail views, and pagination."
      />
      <div className="mt-8">
        <Suspense fallback={<div className="h-72 rounded-lg bg-surface" />}>
          <AdminUsersView />
        </Suspense>
      </div>
    </main>
  );
}

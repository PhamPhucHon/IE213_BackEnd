import { AccountProfileView } from "@/components/account/account-profile-view";
import { AccountShell } from "@/components/account/account-shell";
import { PageHeader } from "@/components/layout/page-header";

export default function AccountPage() {
  return (
    <main className="container-page py-8 sm:py-10">
      <PageHeader
        eyebrow="Account"
        title="Profile"
        description="Manage your profile information and customer contact details."
      />
      <div className="mt-8">
        <AccountShell>
          <AccountProfileView />
        </AccountShell>
      </div>
    </main>
  );
}

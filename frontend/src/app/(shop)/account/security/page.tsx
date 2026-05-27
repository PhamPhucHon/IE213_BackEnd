import { AccountSecurityView } from "@/components/account/account-security-view";
import { AccountShell } from "@/components/account/account-shell";
import { PageHeader } from "@/components/layout/page-header";

export default function AccountSecurityPage() {
  return (
    <main className="container-page py-8 sm:py-10">
      <PageHeader
        eyebrow="Account"
        title="Security"
        description="Change your password, logout, or disable your account."
      />
      <div className="mt-8">
        <AccountShell>
          <AccountSecurityView />
        </AccountShell>
      </div>
    </main>
  );
}

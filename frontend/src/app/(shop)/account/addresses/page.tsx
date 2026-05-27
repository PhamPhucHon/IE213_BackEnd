import { AddressBookView } from "@/components/account/address-book-view";
import { AccountShell } from "@/components/account/account-shell";
import { PageHeader } from "@/components/layout/page-header";

export default function AddressesPage() {
  return (
    <main className="container-page py-8 sm:py-10">
      <PageHeader
        eyebrow="Account"
        title="Address book"
        description="Create, edit, delete, and set your default shipping address."
      />
      <div className="mt-8">
        <AccountShell>
          <AddressBookView />
        </AccountShell>
      </div>
    </main>
  );
}

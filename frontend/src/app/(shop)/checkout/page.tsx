import { CheckoutView } from "@/components/checkout/checkout-view";
import { PageHeader } from "@/components/layout/page-header";

export default function CheckoutPage() {
  return (
    <main className="container-page py-8 sm:py-10">
      <PageHeader
        eyebrow="Shopping"
        title="Checkout"
        description="Confirm delivery details, choose a payment method, and place the order with confidence."
        variant="storefront"
      />
      <div className="mt-8">
        <CheckoutView />
      </div>
    </main>
  );
}

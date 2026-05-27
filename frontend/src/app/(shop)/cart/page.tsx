import { CartView } from "@/components/cart/cart-view";
import { PageHeader } from "@/components/layout/page-header";

export default function CartPage() {
  return (
    <main className="container-page py-8 sm:py-10">
      <PageHeader
        eyebrow="Shopping"
        title="Cart"
        description="Review items, update quantities with stock checks, and continue to checkout."
      />
      <div className="mt-8">
        <CartView />
      </div>
    </main>
  );
}

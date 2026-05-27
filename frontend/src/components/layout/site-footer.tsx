import Link from "next/link";
import { Mail, MapPin, Phone, ShieldCheck, Truck } from "lucide-react";

const shopLinks = [
  { href: "/products", label: "All products" },
  { href: "/products?type=Sunglasses", label: "Sunglasses" },
  { href: "/products?type=Eyeglasses", label: "Eyeglasses" },
  { href: "/cart", label: "Cart" }
];

const accountLinks = [
  { href: "/account", label: "Profile" },
  { href: "/orders", label: "Orders" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/security", label: "Security" }
];

const supportLinks = [
  { href: "/login", label: "Login" },
  { href: "/register", label: "Create account" },
  { href: "/forgot-password", label: "Reset password" }
];

function FooterLinkList({ title, links }: { title: string; links: Array<{ href: string; label: string }> }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      <ul className="mt-4 grid gap-3 text-sm text-muted">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="transition hover:text-ink">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-surface">
      <div className="container-page grid gap-10 py-10 lg:grid-cols-[1.4fr_2fr]">
        <div className="max-w-md">
          <Link href="/" className="text-xl font-bold tracking-tight text-ink">
            IE213 Eyewear
          </Link>
          <p className="mt-4 text-sm leading-6 text-muted">
            Curated sunglasses and eyeglasses for everyday comfort, clear vision, and a cleaner
            personal style.
          </p>

          <div className="mt-6 grid gap-3 text-sm text-muted">
            <p className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
              Thu Duc City, Ho Chi Minh City
            </p>
            <a href="mailto:support@ie213eyewear.vn" className="flex items-center gap-3 transition hover:text-ink">
              <Mail className="h-4 w-4 shrink-0 text-brand-600" />
              support@ie213eyewear.vn
            </a>
            <a href="tel:+842812345678" className="flex items-center gap-3 transition hover:text-ink">
              <Phone className="h-4 w-4 shrink-0 text-brand-600" />
              +84 28 1234 5678
            </a>
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          <FooterLinkList title="Shop" links={shopLinks} />
          <FooterLinkList title="Account" links={accountLinks} />
          <FooterLinkList title="Support" links={supportLinks} />
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-4 py-5 text-sm text-muted md:flex-row md:items-center md:justify-between">
          <p>&copy; {currentYear} IE213 Eyewear. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            <span className="inline-flex items-center gap-2">
              <Truck className="h-4 w-4 text-brand-600" />
              Nationwide delivery
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand-600" />
              Secure checkout
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

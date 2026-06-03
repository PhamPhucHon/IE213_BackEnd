import Link from "next/link";
import { Mail, MapPin, Phone, ShieldCheck, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

const shopLinks = [
  { href: "/products", label: "All products" },
  { href: "/products?type=Sunglasses", label: "Sunglasses" },
  { href: "/products?type=Eyeglasses", label: "Eyeglasses" },
  { href: "/cart", label: "Cart" }
];

const accountLinks = [
  { href: "/account", label: "Profile" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/security", label: "Security" }
];

const supportLinks = [
  { href: "/login", label: "Sign in" },
  { href: "/register", label: "Create account" },
  { href: "/forgot-password", label: "Reset password" }
];

function FooterLinkList({ title, links }: { title: string; links: Array<{ href: string; label: string }> }) {
  return (
    <div>
      <h2 className="text-sm font-semibold tracking-tight text-ink">{title}</h2>
      <ul className="mt-4 grid gap-2 text-sm text-muted">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="focus-ring rounded-sm transition hover:text-ink">
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
  const serviceNotes = [
    { icon: Truck, label: "Nationwide delivery" },
    { icon: ShieldCheck, label: "Secure checkout" }
  ];

  return (
    <footer className="border-t border-line bg-surface">
      <div className="container-page grid gap-10 py-12 lg:grid-cols-[1.2fr_2fr] lg:py-14">
        <div className="max-w-md">
          <Link href="/" className="focus-ring rounded-md text-xl font-bold tracking-tight text-ink">
            IE213 <span className="text-brand-700">Eyewear</span>
          </Link>
          <p className="mt-4 text-sm leading-6 text-muted">
            Everyday eyewear for clear vision, steady comfort, and a cleaner personal style.
          </p>

          <div className="mt-6 grid gap-3 text-sm text-muted">
            <p className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
              Thu Duc City, Ho Chi Minh City
            </p>
            <a href="mailto:support@ie213eyewear.vn" className="focus-ring flex rounded-sm items-center gap-3 transition hover:text-ink">
              <Mail className="h-4 w-4 shrink-0 text-brand-600" />
              support@ie213eyewear.vn
            </a>
            <a href="tel:+842812345678" className="focus-ring flex rounded-sm items-center gap-3 transition hover:text-ink">
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
            {serviceNotes.map((item) => {
              const Icon = item.icon;

              return (
                <span key={item.label} className={cn("inline-flex items-center gap-2")}>
                  <Icon className="h-4 w-4 text-brand-600" />
                  {item.label}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}

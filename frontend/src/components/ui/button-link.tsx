import Link from "next/link";
import {
  getButtonClassName,
  type ButtonVariant
} from "./style-primitives";

type ButtonLinkProps = {
  href: string;
  children: React.ReactNode;
  variant?: ButtonVariant;
  className?: string;
};

export function ButtonLink({ href, children, variant = "primary", className }: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={getButtonClassName(variant, className)}
    >
      {children}
    </Link>
  );
}

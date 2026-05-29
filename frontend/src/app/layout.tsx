import type { Metadata } from "next";
import { AppProviders } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001"
  ),
  title: {
    default: "IE213 Eyewear",
    template: "%s | IE213 Eyewear"
  },
  description: "Shop sunglasses and eyeglasses from the IE213 eyewear catalog.",
  openGraph: {
    title: "IE213 Eyewear",
    description: "Shop sunglasses and eyeglasses from the IE213 eyewear catalog.",
    siteName: "IE213 Eyewear",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "IE213 Eyewear",
    description: "Shop sunglasses and eyeglasses from the IE213 eyewear catalog."
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" data-scroll-behavior="smooth">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

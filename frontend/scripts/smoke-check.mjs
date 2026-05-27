import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const checks = [
  {
    name: "login flow",
    files: [
      "src/app/(auth)/login/page.tsx",
      "src/components/auth/login-form.tsx",
      "src/app/api/auth/login/route.ts",
      "src/app/api/auth/me/route.ts"
    ],
    patterns: [
      ["src/components/auth/login-form.tsx", "login("],
      ["src/app/api/auth/login/route.ts", "setAuthCookies"]
    ]
  },
  {
    name: "browse product flow",
    files: [
      "src/app/(shop)/products/page.tsx",
      "src/app/(shop)/products/[slug]/page.tsx",
      "src/components/product/product-grid.tsx",
      "src/components/product/product-detail-view.tsx"
    ],
    patterns: [
      ["src/app/(shop)/products/page.tsx", "productsApi.list"],
      ["src/app/(shop)/products/[slug]/page.tsx", "generateMetadata"]
    ]
  },
  {
    name: "add to cart flow",
    files: [
      "src/app/api/cart/route.ts",
      "src/app/api/inventory/check/route.ts",
      "src/components/product/product-detail-view.tsx",
      "src/components/cart/cart-view.tsx"
    ],
    patterns: [
      ["src/components/product/product-detail-view.tsx", "addCartItem"],
      ["src/app/api/inventory/check/route.ts", "/inventory/check"]
    ]
  },
  {
    name: "checkout flow",
    files: [
      "src/app/(shop)/checkout/page.tsx",
      "src/components/checkout/checkout-view.tsx",
      "src/app/api/orders/route.ts",
      "src/app/api/users/addresses/route.ts"
    ],
    patterns: [
      ["src/components/checkout/checkout-view.tsx", "createOrder"],
      ["src/app/api/orders/route.ts", "POST"]
    ]
  },
  {
    name: "cancel order flow",
    files: [
      "src/app/(shop)/orders/page.tsx",
      "src/app/(shop)/orders/[id]/page.tsx",
      "src/components/orders/cancel-order-button.tsx",
      "src/app/api/orders/[id]/cancel/route.ts"
    ],
    patterns: [
      ["src/components/orders/cancel-order-button.tsx", "cancelOrder"],
      ["src/components/orders/cancel-order-button.tsx", "useConfirm"]
    ]
  },
  {
    name: "admin update order flow",
    files: [
      "src/app/admin/orders/page.tsx",
      "src/app/admin/orders/[id]/page.tsx",
      "src/components/admin/admin-order-status-actions.tsx",
      "src/app/api/admin/orders/[id]/status/route.ts"
    ],
    patterns: [
      ["src/components/admin/admin-order-status-actions.tsx", "updateAdminOrderStatus"],
      ["src/components/admin/admin-order-status-actions.tsx", "getNextAdminOrderStatuses"]
    ]
  },
  {
    name: "admin review moderation flow",
    files: [
      "src/app/admin/reviews/page.tsx",
      "src/components/admin/admin-reviews-view.tsx",
      "src/app/api/admin/reviews/route.ts",
      "src/app/api/admin/reviews/[id]/route.ts"
    ],
    patterns: [
      ["src/components/admin/admin-reviews-view.tsx", "useAdminReviews"],
      ["src/components/admin/admin-reviews-view.tsx", "adminDeleteReview"]
    ]
  }
];

const failures = [];

for (const check of checks) {
  for (const file of check.files) {
    if (!existsSync(join(root, file))) {
      failures.push(`${check.name}: missing ${file}`);
    }
  }

  for (const [file, pattern] of check.patterns) {
    const path = join(root, file);
    if (!existsSync(path)) {
      continue;
    }

    const contents = readFileSync(path, "utf8");
    if (!contents.includes(pattern)) {
      failures.push(`${check.name}: ${file} does not include "${pattern}"`);
    }
  }
}

if (failures.length) {
  console.error("Smoke check failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Smoke check passed: ${checks.length} critical flows are wired.`);

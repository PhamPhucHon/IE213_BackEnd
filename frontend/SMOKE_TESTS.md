# Frontend Smoke Test Checklist

Use this checklist for a browser pass after `npm run build` succeeds and the backend is seeded.

## Required Accounts

- Admin account from seed data, for example `admin@glassstore.vn`.
- Customer account that can login and place orders.

## Browser Smoke Flow

1. Login
   - Open `/login`.
   - Login as a customer.
   - Confirm the header shows the account link and cart access.

2. Browse product
   - Open `/products`.
   - Apply a category/type/sort filter.
   - Open one product detail page.
   - Confirm gallery, variant, price, SKU, specifications, and reviews render.

3. Add to cart
   - Select a variant and quantity.
   - Add to cart.
   - Confirm `/cart` shows the item, quantity controls, subtotal, and checkout CTA.

4. Checkout
   - Open `/checkout`.
   - Select or enter shipping info.
   - Pick a payment method.
   - Submit order and confirm redirect to `/orders/[id]`.

5. Cancel order
   - Open `/orders`.
   - Cancel a Pending or Processing order.
   - Confirm the accessible dialog appears and the order becomes Cancelled.

6. Admin update order
   - Login as an admin.
   - Open `/admin/orders`.
   - Filter by status and open an order.
   - Move the order through one valid transition.
   - Confirm invalid transitions are not shown.

7. Admin catalog and inventory
   - Open `/admin/categories` and create or edit a category.
   - Open `/admin/products/new` and create a product with at least one unique SKU.
   - Open `/admin/inventory?lowStock=true`.
   - Update stock for the new SKU and confirm low-stock highlighting changes.

## Automated Contract Smoke

Run:

```bash
npm run smoke
```

This checks that the critical route, component, and local API surfaces for the flows above are wired.

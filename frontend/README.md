# IE213 Frontend

Frontend Next.js cho IE213 Eyewear Store. App dùng App Router, TypeScript strict, Tailwind CSS và các route handler nội bộ để proxy request tới backend Express API.

## Stack

- Next.js 15 App Router
- React 19
- TypeScript strict
- Tailwind CSS
- TanStack React Query
- Zustand
- React Hook Form + Zod
- lucide-react
- Recharts

## URL Mặc Định

```text
Frontend:    http://localhost:3001
Backend API: http://localhost:5001/api
```

## Cài Đặt

```powershell
cd D:\Vs_code\IE213_BackEnd\frontend
npm install
Copy-Item .env.example .env.local
npm run dev
```

Mở:

```text
http://localhost:3001
```

## Environment

File local: `frontend/.env.local`

```env
NEXT_PUBLIC_APP_URL=http://localhost:3001
BACKEND_API_URL=http://localhost:5001/api
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:5001/api
NEXT_PUBLIC_IMAGE_HOSTS=res.cloudinary.com
```

Giải thích nhanh:

| Biến | Ý nghĩa |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | URL frontend local/public |
| `BACKEND_API_URL` | Backend API dùng trong Next.js server route handlers |
| `NEXT_PUBLIC_BACKEND_API_URL` | Fallback public backend URL |
| `NEXT_PUBLIC_IMAGE_HOSTS` | Danh sách host ảnh được Next Image cho phép |

Nếu đổi port backend, cập nhật cả `BACKEND_API_URL` và `NEXT_PUBLIC_BACKEND_API_URL`, sau đó restart frontend.

## Scripts

```powershell
npm run dev        # Next dev server ở port 3001
npm run build      # build production
npm run start      # chạy production server ở port 3001
npm run lint       # lint toàn frontend
npm run typecheck  # TypeScript strict check
npm run smoke      # kiểm tra flow wiring quan trọng
```

## Tính Năng Chính

- Storefront: home, products, categories, product detail
- Auth: login, register, logout, forgot password, reset password
- Account: profile, addresses, security
- Cart: add/update/remove items, clear cart
- Checkout: shipping address, payment method, order creation
- Orders: list, detail, cancel order
- Reviews: list, create, update, delete, like
- Admin: dashboard, users, orders, products, categories, inventory, reviews

## Cấu Trúc Thư Mục

```text
src/
├── app/                 # App Router pages, layouts, route handlers
│   ├── (auth)/          # Login/register/password pages
│   ├── (shop)/          # Public shop/account/cart/checkout/orders
│   ├── admin/           # Admin dashboard pages
│   └── api/             # Next.js API proxy routes
├── components/          # UI, layout, auth, catalog, cart, admin components
├── lib/                 # API clients, hooks, validators, utils
├── middleware.ts        # Route guard dựa trên auth cookies
└── types/               # Shared TypeScript types
```

## Luồng API Và Auth

- UI gọi các helper trong `src/lib/api/local-*`.
- Các helper này gọi Next.js route handlers tại `/api/...`.
- Route handlers proxy request tới backend Express qua `BACKEND_API_URL`.
- Access token và refresh token được lưu trong HttpOnly cookies.
- `src/middleware.ts` guard các route cần đăng nhập dựa trên cookie presence.
- Backend vẫn là nguồn kiểm tra quyền cuối cùng, đặc biệt với admin routes.

## Hình Ảnh

Next Image chỉ cho phép host trong `NEXT_PUBLIC_IMAGE_HOSTS`.

Mặc định:

```env
NEXT_PUBLIC_IMAGE_HOSTS=res.cloudinary.com
```

Nếu backend trả ảnh từ host khác, thêm host đó vào biến này, phân tách bằng dấu phẩy.

## Kiểm Tra Trước Khi Commit

```powershell
npm run typecheck
npm run lint
npm run smoke
```

Smoke test kiểm tra các flow wiring quan trọng như auth, cart, checkout, account, admin và review moderation.

## Lỗi Hay Gặp

### "Backend did not return JSON"

Frontend đang gọi nhầm backend URL hoặc backend không chạy đúng port.

Kiểm tra:

```powershell
Get-Content .env.local
```

Đảm bảo:

```env
BACKEND_API_URL=http://localhost:5001/api
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:5001/api
```

Sau đó restart:

```powershell
npm run dev
```

### Login đúng route nhưng vẫn 401

Backend đã trả JSON đúng nhưng tài khoản không hợp lệ. Kiểm tra user trong MongoDB Atlas/database đang dùng, hoặc seed lại dữ liệu mẫu nếu cần.

### Ảnh không hiện

Kiểm tra host ảnh có nằm trong `NEXT_PUBLIC_IMAGE_HOSTS` không, rồi restart dev server.

# IE213 – Backend API (Sneaker Store)

Backend RESTful API cho dự án cửa hàng giày IE213, xây dựng bằng Node.js + Express + MongoDB.

---

## Mục lục

- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Cài đặt và chạy](#cài-đặt-và-chạy)
- [Cấu hình biến môi trường](#cấu-hình-biến-môi-trường)
- [Chạy bằng Docker](#chạy-bằng-docker)
- [Seed dữ liệu mẫu](#seed-dữ-liệu-mẫu)
- [Tài liệu API](#tài-liệu-api)
- [Kiểm thử API với Postman](#kiểm-thử-api-với-postman)

---

## Yêu cầu hệ thống

| Công cụ | Phiên bản tối thiểu |
|---------|-------------------|
| Node.js | 18.x trở lên |
| npm | 9.x trở lên |
| MongoDB | 6.x (local hoặc Atlas) |

---

## Cài đặt và chạy

### 1. Clone dự án

```bash
git clone <url-repo>
cd IE213_BackEnd/server
```

### 2. Cài đặt thư viện

```bash
npm install
```

Các thư viện chính sẽ được cài:

| Thư viện | Mục đích |
|----------|----------|
| `express` | Framework HTTP |
| `mongoose` | ODM kết nối MongoDB |
| `jsonwebtoken` | Tạo và xác thực JWT |
| `bcryptjs` | Hash mật khẩu |
| `dotenv` | Load biến môi trường |
| `cloudinary` | Lưu trữ ảnh trên cloud |
| `multer` | Xử lý upload file |
| `multer-storage-cloudinary` | Tích hợp multer với Cloudinary |
| `nodemailer` | Gửi email |
| `passport` | Xác thực OAuth (Google...) |
| `morgan` | Log HTTP request |
| `cors` | Cho phép cross-origin |
| `express-rate-limit` | Giới hạn request chống DDoS |

### 3. Chạy server

```bash
# Development (tự restart khi sửa file)
npm run dev

# Production
npm start
```

Server mặc định chạy tại: `http://localhost:5000`

---

## Cấu hình biến môi trường

Tạo file `.env` trong thư mục `server/`:

```env
# Môi trường
NODE_ENV=development
PORT=5000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/sneaker_store
# Hoặc MongoDB Atlas:
# MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/sneaker_store

# JWT
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=30d

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Cloudinary (Upload ảnh)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend URL (CORS)
CLIENT_URL=http://localhost:3000
```


---

## Chạy bằng Docker

Đảm bảo đã cài [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
# Từ thư mục gốc IE213_BackEnd/
docker-compose up --build
```

Để chạy nền (background):

```bash
docker-compose up --build -d
```

Dừng container:

```bash
docker-compose down
```

> Server sẽ chạy tại `http://localhost:5000` (map từ port 5000 trong container ra máy thật).

---

## Seed dữ liệu mẫu

Sau khi server đang chạy và MongoDB đã kết nối:

```bash
cd server
node seeds/seeder.js
```

Lệnh này sẽ tạo dữ liệu mẫu cho:
- Người dùng (`users.json`)
- Sản phẩm (`products.json`)

---

## Tài liệu API

Base URL: `http://localhost:5000/api`

### Xác thực (`/api/auth`)

| Method | Endpoint | Mô tả | Quyền |
|--------|----------|-------|-------|
| POST | `/auth/register` | Đăng ký tài khoản mới | Public |
| POST | `/auth/login` | Đăng nhập, trả về JWT token | Public |
| GET | `/auth/me` | Lấy thông tin user đang đăng nhập | User |
| POST | `/auth/logout` | Đăng xuất | User |

### Người dùng (`/api/users`)

| Method | Endpoint | Mô tả | Quyền |
|--------|----------|-------|-------|
| GET | `/users/profile` | Lấy thông tin cá nhân | User |
| PUT | `/users/profile` | Cập nhật hồ sơ (name, phone, avatar) | User |
| PUT | `/users/change-password` | Đổi mật khẩu | User |
| POST | `/users/addresses` | Thêm địa chỉ mới | User |
| PUT | `/users/addresses/:id` | Cập nhật địa chỉ | User |
| DELETE | `/users/addresses/:id` | Xóa địa chỉ | User |
| PUT | `/users/addresses/:id/set-default` | Đặt làm địa chỉ mặc định | User |

### Danh mục (`/api/categories`)

| Method | Endpoint | Mô tả | Quyền |
|--------|----------|-------|-------|
| GET | `/categories` | Danh sách tất cả danh mục | Public |
| GET | `/categories/:id` | Chi tiết danh mục theo ID | Public |
| GET | `/categories/slug/:slug` | Chi tiết danh mục theo slug | Public |
| POST | `/categories` | Tạo danh mục mới | Admin |
| PUT | `/categories/:id` | Cập nhật danh mục | Admin |
| DELETE | `/categories/:id` | Xóa danh mục | Admin |

### Sản phẩm (`/api/products`)

| Method | Endpoint | Mô tả | Quyền |
|--------|----------|-------|-------|
| GET | `/products` | Danh sách sản phẩm (lọc, tìm kiếm, phân trang) | Public |
| GET | `/products/:id` | Chi tiết sản phẩm theo ID | Public |
| GET | `/products/slug/:slug` | Chi tiết sản phẩm theo slug | Public |
| POST | `/products` | Tạo sản phẩm mới | Admin |
| PUT | `/products/:id` | Cập nhật sản phẩm | Admin |
| DELETE | `/products/:id` | Xóa sản phẩm | Admin |
| POST | `/products/upload-image` | Upload ảnh lên Cloudinary | Admin |

**Query params cho `GET /products`:**

| Param | Ví dụ | Mô tả |
|-------|-------|-------|
| `keyword` | `?keyword=nike` | Tìm theo tên |
| `categoryId` | `?categoryId=abc123` | Lọc theo danh mục |
| `brand` | `?brand=Nike` | Lọc theo thương hiệu |
| `minPrice` | `?minPrice=500000` | Giá tối thiểu |
| `maxPrice` | `?maxPrice=2000000` | Giá tối đa |
| `sort` | `?sort=priceAsc` | `newest` / `priceAsc` / `priceDesc` / `topRated` |
| `page` | `?page=2` | Số trang |
| `limit` | `?limit=12` | Số item mỗi trang |

### Đánh giá (`/api/reviews`, `/api/products/:productId/reviews`)

| Method | Endpoint | Mô tả | Quyền |
|--------|----------|-------|-------|
| GET | `/products/:productId/reviews` | Lấy danh sách đánh giá | Public |
| POST | `/products/:productId/reviews` | Tạo đánh giá mới | User |
| PUT | `/reviews/:id` | Cập nhật đánh giá | User |
| DELETE | `/reviews/:id` | Xóa đánh giá | User/Admin |
| POST | `/reviews/:id/like` | Thích / bỏ thích | User |

### Giỏ hàng (`/api/cart`)

| Method | Endpoint | Mô tả | Quyền |
|--------|----------|-------|-------|
| GET | `/cart` | Lấy giỏ hàng hiện tại | User |
| POST | `/cart` | Thêm sản phẩm vào giỏ | User |
| PUT | `/cart/:sku` | Cập nhật số lượng | User |
| DELETE | `/cart/:sku` | Xóa một sản phẩm khỏi giỏ | User |
| DELETE | `/cart` | Xóa toàn bộ giỏ hàng | User |

### Đơn hàng (`/api/orders`)

| Method | Endpoint | Mô tả | Quyền |
|--------|----------|-------|-------|
| POST | `/orders` | Tạo đơn hàng từ giỏ hàng | User |
| GET | `/orders` | Danh sách đơn hàng của user | User |
| GET | `/orders/:id` | Chi tiết đơn hàng | User |
| PUT | `/orders/:id/cancel` | Hủy đơn hàng | User |

### Admin (`/api/admin`)

| Method | Endpoint | Mô tả | Quyền |
|--------|----------|-------|-------|
| GET | `/admin/users` | Danh sách người dùng | Admin |
| GET | `/admin/users/:id` | Chi tiết người dùng | Admin |
| PUT | `/admin/users/:id/toggle-status` | Khóa / mở khóa tài khoản | Admin |
| GET | `/admin/orders` | Tất cả đơn hàng (lọc theo status) | Admin |
| GET | `/admin/orders/:id` | Chi tiết đơn hàng bất kỳ | Admin |
| PUT | `/admin/orders/:id/status` | Cập nhật trạng thái đơn hàng | Admin |
| GET | `/admin/inventory/:sku` | Xem tồn kho theo SKU | Admin |
| PUT | `/admin/inventory/:sku` | Cập nhật số lượng tồn kho | Admin |
| DELETE | `/admin/reviews/:id` | Xóa đánh giá bất kỳ | Admin |

---

## Kiểm thử API với Postman

### Bước 1 – Cài đặt Postman

Tải tại [https://www.postman.com/downloads/](https://www.postman.com/downloads/).

### Bước 2 – Tạo Environment

Trong Postman, tạo một **Environment** mới với các biến:

| Variable | Value |
|----------|-------|
| `BASE_URL` | `http://localhost:5000/api` |
| `TOKEN` | _(để trống, sẽ set sau khi đăng nhập)_ |

### Bước 3 – Đăng ký / Đăng nhập

**Đăng ký:**

```
POST {{BASE_URL}}/auth/register
Content-Type: application/json

{
  "name": "Nguyễn Văn A",
  "email": "test@example.com",
  "password": "Password123!",
  "phone": "0901234567"
}
```

**Đăng nhập:**

```
POST {{BASE_URL}}/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Password123!"
}
```

Lấy `token` trong response, gán vào biến `TOKEN` của Environment.

### Bước 4 – Gọi API cần xác thực

Thêm header vào mọi request cần quyền `User` hoặc `Admin`:

```
Authorization: Bearer {{TOKEN}}
```

Hoặc trong tab **Authorization** → chọn **Bearer Token** → điền `{{TOKEN}}`.

### Bước 5 – Ví dụ một số request

**Thêm sản phẩm vào giỏ:**

```
POST {{BASE_URL}}/cart
Authorization: Bearer {{TOKEN}}
Content-Type: application/json

{
  "sku": "NIKE-AIR-MAX-42-WHITE",
  "quantity": 2
}
```

**Tạo đơn hàng:**

```
POST {{BASE_URL}}/orders
Authorization: Bearer {{TOKEN}}
Content-Type: application/json

{
  "shippingAddress": {
    "label": "Nhà",
    "address": "123 Nguyễn Văn Linh, Q7, TP.HCM"
  },
  "paymentMethod": "COD"
}
```

**Cập nhật trạng thái đơn hàng (Admin):**

```
PUT {{BASE_URL}}/admin/orders/<orderId>/status
Authorization: Bearer {{ADMIN_TOKEN}}
Content-Type: application/json

{
  "status": "Shipped"
}
```

### Cấu trúc Response chuẩn

Tất cả response đều theo định dạng:

```json
{
  "success": true,
  "message": "Thành công",
  "data": { ... },
  "meta": {
    "timestamp": "2026-04-05T10:00:00.000Z",
    "requestId": null
  }
}
```

Khi có lỗi:

```json
{
  "success": false,
  "message": "Mô tả lỗi",
  "error": null,
  "meta": {
    "timestamp": "2026-04-05T10:00:00.000Z"
  }
}
```

---

## Phân quyền

| Ký hiệu | Ý nghĩa |
|---------|---------|
| **Public** | Không cần token |
| **User** | Cần header `Authorization: Bearer <token>` |
| **Admin** | Cần token và tài khoản có `role: admin` |

Middleware xử lý:
- `authMiddleware.js` – Xác thực JWT
- `adminMiddleware.js` – Kiểm tra quyền admin (chạy sau `authMiddleware`)

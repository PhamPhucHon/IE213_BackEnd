# IE213 Backend

Backend Express API cho IE213 Eyewear Store. Server cung cấp API cho storefront, auth, cart, checkout, orders, account, reviews và admin dashboard.

## Stack

- Node.js `>=20.19.0`
- Express 5
- MongoDB + Mongoose
- JWT access/refresh token
- bcryptjs
- express-validator
- Helmet, CORS, HPP, mongo sanitize, rate limit
- Cloudinary upload
- Nodemailer SMTP
- Pino structured logging
- Swagger UI
- Jest + Supertest + mongodb-memory-server

## URL Mặc Định

```text
Server:     http://localhost:5001
API root:   http://localhost:5001/api
Swagger UI: http://localhost:5001/api-docs
```

## Cài Đặt

```powershell
cd D:\Vs_code\IE213_BackEnd\server
npm install
Copy-Item .env.example .env
npm run dev
```

Server đọc biến môi trường từ `server/.env`.

## Environment

Các biến quan trọng:

| Biến | Bắt buộc | Ý nghĩa |
| --- | --- | --- |
| `NODE_ENV` | Có | `development`, `test`, hoặc `production` |
| `PORT` | Có | Port backend, mặc định `5001` |
| `MONGODB_URI` | Có | Connection string MongoDB |
| `DNS_SERVERS` | Không | DNS public cho Node khi dùng MongoDB Atlas SRV |
| `JWT_SECRET` | Có | Secret ký access token |
| `JWT_REFRESH_SECRET` | Có | Secret ký refresh token |
| `JWT_EXPIRE` | Có | Thời gian sống access token |
| `JWT_REFRESH_EXPIRE` | Có | Thời gian sống refresh token |
| `CLIENT_URL` | Có | Frontend URL dùng cho CORS và reset password link |
| `TRUST_PROXY` | Không | Bật khi chạy sau reverse proxy đáng tin cậy |
| `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS` | Có | SMTP cho forgot/reset password |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Có | Upload ảnh qua `/api/uploads/images` |
| `LOG_LEVEL` | Không | Mức log: `fatal`, `error`, `warn`, `info`, `debug`, `trace`, `silent` |
| `ENABLE_REQUEST_LOGGING` | Không | Bật/tắt HTTP request logging |
| `LOG_SINK_URL` | Không | Forward log tới HTTP sink ngoài |

Ví dụ local với MongoDB Atlas:

```env
NODE_ENV=development
PORT=5001
CLIENT_URL=http://localhost:3001
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/glassStore?retryWrites=true&w=majority&authSource=admin
DNS_SERVERS=1.1.1.1,8.8.8.8
```

Lưu ý:

- Atlas username/password là Database User, không phải tài khoản đăng nhập Atlas.
- Nếu password có ký tự đặc biệt như `@`, `#`, `%`, `/`, `:`, `?`, `&`, `+`, cần URL-encode.
- Nếu Node báo `querySrv ECONNREFUSED` nhưng `nslookup` vẫn chạy được, giữ `DNS_SERVERS=1.1.1.1,8.8.8.8`.
- Nếu báo `bad auth : authentication failed`, kiểm tra password, `authSource=admin` và quyền user trong Atlas.

## Scripts

```powershell
npm run dev         # nodemon server.js
npm start           # node server.js
npm run seed        # seed dữ liệu mẫu
npm test            # full Jest suite
npm run test:watch  # Jest watch mode
npm run swagger-gen # regenerate swagger-output.json
```

Chạy unit test không cần MongoMemory bootstrap:

```powershell
npx jest --config jest.unit.config.js --runInBand --runTestsByPath tests/unit/services/reviewService.test.js
```

## API Groups

| Prefix | Mục đích |
| --- | --- |
| `GET /` | Kiểm tra server đang chạy |
| `GET /api` | Kiểm tra base API path |
| `/api/auth` | Register, login, logout, refresh token, forgot/reset password, me |
| `/api/users` | Profile, password, addresses, account actions |
| `/api/categories` | Public/admin category operations |
| `/api/products` | Product catalog and detail |
| `/api/uploads/images` | Upload ảnh duy nhất cho avatar, category, product và variant |
| `/api/reviews` | Product reviews, like, update/delete own review |
| `/api/cart` | User cart |
| `/api/orders` | User orders, checkout, cancel |
| `/api/inventory` | User/public inventory checks |
| `/api/admin` | Admin dashboard, users, orders, reviews |
| `/api/admin/inventory` | Admin inventory management |
| `/api-docs` | Swagger UI |

## Kiến Trúc Thư Mục

```text
server/
├── app.js                  # Express app wiring, middleware, routes
├── server.js               # Runtime bootstrap: DB connect, listen, jobs
├── config/                 # env, db, logger, constants, shutdown
├── controllers/            # HTTP controllers
├── middleware/             # auth, validation, security, errors
├── models/                 # Mongoose schemas
├── routes/                 # Route definitions
├── services/               # Business logic, transactions
├── utils/                  # Response helpers, DTOs, shared utilities
├── tests/                  # Unit/integration tests
└── seeds/                  # Seed data script
```

## Runtime Flow

1. `server.js` load config, connect MongoDB, start Express listen.
2. `app.js` configure security middleware, CORS, request logging, JSON parsing and routes.
3. Route gọi controller.
4. Controller gọi service.
5. Service xử lý business logic, transaction và model operations.
6. Response được chuẩn hóa qua `utils/apiResponse.js`.
7. Error được normalize trong error middleware.

## Bảo Mật Và Auth

- JWT access token dùng cho protected routes.
- Refresh token dùng để cấp lại access token.
- Admin routes dùng `protect` + `isAdmin`.
- Global rate limit được bật cho API.
- Auth-sensitive routes có limiter riêng.
- Payload được sanitize để giảm rủi ro NoSQL injection và XSS.
- Helmet, HPP và CORS được cấu hình trong `app.js`.
- Log redaction tránh ghi lộ token/password/cookie.

## Logging

- Logger chính nằm ở `config/logger.js`.
- HTTP request logging ghi method, URL, status, response time, request id và user id nếu có.
- `LOG_LEVEL` điều chỉnh độ chi tiết.
- `LOG_SINK_URL` có thể dùng để forward log ra hệ thống ngoài.

## Swagger

Swagger UI:

```text
http://localhost:5001/api-docs
```

Regenerate JSON:

```powershell
npm run swagger-gen
```

## Seed Data

```powershell
npm run seed
```

Seed dùng `MONGODB_URI` hiện tại trong `server/.env`. Nếu muốn dataset sạch, hãy dùng database mới hoặc xóa database cũ trước khi seed.

## Test

```powershell
npm test
```

Full test suite dùng `mongodb-memory-server` để hỗ trợ các flow cần transaction. Nếu môi trường không tải được MongoDB binary hoặc bị cache permission, chạy các unit test thuần bằng `jest.unit.config.js`.

## Docker

Từ thư mục root:

```powershell
docker compose up --build
```

Compose build backend app, mount `server/`, đọc `server/.env` và expose `5001:5001`.

## Troubleshooting

### `querySrv ECONNREFUSED`

Node không resolve được SRV DNS của MongoDB Atlas.

Thêm vào `.env`:

```env
DNS_SERVERS=1.1.1.1,8.8.8.8
```

Sau đó restart server.

### `bad auth : authentication failed`

Backend đã kết nối tới Atlas nhưng Atlas từ chối xác thực.

Kiểm tra:

- Username/password trong Atlas Database Access
- Password đã URL-encode nếu có ký tự đặc biệt
- URI có `authSource=admin`
- User có quyền `readWrite` trên database đang dùng

### CORS bị chặn

Kiểm tra:

```env
CLIENT_URL=http://localhost:3001
```

Nếu frontend chạy nhiều origin, phân tách bằng dấu phẩy.

### Port 5001 đã bị chiếm

Kiểm tra:

```powershell
netstat -ano | findstr ":5001"
```

Đổi `PORT` trong `server/.env` nếu cần, đồng thời cập nhật `BACKEND_API_URL` bên frontend.

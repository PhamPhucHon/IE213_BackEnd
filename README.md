# IE213 Eyewear Store

Dự án full-stack e-commerce cho cửa hàng kính mắt IE213 Eyewear. Repo gồm backend Express API và frontend Next.js App Router, phục vụ các luồng chính như catalog, auth, cart, checkout, orders, reviews, account và admin dashboard.

## Tổng Quan

- Frontend: Next.js 15 App Router, React 19, TypeScript, Tailwind CSS
- Backend: Node.js, Express 5, MongoDB, Mongoose
- Auth: JWT access token + refresh token
- Frontend session: HttpOnly cookies thông qua Next.js route handlers
- Data fetching: TanStack React Query
- State/UI helpers: Zustand, React Hook Form, Zod, lucide-react, Recharts
- Upload ảnh: Cloudinary
- Email reset password: Nodemailer SMTP
- API docs: Swagger UI

## URL Mặc Định

| Phần | URL |
| --- | --- |
| Frontend | `http://localhost:3001` |
| Backend API | `http://localhost:5001/api` |
| Backend root | `http://localhost:5001/` |
| Swagger UI | `http://localhost:5001/api-docs` |

## Cấu Trúc Repo

```text
.
├── frontend/              # Next.js storefront, account, checkout, admin UI
├── server/                # Express API, MongoDB models, services, tests
├── docker-compose.yml     # Docker setup cho backend app
├── README.md              # README tổng của repo
└── doc_api.txt            # Ghi chú API bổ sung
```

## Yêu Cầu Môi Trường

- Node.js `>=20.19.0`
- npm `>=10`
- MongoDB Atlas hoặc MongoDB local có thể ghi dữ liệu
- Cloudinary account nếu dùng upload ảnh sản phẩm
- SMTP account nếu dùng forgot/reset password

## Chạy Local

Mở 2 terminal riêng: một terminal cho backend, một terminal cho frontend.

### 1. Backend

```powershell
cd D:\Vs_code\IE213_BackEnd\server
npm install
Copy-Item .env.example .env
npm run dev
```

Sau khi copy `.env.example`, mở `server/.env` và cập nhật các biến thật:

```env
PORT=5001
CLIENT_URL=http://localhost:3001
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/glassStore?retryWrites=true&w=majority&authSource=admin
DNS_SERVERS=1.1.1.1,8.8.8.8
```

Nếu kết nối MongoDB Atlas báo `querySrv ECONNREFUSED`, giữ `DNS_SERVERS=1.1.1.1,8.8.8.8`.

Nếu báo `bad auth : authentication failed`, kiểm tra username/password trong Atlas Database Access và URL-encode password nếu có ký tự đặc biệt.

### 2. Frontend

```powershell
cd D:\Vs_code\IE213_BackEnd\frontend
npm install
Copy-Item .env.example .env.local
npm run dev
```

File `frontend/.env.local` nên trỏ về backend local:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3001
BACKEND_API_URL=http://localhost:5001/api
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:5001/api
NEXT_PUBLIC_IMAGE_HOSTS=res.cloudinary.com
```

Mở trình duyệt tại:

```text
http://localhost:3001
```

## Scripts Thường Dùng

### Frontend

```powershell
cd frontend
npm run dev        # chạy Next.js dev server ở port 3001
npm run build      # build production
npm run start      # chạy production server ở port 3001
npm run lint       # ESLint
npm run typecheck  # TypeScript strict check
npm run smoke      # kiểm tra các flow frontend quan trọng
```

### Backend

```powershell
cd server
npm run dev         # chạy Express với nodemon ở port 5001
npm start           # chạy production-style bằng node server.js
npm run seed        # seed dữ liệu mẫu
npm test            # chạy Jest test suite
npm run test:watch  # chạy Jest watch mode
npm run swagger-gen # regenerate Swagger JSON
```

## Docker Backend

`docker-compose.yml` hiện build backend app và expose port `5001`.

```powershell
docker compose up --build
```

Docker vẫn đọc biến môi trường từ `server/.env`.

## Tài Liệu Chi Tiết

- Frontend: [frontend/README.md](frontend/README.md)
- Backend: [server/README.md](server/README.md)
- Smoke tests frontend: [frontend/SMOKE_TESTS.md](frontend/SMOKE_TESTS.md)

## Troubleshooting Nhanh

### Frontend hiện lỗi "Backend did not return JSON"

Thường là frontend đang trỏ nhầm backend hoặc backend port bị process khác chiếm.

Kiểm tra:

```powershell
Get-Content frontend\.env.local
netstat -ano | findstr ":5001"
```

`BACKEND_API_URL` phải là:

```env
BACKEND_API_URL=http://localhost:5001/api
```

Sau khi sửa env, restart frontend.

### Backend không kết nối được MongoDB Atlas

Kiểm tra SRV DNS:

```powershell
nslookup -type=SRV _mongodb._tcp.cluster0.xxxxx.mongodb.net
```

Kiểm tra TCP tới shard:

```powershell
Test-NetConnection ac-xxxxx-shard-00-00.xxxxx.mongodb.net -Port 27017
```

Nếu `nslookup` OK nhưng Node báo `querySrv ECONNREFUSED`, thêm:

```env
DNS_SERVERS=1.1.1.1,8.8.8.8
```

### Port 3000 hoặc 5000 bị chiếm

Dự án đã đổi mặc định sang:

```text
frontend: http://localhost:3001
backend:  http://localhost:5001
```

Nếu vẫn thấy app chạy ở port cũ, tắt terminal dev cũ và chạy lại `npm run dev`.

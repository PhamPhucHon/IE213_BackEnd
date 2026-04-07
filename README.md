# IE213 Backend API

Backend REST API cho dự án bán kính mắt (Node.js + Express + MongoDB).

## 1) Yêu cầu hệ thống

- Node.js: 18+
- npm: 9+
- MongoDB: local hoặc MongoDB Atlas

## 2) Cài đặt nhanh

```bash
cd server
npm install
```

## 3) Chạy dự án

```bash
# chạy production
npm start

# chạy development (auto reload)
npm run dev
```

Mặc định server chạy tại:

- `http://localhost:5000`
- Base API: `http://localhost:5000/api`

## 4) Biến môi trường bắt buộc

File `server/.env` cần đầy đủ các biến sau (theo `server/config/env.js`):

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/ie213_backend

JWT_SECRET=your_jwt_secret_at_least_32_chars
JWT_EXPIRE=30d

EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

CLIENT_URL=http://localhost:3000
```

Luu y:

- Neu thieu bat ky bien nao o tren, app se thoat ngay khi khoi dong.

## 5) Scripts

Trong `server/package.json`:

- `npm start`: chay `node server.js`
- `npm run dev`: chay `nodemon server.js`
- `npm run seed`: chay `node seeds/seeder.js`

## 6) Thu vien da cai

Runtime dependencies:

- express
- mongoose
- dotenv
- jsonwebtoken
- bcryptjs
- cloudinary
- multer
- multer-storage-cloudinary
- nodemailer
- express-validator

Dev dependency:

- nodemon

## 7) Kien truc route hien tai

Tat ca route duoc mount trong `server/server.js`:

- `/api/auth`
- `/api/users`
- `/api/categories`
- `/api/products`
- `/api/reviews`
- `/api/cart`
- `/api/orders`
- `/api/inventory`
- `/api/admin`

Middleware loi:

- `notFound` duoc dat sau toan bo route
- `errorHandler` duoc dat cuoi cung

## 8) Tai lieu API day du

Xem file:

- `doc_api.txt`

File nay da duoc cap nhat theo route va controller hien tai trong source code.

## 9) Kiem tra nhanh sau khi chay

Health endpoints:

- `GET /`
- `GET /api`

Neu server chay dung, 2 endpoint tren tra ve JSON `success: true`.

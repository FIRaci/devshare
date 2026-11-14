# HƯỚNG DẪN TRIỂN KHAI HẠ TẦNG ĐÁM MÂY (DEPLOYMENT GUIDE - DEVSHARE)

> **Mô hình triển khai:** Infrastructure as Code (IaC) thông qua Render Blueprint  
> **Nền tảng Cloud:** Render.com  
> **Cấu hình Blueprint:** [`render.yaml`](file:///d:/Test3/render.yaml)

---

## 1. CẤU HÌNH TÀI NGUYÊN BLUEPRINT (`render.yaml`)

Tệp `render.yaml` tại thư mục gốc tự động hóa việc khởi tạo đồng thời 3 tài nguyên:

1. **Cơ sở dữ liệu (Managed PostgreSQL):**
   - Tên dịch vụ: `devshare-db`
   - Phiên bản: PostgreSQL 16
   - Plan: `free` (vùng `oregon`)
2. **Backend Web Service:**
   - Tên dịch vụ: `devshare-backend`
   - Runtime: `node` (Render cung cấp binary `bun` tự động qua biến `BUN_VERSION: latest`)
   - Root Directory: `reddit_backend`
   - Lệnh Build: `bun install && bunx prisma generate`
   - Lệnh Start: `bunx prisma db push && bun run src/seed.ts && bun run src/index.ts`
   - Biến môi trường: Tự động trỏ `DATABASE_URL` từ `devshare-db`, tự động sinh chuỗi bí mật `JWT_SECRET`.
3. **Frontend Static Site:**
   - Tên dịch vụ: `devshare-frontend`
   - Runtime: `static` (Phân phối toàn cầu qua Render Edge CDN)
   - Root Directory: `reddit_frontend`
   - Lệnh Build: `npm install && npm run build`
   - Thư mục xuất bản tĩnh: `dist`
   - Định tuyến SPA: Tự động chuyển hướng toàn bộ đường dẫn `/*` về `/index.html` để không bị lỗi 404 khi người dùng tải lại trang.

---

## 2. QUY TRÌNH TRIỂN KHAI 1-CLICK TRÊN RENDER

1. **Đẩy mã nguồn lên GitHub:**
   ```bash
   git add .
   git commit -m "feat: complete project documentation and blueprint deployment"
   git push origin main
   ```

2. **Khởi tạo Blueprint trên Dashboard:**
   - Truy cập [Render Dashboard](https://dashboard.render.com/).
   - Nhấp vào nút **New +** ở góc trên cùng bên phải -> Chọn **Blueprint**.
   - Kết nối và chọn repository `FIRaci/devshare`.
   - Render sẽ tự động phân tích cú pháp tệp `render.yaml` và liệt kê 3 tài nguyên: `devshare-db`, `devshare-backend`, `devshare-frontend`.
   - Nhấp **Apply**.

3. **Vận hành tự động:**
   - Render sẽ tự động dựng cơ sở dữ liệu `devshare-db`.
   - Khi DB chuyển sang trạng thái `Available`, Web service `devshare-backend` sẽ khởi chạy, áp dụng lược đồ Prisma (`db push`) và nạp dữ liệu mẫu ban đầu (`src/seed.ts`).
   - Static Site `devshare-frontend` sẽ biên dịch và phát hành qua CDN tại địa chỉ:  
     👉 **`https://devshare-frontend.onrender.com`**

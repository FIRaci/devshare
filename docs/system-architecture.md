# HỆ THỐNG KIẾN TRÚC PHẦN MỀM (SYSTEM ARCHITECTURE - DEVSHARE)

> **Dự án:** DevShare Platform  
> **Kiến trúc:** Client-Server Monorepo / Decoupled Web & API Services  
> **Phiên bản:** 2.0.0

---

## 1. MÔ HÌNH KIẾN TRÚC TỔNG THỂ (C4 CONTAINER MODEL)

```mermaid
graph TD
    User["Người Dùng (Lập trình viên / Quản trị viên)"]
    
    subgraph Frontend ["Frontend Tier (Client App)"]
        ReactApp["React 19 SPA (Vite Bundler)<br/>• State Management (React Context)<br/>• Markdown & Media Renderers<br/>• Optimistic UI Updates"]
    end

    subgraph CDN ["Content Delivery Network"]
        RenderStatic["Render Global Edge CDN<br/>Static Assets (HTML/CSS/JS)"]
    end

    subgraph Backend ["Backend Tier (API Gateway & Core Logic)"]
        ElysiaApp["Elysia.js v1.4 on Bun Runtime<br/>• RESTful Endpoints Router<br/>• Rate Limiting & Auth Guard<br/>• OpenGraph Scraper & oEmbed<br/>• File Upload Processor"]
        InMemoryCache["In-Memory LRU Cache<br/>(Posts & Subreddits Feed Cache)"]
    end

    subgraph DatabaseTier ["Persistence Tier"]
        PrismaORM["Prisma ORM 7.x Data Access Layer<br/>(pg pool adapter)"]
        PostgresDB[("PostgreSQL 16 Managed DB<br/>• Relational Schema 3NF<br/>• CUID Keys & Cascade Integrity<br/>• Composite Unique Indexes")]
    end

    User -->|1. Tải trang web qua HTTPS| RenderStatic
    RenderStatic -->|Phục vụ bundle tĩnh| ReactApp
    ReactApp -->|2. Gọi REST API (Bearer JWT)| ElysiaApp
    ElysiaApp <-->|Kiểm tra & Cập nhật cache| InMemoryCache
    ElysiaApp -->|Thực thi truy vấn dữ liệu| PrismaORM
    PrismaORM <-->|Kết nối TCP qua DATABASE_URL| PostgresDB
```

---

## 2. CÁC TẦNG KIẾN TRÚC (ARCHITECTURAL LAYERS)

### 2.1. Tầng Trình Diễn (Presentation Layer - Frontend)
- **Công nghệ:** React 19, Vite, Framer Motion, Lucide Icons, React Hot Toast.
- **Vai trò:**
  - Định tuyến dựa trên Hash URL (`#/post/:id`) và các trạng thái Component View (Feed, PostDetail, ProfilePage, AuthPage).
  - Tích hợp kỹ thuật **Stale-While-Revalidate (SWR)** thông qua `sessionStorage` giúp tốc độ hiển thị feed tức thì ngay khi mở trang.
  - Quản lý trạng thái xác thực người dùng tập trung thông qua `AuthContext` (`user`, `login`, `register`, `logout`, `updateUser`).
  - Tự động bắt mã lỗi `401 Unauthorized` từ mọi lệnh gọi fetch để kích hoạt xóa phiên và đăng xuất người dùng an toàn.

### 2.2. Tầng Ứng Dụng & Dịch Vụ (Application & Service Layer - Backend)
- **Công nghệ:** Bun Runtime, Elysia.js, `@elysiajs/cors`, `@elysiajs/jwt`, `@elysiajs/static`.
- **Vai trò:**
  - Định tuyến các tài nguyên RESTful API: `/auth`, `/posts`, `/comments`, `/subreddits`, `/notifications`, `/reports`, `/upload`.
  - Kiểm soát bảo mật đầu vào: Lọc tần suất gọi API (Rate Limiting), xác thực chữ ký số JWT qua middleware `authGuard`.
  - Bộ bóc tách thông tin liên kết đa nền tảng (`link-preview-helper.ts`): Bóc tách thẻ meta OpenGraph, tích hợp oEmbed cho TikTok, YouTube, Twitter/X, Instagram.

### 2.3. Tầng Dữ Liệu & Lưu Trữ (Data Access & Persistence Layer)
- **Công nghệ:** Prisma ORM, `@prisma/adapter-pg`, PostgreSQL 16.
- **Vai trò:**
  - Trừu tượng hóa các câu lệnh SQL thông qua Prisma Client an toàn kiểu dữ liệu (Type-Safe).
  - Đảm bảo tính toàn vẹn dữ liệu thông qua Transaction (`db.$transaction`) cho các nghiệp vụ phức tạp như Upvote/Downvote và Subscription.
  - Tự động hóa quá trình đồng bộ lược đồ dữ liệu (`bunx prisma db push`) và nạp dữ liệu mẫu (`bun run src/seed.ts`) trong vòng đời khởi động của container.

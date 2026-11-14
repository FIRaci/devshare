# TỔNG KẾT DANH MỤC MÃ NGUỒN (CODEBASE SUMMARY - DEVSHARE)

> **Mô hình dự án:** Monorepo (Fullstack JavaScript/TypeScript)  
> **Cấu trúc thư mục:** `reddit_backend` (Backend API) & `reddit_frontend` (Client Web)

---

## 1. BẢN ĐỒ THƯ MỤC DỰ ÁN

```
d:\Test3\
├── reddit_backend/                 # Ứng dụng Backend API (Bun + Elysia + Prisma)
│   ├── prisma/
│   │   └── schema.prisma           # Định nghĩa cấu trúc lược đồ CSDL & Enums
│   ├── public/uploads/             # Thư mục lưu trữ tệp tin tải lên cục bộ
│   ├── src/
│   │   ├── routes/                 # Định tuyến các API Endpoints
│   │   │   ├── auth.ts             # Đăng ký, đăng nhập, lấy và sửa profile
│   │   │   ├── posts.ts            # CRUD bài viết, vote, lưu bài, note admin
│   │   │   ├── comments.ts         # CRUD bình luận, vote bình luận, reply
│   │   │   ├── subreddits.ts       # Quản lý cộng đồng, thành viên, moderator
│   │   │   ├── notifications.ts    # Danh sách thông báo, đánh dấu đã đọc
│   │   │   └── reports.ts          # Báo cáo vi phạm nội dung
│   │   ├── utils/
│   │   │   └── link-preview-helper.ts # Module bóc tách OpenGraph & oEmbed
│   │   ├── auth-guard.ts           # Middleware giải mã và xác thực Bearer JWT
│   │   ├── db.ts                   # Khởi tạo Prisma Client, pg pool, in-memory cache
│   │   ├── index.ts                # Điểm khởi chạy server chính, CORS, file upload
│   │   ├── rate-limiter.ts         # Giới hạn tần suất gọi API (In-memory token bucket)
│   │   ├── seed.ts                 # Script nạp dữ liệu mẫu ban đầu
│   │   └── url-validator.ts        # Module lọc URL hợp lệ, chống tấn công SSRF
│   ├── bun.lock                    # Khóa phiên bản gói phụ thuộc Bun
│   ├── package.json                # Khai báo thư viện và script backend
│   └── tsconfig.json               # Cấu hình TypeScript compiler
│
├── reddit_frontend/                # Ứng dụng Frontend Web (React 19 + Vite)
│   ├── public/                     # Tài nguyên tĩnh công khai (favicon, icons)
│   ├── src/
│   │   ├── api.js                  # Module gọi HTTP fetch, tự động gắn JWT token
│   │   ├── App.css                 # Toàn bộ CSS Stylesheet, biến màu sắc theme
│   │   ├── App.jsx                 # Component trung tâm quản lý view, feed, navbar
│   │   ├── AuthContext.jsx         # React Context cung cấp state phiên đăng nhập
│   │   ├── AuthPage.jsx            # Modal giao diện Đăng nhập / Đăng ký
│   │   ├── CommentComposer.jsx     # Trình soạn thảo bình luận Markdown
│   │   ├── CreatePostModal.jsx     # Modal soạn thảo bài viết phong phú đa file
│   │   ├── index.css               # Reset CSS và thiết lập font toàn cục
│   │   ├── Lightbox.jsx            # Xem ảnh phóng to toàn màn hình
│   │   ├── main.jsx                # Điểm gắn kết React vào DOM (#root)
│   │   ├── MarkdownRenderer.jsx    # Bộ giải mã và hiển thị văn bản Markdown
│   │   ├── MediaRenderer.jsx       # Bộ hiển thị lưới ảnh, video, embed link
│   │   ├── ProfilePage.jsx         # Trang hồ sơ cá nhân và quản lý bài đã lưu
│   │   └── UserAvatar.jsx          # Component hiển thị ảnh đại diện người dùng
│   ├── index.html                  # Khung HTML gốc của Single Page App
│   ├── package.json                # Khai báo thư viện và script frontend
│   └── vite.config.js              # Cấu hình Vite bundler & React plugin
│
├── docs/                           # Tài liệu kỹ thuật, báo cáo bộ môn & đồ án
│   ├── academic-project-report.md  # Báo cáo học thuật chi tiết cho bộ môn
│   ├── database-documentation.md   # Tài liệu chi tiết CSDL, ERD, Data Dictionary
│   ├── security-and-business-audit.md # Báo cáo kiểm toán bảo mật & logic nghiệp vụ
│   ├── testing-and-dom-scan-report.md # Báo cáo kiểm thử & quét DOM Playwright
│   ├── project-roadmap.md          # Lộ trình phát triển & các tính năng cần thêm
│   ├── system-architecture.md      # Tài liệu kiến trúc hệ thống C4
│   ├── project-overview-pdr.md     # Báo cáo định nghĩa sản phẩm PDR
│   ├── codebase-summary.md         # Bản tóm tắt mã nguồn toàn dự án
│   ├── code-standards.md           # Quy chuẩn viết mã và quy ước phát triển
│   ├── design-guidelines.md        # Hướng dẫn thiết kế giao diện UI/UX
│   └── deployment-guide.md         # Hướng dẫn triển khai Blueprint lên Cloud Render
│
├── docker-compose.yml              # Cấu hình container PostgreSQL chạy tại Local
├── render.yaml                     # Render Infrastructure as Code Blueprint
├── .gitignore                      # Cấu hình loại trừ file rác trong Git
└── README.md                       # Hướng dẫn khởi chạy nhanh dự án
```

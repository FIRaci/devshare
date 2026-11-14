# QUY CHUẨN MÃ NGUỒN & TIÊU CHUẨN KỸ THUẬT (CODE STANDARDS - DEVSHARE)

---

## 1. QUY ƯỚC ĐẶT TÊN (NAMING CONVENTIONS)

1. **Thư mục & Tệp tin:**
   - Sử dụng `kebab-case` cho các tệp script và helper (`link-preview-helper.ts`, `rate-limiter.ts`, `url-validator.ts`).
   - Sử dụng `PascalCase` cho các React Component (`CreatePostModal.jsx`, `MarkdownRenderer.jsx`, `UserAvatar.jsx`).
   - Sử dụng `camelCase` cho các hàm tiện ích (`api.js`, `fetchLinkPreview`).
2. **Biến & Hàm:**
   - Biến và hàm thông thường: `camelCase` (ví dụ: `fetchPosts`, `currentUser`, `isSaved`).
   - Hằng số môi trường và cấu hình tĩnh: `UPPER_SNAKE_CASE` (ví dụ: `MAX_FILE_SIZE`, `JWT_SECRET`, `ALLOWED_MIME_PREFIXES`).
3. **Cơ sở dữ liệu (Prisma Schema):**
   - Tên Model: `PascalCase` ở dạng số ít (`User`, `Subreddit`, `Post`, `Comment`, `Vote`).
   - Tên trường trong bảng: `camelCase` (`authorId`, `subredditId`, `avatarColor`, `createdAt`).
   - Tên Enum: `PascalCase` cho tên enum (`Role`, `VoteType`), và `UPPER_SNAKE_CASE` cho các giá trị (`USER`, `ADMIN`, `UP`, `DOWN`).

---

## 2. QUY CHUẨN THIẾT KẾ BACKEND (API DESIGN)

1. **RESTful Resource URI Standards:**
   - Luôn sử dụng danh từ số nhiều cho tài nguyên: `/posts`, `/comments`, `/subreddits`.
   - Các hành động tương tác phụ phụ thuộc: `/posts/:id/vote`, `/posts/:id/save`, `/subreddits/:name/join`.
2. **Xác thực dữ liệu đầu vào (Input Validation):**
   - Mọi request `POST` / `PATCH` bắt buộc phải có schema TypeBox (`t.Object`) kiểm tra định dạng, độ dài chuỗi tối thiểu/tối đa.
3. **Quản lý mã lỗi HTTP chuẩn mực:**
   - `200 OK`: Thành công với dữ liệu trả về.
   - `400 Bad Request`: Dữ liệu đầu vào sai định dạng hoặc vi phạm ràng buộc nghiệp vụ.
   - `401 Unauthorized`: Chưa cung cấp Bearer token hoặc token không hợp lệ.
   - `403 Forbidden`: Người dùng không có quyền hạn đối với tài nguyên (ví dụ: xóa bài viết của người khác).
   - `404 Not Found`: Tài nguyên không tồn tại.
   - `429 Too Many Requests`: Vượt quá giới hạn tần suất gọi API.
   - `500 Internal Server Error`: Lỗi phát sinh ngoài dự kiến phía server.

---

## 3. QUY CHUẨN PHÁT TRIỂN FRONTEND (REACT STANDARDS)

1. **State Management & Data Flow:**
   - Hạn chế tối đa việc re-render không cần thiết thông qua `useCallback` và `useRef`.
   - Áp dụng kỹ thuật **Optimistic UI**: Thay đổi trạng thái hiển thị của icon và số điểm ngay lập tức trước khi gọi fetch, khôi phục lại trạng thái cũ nếu API báo lỗi.
2. **Xử lý An toàn XSS:**
   - Tuyệt đối không dùng `dangerouslySetInnerHTML` với nội dung thô từ người dùng.
   - Mọi liên kết do người dùng chèn đều phải được kiểm tra qua regex `^(https?:\/\/)` và bắt buộc có thuộc tính `rel="noreferrer" target="_blank"`.
   - Khi nhúng thẻ nhúng đa phương tiện (Embed), bắt buộc sử dụng thẻ `iframe` có thuộc tính `sandbox="allow-scripts allow-presentation"`.

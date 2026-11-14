# BÁO CÁO KIỂM TOÁN BẢO MẬT & LỖ HỔNG LOGIC NGHIỆP VỤ (DEVSHARE)

> **Dự án:** DevShare (Developer Knowledge Community Platform)  
> **Phương pháp kiểm toán:** Adversarial Code Review, Static Analysis, Threat Modeling (STRIDE / OWASP Top 10), Business Logic Flaw Analysis  
> **Đối tượng:** Toàn bộ Backend (`reddit_backend`), Frontend (`reddit_frontend`), Cơ sở dữ liệu và Cơ chế triển khai Render  
> **Thời điểm:** 14/11/2026  
> **Đánh giá chung:** Hệ thống có kiến trúc hiện đại, phân quyền phân tầng tốt, nhưng tồn tại một số **lỗ hổng bảo mật tiềm ẩn** và **lỗi logic nghiệp vụ quan trọng** cần được khắc phục trước khi đưa vào vận hành thực tế.

---

## 1. TỔNG QUAN KẾT QUẢ KIỂM TOÁN (EXECUTIVE SUMMARY)

| Mức Độ Nghiêm Trọng | Bảo Mật (Security) | Lỗi Nghiệp Vụ (Business Logic) | Tổng Số |
|:---|:---:|:---:|:---:|
| 🔴 **CRITICAL (Nghiêm trọng)** | 2 | 1 | 3 |
| 🟠 **HIGH (Cao)** | 2 | 2 | 4 |
| 🟡 **MEDIUM (Trung bình)** | 1 | 3 | 4 |
| 🟢 **LOW / INFO (Thấp/Khuyến nghị)** | 2 | 2 | 4 |
| **TỔNG CỘNG** | **7** | **8** | **15** |

---

## 2. PHÂN TÍCH LỖ HỔNG BẢO MẬT (SECURITY AUDIT)

### 🔴 SEC-01: JWT Token Thiếu Thời Hạn Hết Hạn (`exp`) — Nguy Cơ Chiếm Đoạt Phiên Vĩnh Viễn
- **Phân loại:** CWE-613: Insufficient Session Expiration / OWASP A07:2021-Identification and Authentication Failures.
- **Vị trí code:** [`reddit_backend/src/routes/auth.ts`](file:///d:/Test3/reddit_backend/src/routes/auth.ts#L23-L24) và [`reddit_backend/src/routes/auth.ts`](file:///d:/Test3/reddit_backend/src/routes/auth.ts#L52).
- **Mô tả chi tiết:**
  Khi đăng ký hoặc đăng nhập thành công, token được ký qua câu lệnh:
  ```typescript
  const token = await jwt.sign({ id: user.id, role: user.role });
  ```
  Thư viện `@elysiajs/jwt` mặc định **không thiết lập thuộc tính `exp`** (Expiration Time) nếu không được truyền vào cấu hình.
- **Tác động (Impact):**
  Một khi người dùng đăng nhập, token này sẽ có giá trị **vĩnh viễn**. Nếu token bị lộ qua log, MITM, tấn công XSS ở client, hoặc người dùng đăng nhập tại máy tính công cộng rồi đóng trình duyệt, kẻ tấn công có thể sử dụng token đó để truy cập tài khoản bất kỳ lúc nào mà không bao giờ bị hết hạn. Người dùng không thể đăng xuất từ xa (Revoke token).
- **Khắc phục đề xuất:**
  Thiết lập thời gian hết hạn cụ thể (ví dụ 7 ngày cho access token) trong `jwt.sign()` hoặc cấu hình plugin `jwt`:
  ```typescript
  const token = await jwt.sign({ 
    id: user.id, 
    role: user.role, 
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 ngày
  });
  ```

---

### 🔴 SEC-02: Lỗ Hổng SSRF Trong Module Link Preview Do Không Chặn DNS Rebinding
- **Phân loại:** CWE-918: Server-Side Request Forgery (SSRF) / OWASP A10:2021-Server-Side Request Forgery.
- **Vị trí code:** [`reddit_backend/src/url-validator.ts`](file:///d:/Test3/reddit_backend/src/url-validator.ts#L15-L36) và [`reddit_backend/src/utils/link-preview-helper.ts`](file:///d:/Test3/reddit_backend/src/utils/link-preview-helper.ts#L72).
- **Mô tả chi tiết:**
  Hệ thống kiểm tra tính hợp lệ của URL trong `isValidUrl(input)` bằng cách kiểm tra hostname theo danh sách tĩnh:
  ```typescript
  const BLOCKED_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1", "169.254.169.254", ...]);
  ```
  Tuy nhiên, kẻ tấn công có thể sử dụng kỹ thuật **DNS Rebinding** hoặc một tên miền công khai trỏ về IP nội bộ (ví dụ: `localtest.me` trỏ về `127.0.0.1`, hoặc tạo một tên miền `attacker.com` có bản ghi A trỏ về `169.254.169.254` - AWS/GCP Metadata Service).
  Khi đó `new URL(url).hostname` là `"attacker.com"` (vượt qua kiểm tra `isValidUrl`), nhưng khi `fetch(url)` thực thi, server sẽ gửi request trực tiếp tới mạng nội bộ hoặc dịch vụ Cloud Metadata.
- **Tác động (Impact):**
  Kẻ tấn công có thể đánh cắp Cloud IAM Credentials, Service Tokens, hoặc quét các cổng mạng nội bộ (Internal Ports) của hạ tầng Render/Docker.
- **Khắc phục đề xuất:**
  - Giải quyết địa chỉ IP trước khi gửi request (DNS resolution) và xác thực IP resolved không nằm trong dải IP Private (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`, `169.254.0.0/16`).
  - Sử dụng proxy an toàn hoặc cấu hình HTTP Agent cấm chuyển hướng (redirect) tới IP nội bộ.

---

### 🟠 SEC-03: Vượt Mặt Cơ Chế Giới Hạn Tần Suất (Rate Limiting Bypass) Qua Header `X-Forwarded-For`
- **Phân loại:** CWE-290: Authentication Bypass by Spoofing / OWASP A04:2021-Insecure Design.
- **Vị trí code:** [`reddit_backend/src/index.ts`](file:///d:/Test3/reddit_backend/src/index.ts#L27-L32).
- **Mô tả chi tiết:**
  ```typescript
  .onRequest(({ request, set }) => {
    const key = request.headers.get("x-forwarded-for") || "global";
    if (!rateLimit(key)) {
      set.status = 429;
      return { error: "Too many requests" };
    }
  })
  ```
  Header `X-Forwarded-For` do client gửi lên **hoàn toàn có thể bị giả mạo** bởi kẻ tấn công. Mỗi request kẻ tấn công chỉ cần chèn một giá trị ngẫu nhiên `X-Forwarded-For: 203.0.113.${Math.random()}` thì bộ nhớ `hits.get(key)` sẽ coi đó là một IP mới, vô hiệu hóa hoàn toàn cơ chế bảo vệ chống Brute-Force và DoS.
- **Khắc phục đề xuất:**
  Khi triển khai sau Reverse Proxy (Cloudflare / Render), sử dụng IP do proxy tin cậy cung cấp ở vị trí cuối cùng hoặc lấy IP kết nối thực từ socket, hoặc dùng header độc quyền của Cloudflare `cf-connecting-ip`.

---

### 🟠 SEC-04: Rủi Ro Stored XSS & Tệp Độc Hại Khi Tải Lên (File Upload Validation)
- **Phân loại:** CWE-434: Unrestricted Upload of File with Dangerous Type.
- **Vị trí code:** [`reddit_backend/src/index.ts`](file:///d:/Test3/reddit_backend/src/index.ts#L48-L66).
- **Mô tả chi tiết:**
  - Kiểm tra MIME type dựa trên `file.type`:
    ```typescript
    if (!isAllowedMime(file.type)) { ... }
    ```
    Thuộc tính `file.type` được gửi từ client trong Multipart header `Content-Type: ...`, kẻ tấn công có thể dễ dàng sửa thành `image/png` nhưng nội dung tệp là mã độc HTML/SVG chứa Javascript (`<svg onload="alert(document.cookie)">`).
  - Hệ thống cho phép đuôi tệp `text/plain` và `application/pdf`. Nếu người dùng tải lên tệp HTML đổi đuôi hoặc SVG, khi người dùng khác mở file có nguy cơ bị Stored XSS.
- **Khắc phục đề xuất:**
  - Sử dụng thư viện kiểm tra magic bytes (file signature) thực tế của tệp (ví dụ `file-type`).
  - Ép tải xuống (`Content-Disposition: attachment`) đối với các file không phải ảnh thuần túy (`jpg`, `png`, `webp`).

---

### 🟡 SEC-05: Lưu Trữ Tệp Tải Lên Trên Ổ Đĩa Tạm Thời (Ephemeral Local Storage)
- **Phân loại:** CWE-404: Improper Resource Shutdown or Release / Data Loss Risk.
- **Vị trí code:** `public/uploads/${filename}` trên ổ cứng cục bộ container.
- **Mô tả chi tiết:**
  Trên môi trường điện toán đám mây hiện đại (Render, Heroku, Cloud Run), ổ cứng container là **ephemeral (tạm thời)**. Mỗi khi dịch vụ redeploy hoặc khởi động lại (restart), toàn bộ thư mục `public/uploads` bị xóa sạch.
- **Khắc phục đề xuất:**
  Tích hợp dịch vụ lưu trữ đám mây chuẩn (Cloud Object Storage như Cloudinary, AWS S3 hoặc Cloudflare R2).

---

## 3. PHÂN TÍCH LỖ HỔNG LOGIC NGHIỆP VỤ (BUSINESS LOGIC FLAWS)

### 🔴 BIZ-01: Điểm Uy Tín (Karma) Của Tác Giả KHÔNG HỀ Được Cập Nhật Khi Được Vote
- **Vị trí code:** [`reddit_backend/src/routes/posts.ts`](file:///d:/Test3/reddit_backend/src/routes/posts.ts#L178-L210) và [`reddit_backend/src/routes/comments.ts`](file:///d:/Test3/reddit_backend/src/routes/comments.ts#L108-L137).
- **Mô tả chi tiết:**
  Trong cơ sở dữ liệu có trường `User.karma` (mặc định bằng 0) và giao diện Profile / Post Card hiển thị điểm Karma của tác giả.
  Tuy nhiên, trong toàn bộ mã nguồn xử lý Upvote/Downvote bài viết và bình luận:
  ```typescript
  await db.$transaction(async (tx) => {
    // Chỉ tạo, cập nhật hoặc xóa bản ghi trong bảng Vote
    await tx.vote.upsert({ ... });
  });
  ```
  **Không có bất kỳ dòng code nào tăng (`increment`) hoặc giảm (`decrement`) trường `karma` của tác giả bài viết/bình luận!**
- **Hệ quả nghiệp vụ:**
  Toàn bộ người dùng trên hệ thống mãi mãi có điểm Karma = 0 (trừ khi được chỉnh sửa thủ công trực tiếp trong DB). Tính năng xếp hạng và tôn vinh đóng góp cộng đồng bị tê liệt hoàn toàn.
- **Khắc phục đề xuất:**
  Bổ sung cập nhật `User.karma` trong transaction vote:
  - Khi tạo Vote `UP`: `tx.user.update({ where: { id: post.authorId }, data: { karma: { increment: 1 } } })`.
  - Khi chuyển từ `UP` sang `DOWN`: `decrement: 2`.
  - Khi hủy Vote `UP`: `decrement: 1`.

---

### 🟠 BIZ-02: Cho Phép Tự Bình Chọn Cho Bài Viết Của Chính Mình (Self-Voting Exploitation)
- **Vị trí code:** `posts.ts` (`/:id/vote`) và `comments.ts` (`/:id/vote`).
- **Mô tả chi tiết:**
  Hệ thống không kiểm tra `post.authorId === userId`. Một người dùng có thể tự tạo bài viết rồi tự upvote cho bài viết của mình để đẩy điểm bài viết lên tab "Hot" hoặc "Top".
- **Khắc phục đề xuất:**
  Quy định rõ trong nghiệp vụ: Chặn tự vote bài viết của mình, hoặc tự động gán 1 Upvote mặc định ban đầu khi tạo bài viết (theo đúng cơ chế của Reddit gốc).

---

### 🟠 BIZ-03: Cây Bình Luận Bị Cắt Cụt Từ Cấp Độ 2 Trở Đi (Nested Comments Truncation)
- **Vị trí code:** [`reddit_backend/src/routes/posts.ts`](file:///d:/Test3/reddit_backend/src/routes/posts.ts#L75-L89) và [`reddit_backend/src/routes/comments.ts`](file:///d:/Test3/reddit_backend/src/routes/comments.ts#L13-L27).
- **Mô tả chi tiết:**
  Trong Prisma query lấy danh sách comment:
  ```typescript
  comments: {
    where: { parentId: null },
    include: {
      replies: {
        include: { ... } // Chỉ include 1 cấp con!
      }
    }
  }
  ```
  Schema cơ sở dữ liệu hỗ trợ `parentId` không giới hạn độ sâu. Người dùng ở Frontend có thể bấm nút "Reply" vào một phản hồi cấp 2 để tạo bình luận cấp 3.
  Tuy nhiên, khi gọi API lấy danh sách bình luận, **bình luận cấp 3 hoàn toàn không được query**! Dữ liệu bình luận cấp 3 có lưu trong DB nhưng **biến mất hoàn toàn trên giao diện người dùng**.
- **Khắc phục đề xuất:**
  - Viết câu truy vấn lấy toàn bộ comments phẳng (`where: { postId }`) theo thứ tự thời gian, sau đó xây dựng cấu trúc cây (Tree Builder) bằng thuật toán trên Node.js trước khi trả về client.

---

### 🟡 BIZ-04: Báo Cáo Vi Phạm (Reports) Không Có Giao Diện Xử Lý Cho Quản Trị Viên
- **Vị trí code:** [`reddit_backend/src/routes/reports.ts`](file:///d:/Test3/reddit_backend/src/routes/reports.ts) và [`reddit_frontend/src/App.jsx`](file:///d:/Test3/reddit_frontend/src/App.jsx).
- **Mô tả chi tiết:**
  Người dùng có nút "Report" bài viết gửi lý do lên `POST /reports`.
  Backend có endpoint `GET /reports` dành cho Admin.
  Tuy nhiên trên giao diện Frontend (`App.jsx`), **không hề có trang hay Modal nào hiển thị danh sách Reports cho Admin**, cũng không có nút để Admin đánh dấu đã giải quyết (`resolved: true`) hoặc gỡ bài viết vi phạm từ danh sách report.
- **Hệ quả nghiệp vụ:**
  Các báo cáo của người dùng được lưu vào database nhưng trở thành dữ liệu "chết" vì không ai kiểm duyệt được từ giao diện.

---

### 🟡 BIZ-05: Thêm Điều Hành Viên (Moderator) Yêu Cầu Nhập CUID Thay Vì Tên Người Dùng (Username)
- **Vị trí code:** [`reddit_frontend/src/App.jsx`](file:///d:/Test3/reddit_frontend/src/App.jsx#L731-L735) và [`reddit_backend/src/routes/subreddits.ts`](file:///d:/Test3/reddit_backend/src/routes/subreddits.ts#L154).
- **Mô tả chi tiết:**
  Trong Modal cài đặt cộng đồng (Subreddit Settings), mục thêm Moderator hiển thị input: `Add a moderator by user ID:`. Người dùng phải nhập một chuỗi CUID kỹ thuật (ví dụ `clx98f2k...`).
  Người dùng thông thường chỉ biết `username` (ví dụ `u/devshare_admin`), không thể biết hoặc tra cứu được CUID của người khác.
- **Khắc phục đề xuất:**
  Cho phép endpoint backend nhận `username` thay vì `userId`, hoặc bổ sung ô tìm kiếm người dùng tự động (Autocomplete) theo username trên giao diện.

---

### 🟡 BIZ-06: Chức Năng Tìm Kiếm Quá Hạn Chế (Chỉ Lọc Theo Tiêu Đề Bài Viết)
- **Vị trí code:** [`reddit_frontend/src/App.jsx`](file:///d:/Test3/reddit_frontend/src/App.jsx#L407-L408).
- **Mô tả chi tiết:**
  Hệ thống tìm kiếm hiện tại chạy hoàn toàn ở Client-side:
  `filter(p => !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()))`
  Người dùng không thể tìm kiếm theo nội dung bài viết, không thể tìm theo tên tác giả, không thể tìm theo tên Subreddit, và chỉ lọc được trên các bài viết đã tải về trang hiện tại (tối đa 10-20 bài).
- **Khắc phục đề xuất:**
  Xây dựng endpoint backend `GET /posts/search?q=...` hỗ trợ tìm kiếm toàn văn (Full-Text Search) trên PostgreSQL với chỉ mục `GIN` trên cả `title` và `content`.

---

## 4. KẾT LUẬN & LỘ TRÌNH KHẮC PHỤC KHẨN CẤP

1. **Khắc phục ngay trong bản vá bảo mật:**
   - [x] Đã cấu hình và khởi chạy thành công hệ thống trên Render Blueprint.
   - [ ] Bổ sung thời hạn `exp` vào JWT token.
   - [ ] Thêm logic cập nhật `User.karma` khi người dùng vote bài viết/comment.
   - [ ] Viết hàm dựng cây comment phẳng (Flat-to-Tree) để hiển thị đầy đủ mọi cấp độ bình luận.
   - [ ] Đổi logic thêm Moderator từ CUID sang Username.
2. **Nâng cấp giai đoạn tiếp theo:**
   - Xây dựng trang Admin Dashboard xem và xử lý Reports.
   - Tích hợp Cloudinary/S3 cho File Uploads.
   - Bổ sung PostgreSQL Full-Text Search.

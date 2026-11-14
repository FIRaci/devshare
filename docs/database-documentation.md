# BÁO CÁO THIẾT KẾ & TÀI LIỆU CƠ SỞ DỮ LIỆU TOÀN DIỆN (DEVSHARE)

> **Dự án:** DevShare Platform (Reddit-like Developer Knowledge Community)  
> **Hệ quản trị CSDL:** PostgreSQL 16 (Render Managed / Containerized Docker)  
> **ORM Framework:** Prisma ORM 7.x (`@prisma/client`, `@prisma/adapter-pg`)  
> **Ngày lập:** 14/11/2026  
> **Phiên bản:** 2.0.0 (Production Blueprint Ready)

---

## 1. TỔNG QUAN HỆ THỐNG CƠ SỞ DỮ LIỆU

Hệ thống cơ sở dữ liệu DevShare được xây dựng trên nền tảng **PostgreSQL 16**, hướng đến việc quản lý nội dung cộng đồng (forum/social discussion) theo cấu trúc phi tập trung dựa trên cộng đồng (Subreddits). Mô hình dữ liệu kết hợp giữa chuẩn hóa quan hệ (Relational RDBMS - 3NF) và tính linh hoạt của cấu trúc dữ liệu bán cấu trúc (JSONB attachments, previews) nhằm tối ưu hiệu năng đọc/ghi các nội dung rich-media (code snippets, embeds, images, videos).

### Các đặc tính cốt lõi:
- **Chuẩn hóa quan hệ (3NF):** Tách bạch rõ ràng giữa thực thể người dùng (`User`), cộng đồng (`Subreddit`), bài đăng (`Post`), bình luận phân cấp (`Comment`), bình chọn (`Vote`), báo cáo (`Report`), thông báo (`Notification`) và đánh dấu (`Bookmark`).
- **Phân cấp dữ liệu (Recursive Hierarchy):** Bảng `Comment` hỗ trợ mô hình cây tự tham chiếu (`parentId` trỏ về `Comment.id`) để biểu diễn cấu trúc phản hồi dạng lồng nhau (threaded replies).
- **Composite Unique Keys:** Đảm bảo toàn vẹn dữ liệu ở cấp độ schema đối với hành vi vote (`[userId, postId]`, `[userId, commentId]`) và subscription (`[userId, subredditId]`), ngăn chặn triệt để tình trạng duplicate vote hoặc duplicate subscribe ở mức phần cứng/database.
- **Cascade Deletion:** Thiết lập ràng buộc `onDelete: Cascade` cho các thực thể con (Posts, Comments, Votes, Subscriptions, Bookmarks) khi thực thể cha bị xóa, giúp duy trì tính nhất quán mà không để lại dữ liệu mồ côi (orphaned records).

---

## 2. SƠ ĐỒ THỰC THỂ MỐI QUAN HỆ (ENTITY-RELATIONSHIP DIAGRAM - ERD)

```mermaid
erDiagram
    User ||--o{ Post : "authors"
    User ||--o{ Comment : "writes"
    User ||--o{ Vote : "casts"
    User ||--o{ Subscription : "subscribes_to"
    User ||--o{ Bookmark : "saves"
    User ||--o{ Report : "reports"
    User ||--o{ Subreddit : "creates"
    User }o--o{ Subreddit : "moderates"
    User ||--o{ Notification : "receives"
    User ||--o{ Notification : "triggers"

    Subreddit ||--o{ Post : "contains"
    Subreddit ||--o{ Subscription : "has_subscribers"

    Post ||--o{ Comment : "has_comments"
    Post ||--o{ Vote : "receives_votes"
    Post ||--o{ Bookmark : "is_bookmarked"
    Post ||--o{ Notification : "referenced_in"

    Comment ||--o{ Comment : "replies_to"
    Comment ||--o{ Vote : "receives_votes"
    Comment ||--o{ Notification : "referenced_in"

    User {
        string id PK "cuid()"
        string username UK "unique, 3-20 chars"
        string email UK "unique, email format"
        string password "hashed string"
        enum role "USER | ADMIN"
        string bio "default ''"
        string avatarColor "HEX color, default #5C7CFA"
        string avatarUrl "nullable"
        string bannerUrl "nullable"
        int karma "default 0"
        datetime createdAt "default now()"
        datetime updatedAt "auto update"
    }

    Subreddit {
        string id PK "cuid()"
        string name UK "unique, 3-21 chars"
        string description "nullable"
        datetime createdAt "default now()"
        datetime updatedAt "auto update"
        string creatorId FK "nullable, User.id"
    }

    Post {
        string id PK "cuid()"
        string title "not null, min 1"
        string content "markdown text, nullable"
        string mediaUrl "legacy single media, nullable"
        string mediaType "IMAGE | VIDEO, nullable"
        json attachments "rich attachments array, nullable"
        json linkPreview "rich preview payload, nullable"
        string communityNote "admin note, nullable"
        datetime createdAt "default now()"
        datetime updatedAt "auto update"
        string authorId FK "User.id (Cascade)"
        string subredditId FK "Subreddit.id (Cascade)"
    }

    Comment {
        string id PK "cuid()"
        string content "markdown text, not null"
        string mediaUrl "legacy, nullable"
        string mediaType "legacy, nullable"
        json attachments "rich attachments, nullable"
        datetime createdAt "default now()"
        datetime updatedAt "auto update"
        string authorId FK "User.id (Cascade)"
        string postId FK "Post.id (Cascade)"
        string parentId FK "Comment.id (Cascade, nullable)"
    }

    Vote {
        string id PK "cuid()"
        enum type "UP | DOWN"
        datetime createdAt "default now()"
        string userId FK "User.id (Cascade)"
        string postId FK "Post.id (Cascade, nullable)"
        string commentId FK "Comment.id (Cascade, nullable)"
    }

    Subscription {
        string userId PK_FK "User.id (Cascade)"
        string subredditId PK_FK "Subreddit.id (Cascade)"
        datetime createdAt "default now()"
    }

    Bookmark {
        string userId PK_FK "User.id (Cascade)"
        string postId PK_FK "Post.id (Cascade)"
        datetime createdAt "default now()"
    }

    Notification {
        string id PK "cuid()"
        enum type "POST_IN_SUBREDDIT | COMMENT_ON_POST | REPLY_TO_COMMENT"
        boolean isRead "default false"
        datetime createdAt "default now()"
        string userId FK "User.id (Cascade)"
        string actorId FK "User.id (SetNull, nullable)"
        string postId "reference id, nullable"
        string commentId "reference id, nullable"
        string subredditId "reference id, nullable"
    }

    Report {
        string id PK "cuid()"
        string targetId "Post ID or Comment ID"
        string type "'POST' | 'COMMENT'"
        string reason "not null"
        boolean resolved "default false"
        datetime createdAt "default now()"
        string reporterId FK "User.id"
    }
```

---

## 3. DATA DICTIONARY (TỪ ĐIỂN DỮ LIỆU CHI TIẾT)

### 3.1. Bảng `User` (Tài khoản người dùng)
Quản trị định danh người dùng, thông tin xác thực, vai trò hệ thống và hồ sơ cá nhân.

| Tên Cột | Kiểu Dữ Liệu | Khóa | Cho Phép NULL | Mặc Định | Ràng Buộc / Mô Tả |
|:---|:---|:---:|:---:|:---|:---|
| `id` | `VARCHAR(30)` | **PK** | KHÔNG | `cuid()` | Định danh người dùng ngẫu nhiên dạng CUID |
| `username` | `VARCHAR(20)` | **UK** | KHÔNG | - | Tên đăng nhập duy nhất (3-20 ký tự, regex kiểm tra) |
| `email` | `VARCHAR(255)`| **UK** | KHÔNG | - | Địa chỉ email duy nhất của người dùng |
| `password` | `VARCHAR(255)`| - | KHÔNG | - | Mật khẩu đã được mã hóa an toàn (Bun.password hash) |
| `role` | `Role` (Enum) | - | KHÔNG | `'USER'` | Quyền hạn: `USER` hoặc `ADMIN` |
| `bio` | `TEXT` | - | CÓ | `''` | Tiểu sử tự giới thiệu của người dùng |
| `avatarColor` | `VARCHAR(20)` | - | CÓ | `'#5C7CFA'` | Mã màu đại diện mặc định dạng Hex code |
| `avatarUrl` | `VARCHAR(1000)`| - | CÓ | `NULL` | Đường dẫn ảnh đại diện cá nhân hóa |
| `bannerUrl` | `VARCHAR(1000)`| - | CÓ | `NULL` | Đường dẫn ảnh bìa trang cá nhân |
| `karma` | `INTEGER` | - | KHÔNG | `0` | Điểm uy tín người dùng tích lũy từ lượt bình chọn |
| `createdAt` | `TIMESTAMP(3)`| - | KHÔNG | `now()` | Thời điểm tạo tài khoản |
| `updatedAt` | `TIMESTAMP(3)`| - | KHÔNG | `now()` | Thời điểm cập nhật thông tin gần nhất |

---

### 3.2. Bảng `Subreddit` (Cộng đồng chuyên đề)
Quản lý các cộng đồng lập trình viên (tương đương kênh/phân mục subreddit).

| Tên Cột | Kiểu Dữ Liệu | Khóa | Cho Phép NULL | Mặc Định | Ràng Buộc / Mô Tả |
|:---|:---|:---:|:---:|:---|:---|
| `id` | `VARCHAR(30)` | **PK** | KHÔNG | `cuid()` | Khóa chính CUID |
| `name` | `VARCHAR(21)` | **UK** | KHÔNG | - | Tên định danh cộng đồng duy nhất (3-21 ký tự, không dấu cách) |
| `description` | `TEXT` | - | CÓ | `NULL` | Mô tả mục tiêu, quy định cộng đồng |
| `creatorId` | `VARCHAR(30)` | **FK** | CÓ | `NULL` | Tham chiếu tới `User.id` (Người sáng lập cộng đồng) |
| `createdAt` | `TIMESTAMP(3)`| - | KHÔNG | `now()` | Thời điểm thành lập cộng đồng |
| `updatedAt` | `TIMESTAMP(3)`| - | KHÔNG | `now()` | Thời điểm sửa đổi thông tin cộng đồng |

*Bảng liên kết n-n qua Prisma:*
- `_SubredditModerators`: Quản lý danh sách điều hành viên (`A: Subreddit.id`, `B: User.id`).

---

### 3.3. Bảng `Post` (Bài viết / Thảo luận)
Thực thể trung tâm chứa nội dung kỹ thuật, tài liệu, liên kết và đa phương tiện.

| Tên Cột | Kiểu Dữ Liệu | Khóa | Cho Phép NULL | Mặc Định | Ràng Buộc / Mô Tả |
|:---|:---|:---:|:---:|:---|:---|
| `id` | `VARCHAR(30)` | **PK** | KHÔNG | `cuid()` | Khóa chính CUID |
| `title` | `VARCHAR(300)`| - | KHÔNG | - | Tiêu đề bài viết (tối thiểu 1 ký tự) |
| `content` | `TEXT` | - | CÓ | `NULL` | Nội dung văn bản định dạng Markdown |
| `mediaUrl` | `VARCHAR(1000)`| - | CÓ | `NULL` | Đường dẫn file media đơn (kế thừa từ phiên bản cũ) |
| `mediaType` | `VARCHAR(50)` | - | CÓ | `NULL` | Kiểu media cũ: `'IMAGE'`, `'VIDEO'` |
| `attachments` | `JSONB` | - | CÓ | `NULL` | Danh sách tệp đính kèm phong phú (JSON Array) |
| `linkPreview` | `JSONB` | - | CÓ | `NULL` | Dữ liệu trích xuất OpenGraph & oEmbed của URL |
| `communityNote` | `TEXT` | - | CÓ | `NULL` | Ghi chú đính kèm từ Ban quản trị (Admin note) |
| `authorId` | `VARCHAR(30)` | **FK** | KHÔNG | - | Tham chiếu `User.id` (`onDelete: Cascade`) |
| `subredditId` | `VARCHAR(30)` | **FK** | KHÔNG | - | Tham chiếu `Subreddit.id` (`onDelete: Cascade`) |
| `createdAt` | `TIMESTAMP(3)`| - | KHÔNG | `now()` | Thời điểm tạo bài viết |
| `updatedAt` | `TIMESTAMP(3)`| - | KHÔNG | `now()` | Thời điểm cập nhật bài viết |

*Cấu trúc JSON Schema của `attachments`:*
```json
[
  {
    "type": "IMAGE | VIDEO | FILE | LINK",
    "url": "https://...",
    "name": "example.png",
    "size": 1048576,
    "linkPreview": {
      "title": "OpenGraph Title",
      "description": "Snippet...",
      "image": "https://...",
      "siteName": "GitHub"
    }
  }
]
```

---

### 3.4. Bảng `Comment` (Bình luận & Thảo luận phân cấp)
Hỗ trợ thảo luận đa cấp độ theo dạng cây (Adjacency List Model).

| Tên Cột | Kiểu Dữ Liệu | Khóa | Cho Phép NULL | Mặc Định | Ràng Buộc / Mô Tả |
|:---|:---|:---:|:---:|:---|:---|
| `id` | `VARCHAR(30)` | **PK** | KHÔNG | `cuid()` | Khóa chính CUID |
| `content` | `TEXT` | - | KHÔNG | - | Nội dung bình luận định dạng Markdown |
| `mediaUrl` | `VARCHAR(1000)`| - | CÓ | `NULL` | File media đơn lẻ (kế thừa) |
| `mediaType` | `VARCHAR(50)` | - | CÓ | `NULL` | Phân loại media cũ |
| `attachments` | `JSONB` | - | CÓ | `NULL` | Danh sách tệp đính kèm |
| `authorId` | `VARCHAR(30)` | **FK** | KHÔNG | - | Người viết bình luận (`User.id`, `Cascade`) |
| `postId` | `VARCHAR(30)` | **FK** | KHÔNG | - | Bài viết gốc chứa bình luận (`Post.id`, `Cascade`) |
| `parentId` | `VARCHAR(30)` | **FK** | CÓ | `NULL` | Bình luận cha (`Comment.id`, `Cascade`). NULL nếu là root comment |
| `createdAt` | `TIMESTAMP(3)`| - | KHÔNG | `now()` | Thời điểm đăng bình luận |
| `updatedAt` | `TIMESTAMP(3)`| - | KHÔNG | `now()` | Thời điểm sửa đổi bình luận |

---

### 3.5. Bảng `Vote` (Bình chọn Upvote / Downvote)
Ghi nhận đánh giá cộng đồng cho Bài viết và Bình luận.

| Tên Cột | Kiểu Dữ Liệu | Khóa | Cho Phép NULL | Mặc Định | Ràng Buộc / Mô Tả |
|:---|:---|:---:|:---:|:---|:---|
| `id` | `VARCHAR(30)` | **PK** | KHÔNG | `cuid()` | Khóa chính CUID |
| `type` | `VoteType` (Enum) | - | KHÔNG | - | Giá trị bình chọn: `UP` (+1) hoặc `DOWN` (-1) |
| `userId` | `VARCHAR(30)` | **FK** | KHÔNG | - | Người thực hiện bình chọn (`User.id`, `Cascade`) |
| `postId` | `VARCHAR(30)` | **FK** | CÓ | `NULL` | Bài viết được vote (`Post.id`, `Cascade`) |
| `commentId` | `VARCHAR(30)` | **FK** | CÓ | `NULL` | Bình luận được vote (`Comment.id`, `Cascade`) |
| `createdAt` | `TIMESTAMP(3)`| - | KHÔNG | `now()` | Thời điểm vote |

*Ràng buộc toàn vẹn duy nhất (Unique Constraints):*
- `UNIQUE (userId, postId)`: Một người dùng chỉ được vote tối đa 1 lần trên 1 bài viết.
- `UNIQUE (userId, commentId)`: Một người dùng chỉ được vote tối đa 1 lần trên 1 bình luận.

---

### 3.6. Bảng `Subscription` (Theo dõi cộng đồng)
Quản lý mối quan hệ người dùng tham gia các cộng đồng chuyên đề.

| Tên Cột | Kiểu Dữ Liệu | Khóa | Cho Phép NULL | Mặc Định | Ràng Buộc / Mô Tả |
|:---|:---|:---:|:---:|:---|:---|
| `userId` | `VARCHAR(30)` | **PK, FK** | KHÔNG | - | Người dùng (`User.id`, `Cascade`) |
| `subredditId` | `VARCHAR(30)` | **PK, FK** | KHÔNG | - | Cộng đồng (`Subreddit.id`, `Cascade`) |
| `createdAt` | `TIMESTAMP(3)`| - | KHÔNG | `now()` | Thời điểm bắt đầu tham gia cộng đồng |

*Khóa chính kết hợp (Composite PK):* `PRIMARY KEY (userId, subredditId)`.

---

### 3.7. Bảng `Bookmark` (Lưu trữ / Đánh dấu bài viết)
Cho phép người dùng lưu lại các bài viết quan trọng vào danh mục cá nhân.

| Tên Cột | Kiểu Dữ Liệu | Khóa | Cho Phép NULL | Mặc Định | Ràng Buộc / Mô Tả |
|:---|:---|:---:|:---:|:---|:---|
| `userId` | `VARCHAR(30)` | **PK, FK** | KHÔNG | - | Người dùng (`User.id`, `Cascade`) |
| `postId` | `VARCHAR(30)` | **PK, FK** | KHÔNG | - | Bài viết được lưu (`Post.id`, `Cascade`) |
| `createdAt` | `TIMESTAMP(3)`| - | KHÔNG | `now()` | Thời điểm đánh dấu |

*Khóa chính kết hợp (Composite PK):* `PRIMARY KEY (userId, postId)`.

---

### 3.8. Bảng `Notification` (Thông báo người dùng)
Ghi nhận các sự kiện tương tác kích hoạt gửi thông báo tới người dùng.

| Tên Cột | Kiểu Dữ Liệu | Khóa | Cho Phép NULL | Mặc Định | Ràng Buộc / Mô Tả |
|:---|:---|:---:|:---:|:---|:---|
| `id` | `VARCHAR(30)` | **PK** | KHÔNG | `cuid()` | Khóa chính CUID |
| `type` | `NotificationType`| - | KHÔNG | - | Loại: `POST_IN_SUBREDDIT`, `COMMENT_ON_POST`, `REPLY_TO_COMMENT` |
| `isRead` | `BOOLEAN` | - | KHÔNG | `false` | Trạng thái đã xem hay chưa |
| `userId` | `VARCHAR(30)` | **FK** | KHÔNG | - | Người nhận thông báo (`User.id`, `Cascade`) |
| `actorId` | `VARCHAR(30)` | **FK** | CÓ | `NULL` | Người thực hiện hành vi tạo thông báo (`User.id`, `SetNull`) |
| `postId` | `VARCHAR(30)` | - | CÓ | `NULL` | ID bài viết liên quan |
| `commentId` | `VARCHAR(30)` | - | CÓ | `NULL` | ID bình luận liên quan |
| `subredditId` | `VARCHAR(30)` | - | CÓ | `NULL` | ID cộng đồng liên quan |
| `createdAt` | `TIMESTAMP(3)`| - | KHÔNG | `now()` | Thời điểm phát sinh thông báo |

---

### 3.9. Bảng `Report` (Báo cáo vi phạm)
Hỗ trợ kiểm duyệt nội dung cộng đồng bởi Điều hành viên và Ban Quản trị.

| Tên Cột | Kiểu Dữ Liệu | Khóa | Cho Phép NULL | Mặc Định | Ràng Buộc / Mô Tả |
|:---|:---|:---:|:---:|:---|:---|
| `id` | `VARCHAR(30)` | **PK** | KHÔNG | `cuid()` | Khóa chính CUID |
| `targetId` | `VARCHAR(30)` | - | KHÔNG | - | ID của Post hoặc Comment bị báo cáo |
| `type` | `VARCHAR(20)` | - | KHÔNG | - | Phân loại mục tiêu: `'POST'` hoặc `'COMMENT'` |
| `reason` | `TEXT` | - | KHÔNG | - | Lý do báo cáo vi phạm |
| `resolved` | `BOOLEAN` | - | KHÔNG | `false` | Trạng thái xử lý của Admin/Mod |
| `reporterId` | `VARCHAR(30)` | **FK** | KHÔNG | - | Người gửi báo cáo (`User.id`) |
| `createdAt` | `TIMESTAMP(3)`| - | KHÔNG | `now()` | Thời điểm gửi báo cáo |

---

## 4. CHIẾN LƯỢC ĐÁNH CHỈ MỤC & TỐI ƯU TRUY VẤN (INDEXING STRATEGY)

Để đảm bảo hiệu năng cao khi số lượng bài viết và bình luận tăng trưởng nhanh, hệ thống cơ sở dữ liệu thiết lập các chỉ mục (Indexes) theo tiêu chuẩn B-Tree:

1. **Khóa duy nhất tự động (Implicit B-Tree Indexes):**
   - `User(username)`: Tối ưu tra cứu đăng nhập, tìm kiếm hồ sơ người dùng theo username.
   - `User(email)`: Tối ưu tra cứu xác thực qua email.
   - `Subreddit(name)`: Tối ưu định tuyến URL theo slug cộng đồng `d/:name`.
   - `Vote(userId, postId)`: Tối ưu kiểm tra trạng thái vote bài viết của người dùng.
   - `Vote(userId, commentId)`: Tối ưu kiểm tra trạng thái vote bình luận.
   - `Subscription(userId, subredditId)`: Tối ưu kiểm tra quan hệ gia nhập cộng đồng.
   - `Bookmark(userId, postId)`: Tối ưu truy xuất danh sách bài viết đã lưu.

2. **Chỉ mục khóa ngoại & lọc truy vấn (Foreign Key & Query Optimization Indexes):**
   - `Post(subredditId, createdAt DESC)`: Tối ưu câu lệnh tải danh sách bài viết theo subreddit có sắp xếp theo thời gian mới nhất.
   - `Post(authorId)`: Tối ưu truy vấn danh sách bài viết của một người dùng trong Profile.
   - `Comment(postId, parentId, createdAt ASC)`: Tối ưu truy vấn cây bình luận theo bài viết.
   - `Notification(userId, isRead, createdAt DESC)`: Tối ưu truy vấn thông báo chưa đọc của người dùng.

---

## 5. DỮ LIỆU KHỞI TẠO HỆ THỐNG (SEED DATA SPECIFICATION)

Cơ chế Seeding tự động tích hợp trong `reddit_backend/src/seed.ts` được kích hoạt tự động mỗi khi triển khai, đảm bảo tính sẵn sàng hoạt động ngay lập tức:

### 5.1. Tài khoản Quản trị viên (Super Admin):
- **Username:** `devshare_admin`
- **Email:** `admin@devshare.dev`
- **Password (Bcrypt/Bun Hash):** `password123`
- **Role:** `ADMIN`
- **Quyền hạn:** Toàn quyền xóa bài viết, xóa bình luận, thêm/xóa điều hành viên, ghim ghi chú cộng đồng (Community Note), xem báo cáo vi phạm.

### 5.2. Các cộng đồng mẫu mặc định (Default Subreddits):
1. **`announcements`**: Kênh thông báo chính thức và tin tức phát triển từ nền tảng DevShare.
2. **`webdev`**: Không gian thảo luận chuyên sâu về kiến trúc Web, Fullstack, Frontend và Backend frameworks.
3. **`typescript`**: Diễn đàn chia sẻ kỹ thuật, best practices và tips & tricks cho ngôn ngữ TypeScript.

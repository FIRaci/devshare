# TỔNG QUAN DỰ ÁN & PRODUCT DEFINITION REPORT (PDR - DEVSHARE)

> **Tên dự án:** DevShare  
> **Khẩu hiệu:** Your community hub for developers.  
> **Mục tiêu:** Nền tảng chia sẻ kiến thức, gỡ lỗi và thảo luận kỹ thuật hướng cộng đồng dành riêng cho cộng đồng lập trình viên.

---

## 1. TẦM NHÌN SẢN PHẨM & GIÁ TRỊ CỐT LÕI

### 1.1. Tuyên ngôn định vị sản phẩm
Dành cho các kỹ sư phần mềm, sinh viên công nghệ và các chuyên gia kỹ thuật, **DevShare** là một nền tảng thảo luận phân cấp theo chuyên đề cộng đồng, cung cấp trải nghiệm chia sẻ mã nguồn, tài liệu và phương tiện truyền thông trực quan, giúp tăng tốc quá trình học tập và giải quyết sự cố kỹ thuật tốt hơn so với các diễn đàn thông thường.

### 1.2. Các trụ cột giá trị (Core Pillars):
1. **Developer First:** Tối ưu hóa việc viết code, hiển thị code block có màu sắc (Syntax Highlighting), định dạng Markdown trực quan.
2. **Rich Media Embedding:** Tự động nhận diện và hiển thị trực tiếp các liên kết kỹ thuật từ YouTube, Twitter, TikTok, GitHub thành các widget tương tác mà không bắt người dùng rời khỏi trang.
3. **Decentralized Communities:** Mô hình Subreddits (`d/:name`) cho phép mỗi công nghệ (React, Bun, TypeScript, DevOps) có một không gian riêng do chính các lập trình viên điều hành.
4. **Lightning Fast:** Tốc độ phản hồi cực nhanh nhờ kiến trúc Bun + Elysia ở backend và Vite SPA ở frontend.

---

## 2. CHÂN DUNG NGƯỜI DÙNG (USER PERSONAS)

### Persona 1: Sinh viên / Lập trình viên mới vào nghề (Junior Dev - Nam, 21 tuổi)
- **Nhu cầu:** Cần tìm kiếm giải pháp cho các bài toán lập trình thực tế, đăng câu hỏi kèm ảnh chụp lỗi và đoạn code ngắn để nhờ cộng đồng giải đáp.
- **Tính năng sử dụng nhiều:** Đăng bài viết kèm code, nhận thông báo khi có người trả lời, lưu bài viết (Bookmark) để đọc lại.

### Persona 2: Kỹ sư phần mềm cao cấp (Senior Engineer - Hoàng, 30 tuổi)
- **Nhu cầu:** Chia sẻ các bài phân tích sâu (Deep-dive), đánh giá so sánh công nghệ (ví dụ: Bun vs Node.js), tạo và dẫn dắt cộng đồng công nghệ chuyên sâu.
- **Tính năng sử dụng nhiều:** Tạo Subreddit, làm Điều hành viên (Moderator), viết bài Markdown dài kèm liên kết OpenGraph, trả lời bình luận phân cấp.

### Persona 3: Quản trị viên hệ thống (Platform Admin)
- **Nhu cầu:** Giám sát chất lượng nội dung toàn hệ thống, xử lý bài viết vi phạm, ghim thông báo cộng đồng (Community Note).
- **Tính năng sử dụng:** Bảng điều khiển quyền Admin, xóa bài viết vi phạm, gắn cờ cảnh báo.

# NGUYÊN TẮC THIẾT KẾ GIAO DIỆN & TRẢI NGHIỆM (DESIGN GUIDELINES - DEVSHARE)

---

## 1. HỆ THỐNG MÀU SẮC & CHỦ ĐỀ (COLOR SYSTEM & THEMES)

Hệ thống giao diện DevShare hỗ trợ hai chủ đề màu sắc được định nghĩa thông qua các biến CSS (CSS Custom Variables) tại thẻ `body[data-theme]`:

| Tên Biến | Light Theme | Dark Theme | Mục Đích Sử Dụng |
|:---|:---:|:---:|:---|
| `--bg` | `#F8F9FA` | `#0E1117` | Màu nền tổng thể trang |
| `--surface` | `#FFFFFF` | `#161B22` | Nền thẻ bài viết, Sidebar, Modal |
| `--surface-hover` | `#F1F3F5` | `#21262D` | Trạng thái di chuột (Hover) |
| `--border` | `#E9ECEF` | `#30363D` | Đường viền ngăn cách các phân vùng |
| `--text` | `#111827` | `#F0F6FC` | Văn bản chính, tiêu đề |
| `--text-2` | `#6B7280` | `#8B949E` | Văn bản phụ, thời gian, tên người dùng |
| `--text-3` | `#9CA3AF` | `#6E7681` | Văn bản mờ, icon trạng thái tĩnh |
| `--primary` | `#5C7CFA` | `#5C7CFA` | Màu nhận diện thương hiệu, nút CTA |
| `--red` | `#FA5252` | `#F85149` | Báo động, nút Xóa, Downvote |
| `--green` | `#40C057` | `#3FB950` | Thành công, huy hiệu hoạt động |

---

## 2. NGUYÊN TẮC TYPOGRAPHY & LAYOUT

1. **Kiểu chữ (Font Family):**
   - Font chữ hệ thống không chân hiện đại: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`.
   - Code Blocks: `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace`.
2. **Hệ thống Lưới co giãn (Layout Grid):**
   - **Màn hình lớn (> 1024px):** Cấu trúc 3 cột cân đối:
     - Cột trái (`sidebar-left`): 220px (Menu điều hướng & danh sách Subreddit).
     - Cột giữa (`feed-area`): Co giãn tự do tối đa 740px (Dòng thời gian bài viết).
     - Cột phải (`sidebar-right`): 310px (Thẻ thông tin nền tảng & Top cộng đồng).
   - **Màn hình vừa (768px - 1024px):** Tự động thu gọn Sidebar trái thành dạng icon thu nhỏ (60px) hoặc ẩn thanh bên phải để dồn tiêu điểm vào nội dung bài đọc.
   - **Màn hình điện thoại (< 768px):** Thanh điều hướng chuyển thành Menu trượt (Mobile Drawer) với lớp màng mờ `modal-backdrop`.

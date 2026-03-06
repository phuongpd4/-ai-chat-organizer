# Kiến trúc Kỹ thuật (Technical Architecture)

## 1. Tổng quan Tech Stack
Dự án được cố ý thiết kế theo kiến trúc "Không có Backend thực sự" để tối ưu hóa chi phí vận hành (Đưa Server Cost về $0/tháng) và giúp người phát triển Indie hoạt động 100% rủi ro tài chính thấp.

- **Frontend Core**: Dùng `React` / `Preact` (nhẹ gọn 3KB, phù hợp với Extension để tránh giảm tốc độ trình duyệt).
- **Bundler & Tooling**: `Vite` + `pnpm`.
- **Extension API**: Manifest V3 (Bao gồm Shadow DOM Injection, Active Tab, Scripting).
- **Lưu trữ dữ liệu (Storage)**: Tận dụng hoàn toàn `Chrome Storage API (Sync)`. Không dùng custom database.
- **Local Search Engine**: Thư viện `Fuse.js` (Fuzzy Full-text search). Chạy hoàn toàn local.
- **Xử lý AI API**: `Claude Haiku API` dùng cho tính năng Auto-Tagging của gói Pro. Dùng theo hình thức BYOK (Bring Your Own Key) - User nhập API Key của riêng họ để không trút gánh nặng chi phí lên Developer.
- **Cổng thanh toán**: Thư viện Open-source `ExtensionPay` (tích hợp Stripe không cần viết code Backend).

## 2. Chrome Boilerplate & Core Setup
Sử dụng boilerplate tiêu chuẩn cộng đồng MV3: `chrome-extension-boilerplate-react-vite`.
Quyền hạn bắt buộc phải khai báo trong `manifest.json`:
- **permissions**: `["storage", "scripting", "activeTab", "sidePanel"]`
- **host_permissions**:
  ```json
  [
    "https://chatgpt.com/*",
    "https://claude.ai/*",
    "https://gemini.google.com/*"
  ]
  ```

## 3. Kiến trúc Cốt lõi & Kỹ thuật Xử lý rủi ro (Critical Requirements)

### 3.1 UX/UI Injection với Shadow DOM (Critical Rule)
- Rủi ro lớn nhất là việc CSS và giao diện gốc của OpenAI / Anthropic bị cập nhật thường xuyên. Do đó, việc chèn Content Script vào thanh Sidebar mặc định **phải được đặt 100% bên trong một Shadow DOM**.
- **Lý do**: Sử dụng Shadow Root sẽ hoàn toàn cô lập CSS của extension, ngăn việc style của ChatGPT ảnh hưởng đến extension và ngược lại.

### 3.2 System Abstraction Config (Lớp trừu tượng DOM Selectors)
- Để bảo vệ dự án khỏi các đợt cập nhật ngầm của ChatGPT (làm mất classname, DOM tree items), tất cả Query Selectors phải được định nghĩa trong 1 file cấu hình chung (ví dụ `config/selectors.ts`).
- Set up luồng tự động để liên tục giám sát cấu trúc DOM web gốc (e.g. Playwright / CI Test daily). Đặt mục tiêu xử lý sửa lỗi CSS vỡ và đẩy bản vá trên Store nội trong 24h. Sự "chịu khó" này chính là competitive moat trực tiếp đánh đổ sự chậm trễ của các đối thủ khác như Echoes.

### 3.3 Thiết kế ExtensionPay Flow (Quy trình thanh toán)
- Call script: Khởi tạo ở `background.js` qua đoạn mã `ExtPay('your-unique-extension-id').startBackground()`.
- Content JS liên tục kiểm tra trạng thái Subscription của client thông qua `await extpay.getUser()`.
- Trigger phương thức `extpay.openPaymentPage()` để hiển thị pop-up thanh toán thẻ tín dụng khi tài khoản bấm vào tính năng bị giới hạn của Phase 2 (vd: Export UI / Gemini Sidebar). ExtensionPay xử lý 100% flow và charge phí 10%.

## 4. Bắt đầu Khởi tạo (Development Bootstrapping)
Sử dụng Git để lấy template và cấu hình bước đầu thông qua Terminal:
```bash
git clone https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite src-extension
cd src-extension
pnpm install
# Sửa đổi file manifest.json, đặt tên 'AI Chat Organizer' và cấp quyền truy cập.
pnpm dev # hot reload module
```
Thực thi Prompt khởi đầu với Code Agent để Render ra Component `<FolderTree />` chứa toàn bộ danh sách thư mục cha-con.

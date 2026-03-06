# Product Requirements Document (PRD): AI Chat Organizer

## 1. Tổng quan Dự án
- **Tên dự án**: AI Chat Organizer (Chrome Extension)
- **Mục tiêu**: Xây dựng một extension giúp người dùng gom nhóm, tìm kiếm và tự động gắn thẻ (auto-tag) lịch sử trò chuyện trên nhiều nền tảng AI (ChatGPT, Claude, Gemini) bằng một giao diện tối giản.
- **Tình trạng máy chủ**: 100% Client-side. Chi phí server là $0. Lưu trữ qua `chrome.storage`.
- **Thị trường mục tiêu**: Power users của ChatGPT, Claude, Gemini cần quản lý hàng loạt đoạn hội thoại dài.

## 2. Vấn đề (Pain Points)
- **Thiếu tổ chức**: Giao diện mặc định của ChatGPT hay Claude không hỗ trợ tạo thư mục, đánh dấu hay tổ chức lịch sử hội thoại phức tạp.
- **Tìm kiếm kém**: OpenAI không ưu tiên cải thiện tính năng tìm kiếm lịch sử chat (doanh nghiệp chủ yếu tập trung vào model AI).
- **Khuyết điểm của đối thủ**:
  - *Superpower ChatGPT*: Có 200,000+ users nhưng UX phức tạp, nhồi nhét hơn 30+ tính năng, CHỈ hỗ trợ ChatGPT.
  - *Easy Folders*: Thiếu công cụ tìm kiếm thông minh và khả năng AI auto-tagging.
  - *Echoes*: Gặp nhiều lỗi kỹ thuật (buggy), UX kém.

## 3. Giá trị cốt lõi (USPs - Unique Selling Propositions)
1. **Multi-platform (Đa nền tảng)**: Extension duy nhất hỗ trợ quản lý đồng thời cả **ChatGPT, Claude và Gemini** trong cùng một công cụ.
2. **AI Auto-Tagging**: Tự động phân loại hội thoại (e.g. "coding", "marketing") thông qua Claude Haiku (dùng chính API key của user để giữ chi phí server bằng $0).
3. **Trải nghiệm tối giản (Minimalist UX)**: Tập trung giải quyết một vấn đề cực kỳ tốt trong 30 giây đầu tiên mà không nhồi nhét tính năng rác.

## 4. Lộ trình Tính năng (Feature Roadmap)

### Phase 1: MVP (Tính năng Core/Free)
*Mục tiêu: Đạt 500 - 2,000 users đầu tiên. Không thu phí.*
- **Folders & Subfolders**: Kéo-thả (drag-and-drop) hội thoại vào thư mục, phân loại bằng màu sắc (color coding), cây thư mục có thể mở rộng/thu gọn (collapsible sidebar).
- **Full-Text Search (Tìm kiếm toàn văn)**: Tìm kiếm fuzzy thông qua `Fuse.js` trong toàn bộ chat, highlight kết quả tìm kiếm. Lọc theo khoảng thời gian và nền tảng.
- **Pin & Bookmark**: Ghim (Pin) chat quan trọng lên đầu sidebar. Bookmark nhanh các tin nhắn cụ thể giữa cuộc hội thoại.
- **Timestamps**: Hiển thị thời gian tạo/chỉnh sửa cho từng đoạn hội thoại.
- **Nền tảng khởi đầu**: ChatGPT và Claude.ai.

### Phase 2: Tính năng Pro (Bắt đầu Monetization)
*Mục tiêu: Upsell cho người dùng Free với giá $5.99/tháng.*
- **AI Auto-Tagging**: Phân tích và tự động gắn thẻ ngữ nghĩa cho các cuộc trò chuyện.
- **Export Hub**: Xuất hàng loạt hội thoại (Bulk export) ra định dạng Markdown, PDF, hoặc đồng bộ trực tiếp lên Notion API.
- **Hỗ trợ Gemini**: Chèn sidebar quản lý vào trang `gemini.google.com`.
- **Usage Dashboard (Thống kê)**: Hiển thị biểu đồ sử dụng AI, thời gian online, topic chat nhiều nhất, ...

### Phase 3: Team Tier ($12/user/tháng)
*Mục tiêu: Đánh vào tệp khách hàng B2B.*
- **Shared Workspaces**: Share folder với nhóm làm việc, collaborative tagging.
- **Team Prompt Library**: Thư mục dùng chung chứa tất cả System Prompts chuẩn của công ty, hỗ trợ version control.
- **Admin Dashboard**: Quản lý thành viên, xem usage metrics của team, billing tập trung.

## 5. Số liệu cam kết & Thành công (KPIs)
- **Tốc độ Build MVP**: 4-5 tuần.
- **Monthly Recurring Revenue (MRR)**: Hướng tới mốc $10,000/tháng trong 12 tháng đầu tiên.
- **User base**: Mục tiêu ~60,000 người dùng tự nhiên (organic) qua kênh mở rộng.
- **Conversion Rate (Tỷ lệ chuyển đổi)**: Kỳ vọng mức chuyển đổi bảo thủ ở mức 3% từ gói Free lên Pro.

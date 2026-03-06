# Kế hoạch Kinh doanh & Marketing (Business Plan)

## 1. Mô hình Doanh thu (Monetization Strategy)
Mục tiêu doanh thu năm đầu tiên (Year 1): $75k - $90k với chi phí vận hành xấp xỉ $0. Lợi nhuận ròng (Margin) đạt 85 - 95%. Không gọi vốn, tự chủ hoàn toàn (Bootstrapped).

### Các phân khúc thu nhập dự kiến:
1. **Lifetime Deal Launch (Launch Offer - Tháng 1):** Bán 200 lượt tải gói Mua đứt (Lifetime) cho User beta với giá dao động **$39 - $49**. Lấy nguồn tiền $2K-$9K upfront làm chi phí vận chuyển để phát triển dự án. Kênh phát hành mục tiêu: AppSumo và Newsletter cá nhân.
2. **Gói Pro Recurring (Từ tháng 2 - $5.99 / tháng hoặc $48 / năm):** Đóng vai trò là dòng tiền định kỳ chính yếu. Upsell tính năng Export (Ra PDF, Notion), AI Auto-tagging và Multi-platform Premium như mở khóa Gemini. Mồi chài bằng gói Free mạnh yếu tố tìm kiếm cơ bản.
3. **Mô hình Subscription B2B Team (Từ tháng 5+ - $12 / user / tháng):** Giới thiệu Workspace chia sẻ folder/chat cho Team.
4. **Sponsorship Banner (Sponsor Deals):** Thiết lập một Mailing list Newsletter về "AI Tips" tích hợp bên trong extension. Bán slot giới thiệu (sponsor) cho các nhãn hàng với giá **$500/email** khi đạt ngưỡng 5,000 subcribers. 

## 2. Chiến lược Marketing (Chỉ dùng Organic, Ngân sách Ads = $0)
Vứt bỏ quảng cáo trả phí (Paid ads) và dựa thẳng vào Playbook tăng trưởng tự nhiên (Organic) từ cộng đồng giống dự án *"Superpower ChatGPT"*:
- **Reddit Launch (Khu vực có lượng ROI tốt nhất):** Tạo Topic dưới dạng *"Show HN / Show Reddit"* trên các subreddit chuyên biệt. Không spam link tải, chủ yếu thảo luận hỏi xin feedback thực tế từ user trong các group r/ChatGPT (7M mems), r/ClaudeAI (500k mems), r/AITools.
- **X / Twitter "Build-in-Public":** Tweet toàn bộ cột mốc tăng trưởng từ ngày Code mẻ đầu tiên. Ví dụ các dạng Tweet "$100 MRR đầu tiên", "$1K MRR mới đạt được" đi kèm 30-giây GIF Demo rất thu hút tệp Indie Maker & Software Buyer.
- **Product Hunt:** Chỉ kích hoạt khi đã có sẵn lượng người review ổn định và list user hứa vote. Lấp top 5 product trong ngày = 1,000 - 3,000 traffic đổ về nhanh chóng.
- **YouTube SEO Video:** Video ngắn khoảng 5 phút màn hình ghi lại thao tác giải quyết nỗi khổ *"How to organize ChatGPT conversations effectively"*. Là kênh traffic đổ về lâu dài theo tháng (passive flow).

## 3. Quản lý Rủi ro (Risk Mitigation)

| Rủi ro | Mức độ | Kế hoạch đối phó (Mitigation) |
|---|---|---|
| Cập nhật mới từ OpenAI làm Extension bị rớt hoặc lỗi layout. | Cao | Triển khai CI/CD dùng Playwright Test daily để bắn Alert tức thời. Cấu trúc HTML trích xuất riêng vào config file. Tốc độ sửa lỗi nội trong 24h là rào cản phòng vệ uy tín. |
| OpenAI tự bổ sung Folder Native. | Không rõ| Nhanh chóng bao phủ tính năng Multi-platform (Claude & Gemini). Tránh phụ thuộc chết vào 1 hệ sinh thái duy nhất. Cạnh tranh bằng AI Auto-tag (vì OpenAI không có lợi ích gì khi làm riêng UX này). |
| Chrome Web Store reject extension (Lỗi yêu cầu quyền Host Permissions quá rộng). | Cao (Bị delay mốc Launch) | Viết Privacy Policy cụ thể cam kết "Toàn bộ Data nằm lại Local". Nhấn mạnh không xử lý từ xa. Nộp kiểm duyệt store 2 tuần trước khi Launch để có dư thời gian kháng nghị. |
| Conversion Rate Pro bị thấp dưới tiêu chuẩn 3%. | Trung bình | Tối ưu timing trượt cửa sổ báo Upsell. Set up logic ví dụ: "Chỉ pop-up cảnh báo sau khi họ tạo hơn 3 folder hoặc ghim 10 chats đầu tiên". Đẩy mạnh Newsletter. |

## 4. Dự phóng Doanh thu & Kết quả Năm 1 (Projections)
*Số lượng quy mô tăng trưởng dựa trên tỷ lệ convert 3% Conservative (Trong khi Easy folders là 1.25%, Superpower ChatGPT > 10%).*
- **Phase 1: Bootstrapping & MVP Launch (Tháng 1-3):** Phủ được ~5,000 Free Users. Tổng doanh thu Lifetime Deal mang lại \~$2,000 - \$4,000 để bôi trơn dự án.
- **Phase 2: Growth (Tháng 4-8):** Bắt đầu phát triển tệp 15K-35K Users. MRR từ Subscription và Sponsorship Newsletter chạm mốc \~$3,000 đến \$6,000.
- **Phase 3: Scale (Tháng 9-12):** Đạt Volume 60,000 người dùng với \~1,800 Pro Subs. Khởi động phân phối B2B. MRR kép duy trì lâu dài xoay vòng ở ngưỡng cực khủng \~$10,000 đến \$12,500.

>*Kế hoạch kinh doanh được lập ra đặc biệt dành cho Solo-developer với khả năng tận dụng Code Agent để speed up MVP trong 4-5 tuần.*

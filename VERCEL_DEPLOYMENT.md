# Deploy frontend lên Vercel

Repo này là Create React App (tĩnh), deploy được lên Vercel. Backend Java + MySQL + VNPay vẫn chạy ở Render/container riêng.

## 1. Vercel project

- Import repo `AI-Interview-Platform-FE`.
- Framework: **Create React App**.
- Build command: `CI=false npm run build` (đã có trong `vercel.json`).
- Output directory: `build` (đã có trong `vercel.json`).
- `vercel.json` có rewrite `/(.*) -> /index.html` để các route như `/wallet`, `/payment/vnpay/result` không bị 404 khi refresh.

## 2. Environment variables trên Vercel

Vào **Project Settings → Environment Variables**, thêm (chọn Production + Preview):

| Biến | Giá trị | Bắt buộc |
|---|---|---|
| `REACT_APP_API_URL` | URL public của backend, ví dụ `https://ai-interview-backend-staging.onrender.com` | Có |
| `REACT_APP_AI_SERVICE_URL` | URL AI service nếu dùng, để trống nếu không dùng | Không |

> CRA đọc biến `REACT_APP_*` lúc **build**. Đổi env xong phải **Redeploy**.
> Không bao giờ đưa `VNPAY_HASH_SECRET` lên Vercel — đây là secret backend.

## 3. Cấu hình backend (Render/container)

Backend cần các env sau (không phải Vercel):

| Biến | Giá trị |
|---|---|
| `FRONTEND_URL` | `https://<project>.vercel.app` — backend redirect về đây sau khi VNPay trả kết quả |
| `CORS_ALLOWED_ORIGINS` | `https://<project>.vercel.app` (phân tách bằng `,` nếu nhiều domain) |
| `VNPAY_TMN_CODE` | TmnCode lấy từ VNPay merchant portal |
| `VNPAY_HASH_SECRET` | HashSecret lấy từ VNPay merchant portal |
| `VNPAY_PAY_URL` | `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html` hoặc production |
| `VNPAY_RETURN_URL` | `https://<backend>/api/v1/payment/vnpay/return` |
| `VNPAY_IPN_URL` | `https://<backend>/api/v1/payment/vnpay/ipn` |

Trên VNPay merchant portal, đăng ký đúng `Return URL` và `IPN URL` ở trên. Với production, IPN bắt buộc phải là URL public HTTPS.

## 4. Luồng VNPay sau khi deploy

1. FE gọi `POST {REACT_APP_API_URL}/api/v1/payment/vnpay/create`.
2. FE hiển thị QR của `paymentUrl` và nút mở cổng VNPay.
3. VNPay gọi `VNPAY_RETURN_URL` trên backend → backend verify chữ ký, cộng ví (idempotent).
4. Backend redirect `302` về `FRONTEND_URL/payment/vnpay/result?status=...&txnRef=...`.
5. FE đọc query, tải lại số dư ví.

## 5. Kiểm tra sau deploy

- Truy cập `https://<project>.vercel.app/wallet` → refresh trang vẫn hiện nội dung (rewrite hoạt động).
- Đăng nhập → nạp tiền → tạo được giao dịch VNPay (không còn lỗi “VNPay chưa được cấu hình”).
- Sau thanh toán sandbox, về `/payment/vnpay/result?status=success` và số dư ví tăng.
- Nếu lỗi CORS: kiểm tra `CORS_ALLOWED_ORIGINS` trên backend.
- Nếu lỗi 404 API: kiểm tra `REACT_APP_API_URL` và redeploy FE.

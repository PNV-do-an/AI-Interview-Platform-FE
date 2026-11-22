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
> Không bao giờ đưa `MOMO_SECRET_KEY` / `ZALOPAY_KEY1` / `ZALOPAY_KEY2` lên Vercel — đây là secret backend.

## 3. Cấu hình backend (Render/container)

Backend cần các env sau (không phải Vercel):

| Biến | Giá trị |
|---|---|
| `FRONTEND_URL` | `https://<project>.vercel.app` — backend redirect về đây sau khi thanh toán |
| `CORS_ALLOWED_ORIGINS` | `https://<project>.vercel.app` (phân tách bằng `,` nếu nhiều domain) |
| `MOMO_PARTNER_CODE` / `MOMO_ACCESS_KEY` / `MOMO_SECRET_KEY` | Credential MoMo merchant portal |
| `MOMO_REDIRECT_URL` | `https://<backend>/api/v1/payment/momo/return` |
| `MOMO_IPN_URL` | `https://<backend>/api/v1/payment/momo/ipn` |
| `ZALOPAY_APP_ID` / `ZALOPAY_KEY1` / `ZALOPAY_KEY2` | Credential ZaloPay (sandbox mặc định AppID 554) |
| `ZALOPAY_CALLBACK_URL` | `https://<backend>/api/v1/payment/zalopay/callback` |
| `ZALOPAY_REDIRECT_URL` | `https://<backend>/api/v1/payment/zalopay/return` |

Đăng ký Return URL / IPN URL tương ứng trên merchant portal của từng cổng. Production bắt buộc dùng URL public HTTPS.

## 4. Luồng thanh toán sau khi deploy

1. FE gọi `POST {REACT_APP_API_URL}/api/v1/payment/momo/create` hoặc `/zalopay/create`.
2. FE hiển thị QR (MoMo trả `qrCodeUrl`; ZaloPay render QR từ `paymentUrl`) và nút mở cổng thanh toán.
3. Cổng gọi callback/IPN trên backend → backend verify chữ ký, cộng ví (idempotent).
4. Backend redirect `302` về `FRONTEND_URL/payment/momo/result` hoặc `/payment/zalopay/result`.
5. FE đọc query, tải lại số dư ví.

## 5. Kiểm tra sau deploy

- Truy cập `https://<project>.vercel.app/wallet` → refresh trang vẫn hiện nội dung (rewrite hoạt động).
- Đăng nhập → nạp tiền → chọn MoMo hoặc ZaloPay → tạo được giao dịch (không còn lỗi “chưa được cấu hình”).
- Sau thanh toán sandbox, về `/payment/momo/result?status=success` hoặc `/payment/zalopay/result?status=success` và số dư ví tăng.
- Nếu lỗi CORS: kiểm tra `CORS_ALLOWED_ORIGINS` trên backend.
- Nếu lỗi 404 API: kiểm tra `REACT_APP_API_URL` và redeploy FE.

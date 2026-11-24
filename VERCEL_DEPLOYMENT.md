# Deploy frontend lên Vercel

Repo này là Create React App (tĩnh), deploy được lên Vercel. Backend Java + MySQL + payOS vẫn chạy ở Render/container riêng (Vercel chỉ host FE).

## 1. Vercel project

- Import repo `AI-Interview-Platform-FE`.
- Framework: **Create React App**.
- Build command: `CI=false npm run build` (đã có trong `vercel.json`).
- Output directory: `build` (đã có trong `vercel.json`).
- `vercel.json` có rewrite `/(.*) -> /index.html` để các route như `/wallet`, `/payment/payos/result` không bị 404 khi refresh.

## 2. Environment variables trên Vercel

Vào **Project Settings → Environment Variables**, thêm (chọn Production + Preview):

| Biến | Giá trị | Bắt buộc |
|---|---|---|
| `REACT_APP_API_URL` | URL public HTTPS của backend, ví dụ `https://ai-interview-backend-staging.onrender.com` | Có |
| `REACT_APP_AI_SERVICE_URL` | URL AI service nếu dùng, để trống nếu không dùng | Không |

> CRA đọc biến `REACT_APP_*` lúc **build**. Đổi env xong phải **Redeploy**.
> Không bao giờ đưa `PAYOS_CLIENT_ID` / `PAYOS_API_KEY` / `PAYOS_CHECKSUM_KEY` lên Vercel — đây là secret backend.

## 3. Cấu hình backend (Render/container)

Backend cần các env sau (không phải Vercel):

| Biến | Giá trị |
|---|---|
| `FRONTEND_URL` | `https://<project>.vercel.app` — backend redirect về đây sau khi thanh toán |
| `CORS_ALLOWED_ORIGINS` | `https://<project>.vercel.app` (phân tách bằng `,` nếu nhiều domain) |
| `PAYOS_CLIENT_ID` / `PAYOS_API_KEY` / `PAYOS_CHECKSUM_KEY` | Credential payOS lấy tại `https://my.payos.vn` → Kênh thu |
| `PAYOS_BASE_URL` | `https://api-merchant.payos.vn` (mặc định) |
| `PAYOS_RETURN_URL` | `https://<backend>/api/v1/payment/payos/return` |
| `PAYOS_CANCEL_URL` | `https://<backend>/api/v1/payment/payos/cancel` |

Đăng ký webhook một lần với payOS (backend phải public HTTPS):

```bash
curl -X POST https://api-merchant.payos.vn/confirm-webhook \
  -H "x-client-id: $PAYOS_CLIENT_ID" \
  -H "x-api-key: $PAYOS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"webhookUrl":"https://<backend>/api/v1/payment/payos/webhook"}'
```

> payOS hiện **không có sandbox**. Để test, đăng ký tài khoản cá nhân + CCCD tại `https://my.payos.vn`, tạo kênh thu rồi chuyển khoản thử số tiền nhỏ. Với local, dùng tunnel (ví dụ `ngrok http 8081`) và đăng ký webhook URL `https://<tunnel>/api/v1/payment/payos/webhook`.

## 4. Luồng thanh toán sau khi deploy

1. FE gọi `POST {REACT_APP_API_URL}/api/v1/payment/payos/create` với `{ amount, description }`.
2. Backend tạo `orderCode`, ký HMAC-SHA256 bằng `checksum-key`, gọi payOS và trả `checkoutUrl` + `qrCode` (VietQR).
3. FE render mã QR và nút mở trang checkout payOS.
4. payOS gọi webhook về backend → backend verify signature, đối soát `orderCode`/`amount`, cộng ví idempotent.
5. Backend redirect `302` về `FRONTEND_URL/payment/payos/result?status=...&orderCode=...`.
6. FE đọc query, tải lại số dư ví.

## 5. Kiểm tra sau deploy

- Truy cập `https://<project>.vercel.app/wallet` → refresh trang vẫn hiện nội dung (rewrite hoạt động).
- Đăng nhập → nạp tiền → tạo được giao dịch payOS (không còn lỗi “chưa được cấu hình”).
- Sau khi chuyển khoản thử, về `/payment/payos/result?status=success` và số dư ví tăng (webhook xử lý trong vài giây).
- Nếu lỗi CORS: kiểm tra `CORS_ALLOWED_ORIGINS` trên backend.
- Nếu lỗi 404 API: kiểm tra `REACT_APP_API_URL` và redeploy FE.
- Hỗ trợ payOS: `support@payos.vn`.

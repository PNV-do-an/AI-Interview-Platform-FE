# AI Interview Platform — Frontend

React 18 + TypeScript (Create React App) + Tailwind. Giao diện cho ứng viên, nhà tuyển dụng và admin.

## LiveTalking AI interview

The LiveTalking avatar connects to the AI service URL configured at runtime in the browser.

Browser TTS mode works immediately on production. For full LiveTalking Avatar with video call + lip-sync:

#### Steps to Enable Avatar Mode:

1. **Deploy AI Service on Google Colab (FREE):**
   ```
   Open Notebook: https://colab.research.google.com/drive/1USnmlMfb4lt8kvvxzt2zOlkpGNklmtqK
   Runtime Settings: GPU → T4
   
   Run Cells 1-7 (~20 min first build):
   - Cell 1: Docker + GPU setup
   - Cell 2: Clone BE repo
   - Cell 3: Build Docker image
   - Cell 4: Run container with GPU
   - Cell 5: Get ngrok URL ⭐ IMPORTANT
   - Cell 6-7: Verify health & get info
   ```

2. **Configure the frontend:** Open `/mock-interviews`, select **LiveTalking Avatar**, paste the AI URL printed by Colab, then select **Kiểm tra & lưu**. The URL is stored in this browser; no Vercel environment variable or rebuild is needed when a Colab tunnel changes.

3. **Trigger Redeploy:**
   - Merge the frontend change into `dev`; a successful push automatically bumps the frontend submodule in the superrepo.
   - Wait 5-10 minutes for full CI/CD pipeline to complete
   - Check https://aiinterview-vn.vercel.app/mock-interviews

4. **Test Production:**
   - Hard refresh (Ctrl+Shift+R)
   - Toggle "LiveTalking Avatar" mode.
   - Start interview and click **Bật tiếng avatar** in the subtitle panel; the HLS stream starts muted to satisfy browser autoplay rules.
   - If the button switches to **Tắt tiếng avatar** but audio is still inaudible, check the Chrome tab mute state and the selected Windows output device.

---

## Chạy local

```bash
npm ci
echo "REACT_APP_API_URL=http://localhost:8080" > .env.local
npm start              # cổng 3000
```

Không đặt `REACT_APP_API_URL` thì app tự fallback `http://localhost:8080`.

## Kết nối AI interview trên production

Trang `/mock-interviews` cho phép chọn **LiveTalking Avatar**, nhập URL AI service do
`colab-avatar-hls.ipynb` in ra, rồi bấm **Kiểm tra kết nối** và **Lưu URL**. URL được lưu
trong `localStorage` của trình duyệt và ưu tiên hơn `REACT_APP_AI_SERVICE_URL`, vì tunnel
Colab thay đổi sau mỗi lần khởi động. Chỉ nhập origin của AI service, ví dụ
`https://<tunnel>.trycloudflare.com`, không thêm `/health`.

Để trình duyệt cho phép kết nối, AI service cần cấu hình CORS với origin của frontend
(production: `https://aiinterview-vn.vercel.app`; local: `http://localhost:3000`).
Không lưu API key ở URL này.

### Trả lời bằng giọng nói trên Chrome

Trong phòng phỏng vấn, bấm **Bắt đầu nói** để Chrome nhận dạng tiếng Việt và chèn transcript
vào ô trả lời. Có thể sửa transcript rồi bấm **Trả lời & Tiếp** để lưu câu trả lời. Bấm
**Dừng nói** để kết thúc nhận dạng. Nếu Chrome hỏi quyền, hãy cho phép micro cho trang web.
Nhận dạng giọng nói phụ thuộc Web Speech API và kết nối mạng của trình duyệt; audio không được
gửi tới AI service trên Colab. Nếu trình duyệt hoặc dịch vụ nhận dạng không hỗ trợ, có thể gõ
câu trả lời như trước.

Chỉ số **AI ... ms** trong phòng đo thời gian phản hồi của endpoint `/health` trên AI service,
không đo thời gian sinh câu hỏi hay toàn bộ độ trễ của cuộc hội thoại.

## Kiểm tra trước khi push

```bash
npm run build          # CI chạy đúng lệnh này, có TypeScript check
```

## CI/CD

Push vào `dev` → Actions chạy `Frontend CI` (Build). Build xanh thì job
`Bump superrepo submodule` cập nhật con trỏ submodule `frontend` trong repo
`AI-Interview-Platform-deploy-staging` sang đúng SHA vừa build. Superrepo đó
mới clone submodule theo con trỏ và deploy lên Vercel
(`https://aiinterview-vn.vercel.app`).

Cần secret **`DEPLOY_PAT`** trong repo nầy: fine-grained token chỉ cấp repo
deploy với quyền **Contents: read and write** (bot push commit bump submodule).
Repo không tự deploy Vercel ở đây để tập trung secret `VERCEL_*` về một chỗ;
Vercel Hobby cũng không cho git connect từ repo thuộc organization.

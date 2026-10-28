# AI Interview Platform — Frontend

React 18 + TypeScript (Create React App) + Tailwind. Giao diện cho ứng viên, nhà tuyển dụng và admin.

## 🚀 Deploy LiveTalking AI Interview Mode

### Status: ✅ READY TO DEPLOY (Awaiting Colab Setup)

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

2. **Configure Vercel Environment Variable:**
   ```
   Dashboard: https://vercel.com/dashboard/projects/ai-interview9/settings/environment-variables
   Add NEW variable:
     Key: REACT_APP_AI_SERVICE_URL
     Value: [ngrok-url-from-cell-5] 
     Example: https://deforest-unmoved-emphases.ngrok-free.dev
   ```

3. **Trigger Redeploy:**
   - This commit will automatically bump submodule in superrepo
   - Wait 5-10 minutes for full CI/CD pipeline to complete
   - Check https://aiinterview-vn.vercel.app/mock-interviews

4. **Test Production:**
   - Hard refresh (Ctrl+Shift+R)
   - Toggle "LiveTalking Avatar" mode ← Now active!
   - Start interview to verify WebRTC connection ✅

---

## Chạy local

```bash
npm ci
echo "REACT_APP_API_URL=http://localhost:8080" > .env.local
npm start              # cổng 3000
```

Không đặt `REACT_APP_API_URL` thì app tự fallback `http://localhost:8080`.

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

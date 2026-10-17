# AI Interview Platform — Frontend

React 18 + TypeScript (Create React App) + Tailwind. Giao diện cho ứng viên,
nhà tuyển dụng và admin.

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

Push vào `dev` → Actions chạy `Frontend CI` (Build). Nếu xanh, repo
`AI-Interview-Platform-deploy-staging` tự deploy lên Vercel
(`https://aiinterview-vn.vercel.app`) qua workflow `workflow_run`.

Repo không tự deploy Vercel ở đây để tập trung secret `VERCEL_*` về một chỗ:
Vercel Hobby không cho git connect từ repo thuộc organization, nên deploy vẫn
phải đi qua Actions + token.

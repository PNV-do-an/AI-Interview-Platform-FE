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

Push vào `dev` → Actions chạy `Frontend CI` (Build). Build xanh thì job
`Trigger staging deploy` gọi `workflow_dispatch` sang repo
`AI-Interview-Platform-deploy-staging`, repo đó clone đúng SHA vừa build và
deploy lên Vercel (`https://aiinterview-vn.vercel.app`).

Cần secret **`DEPLOY_PAT`** trong repo nầy: fine-grained token chỉ cấp repo
deploy với quyền *Actions: read and write*. Repo không tự deploy Vercel ở đây
để tập trung secret `VERCEL_*` về một chỗ; Vercel Hobby cũng không cho git
connect từ repo thuộc organization.

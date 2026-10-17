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
`Bump superrepo submodule` cập nhật con trỏ submodule `frontend` trong repo
`AI-Interview-Platform-deploy-staging` sang đúng SHA vừa build. Superrepo đó
mới clone submodule theo con trỏ và deploy lên Vercel
(`https://aiinterview-vn.vercel.app`).

Cần secret **`DEPLOY_PAT`** trong repo nầy: fine-grained token chỉ cấp repo
deploy với quyền **Contents: read and write** (bot push commit bump submodule).
Repo không tự deploy Vercel ở đây để tập trung secret `VERCEL_*` về một chỗ;
Vercel Hobby cũng không cho git connect từ repo thuộc organization.

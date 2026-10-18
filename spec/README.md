# Spec — phần frontend

Đọc ở đây trước khi mở code khi nhận một yêu cầu tính năng.

Repo này chỉ giữ các tài liệu nghiêng về giao diện và ánh xạ mockup.
API / dữ liệu / kiểm chứng nghiệp vụ nằm ở repo `AI-Interview-Platform-BE` (`spec/` của repo đó).
**Bản đầy đủ của mọi tài liệu (cả hai mảng) nằm ở superrepo
`AI-Interview-Platform-deploy-staging`, thư mục `spec/`** — đó là nơi để sửa;
bản sao ở đây để đọc theo mảng.

Repo này có gốc là chính frontend, nên đường dẫn `frontend/src/...` ghi trong tài liệu
tương ứng với `src/...` ở đây.

## Cấu trúc

```
spec/
  README.md                        file này
  INDEX.md                         29 màn Stitch -> route -> file -> trạng thái -> thiếu gì
  conventions/frontend-ui.md       luật giao diện bắt buộc tuân theo (design system Stitch)
  verification.md                  cách build + soát DOM thật, kèm các bẫy đã gặp
  features/mockup-parity-next.md   phần parity còn lại với mockup
  templates/feature-plan.md        mẫu kế hoạch cho tính năng mới
```

## Ở repo khác

| Tài liệu | Nằm ở |
|---|---|
| `srs-core-baseline.md` (FR/NFR → code thật) | BE |
| `known-gaps.md` (lỗ hổng backend/API/số liệu) | BE |
| `features/sign-up.md` | BE |
| `features/password-reset.md` | BE |

## Cách dùng khi code một màn mới

1. Tìm màn tương ứng trong `INDEX.md`. Nếu chưa có dòng nào -> tạo `features/<ten>.md` từ
   `templates/feature-plan.md` trong superrepo và điền trước phần Mục tiêu, Mockup nguồn,
   Phạm vi, Không làm.
2. Đọc `conventions/frontend-ui.md`. Nếu màn cần số liệu/API, đọc `known-gaps.md` (repo BE) —
   hai file này trả lời sẵn những câu sẽ bị hỏi lại.
3. Ghi vào file plan: ánh xạ field thật -> thành phần UI, và danh sách khối mockup **bỏ** kèm
   lý do (thiếu endpoint/thiếu column). Đây là phần giá trị nhất của plan.
4. Làm theo plan, rồi cập nhật lại trạng thái trong `INDEX.md` và mục Kết quả trong file plan.
5. Chạy các bước trong `verification.md` trước khi báo xong.

## Quy ước

- Trạng thái screen: `TODO` (chưa có file) / `UI` (đã dựng form, chưa nối số liệu) /
  `DATA` (dùng số liệu thật) / `STATIC` (màn tĩnh theo mockup, cố ý không có API) /
  `BLOCKED` (chờ backend).
- Plan ghi **thứ đã kiểm chứng** kèm cách kiểm chứng (curl, DOM), không ghi suy đoán.
- Một luồng sửa cả hai mảng phải ghi ở cả hai bản sao; bản superrepo là bản đối chiếu cuối cùng.

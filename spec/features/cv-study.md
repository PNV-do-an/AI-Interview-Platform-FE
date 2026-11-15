# CV + Study Program — đưa toàn bộ API CV/Study của BE ra frontend

Trạng thái: `done`
Người/phiên tạo: 2026-11-15, branch `feature/upload-cv`
Mockup nguồn: không có mockup — màn ứng viên, dùng shell `CandidateLayout` + primitive `candidateKit.tsx` (token `ds-*`, chrome tiếng Việt 100%).
Hợp đồng BE: `D:\api-cv-study.txt` + source `D:\AI-Interview-Platform-BE` (`CvController`, `StudyProgramController`, DTO `CvParseResponse`/`StudyProgramResponse`/`TopicResponse`/`QuestionResponse`/`AnswerEvaluationResponse`, `CvServiceImpl`, `StudyProgramServiceImpl`). Đã verify runtime trên stack Docker local ngày 2026-11-15 (mục 11).

## 1. Mục tiêu

Ứng viên (ROLE_USER) phân tích CV bằng AI (tải file), xem kỹ năng/kinh nghiệm/học vấn/lỗ hổng/vị trí đề xuất, lưu vị trí mục tiêu; từ CV đó tạo chương trình ôn tập theo chủ đề, làm câu hỏi trắc nghiệm/tự luận và xem chấm điểm từng câu.

> Điều chỉnh 2026-11-15 (sau khi verify): anh Huy yêu cầu **bỏ khối "Hoặc dán nội dung CV"** — đã xóa form paste khỏi `CvAnalyzerPage` và chuỗi `parseCvText` (controller + service). BE vẫn giữ `POST /cv/parse-text` nhưng FE không gọi nữa.

## 2. Phạm vi / Không làm

**Làm:**

- Viết lại toàn bộ model/service/controller CV theo API mới: `upload`, `getMyCv`, `setPosition`, `getMySkills` (`parse` bị gỡ 2026-11-15 theo yêu cầu bỏ khối paste — xem ghi chú mục 1).
- Thêm model/service/controller Study: `generate`, `list`, `detail`, `topics`, `questions` (phân trang), `submitAnswer`.
- Dựng lại `CvAnalyzerPage` theo candidateKit: 2 cột (nhập | kết quả), form vị trí mục tiêu, danh sách kỹ năng đã lưu.
- Thêm 2 trang mới `StudyProgramsPage` (`/study`) và `StudyProgramDetailPage` (`/study/:id`), route + item sidebar trong `CandidateLayout`.
- Chuyển `CoverLettersPage` từ "danh sách CV cũ" sang "CV mới nhất" (`GET /cv`).

**Không làm:**

- Không động API Cover Letter (BE vẫn giữ nguyên 5 endpoint; FE giữ nguyên luồng tạo/sửa/xóa/tải thư).
- Không dựng màn upload file PDF kéo-thả: input file thường + validate client (đuôi `.pdf`/`.txt`, ≤10MB) trước khi gửi.
- Không làm chấm điểm/tiến trình chương trình phía FE ngoài số BE trả (`totalTopics`/`completedTopics`); không tự tính, không hiện số 0 giả.
- Không thêm role/guard mới; `/cv-analyzer`, `/study*` nằm trong khối ROLE_USER sẵn có của `App.tsx`.
- Không tách file component riêng cho các khối nhỏ (SectionHead, chip, card đề xuất) — để trong file trang.

## 3. API thật dùng được

Đọc từ source BE + đo runtime ngày 2026-11-15 (kết quả mục 11). Chi tiết field/rule: `D:\api-cv-study.txt`.

| Endpoint | Method | Dùng cho | Hành vi / lỗi cần biết |
|---|---|---|---|
| `/api/v1/cv/upload` | POST multipart | Tải file CV | Chỉ PDF có lớp chữ hoặc `.txt`, ≤10MB; PDF scan không lớp chữ → 400. Response `CvParseResponse` |
| `/api/v1/cv/parse` | POST JSON `{cvText}` | Dán nội dung CV | Nội dung <50 ký tự bị chặn phía FE; BE gọi AI parse. Response `CvParseResponse` |
| `/api/v1/cv` | GET | Nạp CV mới nhất | **Không có CV → 200 với `CvParseResponse` rỗng (`cvId = null`)**, không phải 404 |
| `/api/v1/cv/position` | PUT `{position, level}` | Lưu vị trí mục tiêu | `position`/`level` là chuỗi tự do (không nằm trong catalog cũng nhận); chưa có CV → 404 "Chưa có CV nào..." |
| `/api/v1/cv/skills` | GET | Kỹ năng đã lưu | `List<SkillResponse>` `{id, name, proficiency, years}`; refresh sau mỗi lần upload/parse |
| `/api/v1/study-programs/generate` | POST `{programType?, targetPosition?, questionsPerTopic?}` | Tạo chương trình | Chưa có CV → 400 "Chưa có CV. Hãy upload hoặc phân tích CV trước khi tạo chương trình ôn tập"; `programType` mặc định `STUDY`; `questionsPerTopic` mặc định 10, FE chặn 1–50 |
| `/api/v1/study-programs` | GET | Danh sách chương trình | `List<StudyProgramResponse>` của user hiện tại |
| `/api/v1/study-programs/{id}` | GET | Nạp chi tiết | Không phải của mình → 404 |
| `/api/v1/study-programs/{id}/topics` | GET | Danh sách chủ đề | `List<TopicResponse>` theo `topicOrder` |
| `/api/v1/study-topics/{topicId}/questions?page&size` | GET | Câu hỏi một chủ đề | Spring `Page<QuestionResponse>` → `PagedResponse`; `options` chỉ có ở MCQ |
| `/api/v1/study-topics/{topicId}/answers` | POST `{questionId, answer}` | Nộp câu trả lời | AI chấm → `AnswerEvaluationResponse {score, isCorrect, feedback, modelAnswer, explanation, strengths[], improvements[]}` |

Field chính trong response:

- `CvParseResponse`: `cvId, fileName, skills[{name,proficiency,years}], experience[{company,role,duration,achievements[]}], education[{institution,degree,year}], suggestedPositions[string], knowledgeGaps[string], recommendedPositions[{positionId,title,slug,level,description,requiredSkillCount,matchedSkillCount,matchPercentage,matchedSkills[],missingSkills[]}], targetPosition, targetLevel`.
- `StudyProgramResponse`: `id, title, description, programType, status, difficultyLevel, targetPosition, totalTopics, completedTopics, createdAt, completedAt`.
- `TopicResponse`: `id, title, description, difficulty, skillTag, topicOrder, totalQuestions, completedQuestions`.
- `QuestionResponse`: `id, questionText, questionType, difficulty, skillTag, options[{key,text}]`.

Enums (label tiếng Việt trong `Cv.model.ts`/`Study.model.ts`):

- `ProficiencyLevel`: `BEGINNER` → Cơ bản, `INTERMEDIATE` → Trung cấp, `ADVANCED` → Nâng cao, `EXPERT` → Chuyên gia.
- `ProgramType`: `STUDY` → Ôn tập kiến thức, `INTERVIEW_PREP` → Luyện phỏng vấn.
- `ProgramStatus`: `ACTIVE` → Đang học, `COMPLETED` → Hoàn thành, `ARCHIVED` → Đã lưu trữ.
- `DifficultyLevel`: `BEGINNER/INTERMEDIATE/ADVANCED/MIXED` → Cơ bản/Trung cấp/Nâng cao/Đa cấp độ.
- `QuestionType`: `MCQ` → Trắc nghiệm, `SHORT_ANSWER` → Tự luận ngắn, `CODE` → Code, `AUDIO` → Audio.

FE đọc lỗi qua `readApiErrorMessage` (`src/utils/apiError.ts`); message nghiệp vụ tiếng Việt của BE giữ nguyên văn.

## 4. Ánh xạ số liệu -> UI

| Thành phần UI | Nguồn | Xử lý khi trống |
|---|---|---|
| Cột kết quả "Kết quả phân tích" | `cv` (`GET /cv`) | `cv.cvId == null` → thẻ empty state "Chưa có CV nào", không render cột kết quả |
| Chip kỹ năng `Java · 3 năm (Trung cấp)` | `skills[i]` + `PROFICIENCY_LABELS` | `years` null → chỉ tên + level; danh sách rỗng → "Chưa phát hiện kỹ năng nào." |
| Thẻ kinh nghiệm | `experience[i]` (company/role/duration/achievements) | danh sách rỗng → ẩn cả khối |
| Thẻ học vấn | `education[i]` (institution/degree/year) | `year` null → chỉ institution + degree |
| Chip vị trí gợi ý | `suggestedPositions` (chuỗi AI trả) | rỗng → ẩn khối |
| Bullet lỗ hổng kiến thức | `knowledgeGaps` (chuỗi AI trả) | rỗng → ẩn khối |
| Card "Vị trí đề xuất (N)" + % khớp | `recommendedPositions` (tính từ catalog `position_catalog` khớp `user_skill`) | rỗng → ẩn khối; thanh % dùng inline `width` duy nhất trong trang |
| Form vị trí mục tiêu | `targetPosition`/`targetLevel` + datalist ghép từ `suggestedPositions` ∪ `recommendedPositions[].title` ∪ giá trị hiện tại | chưa nhập → nút Lưu disabled; level mặc định `INTERMEDIATE` |
| Khối "Kỹ năng đã lưu (N)" | `GET /cv/skills` | 0 → "Chưa có kỹ năng nào được lưu." |
| Card chương trình (list) | `programs[i]`: chip trạng thái `PROGRAM_STATUS_LABELS`, type/target/difficulty, `fmtServer(createdAt,'date')`, `completedTopics/totalTopics chủ đề` | danh sách rỗng → empty state + link `/cv-analyzer` |
| Cột câu hỏi (detail) | `questions.content[i]` + `QUESTION_TYPE_LABELS` + `DIFFICULTY_LABELS` | chưa chọn chủ đề → "Chọn một chủ đề bên trái để xem câu hỏi." |
| MCQ | `options[{key,text}]` render radio | không phải MCQ → textarea |
| Kết quả chấm | `evaluation`: điểm, chip Đúng/Sai, feedback, modelAnswer, explanation, strengths, improvements | mỗi list rỗng → ẩn mục tương ứng |
| Phân trang câu hỏi | `questions.number/size/totalElements` qua `Pagination` của adminKit | 1 trang → nút prev/next disabled |

## 5. Khối cũ BỎ + lý do

- **Endpoint cũ `POST /cv/analyze` + `GET /cv/my` (mô hình `CvAnalysis` điểm/100 + suggestions)** — BE đã xóa 2 endpoint này, thay bằng `parse/upload` + `GET /cv`; model `CvAnalysis`, hàm `analyzeCv`/`getMyCvs`/`fetchMyCvs` xóa khỏi FE (grep xác nhận 0 reference).
- **Danh sách "CV đã phân tích" nhiều bản** — BE chỉ giữ 1 CV/user (`findByUserId` upsert); `CoverLettersPage` chuyển sang select 1 CV mới nhất.
- **Điểm CV /100** — `CvParseResponse` không còn field điểm; không chế số, bỏ luôn khối.

## 6. Quyết định triển khai

- Upload dùng `axios` + `FormData` (adapter xhr tự đặt boundary, không set `Content-Type` tay); validate client trước: đuôi `.pdf`/`.txt`, ≤10MB (`CV_MAX_BYTES`), lỗi hiện ngay dưới ô chọn file, không gửi request.
- Sau upload/parse thành công: refetch `GET /cv` (nạp kết quả) + `GET /cv/skills` (kỹ năng đã lưu) — BE tự upsert CV và replace skills.
- `updateTargetPosition` trả boolean; thành công → refetch `GET /cv` để cập nhật `targetPosition`/`targetLevel` và recommendations.
- `/study` tạo chương trình thành công → `navigate('/study/{id}')`; controller prepend program mới vào list để quay lại vẫn thấy.
- Detail `/study/:id`: fetch program + topics một lần; chọn topic → `fetchQuestions(topicId, page, size=10)` (đổi topic reset page=0, xóa câu trả lời + kết quả cũ); nộp câu → `submitAnswer` lưu `evaluation` theo `questionId`, lỗi hiện riêng `answerError` bên cạnh banner lỗi chung.
- `questionsPerTopic` trong form: input number, FE clamp 1–50 (khớp rule BE), mặc định 10.
- Trang ứng viên: `CandidateLayout` + candidateKit (`CARD`, `SOFT`, `ICON`, `CandidatePageHeader`), token `ds-*`, nhãn tiếng Việt 100%; breadcrumb "Trang chủ / Phân tích CV" và "Trang chủ / Lộ trình ôn tập / {title}". Mốc thời gian qua `fmtServer` (xử lý timestamp BE naive).
- `CvAnalyzerPage` grid `grid-cols-1 lg:grid-cols-2` (nhập | kết quả); khối đề xuất thanh % dùng inline `width` (ngoại lệ duy nhất).
- Không thêm dependency mới; không animation/skeleton.

## 7. Test cases

| # | Tình huống | Kết quả mong đợi |
|---|---|---|
| 1 | User chưa có CV mở `/cv-analyzer` | Cột kết quả hiện empty state "Chưa có CV nào"; kỹ năng đã lưu = 0 |
| 2 | Chọn file `.docx` hoặc >10MB | Lỗi client ngay dưới ô file, không gửi request |
| 3 | Dán nội dung <50 ký tự | Nút "Phân tích nội dung" disabled + nhắc tối thiểu |
| 4 | Upload/parse khi BE thiếu `OPENAI_API_KEY` | Banner lỗi hiện nguyên văn message BE; không crash, form giữ nguyên |
| 5 | CV đã có → mở trang | Cột kết quả đủ: kỹ năng (tên · năm · level), kinh nghiệm, học vấn, vị trí gợi ý, lỗ hổng, N card đề xuất có % khớp + đã có/còn thiếu |
| 6 | Lưu vị trí mục tiêu | PUT thành công; DB `user_cv.target_position/target_level` đúng; trang refetch |
| 7 | Tạo chương trình khi chưa có CV | Banner lỗi 400 nguyên văn "Chưa có CV..." |
| 8 | Tạo chương trình khi đã có CV | Redirect sang `/study/{id}`; list có card mới với chip trạng thái + meta |
| 9 | Mở `/study/:id` của người khác | BE 404 → banner lỗi, không crash |
| 10 | Chọn topic → câu hỏi | Hiện đúng `questionsPerTopic` câu, MCQ có radio, còn lại textarea; phân trang đúng |
| 11 | Nộp câu trả lời khi BE thiếu AI key | Banner chung + dòng lỗi riêng "Không đánh giá được câu trả lời — thử lại sau." |
| 12 | Đổi topic | Reset page=0, xóa đáp án + kết quả chấm cũ |
| 13 | `/cover-letters` khi đã có CV | Select CV tự chọn CV mới nhất; chưa có CV → nhắc phân tích trước |
| 14 | Sidebar ứng viên | Có item "Phân tích CV" và "Lộ trình ôn tập", mở được từ nav |

## 8. Cách đã verify

Theo `spec/verification.md`, đo trên stack Docker local (MySQL 3307, BE 8081, FE 3000) bằng browser-use (DOM + snapshot; viewport bị giới hạn nên chỉ kết luận render/hành vi, không kết luận thẩm mỹ):

1. `npx tsc --noEmit` sạch; grep 0 reference `CvAnalysis`/`analyzeCv`/`getMyCvs`/`fetchMyCvs`.
2. Rebuild FE trỏ BE local: `docker compose build --build-arg REACT_APP_API_URL=http://localhost:8081 frontend` + `up -d frontend` (bẫy: `.env.production` nhúng URL staging, build-arg phải override).
3. Tài khoản probe `cv.probe.20261115@example.com` / `ProbePass!23` (insert thẳng DB với BCrypt hash vì không biết mật khẩu user cũ; role ROLE_USER, enabled, totp tắt).
4. Seed DB để đo render luồng có dữ liệu (AI local không chạy được vì thiếu key): `user_cv` (JSON skills/experience/education/suggested/knowledge), `study_program` (STUDY/ACTIVE/INTERMEDIATE, 2 topics), `study_topic` ×2, `question` ×3 (1 MCQ + 2 SHORT_ANSWER), `user_skill` ×3.
5. Browser-use: login → sidebar; mở `/cv-analyzer`, `/study`, `/study/1`, `/cover-letters`; submit các luồng lỗi. Chi tiết số đo ở mục 11.

## 9. Câu hỏi mở cho anh Huy

1. **AI local** — đã giải quyết xong 2026-11-15: key anh Huy cấp (prefix `AQ.`) không phải key OpenAI mà là **key Gemini định dạng mới của Google AI Studio** (Google bỏ dần dạng `AIza…`). Cấu hình local (`.env` gitignored → `docker-compose.yml` backend): `OPENAI_API_KEY=<key AQ>`, `AI_PROVIDER=gemini`, `AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta`, `AI_MODEL=gemini-flash-lite-latest`, `AI_EVAL_MODEL=gemini-3.5-flash`, `AI_MAX_TOKENS=8192`. Lý do chọn model (đã đo từng model, mục 11): `3.8/3.7-flash` treo >90s (BE read-timeout 60s), `3.5-flash` có lúc viết vống số câu làm JSON cụt đuôi ở trần 4096 token, `flash-lite-latest` nhanh (~2s) và tuân thủ prompt. **Cả 3 luồng AI đã chạy thành công** (upload parse, generate chương trình, chấm câu trả lời). Với staging (Render) cần đặt y hệt 6 biến này cho service backend — Vercel không liên quan.
2. **Vị trí đề xuất phụ thuộc catalog admin**: `recommendedPositions` tính từ bảng `position_catalog` + `user_skill`. Catalog local đang có 3 vị trí (Backend Java Engineer, Fullstack Engineer, QA Automation Engineer). Nếu catalog trống thì khối "Vị trí đề xuất" tự ẩn — hành vi đúng, không cần xử lý.

## 10. Chia wave + file

| Wave | Việc | File |
|---|---|---|
| 1 | Model CV + Study mới khớp DTO BE (enums + label VN) | `src/models/Cv.model.ts`, `src/models/Study.model.ts` (mới) |
| 2 | Service + controller CV/Study | `src/services/cv.service.ts`, `src/services/study.service.ts` (mới), `src/controllers/useCvController.ts`, `src/controllers/useStudyController.ts` (mới) |
| 3 | Dựng lại CvAnalyzerPage (2 cột, form vị trí mục tiêu, kỹ năng đã lưu) | `src/views/pages/CvAnalyzerPage.tsx` |
| 4 | Trang Study list + generate, detail + trả lời + phân trang | `src/views/pages/StudyProgramsPage.tsx` (mới), `src/views/pages/StudyProgramDetailPage.tsx` (mới) |
| 5 | Route + nav + migrate CoverLettersPage | `src/App.tsx`, `src/views/layout/CandidateLayout.tsx`, `src/views/pages/CoverLettersPage.tsx` |

Không sửa shell/design token; không thêm dependency.

## 11. Kết quả

Đo ngày 2026-11-15 trên stack Docker local: MySQL `aiinterview-mysql` (host 3307, db `ai_interview_db`), backend `aiinterview-backend` (8081), FE image `aiinterview-stack-frontend:latest` (bundle build lại với `REACT_APP_API_URL=http://localhost:8081`) chạy tại `http://localhost:3000`. Tài khoản probe id 28 `cv.probe.20261115@example.com` (ROLE_USER). Dữ liệu seed: `user_cv` id 1, `study_program` id 1 (2 chủ đề, 3 câu hỏi), `user_skill` 3 dòng.

- Static: `npx tsc --noEmit` sạch; build Docker pass.
- API (browser-use network log, tất cả 200): `GET /api/v1/cv`, `GET /api/v1/cover-letters/my`, `GET /api/v1/jobs?page=0&size=10&search=` đều trỏ `localhost:8081`; không có console error trong suốt phiên.
- `/cv-analyzer` (DOM): đăng nhập xong sidebar có 2 item mới "Phân tích CV" + "Lộ trình ôn tập". Khi chưa có CV: cột kết quả empty state "Chưa có CV nào", kỹ năng đã lưu = 0. Sau khi seed CV: kết quả hiện đủ "CV_Probe.txt", KỸ NĂNG (3) gồm `Java · 3 năm (Trung cấp)`, `Spring Boot · 2 năm (Trung cấp)`, `MySQL · 1 năm (Cơ bản)`; kinh nghiệm 1 thẻ (role/company/duration/achievement); học vấn 1 thẻ; 2 chip vị trí gợi ý; 2 bullet lỗ hổng; 3 card đề xuất từ catalog (Backend Java Engineer 43% 3/7, Fullstack Engineer 43% 3/7, QA Automation Engineer 17% 1/6) có danh sách "Đã có"/"Còn thiếu"; kỹ năng đã lưu = 3.
- Lưu vị trí mục tiêu: nhập "Java Developer" + level INTERMEDIATE → bấm Lưu → SQL xác nhận `user_cv.target_position='Java Developer'`, `target_level='INTERMEDIATE'`.
- ~~Đường lỗi parse: dán nội dung ≥50 ký tự → bấm "Phân tích nội dung" → banner hiện nguyên văn lỗi BE "OPENAI_API_KEY chưa được cấu hình. Vui lòng đặt OPENAI_API_KEY trong file .env"; form giữ nguyên, không crash.~~ *(khối paste đã bỏ 2026-11-15 theo yêu cầu)*
- `/study`: form tạo chương trình đủ (select loại Ôn tập kiến thức/Luyện phỏng vấn, ô vị trí mục tiêu, số câu mỗi chủ đề 1–50 mặc định 10); bấm tạo khi chưa có CV → banner 400 nguyên văn "Chưa có CV. Hãy upload hoặc phân tích CV trước khi tạo chương trình ôn tập". Sau khi seed: list hiện 1 card "Lo trinh Java Backend" (chip "Đang học", "Ôn tập kiến thức", "Vị trí: Java Developer", "Độ khó: Trung cấp", ngày 15/11/2026, "0/2 chủ đề").
- `/study/1`: breadcrumb "Trang chủ / Lộ trình ôn tập / Lo trinh Java Backend", meta đầy đủ, 2 nút chủ đề "0. Java Core 0/2" + "1. Spring Boot 0/1"; chưa chọn chủ đề → "Chọn một chủ đề bên trái để xem câu hỏi." Chọn Java Core → 2 câu hỏi: 1 Tự luận ngắn (textarea) + 1 Trắc nghiệm (3 radio A/B/C), chip loại + kỹ năng + độ khó, phân trang "Hiển thị 1–2 trên 2 bản ghi, Trang 1/1".
- Nộp câu trả lời: điền đáp án → bấm "Nộp câu trả lời" → banner lỗi chung (message BE) + dòng lỗi riêng "Không đánh giá được câu trả lời — thử lại sau." (thiếu AI key, đúng đường lỗi).
- Upload file (đo bổ sung sau khi anh Huy bấm thử file thật và báo lỗi): lần đầu bấm "Phân tích file" bị **500 "Lỗi hệ thống"** — BE log `MultipartException: Current request is not a multipart request`. Nguyên nhân: `http.service.ts` đặt `Content-Type: application/json` mặc định cho instance, axios 1.x gặp FormData + content-type JSON sẽ `JSON.stringify` FormData thành chuỗi. Đã sửa `cv.service.ts.uploadCv` bằng cách override `headers: { 'Content-Type': 'multipart/form-data' }` cho riêng request (adapter xhr sẽ bỏ header này và để browser gắn boundary). Đo lại: POST `/api/v1/cv/upload` trả **502** kèm message "OPENAI_API_KEY chưa được cấu hình..." (handler `AIServiceException` → 502, không log) — tức multipart đã parse thành công, file vào tới bước gọi AI; chặn còn lại chỉ là thiếu key ở BE local.
- `/cover-letters`: select CV tự chọn "CV_Probe.txt" (CV mới nhất), select tin tuyển dụng hiện job thật; không crash, không còn reference model cũ.
- Đo luồng AI thật (bổ sung 2026-11-15, sau khi nối key Gemini — chi tiết cấu hình ở mục 9.1): **upload/parse** POST `/api/v1/cv/upload` với `cv-test-probe.txt` → 200 trong **1.9s** (5 kỹ năng, 1 kinh nghiệm, 1 học vấn, 3 lỗ hổng, 3 vị trí gợi ý). Trên UI với chính file thật `CV_Le_Van_Huy_Edit_Video_Shorts.pdf` của anh Huy → banner "Phân tích CV thành công", parse ra **9 kỹ năng** (CapCut/Canva/Figma/ChatGPT/Gemini/PHP/Laravel/Java/Spring Boot), 3 kinh nghiệm, 4 lỗ hổng, khối đề xuất tính lại theo kỹ năng mới (Backend Java Engineer 29% 2/7), kỹ năng đã lưu nhảy lên 9. **generate** POST `/api/v1/study/generate` (questionsPerTopic=2) → 200, program 9 chủ đề, tổng **61s** (nhiều lệnh gọi AI con, mỗi lệnh <60s read-timeout). **chấm câu trả lời** POST `/api/v1/study/topics/10/answer` → 200 trong **3.7s**, `score: 8`, `isCorrect: true`, feedback/strengths đầy đủ.
- Model đã đo trực tiếp (`:generateContent`, prompt thật của BE): `gemini-3.8-flash`/`3.7-flash` timeout >90s; `gemini-3.5-flash` 2.9s nhưng có lần viết 8 câu thay vì 2 → tràn 4096 token → JSON cụt đuôi → "AI trả dữ liệu không hợp lệ" (thấy raw content trong log BE); `gemini-flash-lite-latest` **1.9s, đúng 2 câu**. `gemini-flash-latest` (alias) trả 500 — không dùng.

**Lưu ý triển khai**

- `GET /api/v1/cv` không bao giờ 404: chưa có CV trả `CvParseResponse` rỗng (`cvId=null`) — mọi màn phải xử lý `cvId == null`, không dựa vào lỗi 404.
- **Bẫy multipart**: `http.service.ts` đặt `Content-Type: application/json` mặc định; axios 1.x sẽ biến `FormData` thành chuỗi JSON nếu content-type là JSON → BE báo "not a multipart request". Mọi request gửi FormData qua `httpService` phải override `headers: { 'Content-Type': 'multipart/form-data' }` như `cv.service.ts.uploadCv` (hiện chỉ mỗi chỗ này dùng FormData).
- Bảng mới (`user_cv`, `study_program`, `study_topic`, `user_skill`) do `ddl-auto: update` tạo; DB cũ có cột enum cũ mới cần `ALTER` tay (bẫy quen thuộc `features/create-job.md`), các bảng này là mới hoàn toàn nên không dính.
- Mốc thời gian BE trả naive (không offset) — dùng `fmtServer`/`parseServerTimestamp` như các màn khác.
- Khi build local phải override `REACT_APP_API_URL` qua build-arg (`.env.production` nhúng URL staging), như các lần trước.
- Tài khoản probe `cv.probe.20261115@example.com` và dữ liệu seed (`user_cv` 1, `study_program` 1, 2 topic, 3 question, 3 `user_skill`) là dữ liệu test của lần đo này; xóa bằng SQL nếu không cần giữ.

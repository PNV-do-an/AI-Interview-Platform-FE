import {
  AVATAR_RUBRIC_VERSION,
  InterviewEvaluationRequest,
  InterviewRubric,
  InterviewTranscriptEntry,
} from '../models/Interview.model';

const clampScore = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

const wordCount = (text?: string) =>
  (text ?? '').trim().split(/\s+/).filter(Boolean).length;

const hasAny = (text: string, keywords: string[]) =>
  keywords.some(keyword => text.includes(keyword));

const PROJECT_HINTS = [
  'dự án', 'project', 'triển khai', 'hệ thống', 'sản phẩm', 'team', 'nhóm', 'khách hàng',
];
const REASONING_HINTS = [
  'vì', 'do đó', 'nguyên nhân', 'giải pháp', 'phân tích', 'đánh đổi', 'trade-off', 'kết quả',
];

/**
 * Chấm rubric dự phòng khi AI service không sẵn sàng (phòng chạy text mode hoặc mất kênh
 * avatar). Điểm suy ra tất định từ chính transcript: số lượt đã chốt, độ dài/độ chi tiết
 * câu trả lời, thời lượng và các dấu hiệu dẫn chứng dự án / lập luận. Nhờ vậy ứng viên luôn
 * nhận được báo cáo ngay khi kết thúc phiên, không phải tự kéo thanh điểm.
 */
export const buildFallbackEvaluation = (
  transcript: InterviewTranscriptEntry[],
): InterviewEvaluationRequest => {
  const answers = transcript.filter(t => t.confirmed !== false && (t.answerText ?? '').trim());
  const count = answers.length;
  const words = answers.map(t => wordCount(t.answerText));
  const avgWords = count ? words.reduce((sum, n) => sum + n, 0) / count : 0;
  const totalSec = answers.reduce((sum, t) => sum + (t.durationSec ?? 0), 0);
  const detailed = answers.filter(t => wordCount(t.answerText) >= 25).length;
  const detailRatio = count ? detailed / count : 0;
  const joined = answers.map(t => (t.answerText ?? '').toLowerCase()).join(' ');

  // 40..85 điểm theo độ sâu câu trả lời; càng trả lời dài và chi tiết càng cao.
  const depth = clampScore(40 + (Math.min(avgWords, 90) / 90) * 45);
  // 35..85 điểm theo tỷ lệ lượt trả lời đủ chi tiết (>= 25 từ).
  const coverage = clampScore(35 + detailRatio * 50);
  const hasProject = hasAny(joined, PROJECT_HINTS);
  const hasReasoning = hasAny(joined, REASONING_HINTS);

  const clarityBase = avgWords >= 15 && avgWords <= 120 ? 76 : avgWords > 120 ? 66 : 48;
  const clarity = clampScore(clarityBase + Math.min(count, 10));

  const rubric: InterviewRubric = {
    chuyenMon: clampScore((depth + coverage) / 2),
    duAn: clampScore(depth * 0.6 + coverage * 0.4 + (hasProject ? 8 : 0)),
    tuDuy: clampScore(depth * 0.6 + coverage * 0.4 + (hasReasoning ? 8 : 0)),
    truyenDat: clarity,
    mucKhop: clampScore(coverage * 0.6 + depth * 0.4 + Math.min(count, 10)),
  };

  const strengths: string[] = [];
  if (count > 0) {
    strengths.push(
      `Hoàn thành ${count} lượt trả lời với tổng thời lượng ${Math.max(1, Math.round(totalSec / 60))} phút.`,
    );
  }
  if (detailRatio >= 0.5) {
    strengths.push(`Phần lớn câu trả lời đủ chi tiết (trung bình ~${Math.round(avgWords)} từ).`);
  }
  if (hasProject) {
    strengths.push('Có dẫn chứng từ dự án/hệ thống thực tế thay vì chỉ nêu lý thuyết.');
  }
  if (hasReasoning) {
    strengths.push('Thể hiện cách phân tích nguyên nhân, giải pháp và đánh đổi khi trình bày.');
  }
  if (strengths.length === 0) {
    strengths.push('Đã duy trì được hội thoại với AI trong suốt phiên phỏng vấn.');
  }

  const improvements: string[] = [];
  if (count === 0) {
    improvements.push('Chưa ghi nhận lượt trả lời nào; hãy luyện lại và trả lời ít nhất vài câu để báo cáo sát hơn.');
  } else if (avgWords < 25) {
    improvements.push(
      `Câu trả lời còn ngắn (trung bình ~${Math.round(avgWords)} từ); hãy mở rộng theo STAR và nêu kết quả đo được.`,
    );
  }
  if (count > 0 && detailRatio < 0.6) {
    improvements.push('Nên bổ sung bối cảnh, hành động cụ thể và kết quả cho từng câu trả lời.');
  }
  if (!hasProject) {
    improvements.push('Thêm ví dụ dự án thật: vai trò của bạn, công nghệ dùng và kết quả đạt được.');
  }
  if (!hasReasoning) {
    improvements.push('Nêu rõ lý do chọn giải pháp và đánh đổi để thể hiện tư duy giải quyết vấn đề.');
  }
  if (improvements.length === 0) {
    improvements.push('Tiếp tục luyện với câu hỏi khó hơn để duy trì phong độ và độ sâu câu trả lời.');
  }

  return {
    rubric,
    rubricVersion: AVATAR_RUBRIC_VERSION,
    strengths: strengths.join('\n'),
    improvements: improvements.join('\n'),
  };
};

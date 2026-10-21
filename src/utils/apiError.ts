// ErrorModel của BE (GlobalExceptionHandler) có dạng
// { status, message, path, timestamp, detail }. Bean validation trả message
// "Validation failed" và đẩy thông báo từng field vào map `detail`, nên nếu chỉ đọc
// `message` thì người dùng thấy đúng nhãn chung "Validation failed" mà không biết thiếu gì.
// `detail` phía BE là HashMap nên thứ tự key lật khật giữa hai lần gọi -> tự sắp theo form.
const TECHNICAL_DETAIL_KEYS = ['lockedUntil'];

// Bảng thông báo theo HTTP status, trích mục 10.2 SRS. Dùng làm tầng fallback khi BE
// không gửi `message` (mạng đứt, body rỗng) - BE luôn trả message tiếng Việt cụ thể
// nên message từ API luôn thắng bảng này.
const STATUS_FALLBACK: Record<number, string> = {
  400: 'Vui lòng kiểm tra lại các trường được đánh dấu.',
  401: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.',
  403: 'Bạn không có quyền thực hiện thao tác này.',
  404: 'Không tìm thấy nội dung bạn yêu cầu.',
  409: 'Thao tác không thể thực hiện ở trạng thái hiện tại.',
  422: 'Vui lòng kiểm tra lại các trường được đánh dấu.',
  429: 'Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút.',
  503: 'Dịch vụ tạm thời không phản hồi. Chúng tôi sẽ thử lại và thông báo khi có kết quả.',
  500: 'Đã có lỗi xảy ra. Vui lòng thử lại.',
};

export const readFieldMessages = (detail: unknown, fieldOrder: string[]): string[] => {
  if (!detail || typeof detail !== 'object') return [];
  const map = detail as Record<string, unknown>;
  return Object.keys(map)
    .filter((key) => TECHNICAL_DETAIL_KEYS.indexOf(key) === -1)
    .filter((key) => typeof map[key] === 'string' && (map[key] as string).trim())
    .sort((a, b) => {
      const ia = fieldOrder.indexOf(a);
      const ib = fieldOrder.indexOf(b);
      return (ia < 0 ? fieldOrder.length : ia) - (ib < 0 ? fieldOrder.length : ib);
    })
    .map((key) => (map[key] as string).trim());
};

export const readApiErrorMessage = (err: any, fallback: string, fieldOrder: string[] = []): string => {
  const data = err?.response?.data;
  const message: string = data?.message || data?.errorMessage || '';
  const fieldMessages = readFieldMessages(data?.detail, fieldOrder).join('; ');
  if (message === 'Validation failed') return fieldMessages || fallback;
  if (message || fieldMessages) return message || fieldMessages;
  const status: number | undefined = err?.response?.status;
  if (status && STATUS_FALLBACK[status]) return STATUS_FALLBACK[status];
  return fallback;
};

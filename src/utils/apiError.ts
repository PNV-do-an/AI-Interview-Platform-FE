// ErrorModel của BE (GlobalExceptionHandler) có dạng
// { status, message, path, timestamp, detail }. Bean validation trả message
// "Validation failed" và đẩy thông báo từng field vào map `detail`, nên nếu chỉ đọc
// `message` thì người dùng thấy đúng nhãn chung "Validation failed" mà không biết thiếu gì.
// `detail` phía BE là HashMap nên thứ tự key lật khật giữa hai lần gọi -> tự sắp theo form.
const TECHNICAL_DETAIL_KEYS = ['lockedUntil'];

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
  return message || fieldMessages || fallback;
};

// BE trả LocalDateTime không kèm offset; container và production chạy UTC.
export const parseServerTimestamp = (value: string | null | undefined): Date | null => {
  if (!value) return null;
  const hasOffset = /(?:Z|[+-]\d{2}:?\d{2})$/.test(value);
  const normalized = value.includes('T') && !hasOffset ? `${value}Z` : value;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const splitCommaList = (value?: string | null): string[] => {
  if (!value) return [];
  const seen = new Set<string>();
  const items: string[] = [];
  value.split(',').forEach((part) => {
    const item = part.trim();
    if (!item) return;
    const key = item.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    items.push(item);
  });
  return items;
};

export const joinCommaList = (items: string[]): string =>
  items.map((item) => item.trim()).filter(Boolean).join(', ');

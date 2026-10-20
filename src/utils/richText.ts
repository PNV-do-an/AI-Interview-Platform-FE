import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'p', 'div', 'br', 'strong', 'b', 'em', 'i', 'u', 's',
  'ul', 'ol', 'li', 'h2', 'blockquote', 'pre', 'code', 'a',
];
const ALLOWED_ATTR = ['href'];
const ALLOWED_URI_REGEXP = /^(?:https?:|mailto:)/i;
const HTML_TAG_RE = /<(?:p|div|br|strong|b|em|i|u|s|ul|ol|li|h2|blockquote|pre|code|a)\b[^>]*>/i;

export const isRichTextHtml = (value?: string | null): boolean =>
  Boolean(value && HTML_TAG_RE.test(value));

export const sanitizeRichText = (html?: string | null): string => {
  if (!html) return '';
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP,
  });
  const doc = new DOMParser().parseFromString(`<div>${clean}</div>`, 'text/html');
  doc.querySelectorAll('a').forEach((anchor) => {
    anchor.setAttribute('target', '_blank');
    anchor.setAttribute('rel', 'noopener noreferrer');
  });
  return doc.body.firstElementChild?.innerHTML ?? '';
};

const richTextToPlainText = (value: string): string => {
  const doc = new DOMParser().parseFromString(sanitizeRichText(value), 'text/html');
  return doc.body.textContent ?? '';
};

export const richTextExcerpt = (value?: string | null, maxLength = 220): string => {
  if (!value) return '';
  const source = isRichTextHtml(value) ? richTextToPlainText(value) : value;
  const text = source.replace(/\s+/g, ' ').trim();
  return text.length > maxLength ? `${text.slice(0, maxLength).trimEnd()}…` : text;
};

export const toRichTextHtml = (value?: string | null): string => {
  if (!value) return '';
  if (isRichTextHtml(value)) return sanitizeRichText(value);
  const container = document.createElement('div');
  container.textContent = value;
  return container.innerHTML.replace(/\r?\n/g, '<br>');
};

const IT_TERMS = [
  'software',
  'phan mem',
  'developer',
  'programmer',
  'lap trinh',
  'front end',
  'backend',
  'back end',
  'full stack',
  'fullstack',
  'web',
  'mobile',
  'android',
  'ios',
  'data',
  'du lieu',
  'database',
  'dba',
  'ai',
  'ml',
  'machine learning',
  'deep learning',
  'nlp',
  'tri tue nhan tao',
  'devops',
  'sre',
  'site reliability',
  'cloud',
  'aws',
  'azure',
  'gcp',
  'kubernetes',
  'docker',
  'security',
  'cybersecurity',
  'infosec',
  'an ninh mang',
  'an toan thong tin',
  'qa',
  'quality assurance',
  'tester',
  'testing',
  'kiem thu',
  'automation',
  'embedded',
  'firmware',
  'robotics',
  'blockchain',
  'game',
  'unity',
  'unreal',
  'network',
  'quan tri mang',
  'sysadmin',
  'system administrator',
  'system admin',
  'he thong',
  'it support',
  'helpdesk',
  'help desk',
  'technical',
  'computer',
  'may tinh',
  'informatics',
  'ict',
  'cntt',
  'cong nghe thong tin',
  'ky su phan mem',
  'phat trien web',
];

const NON_IT_ENGINEERING = /\b(mechanical|civil|chemical|electrical|electronic|industrial|aerospace|structural|environmental|biomedical|agricultural|mining|petroleum|marine|geotechnical)\b/;

const IT_PATTERN = new RegExp(`\\b(?:${IT_TERMS.join('|')})\\b`);
const GENERIC_ENGINEERING = /\b(?:engineer|engineers|engineering)\b/;
const UPPERCASE_IT = /(?:^|[^A-Za-z])IT(?:[^A-Za-z]|$)/;

const normalizeTitle = (value: string): string => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'D')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

export const isItRelatedJobTitle = (title: string): boolean => {
  if (!title.trim()) return false;
  if (UPPERCASE_IT.test(title)) return true;

  const normalized = normalizeTitle(title);
  if (IT_PATTERN.test(normalized)) return true;
  return GENERIC_ENGINEERING.test(normalized) && !NON_IT_ENGINEERING.test(normalized);
};

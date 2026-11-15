/**
 * Model khớp DTO ScanCV của BE (CvParseResponse + SkillResponse).
 * Mức độ thuần thục kỹ năng dùng enum ProficiencyLevel (BE có thêm EXPERT).
 */
export type ProficiencyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

export interface CvSkill {
  name: string;
  proficiency: ProficiencyLevel;
  years: number | null;
}

export interface CvExperience {
  company: string;
  role: string;
  duration: string;
  achievements: string[];
}

export interface CvEducation {
  institution: string;
  degree: string;
  year: number | null;
}

export interface PositionRecommendation {
  positionId: number;
  title: string;
  slug: string;
  level: string;
  description: string;
  requiredSkillCount: number;
  matchedSkillCount: number;
  matchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
}

/** GET/POST/PUT /api/v1/cv* — kết quả phân tích CV. Khi chưa có CV, BE trả object rỗng (cvId null). */
export interface CvParseResponse {
  cvId: number | null;
  fileName: string | null;
  skills: CvSkill[];
  experience: CvExperience[];
  education: CvEducation[];
  suggestedPositions: string[];
  knowledgeGaps: string[];
  recommendedPositions: PositionRecommendation[];
  targetPosition: string | null;
  targetLevel: string | null;
}

/** GET /api/v1/cv/skills — kỹ năng đã lưu kèm id (khác CvSkill ở field id). */
export interface CvSkillItem {
  id: number;
  name: string;
  proficiency: ProficiencyLevel;
  years: number | null;
}

export const PROFICIENCY_LABELS: Record<ProficiencyLevel, string> = {
  BEGINNER: 'Cơ bản',
  INTERMEDIATE: 'Trung cấp',
  ADVANCED: 'Nâng cao',
  EXPERT: 'Chuyên gia',
};

export interface CoverLetter {
  id: number;
  title: string;
  jobId?: number;
  jobTitle?: string;
  companyName?: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

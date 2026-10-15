export interface CvAnalysis {
  id: number;
  fileName?: string;
  detectedSkills: string[];
  cvScore: number;
  suggestions: string[];
  createdAt: string;
}

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

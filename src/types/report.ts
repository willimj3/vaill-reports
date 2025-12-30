export interface Report {
  slug: string;
  title: string;
  type: 'monthly' | 'quarterly';
  year: number;
  month: number;
  quarter: number | null;
  sortKey: number;
  sourceFile: string;
  html: string;
  excerpt: string;
}

export interface ReportsData {
  generatedAt: string;
  totalReports: number;
  reports: Report[];
}

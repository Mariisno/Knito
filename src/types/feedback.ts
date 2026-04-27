export type ReportType = 'bug' | 'feature';
export type ReportStatus = 'open' | 'in-progress' | 'resolved' | 'wontfix';

export interface Report {
  id: string;
  type: ReportType;
  title: string;
  description: string;
  status: ReportStatus;
  upvotes: number;
  voters: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicReport {
  id: string;
  type: ReportType;
  title: string;
  description: string;
  status: ReportStatus;
  upvotes: number;
  hasVoted: boolean;
  createdAt: string;
  updatedAt: string;
}

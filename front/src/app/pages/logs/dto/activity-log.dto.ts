export interface LogLocation {
  ll?: [number, number];
  city?: string;
  region?: string;
  country?: string;
  timezone?: string;
}

export interface ActivityLog {
  id: number;
  action: string;
  userId: number | null;
  userEmail: string;
  description: string;
  metadata: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  location: LogLocation | null;
  createdAt: string;
}

export interface PaginatedLogs {
  data: ActivityLog[];
  total: number;
  page: number;
  lastPage: number;
}

export type Role =
  | "CITIZEN"
  | "FIELD_INSPECTOR"
  | "WARD_CSI"
  | "ZONAL_OFFICER"
  | "DEPT_HOD"
  | "SUPER_ADMIN";

export type IssuePriority = "CRITICAL" | "HIGH" | "STANDARD";

export type IssueStatus =
  | "RECEIVED"
  | "MERGED"
  | "TRIAGED"
  | "ASSIGNED"
  | "UNROUTED"
  | "IN_PROGRESS"
  | "PENDING_AUDIT"
  | "PENDING_REVIEW"
  | "RESOLVED"
  | "REOPENED";

export interface UserSession {
  id: string;
  phone: string;
  fullName: string;
  role: Role;
  department?: string;
  assignedWardIds?: string[];
  token: string;
}

export interface CivicIssue {
  id: string;
  ticketCode: string;
  title: string;
  category: string;
  description?: string;
  status: IssueStatus;
  priority: IssuePriority;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    wardNumber?: number;
    zoneNumber?: number;
  };
  beforeImageUrl: string;
  afterImageUrl?: string;
  createdAt: string;
  slaDeadline: string;
  upvotesCount: number;
  hasUpvoted?: boolean;
}

export interface CaptureNonceResponse {
  nonce: string;
  expiresAt: string;
}

export interface CreateIssuePayload {
  nonce: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  imageBase64: string;
  categoryHint?: string;
  note?: string;
}

export interface ApiClientConfig {
  baseUrl: string;
  token?: string;
}

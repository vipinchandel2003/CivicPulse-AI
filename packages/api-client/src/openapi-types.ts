/**
 * Auto-generated and synchronized TypeScript models from CivicPulse FastAPI OpenAPI schema.
 */

export type UserRole =
  | "CITIZEN"
  | "FIELD_INSPECTOR"
  | "WARD_CSI"
  | "ZONAL_OFFICER"
  | "DEPT_HOD"
  | "SUPER_ADMIN";

export type Department =
  | "SOLID_WASTE"
  | "ROADS_DRAINAGE"
  | "ELECTRICAL"
  | "WATER_WORKS"
  | "GENERAL";

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

export type PriorityLevel = "CRITICAL" | "HIGH" | "STANDARD";

export interface OTPRequest {
  phone: string;
}

export interface OTPVerifyRequest {
  phone: string;
  otp: string;
  device_id: string;
  platform?: string;
  fcm_token?: string | null;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  role: UserRole;
  phone: string;
}

export interface CaptureNonceResponse {
  nonce: string;
  ttl_seconds: number;
}

export interface IssueCreateRequest {
  capture_nonce: string;
  title: string;
  category: string;
  department?: Department;
  longitude: number;
  latitude: number;
  accuracy_m: number;
  image_base64_or_key: string;
  note?: string | null;
  device_id: string;
}

export interface IssueSubmitResponse {
  ticket_code: string;
  issue_id: string;
  status: IssueStatus;
  is_duplicate: boolean;
  merged_with?: string | null;
  message: string;
}

export interface NearbyIssueItem {
  id: string;
  ticket_code: string;
  title: string;
  category: string;
  status: IssueStatus;
  priority: PriorityLevel;
  longitude: number;
  latitude: number;
  distance_metres: number;
  upvote_count: number;
  created_at: string;
}

export interface ResolveIssueRequest {
  capture_nonce: string;
  longitude: number;
  latitude: number;
  accuracy_m: number;
  is_mock_location: boolean;
  device_attestation_token?: string | null;
  after_image_key: string;
  perceptual_hash?: string | null;
  resolution_notes?: string | null;
}

export interface ReviewDecisionRequest {
  decision: "APPROVE" | "REJECT";
  rejection_reason?: string | null;
}

export interface CitizenReopenRequest {
  reopen_reason: string;
}

export interface CSATSubmissionRequest {
  rating: number;
  feedback?: string | null;
}

export interface InspectorTaskItem {
  id: string;
  ticket_code: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  sla_deadline?: string | null;
  created_at: string;
}

export interface AnalyticsOverview {
  total_tickets: number;
  active_load: number;
  resolved_count: number;
  sla_compliance_percent: number;
  city: string;
}

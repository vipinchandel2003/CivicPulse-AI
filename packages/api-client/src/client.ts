import {
  CivicIssue,
  CaptureNonceResponse,
  CreateIssuePayload,
  UserSession,
  Role
} from "./types";
import { MOCK_ISSUES, MOCK_USERS } from "./mockData";

export class CivicPulseClient {
  private baseUrl: string;
  private token?: string;
  private useMock: boolean;

  constructor(config?: { baseUrl?: string; token?: string; useMock?: boolean }) {
    this.baseUrl = config?.baseUrl || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    this.token = config?.token;
    this.useMock = config?.useMock ?? true;
  }

  setToken(token: string) {
    this.token = token;
  }

  // --- Auth API ---
  async requestOtp(phone: string): Promise<{ success: boolean; message: string }> {
    if (this.useMock) {
      const { promise, resolve } = Promise.withResolvers<void>();
      setTimeout(resolve, 400);
      await promise;
      return { success: true, message: "OTP sent successfully via SMS/WhatsApp" };
    }
    const res = await fetch(`${this.baseUrl}/auth/otp/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone })
    });
    return res.json();
  }

  async verifyOtp(phone: string, otp: string, intendedRole: Role = "CITIZEN"): Promise<UserSession> {
    if (this.useMock) {
      const { promise, resolve } = Promise.withResolvers<void>();
      setTimeout(resolve, 500);
      await promise;
      if (otp === "0000" || otp === "1234") {
        throw new Error("Invalid or expired OTP");
      }
      if (intendedRole === "SUPER_ADMIN" || intendedRole === "WARD_CSI") {
        return MOCK_USERS.admin;
      }
      if (intendedRole === "FIELD_INSPECTOR") {
        return MOCK_USERS.inspector;
      }
      return { ...MOCK_USERS.citizen, phone };
    }

    const res = await fetch(`${this.baseUrl}/auth/otp/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, otp })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Authentication failed" }));
      throw new Error(err.message || "Authentication failed");
    }
    return res.json();
  }

  // --- Issues API ---
  async getCaptureNonce(): Promise<CaptureNonceResponse> {
    if (this.useMock) {
      return {
        nonce: `nonce-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        expiresAt: new Date(Date.now() + 60000).toISOString()
      };
    }
    const res = await fetch(`${this.baseUrl}/capture/nonce`, {
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {}
    });
    return res.json();
  }

  async getNearbyIssues(lat?: number, lng?: number, radiusMeters = 2000): Promise<CivicIssue[]> {
    if (this.useMock) {
      const { promise, resolve } = Promise.withResolvers<void>();
      setTimeout(resolve, 350);
      await promise;
      return [...MOCK_ISSUES];
    }
    const params = new URLSearchParams();
    if (lat && lng) {
      params.append("lat", lat.toString());
      params.append("lng", lng.toString());
      params.append("radius", radiusMeters.toString());
    }
    const res = await fetch(`${this.baseUrl}/issues/nearby?${params.toString()}`, {
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {}
    });
    return res.json();
  }

  async getIssueById(id: string): Promise<CivicIssue> {
    if (this.useMock) {
      const { promise, resolve } = Promise.withResolvers<void>();
      setTimeout(resolve, 200);
      await promise;
      const issue = MOCK_ISSUES.find((i) => i.id === id || i.ticketCode === id);
      if (!issue) throw new Error("Ticket not found");
      return issue;
    }
    const res = await fetch(`${this.baseUrl}/issues/${id}`, {
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {}
    });
    return res.json();
  }

  async createIssue(payload: CreateIssuePayload): Promise<{ ticketCode: string; status: string; id: string }> {
    if (this.useMock) {
      const { promise, resolve } = Promise.withResolvers<void>();
      setTimeout(resolve, 600);
      await promise;
      const newId = `iss-${Date.now()}`;
      const newTicketCode = `IMC-2026-W64-${Math.floor(1000 + Math.random() * 9000)}`;
      MOCK_ISSUES.unshift({
        id: newId,
        ticketCode: newTicketCode,
        title: payload.categoryHint || "Civic Complaint",
        category: payload.categoryHint || "General Hazard",
        description: payload.note || "Reported via Citizen App",
        status: "RECEIVED",
        priority: "HIGH",
        location: {
          latitude: payload.latitude,
          longitude: payload.longitude,
          address: "Ward 64, Indore, MP",
          wardNumber: 64,
          zoneNumber: 3
        },
        beforeImageUrl: payload.imageBase64.startsWith("data:")
          ? payload.imageBase64
          : "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80",
        createdAt: new Date().toISOString(),
        slaDeadline: new Date(Date.now() + 86400000).toISOString(),
        upvotesCount: 1,
        hasUpvoted: true
      });
      return { id: newId, ticketCode: newTicketCode, status: "RECEIVED" };
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Idempotency-Key": `idem-${Date.now()}`
    };
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${this.baseUrl}/issues`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });
    return res.json();
  }

  async upvoteIssue(issueId: string): Promise<{ success: boolean; upvotesCount: number }> {
    if (this.useMock) {
      const issue = MOCK_ISSUES.find((i) => i.id === issueId);
      if (issue) {
        issue.hasUpvoted = !issue.hasUpvoted;
        issue.upvotesCount += issue.hasUpvoted ? 1 : -1;
        return { success: true, upvotesCount: issue.upvotesCount };
      }
    }
    const res = await fetch(`${this.baseUrl}/issues/${issueId}/upvote`, {
      method: "POST",
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {}
    });
    return res.json();
  }
}

export const civicPulseApi = new CivicPulseClient();

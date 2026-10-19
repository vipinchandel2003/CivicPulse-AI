import { CivicIssue, UserSession } from "./types";

export const MOCK_ISSUES: CivicIssue[] = [
  {
    id: "iss-101",
    ticketCode: "IMC-2026-W64-0012",
    title: "Open Main Road Manhole",
    category: "Drainage / Manhole",
    description: "Deep open chamber near Rajwada square posing acute fall risk.",
    status: "ASSIGNED",
    priority: "CRITICAL",
    location: {
      latitude: 22.7196,
      longitude: 75.8577,
      address: "MG Road, near Rajwada Chowk",
      wardNumber: 64,
      zoneNumber: 3
    },
    beforeImageUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    slaDeadline: new Date(Date.now() + 10800000).toISOString(), // 3 hours left
    upvotesCount: 14,
    hasUpvoted: true
  },
  {
    id: "iss-102",
    ticketCode: "IMC-2026-W64-0015",
    title: "Garbage Pile near School Gate",
    category: "Solid Waste Management",
    description: "Overflowing bin blocking pedestrian walkway.",
    status: "IN_PROGRESS",
    priority: "HIGH",
    location: {
      latitude: 22.7212,
      longitude: 75.8611,
      address: "Annapurna Road, Ward 64",
      wardNumber: 64,
      zoneNumber: 3
    },
    beforeImageUrl: "https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=600&auto=format&fit=crop&q=80",
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    slaDeadline: new Date(Date.now() + 28800000).toISOString(),
    upvotesCount: 6,
    hasUpvoted: false
  },
  {
    id: "iss-103",
    ticketCode: "IMC-2026-W64-0008",
    title: "Pothole Repaired & Levelled",
    category: "Roads & Footpaths",
    description: "Deep cavity near bus stop filled with bitumen mix.",
    status: "RESOLVED",
    priority: "HIGH",
    location: {
      latitude: 22.7255,
      longitude: 75.8645,
      address: "Bhawarkua Main Junction",
      wardNumber: 64,
      zoneNumber: 3
    },
    beforeImageUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80",
    afterImageUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb18f15f6?w=600&auto=format&fit=crop&q=80",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    slaDeadline: new Date(Date.now() - 3600000).toISOString(),
    upvotesCount: 22,
    hasUpvoted: false
  }
];

export const MOCK_USERS: Record<string, UserSession> = {
  citizen: {
    id: "usr-cit-1",
    phone: "9876543210",
    fullName: "Aarav Sharma",
    role: "CITIZEN",
    token: "mock-jwt-citizen-token"
  },
  inspector: {
    id: "usr-insp-1",
    phone: "9876543211",
    fullName: "Ramesh Verma (CSI Field Staff)",
    role: "FIELD_INSPECTOR",
    department: "Solid Waste Management",
    assignedWardIds: ["64"],
    token: "mock-jwt-inspector-token"
  },
  admin: {
    id: "usr-adm-1",
    phone: "9876543212",
    fullName: "Dr. P. Singhal (Municipal Commissioner)",
    role: "SUPER_ADMIN",
    token: "mock-jwt-admin-token"
  }
};

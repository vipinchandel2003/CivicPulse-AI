export interface IssueEventItem {
  id: string;
  type: string;
  fromStatus?: string;
  toStatus: string;
  actorRole: string;
  actorName: string;
  timestamp: string;
  note?: string;
}

export function getMockTimelineEvents(status: string): IssueEventItem[] {
  const base: IssueEventItem[] = [
    {
      id: "ev-1",
      type: "REPORTED",
      toStatus: "RECEIVED",
      actorRole: "CITIZEN",
      actorName: "Citizen Reporter",
      timestamp: "Today, 10:15 AM",
      note: "Live geotagged capture verified with server nonce"
    },
    {
      id: "ev-2",
      type: "AI_TRIAGE_COMPLETED",
      fromStatus: "RECEIVED",
      toStatus: "TRIAGED",
      actorRole: "AI_SERVICE",
      actorName: "YOLO + CLIP Pipeline",
      timestamp: "Today, 10:16 AM",
      note: "Hazard confidence 94.2%, Priority computed: HIGH"
    },
    {
      id: "ev-3",
      type: "DISPATCHED",
      fromStatus: "TRIAGED",
      toStatus: "ASSIGNED",
      actorRole: "SYSTEM",
      actorName: "PostGIS Dispatcher",
      timestamp: "Today, 10:17 AM",
      note: "Assigned to Ward 64 on-duty CSI Ramesh Verma"
    }
  ];

  if (status === "IN_PROGRESS" || status === "RESOLVED") {
    base.push({
      id: "ev-4",
      type: "WORK_STARTED",
      fromStatus: "ASSIGNED",
      toStatus: "IN_PROGRESS",
      actorRole: "FIELD_INSPECTOR",
      actorName: "Ramesh Verma",
      timestamp: "Today, 11:30 AM",
      note: "On-site inspection initiated"
    });
  }

  if (status === "RESOLVED") {
    base.push({
      id: "ev-5",
      type: "PROOF_VERIFIED",
      fromStatus: "IN_PROGRESS",
      toStatus: "RESOLVED",
      actorRole: "AI_AUDIT",
      actorName: "CLIP Background + Geofence",
      timestamp: "Today, 02:45 PM",
      note: "After-photo geofence 14.2m verified. Target defect absent."
    });
  }

  return base;
}

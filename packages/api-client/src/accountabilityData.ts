export interface StaffAccountabilityMetric {
  inspectorId: string;
  inspectorName: string;
  department: string;
  wardNumber: number;
  activeLoadCount: number;
  slaCompliancePercent: number; // e.g. 94.5%
  mttrHours: number; // Mean Time to Resolution (hours)
  reopenRatePercent: number; // Rate of citizen reopenings
  fakeClosureFlags: number; // AI / Geofence rejections
  kpiScore: number; // Computed score 0 - 100
  performanceTier: "TOP_PERFORMER" | "SATISFACTORY" | "ESCALATION_WATCH" | "CRITICAL_REVIEW";
}

export interface IcccRedListItem {
  id: string;
  ticketCode: string;
  title: string;
  wardNumber: number;
  assignedInspector: string;
  escalationLevel: "L1_WARD" | "L2_ZONE" | "L3_COMMISSIONER";
  overdueHours: number;
  hazardRisk: "HIGH" | "CRITICAL";
  showCauseEligible: boolean;
}

export const MOCK_STAFF_ACCOUNTABILITY: StaffAccountabilityMetric[] = [
  {
    inspectorId: "insp-01",
    inspectorName: "Ramesh Verma",
    department: "Solid Waste Management",
    wardNumber: 64,
    activeLoadCount: 3,
    slaCompliancePercent: 96.2,
    mttrHours: 3.4,
    reopenRatePercent: 2.1,
    fakeClosureFlags: 0,
    kpiScore: 94,
    performanceTier: "TOP_PERFORMER"
  },
  {
    inspectorId: "insp-02",
    inspectorName: "Suresh Patidar",
    department: "Drainage & Sewerage",
    wardNumber: 64,
    activeLoadCount: 7,
    slaCompliancePercent: 88.0,
    mttrHours: 5.8,
    reopenRatePercent: 4.5,
    fakeClosureFlags: 1,
    kpiScore: 82,
    performanceTier: "SATISFACTORY"
  },
  {
    inspectorId: "insp-03",
    inspectorName: "Anil Sharma",
    department: "Roads & Civil Works",
    wardNumber: 85,
    activeLoadCount: 11,
    slaCompliancePercent: 71.4,
    mttrHours: 8.6,
    reopenRatePercent: 9.8,
    fakeClosureFlags: 3,
    kpiScore: 61,
    performanceTier: "ESCALATION_WATCH"
  },
  {
    inspectorId: "insp-04",
    inspectorName: "Dinesh Malviya",
    department: "Electrical & Streetlights",
    wardNumber: 12,
    activeLoadCount: 14,
    slaCompliancePercent: 54.0,
    mttrHours: 14.2,
    reopenRatePercent: 16.4,
    fakeClosureFlags: 5,
    kpiScore: 42,
    performanceTier: "CRITICAL_REVIEW"
  }
];

export const MOCK_ICCC_RED_LIST: IcccRedListItem[] = [
  {
    id: "red-01",
    ticketCode: "IMC-2026-W12-0492",
    title: "High Voltage Live Cable Exposed Outside Primary School",
    wardNumber: 12,
    assignedInspector: "Dinesh Malviya",
    escalationLevel: "L3_COMMISSIONER",
    overdueHours: 18.5,
    hazardRisk: "CRITICAL",
    showCauseEligible: true
  },
  {
    id: "red-02",
    ticketCode: "IMC-2026-W85-0811",
    title: "Collapsed Footpath Trench Blocking Transit Arterial",
    wardNumber: 85,
    assignedInspector: "Anil Sharma",
    escalationLevel: "L2_ZONE",
    overdueHours: 9.2,
    hazardRisk: "HIGH",
    showCauseEligible: false
  }
];

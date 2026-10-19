export interface H3HexCell {
  h3Index: string;
  centroid: [number, number]; // [lat, lng]
  incidentCount: number;
  criticalRatio: number; // 0 to 1
  riskLevel: "CRITICAL_RED" | "HIGH_AMBER" | "NORMAL_GREEN";
  zoneName: string;
  wardNumber: number;
}

export interface ChronicBlackspot {
  id: string;
  landmark: string;
  wardNumber: number;
  zoneNumber: number;
  totalRepeatsPast90Days: number;
  primaryCategory: string;
  suggestedAction: string;
  slaBreachRate: number; // percentage
  status: "ACTIVE_BLACKSPOT" | "UNDER_REMEDIATION";
}

export const MOCK_H3_CELLS: H3HexCell[] = [
  {
    h3Index: "8861952525fffff",
    centroid: [22.7196, 75.8577],
    incidentCount: 42,
    criticalRatio: 0.35,
    riskLevel: "CRITICAL_RED",
    zoneName: "Central Zone",
    wardNumber: 64
  },
  {
    h3Index: "8861952527fffff",
    centroid: [22.7212, 75.8611],
    incidentCount: 18,
    criticalRatio: 0.15,
    riskLevel: "HIGH_AMBER",
    zoneName: "Central Zone",
    wardNumber: 64
  },
  {
    h3Index: "8861952529fffff",
    centroid: [22.7255, 75.8645],
    incidentCount: 6,
    criticalRatio: 0.0,
    riskLevel: "NORMAL_GREEN",
    zoneName: "Central Zone",
    wardNumber: 64
  },
  {
    h3Index: "8861952521fffff",
    centroid: [22.7100, 75.8520],
    incidentCount: 29,
    criticalRatio: 0.28,
    riskLevel: "HIGH_AMBER",
    zoneName: "West Zone",
    wardNumber: 85
  },
  {
    h3Index: "8861952523fffff",
    centroid: [22.7050, 75.8480],
    incidentCount: 54,
    criticalRatio: 0.44,
    riskLevel: "CRITICAL_RED",
    zoneName: "West Zone",
    wardNumber: 85
  }
];

export const MOCK_CHRONIC_BLACKSPOTS: ChronicBlackspot[] = [
  {
    id: "bls-1",
    landmark: "Rajwada Main Square Junction",
    wardNumber: 64,
    zoneNumber: 3,
    totalRepeatsPast90Days: 19,
    primaryCategory: "Open Manholes & Storm Drainage",
    suggestedAction: "Permanent cast-iron chamber lock replacement and hydraulic grade re-alignment.",
    slaBreachRate: 31.6,
    status: "ACTIVE_BLACKSPOT"
  },
  {
    id: "bls-2",
    landmark: "Annapurna Mandir Commercial Alley",
    wardNumber: 64,
    zoneNumber: 3,
    totalRepeatsPast90Days: 14,
    primaryCategory: "Solid Waste Dumping / Commercial Overflow",
    suggestedAction: "Install 2 additional 1.1m³ dumper bins and deploy 24x7 CCTV penalty surveillance.",
    slaBreachRate: 14.2,
    status: "UNDER_REMEDIATION"
  },
  {
    id: "bls-3",
    landmark: "Bhawarkua BRTS Crossing Corner",
    wardNumber: 85,
    zoneNumber: 4,
    totalRepeatsPast90Days: 23,
    primaryCategory: "Bitumen Pothole Sinkhole",
    suggestedAction: "Full-depth mastic asphalt mill-and-pave over 120m stretch.",
    slaBreachRate: 43.5,
    status: "ACTIVE_BLACKSPOT"
  }
];

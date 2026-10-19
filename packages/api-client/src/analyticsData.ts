export interface DailyTrendPoint {
  date: string;
  reported: number;
  resolved: number;
  breached: number;
}

export interface CategoryBreakdownPoint {
  name: string;
  count: number;
  color: string;
}

export interface ZoneMttrComparison {
  zone: string;
  mttrHours: number;
  slaPercent: number;
  benchmarkHours: number;
}

export const MOCK_DAILY_TRENDS: DailyTrendPoint[] = [
  { date: "Mon", reported: 45, resolved: 42, breached: 3 },
  { date: "Tue", reported: 52, resolved: 49, breached: 4 },
  { date: "Wed", reported: 68, resolved: 60, breached: 6 },
  { date: "Thu", reported: 58, resolved: 55, breached: 2 },
  { date: "Fri", reported: 74, resolved: 70, breached: 5 },
  { date: "Sat", reported: 82, resolved: 76, breached: 7 },
  { date: "Sun", reported: 39, resolved: 38, breached: 1 }
];

export const MOCK_CATEGORY_BREAKDOWN: CategoryBreakdownPoint[] = [
  { name: "Drainage & Open Manholes", count: 142, color: "#DC2626" },
  { name: "Solid Waste Dumping", count: 210, color: "#D97706" },
  { name: "Potholes & Broken Bitumen", count: 185, color: "#2563EB" },
  { name: "Electrical & Live Wires", count: 64, color: "#9333EA" },
  { name: "Water Supply Leakages", count: 98, color: "#0D9488" }
];

export const MOCK_ZONE_COMPARISONS: ZoneMttrComparison[] = [
  { zone: "Central Zone (Zone 3)", mttrHours: 3.4, slaPercent: 96.2, benchmarkHours: 4.0 },
  { zone: "West Zone (Zone 4)", mttrHours: 5.8, slaPercent: 88.4, benchmarkHours: 4.0 },
  { zone: "East Zone (Zone 2)", mttrHours: 4.1, slaPercent: 93.1, benchmarkHours: 4.0 },
  { zone: "North Zone (Zone 1)", mttrHours: 6.2, slaPercent: 78.5, benchmarkHours: 4.0 },
  { zone: "South Zone (Zone 5)", mttrHours: 3.9, slaPercent: 94.8, benchmarkHours: 4.0 }
];

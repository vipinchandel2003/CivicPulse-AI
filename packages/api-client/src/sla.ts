// Calculate distance between two GPS coordinates using Haversine formula (in meters)
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Compute SLA progress (0-100%) and breach alert status
export function getSlaRemainingInfo(deadlineIso: string, createdAtIso: string): {
  remainingMs: number;
  remainingText: string;
  isBreached: boolean;
  isWarning: boolean; // >= 75% elapsed
  progressPercent: number;
} {
  const now = Date.now();
  const created = new Date(createdAtIso).getTime();
  const deadline = new Date(deadlineIso).getTime();
  const total = Math.max(1, deadline - created);
  const elapsed = Math.max(0, now - created);
  const remainingMs = deadline - now;
  const progressPercent = Math.min(100, Math.round((elapsed / total) * 100));

  const isBreached = remainingMs <= 0;
  const isWarning = progressPercent >= 75 && !isBreached;

  let remainingText = "";
  if (isBreached) {
    const overdueMin = Math.round(Math.abs(remainingMs) / 60000);
    remainingText = `Breached by ${overdueMin}m`;
  } else {
    const hours = Math.floor(remainingMs / 3600000);
    const minutes = Math.floor((remainingMs % 3600000) / 60000);
    remainingText = hours > 0 ? `${hours}h ${minutes}m left` : `${minutes}m left`;
  }

  return {
    remainingMs,
    remainingText,
    isBreached,
    isWarning,
    progressPercent
  };
}

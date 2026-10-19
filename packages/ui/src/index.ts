if (typeof Promise.withResolvers === "undefined") {
  Promise.withResolvers = function <T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

export * from "./utils";
export * from "./Button";
export * from "./Badge";
export * from "./Card";
export * from "./Input";
export * from "./Modal";
export * from "./LoginCard";
export * from "./CitizenShell";
export * from "./InspectorShell";
export * from "./AdminShell";
export * from "./LiveCameraViewport";
export * from "./GpsAccuracyRing";
export * from "./CitizenMapView";
export * from "./AuditTimeline";
export * from "./IssueDetailModal";
export * from "./ResolveProofModal";
export * from "./WardKanbanBoard";
export * from "./ReviewQueueModal";
export * from "./ReassignModal";
export * from "./GeospatialHeatmapViewer";
export * from "./AccountabilityMatrixTable";
export * from "./IcccRedListView";
export * from "./ShowCauseModal";
export * from "./OfflineNetworkBanner";
export * from "./CivicLandingPage";
export * from "./InspectorKpiOverview";
export * from "./UnifiedPortalSwitcher";

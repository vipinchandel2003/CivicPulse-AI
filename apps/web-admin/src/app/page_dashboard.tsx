"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  Badge,
  WardKanbanBoard,
  ReviewQueueModal,
  ReassignModal,
  GeospatialHeatmapViewer,
  AccountabilityMatrixTable,
  IcccRedListView,
  ShowCauseModal
} from "@civicpulse/ui";
import {
  civicPulseApi,
  CivicIssue,
  IcccRedListItem,
  StaffAccountabilityMetric
} from "@civicpulse/api-client";
import { ExecutiveAnalyticsSuite } from "./ExecutiveAnalyticsSuite";
import {
  Flame,
  Clock,
  Layers,
  MapPin,
  CheckCircle,
  TrendingDown,
  ShieldAlert,
  Users
} from "lucide-react";

export interface AdminDashboardProps {
  currentTab?: string;
}

export default function AdminDashboardContent({ currentTab = "dashboard" }: AdminDashboardProps) {
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [reviewIssue, setReviewIssue] = useState<CivicIssue | null>(null);
  const [reassignIssue, setReassignIssue] = useState<CivicIssue | null>(null);
  const [selectedRedItem, setSelectedRedItem] = useState<IcccRedListItem | null>(null);

  useEffect(() => {
    civicPulseApi.getNearbyIssues().then(setIssues);
  }, []);

  const handleApproveReview = async (issueId: string) => {
    const { promise, resolve } = Promise.withResolvers<void>();
    setTimeout(resolve, 500);
    await promise;
    setIssues((prev) =>
      prev.map((i) => (i.id === issueId ? { ...i, status: "RESOLVED" } : i))
    );
  };

  const handleRejectReview = async (issueId: string, reason: string) => {
    const { promise, resolve } = Promise.withResolvers<void>();
    setTimeout(resolve, 500);
    await promise;
    setIssues((prev) =>
      prev.map((i) =>
        i.id === issueId
          ? { ...i, status: "IN_PROGRESS", description: `[REJECTED BY SUPERVISOR: ${reason}] ${i.description}` }
          : i
      )
    );
  };

  const handleConfirmReassign = async (issueId: string, inspectorName: string) => {
    const { promise, resolve } = Promise.withResolvers<void>();
    setTimeout(resolve, 500);
    await promise;
    setIssues((prev) =>
      prev.map((i) =>
        i.id === issueId
          ? { ...i, status: "ASSIGNED", description: `[Assigned to: ${inspectorName}] ${i.description}` }
          : i
      )
    );
  };

  const handleIssueNotice = async (ticketCode: string, officerRemarks: string) => {
    const { promise, resolve } = Promise.withResolvers<void>();
    setTimeout(resolve, 600);
    await promise;
  };

  const criticalCount = issues.filter((i) => i.priority === "CRITICAL").length;
  const inProgressCount = issues.filter((i) => i.status === "IN_PROGRESS" || i.status === "ASSIGNED").length;
  const resolvedCount = issues.filter((i) => i.status === "RESOLVED").length;

  return (
    <div className="space-y-6">
      {/* Tab: Analytics & Data Visualizations */}
      {currentTab === "analytics" ? (
        <ExecutiveAnalyticsSuite />
      ) : currentTab === "accountability" ? (
        /* Tab: Staff Accountability Matrix */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Municipal Staff Accountability Matrix</h2>
              <p className="text-xs text-slate-500">
                Performance indices, SLA compliance %, MTTR, and fraud flags across all wards.
              </p>
            </div>
          </div>
          <AccountabilityMatrixTable />
        </div>
      ) : currentTab === "sla-audit" ? (
        /* Tab: ICCC Red List & Escalation Audit */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">SLA Escalation Engine & ICCC Red List</h2>
              <p className="text-xs text-slate-500">
                Breach monitoring, automatic tier progression, and human-in-the-loop Show-Cause notices.
              </p>
            </div>
          </div>
          <IcccRedListView onInitiateShowCause={(item) => setSelectedRedItem(item)} />
        </div>
      ) : currentTab === "heatmap" ? (
        /* Tab: H3 Geospatial Intelligence Heatmap */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Citywide Geospatial H3 Heatmap</h2>
              <p className="text-xs text-slate-500">
                Deck.gl spatial density, ward polygons, and chronic incident blackspots.
              </p>
            </div>
          </div>
          <GeospatialHeatmapViewer />
        </div>
      ) : currentTab === "kanban" ? (
        /* Tab: Ward Kanban Board */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Ward 64 Incident Board</h2>
              <p className="text-xs text-slate-500">Live operational kanban grouped by ticket lifecycle</p>
            </div>
          </div>
          <WardKanbanBoard
            issues={issues}
            onSelectIssue={(iss) => setReviewIssue(iss)}
            onReassignRequest={(iss) => setReassignIssue(iss)}
          />
        </div>
      ) : currentTab === "review-queue" ? (
        /* Tab: Review Queue */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Proof-of-Work Verification Queue</h2>
              <p className="text-xs text-slate-500">
                Inspect AI scores, verify Before/After photos, and clear pending closures.
              </p>
            </div>
            <Badge variant="high">{issues.length} Tickets Awaiting Review</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {issues.map((issue) => (
              <Card
                key={issue.id}
                variant="interactive"
                className="p-4 bg-white border-slate-200 shadow-sm space-y-3"
                onClick={() => setReviewIssue(issue)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-500">
                    {issue.ticketCode}
                  </span>
                  <Badge variant={issue.priority === "CRITICAL" ? "critical" : "high"}>
                    {issue.priority}
                  </Badge>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">{issue.title}</h4>
                <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                  <img src={issue.beforeImageUrl} alt={issue.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                  <span>{issue.location.address}</span>
                  <span className="text-blue-600 font-bold">Review →</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        /* Executive Dashboard default overview */
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-white border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
                <span>Critical Overdue SLA</span>
                <Flame className="h-4 w-4 text-red-500" />
              </div>
              <div className="mt-2 text-2xl font-black text-red-600">{criticalCount}</div>
              <p className="text-xs text-slate-400 mt-1">L1/L2 Escalations pending review</p>
            </Card>

            <Card className="bg-white border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
                <span>In-Progress Field Jobs</span>
                <Clock className="h-4 w-4 text-amber-500" />
              </div>
              <div className="mt-2 text-2xl font-black text-amber-600">{inProgressCount}</div>
              <p className="text-xs text-slate-400 mt-1">12 On-Duty Inspectors assigned</p>
            </Card>

            <Card className="bg-white border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
                <span>Verified Closures (Today)</span>
                <CheckCircle className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="mt-2 text-2xl font-black text-emerald-600">{resolvedCount}</div>
              <p className="text-xs text-slate-400 mt-1">100% AI Geofence & CLIP checked</p>
            </Card>

            <Card className="bg-white border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
                <span>Citywide MTTR</span>
                <TrendingDown className="h-4 w-4 text-blue-500" />
              </div>
              <div className="mt-2 text-2xl font-black text-blue-600">4.2 hrs</div>
              <p className="text-xs text-slate-400 mt-1">32% faster than municipal target</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col min-h-[420px] shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-blue-600" />
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Geospatial Heatmap Preview
                  </h2>
                </div>
                <span className="text-xs font-mono text-slate-500">60 FPS · 10,000+ Points Ready</span>
              </div>

              <div className="flex-1 mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
                <MapPin className="h-10 w-10 text-blue-600 mb-2 animate-bounce" />
                <h3 className="text-base font-bold text-slate-800">Deck.gl H3 Density Layer</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Click the &quot;Geospatial Heatmap (H3)&quot; tab in the left sidebar for full screen multi-layer analysis.
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col max-h-[500px] shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-amber-600" />
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Live Audit & Triage Queue
                  </h2>
                </div>
                <span className="text-xs text-slate-500 font-bold">{issues.length} Tickets</span>
              </div>

              <div className="mt-4 space-y-3 flex-1 overflow-y-auto">
                {issues.map((issue) => (
                  <div
                    key={issue.id}
                    onClick={() => setReviewIssue(issue)}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1.5 hover:border-blue-400 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-600">{issue.ticketCode}</span>
                      <Badge
                        variant={
                          issue.priority === "CRITICAL"
                            ? "critical"
                            : issue.priority === "HIGH"
                            ? "high"
                            : "standard"
                        }
                        size="sm"
                      >
                        {issue.priority}
                      </Badge>
                    </div>
                    <div className="font-bold text-slate-900">{issue.title}</div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                      <span>{issue.location.address}</span>
                      <span className="text-blue-600 font-semibold">{issue.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Review Queue Modal */}
      <ReviewQueueModal
        issue={reviewIssue}
        onClose={() => setReviewIssue(null)}
        onApprove={handleApproveReview}
        onReject={handleRejectReview}
      />

      {/* Reassign Modal */}
      <ReassignModal
        issue={reassignIssue}
        onClose={() => setReassignIssue(null)}
        onConfirmReassign={handleConfirmReassign}
      />

      {/* Show Cause Notice Modal */}
      <ShowCauseModal
        item={selectedRedItem}
        onClose={() => setSelectedRedItem(null)}
        onIssueNotice={handleIssueNotice}
      />
    </div>
  );
}

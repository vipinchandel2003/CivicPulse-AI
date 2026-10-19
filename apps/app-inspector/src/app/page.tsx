"use client";

import React, { useState } from "react";
import { AuthProvider, useAuth } from "@civicpulse/api-client";
import { InspectorShell, LoginCard, InspectorKpiOverview } from "@civicpulse/ui";
import InspectorTasksList from "./page_tasks";

function InspectorAppContent() {
  const { user, login, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"tasks" | "map" | "profile">("tasks");
  const [onDuty, setOnDuty] = useState(true);
  const [syncCount, setSyncCount] = useState(0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== "FIELD_INSPECTOR") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <LoginCard
          appName="CivicPulse Field Staff"
          appBadge="Tier 1 · Inspector"
          defaultRole="FIELD_INSPECTOR"
          onSuccess={async (phone, otp) => {
            await login(phone, otp, "FIELD_INSPECTOR");
          }}
        />
      </div>
    );
  }

  return (
    <InspectorShell
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onDuty={onDuty}
      onToggleDuty={() => setOnDuty(!onDuty)}
      pendingSyncCount={syncCount}
    >
      {activeTab === "tasks" && (
        <div className="space-y-6">
          <InspectorKpiOverview
            score={94}
            compliancePercent={96.2}
            mttrHours={3.4}
            completedThisWeek={28}
          />
          <InspectorTasksList onDuty={onDuty} onSyncCountChange={setSyncCount} />
        </div>
      )}

      {activeTab === "map" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs text-center space-y-3">
          <h3 className="font-bold text-slate-900 text-sm">Ward 64 Assigned Patrol Map</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Live routing overlay indicating sequential incident milestones and geofence target bounds.
          </p>
          <div className="h-96 rounded-2xl bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-400 font-bold">
            Interactive Field Staff GPS Routing Layer
          </div>
        </div>
      )}

      {activeTab === "profile" && (
        <div className="max-w-2xl mx-auto space-y-4">
          <InspectorKpiOverview
            score={94}
            compliancePercent={96.2}
            mttrHours={3.4}
            completedThisWeek={28}
          />
          <div className="bg-white rounded-3xl p-6 border border-slate-200 text-xs space-y-2 shadow-xs">
            <h4 className="font-bold text-slate-900 text-sm">Official Field Accreditation</h4>
            <p className="text-slate-600 leading-relaxed">
              Assigned to Indore Nagar Nigam Ward 64 (Central Zone). All resolutions are audited by CLIP visual background matcher and Play Integrity geofencing.
            </p>
          </div>
        </div>
      )}
    </InspectorShell>
  );
}

export default function InspectorApp() {
  return (
    <AuthProvider defaultRole="inspector">
      <InspectorAppContent />
    </AuthProvider>
  );
}

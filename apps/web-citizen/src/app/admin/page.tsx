"use client";

import React, { useState } from "react";
import { AuthProvider, useAuth } from "@civicpulse/api-client";
import { AdminShell, LoginCard } from "@civicpulse/ui";
import AdminDashboardContent from "./page_dashboard";

function AdminAppContent() {
  const { user, login } = useAuth();
  const [activeNav, setActiveNav] = useState("dashboard");
  const [selectedWard, setSelectedWard] = useState("All Wards");

  if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "WARD_CSI")) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <LoginCard
          appName="Command Center (ICCC)"
          appBadge="Tier 2-5 · Supervisor / Admin"
          defaultRole="SUPER_ADMIN"
          subtitle="Municipal Corporation Command & Control Room"
          onSuccess={async (phone, otp) => {
            await login(phone, otp, "SUPER_ADMIN");
          }}
        />
      </div>
    );
  }

  return (
    <AdminShell
      activeNav={activeNav}
      onNavChange={setActiveNav}
      selectedWard={selectedWard}
      onWardChange={setSelectedWard}
    >
      <AdminDashboardContent currentTab={activeNav} />
    </AdminShell>
  );
}

export default function AdminPage() {
  return (
    <AuthProvider defaultRole="admin">
      <AdminAppContent />
    </AuthProvider>
  );
}

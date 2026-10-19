"use client";

import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "@civicpulse/api-client";
import {
  CitizenShell,
  LoginCard,
  CitizenMapView,
  IssueDetailModal,
  Card,
  Badge,
  Button
} from "@civicpulse/ui";
import { civicPulseApi, CivicIssue } from "@civicpulse/api-client";
import CitizenHome from "./page_feed";
import { FileText, MapPin, CheckCircle, Clock } from "lucide-react";

function CitizenAppContent() {
  const { user, login, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"home" | "map" | "report" | "my-reports" | "profile">("home");
  const [triggerReport, setTriggerReport] = useState(false);
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<CivicIssue | null>(null);

  useEffect(() => {
    civicPulseApi.getNearbyIssues().then(setIssues);
  }, []);

  const handleUpvote = async (id: string) => {
    const res = await civicPulseApi.upvoteIssue(id);
    if (res.success) {
      setIssues((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, upvotesCount: res.upvotesCount, hasUpvoted: !item.hasUpvoted }
            : item
        )
      );
    }
  };

  const handleReopen = async (issueId: string, reason: string) => {
    const { promise, resolve } = Promise.withResolvers<void>();
    setTimeout(resolve, 600);
    await promise;
    setIssues((prev) =>
      prev.map((item) =>
        item.id === issueId
          ? { ...item, status: "REOPENED", description: `[REOPENED: ${reason}] ${item.description}` }
          : item
      )
    );
    setSelectedIssue(null);
  };

  const handleCsat = async (issueId: string, rating: number) => {
    const { promise, resolve } = Promise.withResolvers<void>();
    setTimeout(resolve, 400);
    await promise;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <LoginCard
          appName="CivicPulse Citizen"
          appBadge="Tier 0 · PWA"
          defaultRole="CITIZEN"
          onSuccess={async (phone, otp) => {
            await login(phone, otp, "CITIZEN");
          }}
        />
      </div>
    );
  }

  return (
    <CitizenShell
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onRequestCapture={() => setTriggerReport(true)}
    >
      {activeTab === "home" && (
        <CitizenHome
          openCaptureModal={triggerReport}
          onCloseCaptureModal={() => setTriggerReport(false)}
          onSelectIssue={(iss) => setSelectedIssue(iss)}
        />
      )}

      {activeTab === "map" && (
        <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-white">
          <CitizenMapView
            issues={issues}
            onSelectIssue={(iss) => setSelectedIssue(iss)}
            onUpvoteIssue={handleUpvote}
          />
        </div>
      )}

      {activeTab === "my-reports" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900">My Submissions & Public Activity</h2>
              <p className="text-xs text-slate-500">Track real-time progress and verification milestones</p>
            </div>
            <span className="text-xs font-mono font-bold bg-white text-slate-700 px-3 py-1 rounded-xl border border-slate-200 shadow-xs">
              {issues.length} records
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {issues.map((issue) => (
              <Card
                key={issue.id}
                variant="interactive"
                className="p-5 bg-white border-slate-200/90 rounded-2xl shadow-xs space-y-3"
                onClick={() => setSelectedIssue(issue)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-400">{issue.ticketCode}</span>
                  <Badge
                    variant={
                      issue.status === "RESOLVED"
                        ? "success"
                        : issue.priority === "CRITICAL"
                        ? "critical"
                        : "high"
                    }
                    size="sm"
                  >
                    {issue.status}
                  </Badge>
                </div>

                <h4 className="font-bold text-slate-900 text-sm leading-snug">{issue.title}</h4>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{issue.location.address}</span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Upvotes: {issue.upvotesCount}</span>
                  <span className="text-blue-600 font-bold hover:underline">View Timeline →</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === "profile" && (
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 text-center shadow-xs">
            <div className="h-20 w-20 rounded-3xl bg-blue-50 text-blue-600 font-black text-2xl flex items-center justify-center mx-auto mb-3 border border-blue-200">
              {user.fullName.substring(0, 2).toUpperCase()}
            </div>
            <h3 className="font-bold text-slate-900 text-lg">{user.fullName}</h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">+91 {user.phone}</p>
            <span className="inline-block mt-3 bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
              Verified Resident · Ward 64 (Rajwada)
            </span>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 text-xs space-y-3 shadow-xs">
            <div className="font-bold text-slate-900 text-sm">Security & Privacy Assurance</div>
            <p className="text-slate-600 leading-relaxed">
              In accordance with the Digital Personal Data Protection (DPDP) Act 2023, your personal identity and mobile phone number are cryptographically masked across all field inspector and contractor devices.
            </p>
          </div>
        </div>
      )}

      {/* Shared Issue Detail and Reopen Modal */}
      <IssueDetailModal
        issue={selectedIssue}
        onClose={() => setSelectedIssue(null)}
        onReopen={handleReopen}
        onRateCsat={handleCsat}
      />
    </CitizenShell>
  );
}

export default function CitizenApp() {
  return (
    <AuthProvider defaultRole="citizen">
      <CitizenAppContent />
    </AuthProvider>
  );
}

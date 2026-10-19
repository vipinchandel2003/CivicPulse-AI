"use client";

import React, { useState } from "react";
import { CivicIssue, getMockTimelineEvents } from "@civicpulse/api-client";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { Modal } from "./Modal";
import { Input } from "./Input";
import { AuditTimeline } from "./AuditTimeline";
import {
  MapPin,
  Clock,
  ThumbsUp,
  Star,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  X,
  Share2
} from "lucide-react";

export interface IssueDetailModalProps {
  issue: CivicIssue | null;
  onClose: () => void;
  onReopen: (issueId: string, reason: string) => Promise<void>;
  onRateCsat: (issueId: string, rating: number) => Promise<void>;
}

export const IssueDetailModal: React.FC<IssueDetailModalProps> = ({
  issue,
  onClose,
  onReopen,
  onRateCsat
}) => {
  const [csatRating, setCsatRating] = useState<number>(5);
  const [csatSubmitted, setCsatSubmitted] = useState<boolean>(false);
  const [reopenModalOpen, setReopenModalOpen] = useState<boolean>(false);
  const [reopenReason, setReopenReason] = useState<string>("");
  const [isReopening, setIsReopening] = useState<boolean>(false);

  if (!issue) return null;

  const timelineEvents = getMockTimelineEvents(issue.status);
  const isResolved = issue.status === "RESOLVED";

  const handleReopenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopenReason.trim()) return;
    setIsReopening(true);
    await onReopen(issue.id, reopenReason);
    setIsReopening(false);
    setReopenModalOpen(false);
  };

  const handleRate = async (stars: number) => {
    setCsatRating(stars);
    await onRateCsat(issue.id, stars);
    setCsatSubmitted(true);
  };

  return (
    <Modal isOpen={!!issue} onClose={onClose} className="max-w-md p-0 overflow-hidden">
      {/* Header bar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-slate-600">
              {issue.ticketCode}
            </span>
            <Badge variant={issue.priority === "CRITICAL" ? "critical" : "high"} size="sm">
              {issue.priority}
            </Badge>
          </div>
          <h3 className="text-base font-bold text-slate-900 mt-0.5">{issue.title}</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:bg-slate-200"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
        {/* Photo Comparison / Proof View */}
        <div className="rounded-xl overflow-hidden border border-slate-200 bg-black">
          {issue.afterImageUrl ? (
            <div className="grid grid-cols-2 divide-x divide-white">
              <div className="relative aspect-square">
                <img src={issue.beforeImageUrl} alt="Before" className="w-full h-full object-cover" />
                <span className="absolute bottom-1.5 left-1.5 bg-black/75 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  BEFORE
                </span>
              </div>
              <div className="relative aspect-square">
                <img src={issue.afterImageUrl} alt="After" className="w-full h-full object-cover" />
                <span className="absolute bottom-1.5 left-1.5 bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> AFTER
                </span>
              </div>
            </div>
          ) : (
            <div className="relative h-48">
              <img src={issue.beforeImageUrl} alt={issue.title} className="w-full h-full object-cover" />
              <span className="absolute bottom-1.5 left-1.5 bg-black/75 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                EVIDENCE PHOTO
              </span>
            </div>
          )}
        </div>

        {/* Location & Metadata */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-slate-600">
            <MapPin className="h-4 w-4 text-blue-600 shrink-0" />
            <span className="font-semibold">{issue.location.address} (Ward {issue.location.wardNumber})</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <Clock className="h-4 w-4 text-slate-400 shrink-0" />
            <span>Target SLA: {new Date(issue.slaDeadline).toLocaleTimeString()}</span>
          </div>
          <p className="text-slate-700 pt-1 border-t border-slate-200">
            {issue.description}
          </p>
        </div>

        {/* CSAT Rating Strip (If resolved) */}
        {isResolved && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-center space-y-2">
            <div className="text-xs font-bold text-emerald-900 flex items-center justify-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Are you satisfied with this verified resolution?</span>
            </div>

            {csatSubmitted ? (
              <p className="text-xs font-bold text-emerald-700">
                Thank you for your feedback! Rating recorded.
              </p>
            ) : (
              <div className="flex items-center justify-center gap-2 pt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRate(star)}
                    className="p-1 text-amber-400 hover:scale-125 transition-transform"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= csatRating ? "fill-amber-400" : "text-slate-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Audit Timeline */}
        <div className="space-y-2 pt-1">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Resolution Audit Trail (issue_events)
          </h4>
          <AuditTimeline events={timelineEvents} />
        </div>

        {/* Action Buttons: Reopen if resolved */}
        {isResolved && (
          <div className="pt-2 border-t border-slate-200">
            <Button
              variant="outline"
              className="w-full text-red-600 border-red-200 hover:bg-red-50 text-xs"
              onClick={() => setReopenModalOpen(true)}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reopen Complaint (Defect Persists)
            </Button>
          </div>
        )}
      </div>

      {/* Reopen Reason Prompt Modal */}
      <Modal
        isOpen={reopenModalOpen}
        onClose={() => setReopenModalOpen(false)}
        title="Reopen Civic Complaint"
        description="Ticket will transition to REOPENED and escalate to Zonal Supervisor."
      >
        <form onSubmit={handleReopenSubmit} className="space-y-3">
          <Input
            label="Specific Reopening Reason"
            placeholder="e.g. Bitumen washed away, pothole sinkhole reopened"
            value={reopenReason}
            onChange={(e) => setReopenReason(e.target.value)}
            required
          />
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setReopenModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              className="flex-1"
              isLoading={isReopening}
            >
              Confirm Reopen
            </Button>
          </div>
        </form>
      </Modal>
    </Modal>
  );
};

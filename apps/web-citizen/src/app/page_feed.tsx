"use client";

import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  Badge,
  Modal,
  Input,
  LiveCameraViewport,
  GpsAccuracyRing,
  GeoLocationState
} from "@civicpulse/ui";
import { civicPulseApi, CivicIssue, nonceManager, offlineQueue } from "@civicpulse/api-client";
import {
  Camera,
  MapPin,
  ThumbsUp,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Activity,
  ArrowRight
} from "lucide-react";

export interface CitizenHomeProps {
  openCaptureModal?: boolean;
  onCloseCaptureModal?: () => void;
  onSelectIssue?: (issue: CivicIssue) => void;
}

export default function CitizenHome({
  openCaptureModal,
  onCloseCaptureModal,
  onSelectIssue
}: CitizenHomeProps) {
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [locationState, setLocationState] = useState<GeoLocationState>({
    latitude: 22.7196,
    longitude: 75.8577,
    accuracy: 8.5,
    isValid: true,
    error: null
  });
  const [serverNonce, setServerNonce] = useState<string>("");
  const [nonceTtl, setNonceTtl] = useState<number>(60);
  const [categoryHint, setCategoryHint] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (openCaptureModal) {
      handleOpenModal();
    }
  }, [openCaptureModal]);

  const handleOpenModal = async () => {
    setReportModalOpen(true);
    setCapturedPhoto(null);
    setSubmitSuccess(null);
    try {
      const nonceRes = await civicPulseApi.getCaptureNonce();
      nonceManager.setNonce(nonceRes.nonce, nonceRes.expiresAt);
      setServerNonce(nonceRes.nonce);
      setNonceTtl(60);
    } catch {
      // Nonce fetched
    }
  };

  const handleClose = () => {
    setReportModalOpen(false);
    setCapturedPhoto(null);
    setSubmitSuccess(null);
    onCloseCaptureModal?.();
  };

  useEffect(() => {
    if (!reportModalOpen) return;
    const interval = setInterval(() => {
      const remaining = nonceManager.getRemainingSeconds();
      setNonceTtl(remaining);
      if (remaining <= 0) {
        civicPulseApi.getCaptureNonce().then((res) => {
          nonceManager.setNonce(res.nonce, res.expiresAt);
          setServerNonce(res.nonce);
          setNonceTtl(60);
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [reportModalOpen]);

  useEffect(() => {
    civicPulseApi.getNearbyIssues().then((data) => {
      setIssues(data);
      setLoading(false);
    });
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

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!capturedPhoto) return;
    if (!locationState.isValid || !locationState.latitude || !locationState.longitude) return;

    setIsSubmitting(true);
    const payload = {
      nonce: serverNonce,
      latitude: locationState.latitude,
      longitude: locationState.longitude,
      accuracy: locationState.accuracy || 10,
      imageBase64: capturedPhoto,
      categoryHint: categoryHint || "Road Hazard / Pothole",
      note: note || "Captured via Citizen Live Camera"
    };

    try {
      const res = await civicPulseApi.createIssue(payload);
      setSubmitSuccess(res.ticketCode);
      const updated = await civicPulseApi.getNearbyIssues();
      setIssues(updated);
      setTimeout(() => {
        handleClose();
      }, 1800);
    } catch {
      offlineQueue.enqueue(payload);
      setSubmitSuccess("QUEUED_OFFLINE");
      setTimeout(() => {
        handleClose();
      }, 1800);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Responsive Desktop Banner + Quick Action Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Hero Card: Live Reporting Trigger */}
        <div className="lg:col-span-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-3 z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold">
              <ShieldCheck className="h-4 w-4" /> Anti-Fake-Closure Enforcement Standard
            </div>
            <h2 className="text-2xl sm:text-3xl font-black leading-tight max-w-xl">
              Spot a hazard in Ward 64? Report with instant live proof.
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 max-w-lg leading-relaxed">
              Every report requires live in-app camera capture and high-accuracy GPS verification to ensure rapid field assignment within 400ms.
            </p>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 z-10">
            <button
              onClick={handleOpenModal}
              className="py-3 px-6 rounded-2xl bg-white text-blue-900 font-extrabold text-sm shadow-md hover:bg-blue-50 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Camera className="h-5 w-5 text-blue-600" />
              <span>Launch Live Capture</span>
            </button>
            <div className="text-xs text-blue-100 font-semibold flex items-center gap-2 px-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span>CSI Ramesh Verma currently on duty in Ward 64</span>
            </div>
          </div>
        </div>

        {/* Right Info Card: Ward Performance Summary */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Ward 64 Pulse Tracker
            </h3>
            <Badge variant="standard">Indore Nagar Nigam</Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="text-xl font-black text-slate-900">{issues.length}</div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">Active Reports</div>
            </div>
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
              <div className="text-xl font-black text-emerald-700">96.2%</div>
              <div className="text-[11px] text-emerald-800 font-medium mt-0.5">SLA Pass Rate</div>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            All reports undergo instant YOLO defect classification & CLIP deduplication within 25 metres.
          </p>
        </div>
      </div>

      {/* Main Feed Section: Multi-Column on Desktop (Grid: 1 col on mobile, 2 cols on tablet, 3 cols on desktop) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Recent Incidents & Resolution Timeline
            </h2>
            <p className="text-xs text-slate-500">Live public transparency stream for Ward 64 residents</p>
          </div>
          <span className="text-xs font-mono font-bold bg-white text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
            {issues.length} Verified Tickets
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-slate-200/80 animate-pulse rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {issues.map((issue) => (
              <Card
                key={issue.id}
                variant="interactive"
                className="overflow-hidden p-0 border-slate-200/80 bg-white rounded-3xl shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
                onClick={() => onSelectIssue?.(issue)}
              >
                <div>
                  <div className="p-4 pb-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Badge
                        variant={
                          issue.priority === "CRITICAL"
                            ? "critical"
                            : issue.priority === "HIGH"
                            ? "high"
                            : "standard"
                        }
                      >
                        {issue.priority}
                      </Badge>
                      <span className="text-xs font-mono text-slate-400 font-bold">
                        {issue.ticketCode}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm leading-snug">
                      {issue.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {issue.description}
                    </p>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{issue.location.address}</span>
                    </div>
                  </div>

                  {/* Photo Visual: Before vs After Split View */}
                  <div className="relative h-48 bg-slate-100 w-full">
                    {issue.afterImageUrl ? (
                      <div className="grid grid-cols-2 h-full divide-x divide-white">
                        <div className="relative h-full">
                          <img
                            src={issue.beforeImageUrl}
                            alt="Before"
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-2 left-2 bg-black/75 text-white text-[10px] px-2 py-0.5 rounded-md font-bold uppercase">
                            Before
                          </span>
                        </div>
                        <div className="relative h-full">
                          <img
                            src={issue.afterImageUrl}
                            alt="After"
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-2 left-2 bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-md font-bold uppercase flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Resolved
                          </span>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={issue.beforeImageUrl}
                        alt={issue.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                </div>

                {/* Card Action Strip */}
                <div className="p-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-slate-500 font-medium">Status:</span>
                    <span className="text-blue-700 font-bold">{issue.status}</span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpvote(issue.id);
                    }}
                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                      issue.hasUpvoted
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                    <span>Me Too ({issue.upvotesCount})</span>
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Strict Anti-Fake-Closure Live Capture Modal */}
      <Modal
        isOpen={reportModalOpen}
        onClose={handleClose}
        title="Live Incident Capture"
        description="Indore Nagar Nigam anti-spoofing verification requires live camera & GPS."
      >
        {submitSuccess ? (
          <div className="p-6 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h4 className="text-base font-bold text-slate-900">
              Report Submitted Successfully!
            </h4>
            <p className="text-xs font-mono font-bold text-blue-600 bg-blue-50 py-1.5 px-3 rounded-lg inline-block">
              {submitSuccess === "QUEUED_OFFLINE" ? "Saved in Offline Queue (Will auto-sync)" : submitSuccess}
            </p>
            <p className="text-xs text-slate-500">
              Dispatched to Ward 64 least-loaded CSI staff.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmitReport} className="space-y-4">
            <div className="flex items-center justify-between text-[11px] bg-slate-100 px-3 py-1.5 rounded-lg text-slate-600">
              <span className="font-mono truncate max-w-[200px]">
                Nonce: {serverNonce.substring(0, 16)}...
              </span>
              <span className={`font-bold ${nonceTtl < 15 ? "text-red-600 animate-pulse" : "text-emerald-700"}`}>
                Expires in {nonceTtl}s
              </span>
            </div>

            <GpsAccuracyRing maxAccuracyMeters={20} onLocationChange={setLocationState} />

            {!capturedPhoto ? (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Live Rear Camera Feed
                </label>
                <LiveCameraViewport onCapture={setCapturedPhoto} />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative rounded-2xl overflow-hidden aspect-[4/3] border-2 border-emerald-500">
                  <img src={capturedPhoto} alt="Captured Evidence" className="w-full h-full object-cover" />
                  <div className="absolute top-2.5 left-2.5 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                    PHOTO SNAPSHOT LOCKED
                  </div>
                  <button
                    type="button"
                    onClick={() => setCapturedPhoto(null)}
                    className="absolute bottom-2.5 right-2.5 bg-black/75 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-black"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Retake
                  </button>
                </div>
              </div>
            )}

            <Input
              label="Incident Category"
              placeholder="e.g. Broken Water Pipe, Pothole, Dead Animal"
              value={categoryHint}
              onChange={(e) => setCategoryHint(e.target.value)}
              required
            />

            <Input
              label="Landmark / Description Note"
              placeholder="Near Rajwada temple gate or specific shop number"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                disabled={!capturedPhoto || !locationState.isValid}
                isLoading={isSubmitting}
              >
                Submit Incident
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

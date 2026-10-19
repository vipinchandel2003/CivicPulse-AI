"use client";

import React, { useState } from "react";
import { CivicIssue } from "@civicpulse/api-client";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { LiveCameraViewport } from "./LiveCameraViewport";
import { GpsAccuracyRing, GeoLocationState } from "./GpsAccuracyRing";
import {
  ShieldAlert,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles
} from "lucide-react";

export interface ResolveProofModalProps {
  task: CivicIssue | null;
  onClose: () => void;
  onSubmitResolve: (taskId: string, afterPhotoBase64: string, distanceMeters: number) => Promise<void>;
  currentDistanceMeters: number;
}

export const ResolveProofModal: React.FC<ResolveProofModalProps> = ({
  task,
  onClose,
  onSubmitResolve,
  currentDistanceMeters
}) => {
  const [afterPhoto, setAfterPhoto] = useState<string | null>(null);
  const [locationState, setLocationState] = useState<GeoLocationState>({
    latitude: 22.7196,
    longitude: 75.8577,
    accuracy: 6.5,
    isValid: true,
    error: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [auditSuccess, setAuditSuccess] = useState(false);

  if (!task) return null;

  // Maximum allowed distance from incident coordinate per PRD §6 is <= 30m
  const isGeofenceValid = currentDistanceMeters <= 30;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!afterPhoto || !isGeofenceValid) return;

    setIsSubmitting(true);
    await onSubmitResolve(task.id, afterPhoto, currentDistanceMeters);
    setAuditSuccess(true);
    setIsSubmitting(false);

    setTimeout(() => {
      onClose();
      setAuditSuccess(false);
      setAfterPhoto(null);
    }, 1500);
  };

  return (
    <Modal
      isOpen={!!task}
      onClose={onClose}
      title="Proof-of-Work Verification"
      description="Indore Nagar Nigam anti-fraud resolution gate (Geofence ≤ 30m + AI Audit)."
      className="max-w-md bg-white border-slate-200"
    >
      {auditSuccess ? (
        <div className="p-6 text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h4 className="text-base font-bold text-slate-900">
            Work Submitted to PENDING_AUDIT!
          </h4>
          <p className="text-xs text-slate-600">
            AI Service is verifying CLIP background similarity and defect absence.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target Ticket Context */}
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs space-y-1">
            <div className="flex justify-between font-mono font-bold">
              <span className="text-slate-800">{task.ticketCode}</span>
              <span className="text-red-600 font-bold">{task.priority} SLA</span>
            </div>
            <p className="text-slate-900 font-bold">{task.title}</p>
            <p className="text-slate-500">{task.location.address}</p>
          </div>

          {/* Live Geofence Check Strip (<= 30m) */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
              isGeofenceValid
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-red-50 border-red-200 text-red-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <MapPin className={`h-4 w-4 ${isGeofenceValid ? "text-emerald-600" : "text-red-600"}`} />
              <div>
                <span className="font-bold">
                  {isGeofenceValid ? "Geofence Check Passed" : "Out of Geofence (Blocked)"}
                </span>
                <p className="text-[11px] opacity-80 mt-0.5">
                  Distance: <span className="font-mono font-bold">{currentDistanceMeters}m</span> from incident (Limit: ≤ 30m)
                </p>
              </div>
            </div>
            {isGeofenceValid ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
            )}
          </div>

          {/* GPS Accuracy Validation Ring */}
          <GpsAccuracyRing maxAccuracyMeters={20} onLocationChange={setLocationState} />

          {/* In-App Live Rear Camera (Strict Anti-Gallery) */}
          {!afterPhoto ? (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Capture Live After Photo
              </label>
              <LiveCameraViewport onCapture={setAfterPhoto} />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative rounded-2xl overflow-hidden aspect-[4/3] border-2 border-emerald-500">
                <img src={afterPhoto} alt="After Evidence" className="w-full h-full object-cover" />
                <div className="absolute top-2.5 left-2.5 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                  AFTER PHOTO LOCKED
                </div>
                <button
                  type="button"
                  onClick={() => setAfterPhoto(null)}
                  className="absolute bottom-2.5 right-2.5 bg-black/75 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-black"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Retake
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={!afterPhoto || !isGeofenceValid || !locationState.isValid}
              isLoading={isSubmitting}
            >
              Verify & Resolve
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

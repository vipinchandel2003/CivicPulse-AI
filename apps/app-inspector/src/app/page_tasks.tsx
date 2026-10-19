"use client";

import React, { useEffect, useState } from "react";
import { Button, Card, Badge, ResolveProofModal } from "@civicpulse/ui";
import {
  civicPulseApi,
  CivicIssue,
  calculateDistanceMeters,
  getSlaRemainingInfo,
  inspectorOfflineManager
} from "@civicpulse/api-client";
import {
  Navigation,
  Clock,
  CheckCircle,
  MapPin,
  Camera,
  AlertTriangle,
  ShieldCheck,
  CheckSquare,
  Sparkles,
  ArrowRight
} from "lucide-react";

export interface InspectorTasksListProps {
  onDuty: boolean;
  onSyncCountChange?: (count: number) => void;
}

export default function InspectorTasksList({ onDuty, onSyncCountChange }: InspectorTasksListProps) {
  const [tasks, setTasks] = useState<CivicIssue[]>([]);
  const [selectedTask, setSelectedTask] = useState<CivicIssue | null>(null);

  // Simulated inspector position (Ward 64 near Rajwada: 22.7197, 75.8578)
  const inspectorLocation = { latitude: 22.7197, longitude: 75.8578 };

  useEffect(() => {
    civicPulseApi.getNearbyIssues().then((issues) => {
      setTasks(issues.filter((i) => i.status !== "RESOLVED"));
    });
    const pending = inspectorOfflineManager.getPendingResolves();
    onSyncCountChange?.(pending.length);
  }, [onSyncCountChange]);

  const handleResolveTask = async (taskId: string, afterPhoto: string, distanceMeters: number) => {
    await civicPulseApi.getCaptureNonce();
    inspectorOfflineManager.enqueueResolve({
      taskId,
      afterPhotoBase64: afterPhoto,
      distanceMeters
    });

    const { promise, resolve } = Promise.withResolvers<void>();
    setTimeout(resolve, 800);
    await promise;

    inspectorOfflineManager.clearSynced(taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    const pending = inspectorOfflineManager.getPendingResolves();
    onSyncCountChange?.(pending.length);
  };

  const getTaskDistance = (task: CivicIssue): number => {
    return calculateDistanceMeters(
      inspectorLocation.latitude,
      inspectorLocation.longitude,
      task.location.latitude,
      task.location.longitude
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Field Operations Status Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Queue</span>
            <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{tasks.length} Assigned</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <CheckSquare className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Geofence Compliance</span>
            <div className="text-2xl font-black text-emerald-600 mt-1 font-mono">100% Locked</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">SLA Target Benchmark</span>
            <div className="text-2xl font-black text-blue-600 mt-1 font-mono">&lt; 4 Hours</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Clock className="h-5 w-5" />
          </div>
        </div>
      </div>

      {!onDuty && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-center justify-between font-semibold shadow-xs">
          <span>You are currently marked OFF DUTY. New emergency assignments are temporarily routed to peers.</span>
          <span className="font-bold underline cursor-pointer">Switch to On-Duty</span>
        </div>
      )}

      {/* Task Queue Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Assigned Operational Tasks</h2>
          <p className="text-xs text-slate-500">Sorted by dynamic SLA remaining time and spatial proximity</p>
        </div>
        <span className="text-xs text-amber-800 font-bold flex items-center gap-1.5 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200 shadow-xs">
          <Clock className="h-3.5 w-3.5 text-amber-600" /> SLA Ticker Active
        </span>
      </div>

      {/* Responsive Grid on Desktop (1 col mobile, 2 cols tablet, 3 cols desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.map((task) => {
          const distance = getTaskDistance(task);
          const slaInfo = getSlaRemainingInfo(task.slaDeadline, task.createdAt);
          const isCritical = task.priority === "CRITICAL";

          return (
            <Card
              key={task.id}
              variant="bordered"
              className="p-5 bg-white shadow-xs hover:shadow-md transition-all border-slate-200/90 rounded-3xl space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={isCritical ? "critical" : "high"} size="sm">
                      {task.priority} SLA
                    </Badge>
                    {slaInfo.isWarning && (
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 text-amber-600" /> 75% WARNING
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-400">
                    {task.ticketCode}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base leading-snug">{task.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description}</p>
                </div>

                {/* SLA Countdown Meter */}
                <div className="space-y-1 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">SLA Countdown:</span>
                    <span className={`font-bold font-mono ${slaInfo.isBreached ? "text-red-600" : "text-slate-800"}`}>
                      {slaInfo.remainingText}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full transition-all ${
                        slaInfo.isBreached
                          ? "bg-red-600"
                          : slaInfo.isWarning
                          ? "bg-amber-500"
                          : "bg-blue-600"
                      }`}
                      style={{ width: `${slaInfo.progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Distance to Incident Site */}
                <div className="flex items-center justify-between text-xs text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-blue-600 shrink-0" />
                    <span className="truncate max-w-[160px]">{task.location.address}</span>
                  </div>
                  <span
                    className={`font-mono font-bold px-2 py-0.5 rounded-lg text-xs ${
                      distance <= 30
                        ? "text-emerald-800 bg-emerald-100 border border-emerald-200"
                        : "text-slate-700 bg-slate-200"
                    }`}
                  >
                    ~{distance}m
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-slate-700 border-slate-200 hover:bg-slate-50 rounded-xl font-bold"
                  onClick={() =>
                    window.open(
                      `https://www.google.com/maps/dir/?api=1&destination=${task.location.latitude},${task.location.longitude}`,
                      "_blank"
                    )
                  }
                >
                  <Navigation className="h-3.5 w-3.5 text-blue-600 mr-1.5" /> Maps
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs"
                  onClick={() => setSelectedTask(task)}
                >
                  <Camera className="h-3.5 w-3.5 mr-1.5" /> Resolve ({distance}m)
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Geofenced Proof-of-Work Modal (<30m) */}
      <ResolveProofModal
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onSubmitResolve={handleResolveTask}
        currentDistanceMeters={selectedTask ? getTaskDistance(selectedTask) : 0}
      />
    </div>
  );
}

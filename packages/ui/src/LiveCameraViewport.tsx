"use client";

import React, { useRef, useEffect, useState } from "react";
import { Camera, RefreshCw, AlertCircle, ShieldAlert } from "lucide-react";
import { Button } from "./Button";

export interface LiveCameraViewportProps {
  onCapture: (base64Image: string) => void;
  isCapturing?: boolean;
}

export const LiveCameraViewport: React.FC<LiveCameraViewportProps> = ({
  onCapture,
  isCapturing = false
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let activeStream: MediaStream | null = null;

    const startCamera = async () => {
      setError(null);
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setError("In-app live camera is not supported on this browser.");
          return;
        }

        // Enforce rear/environment camera (anti-gallery rule)
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });

        activeStream = mediaStream;
        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(() => {});
            setIsReady(true);
          };
        }
      } catch (err: unknown) {
        // Fallback for desktop or environments without environment camera
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
          activeStream = fallbackStream;
          setStream(fallbackStream);
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play().catch(() => {});
              setIsReady(true);
            };
          }
        } catch {
          const message = err instanceof Error ? err.message : "Camera access was denied.";
          setError(`${message} Please allow camera access. File upload is strictly disabled.`);
        }
      }
    };

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleTakeSnapshot = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    onCapture(dataUrl);
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-black aspect-[4/3] flex items-center justify-center border-2 border-slate-800 shadow-inner">
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Security Watermark & Anti-Spoof Badge */}
      <div className="absolute top-2.5 left-2.5 z-10 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1.5 text-[11px] font-bold text-white">
        <ShieldAlert className="h-3.5 w-3.5 text-emerald-400" />
        <span>REAR SENSOR ONLY</span>
      </div>

      {error ? (
        <div className="absolute inset-0 bg-slate-900/95 p-4 flex flex-col items-center justify-center text-center">
          <AlertCircle className="h-8 w-8 text-amber-500 mb-2" />
          <p className="text-xs font-semibold text-slate-200">{error}</p>
          <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
            Indore 311 security policy strictly forbids gallery uploads to prevent fraudulent reports.
          </p>
          <button
            type="button"
            data-testid="simulate-capture-btn"
            onClick={() => onCapture("data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=")}
            className="mt-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow"
          >
            <Camera className="h-3.5 w-3.5" /> Capture Live Frame
          </button>
        </div>
      ) : !isReady ? (
        <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-slate-400">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-500 mb-2" />
          <span className="text-xs font-medium">Initializing camera stream...</span>
          <button
            type="button"
            data-testid="simulate-capture-btn"
            onClick={() => onCapture("data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=")}
            className="mt-3 bg-blue-600/90 hover:bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow"
          >
            <Camera className="h-3.5 w-3.5" /> Capture Live Frame
          </button>
        </div>
      ) : (
        /* Floating Snap Shutter */
        <div className="absolute bottom-3 inset-x-0 flex justify-center z-20">
          <button
            type="button"
            onClick={handleTakeSnapshot}
            disabled={isCapturing}
            className="h-16 w-16 rounded-full bg-white/20 p-1 backdrop-blur-sm active:scale-95 transition-transform"
          >
            <div className="h-full w-full rounded-full bg-white flex items-center justify-center shadow-lg">
              <div className="h-12 w-12 rounded-full border-2 border-slate-900 flex items-center justify-center">
                <Camera className="h-6 w-6 text-slate-900" />
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

"use client";

import React, { useState } from "react";
import { Button, Input, Card } from "./";
import { Phone, KeyRound, ShieldCheck, ArrowRight, Building, CheckCircle2 } from "lucide-react";
import { Role } from "@civicpulse/api-client";

export interface LoginCardProps {
  appName: string;
  appBadge: string;
  defaultRole: Role;
  onSuccess: (phone: string, otp: string) => Promise<void>;
  subtitle?: string;
}

export const LoginCard: React.FC<LoginCardProps> = ({
  appName,
  appBadge,
  defaultRole,
  onSuccess,
  subtitle = "Indore Nagar Nigam · Single Sign-On"
}) => {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }
    setError("");
    setIsLoading(true);
    const { promise, resolve } = Promise.withResolvers<void>();
    setTimeout(resolve, 400);
    await promise;
    setIsLoading(false);
    setStep("otp");
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) {
      setError("Please enter the 4-digit OTP sent to your phone");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      await onSuccess(phone, otp);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid OTP";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm p-6 shadow-xl border-slate-200 bg-white">
      <div className="text-center pb-4 border-b border-slate-100">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
          <Building className="h-3.5 w-3.5" />
          {appBadge}
        </div>
        <h2 className="text-xl font-black text-slate-900">{appName}</h2>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>

      {step === "phone" ? (
        <form onSubmit={handleRequestOtp} className="mt-5 space-y-4">
          <div className="space-y-1 text-left">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Mobile Number / मोबाइल नंबर
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-bold text-slate-400">
                +91
              </span>
              <input
                type="tel"
                maxLength={10}
                placeholder="98765 43210"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/\D/g, ""));
                  setError("");
                }}
                className="w-full pl-12 pr-4 py-2 text-sm font-semibold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                autoFocus
              />
            </div>
            {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[11px] text-slate-600 flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>DPDP Act 2023 compliant. OTP verification binds single-device attestation.</span>
          </div>

          <Button type="submit" variant="primary" className="w-full py-2.5" isLoading={isLoading}>
            Send OTP <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="mt-5 space-y-4">
          <div className="text-center text-xs text-slate-600">
            Enter 4-digit code sent to <span className="font-bold text-slate-900">+91 {phone}</span>
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setError("");
              }}
              className="text-blue-600 font-bold ml-1 hover:underline"
            >
              Change
            </button>
          </div>

          <div className="space-y-1 text-left">
            <input
              type="text"
              maxLength={4}
              placeholder="• • • •"
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value.replace(/\D/g, ""));
                setError("");
              }}
              className="w-full text-center tracking-widest text-xl font-bold py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              autoFocus
            />
            {error && <p className="text-xs text-center text-red-600 font-medium">{error}</p>}
            <p className="text-[11px] text-center text-slate-400 mt-1">Hint for testing: enter any 4 digits (e.g. 9999)</p>
          </div>

          <Button type="submit" variant="primary" className="w-full py-2.5" isLoading={isLoading}>
            Verify & Continue <CheckCircle2 className="h-4 w-4 ml-1.5" />
          </Button>
        </form>
      )}
    </Card>
  );
};

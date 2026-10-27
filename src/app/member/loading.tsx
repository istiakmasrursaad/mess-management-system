import React from "react";

export default function MemberLoading() {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center min-h-screen w-full select-none"
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
      }}
    >
      {/* Ambient background glow orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #6d28d9, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-15 blur-3xl"
          style={{ background: "radial-gradient(circle, #0ea5e9, transparent 70%)" }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-sm px-6 text-center">
        {/* Animated Brand Emblem */}
        <div className="relative mb-6">
          <div
            className="absolute inset-0 rounded-3xl blur-2xl opacity-60 animate-pulse"
            style={{ background: "linear-gradient(135deg, #10b981, #0ea5e9)" }}
          />
          <div
            className="relative w-20 h-20 rounded-3xl flex items-center justify-center p-0.5 shadow-2xl"
            style={{
              background: "linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.05))",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              backdropFilter: "blur(16px)",
            }}
          >
            <div
              className="w-full h-full rounded-[22px] flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #059669 0%, #0284c7 100%)" }}
            >
              <svg
                className="w-10 h-10 text-white animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="opacity-95"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 mb-3">
          Member Portal
        </div>
        <h2 className="text-xl font-extrabold tracking-tight text-white mb-1.5 font-heading">
          Loading Your Portal
        </h2>
        <p className="text-sm text-slate-400 mb-6 font-medium">
          Preparing your meal entries, deposits &amp; bill breakdown…
        </p>

        {/* Animated Progress Bar */}
        <div
          className="w-64 h-1.5 rounded-full overflow-hidden relative"
          style={{ background: "rgba(255, 255, 255, 0.08)", border: "1px solid rgba(255, 255, 255, 0.06)" }}
        >
          <div
            className="h-full rounded-full animate-pulse"
            style={{
              width: "100%",
              background: "linear-gradient(90deg, #059669, #0284c7, #059669)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

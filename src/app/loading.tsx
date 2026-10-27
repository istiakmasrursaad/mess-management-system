import React from "react";

export default function GlobalLoading() {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center min-h-screen w-full select-none"
      style={{
        background: "linear-gradient(135deg, #090d16 0%, #0f172a 50%, #111827 100%)",
      }}
    >
      {/* Ambient background glow orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-25 blur-3xl animate-pulse"
          style={{ background: "radial-gradient(circle, #6d28d9, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full opacity-20 blur-3xl animate-pulse"
          style={{ background: "radial-gradient(circle, #0ea5e9, transparent 70%)", animationDelay: "1.5s" }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-sm px-6 text-center">
        {/* Animated Brand Emblem */}
        <div className="relative mb-6">
          <div
            className="absolute inset-0 rounded-3xl blur-xl opacity-70 animate-pulse"
            style={{ background: "linear-gradient(135deg, #6d28d9, #0ea5e9)" }}
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
              style={{ background: "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)" }}
            >
              {/* Spinner icon */}
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
                  className="opacity-90"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-extrabold tracking-tight text-white mb-1.5 font-heading">
          SoftTech Mess Manager
        </h2>
        <p className="text-sm text-slate-400 mb-6 font-medium">
          Loading your data, please wait…
        </p>

        {/* Animated Progress Bar */}
        <div
          className="w-56 h-1.5 rounded-full overflow-hidden relative"
          style={{ background: "rgba(255, 255, 255, 0.08)", border: "1px solid rgba(255, 255, 255, 0.05)" }}
        >
          <div
            className="h-full rounded-full animate-pulse"
            style={{
              width: "100%",
              background: "linear-gradient(90deg, #6d28d9, #0ea5e9, #6d28d9)",
              backgroundSize: "200% 100%",
            }}
          />
        </div>
      </div>
    </div>
  );
}

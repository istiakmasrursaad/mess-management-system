"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  X,
  UtensilsCrossed,
  CalendarCheck2
} from "lucide-react";

interface MealCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMonth: string; // "MM-YYYY" e.g. "10-2026"
  data: any;
  onSelectDate?: (dateStr: string) => void;
}

export default function MealCalendarModal({
  isOpen,
  onClose,
  selectedMonth,
  data,
  onSelectDate,
}: MealCalendarModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Close on ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const monthYear = selectedMonth || data?.monthYear || "10-2026";
  const [mmStr, yyyyStr] = monthYear.split("-");
  const monthNum = parseInt(mmStr, 10); // 1-12
  const year = parseInt(yyyyStr, 10);

  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const firstDayOfWeek = new Date(year, monthNum - 1, 1).getDay(); // 0 = Sun
  const monthLabel = new Date(year, monthNum - 1, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Current system date for comparison
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;

  // Gather submitted dates & meals count
  const submittedSet = new Set<string>(data?.submittedDates || []);
  const mealsMap: Record<string, number> = { ...(data?.dateTotalMeals || {}) };

  // Fallback: build from members list if backend didn't supply them
  if (submittedSet.size === 0 && Array.isArray(data?.members)) {
    data.members.forEach((m: any) => {
      const dailyMeals = m.member?.dailyMeals || m.dailyMeals || [];
      dailyMeals.forEach((meal: any) => {
        if (meal?.date) {
          const dKey = new Date(meal.date).toISOString().split("T")[0];
          submittedSet.add(dKey);
          mealsMap[dKey] = (mealsMap[dKey] || 0) + (Number(meal.totalMeal) || 0);
        }
      });
    });
  }

  // Construct calendar days array
  interface DayInfo {
    day: number;
    dateStr: string;
    isToday: boolean;
    isPastOrToday: boolean;
    isSubmitted: boolean;
    status: "submitted" | "missing" | "upcoming";
    mealsCount: number | null;
  }

  const days: DayInfo[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(monthNum).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const isToday = dateStr === todayStr;
    const isPastOrToday = dateStr <= todayStr;
    const isSubmitted = submittedSet.has(dateStr);
    const mealsCount = mealsMap[dateStr] !== undefined ? mealsMap[dateStr] : isSubmitted ? 0 : null;

    let status: "submitted" | "missing" | "upcoming";
    if (isSubmitted) {
      status = "submitted";
    } else if (isPastOrToday) {
      status = "missing";
    } else {
      status = "upcoming";
    }

    days.push({
      day: d,
      dateStr,
      isToday,
      isPastOrToday,
      isSubmitted,
      status,
      mealsCount,
    });
  }

  const submittedDays = days.filter((d) => d.status === "submitted");
  const missingDays = days.filter((d) => d.status === "missing");
  const upcomingDays = days.filter((d) => d.status === "upcoming");
  const totalMessMeals = data?.totalMessMeals ?? 0;

  // Weekday labels (adaptive)
  const weekdaysDesktop = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekdaysMobile = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const handleDayClick = (dateStr: string) => {
    if (onSelectDate) {
      onSelectDate(dateStr);
    }
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      style={{
        background: "rgba(10, 15, 30, 0.45)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border animate-in zoom-in-95 duration-200"
        style={{
          background: "linear-gradient(145deg, rgba(22, 28, 48, 0.96) 0%, rgba(14, 18, 34, 0.98) 100%)",
          borderColor: "rgba(255, 255, 255, 0.12)",
          boxShadow: "0 20px 50px -10px rgba(0, 0, 0, 0.7), 0 0 25px rgba(251, 191, 36, 0.08)",
        }}
      >
        {/* Top vibrant gradient accent line */}
        <div
          className="h-1 w-full shrink-0"
          style={{
            background: "linear-gradient(90deg, #10b981 0%, #0ea5e9 35%, #fbbf24 70%, #f43f5e 100%)",
          }}
        />

        {/* Modal Header */}
        <div className="p-3 sm:p-5 pb-3 border-b border-white/10 flex flex-col gap-2.5 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md"
                style={{
                  background: "linear-gradient(135deg, rgba(251, 191, 36, 0.25) 0%, rgba(16, 185, 129, 0.25) 100%)",
                  border: "1px solid rgba(251, 191, 36, 0.35)",
                }}
              >
                <CalendarCheck2 className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                    Meal Submission Status
                  </h3>
                  <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30 whitespace-nowrap">
                    {monthLabel}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5 hidden xs:block">
                  Click any date to jump directly to Daily Meals entry
                </p>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              title="Close popup"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 w-full text-xs">
            <div className="flex items-center justify-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold min-w-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate text-[10px] sm:text-xs">
                <span className="hidden sm:inline">Submitted: </span>
                <strong className="text-white">{submittedDays.length}d</strong>
              </span>
            </div>

            <div
              className={`flex items-center justify-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl font-semibold border min-w-0 ${
                missingDays.length > 0
                  ? "bg-rose-500/15 border-rose-500/35 text-rose-300"
                  : "bg-white/5 border-white/10 text-slate-400"
              }`}
            >
              <XCircle
                className={`w-3.5 h-3.5 shrink-0 ${missingDays.length > 0 ? "text-rose-400" : "text-slate-400"}`}
              />
              <span className="truncate text-[10px] sm:text-xs">
                <span className="hidden sm:inline">Missing: </span>
                <strong className="text-white">{missingDays.length}d</strong>
              </span>
            </div>

            <div className="flex items-center justify-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-300 font-semibold min-w-0">
              <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate text-[10px] sm:text-xs">
                <span className="hidden sm:inline">Meals: </span>
                <strong className="text-white">{totalMessMeals}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Calendar Body */}
        <div className="p-2.5 sm:p-4 space-y-2.5 overflow-y-auto flex-1">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center">
            {weekdaysDesktop.map((day, idx) => (
              <div
                key={day}
                className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider py-1 rounded-md ${
                  idx === 0 || idx === 6 ? "text-amber-400/80 bg-amber-400/5" : "text-slate-400 bg-white/[0.02]"
                }`}
              >
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{weekdaysMobile[idx]}</span>
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {/* Offset blanks */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div
                key={`offset-${i}`}
                className="h-10 sm:h-12 rounded-lg sm:rounded-xl border border-dashed border-white/5 bg-white/[0.01] opacity-25"
              />
            ))}

            {/* Days */}
            {days.map((d) => {
              const isSubmitted = d.status === "submitted";
              const isMissing = d.status === "missing";
              const isUpcoming = d.status === "upcoming";

              return (
                <button
                  key={d.dateStr}
                  type="button"
                  onClick={() => handleDayClick(d.dateStr)}
                  title={`Date: ${d.dateStr} • Status: ${d.status}${
                    isSubmitted ? ` (${d.mealsCount ?? 0} meals)` : isMissing ? " (Click to submit meals)" : ""
                  }`}
                  className={`group relative text-center h-10 sm:h-12 p-1 rounded-lg sm:rounded-xl border transition-all duration-150 cursor-pointer flex flex-col items-center justify-center active:scale-95 hover:shadow-md ${
                    d.isToday
                      ? "ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-900 z-10"
                      : ""
                  } ${
                    isSubmitted
                      ? "bg-emerald-500/[0.12] hover:bg-emerald-500/[0.25] border-emerald-500/35 text-emerald-200"
                      : isMissing
                      ? "bg-rose-500/[0.14] hover:bg-rose-500/[0.28] border-rose-500/35 text-rose-300"
                      : "bg-white/[0.02] hover:bg-white/[0.06] border-white/5 text-slate-500"
                  }`}
                >
                  <span className="text-[11px] sm:text-xs font-extrabold leading-none">
                    {d.day}
                  </span>

                  {/* Micro indicator below number */}
                  <span className="mt-0.5 leading-none">
                    {isSubmitted && (
                      <span className="text-[8px] sm:text-[9px] font-bold text-emerald-400">
                        {d.mealsCount !== null ? `${d.mealsCount}m` : "✓"}
                      </span>
                    )}
                    {isMissing && (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block shadow-sm shadow-rose-500/50"></span>
                    )}
                    {isUpcoming && (
                      <span className="text-[8px] text-slate-600 block scale-75">•</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Missing Days Alert Banner */}
          {missingDays.length > 0 && (
            <div
              className="p-2.5 sm:p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
              style={{
                background: "linear-gradient(135deg, rgba(244, 63, 94, 0.12) 0%, rgba(251, 191, 36, 0.08) 100%)",
                borderColor: "rgba(244, 63, 94, 0.3)",
              }}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="text-[11px] sm:text-xs text-slate-200">
                  <span className="font-bold text-rose-300">{missingDays.length} unsubmitted day(s)</span>. Click to add:
                </div>
              </div>

              {/* Jump chips */}
              <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap w-full sm:w-auto">
                {missingDays.slice(0, 7).map((md) => (
                  <button
                    key={md.dateStr}
                    type="button"
                    onClick={() => handleDayClick(md.dateStr)}
                    className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold bg-rose-500/20 hover:bg-rose-500/35 text-rose-200 border border-rose-500/40 transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-0.5"
                  >
                    <span>Day {md.day}</span>
                    <ArrowRight className="w-2 h-2 text-rose-300" />
                  </button>
                ))}
                {missingDays.length > 7 && (
                  <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 px-1">
                    +{missingDays.length - 7} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer & Legend */}
        <div className="p-2.5 sm:p-3 px-3 sm:px-5 bg-slate-950/50 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-slate-400 text-[10px] sm:text-xs">
            <span className="font-semibold uppercase tracking-wider text-slate-500">Legend:</span>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm" />
              <span className="text-slate-300 font-medium">Done ({submittedDays.length})</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 shadow-sm" />
              <span className="text-slate-300 font-medium">Missing ({missingDays.length})</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-600" />
              <span className="text-slate-400 font-medium">Upcoming ({upcomingDays.length})</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/15 text-white transition-colors cursor-pointer ml-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

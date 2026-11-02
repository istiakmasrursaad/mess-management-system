"use client";

import React, { useMemo, useState } from "react";
import { CalendarDays, CalendarCheck2, ChevronDown, ChevronUp, Check, Sparkles } from "lucide-react";

interface MonthCalendarPickerProps {
  value: string; // "YYYY-MM-DD" e.g. "2026-10-15" or ""
  onChange: (dateStr: string) => void;
  selectedMonth?: string; // "MM-YYYY" e.g. "10-2026"
  name?: string;
  required?: boolean;
  label?: string;
  accentColor?: "indigo" | "emerald" | "amber";
}

export default function MonthCalendarPicker({
  value,
  onChange,
  selectedMonth,
  name,
  required = false,
  accentColor = "indigo",
}: MonthCalendarPickerProps) {
  // If no date is initially selected, keep the calendar expanded so user sees it right away
  const [isOpen, setIsOpen] = useState(true);

  // Parse Month and Year from selectedMonth (e.g. "10-2026")
  const { monthNum, year, monthLabel, daysInMonth, firstDayOfWeek, todayStr, isTodayInMonth } = useMemo(() => {
    let m = 0;
    let y = 0;
    if (selectedMonth && selectedMonth.includes("-")) {
      const [mStr, yStr] = selectedMonth.split("-");
      m = parseInt(mStr, 10);
      y = parseInt(yStr, 10);
    }
    // Fallback if selectedMonth is not provided or invalid
    if (!m || !y || isNaN(m) || isNaN(y)) {
      if (value && value.includes("-")) {
        const parts = value.split("-");
        y = parseInt(parts[0], 10);
        m = parseInt(parts[1], 10);
      } else {
        const now = new Date();
        m = now.getMonth() + 1;
        y = now.getFullYear();
      }
    }

    const dInMonth = new Date(y, m, 0).getDate();
    const firstDow = new Date(y, m - 1, 1).getDay(); // 0 = Sun
    const mLabel = new Date(y, m - 1, 1).toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });

    const now = new Date();
    const tStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;
    const todayInMonth = now.getFullYear() === y && now.getMonth() + 1 === m;

    return {
      monthNum: m,
      year: y,
      monthLabel: mLabel,
      daysInMonth: dInMonth,
      firstDayOfWeek: firstDow,
      todayStr: tStr,
      isTodayInMonth: todayInMonth,
    };
  }, [selectedMonth, value]);

  // Construct calendar days for the active month
  const calendarDays = useMemo(() => {
    const list = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = `${year}-${String(monthNum).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      list.push({
        day: d,
        dateStr: dStr,
        isToday: dStr === todayStr,
        isSelected: dStr === value,
      });
    }
    return list;
  }, [daysInMonth, year, monthNum, todayStr, value]);

  // Formatted display of selected date
  const displayFormatted = useMemo(() => {
    if (!value) return null;
    try {
      const d = new Date(value + "T00:00:00");
      if (isNaN(d.getTime())) return value;
      return d.toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return value;
    }
  }, [value]);

  const weekdaysDesktop = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekdaysMobile = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  // Accent theme styles
  const accentGlow =
    accentColor === "emerald"
      ? "from-emerald-500 to-teal-600 shadow-emerald-500/30 border-emerald-400/50"
      : accentColor === "amber"
      ? "from-amber-500 to-orange-600 shadow-amber-500/30 border-amber-400/50"
      : "from-indigo-500 to-purple-600 shadow-indigo-500/30 border-indigo-400/50";

  const accentBadge =
    accentColor === "emerald"
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
      : accentColor === "amber"
      ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
      : "bg-indigo-500/15 text-indigo-300 border-indigo-500/30";

  return (
    <div className="space-y-2 w-full touch-manipulation">
      {/* Hidden input for standard HTML form submissions */}
      {name && <input type="hidden" name={name} value={value} required={required} />}

      {/* Selected Date Summary & Toggle Bar */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full p-2.5 sm:p-3 rounded-xl border transition-all duration-150 cursor-pointer flex items-center justify-between gap-2 select-none active:scale-[0.99] touch-manipulation text-left ${
          value
            ? "bg-white/[0.06] border-white/20 hover:border-white/30"
            : "bg-white/[0.03] border-white/10 hover:border-white/20"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
              value ? "bg-white/10 text-white border-white/20" : "bg-white/5 text-slate-400 border-white/10"
            }`}
          >
            {value ? <CalendarCheck2 className="w-4 h-4 text-emerald-400" /> : <CalendarDays className="w-4 h-4" />}
          </div>
          <div className="min-w-0 flex-1">
            {value ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs sm:text-sm font-extrabold text-white tracking-tight truncate">
                  {displayFormatted}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-0.5 shrink-0">
                  <Check className="w-2.5 h-2.5" /> Selected
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-medium text-slate-400 italic truncate">
                  Select a day ({monthLabel})
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-300 border border-amber-400/30 shrink-0">
                  Required
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="p-1 rounded-md text-slate-400 hover:text-white transition-colors">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </button>

      {/* Visual Month Calendar Grid (Optimized for Mobile and Desktop) */}
      {isOpen && (
        <div
          className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border bg-slate-950/50 backdrop-blur-md space-y-2 animate-in fade-in zoom-in-95 duration-150 overscroll-contain select-none"
          style={{
            borderColor: "rgba(255, 255, 255, 0.1)",
            boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.05), 0 10px 25px -5px rgba(0, 0, 0, 0.5)",
          }}
        >
          {/* Calendar Header with Month Pill and Quick Today Action */}
          <div className="flex items-center justify-between pb-1.5 border-b border-white/5 gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-bold text-white tracking-wide truncate">{monthLabel}</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${accentBadge}`}>
                {String(monthNum).padStart(2, "0")}-{year}
              </span>
            </div>

            {/* Quick Today Button inside header */}
            {isTodayInMonth && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(todayStr);
                }}
                title="Quick select today's date"
                className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-400/15 hover:bg-amber-400/25 text-amber-300 border border-amber-400/30 transition-all active:scale-95 cursor-pointer flex items-center gap-1 shrink-0 touch-manipulation"
              >
                <Sparkles className="w-2.5 h-2.5" /> Today
              </button>
            )}
          </div>

          {/* Weekday Row (Adaptive labels: Su, Mo... on mobile, Sun, Mon... on desktop) */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center">
            {weekdaysDesktop.map((day, idx) => (
              <div
                key={day}
                className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider py-1 rounded-md select-none ${
                  idx === 0 || idx === 6
                    ? "text-amber-400/80 bg-amber-400/5"
                    : "text-slate-400 bg-white/[0.02]"
                }`}
              >
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{weekdaysMobile[idx]}</span>
              </div>
            ))}
          </div>

          {/* Days Grid: Touch-optimized cells with zero text wrapping */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {/* Offset blanks */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div
                key={`offset-${i}`}
                className="h-9 sm:h-10 rounded-lg border border-dashed border-white/5 bg-white/[0.01] opacity-20"
              />
            ))}

            {/* Month Days */}
            {calendarDays.map((d) => {
              return (
                <button
                  key={d.dateStr}
                  type="button"
                  onClick={() => onChange(d.dateStr)}
                  title={`Select ${d.dateStr}${d.isToday ? " (Today)" : ""}`}
                  className={`group relative text-center h-9 sm:h-10 rounded-lg border transition-all duration-100 cursor-pointer flex flex-col items-center justify-center select-none active:scale-90 touch-manipulation ${
                    d.isSelected
                      ? `bg-gradient-to-br ${accentGlow} text-white font-black shadow-md scale-105 z-10`
                      : d.isToday
                      ? "ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-950 bg-amber-400/10 hover:bg-amber-400/20 text-amber-200 border-amber-400/40"
                      : "bg-white/[0.02] hover:bg-white/[0.08] hover:border-white/15 text-slate-300 border-white/5"
                  }`}
                >
                  <span className={`text-xs sm:text-sm leading-none ${d.isSelected ? "font-black" : "font-semibold"}`}>
                    {d.day}
                  </span>

                  {/* Clean micro-dot indicator that never causes overflow */}
                  <span className="mt-1 leading-none flex items-center justify-center h-1.5">
                    {d.isSelected ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-white inline-block shadow-sm" />
                    ) : d.isToday ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block shadow-sm shadow-amber-400/50" />
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  UtensilsCrossed,
  RefreshCw,
  CalendarDays,
  CalendarCheck2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Calendar
} from "lucide-react";
import MealCalendarModal from "./MealCalendarModal";

export default function DailymealsTab({ props }: { props: any }) {
  const {
    data,
    loading,
    selectedMealDate,
    setSelectedMealDate,
    dailyMealsData,
    mealInputValues,
    setMealInputValues,
    loadingDailyMeals,
    isSavingMeals,
    handleMealDateChange,
    handleSaveAllMeals,
    selectedMonth,
    fetchDailyMeals
  } = props;

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const [m, y] = (selectedMonth || "").split("-");
  const monthNum = parseInt(m, 10);
  const yearNum = parseInt(y, 10);
  const lastDayOfMonth = m && y ? new Date(yearNum, monthNum, 0).getDate() : 31;
  const firstDayOfWeek = m && y ? new Date(yearNum, monthNum - 1, 1).getDay() : 0;
  const minDate = y && m ? `${y}-${m}-01` : undefined;
  const maxDate = y && m ? `${y}-${m}-${lastDayOfMonth}` : undefined;
  const monthLabel = m && y
    ? new Date(yearNum, monthNum - 1, 1).toLocaleString("en-US", { month: "long", year: "numeric" })
    : selectedMonth;

  // Today string for highlighting
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;

  // Gather submitted dates & meal counts
  const submittedSet = new Set<string>(data?.submittedDates || []);
  const mealsMap: Record<string, number> = { ...(data?.dateTotalMeals || {}) };

  if (submittedSet.size === 0 && Array.isArray(data?.members)) {
    data.members.forEach((mem: any) => {
      const dailyMeals = mem.member?.dailyMeals || mem.dailyMeals || [];
      dailyMeals.forEach((meal: any) => {
        if (meal?.date) {
          const dKey = new Date(meal.date).toISOString().split("T")[0];
          submittedSet.add(dKey);
          mealsMap[dKey] = (mealsMap[dKey] || 0) + (Number(meal.totalMeal) || 0);
        }
      });
    });
  }

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
  if (m && y) {
    for (let d = 1; d <= lastDayOfMonth; d++) {
      const dateStr = `${yearNum}-${String(monthNum).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
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
  }

  const submittedDays = days.filter((d) => d.status === "submitted");
  const missingDays = days.filter((d) => d.status === "missing");
  const totalMessMeals = data?.totalMessMeals ?? 0;

  const weekdaysDesktop = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekdaysMobile = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  // Select a date and fetch meals immediately
  const handleDateSelect = (dateStr: string) => {
    if (setSelectedMealDate) {
      setSelectedMealDate(dateStr);
    }
    if (fetchDailyMeals) {
      fetchDailyMeals(dateStr);
    }
    setIsCalendarOpen(false);
  };

  // Step -1 / +1 day
  const handleStepDate = (offsetDays: number) => {
    if (!selectedMealDate) {
      handleDateSelect(todayStr);
      return;
    }
    const curr = new Date(selectedMealDate);
    curr.setDate(curr.getDate() + offsetDays);
    const nextDateStr = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, "0")}-${String(
      curr.getDate()
    ).padStart(2, "0")}`;
    if (minDate && nextDateStr < minDate) return;
    if (maxDate && nextDateStr > maxDate) return;
    handleDateSelect(nextDateStr);
  };

  const hasSubmittedDate = selectedMealDate ? submittedSet.has(selectedMealDate) : false;

  return (
    <>
      <div className="section-panel">
        {/* Panel Header */}
        <div className="section-panel-header flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-foreground">Daily Meals Management</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add or override daily meals for all members by date.
            </p>
          </div>

          {/* Header Actions: Total Day Count + Smart Calendar Date Selector */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap w-full md:w-auto justify-between md:justify-end">
            {/* Total Day Count Pill Button */}
            <button
              type="button"
              onClick={() => setIsCalendarOpen(true)}
              title="Click to view days breakdown"
              className="group flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 hover:border-amber-400/60 text-amber-300 transition-all cursor-pointer shrink-0 active:scale-95 shadow-sm"
            >
              <CalendarDays className="w-3.5 h-3.5 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
              <span>Day Count:</span>
              <span className="font-extrabold text-amber-200">
                {data?.totalDayCount || 0} {(data?.totalDayCount || 0) === 1 ? "Day" : "Days"}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-amber-400/80 group-hover:text-amber-200 group-hover:translate-x-0.5 transition-all" />
            </button>

            {/* Smart Date Choose Button (Clicking opens calendar with all submission statuses) */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsCalendarOpen(true)}
                title="Click to choose a date from the visual meal calendar"
                className="group flex items-center gap-2 h-9 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-400/40 text-foreground text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  {selectedMealDate ? (
                    <>
                      <span className="text-slate-400 hidden xs:inline sm:inline">Date: </span>
                      <strong className="text-white">{selectedMealDate}</strong>
                    </>
                  ) : (
                    "Choose Date ▾"
                  )}
                </span>
                {selectedMealDate && (
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      hasSubmittedDate ? "bg-emerald-400" : "bg-rose-400"
                    }`}
                    title={hasSubmittedDate ? "Submitted" : "Not Submitted"}
                  />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Loading Spinner */}
        {loadingDailyMeals ? (
          <div className="flex justify-center p-12">
            <RefreshCw className="h-8 w-8 animate-spin" style={{ color: "oklch(0.65 0.25 275)" }} />
          </div>
        ) : !selectedMealDate ? (
          /* ─── EMPTY STATE: Prominent Interactive Month Calendar View ─── */
          <div className="p-3 sm:p-6 border-t border-white/5 space-y-4 animate-in fade-in">
            {/* Visual Calendar Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-300">
                  <CalendarCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <span>Select a Date to Enter Meals</span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30">
                      {monthLabel}
                    </span>
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Click any day below to start entering or reviewing meals for that date.
                  </p>
                </div>
              </div>

              {/* Quick Summary Pills */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    Submitted: <strong className="text-white">{submittedDays.length}d</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/15 border border-rose-500/35 text-rose-300 font-semibold">
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>
                    Missing: <strong className="text-white">{missingDays.length}d</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-300 font-semibold">
                  <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    Meals: <strong className="text-white">{totalMessMeals}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
              {weekdaysDesktop.map((day, idx) => (
                <div
                  key={day}
                  className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider py-1.5 rounded-lg ${
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

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {/* Offset blanks */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="min-h-[50px] sm:min-h-[64px] rounded-xl border border-dashed border-white/5 bg-white/[0.01] opacity-25"
                />
              ))}

              {/* Month Days */}
              {days.map((d) => {
                const isSubmitted = d.status === "submitted";
                const isMissing = d.status === "missing";
                const isUpcoming = d.status === "upcoming";

                return (
                  <button
                    key={d.dateStr}
                    type="button"
                    onClick={() => handleDateSelect(d.dateStr)}
                    title={`Click to open ${d.dateStr} (${
                      isSubmitted
                        ? `Submitted: ${d.mealsCount ?? 0} meals`
                        : isMissing
                        ? "Missing: No meals logged"
                        : "Upcoming"
                    })`}
                    className={`group relative text-center sm:text-left min-h-[50px] sm:min-h-[64px] p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border transition-all duration-150 cursor-pointer flex flex-col items-center sm:items-stretch justify-between active:scale-95 hover:shadow-lg ${
                      isSubmitted
                        ? "bg-emerald-500/[0.09] hover:bg-emerald-500/[0.22] border-emerald-500/35 hover:border-emerald-500/70"
                        : isMissing
                        ? "bg-rose-500/[0.1] hover:bg-rose-500/[0.25] border-rose-500/35 hover:border-rose-500/70"
                        : "bg-white/[0.02] hover:bg-white/[0.06] border-white/5 hover:border-white/15"
                    }`}
                  >
                    {/* Top: Day Number + Indicator */}
                    <div className="flex items-center justify-center sm:justify-between w-full">
                      <span
                        className={`text-[11px] sm:text-sm font-extrabold leading-none ${
                          d.isToday
                            ? "w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-sm"
                            : isSubmitted
                            ? "text-emerald-200 sm:text-white"
                            : isMissing
                            ? "text-rose-200"
                            : "text-slate-500"
                        }`}
                      >
                        {d.day}
                      </span>

                      {/* Desktop indicator */}
                      {isSubmitted && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 hidden sm:inline" />
                      )}
                      {isMissing && (
                        <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 hidden sm:inline" />
                      )}
                      {isUpcoming && (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0 hidden sm:inline" />
                      )}
                    </div>

                    {/* Bottom: Meals count or Status */}
                    <div className="mt-1 w-full">
                      {isSubmitted && (
                        <div className="flex items-center justify-center sm:justify-between w-full">
                          <span className="text-[9px] sm:text-[10px] font-bold text-emerald-400 sm:text-emerald-300 truncate">
                            {d.mealsCount !== null ? (
                              <>
                                <span>{d.mealsCount}</span>
                                <span className="hidden sm:inline"> meals</span>
                              </>
                            ) : (
                              "✓ Logged"
                            )}
                          </span>
                          <ArrowRight className="w-2.5 h-2.5 text-emerald-400/60 opacity-0 group-hover:opacity-100 transition-opacity hidden md:inline" />
                        </div>
                      )}

                      {isMissing && (
                        <div className="flex items-center justify-center sm:justify-between w-full">
                          <span className="text-[9px] sm:text-[10px] font-bold text-rose-400 truncate">
                            <span className="sm:hidden">✕ Missing</span>
                            <span className="hidden sm:inline">Missing</span>
                          </span>
                          <span className="text-[8px] font-bold text-rose-300 opacity-0 group-hover:opacity-100 transition-opacity hidden md:inline">
                            Add ➔
                          </span>
                        </div>
                      )}

                      {isUpcoming && (
                        <div className="flex items-center justify-center sm:justify-start w-full">
                          <span className="text-[8px] text-slate-600 block sm:hidden">•</span>
                          <span className="text-[9px] font-medium text-slate-500 truncate hidden sm:block">
                            —
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Missing Days Quick Action Alert */}
            {missingDays.length > 0 && (
              <div
                className="p-3 sm:p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(244, 63, 94, 0.12) 0%, rgba(251, 191, 36, 0.08) 100%)",
                  borderColor: "rgba(244, 63, 94, 0.3)",
                }}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="text-xs text-slate-200">
                    <span className="font-bold text-rose-300">{missingDays.length} unsubmitted day(s)</span> in{" "}
                    {monthLabel}. Click any day below to start submitting meals:
                  </div>
                </div>

                {/* Jump chips */}
                <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
                  {missingDays.slice(0, 8).map((md) => (
                    <button
                      key={md.dateStr}
                      type="button"
                      onClick={() => handleDateSelect(md.dateStr)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/20 hover:bg-rose-500/35 text-rose-200 border border-rose-500/40 transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1"
                    >
                      <span>Day {md.day}</span>
                      <ArrowRight className="w-2.5 h-2.5 text-rose-300" />
                    </button>
                  ))}
                  {missingDays.length > 8 && (
                    <span className="text-[11px] font-semibold text-slate-400 px-1">
                      +{missingDays.length - 8} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ─── ACTIVE DATE SELECTED: Active Date Bar + Member Meals Table ─── */
          <>
            {/* Active Date Bar: shows date, submission status, and quick date switcher */}
            <div className="p-3 sm:p-4 bg-white/[0.02] border-t border-b border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-xl border shrink-0 ${
                    hasSubmittedDate
                      ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                      : "bg-rose-500/15 border-rose-500/30 text-rose-400"
                  }`}
                >
                  <CalendarCheck2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-foreground">
                      {new Date(selectedMealDate).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    {hasSubmittedDate ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        ✓ Submitted
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
                        ✕ Not Submitted Yet
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {hasSubmittedDate
                      ? "Meals already recorded. You can modify counts below and re-save."
                      : "No meals logged for this date yet. Enter member meals below and click Submit."}
                  </p>
                </div>
              </div>

              {/* Prev / Next / Switch Date Action Buttons */}
              <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => handleStepDate(-1)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                  title="Previous Day"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsCalendarOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/30 text-amber-300 text-xs font-bold transition-all cursor-pointer"
                  title="Switch to another date using the visual calendar"
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>Switch Date</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStepDate(1)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                  title="Next Day"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMealDate("")}
                  className="p-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-slate-400 hover:text-white transition-all cursor-pointer ml-1"
                  title="Back to full month calendar view"
                >
                  Month View
                </button>
              </div>
            </div>

            {/* Member Meals Entry Table */}
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Member Name</th>
                    <th>Total Meal</th>
                    <th>Room</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyMealsData.map((m: any) => {
                    const hasSubmitted = !!m.mealRecord;
                    const val =
                      mealInputValues[m.memberId] !== undefined
                        ? mealInputValues[m.memberId]
                        : hasSubmitted
                        ? m.mealRecord.totalMeal
                        : 0;
                    return (
                      <tr key={m.memberId}>
                        <td className="font-semibold text-foreground">{m.name}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setMealInputValues((prev: any) => ({
                                    ...prev,
                                    [m.memberId]: Math.max(
                                      0,
                                      (prev[m.memberId] !== undefined ? prev[m.memberId] : val) - 0.5
                                    ),
                                  }))
                                }
                                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 font-extrabold text-sm flex items-center justify-center text-foreground cursor-pointer"
                              >
                                -
                              </button>
                              <Input
                                type="number"
                                step="0.5"
                                value={val}
                                onChange={(e) => {
                                  const v = parseFloat(e.target.value) || 0;
                                  setMealInputValues((prev: any) => ({ ...prev, [m.memberId]: v }));
                                }}
                                id={`meal-${m.memberId}`}
                                className="w-16 h-8 text-center px-1 rounded-lg bg-white/5 border-white/10 text-foreground font-bold text-sm"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setMealInputValues((prev: any) => ({
                                    ...prev,
                                    [m.memberId]:
                                      (prev[m.memberId] !== undefined ? prev[m.memberId] : val) + 0.5,
                                  }))
                                }
                                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 font-extrabold text-sm flex items-center justify-center text-foreground cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                            <div className="flex items-center gap-1 flex-wrap">
                              {[0, 0.5, 1, 1.5, 2, 2.5].map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() =>
                                    setMealInputValues((prev: any) => ({ ...prev, [m.memberId]: preset }))
                                  }
                                  className={`px-2 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                    val === preset
                                      ? "bg-indigo-600 text-white shadow-sm"
                                      : "bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10"
                                  }`}
                                >
                                  {preset}
                                </button>
                              ))}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge-indigo">{m.roomNo}</span>
                        </td>
                        <td>
                          {hasSubmitted ? (
                            <span className="badge-emerald">Submitted</span>
                          ) : (
                            <span className="badge-amber">Pending</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Save / Submit Bar */}
            <div
              className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 p-4 border-t"
              style={{ borderColor: "oklch(1 0 0 / 7%)" }}
            >
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold"
                  style={{
                    background: "oklch(0.65 0.25 275 / 10%)",
                    border: "1px solid oklch(0.65 0.25 275 / 20%)",
                    color: "oklch(0.75 0.20 275)",
                  }}
                >
                  <UtensilsCrossed className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span>Total Day Meals:</span>
                  <span className="text-sm sm:text-base font-extrabold">
                    {Object.values(mealInputValues).reduce((sum: number, v: any) => sum + (Number(v) || 0), 0)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCalendarOpen(true)}
                  className="group flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/25 hover:border-amber-400/40 text-amber-300 cursor-pointer transition-colors shrink-0 active:scale-95"
                >
                  <CalendarDays className="w-3.5 h-3.5 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
                  <span>Day Count: <strong className="font-extrabold text-amber-200">{data?.totalDayCount || 0} {(data?.totalDayCount || 0) === 1 ? "Day" : "Days"}</strong></span>
                  <ChevronRight className="w-3.5 h-3.5 text-amber-400/80 group-hover:text-amber-200 group-hover:translate-x-0.5 transition-all" />
                </button>
              </div>

              <Button
                onClick={handleSaveAllMeals}
                disabled={isSavingMeals}
                className="btn-glow font-bold h-10 px-6 rounded-xl text-sm cursor-pointer w-full sm:w-auto"
              >
                {isSavingMeals ? "Submitting Day Meals..." : "Submit / Save Day Meals"}
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Visual Meal Calendar Modal Popup (for quick date switching anywhere) */}
      <MealCalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        selectedMonth={selectedMonth || data?.monthYear}
        data={data}
        onSelectDate={handleDateSelect}
      />
    </>
  );
}

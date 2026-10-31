"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  ScrollText, 
  Lock, 
  Calculator, 
  CalendarDays, 
  ArrowRight, 
  Sparkles, 
  Search, 
  Receipt,
  RotateCcw
} from "lucide-react";
import { DiningCalcCard } from "@/components/DiningCalcCard";

function monthYearToLabel(monthYear: string): string {
  if (!monthYear) return "";
  const [m, y] = monthYear.split("-");
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const idx = parseInt(m, 10) - 1;
  return `${monthNames[idx] || m} ${y}`;
}

export default function LedgerTab({ props }: { props: any }) {
  const { 
    data, 
    selectedMonth, 
    isFinalizing, 
    isMemberFilterOpen, 
    setIsMemberFilterOpen, 
    exportType, 
    selectedExportMembers, 
    setSelectedExportMembers, 
    handleFinalizeMonth, 
    toggleExportMember, 
    runExport, 
    exportToPDF, 
    exportToWord, 
    exportDailyMealsPDF 
  } = props;

  // View state: null = Initial state with 2 choice cards, "calculation" = Master Audit Table, "dailyMeals" = Day-by-Day Grid
  const [viewMode, setViewMode] = useState<"calculation" | "dailyMeals" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Determine days in selected month
  const [monthNum, yearNum] = (selectedMonth || "").split("-").map(Number);
  const daysInMonth = (monthNum && yearNum) ? new Date(yearNum, monthNum, 0).getDate() : 31;
  const daysArray = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);

  // Check if viewing current real-world month to highlight today
  const now = new Date();
  const isCurrentMonth = monthNum === now.getMonth() + 1 && yearNum === now.getFullYear();
  const todayDate = now.getDate();

  // Safely extract day of month (1..31) from date string or Date object
  const getDayFromDate = (dateVal: any): number => {
    if (!dateVal) return 0;
    if (typeof dateVal === "string") {
      const match = dateVal.match(/^\d{4}-\d{2}-(\d{2})/);
      if (match) return parseInt(match[1], 10);
    }
    const d = new Date(dateVal);
    return d.getDate();
  };

  // Filter members based on search input
  const filteredMembers = useMemo(() => {
    if (!data?.members) return [];
    if (!searchQuery.trim()) return data.members;
    const q = searchQuery.toLowerCase().trim();
    return data.members.filter((m: any) => {
      const name = (m.member?.user?.name || "").toLowerCase();
      const room = (m.member?.roomNo || "").toString().toLowerCase();
      return name.includes(q) || room.includes(q);
    });
  }, [data?.members, searchQuery]);

  // Totals for Calculation Ledger
  const calcTotals = useMemo(() => {
    if (!data?.members) return null;
    let totalMeals = 0;
    let totalMealCost = 0;
    let totalMessCost = 0;
    let totalDeposits = 0;
    let totalDues = 0;
    let totalAdvances = 0;

    data.members.forEach((m: any) => {
      totalMeals += Number(m.totalMeals) || 0;
      totalMealCost += Number(m.individualMealCost) || 0;
      totalMessCost += Number(m.totalCost) || 0;

      const depositVal = m.totalDeposits > 0
        ? m.totalDeposits + m.previousAdvance - m.previousDue
        : m.previousAdvance;
      totalDeposits += depositVal || 0;
      totalDues += Number(m.due) || 0;
      totalAdvances += Number(m.advance) || 0;
    });

    return {
      totalMeals,
      totalMealCost,
      totalMessCost,
      totalDeposits,
      totalDues,
      totalAdvances
    };
  }, [data?.members]);

  // Daily totals for Day-by-Day Meal Matrix
  const dayTotals = useMemo(() => {
    if (!data?.members) return {};
    const totals: Record<number, number> = {};
    for (let i = 1; i <= daysInMonth; i++) {
      totals[i] = 0;
    }
    data.members.forEach((m: any) => {
      const rawMeals = m.member?.dailyMeals || m.dailyMeals || [];
      rawMeals.forEach((dm: any) => {
        const d = getDayFromDate(dm.date);
        if (d >= 1 && d <= daysInMonth) {
          totals[d] = (totals[d] || 0) + (Number(dm.totalMeal) || 0);
        }
      });
    });
    return totals;
  }, [data?.members, daysInMonth]);

  return (
    <>
      <DiningCalcCard selectedMonth={selectedMonth} />

      <div className="section-panel shadow-xl">
        {/* Section Panel Header - Fully Responsive */}
        <div className="section-panel-header flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                {viewMode === "calculation" && (
                  <>
                    <span className="p-1.5 rounded-lg bg-violet-500/20 text-violet-400">
                      <Calculator className="w-4 h-4" />
                    </span>
                    Monthly Master Audit Ledger
                  </>
                )}
                {viewMode === "dailyMeals" && (
                  <>
                    <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                      <CalendarDays className="w-4 h-4" />
                    </span>
                    Day-by-Day Meals Ledger
                  </>
                )}
                {viewMode === null && (
                  <>
                    <span className="p-1.5 rounded-lg bg-primary/20 text-primary">
                      <Receipt className="w-4 h-4" />
                    </span>
                    Monthly Master Audit & Ledger
                  </>
                )}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {viewMode === "calculation"
                  ? "Complete breakdown of meals, overheads, deposits, and net balance."
                  : viewMode === "dailyMeals"
                  ? `Full month (${monthYearToLabel(selectedMonth)}) day-by-day (1 to ${daysInMonth}) meals record.`
                  : "Choose an audit report view below or export data using the right-side actions."}
              </p>
            </div>

            {/* View Switcher Pills (shown once a view is active) */}
            {viewMode !== null && (
              <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-xl max-w-full overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setViewMode("calculation")}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    viewMode === "calculation"
                      ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  <Calculator className="w-3.5 h-3.5" />
                  Calculation
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("dailyMeals")}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    viewMode === "dailyMeals"
                      ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  Day-by-Day Meals
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode(null);
                    setSearchQuery("");
                  }}
                  title="Back to option cards"
                  className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer border-l border-white/10 ml-0.5 whitespace-nowrap"
                >
                  <RotateCcw className="w-3 h-3" />
                  Options
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons on the Right Side - Mobile Friendly */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start lg:justify-end pt-1 lg:pt-0 border-t lg:border-t-0 border-white/5">
            <Button 
              onClick={handleFinalizeMonth} 
              disabled={isFinalizing} 
              size="sm"
              className="btn-glow h-8 sm:h-9 px-2.5 sm:px-3 text-xs font-bold gap-1.5 sm:gap-2 rounded-xl"
            >
              <Lock className="w-3.5 h-3.5" />{isFinalizing ? "Saving..." : "Finalize & Save"}
            </Button>
            <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={exportToPDF} 
                className="h-8 px-2 sm:px-2.5 text-xs rounded-lg gap-1 text-muted-foreground hover:text-foreground hover:bg-white/5"
              >
                <ScrollText className="w-3.5 h-3.5" style={{ color: 'oklch(0.68 0.22 27)' }} /> PDF
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={exportToWord} 
                className="h-8 px-2 sm:px-2.5 text-xs rounded-lg gap-1 text-muted-foreground hover:text-foreground hover:bg-white/5"
              >
                <ScrollText className="w-3.5 h-3.5" style={{ color: 'oklch(0.55 0.26 278)' }} /> Word
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={exportDailyMealsPDF} 
                className="h-8 px-2 sm:px-2.5 text-xs rounded-lg gap-1 text-muted-foreground hover:text-foreground hover:bg-white/5"
              >
                <ScrollText className="w-3.5 h-3.5 text-cyan-400" /> Meals PDF
              </Button>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* CASE 1: INITIAL STATE (No table shown, 2 Attractive Option Cards) */}
        {/* ============================================================== */}
        {viewMode === null && (
          <div className="p-4 sm:p-6 md:p-10 space-y-6 sm:space-y-8 animate-fade-in">
            <div className="text-center max-w-xl mx-auto space-y-2 sm:space-y-2.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-violet-500/15 via-primary/15 to-cyan-500/15 border border-white/10 text-xs font-semibold text-foreground/90 backdrop-blur">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>Select Audit Report View</span>
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-black text-foreground tracking-tight">
                Select Monthly Audit & Ledger View
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Choose a report view to inspect calculations or daily meal breakdowns. You can toggle between reports at any time.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
              {/* Option 1: Monthly Master Calculation Ledger */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setViewMode("calculation")}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setViewMode("calculation"); }}
                className="group relative flex flex-col justify-between p-5 sm:p-7 rounded-2xl bg-gradient-to-br from-violet-950/40 via-card to-card border border-violet-500/25 hover:border-violet-500/60 hover:shadow-2xl hover:shadow-violet-600/15 transition-all duration-300 cursor-pointer overflow-hidden text-left"
              >
                <div className="absolute top-0 right-0 w-36 h-36 bg-violet-500/10 rounded-full blur-2xl group-hover:bg-violet-500/20 transition-all pointer-events-none" />

                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 group-hover:scale-110 group-hover:bg-violet-600 group-hover:text-white transition-all duration-300 shadow-lg shadow-violet-500/20">
                      <Calculator className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2 sm:px-2.5 py-1 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/25">
                      Full Audit
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base sm:text-lg font-bold text-foreground group-hover:text-violet-300 transition-colors">
                      Monthly Master Calculation
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Detailed financial breakdown of meal costs, shared utility bills (Khala, Current, Gas, Paper, Manager), deposits, dues, and advance balances.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[11px] text-muted-foreground">
                      Meal Costs & Rates
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[11px] text-muted-foreground">
                      Overhead Bills
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[11px] text-muted-foreground">
                      Net Due & Advance
                    </span>
                  </div>
                </div>

                <div className="pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-white/10 flex items-center justify-between text-xs font-bold text-violet-400 group-hover:text-violet-300">
                  <span>Open Calculation Ledger</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
                </div>
              </div>

              {/* Option 2: Day-by-Day Meal Sheet */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setViewMode("dailyMeals")}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setViewMode("dailyMeals"); }}
                className="group relative flex flex-col justify-between p-5 sm:p-7 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-card to-card border border-cyan-500/25 hover:border-cyan-500/60 hover:shadow-2xl hover:shadow-cyan-500/15 transition-all duration-300 cursor-pointer overflow-hidden text-left"
              >
                <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all pointer-events-none" />

                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 group-hover:bg-cyan-600 group-hover:text-white transition-all duration-300 shadow-lg shadow-cyan-500/20">
                      <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2 sm:px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/25">
                      Meals PDF Matrix
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base sm:text-lg font-bold text-foreground group-hover:text-cyan-300 transition-colors">
                      Day-by-Day Meal Sheet
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Full monthly day-by-day (1 to {daysInMonth}) meal distribution grid for every member, with member total meals, extra guest meals, and x2 status.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[11px] text-muted-foreground">
                      1 to {daysInMonth} Daily Grid
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[11px] text-muted-foreground">
                      Extra Guest Meals
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[11px] text-muted-foreground">
                      Need x2 Status
                    </span>
                  </div>
                </div>

                <div className="pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-white/10 flex items-center justify-between text-xs font-bold text-cyan-400 group-hover:text-cyan-300">
                  <span>Open Day-by-Day Meals</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* CASE 2: CALCULATION LEDGER VIEW */}
        {/* ============================================================== */}
        {viewMode === "calculation" && (
          <div className="animate-fade-in">
            {/* Quick Filter Bar - Responsive */}
            <div className="p-3 px-3 sm:px-4 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.02]">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-muted-foreground">
                  Showing {filteredMembers.length} of {data?.members?.length || 0} members
                </span>
                <span className="text-muted-foreground/30">•</span>
                <span className="font-medium text-foreground/80">
                  Total Mess Meals: <strong className="text-primary">{data?.totalMessMeals || 0}</strong>
                </span>
                <span className="text-muted-foreground/30">•</span>
                <span className="font-medium text-foreground/80">
                  Live Rate: <strong className="text-primary">৳{(data?.liveMealRate || 0).toFixed(2)}</strong>
                </span>
              </div>
              <div className="relative w-full sm:w-auto">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter member by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-violet-500/50 w-full sm:w-56"
                />
              </div>
            </div>

            <div className="table-responsive max-h-[72vh] overflow-y-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="sticky top-0 left-0 z-30 bg-[oklch(0.16_0.018_260)] w-11 min-w-[44px] text-center border-r border-b border-white/10 shadow-[2px_2px_4px_rgba(0,0,0,0.3)]">SI</th>
                    <th className="sticky top-0 left-[44px] z-30 bg-[oklch(0.16_0.018_260)] min-w-[140px] text-left border-r border-b border-white/10 shadow-[2px_2px_4px_rgba(0,0,0,0.3)]">Name</th>
                    <th className="sticky top-0 z-20 bg-[oklch(0.16_0.018_260)] border-b border-white/10">Meals</th>
                    <th className="sticky top-0 z-20 bg-[oklch(0.16_0.018_260)] border-b border-white/10">Meal Cost</th>
                    <th className="sticky top-0 z-20 bg-[oklch(0.16_0.018_260)] border-b border-white/10">Khala</th>
                    <th className="sticky top-0 z-20 bg-[oklch(0.16_0.018_260)] border-b border-white/10">Manager</th>
                    <th className="sticky top-0 z-20 bg-[oklch(0.16_0.018_260)] border-b border-white/10">Paper</th>
                    <th className="sticky top-0 z-20 bg-[oklch(0.16_0.018_260)] border-b border-white/10">Current</th>
                    <th className="sticky top-0 z-20 bg-[oklch(0.16_0.018_260)] border-b border-white/10">Gas</th>
                    <th className="sticky top-0 z-20 bg-[oklch(0.16_0.018_260)] border-b border-white/10">Fest</th>
                    <th className="sticky top-0 z-20 bg-[oklch(0.16_0.018_260)] border-b border-white/10">Fine</th>
                    <th className="sticky top-0 z-20 bg-[oklch(0.16_0.018_260)] border-b border-white/10">Total Cost</th>
                    <th className="sticky top-0 z-20 bg-[oklch(0.16_0.018_260)] border-b border-white/10" title="Deposit (Includes previous advance)">Deposit</th>
                    <th className="sticky top-0 z-20 bg-[oklch(0.16_0.018_260)] border-b border-white/10">Due</th>
                    <th className="sticky top-0 z-20 bg-[oklch(0.16_0.018_260)] border-b border-white/10">Advance</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((m: any, index: number) => (
                    <tr key={m.member.id} className="hover:bg-white/[0.03] transition-colors group">
                      <td className="sticky left-0 z-10 bg-[oklch(0.13_0.016_260)] group-hover:bg-[oklch(0.17_0.022_260)] text-muted-foreground text-center border-r border-white/10 shadow-[2px_0_4px_rgba(0,0,0,0.25)]">{index + 1}</td>
                      <td className="sticky left-[44px] z-10 bg-[oklch(0.13_0.016_260)] group-hover:bg-[oklch(0.17_0.022_260)] font-semibold text-foreground whitespace-nowrap border-r border-white/10 shadow-[2px_0_4px_rgba(0,0,0,0.25)]">
                        {m.member.user.name}
                        {m.member.roomNo && (
                          <span className="text-[11px] text-muted-foreground ml-1.5 font-normal">
                            (R{m.member.roomNo})
                          </span>
                        )}
                      </td>
                      <td className="font-medium">{m.totalMeals}</td>
                      <td>৳{m.individualMealCost.toFixed(2)}</td>
                      <td>৳{m.baseKhala.toFixed(2)}</td>
                      <td>৳{m.baseManager.toFixed(2)}</td>
                      <td>৳{m.paper.toFixed(2)}</td>
                      <td>৳{m.current.toFixed(2)}</td>
                      <td>৳{m.baseGas.toFixed(2)}</td>
                      <td>৳{m.festival.toFixed(2)}</td>
                      <td>৳{m.marketFine.toFixed(2)}</td>
                      <td className="font-bold text-foreground">৳{m.totalCost.toFixed(2)}</td>
                      {(() => {
                        const depositVal = m.totalDeposits > 0
                          ? m.totalDeposits + m.previousAdvance - m.previousDue
                          : m.previousAdvance;
                        const color = depositVal >= 0 ? 'oklch(0.70 0.19 162)' : 'oklch(0.68 0.22 27)';
                        return (
                          <td className="font-bold" style={{ color }}>
                            {depositVal > 0 ? `৳${depositVal.toFixed(2)}` : depositVal < 0 ? `-৳${Math.abs(depositVal).toFixed(2)}` : '—'}
                          </td>
                        );
                      })()}
                      <td className="font-extrabold" style={{ color: m.due > 0 ? 'oklch(0.68 0.22 27)' : 'oklch(0.45 0.02 260)' }}>
                        {m.due > 0 ? `৳${m.due.toFixed(2)}` : "—"}
                      </td>
                      <td className="font-extrabold" style={{ color: m.advance > 0 ? 'oklch(0.70 0.19 162)' : 'oklch(0.45 0.02 260)' }}>
                        {m.advance > 0 ? `৳${m.advance.toFixed(2)}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {calcTotals && (
                  <tfoot>
                    <tr className="border-t-2 border-white/10 font-bold bg-white/5">
                      <td colSpan={2} className="sticky left-0 z-10 bg-[oklch(0.15_0.018_260)] text-foreground uppercase tracking-wider text-xs border-r border-white/10 shadow-[2px_0_4px_rgba(0,0,0,0.25)]">Total Summary</td>
                      <td className="font-extrabold text-foreground">{calcTotals.totalMeals.toFixed(1)}</td>
                      <td>৳{calcTotals.totalMealCost.toFixed(2)}</td>
                      <td colSpan={7} className="text-xs text-muted-foreground text-center">Shared Overheads</td>
                      <td className="text-foreground font-extrabold">৳{calcTotals.totalMessCost.toFixed(2)}</td>
                      <td className="font-extrabold" style={{ color: calcTotals.totalDeposits >= 0 ? 'oklch(0.70 0.19 162)' : 'oklch(0.68 0.22 27)' }}>
                        ৳{calcTotals.totalDeposits.toFixed(2)}
                      </td>
                      <td className="font-extrabold" style={{ color: 'oklch(0.68 0.22 27)' }}>
                        ৳{calcTotals.totalDues.toFixed(2)}
                      </td>
                      <td className="font-extrabold" style={{ color: 'oklch(0.70 0.19 162)' }}>
                        ৳{calcTotals.totalAdvances.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* CASE 3: DAY-BY-DAY MEALS SHEET (Meals PDF equivalent) */}
        {/* ============================================================== */}
        {viewMode === "dailyMeals" && (
          <div className="animate-fade-in">
            {/* Quick Filter & Month Stats Bar - Responsive */}
            <div className="p-3 px-3 sm:px-4 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.02]">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
                <span className="font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20 whitespace-nowrap">
                  {monthYearToLabel(selectedMonth).toUpperCase()}
                </span>
                <span className="font-semibold text-muted-foreground">
                  {daysInMonth} Days
                </span>
                <span className="text-muted-foreground/30">•</span>
                <span className="font-semibold text-muted-foreground">
                  {filteredMembers.length} Members
                </span>
                <span className="text-muted-foreground/30">•</span>
                <span className="font-medium text-foreground">
                  Total Mess Meals: <strong className="text-cyan-400">{data?.totalMessMeals || 0}</strong>
                </span>
              </div>
              <div className="relative w-full sm:w-auto">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter member by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-500/50 w-full sm:w-56"
                />
              </div>
            </div>

            <div className="table-responsive max-h-[72vh] overflow-y-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    {/* Frozen Column 1 & Row 1 (Top-Left Intersection) */}
                    <th className="sticky top-0 left-0 z-30 bg-[oklch(0.16_0.018_260)] w-11 min-w-[44px] text-center border-r border-b border-white/10 shadow-[2px_2px_4px_rgba(0,0,0,0.3)]">
                      SI
                    </th>
                    {/* Frozen Column 2 & Row 1 (Top-Left Intersection) */}
                    <th className="sticky top-0 left-[44px] z-30 bg-[oklch(0.16_0.018_260)] min-w-[140px] sm:min-w-[160px] text-left border-r border-b border-white/10 shadow-[2px_2px_4px_rgba(0,0,0,0.3)]">
                      NAME
                    </th>
                    {/* Frozen Row 1 for Days (1 to N) */}
                    {daysArray.map((day) => {
                      const isTodayCol = isCurrentMonth && day === todayDate;
                      return (
                        <th 
                          key={day} 
                          className={`sticky top-0 z-20 bg-[oklch(0.16_0.018_260)] w-9 min-w-[36px] text-center px-1 py-2 text-xs border-b border-white/10 ${
                            isTodayCol 
                              ? "bg-cyan-500/20 text-cyan-300 font-extrabold border-b-2 border-cyan-400" 
                              : ""
                          }`}
                          title={`Day ${day}`}
                        >
                          {day}
                        </th>
                      );
                    })}
                    {/* Frozen Row 1 for Summary Columns */}
                    <th className="sticky top-0 z-20 bg-[oklch(0.16_0.018_260)] min-w-[70px] text-center bg-cyan-500/10 text-cyan-400 font-extrabold border-b border-white/10">
                      TOTAL
                    </th>
                    <th className="sticky top-0 z-20 bg-[oklch(0.16_0.018_260)] min-w-[65px] text-center border-b border-white/10">
                      Ex Meal
                    </th>
                    <th className="sticky top-0 z-20 bg-[oklch(0.16_0.018_260)] min-w-[75px] text-center border-b border-white/10">
                      Need x2!
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((m: any, index: number) => {
                    const rawMeals = m.member?.dailyMeals || m.dailyMeals || [];
                    const mealsByDay: Record<number, number> = {};
                    rawMeals.forEach((dm: any) => {
                      const d = getDayFromDate(dm.date);
                      if (d >= 1 && d <= daysInMonth) {
                        mealsByDay[d] = (mealsByDay[d] || 0) + (Number(dm.totalMeal) || 0);
                      }
                    });

                    return (
                      <tr key={m.member.id} className="hover:bg-white/[0.03] transition-colors group">
                        {/* Sticky SI & Name */}
                        <td className="sticky left-0 z-10 bg-[oklch(0.13_0.016_260)] group-hover:bg-[oklch(0.17_0.022_260)] text-muted-foreground text-center text-xs border-r border-white/10 shadow-[2px_0_4px_rgba(0,0,0,0.25)]">
                          {index + 1}
                        </td>
                        <td className="sticky left-[44px] z-10 bg-[oklch(0.13_0.016_260)] group-hover:bg-[oklch(0.17_0.022_260)] font-semibold text-foreground whitespace-nowrap text-xs border-r border-white/10 shadow-[2px_0_4px_rgba(0,0,0,0.25)]">
                          {m.member.user.name}
                          {m.member.roomNo && (
                            <span className="text-[10px] text-muted-foreground/80 ml-1.5 font-normal">
                              (R{m.member.roomNo})
                            </span>
                          )}
                        </td>
                        {daysArray.map((day) => {
                          const mealVal = mealsByDay[day];
                          const hasMeal = mealVal !== undefined && mealVal > 0;
                          const isTodayCol = isCurrentMonth && day === todayDate;

                          return (
                            <td 
                              key={day} 
                              className={`text-center text-xs px-1 py-1.5 ${
                                isTodayCol ? "bg-cyan-500/10 font-bold text-cyan-300" : ""
                              } ${hasMeal ? "text-foreground font-medium" : "text-muted-foreground/30"}`}
                            >
                              {hasMeal ? mealVal : "—"}
                            </td>
                          );
                        })}
                        <td className="font-extrabold text-foreground text-center text-xs bg-white/[0.02]">
                          {m.totalMeals}
                        </td>
                        <td className="text-center text-xs text-muted-foreground font-medium">
                          {m.totalExtraMeals || 0}
                        </td>
                        <td className="text-center text-xs whitespace-nowrap">
                          {m.isNeedX2 ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              YES
                            </span>
                          ) : (
                            <span className="text-muted-foreground/50 text-[10px] font-semibold">
                              NO
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-white/10 font-bold bg-white/5">
                    <td colSpan={2} className="sticky left-0 z-10 bg-[oklch(0.15_0.018_260)] text-foreground text-xs uppercase tracking-wider font-extrabold border-r border-white/10 shadow-[2px_0_4px_rgba(0,0,0,0.25)]">
                      Daily Total Meals
                    </td>
                    {daysArray.map((day) => {
                      const isTodayCol = isCurrentMonth && day === todayDate;
                      const totalForDay = dayTotals[day] || 0;
                      return (
                        <td 
                          key={day} 
                          className={`text-center text-xs px-1 py-2 font-bold ${
                            isTodayCol ? "bg-cyan-500/15 text-cyan-300" : "text-foreground"
                          }`}
                        >
                          {totalForDay > 0 ? totalForDay : "0"}
                        </td>
                      );
                    })}
                    <td className="text-center text-xs font-black text-cyan-400 bg-cyan-500/10">
                      {data?.totalMessMeals || 
                        filteredMembers.reduce((s: number, m: any) => s + (Number(m.totalMeals) || 0), 0)
                      }
                    </td>
                    <td className="text-center text-xs font-bold text-muted-foreground">
                      {filteredMembers.reduce((s: number, m: any) => s + (Number(m.totalExtraMeals) || 0), 0)}
                    </td>
                    <td className="text-center text-xs text-muted-foreground">
                      {filteredMembers.filter((m: any) => m.isNeedX2).length} x2
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Member Filter Dialog for PDF/Word export - Fully Responsive */}
      <Dialog open={isMemberFilterOpen} onOpenChange={setIsMemberFilterOpen}>
        <DialogContent className="sm:max-w-md w-[95vw] rounded-2xl mx-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Choose Members to Export</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Checked members will be included in the {exportType === 'pdf' ? 'PDF' : 'Word'} file.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-72 overflow-y-auto space-y-1 py-2">
            {data && data.members.map((m: any) => (
              <label key={m.member.id} className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
                <input
                  type="checkbox"
                  checked={selectedExportMembers.has(m.member.id)}
                  onChange={() => toggleExportMember(m.member.id)}
                  className="w-4 h-4 accent-violet-500"
                />
                <span className="text-sm font-medium text-foreground">{m.member.user.name}</span>
                <span className="text-xs text-muted-foreground ml-auto">R{m.member.roomNo}</span>
              </label>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-3 border-t border-white/10">
            <div className="flex justify-center sm:justify-start gap-4">
              <button
                type="button"
                onClick={() => data && setSelectedExportMembers(new Set(data.members.map((m: any) => m.member.id)))}
                className="text-xs text-muted-foreground hover:text-foreground underline cursor-pointer"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={() => setSelectedExportMembers(new Set())}
                className="text-xs text-muted-foreground hover:text-foreground underline cursor-pointer"
              >
                Deselect All
              </button>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsMemberFilterOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" className="btn-glow font-bold" onClick={runExport} disabled={selectedExportMembers.size === 0}>
                Export {exportType === 'pdf' ? 'PDF' : 'Word'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

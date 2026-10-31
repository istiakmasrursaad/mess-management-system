"use client";

import React, { useState } from "react";
import { UserCheck, UtensilsCrossed, Store, TrendingUp, Wallet, AlertCircle, AlertTriangle, BadgeDollarSign, CalendarDays, ChevronRight } from "lucide-react";
import MealCalendarModal from "./MealCalendarModal";

export default function OverviewTab({ props }: { props: any }) {
  const { data } = props;
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const totalCashDepositsWithAdvance = (data.members || []).reduce((sum: number, m: any) => sum + (Number(m.totalDeposits) || 0) + (Number(m.previousAdvance) || 0), 0);
  const totalPendingDues = (data.members || []).reduce((sum: number, m: any) => sum + (Number(m.due) > 0 ? Number(m.due) : 0), 0);
  const totalMemberExpensesExclKhalaManager = (data.members || []).reduce((sum: number, m: any) => {
    const expense = (Number(m.totalCost) || 0) - (Number(m.baseKhala) || 0) - (Number(m.baseManager) || 0);
    return sum + expense;
  }, 0);
  const remainingDepositBalance = totalCashDepositsWithAdvance - totalMemberExpensesExclKhalaManager;

  return (
    <>
      {/* Primary KPI cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">

        {/* Active Members */}
        <div className="rounded-2xl p-4 md:p-5 flex flex-col gap-2 transition-all duration-200 hover:-translate-y-0.5"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Members</span>
            <div className="p-1.5 rounded-lg" style={{ background: "rgba(109,40,217,0.15)" }}>
              <UserCheck className="w-3.5 h-3.5 text-violet-400" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">{data.members.length}</div>
          <div className="text-xs text-slate-500">Full mess enrollment</div>
        </div>

        {/* Total Meals & Total Day Count */}
        <div className="rounded-2xl p-4 md:p-5 flex flex-col justify-between gap-3 transition-all duration-200 hover:-translate-y-0.5"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Meals</span>
              <div className="p-1.5 rounded-lg" style={{ background: "rgba(251,191,36,0.15)" }}>
                <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white mt-1">{data.totalMessMeals}</div>
            <div className="text-xs text-slate-500">Consumed this month</div>
          </div>

          <div className="pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => setIsCalendarOpen(true)}
              title="Click to view days breakdown"
              className="group w-full flex items-center justify-between px-2 sm:px-2.5 py-1.5 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 active:scale-95 border border-amber-400/30 hover:border-amber-400/60 text-amber-300 transition-all cursor-pointer shadow-sm"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <CalendarDays className="w-3.5 h-3.5 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-medium text-slate-300 truncate">Day Count</span>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-1">
                <span className="text-xs font-extrabold text-amber-300">
                  {data.totalDayCount ?? 0} {(data.totalDayCount ?? 0) === 1 ? 'Day' : 'Days'}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-amber-400/80 group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
            </button>
          </div>
        </div>

        {/* Market Expenses */}
        <div className="rounded-2xl p-4 md:p-5 flex flex-col gap-2 transition-all duration-200 hover:-translate-y-0.5"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Market Expenses</span>
            <div className="p-1.5 rounded-lg" style={{ background: "rgba(14,165,233,0.15)" }}>
              <Store className="w-3.5 h-3.5 text-sky-400" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">৳ {data.totalMarketCost.toLocaleString()}</div>
          <div className="text-xs text-slate-500">Grocery &amp; raw materials</div>
        </div>

        {/* Live Meal Rate */}
        <div className="rounded-2xl p-4 md:p-5 flex flex-col gap-2 transition-all duration-200 hover:-translate-y-0.5"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Live Meal Rate</span>
            <div className="p-1.5 rounded-lg" style={{ background: "rgba(16,185,129,0.15)" }}>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">৳ {data.liveMealRate.toFixed(2)}</div>
          <div className="text-xs text-slate-500">Market Cost ÷ Total Meals</div>
        </div>
      </div>

      {/* Secondary Financial Totals */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">

        {/* Total Cash Deposits */}
        <div className="rounded-2xl p-4 md:p-5 flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5"
          style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)", backdropFilter: "blur(12px)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(16,185,129,0.2)" }}>
            <Wallet className="w-4.5 h-4.5 text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Total Cash Deposits</p>
            <div className="text-2xl font-extrabold text-emerald-400">৳ {totalCashDepositsWithAdvance.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-0.5">Includes deposits &amp; previous advances</p>
          </div>
        </div>

        {/* Total Pending Dues */}
        <div className="rounded-2xl p-4 md:p-5 flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5"
          style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", backdropFilter: "blur(12px)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(239,68,68,0.2)" }}>
            <AlertCircle className="w-4.5 h-4.5 text-red-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Total Pending Dues</p>
            <div className="text-2xl font-extrabold text-red-400">৳ {totalPendingDues.toFixed(2)}</div>
            <p className="text-xs text-slate-500 mt-0.5">Sum of all members' dues</p>
          </div>
        </div>

        {/* Remaining Balance (Total Deposits - Expenses Excl. Khala & Manager) */}
        <div className="rounded-2xl p-4 md:p-5 flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5"
          style={{ background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.18)", backdropFilter: "blur(12px)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(14,165,233,0.2)" }}>
            <BadgeDollarSign className="w-4.5 h-4.5 text-sky-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Remaining Balance</p>
            <div className="text-2xl font-extrabold text-sky-400">
              {remainingDepositBalance < 0
                ? `-৳ ${Math.abs(remainingDepositBalance).toFixed(2)}`
                : `৳ ${remainingDepositBalance.toFixed(2)}`}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Total deposits − cost (excl. Khala &amp; Manager bill)</p>
          </div>
        </div>
      </div>

      {/* Member Overview Table */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(12px)" }}>
        <div className="px-5 pt-5 pb-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div>
            <h3 className="text-sm font-bold text-white">Member Quick Summary</h3>
            <p className="text-xs text-slate-500 mt-0.5">Members exceeding {data.settings.needX2MealLimit} extra meals → Need X2 (2× overhead bills)</p>
          </div>
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Member Name</th>
                <th>Total Meals</th>
                <th>Extra Meals</th>
                <th>Status</th>
                <th>Total Cost</th>
                <th title="Deposit (Includes previous advance)">Deposit</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {data.members.map((m: any) => (
                <tr key={m.member.id}>
                  <td className="font-semibold text-white">{m.member.user.name}</td>
                  <td className="font-medium text-slate-300">{m.totalMeals}</td>
                  <td className="font-medium text-slate-300">{m.totalExtraMeals}</td>
                  <td>
                    {m.isNeedX2 ? (
                      <span className="badge-rose flex items-center gap-1 w-fit">
                        <AlertTriangle className="w-3 h-3" /> X2
                      </span>
                    ) : (
                      <span className="badge-emerald">Normal</span>
                    )}
                  </td>
                  <td className="font-bold text-slate-200">৳{m.totalCost.toFixed(2)}</td>
                  <td className="font-medium text-slate-300">
                    {(() => {
                      const depositVal = m.totalDeposits > 0
                        ? m.totalDeposits + m.previousAdvance - m.previousDue
                        : m.previousAdvance;
                      const color = depositVal >= 0 ? '#4ade80' : '#f87171';
                      return (
                        <span style={{ color }}>
                          {depositVal > 0 ? `+৳${depositVal.toFixed(2)}` : depositVal < 0 ? `-৳${Math.abs(depositVal).toFixed(2)}` : '—'}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="font-bold">
                    {m.due > 0 ? (
                      <span className="text-red-400">Due ৳{m.due.toFixed(2)}</span>
                    ) : (
                      <span className="text-emerald-400">+৳{m.advance.toFixed(2)}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Meal Submission Calendar Modal (Soft Blur, No Pitch Blackout) */}
      <MealCalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        selectedMonth={props.selectedMonth || data?.monthYear}
        data={data}
        onSelectDate={(dateStr) => {
          if (props.setSelectedMealDate) {
            props.setSelectedMealDate(dateStr);
          }
          if (props.fetchDailyMeals) {
            props.fetchDailyMeals(dateStr);
          }
          if (props.setActiveTab) {
            props.setActiveTab("dailymeals");
          }
          setIsCalendarOpen(false);
        }}
      />
    </>
  );
}


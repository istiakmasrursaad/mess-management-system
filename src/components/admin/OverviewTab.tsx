"use client";

import React from "react";
import { Users, Utensils, ShoppingCart, TrendingUp, Wallet, AlertCircle, ChevronUp, AlertTriangle } from "lucide-react";

export default function OverviewTab({ props }: { props: any }) {
  const { data } = props;

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
              <Users className="w-3.5 h-3.5 text-violet-400" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">{data.members.length}</div>
          <div className="text-xs text-slate-500">Full mess enrollment</div>
        </div>

        {/* Total Meals */}
        <div className="rounded-2xl p-4 md:p-5 flex flex-col gap-2 transition-all duration-200 hover:-translate-y-0.5"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Meals</span>
            <div className="p-1.5 rounded-lg" style={{ background: "rgba(251,191,36,0.15)" }}>
              <Utensils className="w-3.5 h-3.5 text-amber-400" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">{data.totalMessMeals}</div>
          <div className="text-xs text-slate-500">Consumed this month</div>
        </div>

        {/* Market Expenses */}
        <div className="rounded-2xl p-4 md:p-5 flex flex-col gap-2 transition-all duration-200 hover:-translate-y-0.5"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Market Expenses</span>
            <div className="p-1.5 rounded-lg" style={{ background: "rgba(14,165,233,0.15)" }}>
              <ShoppingCart className="w-3.5 h-3.5 text-sky-400" />
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
            <div className="text-2xl font-extrabold text-emerald-400">৳ {data.grandTotalDeposits.toLocaleString()}</div>
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
            <div className="text-2xl font-extrabold text-red-400">৳ {data.grandTotalDues.toFixed(2)}</div>
          </div>
        </div>

        {/* Total Excess Advances */}
        <div className="rounded-2xl p-4 md:p-5 flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5"
          style={{ background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.15)", backdropFilter: "blur(12px)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(14,165,233,0.2)" }}>
            <ChevronUp className="w-4.5 h-4.5 text-sky-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Total Excess Advances</p>
            <div className="text-2xl font-extrabold text-sky-400">৳ {data.grandTotalAdvances.toFixed(2)}</div>
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
                <th>Room</th>
                <th>Total Meals</th>
                <th>Extra Meals</th>
                <th>Status</th>
                <th>Deposits</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {data.members.map((m: any) => (
                <tr key={m.member.id}>
                  <td className="font-semibold text-white">{m.member.user.name}</td>
                  <td><span className="badge-indigo">{m.member.roomNo}</span></td>
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
                  <td className="font-medium text-slate-300">৳ {m.totalDeposits}</td>
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
    </>
  );
}


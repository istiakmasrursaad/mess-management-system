"use client";

import { useState, useEffect } from "react";
import { getMessData, toggleDailyMeal } from "@/app/actions/mess";
import { logoutAction, getSession } from "@/app/actions/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw, Utensils, AlertTriangle, Clock, LogOut,
  Leaf, TrendingUp, Wallet, CreditCard, ChevronRight,
  CalendarDays, Flame, ShieldCheck
} from "lucide-react";
import { toast } from "react-toastify";

export default function MemberDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [breakfast, setBreakfast] = useState<number | string>(0);
  const [lunch, setLunch] = useState<number | string>(0);
  const [dinner, setDinner] = useState<number | string>(0);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [res, session] = await Promise.all([getMessData(), getSession()]);
    setData(res);
    if (session?.userId) setSessionUserId(session.userId);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmitMeals = async () => {
    const numBreakfast = Number(breakfast) || 0;
    const numLunch = Number(lunch) || 0;
    const numDinner = Number(dinner) || 0;

    const memberObj = data?.members.find((m: any) => m.member.userId === sessionUserId) || data?.members[0];
    if (!memberObj) return;

    setSubmitting(true);
    const formData = new FormData();
    formData.append("memberId", memberObj.member.id);
    formData.append("breakfast", numBreakfast.toString());
    formData.append("lunchDinner", (numLunch + numDinner).toString());

    const result = await toggleDailyMeal(formData);
    setSubmitting(false);

    if (result.isPastCutoff) {
      toast.warning("Past cutoff time — changes will apply for the next day.");
    } else {
      toast.success("Tomorrow's meals submitted successfully ✓");
    }
    await fetchData();
  };

  if (loading || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)" }}>
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: "linear-gradient(135deg, #6d28d9, #0ea5e9)" }}>
            <RefreshCw className="h-8 w-8 animate-spin text-white" />
          </div>
        </div>
        <p className="text-slate-400 font-medium text-base">Loading your portal...</p>
      </div>
    );
  }

  const currentAccount = data.members.find((m: any) => m.member.userId === sessionUserId) || data.members[0];
  const deposits = currentAccount?.member?.deposits ?? [];
  const sortedDeposits = [...deposits].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const extraMeals = currentAccount.totalExtraMeals?.toFixed(2) ?? "0";
  const isX2 = currentAccount.isNeedX2;
  const netStatus = currentAccount.due > 0
    ? { label: "Due", amount: currentAccount.due, color: "#ef4444", bg: "rgba(239,68,68,0.1)" }
    : { label: "Advance", amount: currentAccount.advance, color: "#10b981", bg: "rgba(16,185,129,0.1)" };

  return (
    <div className="flex-1 min-h-screen"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #0f172a 100%)" }}>
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto w-full pb-12">

        {/* ── Header ── */}
        <div className="relative overflow-hidden rounded-2xl p-6 md:p-7"
          style={{
            background: "linear-gradient(135deg, rgba(109,40,217,0.35) 0%, rgba(14,165,233,0.25) 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(20px)"
          }}>
          {/* glow */}
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-20 blur-3xl pointer-events-none"
            style={{ background: "radial-gradient(circle, #6d28d9, transparent 70%)" }} />

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <div className="p-2 rounded-xl" style={{ background: "rgba(255,255,255,0.1)" }}>
                  <Leaf className="h-5 w-5 text-violet-300" />
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                  Member Portal
                </h1>
                <Badge className="text-xs px-2.5 py-0.5"
                  style={{ background: "rgba(109,40,217,0.4)", color: "#c4b5fd", border: "1px solid rgba(109,40,217,0.5)" }}>
                  Active
                </Badge>
              </div>
              <p className="text-slate-400 text-sm font-medium">
                Welcome back,{" "}
                <span className="text-white font-bold">{currentAccount.member.user.name}</span>
                {currentAccount.member.roomNo && (
                  <span className="text-slate-400"> · Room {currentAccount.member.roomNo}</span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchData}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-300 transition-all duration-200 hover:text-white"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
              <button
                onClick={async () => { await logoutAction(); window.location.href = "/"; }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5" }}>
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* ── 4 Stat Cards ── */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">

          {/* Total Meals */}
          <div className="rounded-2xl p-4 md:p-5 flex flex-col gap-2"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Meals</span>
              <div className="p-1.5 rounded-lg" style={{ background: "rgba(16,185,129,0.15)" }}>
                <Utensils className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white">{currentAccount.totalMeals}</div>
            <div className="text-xs text-slate-500">Total meals this month</div>
          </div>

          {/* Extra Meals */}
          <div className="rounded-2xl p-4 md:p-5 flex flex-col gap-2"
            style={{
              background: isX2 ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.04)",
              border: isX2 ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(12px)"
            }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Extra Meals</span>
              <div className="p-1.5 rounded-lg" style={{ background: isX2 ? "rgba(239,68,68,0.2)" : "rgba(251,191,36,0.15)" }}>
                <Flame className={`w-3.5 h-3.5 ${isX2 ? "text-red-400" : "text-amber-400"}`} />
              </div>
            </div>
            <div className={`text-3xl font-extrabold ${isX2 ? "text-red-400" : "text-white"}`}>{extraMeals}</div>
            {isX2 ? (
              <div className="flex items-center gap-1 text-xs text-red-400 font-semibold">
                <AlertTriangle className="w-3 h-3" /> Double billing active!
              </div>
            ) : (
              <div className="text-xs text-slate-500">Limit: {data.settings.needX2MealLimit} meals</div>
            )}
          </div>

          {/* Net Status */}
          <div className="rounded-2xl p-4 md:p-5 flex flex-col gap-2"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Balance</span>
              <div className="p-1.5 rounded-lg" style={{ background: `${netStatus.bg}` }}>
                <Wallet className="w-3.5 h-3.5" style={{ color: netStatus.color }} />
              </div>
            </div>
            <div className="text-2xl font-extrabold" style={{ color: netStatus.color }}>
              ৳ {netStatus.amount.toFixed(0)}
            </div>
            <div className="text-xs font-semibold" style={{ color: netStatus.color }}>
              {netStatus.label === "Due" ? "Amount owed" : "Paid in advance"}
            </div>
          </div>

          {/* Meal Rate */}
          <div className="rounded-2xl p-4 md:p-5 flex flex-col gap-2"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Meal Rate</span>
              <div className="p-1.5 rounded-lg" style={{ background: "rgba(14,165,233,0.15)" }}>
                <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-white">৳ {data.liveMealRate.toFixed(2)}</div>
            <div className="text-xs text-slate-500">Per meal rate (live)</div>
          </div>
        </div>

        {/* ── Main 2-col grid ── */}
        <div className="grid gap-5 grid-cols-1 lg:grid-cols-2">

          {/* ── Meal Submission Card ── */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="px-5 pt-5 pb-4 flex items-center justify-between"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="p-1.5 rounded-lg" style={{ background: "linear-gradient(135deg, #059669, #0ea5e9)" }}>
                    <Utensils className="w-3.5 h-3.5 text-white" />
                  </div>
                  <h2 className="text-base font-bold text-white">Tomorrow's Meals</h2>
                </div>
                <p className="text-xs text-slate-500 ml-8">Submit before the daily cutoff</p>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                style={{ background: "rgba(16,185,129,0.1)", color: "#34d399", border: "1px solid rgba(16,185,129,0.2)" }}>
                <Clock className="w-3 h-3" /> {data.settings.mealCutoffTime}
              </div>
            </div>

            <div className="p-5 space-y-3">
              {[
                { label: "Breakfast", emoji: "🍳", value: breakfast, setter: setBreakfast },
                { label: "Lunch", emoji: "🍱", value: lunch, setter: setLunch },
                { label: "Dinner", emoji: "🍛", value: dinner, setter: setDinner },
              ].map(({ label, emoji, value, setter }) => (
                <div key={label}
                  className="flex items-center justify-between p-3.5 rounded-xl transition-all duration-150"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <span className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                    <span className="text-base">{emoji}</span>{label}
                  </span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    className="w-20 h-9 rounded-lg px-3 text-sm font-bold text-white text-center outline-none focus:ring-2 transition-all"
                    style={{
                      background: "rgba(255,255,255,0.07)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      // @ts-ignore
                      "--tw-ring-color": "#6d28d9"
                    }}
                  />
                </div>
              ))}

              <button
                onClick={handleSubmitMeals}
                disabled={submitting}
                className="w-full mt-2 py-3 rounded-xl font-bold text-sm text-white transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #6d28d9, #0ea5e9)" }}>
                {submitting ? <><RefreshCw className="w-4 h-4 animate-spin" /> Submitting...</> : <>Submit <ChevronRight className="w-4 h-4" /></>}
              </button>
            </div>
          </div>

          {/* ── Deposits Card ── */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="px-5 pt-5 pb-4 flex items-center justify-between"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="p-1.5 rounded-lg" style={{ background: "linear-gradient(135deg, #059669, #10b981)" }}>
                    <CreditCard className="w-3.5 h-3.5 text-white" />
                  </div>
                  <h2 className="text-base font-bold text-white">My Deposits</h2>
                </div>
                <p className="text-xs text-slate-500 ml-8">Deposit history this month</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500 mb-0.5">Total Deposited</div>
                <div className="text-lg font-extrabold text-emerald-400">
                  ৳ {currentAccount.totalDeposits.toFixed(0)}
                </div>
              </div>
            </div>

            <div className="p-5">
              {sortedDeposits.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                    style={{ background: "rgba(255,255,255,0.05)" }}>
                    <CreditCard className="w-5 h-5 text-slate-500" />
                  </div>
                  <p className="text-slate-500 text-sm">No deposits recorded this month</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                  {sortedDeposits.map((dep: any, idx: number) => {
                    const d = new Date(dep.date);
                    const dayStr = d.toLocaleDateString("bn-BD", { day: "numeric", month: "short" });
                    const yearStr = d.getFullYear();
                    return (
                      <div key={dep.id || idx}
                        className="flex items-center justify-between p-3 rounded-xl"
                        style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.12)" }}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: "rgba(16,185,129,0.15)" }}>
                            <CalendarDays className="w-3.5 h-3.5 text-emerald-400" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-300">{dayStr}, {yearStr}</div>
                            {dep.note && <div className="text-xs text-slate-500 truncate max-w-[130px]">{dep.note}</div>}
                          </div>
                        </div>
                        <div className="text-emerald-400 font-bold text-sm">+ ৳ {dep.amount.toFixed(0)}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Financial Statement ── */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="px-6 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="p-1.5 rounded-lg" style={{ background: "linear-gradient(135deg, #6d28d9, #0ea5e9)" }}>
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
              </div>
              <h2 className="text-base font-bold text-white">Monthly Statement</h2>
            </div>
            <p className="text-xs text-slate-500 ml-8">
              Meal rate: ৳ {data.liveMealRate.toFixed(2)} / meal
            </p>
          </div>

          <div className="p-6 space-y-0 text-sm">
            {/* Meal cost */}
            <div className="flex justify-between items-center py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <span className="text-slate-400">
                Meal Cost ({currentAccount.totalMeals} × ৳{data.liveMealRate.toFixed(2)})
              </span>
              <span className="font-semibold text-white">৳ {currentAccount.individualMealCost.toFixed(2)}</span>
            </div>

            {/* Overheads */}
            <div className="py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <p className="text-slate-400 font-medium mb-2.5">Overheads</p>
              <div className="space-y-2 pl-3">
                {[
                  { label: `Khala Bill${currentAccount.M_X2 > 1 ? ` (×${currentAccount.M_X2})` : ""}`, val: (currentAccount.baseKhala * currentAccount.M_X2) },
                  { label: `Manager Bill${currentAccount.M_X2 > 1 ? ` (×${currentAccount.M_X2})` : ""}`, val: (currentAccount.baseManager * currentAccount.M_X2) },
                  { label: `Gas Bill${currentAccount.M_X2 > 1 ? ` (×${currentAccount.M_X2})` : ""}`, val: (currentAccount.baseGas * currentAccount.M_X2) },
                  { label: "Paper Bill", val: currentAccount.paper },
                  { label: "Current Bill", val: currentAccount.current },
                  { label: "Festival Bill", val: currentAccount.festival },
                ].map(({ label, val }) => val > 0 && (
                  <div key={label} className="flex justify-between">
                    <span className="text-slate-500 text-xs">{label}</span>
                    <span className="text-slate-300 text-xs font-medium">৳ {val.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Market Fine */}
            <div className="flex justify-between items-center py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <span className="text-slate-400">Market Fine (Logged: {currentAccount.totalMarketsCount})</span>
              <span className={`font-semibold ${currentAccount.marketFine > 0 ? "text-red-400" : "text-slate-300"}`}>
                ৳ {currentAccount.marketFine}
              </span>
            </div>

            {/* Total Cost */}
            <div className="flex justify-between items-center py-3.5 -mx-6 px-6 font-bold text-base"
              style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <span className="text-white">Total Monthly Cost</span>
              <span className="text-white">৳ {currentAccount.totalCost.toFixed(2)}</span>
            </div>

            {/* Deposits */}
            <div className="flex justify-between items-center py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <span className="text-emerald-400 font-semibold">Total Deposits Paid</span>
              <span className="text-emerald-400 font-semibold">− ৳ {currentAccount.totalDeposits.toFixed(2)}</span>
            </div>

            {/* Prior balance */}
            {(currentAccount.previousDue > 0 || currentAccount.previousAdvance > 0) && (
              <div className="flex justify-between items-center py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <span className="text-slate-400">
                  {currentAccount.previousDue > 0 ? "Previous Due" : "Previous Advance"}
                </span>
                <span className={`font-semibold ${currentAccount.previousDue > 0 ? "text-red-400" : "text-emerald-400"}`}>
                  {currentAccount.previousDue > 0
                    ? `+ ৳ ${currentAccount.previousDue.toFixed(2)}`
                    : `− ৳ ${currentAccount.previousAdvance.toFixed(2)}`}
                </span>
              </div>
            )}

            {/* Net result */}
            <div className="flex justify-between items-center py-4 -mx-6 px-6 rounded-b-2xl mt-1 text-lg font-extrabold"
              style={{ background: currentAccount.due > 0 ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)" }}>
              <span className="text-white">Net Balance</span>
              <span style={{ color: currentAccount.due > 0 ? "#f87171" : "#34d399" }}>
                {currentAccount.due > 0
                  ? `DUE ৳ ${currentAccount.due.toFixed(2)}`
                  : `ADVANCE ৳ ${currentAccount.advance.toFixed(2)}`}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

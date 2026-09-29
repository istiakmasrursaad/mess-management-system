"use client";

import React from "react";
import { Table } from "@/components/ui/table";
import { AlertTriangle } from "lucide-react";


export default function OverviewTab({ props }: { props: any }) {
  const { data } = props;

  return (
    <>
      {/* Primary KPI cards */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <div className="stat-card stat-card-indigo card-hover">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Active Members</p>
                <div className="text-3xl font-extrabold" style={{ color: 'oklch(0.72 0.22 275)' }}>{data.members.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Full mess enrollment</p>
              </div>
              <div className="stat-card stat-card-amber card-hover">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Total Meals</p>
                <div className="text-3xl font-extrabold" style={{ color: 'oklch(0.78 0.18 80)' }}>{data.totalMessMeals}</div>
                <p className="text-xs text-muted-foreground mt-1">Consumed this month</p>
              </div>
              <div className="stat-card stat-card-cyan card-hover">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Market Expenses</p>
                <div className="text-3xl font-extrabold" style={{ color: 'oklch(0.72 0.18 200)' }}>৳ {data.totalMarketCost.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">Grocery & raw materials</p>
              </div>
              <div className="stat-card stat-card-emerald card-hover">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Live Meal Rate</p>
                <div className="text-3xl font-extrabold" style={{ color: 'oklch(0.70 0.19 162)' }}>৳ {data.liveMealRate.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">Market Cost ÷ Total Meals</p>
              </div>
            </div>

            {/* Secondary Financial Totals */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
              <div className="stat-card card-hover">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Total Cash Deposits</p>
                <div className="text-2xl font-bold" style={{ color: 'oklch(0.70 0.19 162)' }}>৳ {data.grandTotalDeposits.toLocaleString()}</div>
              </div>
              <div className="stat-card card-hover">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Total Pending Dues</p>
                <div className="text-2xl font-bold" style={{ color: 'oklch(0.65 0.24 27)' }}>৳ {data.grandTotalDues.toFixed(2)}</div>
              </div>
              <div className="stat-card card-hover">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Total Excess Advances</p>
                <div className="text-2xl font-bold" style={{ color: 'oklch(0.72 0.18 200)' }}>৳ {data.grandTotalAdvances.toFixed(2)}</div>
              </div>
            </div>

            {/* Member Overview Table */}
            <div className="section-panel">
              <div className="section-panel-header">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Member Quick Summary</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Members exceeding {data.settings.needX2MealLimit} extra meals → Need X2 (2× overhead bills)</p>
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
                        <td className="font-semibold text-foreground">{m.member.user.name}</td>
                        <td><span className="badge-indigo">{m.member.roomNo}</span></td>
                        <td className="font-medium">{m.totalMeals}</td>
                        <td className="font-medium">{m.totalExtraMeals}</td>
                        <td>
                          {m.isNeedX2 ? (
                            <span className="badge-rose flex items-center gap-1 w-fit">
                              <AlertTriangle className="w-3 h-3" /> X2
                            </span>
                          ) : (
                            <span className="badge-emerald">Normal</span>
                          )}
                        </td>
                        <td className="font-medium">৳ {m.totalDeposits}</td>
                        <td className="font-bold">
                          {m.due > 0 ? (
                            <span style={{ color: 'oklch(0.68 0.22 27)' }}>Due ৳{m.due.toFixed(2)}</span>
                          ) : (
                            <span style={{ color: 'oklch(0.70 0.19 162)' }}>+৳{m.advance.toFixed(2)}</span>
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

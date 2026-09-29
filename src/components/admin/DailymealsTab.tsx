"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Utensils, RefreshCw } from "lucide-react";


export default function DailymealsTab({ props }: { props: any }) {
  const { data, loading, selectedMealDate, dailyMealsData, mealInputValues, setMealInputValues, loadingDailyMeals, isSavingMeals, handleMealDateChange, handleSaveAllMeals } = props;

  return (
    <>
      <div className="section-panel">
              <div className="section-panel-header">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Daily Meals Management</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Add or override daily meals for all members.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="mealDate" className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Date:</Label>
                  <Input id="mealDate" type="date" value={selectedMealDate} onChange={handleMealDateChange}
                    className="h-9 rounded-xl bg-white/5 border-white/10 text-foreground w-36 text-sm" />
                </div>
              </div>
              {loadingDailyMeals ? (
                <div className="flex justify-center p-8">
                  <RefreshCw className="h-7 w-7 animate-spin" style={{ color: 'oklch(0.65 0.25 275)' }} />
                </div>
              ) : (
                <>
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead><tr><th>Member Name</th><th>Total Meal</th><th>Room</th><th>Status</th></tr></thead>
                      <tbody>
                        {dailyMealsData.map((m: any) => {
                          const hasSubmitted = !!m.mealRecord;
                          const val = mealInputValues[m.memberId] !== undefined ? mealInputValues[m.memberId] : (hasSubmitted ? m.mealRecord.totalMeal : 0);
                          return (
                            <tr key={m.memberId}>
                              <td className="font-semibold text-foreground">{m.name}</td>
                               <td className="py-3">
                                 <div className="flex items-center gap-2 flex-wrap">
                                   <div className="flex items-center gap-1">
                                     <button type="button" onClick={() => setMealInputValues((prev: any) => ({ ...prev, [m.memberId]: Math.max(0, (prev[m.memberId] !== undefined ? prev[m.memberId] : val) - 0.5) }))} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 font-extrabold text-sm flex items-center justify-center text-foreground cursor-pointer">-</button>
                                     <Input type="number" step="0.5" value={val}
                                       onChange={(e) => { const v = parseFloat(e.target.value) || 0; setMealInputValues((prev: any) => ({ ...prev, [m.memberId]: v })); }}
                                       id={`meal-${m.memberId}`}
                                       className="w-16 h-8 text-center px-1 rounded-lg bg-white/5 border-white/10 text-foreground font-bold text-sm" />
                                     <button type="button" onClick={() => setMealInputValues((prev: any) => ({ ...prev, [m.memberId]: (prev[m.memberId] !== undefined ? prev[m.memberId] : val) + 0.5 }))} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 font-extrabold text-sm flex items-center justify-center text-foreground cursor-pointer">+</button>
                                   </div>
                                   <div className="flex items-center gap-1 flex-wrap">
                                     {[0, 1, 1.5, 2, 2.5].map((preset) => (
                                       <button key={preset} type="button" onClick={() => setMealInputValues((prev: any) => ({ ...prev, [m.memberId]: preset }))} className={`px-2 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${val === preset ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10'}`}>{preset}</button>
                                     ))}
                                   </div>
                                 </div>
                               </td>
                               <td><span className="badge-indigo">{m.roomNo}</span></td>
                               <td>{hasSubmitted ? <span className="badge-emerald">Submitted</span> : <span className="badge-amber">Pending</span>}</td>
                             </tr>
                           );
                         })}
                       </tbody>
                     </table>
                   </div>
                   <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-t" style={{ borderColor: 'oklch(1 0 0 / 7%)' }}>
                     <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold" style={{ background: 'oklch(0.65 0.25 275 / 10%)', border: '1px solid oklch(0.65 0.25 275 / 20%)', color: 'oklch(0.75 0.20 275)' }}>
                       <Utensils className="w-4 h-4" />
                       <span>Total Day Meals:</span>
                       <span className="text-base font-extrabold">{Object.values(mealInputValues).reduce((sum: number, v: any) => sum + (Number(v) || 0), 0)}</span>
                     </div>
                     <Button onClick={handleSaveAllMeals} disabled={isSavingMeals} className="btn-glow font-bold h-10 px-6 rounded-xl text-sm">
                       {isSavingMeals ? "Saving Meals..." : "Save All Meals"}
                     </Button>
                   </div>
                </>
              )}
            </div>
    </>
  );
}

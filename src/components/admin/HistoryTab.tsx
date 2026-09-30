"use client";
import { getDiningCalc } from "@/app/actions/dining-calc";

import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FileText, History, Trash2 } from "lucide-react";


export default function HistoryTab({ props }: { props: any }) {
  const { snapshots, handleDeleteSnapshot, generateWordForData, exportSnapshotToPDF } = props;

  return (
    <>
      <div className="section-panel">
              <div className="section-panel-header">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4" style={{ color: 'oklch(0.65 0.25 275)' }} />
                  <div><h3 className="text-sm font-bold text-foreground">Archived Months History</h3><p className="text-xs text-muted-foreground mt-0.5">Permanent finalized records — read-only.</p></div>
                </div>
              </div>
              <div className="p-4">
                {snapshots.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <History className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium">No months finalized yet.</p>
                    <p className="text-xs mt-1">Go to Ledger → click "Finalize &amp; Save"</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {snapshots.map((snap: any) => (
                      <div key={snap.id} className="rounded-xl overflow-hidden" style={{ border: '1px solid oklch(1 0 0 / 8%)' }}>
                        <div className="flex flex-wrap justify-between items-center gap-4 p-4" style={{ background: 'oklch(0.65 0.25 275 / 7%)' }}>
                          <div>
                            <h3 className="text-sm font-bold text-foreground">{snap.monthLabel}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">Finalized: {new Date(snap.finalizedAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Meal Rate</p>
                              <p className="font-bold text-sm" style={{ color: 'oklch(0.72 0.18 200)' }}>৳ {snap.liveMealRate.toFixed(2)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Market Total</p>
                              <p className="font-bold text-sm" style={{ color: 'oklch(0.70 0.19 162)' }}>৳ {snap.totalMarketCost.toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" onClick={() => exportSnapshotToPDF(snap)} className="btn-glow h-8 px-3 text-xs rounded-lg gap-1.5">
                                <FileText className="w-3.5 h-3.5" /> PDF
                              </Button>
                              <Button size="sm" variant="ghost" onClick={async () => { const dd = await getDiningCalc(snap.monthYear); const snapData = { totalMessMeals: snap.totalMessMeals, totalMarketCost: snap.totalMarketCost, liveMealRate: snap.liveMealRate, members: snap.memberSnapshots.map((ms: any) => ({ member: { user: { name: ms.memberName }, roomNo: '' }, totalMeals: ms.totalMeals, individualMealCost: ms.individualMealCost, baseKhala: 0, M_X2: 1, baseManager: 0, paper: 0, current: 0, baseGas: 0, festival: 0, marketFine: 0, adjustedOverheads: ms.adjustedOverheads, totalCost: ms.totalCost, totalDeposits: ms.totalDeposits, due: ms.due, advance: ms.advance })) }; generateWordForData(snapData, snap.monthLabel, true, dd); }} className="h-8 px-2.5 text-xs rounded-lg gap-1 text-muted-foreground hover:text-foreground hover:bg-white/5">
                                <FileText className="w-3.5 h-3.5" style={{ color: 'oklch(0.55 0.26 278)' }} /> Word
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDeleteSnapshot(snap.id, snap.monthLabel)} className="h-8 px-2.5 text-xs rounded-lg gap-1">
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
    </>
  );
}

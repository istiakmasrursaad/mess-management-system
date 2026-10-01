"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { FileText, Lock } from "lucide-react";
import { DiningCalcCard } from "@/components/DiningCalcCard";


export default function LedgerTab({ props }: { props: any }) {
  const { data, selectedMonth, isFinalizing, isMemberFilterOpen, setIsMemberFilterOpen, exportType, selectedExportMembers, setSelectedExportMembers, handleFinalizeMonth, toggleExportMember, runExport, exportToPDF, exportToWord, exportDailyMealsPDF } = props;

  return (
    <>
      <DiningCalcCard selectedMonth={selectedMonth} />
            <div className="section-panel">
              <div className="section-panel-header">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Monthly Master Audit Ledger</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Complete breakdown of meals, overheads, deposits, and net balance.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button onClick={handleFinalizeMonth} disabled={isFinalizing} size="sm"
                    className="btn-glow h-9 px-3 text-xs font-bold gap-2 rounded-xl">
                    <Lock className="w-3.5 h-3.5" />{isFinalizing ? "Saving..." : "Finalize & Save"}
                  </Button>
                  <div className="flex items-center gap-1.5">
                    <Button size="sm" variant="ghost" onClick={exportToPDF} className="h-8 px-2.5 text-xs rounded-lg gap-1 text-muted-foreground hover:text-foreground hover:bg-white/5">
                      <FileText className="w-3.5 h-3.5" style={{ color: 'oklch(0.68 0.22 27)' }} /> PDF
                    </Button>
                    <Button size="sm" variant="ghost" onClick={exportToWord} className="h-8 px-2.5 text-xs rounded-lg gap-1 text-muted-foreground hover:text-foreground hover:bg-white/5">
                      <FileText className="w-3.5 h-3.5" style={{ color: 'oklch(0.55 0.26 278)' }} /> Word
                    </Button>
                    <Button size="sm" variant="ghost" onClick={exportDailyMealsPDF} className="h-8 px-2.5 text-xs rounded-lg gap-1 text-muted-foreground hover:text-foreground hover:bg-white/5">
                      <FileText className="w-3.5 h-3.5" /> Meals PDF
                    </Button>
                  </div>
                </div>
              </div>
              <div className="table-responsive">
                <table className="data-table">
                  <thead><tr>
                    <th>SI</th><th>Name</th><th>Meals</th><th>Meal Cost</th>
                    <th>Khala</th><th>Manager</th><th>Paper</th><th>Current</th><th>Gas</th><th>Fest</th><th>Fine</th>
                    <th>Total Cost</th><th>Deposit</th><th>Due</th><th>Advance</th>
                  </tr></thead>
                  <tbody>
                    {data.members.map((m: any, index: number) => (
                      <tr key={m.member.id}>
                        <td className="text-muted-foreground">{index + 1}</td>
                        <td className="font-semibold text-foreground whitespace-nowrap">{m.member.user.name}</td>
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
                        <td className="font-bold" style={{ color: 'oklch(0.70 0.19 162)' }}>৳{m.totalDeposits.toFixed(2)}</td>
                        <td className="font-extrabold" style={{ color: m.due > 0 ? 'oklch(0.68 0.22 27)' : 'oklch(0.45 0.02 260)' }}>{m.due > 0 ? `৳${m.due.toFixed(2)}` : "—"}</td>
                        <td className="font-extrabold" style={{ color: m.advance > 0 ? 'oklch(0.70 0.19 162)' : 'oklch(0.45 0.02 260)' }}>{m.advance > 0 ? `৳${m.advance.toFixed(2)}` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Member Filter Dialog for PDF/Word export */}
            <Dialog open={isMemberFilterOpen} onOpenChange={setIsMemberFilterOpen}>
              <DialogContent className="sm:max-w-md rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Choose Members to Export</DialogTitle>
                  <DialogDescription className="text-muted-foreground">Checked members will be included in the {exportType === 'pdf' ? 'PDF' : 'Word'} file.</DialogDescription>
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
                <div className="flex justify-between items-center pt-3 border-t border-white/10">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => data && setSelectedExportMembers(new Set(data.members.map((m: any) => m.member.id)))}
                      className="text-xs text-muted-foreground hover:text-foreground underline"
                    >Select All</button>
                    <button
                      type="button"
                      onClick={() => setSelectedExportMembers(new Set())}
                      className="text-xs text-muted-foreground hover:text-foreground underline"
                    >Deselect All</button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsMemberFilterOpen(false)}>Cancel</Button>
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

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Settings2, RotateCcw } from "lucide-react";
import { saveBillOverrides } from "@/app/actions/mess";
import { toast } from "react-toastify";

export default function OverheadsTab({ props }: { props: any }) {
  const { data, handleSaveFineOverride, handleRevertFineOverride } = props;

  const [savingFineId, setSavingFineId] = useState<string | null>(null);
  const [revertingFineId, setRevertingFineId] = useState<string | null>(null);
  
  const [editingMember, setEditingMember] = useState<any>(null);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [isSavingOverrides, setIsSavingOverrides] = useState(false);

  const handleOpenOverrideModal = (memberData: any) => {
    setEditingMember(memberData);
    setIsOverrideModalOpen(true);
  };

  const submitOverrides = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingMember) return;
    setIsSavingOverrides(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      formData.append("memberId", editingMember.member.id);
      formData.append("monthYear", data.monthYear || "08-2026");
      
      await saveBillOverrides(formData);
      toast.success("Bill overrides saved successfully");
      setIsOverrideModalOpen(false);
      
      // refresh data silently
      if (props.fetchData) {
        await props.fetchData(undefined, false, true);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save overrides");
    } finally {
      setIsSavingOverrides(false);
    }
  };

  return (
    <>
      <div className="section-panel">
        <div className="section-panel-header">
          <div>
            <h3 className="text-sm font-bold text-foreground">Overhead Bills &amp; Auto Market Fine</h3>
            <p className="text-xs text-muted-foreground mt-0.5">0 markets → Auto Fine {data.settings.defaultMarketFine} Tk · ≥1 market → 0 Tk</p>
          </div>
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Member</th>
                <th className="hidden sm:table-cell">Markets</th>
                <th>Fine</th>
                <th>Fine Override</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.members.map((m: any) => (
                <tr key={m.member.id}>
                  <td className="font-semibold text-foreground">
                    <div>{m.member.user.name}</div>
                    {(m.isKhalaOverridden || m.isManagerOverridden || m.isGasOverridden || m.isPaperOverridden || m.isCurrentOverridden || m.isFestivalOverridden) && (
                      <span className="inline-block mt-1 text-[9px] text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded border border-red-400/20">
                        Overrides Active
                      </span>
                    )}
                  </td>
                  <td className="hidden sm:table-cell font-medium">{m.totalMarketsCount}</td>
                  <td className="font-bold">
                    <span style={{ color: 'oklch(0.68 0.22 27)' }}>৳ {m.marketFine}</span>
                    {m.isFineOverridden && <span className="text-xs text-muted-foreground ml-1">(Edited)</span>}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Input type="number" defaultValue={m.marketFine} id={`fine-${m.member.id}`} className="w-20 h-8 text-xs rounded-lg bg-white/5 border-white/10 text-foreground" />
                      <Button size="sm" variant="outline" disabled={savingFineId === m.member.id} onClick={async () => { 
                          const input = document.getElementById(`fine-${m.member.id}`) as HTMLInputElement; 
                          if (input && input.value !== "") { 
                            const val = parseFloat(input.value); 
                            if (!isNaN(val)) {
                              setSavingFineId(m.member.id);
                              try {
                                await handleSaveFineOverride(m.member.id, val); 
                              } finally {
                                setSavingFineId(null);
                              }
                            } 
                          } 
                        }} className="h-8 px-2.5 text-xs rounded-lg border-white/10 hover:bg-white/5">{savingFineId === m.member.id ? "..." : "Save"}</Button>
                      {m.isFineOverridden && (
                        <Button size="sm" variant="ghost" disabled={revertingFineId === m.member.id} onClick={async () => {
                          setRevertingFineId(m.member.id);
                          try {
                            await handleRevertFineOverride(m.member.id);
                          } finally {
                            setRevertingFineId(null);
                          }
                        }} className="h-8 px-2.5 text-xs rounded-lg" style={{ color: 'oklch(0.68 0.22 27)' }}>{revertingFineId === m.member.id ? "..." : "Revert"}</Button>
                      )}
                    </div>
                  </td>
                  <td className="text-right">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleOpenOverrideModal(m)}
                      className="h-8 px-2.5 text-xs rounded-lg font-semibold gap-1.5"
                      style={{ border: '1px solid oklch(0.68 0.22 27 / 30%)', color: 'oklch(0.68 0.22 27)', background: 'oklch(0.68 0.22 27 / 10%)' }}
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                      Override Bills
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isOverrideModalOpen} onOpenChange={setIsOverrideModalOpen}>
        <DialogContent className="rounded-2xl mx-4 sm:mx-auto max-w-md">
          <DialogHeader>
            <DialogTitle className="font-bold">Override Global Bills</DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Set custom bill amounts for <strong>{editingMember?.member.user.name}</strong>. 
              Leave an input empty to use the global setting.
            </p>
          </DialogHeader>
          {editingMember && (
            <form onSubmit={submitOverrides} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: "baseKhala", label: "Khala Bill", current: editingMember.baseKhala, isOverride: editingMember.isKhalaOverridden, raw: editingMember.rawBaseKhala },
                  { name: "manager", label: "Manager Bill", current: editingMember.baseManager, isOverride: editingMember.isManagerOverridden, raw: editingMember.rawManager },
                  { name: "gasBill", label: "Gas Bill", current: editingMember.baseGas, isOverride: editingMember.isGasOverridden, raw: editingMember.rawGas },
                  { name: "paper", label: "Paper Bill", current: editingMember.paper, isOverride: editingMember.isPaperOverridden, raw: editingMember.rawPaper },
                  { name: "current", label: "Current Bill", current: editingMember.current, isOverride: editingMember.isCurrentOverridden, raw: editingMember.rawCurrent },
                  { name: "festival", label: "Festival Bill", current: editingMember.festival, isOverride: editingMember.isFestivalOverridden, raw: editingMember.rawFestival },
                ].map((bill) => (
                  <div key={bill.name} className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                      {bill.label}
                      {bill.isOverride && <span className="text-[9px] text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">Overridden</span>}
                    </Label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-2.5 text-xs text-muted-foreground">৳</span>
                        <Input 
                          name={bill.name} 
                          id={`override-input-${bill.name}`}
                          type="number" 
                          step="0.01" 
                          defaultValue={bill.isOverride ? bill.raw : ""} 
                          placeholder={`Global: ${bill.current}`}
                          className="h-10 pl-7 rounded-xl bg-white/5 border-white/10 focus:border-white/25 text-foreground placeholder:text-muted-foreground/50" 
                        />
                      </div>
                      {bill.isOverride && (
                        <Button 
                          type="button" 
                          variant="outline"
                          size="sm"
                          className="h-10 px-2.5 text-xs text-red-400 border-red-400/20 hover:bg-red-400/10 hover:text-red-300 gap-1.5"
                          onClick={() => {
                            const input = document.getElementById(`override-input-${bill.name}`) as HTMLInputElement;
                            if (input) input.value = "";
                          }}
                          title="Revert to global bill amount"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Revert
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 justify-end mt-4">
                <Button type="button" variant="ghost" onClick={() => setIsOverrideModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSavingOverrides} className="h-10 font-bold btn-glow">
                  {isSavingOverrides ? "Saving..." : "Save Overrides"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

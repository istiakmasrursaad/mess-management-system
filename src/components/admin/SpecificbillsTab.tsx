"use client";
import { updateSpecificBill, deleteSpecificBill } from "@/app/actions/mess";
import { toast } from "react-toastify";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Minus, Plus, Users, CheckCircle2, Search, X } from "lucide-react";

export default function SpecificbillsTab({ props }: { props: any }) {
  const { data, isEditSpecificBillDialogOpen, setIsEditSpecificBillDialogOpen, editingMember, setEditingMember, editingBillId, setEditingBillId, editBillCategory, setEditBillCategory, editBillAmount, setEditBillAmount, fetchData, handleAddSpecificBill } = props;
  const [memberCounts, setMemberCounts] = React.useState<Record<string, number>>({});
  const [selectedMemberIds, setSelectedMemberIds] = React.useState<Set<string>>(new Set());
  const [category, setCategory] = React.useState<string>("");
  const [amount, setAmount] = React.useState<string>("");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [isConfirmOpen, setIsConfirmOpen] = React.useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const formRef = React.useRef<HTMLFormElement>(null);
  const isConfirmedRef = React.useRef(false);

  const getCount = (id: string) => memberCounts[id] || 1;

  const toggleMember = (id: string) => {
    setSelectedMemberIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    const allMembers = data?.members || [];
    if (selectedMemberIds.size === allMembers.length) {
      setSelectedMemberIds(new Set());
    } else {
      setSelectedMemberIds(new Set(allMembers.map((m: any) => m.member.id)));
    }
  };

  const filteredMembers = React.useMemo(() => {
    const list = data?.members || [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((m: any) =>
      (m.member.user?.name || "").toLowerCase().includes(q) ||
      String(m.member.roomNo || "").toLowerCase().includes(q)
    );
  }, [data?.members, searchQuery]);

  const selectedMembersList = React.useMemo(() => {
    return (data?.members || []).filter((m: any) => selectedMemberIds.has(m.member.id));
  }, [data?.members, selectedMemberIds]);

  const totalSelectedUnits = React.useMemo(() => {
    return selectedMembersList.reduce((sum: number, m: any) => sum + getCount(m.member.id), 0);
  }, [selectedMembersList, memberCounts]);

  const parsedAmount = parseFloat(amount) || 0;
  const totalCalculated = React.useMemo(() => {
    return selectedMembersList.reduce((sum: number, m: any) => {
      const count = getCount(m.member.id);
      return sum + (parsedAmount * count);
    }, 0);
  }, [selectedMembersList, parsedAmount, memberCounts]);

  const handleOpenConfirm = () => {
    if (selectedMemberIds.size === 0 || totalSelectedUnits === 0) {
      toast.warning("Please select at least one member!");
      return;
    }
    if (!category.trim()) {
      toast.warning("Please select a bill category!");
      return;
    }
    if (!amount || parsedAmount <= 0) {
      toast.warning("Please enter a valid amount!");
      return;
    }
    setIsConfirmOpen(true);
  };

  const handleExecuteSubmit = () => {
    isConfirmedRef.current = true;
    formRef.current?.requestSubmit();
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isConfirmedRef.current) {
      handleOpenConfirm();
      return;
    }
    isConfirmedRef.current = false;
    setIsSubmitting(true);
    try {
      await handleAddSpecificBill(e);
      setMemberCounts({});
      setSelectedMemberIds(new Set());
      setCategory("");
      setAmount("");
      setSearchQuery("");
      setIsConfirmOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to add specific bill");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-1">
          <div className="section-panel h-full">
            <div className="section-panel-header">
              <div>
                <h3 className="text-sm font-bold text-foreground">Add Specific Bill</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Assign a bill to specific members.</p>
              </div>
            </div>
            <div className="p-4">
              <form ref={formRef} onSubmit={handleFormSubmit} className="space-y-3">
                {/* Hidden inputs to guarantee selected members are submitted even if filtered */}
                {Array.from(selectedMemberIds).map(id => (
                  <React.Fragment key={id}>
                    <input type="hidden" name="memberId" value={id} />
                    <input type="hidden" name={`count_${id}`} value={getCount(id)} />
                  </React.Fragment>
                ))}

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Select Members
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                        {totalSelectedUnits} Total {selectedMemberIds.size > 0 ? `(${selectedMemberIds.size} ${selectedMemberIds.size === 1 ? "Member" : "Members"})` : ""}
                      </span>
                      <button
                        type="button"
                        onClick={handleSelectAll}
                        className="text-[11px] font-medium text-sky-400 hover:text-sky-300 underline cursor-pointer"
                      >
                        {data?.members?.length > 0 && selectedMemberIds.size === data.members.length ? "Deselect All" : "Select All"}
                      </button>
                    </div>
                  </div>

                  {/* Quick Search */}
                  {data?.members?.length > 6 && (
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search member or room..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-8 pl-8 pr-7 text-xs rounded-lg bg-black/25 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Members List */}
                  <div className="rounded-xl p-2 max-h-52 overflow-y-auto space-y-1" style={{ background: 'oklch(0.18 0.02 260)', border: '1px solid oklch(1 0 0 / 10%)' }}>
                    {filteredMembers.map((m: any) => {
                      const isSelected = selectedMemberIds.has(m.member.id);
                      return (
                        <div
                          key={m.member.id}
                          onClick={() => toggleMember(m.member.id)}
                          className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer select-none border ${
                            isSelected
                              ? "bg-primary/20 border-primary/40 shadow-sm"
                              : "hover:bg-white/5 border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // handled by parent onClick
                              className="w-4 h-4 rounded cursor-pointer pointer-events-none"
                              style={{ accentColor: 'oklch(0.65 0.25 275)' }}
                            />
                            <span className="text-sm font-medium text-foreground truncate">{m.member.user.name}</span>
                            <span className="text-xs text-muted-foreground shrink-0">R{m.member.roomNo}</span>
                          </div>

                          {/* Multiplier Stepper: crisp visible icons */}
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 bg-black/40 px-1.5 py-0.5 rounded-lg border border-white/10 shrink-0"
                          >
                            <button
                              type="button"
                              className="h-6 w-6 rounded-md flex items-center justify-center bg-white/10 hover:bg-white/20 active:scale-90 text-white border border-white/20 transition-all cursor-pointer shadow-sm"
                              onClick={() => setMemberCounts(p => ({ ...p, [m.member.id]: Math.max(1, getCount(m.member.id) - 1) }))}
                              title="Decrease multiplier"
                            >
                              <Minus className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                            </button>
                            <span className="text-xs font-bold w-4 text-center text-white">{getCount(m.member.id)}</span>
                            <button
                              type="button"
                              className="h-6 w-6 rounded-md flex items-center justify-center bg-white/10 hover:bg-white/20 active:scale-90 text-white border border-white/20 transition-all cursor-pointer shadow-sm"
                              onClick={() => {
                                setMemberCounts(p => ({ ...p, [m.member.id]: getCount(m.member.id) + 1 }));
                                setSelectedMemberIds(prev => new Set(prev).add(m.member.id));
                              }}
                              title="Increase multiplier"
                            >
                              <Plus className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {filteredMembers.length === 0 && (
                      <p className="text-center text-xs text-muted-foreground py-4">No matching members found.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Bill Category</Label>
                  <select
                    name="description"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl text-sm font-medium focus:outline-none"
                    style={{ background: 'oklch(0.18 0.02 260)', border: '1px solid oklch(1 0 0 / 12%)', color: 'oklch(0.93 0.01 260)' }}
                  >
                    <option value="">Select category...</option>
                    {['Khala Bill','Manager Bill','Paper Bill','Current Bill','Gas Bill','Fest Meal','Market Fine','Other'].map(c => (
                      <option key={c} value={c} style={{ background: 'oklch(0.18 0.02 260)' }}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Amount (Tk)</Label>
                  <Input
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="h-10 rounded-xl bg-white/5 border-white/10 text-foreground"
                  />
                </div>

                {/* Live Selection Summary */}
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs">
                  <span className="text-muted-foreground font-medium">Total Selected:</span>
                  <span className="font-bold text-primary flex items-center gap-1.5">
                    <span className="text-sm font-extrabold">{totalSelectedUnits} Total</span>
                    <span className="text-[11px] text-muted-foreground font-semibold">
                      ({selectedMemberIds.size} {selectedMemberIds.size === 1 ? "Member" : "Members"})
                    </span>
                  </span>
                </div>

                {/* Trigger Button - opens Confirmation Modal */}
                <Button
                  type="button"
                  onClick={handleOpenConfirm}
                  disabled={isSubmitting}
                  className="w-full h-10 font-bold btn-glow text-sm gap-1.5 cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  {totalSelectedUnits > 0
                    ? `Review & Add Bill (${totalSelectedUnits} Total Selected)`
                    : "Add Bill to Selected Members"}
                </Button>
              </form>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="section-panel h-full">
            <div className="section-panel-header"><h3 className="text-sm font-bold text-foreground">Recent Specific Bills</h3></div>
            <div className="table-responsive">
              <table className="data-table">
                <thead><tr><th>Member</th><th>Description</th><th>Amount</th><th className="text-right">Edit</th></tr></thead>
                <tbody>
                  {data.members.filter((m: any) => m.member.specificBills && m.member.specificBills.length > 0).map((m: any) => {
                    const totalAmount = m.member.specificBills.reduce((sum: number, bill: any) => sum + parseFloat(bill.amount), 0);
                    const descriptionStr = m.member.specificBills.map((bill: any) => `${bill.description} - ${bill.amount}`).join(", ");
                    return (
                      <tr key={m.member.id}>
                        <td className="font-semibold text-foreground">{m.member.user.name}</td>
                        <td className="max-w-[200px] truncate text-muted-foreground text-xs" title={descriptionStr}>{descriptionStr}</td>
                        <td className="font-bold" style={{ color: 'oklch(0.70 0.19 162)' }}>৳ {totalAmount.toFixed(2)}</td>
                        <td className="text-right"><Button variant="outline" size="sm" onClick={() => { setEditingMember(m.member); setIsEditSpecificBillDialogOpen(true); }} className="h-7 px-2.5 text-xs rounded-lg border-white/10 hover:bg-white/5 text-muted-foreground">Edit</Button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog before Final Submission */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="w-[95vw] sm:w-full sm:max-w-[480px] max-h-[90vh] flex flex-col p-4 sm:p-6 border-white/10 bg-background/95 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
          <DialogHeader className="shrink-0 pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/20 text-primary border border-primary/30">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Confirm Specific Bill
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Verify the selected members and billing breakdown before saving.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
            {/* Quick Summary Cards */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
                <div className="text-muted-foreground text-[11px]">Total Selected (Items)</div>
                <div className="text-sm font-bold text-primary flex items-center gap-1.5">
                  <span className="font-extrabold">{totalSelectedUnits} Total</span>
                  <span className="text-[11px] text-muted-foreground font-normal">
                    ({selectedMemberIds.size} {selectedMemberIds.size === 1 ? "Member" : "Members"})
                  </span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
                <div className="text-muted-foreground text-[11px]">Bill Category</div>
                <div className="text-sm font-bold text-foreground truncate" title={category}>
                  {category}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
                <div className="text-muted-foreground text-[11px]">Rate per Unit</div>
                <div className="text-sm font-bold text-foreground">৳ {parsedAmount.toFixed(2)}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-0.5">
                <div className="text-emerald-300 text-[11px]">Total Estimated Bill</div>
                <div className="text-sm font-bold text-emerald-400">৳ {totalCalculated.toFixed(2)}</div>
              </div>
            </div>

            {/* Selected Members List */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex justify-between">
                <span>Selected Breakdown ({totalSelectedUnits} Items across {selectedMemberIds.size} Members)</span>
                <span>Amount</span>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 divide-y divide-white/5 max-h-52 overflow-y-auto">
                {selectedMembersList.map((m: any) => {
                  const count = getCount(m.member.id);
                  const mTotal = parsedAmount * count;
                  return (
                    <div key={m.member.id} className="flex items-center justify-between px-3 py-2 text-xs">
                      <div>
                        <div className="font-semibold text-foreground">{m.member.user.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          Room {m.member.roomNo || "--"} {count > 1 ? `• Multiplier: ×${count}` : ""}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-emerald-400">৳ {mTotal.toFixed(2)}</div>
                        {count > 1 && (
                          <div className="text-[10px] text-muted-foreground">
                            (৳{parsedAmount.toFixed(0)} × {count})
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Dialog Action Buttons */}
          <div className="shrink-0 pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsConfirmOpen(false)}
              className="h-9 px-4 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              Go Back
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isSubmitting}
              onClick={handleExecuteSubmit}
              className="h-9 px-4 text-xs font-bold rounded-xl btn-glow gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? "Adding..." : `Confirm & Add (${totalSelectedUnits} Total)`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Specific Bill Dialog */}
      <Dialog open={isEditSpecificBillDialogOpen} onOpenChange={(open) => { setIsEditSpecificBillDialogOpen(open); if (!open) { setEditingMember(null); setEditingBillId(null); fetchData(undefined, false, true); } }}>
        <DialogContent className="rounded-2xl mx-4 sm:mx-auto max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-bold">Manage Bills: {editingMember?.user?.name}</DialogTitle>
            <DialogDescription>Edit or remove individual bills.</DialogDescription>
          </DialogHeader>
          <datalist id="edit-bill-categories">
            {['Khala Bill','Manager Bill','Paper Bill','Current Bill','Gas Bill','Fest Meal','Market Fine','Other'].map(c => <option key={c} value={c} />)}
          </datalist>
          <div className="space-y-2 pt-2 overflow-y-auto flex-1 pr-1">
            {editingMember?.specificBills?.map((bill: any) => {
              const isEditingThisBill = editingBillId === bill.id;
              if (isEditingThisBill) {
                return (
                  <div key={bill.id} className="p-3 rounded-xl space-y-2.5" style={{ background: 'oklch(0.65 0.25 275 / 8%)', border: '1px solid oklch(0.65 0.25 275 / 20%)' }}>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="text-[11px] font-semibold text-muted-foreground block mb-1">Category</label><input type="text" list="edit-bill-categories" value={editBillCategory} onChange={(e) => setEditBillCategory(e.target.value)} className="w-full h-8 px-2.5 text-xs rounded-lg focus:outline-none" style={{ background: 'oklch(0.18 0.02 260)', border: '1px solid oklch(1 0 0 / 12%)', color: 'oklch(0.93 0.01 260)' }} /></div>
                      <div><label className="text-[11px] font-semibold text-muted-foreground block mb-1">Amount (Tk)</label><input type="number" step="0.01" min="0" value={editBillAmount} onChange={(e) => setEditBillAmount(e.target.value)} className="w-full h-8 px-2.5 text-xs rounded-lg focus:outline-none" style={{ background: 'oklch(0.18 0.02 260)', border: '1px solid oklch(1 0 0 / 12%)', color: 'oklch(0.93 0.01 260)' }} /></div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditingBillId(null)} className="h-7 px-2.5 text-xs rounded-lg">Cancel</Button>
                      <Button size="sm" onClick={async () => { if (!editBillCategory.trim() || !editBillAmount) return; const fd = new FormData(); fd.append("id", bill.id); fd.append("description", editBillCategory); fd.append("amount", editBillAmount); await updateSpecificBill(fd); setEditingMember((prev: any) => ({ ...prev, specificBills: prev.specificBills.map((b: any) => b.id === bill.id ? { ...b, description: editBillCategory, amount: parseFloat(editBillAmount) || 0 } : b) })); setEditingBillId(null); }} className="h-7 px-3 text-xs font-semibold btn-glow rounded-lg">Save</Button>
                    </div>
                  </div>
                );
              }
              return (
                <div key={bill.id} className="flex justify-between items-center p-3 rounded-xl" style={{ background: 'oklch(0.16 0.018 260)', border: '1px solid oklch(1 0 0 / 8%)' }}>
                  <div><p className="font-semibold text-sm text-foreground">{bill.description}</p><p className="text-xs font-bold" style={{ color: 'oklch(0.70 0.19 162)' }}>৳ {parseFloat(bill.amount).toFixed(2)}</p></div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setEditingBillId(bill.id); setEditBillCategory(bill.description); setEditBillAmount(bill.amount.toString()); }} className="h-7 px-2.5 text-xs rounded-lg border-white/10 hover:bg-white/5 text-muted-foreground">Edit</Button>
                    <Button variant="destructive" size="sm" onClick={async () => { if (confirm("Delete this bill?")) { const fd = new FormData(); fd.append("id", bill.id); await deleteSpecificBill(fd); setEditingMember((prev: any) => ({ ...prev, specificBills: prev.specificBills.filter((b: any) => b.id !== bill.id) })); } }} className="h-7 px-2.5 text-xs rounded-lg">Delete</Button>
                  </div>
                </div>
              );
            })}
            {(!editingMember?.specificBills || editingMember.specificBills.length === 0) && <p className="text-center text-sm text-muted-foreground py-4">No bills left.</p>}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

"use client";
import { updateSpecificBill, deleteSpecificBill } from "@/app/actions/mess";
import { toast } from "react-toastify";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";


export default function SpecificbillsTab({ props }: { props: any }) {
  const { data, isEditSpecificBillDialogOpen, setIsEditSpecificBillDialogOpen, editingMember, setEditingMember, editingBillId, setEditingBillId, editBillCategory, setEditBillCategory, editBillAmount, setEditBillAmount, fetchData, handleAddSpecificBill } = props;
  const [memberCounts, setMemberCounts] = React.useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const getCount = (id: string) => memberCounts[id] || 1;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-1">
                <div className="section-panel h-full">
                  <div className="section-panel-header">
                    <div><h3 className="text-sm font-bold text-foreground">Add Specific Bill</h3><p className="text-xs text-muted-foreground mt-0.5">Assign a bill to specific members.</p></div>
                  </div>
                  <div className="p-4">
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      setIsSubmitting(true);
                      try {
                        await handleAddSpecificBill(e);
                        setMemberCounts({});
                      } finally {
                        setIsSubmitting(false);
                      }
                    }} className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Select Members</Label>
                        <div className="rounded-xl p-3 max-h-48 overflow-y-auto space-y-1" style={{ background: 'oklch(0.18 0.02 260)', border: '1px solid oklch(1 0 0 / 10%)' }}>
                          {data.members.map((m: any) => (
                            <div key={m.member.id} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/5">
                              <label className="flex items-center gap-2 cursor-pointer flex-1">
                                <input type="checkbox" name="memberId" value={m.member.id} className="w-4 h-4 rounded" style={{ accentColor: 'oklch(0.65 0.25 275)' }} />
                                <span className="text-sm font-medium text-foreground">{m.member.user.name}</span>
                                <span className="text-xs text-muted-foreground ml-2">R{m.member.roomNo}</span>
                              </label>
                              <div className="flex items-center gap-2">
                                <Button type="button" variant="outline" size="icon" className="h-6 w-6 rounded-md" onClick={() => setMemberCounts(p => ({ ...p, [m.member.id]: Math.max(1, getCount(m.member.id) - 1) }))}>-</Button>
                                <span className="text-xs font-bold w-4 text-center">{getCount(m.member.id)}</span>
                                <Button type="button" variant="outline" size="icon" className="h-6 w-6 rounded-md" onClick={() => setMemberCounts(p => ({ ...p, [m.member.id]: getCount(m.member.id) + 1 }))}>+</Button>
                                <input type="hidden" name={`count_${m.member.id}`} value={getCount(m.member.id)} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Bill Category</Label>
                        <select name="description" required className="w-full h-10 px-3 rounded-xl text-sm font-medium focus:outline-none" style={{ background: 'oklch(0.18 0.02 260)', border: '1px solid oklch(1 0 0 / 12%)', color: 'oklch(0.93 0.01 260)' }}>
                          <option value="">Select category...</option>
                          {['Khala Bill','Manager Bill','Paper Bill','Current Bill','Gas Bill','Fest Meal','Market Fine','Other'].map(c => <option key={c} value={c} style={{ background: 'oklch(0.18 0.02 260)' }}>{c}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Amount (Tk)</Label>
                        <Input name="amount" type="number" step="0.01" min="0" required className="h-10 rounded-xl bg-white/5 border-white/10 text-foreground" />
                      </div>
                      <Button type="submit" disabled={isSubmitting} className="w-full h-10 font-bold btn-glow text-sm">
                        {isSubmitting ? "Adding..." : "Add Bill to Selected Members"}
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

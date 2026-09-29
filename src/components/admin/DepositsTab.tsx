import { addDeposit } from "@/app/actions/mess";
import { toast } from "react-toastify";
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { DollarSign, CheckCircle2, History, Trash2, Pencil } from "lucide-react";


export default function DepositsTab({ props }: { props: any }) {
  const { data, isEditDepositDialogOpen, setIsEditDepositDialogOpen, editingDeposit, editDepositAmount, setEditDepositAmount, editDepositDate, setEditDepositDate, fetchData, openEditDeposit, handleUpdateDeposit, handleDeleteDeposit } = props;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-1">
                <div className="section-panel h-full">
                  <div className="section-panel-header">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, oklch(0.55 0.26 278), oklch(0.50 0.22 265))' }}>
                        <DollarSign className="w-4 h-4 text-white" />
                      </div>
                      <div><h3 className="text-sm font-bold text-foreground">Add Member Deposit</h3><p className="text-xs text-muted-foreground">Record cash deposit</p></div>
                    </div>
                  </div>
                  <div className="p-4">
                    <form onSubmit={async (e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); await addDeposit(fd); (e.target as HTMLFormElement).reset(); await fetchData(); toast.success("Deposit added successfully!"); }} className="space-y-3">
                      <div className="space-y-1.5"><Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Select Member</Label><select name="memberId" required className="w-full h-10 px-3 rounded-xl text-sm font-medium focus:outline-none" style={{ background: 'oklch(0.18 0.02 260)', border: '1px solid oklch(1 0 0 / 12%)', color: 'oklch(0.93 0.01 260)' }}><option value="">Choose a member...</option>{data.members.map((m: any) => <option key={m.member.id} value={m.member.id} style={{ background: 'oklch(0.18 0.02 260)' }}>{m.member.user.name} (R{m.member.roomNo})</option>)}</select></div>
                      <div className="space-y-1.5"><Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Deposit Amount (Tk)</Label><Input name="amount" type="number" step="0.01" min="1" placeholder="3000" required className="h-10 rounded-xl bg-white/5 border-white/10 text-foreground" /></div>
                      <div className="space-y-1.5"><Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Deposit Date</Label><Input name="date" type="date" required defaultValue={new Date().toISOString().split("T")[0]} className="h-10 rounded-xl bg-white/5 border-white/10 text-foreground" /></div>
                      <Button type="submit" className="w-full h-10 font-bold btn-glow text-sm gap-2"><CheckCircle2 className="w-4 h-4" /> Record Deposit</Button>
                    </form>
                  </div>
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="section-panel h-full">
                  <div className="section-panel-header"><div><h3 className="text-sm font-bold text-foreground">All Member Deposits</h3><p className="text-xs text-muted-foreground mt-0.5">Summed automatically per member</p></div></div>
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead><tr><th>Member</th><th>Room</th><th>Prev. Due</th><th>Prev. Advance</th><th className="min-w-[200px]">Deposit History & Actions</th><th>Total Deposited</th><th>Balance</th></tr></thead>
                      <tbody>
                        {data.members.map((m: any) => {
                          const netDepositBalance = m.totalDeposits + m.previousAdvance - m.previousDue;
                          return (
                            <tr key={m.member.id}>
                              <td className="font-semibold text-foreground">{m.member.user.name}</td>
                              <td><span className="badge-indigo">{m.member.roomNo}</span></td>
                              <td>{m.previousDue > 0 ? <span className="font-bold" style={{ color: 'oklch(0.68 0.22 27)' }}>৳{m.previousDue.toFixed(2)}</span> : <span className="text-muted-foreground">—</span>}</td>
                              <td>{m.previousAdvance > 0 ? <span className="font-bold" style={{ color: 'oklch(0.70 0.19 162)' }}>৳{m.previousAdvance.toFixed(2)}</span> : <span className="text-muted-foreground">—</span>}</td>
                              <td>
                                <div className="flex flex-col gap-1.5">
                                  {m.member.deposits?.length > 0 ? (
                                    m.member.deposits.map((dep: any) => (
                                      <div key={dep.id} className="flex items-center justify-between gap-2 p-1.5 rounded-lg border bg-white/5 border-white/10">
                                        <div className="flex items-center gap-2">
                                          <span className="badge-cyan text-[11px]">{new Date(dep.date).toLocaleDateString()}</span>
                                          <span className="font-bold text-xs" style={{ color: 'oklch(0.70 0.19 162)' }}>৳{dep.amount.toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openEditDeposit(dep, m.member.user.name)}
                                            className="h-6 w-6 p-0 text-muted-foreground hover:text-white hover:bg-white/10 rounded-md"
                                            title="Edit Deposit"
                                          >
                                            <Pencil className="w-3.5 h-3.5" />
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteDeposit(dep.id, dep.amount, m.member.user.name)}
                                            className="h-6 w-6 p-0 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-md"
                                            title="Delete Deposit"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <span className="text-muted-foreground text-xs">No deposits</span>
                                  )}
                                </div>
                              </td>
                              <td className="font-bold" style={{ color: 'oklch(0.70 0.19 162)' }}>৳ {m.totalDeposits.toLocaleString()}</td>
                              <td className="font-bold">
                                {netDepositBalance >= 0 ? (
                                  <div><span style={{ color: 'oklch(0.70 0.19 162)' }}>৳{netDepositBalance.toFixed(2)}</span><p className="text-[10px] text-muted-foreground">Advance</p></div>
                                ) : (
                                  <div><span style={{ color: 'oklch(0.68 0.22 27)' }}>৳{Math.abs(netDepositBalance).toFixed(2)}</span><p className="text-[10px] text-muted-foreground">Due</p></div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Deposit Dialog */}
            <Dialog open={isEditDepositDialogOpen} onOpenChange={setIsEditDepositDialogOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Edit Deposit</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Update deposit amount or date for {editingDeposit?.memberName || "Member"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpdateDeposit} className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Deposit Amount (Tk)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="1"
                      value={editDepositAmount}
                      onChange={(e) => setEditDepositAmount(e.target.value)}
                      required
                      className="h-10 rounded-xl bg-white/5 border-white/10 text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Deposit Date</Label>
                    <Input
                      type="date"
                      value={editDepositDate}
                      onChange={(e) => setEditDepositDate(e.target.value)}
                      required
                      className="h-10 rounded-xl bg-white/5 border-white/10 text-foreground"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" type="button" onClick={() => setIsEditDepositDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" className="btn-glow font-bold">Save Changes</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
    </>
  );
}

"use client";
import { addDeposit } from "@/app/actions/mess";
import { toast } from "react-toastify";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DollarSign, CheckCircle2, History, Trash2, Pencil, Plus } from "lucide-react";


export default function DepositsTab({ props }: { props: any }) {
  const { data, isEditDepositDialogOpen, setIsEditDepositDialogOpen, editingDeposit, editDepositAmount, setEditDepositAmount, editDepositDate, setEditDepositDate, fetchData, openEditDeposit, handleUpdateDeposit, handleDeleteDeposit } = props;
  const [isAdding, setIsAdding] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const [isAddDepositDialogOpen, setIsAddDepositDialogOpen] = React.useState(false);
  const [addingMember, setAddingMember] = React.useState<{id: string, name: string} | null>(null);
  const [addDepositAmount, setAddDepositAmount] = React.useState("");
  const [addDepositDate, setAddDepositDate] = React.useState(new Date().toISOString().split("T")[0]);

  return (
    <>
      <div className="section-panel h-full">
        <div className="section-panel-header"><div><h3 className="text-sm font-bold text-foreground">All Member Deposits</h3><p className="text-xs text-muted-foreground mt-0.5">Summed automatically per member</p></div></div>
        <div className="table-responsive">
          <table className="data-table">
            <thead><tr><th>Member</th><th>Prev. Due</th><th>Prev. Advance</th><th className="min-w-[200px]">Deposit History & Actions</th><th>Total Deposited</th><th>Balance</th></tr></thead>
            <tbody>
              {data.members.map((m: any) => {
                const netDepositBalance = m.totalDeposits + m.previousAdvance - m.previousDue;
                return (
                  <tr key={m.member.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{m.member.user.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setAddingMember({ id: m.member.id, name: m.member.user.name });
                            setAddDepositAmount("");
                            setAddDepositDate(new Date().toISOString().split("T")[0]);
                            setIsAddDepositDialogOpen(true);
                          }}
                          className="h-7 w-7 p-0 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 transition-all hover:scale-105"
                          title="Add Deposit"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
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
                                  disabled={deletingId === dep.id}
                                  onClick={async () => {
                                    setDeletingId(dep.id);
                                    try {
                                      await handleDeleteDeposit(dep.id, dep.amount, m.member.user.name);
                                    } finally {
                                      setDeletingId(null);
                                    }
                                  }}
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-md"
                                  title="Delete Deposit"
                                >
                                  {deletingId === dep.id ? "..." : <Trash2 className="w-3.5 h-3.5" />}
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

      {/* Add Deposit Dialog */}
      <Dialog open={isAddDepositDialogOpen} onOpenChange={setIsAddDepositDialogOpen}>
        <DialogContent className="sm:max-w-[425px] border-white/10 bg-background/95 backdrop-blur-xl shadow-2xl rounded-2xl">
          <DialogHeader className="flex flex-col items-center justify-center pt-4 pb-2">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: 'linear-gradient(135deg, oklch(0.55 0.26 278 / 20%), oklch(0.50 0.22 265 / 20%))', border: '1px solid oklch(0.55 0.26 278 / 30%)' }}>
              <DollarSign className="w-6 h-6" style={{ color: 'oklch(0.65 0.25 275)' }} />
            </div>
            <DialogTitle className="text-xl font-bold text-foreground">Add Deposit</DialogTitle>
            <DialogDescription className="text-center text-muted-foreground text-sm">
              Record a new cash deposit for <span className="font-bold text-white bg-white/5 px-2 py-0.5 rounded-md mx-1">{addingMember?.name}</span>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault();
            setIsAdding(true);
            try {
              const fd = new FormData();
              fd.append("memberId", addingMember?.id || "");
              fd.append("amount", addDepositAmount);
              fd.append("date", addDepositDate);
              await addDeposit(fd);
              await fetchData(undefined, false, true);
              toast.success("Deposit added successfully!");
              setIsAddDepositDialogOpen(false);
            } finally {
              setIsAdding(false);
            }
          }} className="space-y-5 px-2 pb-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Deposit Amount</Label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">৳</span>
                <Input
                  type="number"
                  step="0.01"
                  min="1"
                  value={addDepositAmount}
                  onChange={(e) => setAddDepositAmount(e.target.value)}
                  placeholder="3000"
                  required
                  className="h-11 pl-9 rounded-xl bg-white/5 border-white/10 text-foreground text-lg font-bold placeholder:text-muted-foreground/50 transition-colors focus:bg-white/10"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Deposit Date</Label>
              <Input
                type="date"
                value={addDepositDate}
                onChange={(e) => setAddDepositDate(e.target.value)}
                required
                className="h-11 rounded-xl bg-white/5 border-white/10 text-foreground font-medium"
              />
            </div>
            <div className="flex justify-between items-center gap-3 pt-2">
              <Button variant="ghost" type="button" onClick={() => setIsAddDepositDialogOpen(false)} className="flex-1 h-11 rounded-xl text-muted-foreground hover:text-white">Cancel</Button>
              <Button type="submit" disabled={isAdding} className="flex-1 h-11 rounded-xl btn-glow font-bold gap-2"><CheckCircle2 className="w-4 h-4" /> {isAdding ? "Saving..." : "Confirm Deposit"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Deposit Dialog */}
      <Dialog open={isEditDepositDialogOpen} onOpenChange={setIsEditDepositDialogOpen}>
        <DialogContent className="sm:max-w-[425px] border-white/10 bg-background/95 backdrop-blur-xl shadow-2xl rounded-2xl">
          <DialogHeader className="flex flex-col items-center justify-center pt-4 pb-2">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: 'linear-gradient(135deg, oklch(0.60 0.15 250 / 20%), oklch(0.55 0.15 250 / 20%))', border: '1px solid oklch(0.60 0.15 250 / 30%)' }}>
              <Pencil className="w-5 h-5 text-indigo-400" />
            </div>
            <DialogTitle className="text-xl font-bold text-foreground">Edit Deposit</DialogTitle>
            <DialogDescription className="text-center text-muted-foreground text-sm">
              Update deposit for <span className="font-bold text-white bg-white/5 px-2 py-0.5 rounded-md mx-1">{editingDeposit?.memberName || "Member"}</span>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault();
            setIsEditing(true);
            try {
              await handleUpdateDeposit(e);
            } finally {
              setIsEditing(false);
            }
          }} className="space-y-5 px-2 pb-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Deposit Amount</Label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">৳</span>
                <Input
                  type="number"
                  step="0.01"
                  min="1"
                  value={editDepositAmount}
                  onChange={(e) => setEditDepositAmount(e.target.value)}
                  required
                  className="h-11 pl-9 rounded-xl bg-white/5 border-white/10 text-foreground text-lg font-bold placeholder:text-muted-foreground/50 transition-colors focus:bg-white/10"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Deposit Date</Label>
              <Input
                type="date"
                value={editDepositDate}
                onChange={(e) => setEditDepositDate(e.target.value)}
                required
                className="h-11 rounded-xl bg-white/5 border-white/10 text-foreground font-medium"
              />
            </div>
            <div className="flex justify-between items-center gap-3 pt-2">
              <Button variant="ghost" type="button" onClick={() => setIsEditDepositDialogOpen(false)} className="flex-1 h-11 rounded-xl text-muted-foreground hover:text-white">Cancel</Button>
              <Button type="submit" disabled={isEditing} className="flex-1 h-11 rounded-xl btn-glow font-bold gap-2"><CheckCircle2 className="w-4 h-4" /> {isEditing ? "Saving..." : "Save Changes"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

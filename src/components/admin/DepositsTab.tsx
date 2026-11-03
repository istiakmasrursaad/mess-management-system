"use client";
import { addDeposit, deleteDeposit } from "@/app/actions/mess";
import { toast } from "react-toastify";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BadgeDollarSign, CircleCheckBig, ArchiveRestore, Trash2, FilePen, Plus, X, RotateCcw, CheckCircle2, FileDown, Share2 } from "lucide-react";
import { generateDepositReceiptPDF, getDepositReceiptPdfFile, getDepositReceiptFormattedData } from "@/lib/depositReceipt";
import MonthCalendarPicker from "@/components/admin/MonthCalendarPicker";


export default function DepositsTab({ props }: { props: any }) {
  const { data, isEditDepositDialogOpen, setIsEditDepositDialogOpen, editingDeposit, editDepositAmount, setEditDepositAmount, editDepositDate, setEditDepositDate, fetchData, openEditDeposit, handleUpdateDeposit, handleDeleteDeposit, selectedMonth } = props;
  const [isAdding, setIsAdding] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const activeMonthYear = selectedMonth || data?.monthYear || "";

  // Restrict calendar picker strictly to the active/selected month
  const { minDate, maxDate } = React.useMemo(() => {
    if (!activeMonthYear || !activeMonthYear.includes("-")) {
      return { minDate: undefined, maxDate: undefined };
    }
    const [mStr, yStr] = activeMonthYear.split("-");
    const monthNum = parseInt(mStr, 10);
    const yearNum = parseInt(yStr, 10);
    if (isNaN(monthNum) || isNaN(yearNum)) {
      return { minDate: undefined, maxDate: undefined };
    }
    const paddedMonth = String(monthNum).padStart(2, "0");
    const minDate = `${yearNum}-${paddedMonth}-01`;
    const lastDay = new Date(yearNum, monthNum, 0).getDate();
    const maxDate = `${yearNum}-${paddedMonth}-${String(lastDay).padStart(2, "0")}`;
    return { minDate, maxDate };
  }, [activeMonthYear]);

  const [isAddDepositDialogOpen, setIsAddDepositDialogOpen] = React.useState(false);
  const [addingMember, setAddingMember] = React.useState<{id: string, name: string} | null>(null);
  const [addDepositAmount, setAddDepositAmount] = React.useState("");
  const [addDepositDate, setAddDepositDate] = React.useState("");

  // Track dismissed (removed/faded) extra duty allowances per member for this month
  const [dismissedMap, setDismissedMap] = React.useState<Record<string, boolean>>({});
  const [isActionLoading, setIsActionLoading] = React.useState<string | null>(null);
  const [generatingReceiptId, setGeneratingReceiptId] = React.useState<string | null>(null);
  const [previewMember, setPreviewMember] = React.useState<any | null>(null);
  const [readyPdfFile, setReadyPdfFile] = React.useState<File | null>(null);
  const [isPreparingFile, setIsPreparingFile] = React.useState(false);
  const [isSharing, setIsSharing] = React.useState(false);

  // Pre-generate PDF File in memory as soon as preview opens to preserve user gesture for navigator.share
  React.useEffect(() => {
    if (!previewMember) {
      setReadyPdfFile(null);
      return;
    }
    let isMounted = true;
    setIsPreparingFile(true);
    getDepositReceiptPdfFile(previewMember, data?.monthYear)
      .then((file) => {
        if (isMounted) {
          setReadyPdfFile(file);
          setIsPreparingFile(false);
        }
      })
      .catch((err) => {
        console.error("Failed to pre-generate PDF file", err);
        if (isMounted) setIsPreparingFile(false);
      });
    return () => {
      isMounted = false;
    };
  }, [previewMember, data?.monthYear]);

  React.useEffect(() => {
    const currentMonthYear = data?.monthYear || "current";
    try {
      const raw = localStorage.getItem(`dismissed_allowances_${currentMonthYear}`);
      if (raw) {
        setDismissedMap(JSON.parse(raw));
      } else {
        setDismissedMap({});
      }
    } catch {
      setDismissedMap({});
    }
  }, [data?.monthYear]);

  // Dismiss allowance (render abcha / faded)
  const handleDismissAllowance = (memberId: string) => {
    const currentMonthYear = data?.monthYear || "current";
    const updated = { ...dismissedMap, [memberId]: true };
    setDismissedMap(updated);
    try {
      localStorage.setItem(`dismissed_allowances_${currentMonthYear}`, JSON.stringify(updated));
    } catch {}
    toast.info("Allowance marked as removed (faded). You can revert anytime.");
  };

  // Revert dismissed allowance back to active Add/Remove
  const handleRevertDismiss = (memberId: string) => {
    const currentMonthYear = data?.monthYear || "current";
    const updated = { ...dismissedMap };
    delete updated[memberId];
    setDismissedMap(updated);
    try {
      localStorage.setItem(`dismissed_allowances_${currentMonthYear}`, JSON.stringify(updated));
    } catch {}
    toast.success("Allowance restored!");
  };

  // Add allowance as a cash deposit
  const handleAddAllowanceDeposit = async (m: any, allowance: number) => {
    if (!allowance || allowance <= 0) return;
    setIsActionLoading(m.member.id);
    try {
      const fd = new FormData();
      fd.append("memberId", m.member.id);
      fd.append("amount", allowance.toString());
      const todayStr = new Date().toISOString().split("T")[0];
      const allowanceDate = (minDate && maxDate && (todayStr < minDate || todayStr > maxDate))
        ? minDate
        : todayStr;
      fd.append("date", allowanceDate);
      fd.append("monthYear", activeMonthYear || data?.monthYear);
      fd.append("note", "Extra Duty Allowance");
      await addDeposit(fd);
      await fetchData(undefined, false, true);
      toast.success(`৳${allowance} Extra Duty Allowance added as deposit for ${m.member.user.name}!`);
    } catch (err: any) {
      toast.error("Failed to add deposit: " + err.message);
    } finally {
      setIsActionLoading(null);
    }
  };

  // Revert added allowance deposit (delete deposit)
  const handleRevertAllowanceDeposit = async (depositId: string, m: any) => {
    if (!window.confirm(`${m.member.user.name} এর জন্য যোগ করা Extra Duty Allowance ডিপোজিটটি মুছে ফেলতে চান?`)) return;
    setIsActionLoading(depositId);
    try {
      const fd = new FormData();
      fd.append("id", depositId);
      await deleteDeposit(fd);
      await fetchData(undefined, false, true);
      toast.info(`Extra Duty Allowance deposit reverted.`);
    } catch (err: any) {
      toast.error("Failed to revert deposit: " + err.message);
    } finally {
      setIsActionLoading(null);
    }
  };

  return (
    <>
      <div className="section-panel h-full">
        <div className="section-panel-header"><div><h3 className="text-sm font-bold text-foreground">All Member Deposits</h3><p className="text-xs text-muted-foreground mt-0.5">Summed automatically per member</p></div></div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Prev. Due</th>
                <th>Prev. Advance</th>
                <th>Prev. Extra Duty</th>
                <th className="min-w-[200px]">Deposit History & Actions</th>
                <th>Total Deposited</th>
                <th>Balance</th>
                <th className="text-center">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {data.members.map((m: any) => {
                const netDepositBalance = m.totalDeposits + m.previousAdvance - m.previousDue;
                const allowance = m.prevExtraMarketAllowance || 0;
                const allowanceDeposit = m.member.deposits?.find((dep: any) =>
                  dep.note && dep.note.toLowerCase().includes("extra duty")
                );
                const isDismissed = Boolean(dismissedMap[m.member.id]);

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
                            setAddDepositDate("");
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

                    {/* Extra Duty Allowance (Prev. Month) Column */}
                    <td>
                      {(() => {
                        if (allowance <= 0) {
                          return <span className="text-muted-foreground text-xs">—</span>;
                        }

                        // 1. If added as deposit
                        if (allowanceDeposit) {
                          return (
                            <div className="flex flex-col gap-1.5 py-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-extrabold text-xs text-emerald-400">
                                  ৳{allowance}
                                </span>
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                  <CheckCircle2 className="w-2.5 h-2.5" /> Added
                                </span>
                              </div>
                              <div>
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={isActionLoading === allowanceDeposit.id}
                                  onClick={() => handleRevertAllowanceDeposit(allowanceDeposit.id, m)}
                                  className="h-6 px-2 text-[10px] font-bold rounded-md bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-all active:scale-95 flex items-center gap-1"
                                  title="Revert deposit addition"
                                >
                                  <RotateCcw className="w-2.5 h-2.5" />
                                  {isActionLoading === allowanceDeposit.id ? "..." : "Revert"}
                                </Button>
                              </div>
                            </div>
                          );
                        }

                        // 2. If dismissed (faded / abcha)
                        if (isDismissed) {
                          return (
                            <div className="flex flex-col gap-1.5 py-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-xs text-slate-400 opacity-40 line-through">
                                  ৳{allowance}
                                </span>
                                <span className="text-[10px] text-slate-400 opacity-60 italic bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
                                  Removed
                                </span>
                              </div>
                              <div>
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => handleRevertDismiss(m.member.id)}
                                  className="h-6 px-2 text-[10px] font-bold rounded-md bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 transition-all active:scale-95 flex items-center gap-1"
                                  title="Restore allowance"
                                >
                                  <RotateCcw className="w-2.5 h-2.5" />
                                  Revert
                                </Button>
                              </div>
                            </div>
                          );
                        }

                        // 3. Normal / Pending state (Add & Remove buttons)
                        return (
                          <div className="flex flex-col gap-1.5 py-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-extrabold text-xs" style={{ color: 'oklch(0.70 0.19 162)' }}>
                                ৳{allowance}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-medium">
                                ({m.prevExtraDays} extra {m.prevExtraDays === 1 ? "day" : "days"})
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Button
                                type="button"
                                size="sm"
                                disabled={isActionLoading === m.member.id}
                                onClick={() => handleAddAllowanceDeposit(m, allowance)}
                                className="h-6 px-2 text-[10px] font-bold rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-1"
                                title="Add as deposit"
                              >
                                <Plus className="w-2.5 h-2.5" />
                                {isActionLoading === m.member.id ? "Adding..." : "Add"}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                disabled={isActionLoading === m.member.id}
                                onClick={() => handleDismissAllowance(m.member.id)}
                                className="h-6 px-2 text-[10px] font-bold rounded-md bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-rose-100 border border-rose-500/40 transition-all hover:scale-105 active:scale-95 flex items-center gap-1 shadow-sm"
                                title="Mark as removed (fade)"
                              >
                                <X className="w-3 h-3 text-rose-400" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        );
                      })()}
                    </td>

                    <td>
                      <div className="flex flex-col gap-1.5">
                        {m.member.deposits?.length > 0 ? (
                          m.member.deposits.map((dep: any) => (
                            <div key={dep.id} className="flex items-center justify-between gap-2 p-1.5 rounded-lg border bg-white/5 border-white/10">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="badge-cyan text-[11px]">{new Date(dep.date).toLocaleDateString()}</span>
                                <span className="font-bold text-xs" style={{ color: 'oklch(0.70 0.19 162)' }}>৳{dep.amount.toLocaleString()}</span>
                                {dep.note && (
                                  <span className="text-[10px] text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-medium">
                                    {dep.note}
                                  </span>
                                )}
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
                                  <FilePen className="w-3.5 h-3.5" />
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
                    <td className="text-center">
                      <div className="flex items-center gap-1.5 justify-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={generatingReceiptId === m.member.id}
                          onClick={async () => {
                            setGeneratingReceiptId(m.member.id);
                            try {
                              await generateDepositReceiptPDF(m, data?.monthYear);
                              toast.success(`Receipt downloaded for ${m.member.user.name}`);
                            } catch (err: any) {
                              toast.error("Failed to generate PDF: " + err.message);
                            } finally {
                              setGeneratingReceiptId(null);
                            }
                          }}
                          className="h-7 px-2 text-xs font-semibold rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 hover:text-sky-200 border border-sky-500/30 transition-all hover:scale-105 active:scale-95 gap-1 shadow-sm"
                          title={`Download Receipt for ${m.member.user.name}`}
                        >
                          <FileDown className="w-3.5 h-3.5 text-sky-400" />
                          {generatingReceiptId === m.member.id ? "PDF..." : "PDF"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewMember(m)}
                          className="h-7 px-2 text-xs font-semibold rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 transition-all hover:scale-105 active:scale-95 gap-1 shadow-sm"
                          title={`রসিদ প্রিভিউ ও শেয়ার (${m.member.user.name})`}
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          Share
                        </Button>
                      </div>
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
        <DialogContent className="w-[95vw] sm:w-full sm:max-w-[425px] max-h-[90dvh] overflow-y-auto overscroll-contain p-3.5 sm:p-5 border-white/10 bg-background/95 backdrop-blur-xl shadow-2xl rounded-2xl">
          <DialogHeader className="flex flex-col items-center justify-center pt-2 pb-1 sm:pt-4 sm:pb-2">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-2 sm:mb-3" style={{ background: 'linear-gradient(135deg, oklch(0.55 0.26 278 / 20%), oklch(0.50 0.22 265 / 20%))', border: '1px solid oklch(0.55 0.26 278 / 30%)' }}>
              <BadgeDollarSign className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: 'oklch(0.65 0.25 275)' }} />
            </div>
            <DialogTitle className="text-lg sm:text-xl font-bold text-foreground">Add Deposit</DialogTitle>
            <DialogDescription className="text-center text-muted-foreground text-xs sm:text-sm">
              Record a new cash deposit for <span className="font-bold text-white bg-white/5 px-2 py-0.5 rounded-md mx-1">{addingMember?.name}</span>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!addDepositDate) {
              toast.error("Please select a deposit date!");
              return;
            }
            if ((minDate && addDepositDate < minDate) || (maxDate && addDepositDate > maxDate)) {
              toast.error(`Deposit date must be within the active month (${activeMonthYear})`);
              return;
            }
            setIsAdding(true);
            try {
              const fd = new FormData();
              fd.append("memberId", addingMember?.id || "");
              fd.append("amount", addDepositAmount);
              fd.append("date", addDepositDate);
              if (activeMonthYear) {
                fd.append("monthYear", activeMonthYear);
              }
              await addDeposit(fd);
              await fetchData(undefined, false, true);
              toast.success("Deposit added successfully!");
              setIsAddDepositDialogOpen(false);
            } finally {
              setIsAdding(false);
            }
          }} className="space-y-3.5 sm:space-y-4 px-0.5 pb-1">
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
                  className="h-10 sm:h-11 pl-9 rounded-xl bg-white/5 border-white/10 text-foreground text-base sm:text-lg font-bold placeholder:text-muted-foreground/50 transition-colors focus:bg-white/10"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Deposit Date</Label>
              <MonthCalendarPicker
                value={addDepositDate}
                onChange={setAddDepositDate}
                selectedMonth={activeMonthYear}
                accentColor="indigo"
                required
              />
            </div>
            <div className="flex justify-between items-center gap-2.5 pt-2">
              <Button variant="ghost" type="button" onClick={() => setIsAddDepositDialogOpen(false)} className="flex-1 h-10 sm:h-11 rounded-xl text-muted-foreground hover:text-white touch-manipulation">Cancel</Button>
              <Button type="submit" disabled={isAdding} className="flex-1 h-10 sm:h-11 rounded-xl btn-glow font-bold gap-1.5 sm:gap-2 touch-manipulation"><CircleCheckBig className="w-4 h-4" /> {isAdding ? "Saving..." : "Confirm Deposit"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Deposit Dialog */}
      <Dialog open={isEditDepositDialogOpen} onOpenChange={setIsEditDepositDialogOpen}>
        <DialogContent className="w-[95vw] sm:w-full sm:max-w-[425px] max-h-[90dvh] overflow-y-auto overscroll-contain p-3.5 sm:p-5 border-white/10 bg-background/95 backdrop-blur-xl shadow-2xl rounded-2xl">
          <DialogHeader className="flex flex-col items-center justify-center pt-2 pb-1 sm:pt-4 sm:pb-2">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-2 sm:mb-3" style={{ background: 'linear-gradient(135deg, oklch(0.60 0.15 250 / 20%), oklch(0.55 0.15 250 / 20%))', border: '1px solid oklch(0.60 0.15 250 / 30%)' }}>
              <FilePen className="w-5 h-5 text-indigo-400" />
            </div>
            <DialogTitle className="text-lg sm:text-xl font-bold text-foreground">Edit Deposit</DialogTitle>
            <DialogDescription className="text-center text-muted-foreground text-xs sm:text-sm">
              Update deposit for <span className="font-bold text-white bg-white/5 px-2 py-0.5 rounded-md mx-1">{editingDeposit?.memberName || "Member"}</span>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault();
            if ((minDate && editDepositDate < minDate) || (maxDate && editDepositDate > maxDate)) {
              toast.error(`Deposit date must be within the active month (${activeMonthYear})`);
              return;
            }
            setIsEditing(true);
            try {
              await handleUpdateDeposit(e);
            } finally {
              setIsEditing(false);
            }
          }} className="space-y-3.5 sm:space-y-4 px-0.5 pb-1">
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
                  className="h-10 sm:h-11 pl-9 rounded-xl bg-white/5 border-white/10 text-foreground text-base sm:text-lg font-bold placeholder:text-muted-foreground/50 transition-colors focus:bg-white/10"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Deposit Date</Label>
              <MonthCalendarPicker
                value={editDepositDate}
                onChange={setEditDepositDate}
                selectedMonth={activeMonthYear}
                accentColor="indigo"
                required
              />
            </div>
            <div className="flex justify-between items-center gap-2.5 pt-2">
              <Button variant="ghost" type="button" onClick={() => setIsEditDepositDialogOpen(false)} className="flex-1 h-10 sm:h-11 rounded-xl text-muted-foreground hover:text-white touch-manipulation">Cancel</Button>
              <Button type="submit" disabled={isEditing} className="flex-1 h-10 sm:h-11 rounded-xl btn-glow font-bold gap-1.5 sm:gap-2 touch-manipulation"><CircleCheckBig className="w-4 h-4" /> {isEditing ? "Saving..." : "Save Changes"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Receipt Preview & Share Dialog */}
      <Dialog open={Boolean(previewMember)} onOpenChange={(open) => !open && setPreviewMember(null)}>
        <DialogContent className="sm:max-w-[600px] w-[95vw] max-h-[92vh] flex flex-col p-4 sm:p-5 border-white/15 bg-background/95 backdrop-blur-2xl shadow-2xl rounded-2xl overflow-hidden">
          <DialogHeader className="shrink-0 pb-2.5 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full flex items-center justify-center bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Deposit Receipt Preview
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Review the receipt details below before sharing or downloading.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {previewMember && (() => {
            const receiptPreview = getDepositReceiptFormattedData(previewMember, data?.monthYear);
            return (
              <>
                <div className="flex-1 overflow-y-auto py-3 pr-1">
                  {typeof window !== "undefined" && !window.isSecureContext && (
                    <div className="mb-3 p-2.5 rounded-xl text-xs bg-amber-500/10 text-amber-300 border border-amber-500/25 flex items-start gap-2">
                      <span className="text-sm">💡</span>
                      <div>
                        <span className="font-semibold">Local Wi-Fi Notice:</span> Mobile browsers restrict native file sharing over plain HTTP. To enable native gallery-style file share, run <code className="px-1.5 py-0.5 rounded bg-black/40 text-amber-200 font-mono font-bold">npm run dev:https</code> or download the PDF and attach it to WhatsApp.
                      </div>
                    </div>
                  )}

                  {/* Slip Card (White background, black border, Times New Roman, faint watermark) */}
                  <div
                    className="relative bg-white text-black p-4 sm:p-5 rounded-lg border-2 border-black/80 shadow-md select-none text-[12px] leading-tight"
                    style={{ fontFamily: "'Times New Roman', Times, serif" }}
                  >
                    {/* Center Watermark Logo */}
                    <div
                      className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.11]"
                      aria-hidden="true"
                    >
                      <img
                        src="/icons/icon-192x192.png"
                        alt="Watermark"
                        className="w-32 h-32 sm:w-40 sm:h-40 object-contain"
                      />
                    </div>

                    <div className="relative z-10 space-y-2">
                      {/* Header */}
                      <div className="text-center space-y-0.5">
                        <h4 className="text-[13px] font-bold tracking-tight">MOSJID-E-NUR COMPLEX</h4>
                        <p className="text-[13px] font-bold">Mess (2nd Floor & Parts of 1st and 3rd Floors)</p>
                        <p className="text-[12px]">Terokhadia, Cantonment Road, Rajshahi.</p>
                      </div>

                      {/* Month */}
                      <div className="text-right text-[12px] font-normal pt-1">
                        Month: {receiptPreview.currentMonthLabel}
                      </div>

                      {/* Member Name */}
                      <div className="text-[12px] font-normal">
                        Name: <span className="font-semibold">{receiptPreview.memberName}</span>
                      </div>

                      {/* Due & Advance */}
                      <div className="flex justify-between text-[12px]">
                        <span>Due({receiptPreview.prevMonthLabel}):</span>
                        <span>{receiptPreview.due > 0 ? receiptPreview.due : 0} tk</span>
                      </div>
                      <div className="flex justify-between text-[12px]">
                        <span>Advance({receiptPreview.prevMonthLabel}):</span>
                        <span>{receiptPreview.advance > 0 ? receiptPreview.advance : 0} tk</span>
                      </div>

                      {/* Deposit Details */}
                      <div className="pt-1">
                        <div className="text-[12px]">Deposit Details:</div>
                        <div className="pl-2 space-y-0.5 pt-0.5">
                          {receiptPreview.deposits.length === 0 ? (
                            <div className="flex justify-between text-[12px]">
                              <span>1. Date: --</span>
                              <span>0 tk</span>
                            </div>
                          ) : (
                            receiptPreview.deposits.map((dep, idx) => (
                              <div key={dep.id || idx} className="flex justify-between text-[12px]">
                                <span>{idx + 1}. Date:{dep.dateStr}</span>
                                <span>{dep.amount} tk</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Total Balance */}
                      <div className="flex justify-between text-[12px] pt-1 border-t border-black/20 font-semibold">
                        <span>Total Balance:</span>
                        <span>{receiptPreview.totalBalance} tk</span>
                      </div>

                      {/* In Words */}
                      <div className="text-[12px]">
                        <span className="font-semibold">In Words:</span> {receiptPreview.inWords}
                      </div>

                      {/* Footer Notice */}
                      <div className="text-center italic text-[11px] pt-2 text-black/80">
                        This is a system-generated receipt and does not require a signature
                      </div>

                      {/* Year @ softTech */}
                      <div className="text-center text-[12px]">
                        {receiptPreview.presentYear}@softTech
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fixed Bottom Action Buttons - ALWAYS VISIBLE */}
                <div className="shrink-0 pt-3 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 bg-background/95">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewMember(null)}
                    className="h-9 px-4 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-white border-white/20 transition-colors"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={async () => {
                      if (!previewMember) return;
                      try {
                        await generateDepositReceiptPDF(previewMember, data?.monthYear);
                        toast.success("Receipt downloaded successfully!");
                      } catch (e: any) {
                        toast.error("Download failed: " + e.message);
                      }
                    }}
                    className="h-9 px-4 text-xs font-semibold rounded-xl bg-sky-600 hover:bg-sky-500 text-white shadow-md transition-all active:scale-95 gap-1.5"
                  >
                    <FileDown className="w-4 h-4" />
                    Download PDF
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={isSharing || isPreparingFile}
                    onClick={async () => {
                      if (!previewMember) return;
                      setIsSharing(true);
                      try {
                        let fileToShare = readyPdfFile;
                        if (!fileToShare) {
                          fileToShare = await getDepositReceiptPdfFile(previewMember, data?.monthYear);
                        }

                        // Check if Web Share API with files is supported
                        const canShareFiles =
                          typeof navigator !== "undefined" &&
                          Boolean(navigator.share) &&
                          (typeof navigator.canShare === "function" ? navigator.canShare({ files: [fileToShare] }) : true);

                        if (canShareFiles) {
                          try {
                            // Pass ONLY files and title (no text) to ensure Android WhatsApp handles as document attachment
                            await navigator.share({
                              files: [fileToShare],
                              title: fileToShare.name,
                            });
                            toast.success("Receipt shared successfully!");
                            setPreviewMember(null);
                            return;
                          } catch (err: any) {
                            if (err.name === "AbortError") {
                              return; // User dismissed share sheet
                            }
                            console.warn("navigator.share failed, using direct launch fallback", err);
                          }
                        }

                        // Fallback: If Web Share with files is not available (e.g. non-HTTPS testing or desktop)
                        // Do NOT auto-download to avoid duplicate download prompts!
                        const phone = previewMember.member?.user?.phone ? previewMember.member.user.phone.replace(/[^0-9]/g, "") : "";
                        const waText = encodeURIComponent(`Assalamu Alaikum ${receiptPreview.memberName}, here is your Mess Deposit Receipt for ${receiptPreview.currentMonthLabel}. Total Balance: ${receiptPreview.totalBalance} tk.`);

                        const isMobile = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
                        if (isMobile) {
                          toast.info("Opening WhatsApp. You can also download the PDF using the Download button.", { autoClose: 3500 });
                          const mobileWaUrl = phone ? `whatsapp://send?phone=${phone}&text=${waText}` : `whatsapp://send?text=${waText}`;
                          window.location.href = mobileWaUrl;
                        } else {
                          const desktopWaUrl = phone ? `https://web.whatsapp.com/send?phone=${phone}&text=${waText}` : `https://web.whatsapp.com`;
                          window.open(desktopWaUrl, "_blank");
                        }
                        setPreviewMember(null);
                      } catch (err: any) {
                        if (err.name !== "AbortError") {
                          toast.error("Share failed: " + err.message);
                        }
                      } finally {
                        setIsSharing(false);
                      }
                    }}
                    className="h-9 px-4 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-95 gap-1.5"
                  >
                    <Share2 className="w-4 h-4" />
                    {isSharing ? "Sharing..." : isPreparingFile ? "Preparing PDF..." : "Share Receipt"}
                  </Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </>
  );
}

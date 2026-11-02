"use client";
import { deleteMarketEntry } from "@/app/actions/mess";
import { toast } from "react-toastify";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShoppingBag } from "lucide-react";
import MonthCalendarPicker from "@/components/admin/MonthCalendarPicker";


export default function MarketsTab({ props }: { props: any }) {
  const { data, isMarketDialogOpen, setIsMarketDialogOpen, isEditMarketDialogOpen, setIsEditMarketDialogOpen, editingMarket, setEditingMarket, fetchData, handleAddMarket, handleEditMarket, selectedMonth } = props;
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

  const [marketDate, setMarketDate] = React.useState("");

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="text-sm font-bold text-foreground">Market Expenses &amp; Grocery Log</h2>
              <Dialog open={isMarketDialogOpen} onOpenChange={(open) => { setIsMarketDialogOpen(open); if (!open) setMarketDate(""); }}>
                <Button className="gap-2 btn-glow h-9 text-xs" onClick={() => { setMarketDate(""); setIsMarketDialogOpen(true); }}><ShoppingBag className="w-3.5 h-3.5" /> Log Market Expense</Button>
                <DialogContent className="rounded-2xl mx-auto w-[95vw] sm:max-w-md max-h-[90dvh] overflow-y-auto overscroll-contain p-3.5 sm:p-5">
                  <DialogHeader><DialogTitle className="font-bold">Log Grocery Market Entry</DialogTitle><DialogDescription>Record market expenditure.</DialogDescription></DialogHeader>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!marketDate) {
                      toast.error("Please select a market date!");
                      return;
                    }
                    if ((minDate && marketDate < minDate) || (maxDate && marketDate > maxDate)) {
                      toast.error(`Market date must be within the active month (${activeMonthYear})`);
                      return;
                    }
                    setIsAdding(true);
                    try {
                      await handleAddMarket(e);
                    } finally {
                      setIsAdding(false);
                    }
                  }} className="space-y-3.5 sm:space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Market Date</Label>
                      <MonthCalendarPicker
                        name="date"
                        value={marketDate}
                        onChange={setMarketDate}
                        selectedMonth={activeMonthYear}
                        accentColor="amber"
                        required
                      />
                    </div>
                    <div className="space-y-1.5"><Label className="text-xs font-semibold">Marketer</Label><select name="marketerId" className="w-full h-10 px-3 rounded-xl text-sm font-medium focus:outline-none" style={{ background: 'oklch(0.18 0.02 260)', border: '1px solid oklch(1 0 0 / 12%)', color: 'oklch(0.93 0.01 260)' }} required>{data.members.map((m: any) => <option key={m.member.id} value={m.member.id} style={{ background: 'oklch(0.18 0.02 260)' }}>{m.member.user.name} (Room {m.member.roomNo})</option>)}</select></div>
                    <div className="space-y-1.5"><Label className="text-xs font-semibold">Amount (Tk)</Label><Input name="amount" type="number" placeholder="2500" required className="h-10 sm:h-11 rounded-xl bg-white/5 border-white/10 text-foreground" /></div>
                    <Button type="submit" disabled={isAdding} className="w-full h-10 sm:h-11 font-bold btn-glow touch-manipulation">{isAdding ? "Saving..." : "Save Market Entry"}</Button>
                  </form>
                </DialogContent>
              </Dialog>
              <Dialog open={isEditMarketDialogOpen} onOpenChange={(open) => { setIsEditMarketDialogOpen(open); if (!open) setEditingMarket(null); }}>
                <DialogContent className="rounded-2xl mx-auto w-[95vw] sm:max-w-md max-h-[90dvh] overflow-y-auto overscroll-contain p-3.5 sm:p-5">
                  <DialogHeader><DialogTitle className="font-bold">Edit Market Entry</DialogTitle><DialogDescription>Modify existing market details.</DialogDescription></DialogHeader>
                  {editingMarket && (
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      setIsEditing(true);
                      try {
                        await handleEditMarket(e);
                      } finally {
                        setIsEditing(false);
                      }
                    }} className="space-y-3 pt-2">
                      <input type="hidden" name="id" value={editingMarket.id} />
                      <div className="space-y-1.5"><Label className="text-xs font-semibold">Market Date</Label><Input type="date" defaultValue={new Date(editingMarket.date).toISOString().split('T')[0]} disabled className="h-10 rounded-xl bg-white/5 border-white/10 text-muted-foreground opacity-60" /><p className="text-xs text-muted-foreground">Date cannot be changed.</p></div>
                      <div className="space-y-1.5"><Label className="text-xs font-semibold">Marketer</Label><select name="marketerId" defaultValue={editingMarket.marketerId} className="w-full h-10 px-3 rounded-xl text-sm font-medium focus:outline-none" style={{ background: 'oklch(0.18 0.02 260)', border: '1px solid oklch(1 0 0 / 12%)', color: 'oklch(0.93 0.01 260)' }} required>{data.members.map((m: any) => <option key={m.member.id} value={m.member.id} style={{ background: 'oklch(0.18 0.02 260)' }}>{m.member.user.name} (Room {m.member.roomNo})</option>)}</select></div>
                      <div className="space-y-1.5"><Label className="text-xs font-semibold">Amount (Tk)</Label><Input name="amount" type="number" defaultValue={editingMarket.amount} required className="h-10 rounded-xl bg-white/5 border-white/10 text-foreground" /></div>
                      <Button type="submit" disabled={isEditing} className="w-full h-10 font-bold btn-glow">{isEditing ? "Updating..." : "Update Market Entry"}</Button>
                    </form>
                  )}
                </DialogContent>
              </Dialog>
            </div>
            <div className="section-panel">
              <div className="table-responsive">
                <table className="data-table">
                  <thead><tr><th>Date</th><th>Marketer</th><th>Amount (Tk)</th><th className="text-center">Day Rate</th><th className="text-right">Action</th></tr></thead>
                  <tbody>
                    {data.markets.map((m: any) => {
                      const mem = data.members.find((mem: any) => mem.member.id === m.marketerId);
                      const marketerName = mem?.member.user.name || "Unknown";
                      return (
                        <tr key={m.id}>
                          <td className="font-medium">
                            {new Date(m.date).toLocaleDateString()} <span className="text-muted-foreground text-xs">({new Date(m.date).toLocaleDateString('en-US', { weekday: 'short' })})</span>
                          </td>
                          <td className="font-semibold text-foreground">{marketerName}</td>
                          <td className="font-bold" style={{ color: 'oklch(0.70 0.19 162)' }}>৳ {m.amount.toLocaleString()}</td>
                          <td className="text-center">
                            <div className="flex flex-col items-center">
                              <span className="font-medium">৳ {(m.perDayMealRate || 0).toFixed(2)}</span>
                              <span className="text-[10px] text-muted-foreground">({m.totalMealsOnDate || 0} meals)</span>
                            </div>
                          </td>
                          <td className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button variant="outline" size="sm" onClick={() => { setEditingMarket(m); setIsEditMarketDialogOpen(true); }} className="h-7 px-2.5 text-xs rounded-lg border-white/10 hover:bg-white/5 text-muted-foreground">Edit</Button>
                              <Button variant="destructive" size="sm" disabled={deletingId === m.id} onClick={async () => { if (confirm("Delete this market entry?")) { setDeletingId(m.id); try { const fd = new FormData(); fd.append("id", m.id); await deleteMarketEntry(fd); await fetchData(undefined, false, true); } finally { setDeletingId(null); } } }} className="h-7 px-2.5 text-xs rounded-lg">{deletingId === m.id ? "..." : "Delete"}</Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
    </>
  );
}

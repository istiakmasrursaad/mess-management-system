"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDiningCalc, updateDiningCalc } from "@/app/actions/dining-calc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Loader2, Calculator } from "lucide-react";
import { toast } from "react-toastify";

export function DiningCalcCard({ selectedMonth }: { selectedMonth: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [depositAmount, setDepositAmount] = useState(0);
  const [previousRemaining, setPreviousRemaining] = useState(0);
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    if (selectedMonth) {
      loadData(selectedMonth);
    }
  }, [selectedMonth]);

  const loadData = async (monthStr: string) => {
    setLoading(true);
    try {
      const data = await getDiningCalc(monthStr);
      if (data) {
        setDepositAmount(data.depositAmount);
        setPreviousRemaining(data.previousRemaining);
        setTotalCost(data.totalCost);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDiningCalc(selectedMonth, depositAmount, totalCost);
      await loadData(selectedMonth); // Reload local state
      router.refresh(); // Refresh Next.js server cache
      toast.success("Dining Calculation saved successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const totalDeposit = previousRemaining + depositAmount;
  const remainingAmount = totalDeposit - totalCost;

  if (!selectedMonth) return null;

  return (
    <div
      className="w-full mb-4 rounded-2xl p-3.5 border-l-4"
      style={{
        background: 'oklch(0.16 0.018 260 / 90%)',
        backdropFilter: 'blur(12px)',
        border: '1px solid oklch(1 0 0 / 10%)',
        borderLeftColor: 'oklch(0.65 0.25 275)',
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 font-bold text-foreground shrink-0">
          <Calculator className="w-5 h-5" style={{ color: 'oklch(0.65 0.25 275)' }} />
          <span>Dining Charge ({selectedMonth}):</span>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 py-1 text-xs text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'oklch(0.65 0.25 275)' }} /> Loading...
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs" style={{ background: 'oklch(0.20 0.02 260)', border: '1px solid oklch(1 0 0 / 10%)' }}>
              <span className="text-muted-foreground font-medium">Prev Rem:</span>
              <span className="font-bold text-foreground">৳ {previousRemaining}</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground font-medium whitespace-nowrap">Deposit:</span>
              <Input 
                type="number" 
                value={depositAmount} 
                onChange={(e) => setDepositAmount(Number(e.target.value))} 
                min="0" step="0.01"
                className="w-24 h-9 text-xs rounded-xl text-foreground font-semibold"
                style={{ background: 'oklch(0.18 0.02 260)', border: '1px solid oklch(1 0 0 / 15%)' }}
              />
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs" style={{ background: 'oklch(0.65 0.25 275 / 12%)', border: '1px solid oklch(0.65 0.25 275 / 25%)', color: 'oklch(0.75 0.20 275)' }}>
              <span className="font-medium">Total Avail:</span>
              <span className="font-bold">৳ {totalDeposit.toFixed(2)}</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground font-medium whitespace-nowrap">Total Cost:</span>
              <Input 
                type="number" 
                value={totalCost} 
                onChange={(e) => setTotalCost(Number(e.target.value))} 
                min="0" step="0.01"
                className="w-24 h-9 text-xs rounded-xl text-foreground font-semibold"
                style={{ background: 'oklch(0.18 0.02 260)', border: '1px solid oklch(1 0 0 / 15%)' }}
              />
            </div>

            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
              style={remainingAmount < 0
                ? { background: 'oklch(0.65 0.24 27 / 12%)', border: '1px solid oklch(0.65 0.24 27 / 30%)', color: 'oklch(0.70 0.22 27)' }
                : { background: 'oklch(0.70 0.19 162 / 12%)', border: '1px solid oklch(0.70 0.19 162 / 30%)', color: 'oklch(0.72 0.17 162)' }
              }
            >
              <span>Remaining:</span>
              <span>৳ {remainingAmount.toFixed(2)}</span>
            </div>

            <Button
              onClick={handleSave}
              disabled={loading || saving}
              size="sm"
              className="rounded-xl h-9 px-4 text-xs font-bold text-white btn-glow"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
              Save
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}


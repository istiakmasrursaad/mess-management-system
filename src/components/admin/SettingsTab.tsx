"use client";
import { toggleApplyDefaultBills } from "@/app/actions/mess";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings, Lock } from "lucide-react";


export default function SettingsTab({ props }: { props: any }) {
  const { settingsForm, setSettingsForm, fetchData, handleUpdateSettings } = props;

  return (
    <>
      <div className="max-w-2xl mx-auto section-panel">
              <div className="section-panel-header">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Mess Rules &amp; System Configuration</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Dynamically recalculates meal multipliers, fines, and deadlines.</p>
                </div>
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: 'oklch(0.18 0.02 260)', border: '1px solid oklch(1 0 0 / 10%)' }}>
                  <div className="flex flex-col">
                    <Label htmlFor="applyDefaultBills" className="font-bold text-xs text-foreground">Apply Default Bills</Label>
                    <span className="text-[10px] text-muted-foreground">If off, all overhead bills = 0</span>
                  </div>
                  <Switch
                    id="applyDefaultBills"
                    checked={settingsForm.applyDefaultBills}
                    onCheckedChange={async (checked) => {
                      setSettingsForm({ ...settingsForm, applyDefaultBills: checked });
                      await toggleApplyDefaultBills(checked);
                      fetchData();
                    }}
                  />
                </div>
              </div>
              <div className="p-5">
                <form onSubmit={handleUpdateSettings} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Default Daily Meal Threshold</Label>
                    <Input type="number" step="0.1" value={isNaN(settingsForm.defaultDailyMealThreshold) ? "" : settingsForm.defaultDailyMealThreshold}
                      onChange={(e) => setSettingsForm({ ...settingsForm, defaultDailyMealThreshold: e.target.value === "" ? 0 : (parseFloat(e.target.value) || 0) })}
                      required className="h-10 rounded-xl bg-white/5 border-white/10 focus:border-white/25 text-foreground" />
                    <p className="text-xs text-muted-foreground">Standard daily baseline (Default: 2.5 meals)</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Need X2 Extra Meal Limit</Label>
                    <Input type="number" value={isNaN(settingsForm.needX2MealLimit) ? "" : settingsForm.needX2MealLimit}
                      onChange={(e) => setSettingsForm({ ...settingsForm, needX2MealLimit: e.target.value === "" ? 0 : (parseInt(e.target.value) || 0) })}
                      required className="h-10 rounded-xl bg-white/5 border-white/10 focus:border-white/25 text-foreground" />
                    <p className="text-xs text-muted-foreground">Threshold to trigger 2× overhead bills (Default: 7 meals)</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Khala Bill', key: 'defaultKhalaBill' as const },
                      { label: 'Manager Bill', key: 'defaultManagerBill' as const },
                      { label: 'Gas Bill', key: 'defaultGasBill' as const },
                      { label: 'Paper Bill', key: 'defaultPaperBill' as const },
                      { label: 'Current Bill', key: 'defaultCurrentBill' as const },
                      { label: 'Festival Bill', key: 'defaultFestivalBill' as const },
                    ].map(({ label, key }) => (
                      <div key={key} className="space-y-1.5">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</Label>
                        <Input type="number" value={isNaN(settingsForm[key] as number) ? "" : settingsForm[key]}
                          onChange={(e) => setSettingsForm({ ...settingsForm, [key]: e.target.value === "" ? 0 : (parseFloat(e.target.value) || 0) })}
                          required className="h-10 rounded-xl bg-white/5 border-white/10 focus:border-white/25 text-foreground" />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Default Market Fine (Tk)</Label>
                    <Input type="number" value={isNaN(settingsForm.defaultMarketFine) ? "" : settingsForm.defaultMarketFine}
                      onChange={(e) => setSettingsForm({ ...settingsForm, defaultMarketFine: e.target.value === "" ? 0 : (parseFloat(e.target.value) || 0) })}
                      required className="h-10 rounded-xl bg-white/5 border-white/10 focus:border-white/25 text-foreground" />
                    <p className="text-xs text-muted-foreground">Auto-fine for members with 0 markets (Default: 130 Tk)</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Extra Market Allowance Rate (Tk/Day)</Label>
                    <Input type="number" value={isNaN(settingsForm.extraMarketRate) ? "" : settingsForm.extraMarketRate}
                      onChange={(e) => setSettingsForm({ ...settingsForm, extraMarketRate: e.target.value === "" ? 0 : (parseFloat(e.target.value) || 0) })}
                      required className="h-10 rounded-xl bg-white/5 border-white/10 focus:border-white/25 text-foreground" />
                    <p className="text-xs text-muted-foreground">Allowance per extra market duty (Default: 130 Tk)</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Daily Meal Cutoff Time</Label>
                    <Input type="time" value={settingsForm.mealCutoffTime}
                      onChange={(e) => setSettingsForm({ ...settingsForm, mealCutoffTime: e.target.value })}
                      required className="h-10 rounded-xl bg-white/5 border-white/10 focus:border-white/25 text-foreground" />
                    <p className="text-xs text-muted-foreground">Lock time for next-day meal toggles (Default: 10:00 PM)</p>
                  </div>
                  <Button type="submit" className="w-full h-10 text-sm font-bold btn-glow mt-2">Save Mess Rules</Button>
                </form>
              </div>
            </div>
    </>
  );
}

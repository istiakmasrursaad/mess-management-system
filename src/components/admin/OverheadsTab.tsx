"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";


export default function OverheadsTab({ props }: { props: any }) {
  const { data, handleSaveFineOverride, handleRevertFineOverride } = props;

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
                  <thead><tr><th>Member</th><th className="hidden sm:table-cell">Markets</th><th>Fine</th><th>Override</th></tr></thead>
                  <tbody>
                    {data.members.map((m: any) => (
                      <tr key={m.member.id}>
                        <td className="font-semibold text-foreground">{m.member.user.name}</td>
                        <td className="hidden sm:table-cell font-medium">{m.totalMarketsCount}</td>
                        <td className="font-bold">
                          <span style={{ color: 'oklch(0.68 0.22 27)' }}>৳ {m.marketFine}</span>
                          {m.isFineOverridden && <span className="text-xs text-muted-foreground ml-1">(Edited)</span>}
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <Input type="number" defaultValue={m.marketFine} id={`fine-${m.member.id}`} className="w-20 h-8 text-xs rounded-lg bg-white/5 border-white/10 text-foreground" />
                            <Button size="sm" variant="outline" onClick={() => { const input = document.getElementById(`fine-${m.member.id}`) as HTMLInputElement; if (input && input.value !== "") { const val = parseFloat(input.value); if (!isNaN(val)) handleSaveFineOverride(m.member.id, val); } }} className="h-8 px-2.5 text-xs rounded-lg border-white/10 hover:bg-white/5">Save</Button>
                            {m.isFineOverridden && (
                              <Button size="sm" variant="ghost" onClick={() => handleRevertFineOverride(m.member.id)} className="h-8 px-2.5 text-xs rounded-lg" style={{ color: 'oklch(0.68 0.22 27)' }}>Revert</Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
    </>
  );
}

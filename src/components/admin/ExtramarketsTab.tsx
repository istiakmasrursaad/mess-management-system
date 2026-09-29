"use client";

import React from "react";


export default function ExtramarketsTab({ props }: { props: any }) {
  const { data } = props;

  return (
    <>
      <div className="section-panel">
              <div className="section-panel-header">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Extra Market Summary</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Members who performed extra market duties this month</p>
                </div>
                <span className="badge-amber">Admin Module</span>
              </div>
              <div className="table-responsive">
                <table className="data-table">
                  <thead><tr><th>Member</th><th className="hidden sm:table-cell">Room</th><th>Markets</th><th className="hidden sm:table-cell">Extra Days</th><th>Allowance (Tk)</th><th>Status</th></tr></thead>
                  <tbody>
                    {data.members.map((m: any) => (
                      <tr key={m.member.id}>
                        <td className="font-semibold text-foreground">{m.member.user.name}</td>
                        <td className="hidden sm:table-cell"><span className="badge-indigo">{m.member.roomNo}</span></td>
                        <td className="font-bold">{m.totalMarketsCount}</td>
                        <td className="hidden sm:table-cell font-medium">{m.extraMarketDays}</td>
                        <td className="font-bold" style={{ color: 'oklch(0.70 0.19 162)' }}>৳ {m.extraMarketAllowance}</td>
                        <td>
                          {m.extraMarketDays > 0 ? <span className="badge-emerald">+{m.extraMarketDays} Extra</span>
                           : m.totalMarketsCount === 1 ? <span className="badge-cyan">Standard 1</span>
                           : <span className="badge-rose">0 Markets</span>}
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

"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserPlus, ShieldCheck, Trash2 } from "lucide-react";


export default function ManageadminsTab({ props }: { props: any }) {
  const { data, managers, isAddManagerOpen, setIsAddManagerOpen, managerForm, setManagerForm, managerError, setManagerError, handleAddManager, handleRemoveManager } = props;
  const [isAdding, setIsAdding] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" style={{ color: 'oklch(0.68 0.22 27)' }} />
                  <div>
                    <h2 className="text-sm font-bold text-foreground">Manage Admins &amp; Managers</h2>
                    <p className="text-xs text-muted-foreground">System users who access Admin panel (not counted in meal tracking)</p>
                  </div>
                </div>
                <Button size="sm" className="h-9 px-3 text-xs font-bold gap-1.5 rounded-xl" style={{ background: 'linear-gradient(135deg, oklch(0.55 0.26 27), oklch(0.50 0.23 20))' }}
                  onClick={() => { setManagerError(""); setIsAddManagerOpen(true); }}>
                  <UserPlus className="w-3.5 h-3.5" /> Add Manager
                </Button>
              </div>

              <Dialog open={isAddManagerOpen} onOpenChange={setIsAddManagerOpen}>
                <DialogContent className="rounded-2xl mx-4 sm:mx-auto max-w-md">
                  <DialogHeader>
                    <DialogTitle className="font-bold">Add Manager</DialogTitle>
                    <DialogDescription>Create a new admin/manager account.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    setIsAdding(true);
                    try {
                      await handleAddManager(e);
                    } finally {
                      setIsAdding(false);
                    }
                  }} className="space-y-3 pt-2">
                    {managerError && <p className="text-xs text-red-500 bg-red-500/10 p-2 rounded">{managerError}</p>}
                    <div className="space-y-1.5"><Label className="text-xs font-semibold">Name</Label><Input name="name" value={managerForm.name} onChange={(e) => setManagerForm({...managerForm, name: e.target.value})} placeholder="Manager Name" required className="h-10 rounded-xl bg-white/5 border-white/10 text-foreground" /></div>
                    <div className="space-y-1.5"><Label className="text-xs font-semibold">Email</Label><Input name="email" type="email" value={managerForm.email} onChange={(e) => setManagerForm({...managerForm, email: e.target.value})} placeholder="manager@mess.com" required className="h-10 rounded-xl bg-white/5 border-white/10 text-foreground" /></div>
                    <div className="space-y-1.5"><Label className="text-xs font-semibold">Phone</Label><Input name="phone" value={managerForm.phone} onChange={(e) => setManagerForm({...managerForm, phone: e.target.value})} placeholder="017XXXXXXXX" className="h-10 rounded-xl bg-white/5 border-white/10 text-foreground" /></div>
                    <div className="space-y-1.5"><Label className="text-xs font-semibold">Password</Label><Input name="password" type="password" value={managerForm.password} onChange={(e) => setManagerForm({...managerForm, password: e.target.value})} placeholder="Password" required className="h-10 rounded-xl bg-white/5 border-white/10 text-foreground" /></div>
                    <div className="space-y-1.5"><Label className="text-xs font-semibold">Role</Label>
                      <select name="role" value={managerForm.role} onChange={(e) => setManagerForm({...managerForm, role: e.target.value})} className="flex h-10 w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                        <option value="ADMIN" className="bg-zinc-900">Admin</option>
                        <option value="MANAGER" className="bg-zinc-900">Manager</option>
                      </select>
                    </div>
                    <Button type="submit" disabled={isAdding} className="w-full h-10 font-bold btn-glow">{isAdding ? "Adding..." : "Add Manager"}</Button>
                  </form>
                </DialogContent>
              </Dialog>

              <div className="section-panel mt-4">
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Phone</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {managers.map((m: any) => (
                        <tr key={m.id}>
                          <td className="font-semibold text-foreground">{m.name}</td>
                          <td>{m.email}</td>
                          <td><span className={m.role === 'SUPER_ADMIN' ? 'badge-rose' : 'badge-indigo'}>{m.role}</span></td>
                          <td>{m.phone || '-'}</td>
                          <td className="text-right">
                            {m.role !== 'SUPER_ADMIN' && (
                              <Button variant="ghost" size="sm" disabled={deletingId === m.id} onClick={async () => {
                                setDeletingId(m.id);
                                try {
                                  await handleRemoveManager(m.id, m.name);
                                } finally {
                                  setDeletingId(null);
                                }
                              }} className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg">
                                {deletingId === m.id ? "..." : <Trash2 className="w-4 h-4" />}
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {managers.length === 0 && (
                        <tr><td colSpan={5} className="text-center py-4 text-muted-foreground">No managers found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
    </>
  );
}

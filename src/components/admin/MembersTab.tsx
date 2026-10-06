"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserPlus, FilePen } from "lucide-react";


export default function MembersTab({ props }: { props: any }) {
  const { data, isMemberDialogOpen, setIsMemberDialogOpen, editingMember, setEditingMember, isEditMemberDialogOpen, setIsEditMemberDialogOpen, editingMemberInfo, setEditingMemberInfo, editMemberForm, setEditMemberForm, editMemberError, setEditMemberError, addMemberForm, setAddMemberForm, membersList, draggedIdx, handleDragStart, handleDragOver, handleDragEnd, handleRemoveMember, openEditMemberDialog, handleEditMember, handleAddMember } = props;
  const [isAdding, setIsAdding] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="text-sm font-bold text-foreground">Registered Mess Members</h2>
              <Dialog open={isMemberDialogOpen} onOpenChange={(open) => {
                setIsMemberDialogOpen(open);
                if (!open) setAddMemberForm({ name: "", emailPrefix: "", emailSuffix: "@gmail.com" });
              }}>
                <Button className="gap-2 btn-glow h-9 text-xs" onClick={() => setIsMemberDialogOpen(true)}><UserPlus className="w-3.5 h-3.5" /> Add New Member</Button>
                <DialogContent className="rounded-2xl mx-4 sm:mx-auto max-w-md">
                  <DialogHeader>
                    <DialogTitle className="font-bold">Register New Mess Member</DialogTitle>
                    <DialogDescription>Add a new member to the active mess roll.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    setIsAdding(true);
                    try {
                      await handleAddMember(e);
                    } finally {
                      setIsAdding(false);
                    }
                  }} className="space-y-3 pt-2">
                    <div className="space-y-1.5"><Label className="text-xs font-semibold">Full Name</Label><Input name="name" value={addMemberForm.name} onChange={(e) => { const name = e.target.value; const emailPrefix = name.replace(/\s+/g, "_").toLowerCase(); setAddMemberForm((prev: any) => ({ ...prev, name, emailPrefix })); }} placeholder="Member Name" required className="h-10 rounded-xl bg-white/5 border-white/10 text-foreground" /></div>
                    <div className="space-y-1.5"><Label className="text-xs font-semibold">Email Address</Label>
                      <div className="flex gap-2">
                        <Input value={addMemberForm.emailPrefix} onChange={(e) => setAddMemberForm({...addMemberForm, emailPrefix: e.target.value})} placeholder="username" required className="h-10 flex-1 rounded-xl bg-white/5 border-white/10 text-foreground" />
                        <Input value={addMemberForm.emailSuffix} onChange={(e) => setAddMemberForm({...addMemberForm, emailSuffix: e.target.value})} className="h-10 w-32 rounded-xl bg-white/5 border-white/10 text-foreground" />
                      </div>
                      <input type="hidden" name="email" value={`${addMemberForm.emailPrefix}${addMemberForm.emailSuffix}`} />
                    </div>
                    <div className="space-y-1.5"><Label className="text-xs font-semibold">Phone Number (Optional)</Label><Input name="phone" placeholder="017XXXXXXXX" className="h-10 rounded-xl bg-white/5 border-white/10 text-foreground" /></div>
                    <div className="space-y-1.5"><Label className="text-xs font-semibold">Room No</Label><Input name="roomNo" placeholder="204" required className="h-10 rounded-xl bg-white/5 border-white/10 text-foreground" /></div>
                    <div className="space-y-1.5"><Label className="text-xs font-semibold">Initial Password</Label><Input name="password" type="text" defaultValue="password123" required className="h-10 rounded-xl bg-white/5 border-white/10 text-foreground" /></div>
                    <Button type="submit" disabled={isAdding} className="w-full h-10 font-bold btn-glow">{isAdding ? "Registering..." : "Register Member"}</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Edit Member Dialog */}
            <Dialog open={isEditMemberDialogOpen} onOpenChange={(open) => {
              setIsEditMemberDialogOpen(open);
              if (!open) { setEditingMemberInfo(null); setEditMemberError(""); }
            }}>
              <DialogContent className="rounded-2xl mx-4 sm:mx-auto max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-bold">Edit Member Info</DialogTitle>
                  <DialogDescription>Update name, email, and phone number.</DialogDescription>
                </DialogHeader>
                {editingMemberInfo && (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    setIsEditing(true);
                    try {
                      await handleEditMember(e);
                    } finally {
                      setIsEditing(false);
                    }
                  }} className="space-y-3 pt-2">
                    <div className="space-y-1.5"><Label className="text-xs font-semibold">Full Name</Label><Input value={editMemberForm.name} onChange={(e) => setEditMemberForm({ ...editMemberForm, name: e.target.value })} placeholder="Member Name" required className="h-10 rounded-xl bg-white/5 border-white/10 text-foreground" /></div>
                    <div className="space-y-1.5"><Label className="text-xs font-semibold">Email Address</Label><Input type="email" value={editMemberForm.email} onChange={(e) => setEditMemberForm({ ...editMemberForm, email: e.target.value })} placeholder="user@mess.com" required className="h-10 rounded-xl bg-white/5 border-white/10 text-foreground" /></div>
                    <div className="space-y-1.5"><Label className="text-xs font-semibold">Phone Number (Optional)</Label><Input value={editMemberForm.phone} onChange={(e) => setEditMemberForm({ ...editMemberForm, phone: e.target.value })} placeholder="017XXXXXXXX" className="h-10 rounded-xl bg-white/5 border-white/10 text-foreground" /></div>
                    <div className="space-y-1.5"><Label className="text-xs font-semibold">New Password (Leave blank to keep same)</Label><Input type="text" value={editMemberForm.password} onChange={(e) => setEditMemberForm({ ...editMemberForm, password: e.target.value })} placeholder="New Password" className="h-10 rounded-xl bg-white/5 border-white/10 text-foreground" /></div>
                    {editMemberError && <p className="text-sm font-medium" style={{ color: 'oklch(0.68 0.22 27)' }}>{editMemberError}</p>}
                    <Button type="submit" disabled={isEditing} className="w-full h-10 font-bold btn-glow">{isEditing ? "Saving..." : "Save Changes"}</Button>
                  </form>
                )}
              </DialogContent>
            </Dialog>

            <div className="section-panel">
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="w-12 text-center">#</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th className="hidden sm:table-cell">Phone</th>
                      <th>Room</th>
                      <th className="hidden md:table-cell">Role</th>
                      <th>Status</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {membersList.map((m: any, index: number) => (
                      <tr
                        key={m.member.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`cursor-move ${draggedIdx === index ? 'opacity-40' : ''}`}
                      >
                        <td className="text-center font-bold text-muted-foreground">{index + 1}</td>
                        <td className="font-semibold text-foreground">{m.member.user.name}</td>
                        <td className="text-sm text-muted-foreground">{m.member.user.email}</td>
                        <td className="hidden sm:table-cell text-muted-foreground">{m.member.phone}</td>
                        <td><span className="badge-indigo">{m.member.roomNo}</span></td>
                        <td className="hidden md:table-cell"><span className="badge-cyan">{m.member.user.role}</span></td>
                        <td><span className="badge-emerald">Active</span></td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button onClick={() => openEditMemberDialog(m)} variant="outline" size="sm"
                              className="h-7 px-2.5 text-xs rounded-lg font-semibold gap-1 border-indigo-500/40 hover:bg-indigo-500/10 text-indigo-400 hover:text-indigo-300">
                              <FilePen className="w-3 h-3" /> Edit
                            </Button>
                            <Button onClick={async () => {
                              if (confirm("Are you sure you want to remove this member? All their data will be deleted.")) {
                                setDeletingId(m.member.id);
                                try {
                                  await handleRemoveMember(m.member.id);
                                } finally {
                                  setDeletingId(null);
                                }
                              }
                            }} disabled={deletingId === m.member.id} variant="destructive" size="sm"
                              className="h-7 px-2.5 text-xs rounded-lg font-semibold">
                              {deletingId === m.member.id ? "..." : "Remove"}
                            </Button>
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

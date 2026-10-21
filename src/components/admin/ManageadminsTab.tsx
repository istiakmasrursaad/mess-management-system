"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  UserPlus,
  ShieldCheck,
  Trash2,
  Pencil,
  Camera,
  X,
  Eye,
  EyeOff,
  UserCheck,
  User,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

// Helper function to process & compress image into 256x256 WebP data URL
function processImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please select an image file (JPG, PNG, WebP)."));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxSize = 256;
        const canvas = document.createElement("canvas");
        canvas.width = maxSize;
        canvas.height = maxSize;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        // Center crop to square
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, maxSize, maxSize);
        const dataUrl = canvas.toDataURL("image/webp", 0.88);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Failed to load image."));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.readAsDataURL(file);
  });
}

export default function ManageadminsTab({ props }: { props: any }) {
  const {
    managers,
    isAddManagerOpen,
    setIsAddManagerOpen,
    managerForm,
    setManagerForm,
    managerError,
    setManagerError,
    handleAddManager,
    handleRemoveManager,
    handleUpdateManager
  } = props;

  // Local state for Add Manager dialog
  const [isAdding, setIsAdding] = useState(false);
  const [showAddPassword, setShowAddPassword] = useState(false);
  const addFileInputRef = useRef<HTMLInputElement>(null);

  // Local state for Edit Manager dialog
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingManager, setEditingManager] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    id: "",
    name: "",
    email: "",
    password: "",
    role: "ADMIN",
    image: "" as string | null
  });
  const [editError, setEditError] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Deleting indicator
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Open Edit Dialog
  const openEditDialog = (m: any) => {
    setEditingManager(m);
    setEditForm({
      id: m.id,
      name: m.name || "",
      email: m.email || "",
      password: "",
      role: m.role || "ADMIN",
      image: m.image || null
    });
    setEditError("");
    setShowEditPassword(false);
    setIsEditOpen(true);
  };

  // Handle Photo selection for Edit
  const handleEditPhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await processImageFile(file);
      setEditForm(prev => ({ ...prev, image: dataUrl }));
    } catch (err: any) {
      setEditError(err.message || "Failed to process image.");
    }
  };

  // Handle Photo selection for Add
  const handleAddPhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await processImageFile(file);
      setManagerForm((prev: any) => ({ ...prev, image: dataUrl }));
    } catch (err: any) {
      setManagerError(err.message || "Failed to process image.");
    }
  };

  // Submit Edit form
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      setEditError("Name is required.");
      return;
    }
    setIsSavingEdit(true);
    setEditError("");
    try {
      const formData = new FormData();
      formData.append("id", editForm.id);
      formData.append("name", editForm.name.trim());
      formData.append("email", editForm.email.trim());
      if (editForm.password.trim()) {
        formData.append("password", editForm.password.trim());
      }
      formData.append("role", editForm.role);
      
      // Image update: if null (removed), send "__REMOVE__"; if data string, send string; if untouched, send current
      if (editForm.image === null) {
        formData.append("image", "__REMOVE__");
      } else if (editForm.image) {
        formData.append("image", editForm.image);
      }

      const res = await handleUpdateManager(formData);
      if (res?.success) {
        setIsEditOpen(false);
        setEditingManager(null);
      } else if (res?.error) {
        setEditError(res.error);
      }
    } catch (err: any) {
      setEditError(err.message || "Something went wrong.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <>
      {/* ── Section Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 rounded-2xl"
        style={{
          background: "linear-gradient(135deg, rgba(30, 27, 75, 0.6) 0%, rgba(15, 23, 42, 0.75) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(16px)"
        }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
            style={{ background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)" }}>
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
              Manage Admins &amp; Managers
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                Super Admin Only
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              System administrators with full panel access (separate from meal calculation)
            </p>
          </div>
        </div>
        <Button
          size="sm"
          className="h-10 px-4 text-xs font-bold gap-2 rounded-xl text-white shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-95"
          style={{ background: "linear-gradient(135deg, #7c3aed 0%, #0284c7 100%)" }}
          onClick={() => {
            setManagerError("");
            setManagerForm({ name: "", email: "", phone: "", password: "", role: "ADMIN", image: "" });
            setIsAddManagerOpen(true);
          }}
        >
          <UserPlus className="w-4 h-4" /> Add Manager
        </Button>
      </div>

      {/* ── Admins Table Card ── */}
      <div className="rounded-2xl overflow-hidden mt-4 transition-all duration-200 shadow-xl"
        style={{
          background: "linear-gradient(135deg, rgba(30, 27, 75, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(16px)"
        }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[11px] font-bold uppercase tracking-wider text-slate-400"
                style={{ background: "rgba(255, 255, 255, 0.02)" }}>
                <th className="py-3.5 px-4">Admin / Manager</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4 hidden sm:table-cell">Phone</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {managers.map((m: any) => {
                const initials = (m.name || "A")
                  .split(" ")
                  .map((w: string) => w[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                const isSuperAdmin = m.role === "SUPER_ADMIN";

                return (
                  <tr key={m.id} className="hover:bg-white/[0.03] transition-colors duration-150">
                    {/* Admin Profile & Info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black text-white shadow-md overflow-hidden"
                            style={{
                              background: isSuperAdmin
                                ? "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)"
                                : "linear-gradient(135deg, #0284c7 0%, #0d9488 100%)",
                              border: "1px solid rgba(255, 255, 255, 0.2)"
                            }}
                          >
                            {m.image ? (
                              <img src={m.image} alt={m.name} className="w-full h-full object-cover" />
                            ) : (
                              initials
                            )}
                          </div>
                        </div>

                        {/* Name & Email */}
                        <div className="min-w-0">
                          <div className="font-extrabold text-white text-sm flex items-center gap-1.5 truncate">
                            {m.name}
                          </div>
                          <div className="text-xs text-slate-400 truncate">
                            {m.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role Badge */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider"
                        style={{
                          background: isSuperAdmin ? "rgba(139, 92, 246, 0.2)" : "rgba(14, 165, 233, 0.2)",
                          color: isSuperAdmin ? "#c4b5fd" : "#7dd3fc",
                          border: `1px solid ${isSuperAdmin ? "rgba(139, 92, 246, 0.35)" : "rgba(14, 165, 233, 0.35)"}`
                        }}
                      >
                        {isSuperAdmin ? <ShieldCheck className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                        {isSuperAdmin ? "Super Admin" : "Admin / Manager"}
                      </span>
                    </td>

                    {/* Phone */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-300 text-xs hidden sm:table-cell">
                      {m.phone || m.member?.phone || "—"}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Edit Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(m)}
                          title="Edit Name, Password, or Profile Picture"
                          className="h-8 px-2.5 text-xs font-semibold gap-1.5 rounded-lg text-sky-300 hover:text-white hover:bg-sky-500/20 border border-sky-500/30 transition-all duration-150"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </Button>

                        {/* Delete Button (Only for non-superadmins) */}
                        {!isSuperAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={deletingId === m.id}
                            onClick={async () => {
                              setDeletingId(m.id);
                              try {
                                await handleRemoveManager(m.id, m.name);
                              } finally {
                                setDeletingId(null);
                              }
                            }}
                            title="Remove Manager"
                            className="h-8 w-8 p-0 text-red-400 hover:text-red-200 hover:bg-red-500/20 rounded-lg border border-red-500/20 transition-all duration-150"
                          >
                            {deletingId === m.id ? (
                              <span className="animate-spin text-xs">...</span>
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {managers.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-slate-400">
                    No managers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          EDIT ADMIN / MANAGER MODAL DIALOG
      ═════════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent
          className="rounded-3xl mx-4 sm:mx-auto max-w-md p-5 sm:p-6 text-white border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full"
          style={{
            background: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255, 255, 255, 0.12)"
          }}
        >
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-sky-500/20 border border-sky-500/30 text-sky-400">
                <Pencil className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-white">Edit Admin Profile</DialogTitle>
                <DialogDescription className="text-xs text-slate-400">
                  Update name, password, or profile picture.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmitEdit} className="space-y-4 pt-2">
            {editError && (
              <div className="p-3 rounded-xl text-xs font-semibold text-red-300 bg-red-500/15 border border-red-500/30 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{editError}</span>
              </div>
            )}

            {/* Profile Picture Upload & Preview */}
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/[0.03] border border-white/10 gap-3">
              <input
                type="file"
                ref={editFileInputRef}
                accept="image/*"
                onChange={handleEditPhotoSelect}
                className="hidden"
              />

              <div className="relative group">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-xl overflow-hidden cursor-pointer"
                  style={{
                    background: editForm.role === "SUPER_ADMIN"
                      ? "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)"
                      : "linear-gradient(135deg, #0284c7 0%, #0d9488 100%)",
                    border: "2px solid rgba(255, 255, 255, 0.25)"
                  }}
                  onClick={() => editFileInputRef.current?.click()}
                >
                  {editForm.image ? (
                    <img src={editForm.image} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span>
                      {(editForm.name || "A")
                        .split(" ")
                        .map(w => w[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </span>
                  )}
                </div>

                {/* Upload camera button overlay */}
                <button
                  type="button"
                  onClick={() => editFileInputRef.current?.click()}
                  title="Upload / Change Photo"
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-sky-500 hover:bg-sky-400 text-white flex items-center justify-center shadow-lg border-2 border-slate-900 transition-transform active:scale-90"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => editFileInputRef.current?.click()}
                  className="h-8 px-3 text-xs font-semibold bg-white/5 border-white/10 text-slate-200 hover:text-white hover:bg-white/10 rounded-xl"
                >
                  <Camera className="w-3.5 h-3.5 mr-1 text-sky-400" />
                  {editForm.image ? "Change Photo" : "Upload Photo"}
                </Button>
                {editForm.image && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditForm(prev => ({ ...prev, image: null }))}
                    className="h-8 px-2.5 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl"
                  >
                    <X className="w-3.5 h-3.5 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-slate-500 text-center">
                JPG, PNG or WebP • Auto-cropped to square
              </p>
            </div>

            {/* Name Input */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">Name</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Manager Name"
                required
                className="h-11 rounded-xl bg-white/5 border-white/10 text-white focus:border-sky-500"
              />
            </div>

            {/* Email Input */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">Email</Label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder="manager@mess.com"
                required
                className="h-11 rounded-xl bg-white/5 border-white/10 text-white focus:border-sky-500"
              />
            </div>

            {/* Password Input (Optional) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-slate-300">Password</Label>
                <span className="text-[10px] text-slate-400">(leave blank to keep unchanged)</span>
              </div>
              <div className="relative">
                <Input
                  type={showEditPassword ? "text" : "password"}
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="Enter new password to change..."
                  className="h-11 rounded-xl bg-white/5 border-white/10 text-white pr-10 focus:border-sky-500"
                />
                <button
                  type="button"
                  onClick={() => setShowEditPassword(!showEditPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">Role</Label>
              <select
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                className="flex h-11 w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="ADMIN" className="bg-slate-900 text-white">Admin / Manager</option>
                <option value="SUPER_ADMIN" className="bg-slate-900 text-white">Super Admin</option>
              </select>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2.5 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsEditOpen(false)}
                className="flex-1 h-11 rounded-xl text-slate-300 hover:text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSavingEdit}
                className="flex-1 h-11 font-bold rounded-xl text-white shadow-lg transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg, #0284c7 0%, #7c3aed 100%)" }}
              >
                {isSavingEdit ? "Saving Changes..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════
          ADD MANAGER MODAL DIALOG
      ═════════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isAddManagerOpen} onOpenChange={setIsAddManagerOpen}>
        <DialogContent
          className="rounded-3xl mx-4 sm:mx-auto max-w-md p-5 sm:p-6 text-white border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full"
          style={{
            background: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255, 255, 255, 0.12)"
          }}
        >
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-violet-500/20 border border-violet-500/30 text-violet-400">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-white">Add Manager</DialogTitle>
                <DialogDescription className="text-xs text-slate-400">
                  Create a new admin/manager account with full panel access.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setIsAdding(true);
              try {
                await handleAddManager(e);
              } finally {
                setIsAdding(false);
              }
            }}
            className="space-y-4 pt-2"
          >
            {managerError && (
              <div className="p-3 rounded-xl text-xs font-semibold text-red-300 bg-red-500/15 border border-red-500/30 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{managerError}</span>
              </div>
            )}

            {/* Profile Picture Option */}
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/[0.03] border border-white/10 gap-2">
              <input
                type="file"
                ref={addFileInputRef}
                accept="image/*"
                onChange={handleAddPhotoSelect}
                className="hidden"
              />
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-base font-black text-white shadow-md overflow-hidden cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, #0284c7 0%, #7c3aed 100%)",
                  border: "2px solid rgba(255, 255, 255, 0.2)"
                }}
                onClick={() => addFileInputRef.current?.click()}
              >
                {managerForm.image ? (
                  <img src={managerForm.image} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-6 h-6 text-white/80" />
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addFileInputRef.current?.click()}
                className="h-7 px-3 text-xs font-semibold bg-white/5 border-white/10 text-slate-300 hover:text-white rounded-xl"
              >
                {managerForm.image ? "Change Photo" : "Add Profile Photo (Optional)"}
              </Button>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">Name</Label>
              <Input
                name="name"
                value={managerForm.name}
                onChange={(e) => setManagerForm({ ...managerForm, name: e.target.value })}
                placeholder="e.g. Ismail Hossain"
                required
                className="h-11 rounded-xl bg-white/5 border-white/10 text-white focus:border-violet-500"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">Email</Label>
              <Input
                name="email"
                type="email"
                value={managerForm.email}
                onChange={(e) => setManagerForm({ ...managerForm, email: e.target.value })}
                placeholder="manager@mess.com"
                required
                className="h-11 rounded-xl bg-white/5 border-white/10 text-white focus:border-violet-500"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">Phone</Label>
              <Input
                name="phone"
                value={managerForm.phone}
                onChange={(e) => setManagerForm({ ...managerForm, phone: e.target.value })}
                placeholder="017XXXXXXXX"
                className="h-11 rounded-xl bg-white/5 border-white/10 text-white focus:border-violet-500"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">Password</Label>
              <div className="relative">
                <Input
                  name="password"
                  type={showAddPassword ? "text" : "password"}
                  value={managerForm.password}
                  onChange={(e) => setManagerForm({ ...managerForm, password: e.target.value })}
                  placeholder="Password"
                  required
                  className="h-11 rounded-xl bg-white/5 border-white/10 text-white pr-10 focus:border-violet-500"
                />
                <button
                  type="button"
                  onClick={() => setShowAddPassword(!showAddPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showAddPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-300">Role</Label>
              <select
                name="role"
                value={managerForm.role}
                onChange={(e) => setManagerForm({ ...managerForm, role: e.target.value })}
                className="flex h-11 w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="ADMIN" className="bg-slate-900 text-white">Admin / Manager</option>
                <option value="SUPER_ADMIN" className="bg-slate-900 text-white">Super Admin</option>
              </select>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2.5 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsAddManagerOpen(false)}
                className="flex-1 h-11 rounded-xl text-slate-300 hover:text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isAdding}
                className="flex-1 h-11 font-bold rounded-xl text-white shadow-lg transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg, #7c3aed 0%, #0284c7 100%)" }}
              >
                {isAdding ? "Adding..." : "Add Manager"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

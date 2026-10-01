"use client";

import { useState, useEffect } from "react";
import {
  getMessData,
  updateMessSettings,
  addMember,
  updateMember,
  addMarketEntry,
  addDeposit,
  updateDeposit,
  deleteDeposit,
  saveFineOverride,
  revertFineOverride,
  getDailyMealsByDate,
  updateMemberDailyMeal,
  saveAllDailyMeals,
  addSpecificBill,
  removeMember,
  getAvailableMonths,
  finalizeMonth,
  getFinalizedSnapshots,
  deleteFinalizedSnapshot,
  deleteMarketEntry,
  updateMembersSerial,
  updateMarketEntry,
  toggleApplyDefaultBills,
  updateSpecificBill,
  deleteSpecificBill,
  getAdminDashboardInitialData,
} from "@/app/actions/mess";
import { getSession, getManagersAction, addManagerAction, removeManagerAction, logoutAction } from "@/app/actions/auth";
import { getDiningCalc } from "@/app/actions/dining-calc";
import { toast } from "react-toastify";
import { DiningCalcCard } from "@/components/DiningCalcCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users,
  Utensils,
  ShoppingCart,
  Calculator,
  DollarSign,
  Receipt,
  Wallet,
  Settings,
  FileSpreadsheet,
  FileText,
  Printer,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Leaf,
  History,
  Calendar,
  Lock,
  UserCog,
  Trash2,
  Pencil
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Document, Packer, Paragraph, Table as DocxTable, TableRow as DocxTableRow, TableCell as DocxTableCell, WidthType, AlignmentType, TextRun, BorderStyle, HeadingLevel, PageOrientation } from "docx";

import dynamic from "next/dynamic";
const OverviewTab = dynamic(() => import("@/components/admin/OverviewTab"));
const SettingsTab = dynamic(() => import("@/components/admin/SettingsTab"));
const MembersTab = dynamic(() => import("@/components/admin/MembersTab"));
const MarketsTab = dynamic(() => import("@/components/admin/MarketsTab"));
const ExtramarketsTab = dynamic(() => import("@/components/admin/ExtramarketsTab"));
const OverheadsTab = dynamic(() => import("@/components/admin/OverheadsTab"));
const DailymealsTab = dynamic(() => import("@/components/admin/DailymealsTab"));
const SpecificbillsTab = dynamic(() => import("@/components/admin/SpecificbillsTab"));
const DepositsTab = dynamic(() => import("@/components/admin/DepositsTab"));
const LedgerTab = dynamic(() => import("@/components/admin/LedgerTab"));
const HistoryTab = dynamic(() => import("@/components/admin/HistoryTab"));
const ManageadminsTab = dynamic(() => import("@/components/admin/ManageadminsTab"));

/** Convert "MM-YYYY" to readable label like "August 2026" */
function monthYearToLabel(monthYear: string): string {
  if (!monthYear) return "";
  const [month, year] = monthYear.split("-");
  const d = new Date(parseInt(year), parseInt(month) - 1, 1);
  return d.toLocaleString("en-US", { month: "long", year: "numeric" });
}

export default function AdminWorkspace() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // ── Month persistence ──
  // NOTE: useState initializer runs on server (SSR) where localStorage is unavailable,
  // so we always start with defaults here and read localStorage inside useEffect.
  const defaultMonthYear = () => {
    const d = new Date();
    return `${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
  };
  const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonthYear());
  const [hasSelectedMonth, setHasSelectedMonth] = useState(false);

  // Session & Super Admin state
  const [session, setSession] = useState<any>(null);
  const [managers, setManagers] = useState<any[]>([]);
  const [isAddManagerOpen, setIsAddManagerOpen] = useState(false);
  const [managerForm, setManagerForm] = useState({ name: "", email: "", phone: "", password: "", role: "ADMIN" });
  const [managerError, setManagerError] = useState("");
  const [availableMonths, setAvailableMonths] = useState<string[]>(["08-2026"]);

  // Monthly snapshots (history)
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [isFinalizing, setIsFinalizing] = useState(false);

  // Modals state
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [isMarketDialogOpen, setIsMarketDialogOpen] = useState(false);
  const [isEditMarketDialogOpen, setIsEditMarketDialogOpen] = useState(false);
  const [editingMarket, setEditingMarket] = useState<any>(null);
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [isEditDepositDialogOpen, setIsEditDepositDialogOpen] = useState(false);
  const [editingDeposit, setEditingDeposit] = useState<any>(null);
  const [editDepositAmount, setEditDepositAmount] = useState<string>("");
  const [editDepositDate, setEditDepositDate] = useState<string>("");
  const [isEditSpecificBillDialogOpen, setIsEditSpecificBillDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [editingBillId, setEditingBillId] = useState<string | null>(null);
  const [editBillCategory, setEditBillCategory] = useState<string>("");
  const [editBillAmount, setEditBillAmount] = useState<string>("");

  // Member filter for PDF/Word export
  const [isMemberFilterOpen, setIsMemberFilterOpen] = useState(false);
  const [exportType, setExportType] = useState<'pdf' | 'word'>('pdf');
  const [selectedExportMembers, setSelectedExportMembers] = useState<Set<string>>(new Set());

  // Edit Member state
  const [isEditMemberDialogOpen, setIsEditMemberDialogOpen] = useState(false);
  const [editingMemberInfo, setEditingMemberInfo] = useState<any>(null);
  const [editMemberForm, setEditMemberForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [editMemberError, setEditMemberError] = useState("");

  const [addMemberForm, setAddMemberForm] = useState({ name: "", emailPrefix: "", emailSuffix: "@gmail.com" });

  // Settings Form State
  const [settingsForm, setSettingsForm] = useState({
    defaultDailyMealThreshold: 2.5,
    needX2MealLimit: 7,
    defaultMarketFine: 130,
    extraMarketRate: 130,
    mealCutoffTime: "22:00",
    defaultKhalaBill: 300,
    defaultManagerBill: 100,
    defaultGasBill: 200,
    defaultPaperBill: 20,
    defaultCurrentBill: 150,
    defaultFestivalBill: 0,
    applyDefaultBills: false,
  });

  // Daily Meals state
  const [selectedMealDate, setSelectedMealDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [dailyMealsData, setDailyMealsData] = useState<any[]>([]);
  const [mealInputValues, setMealInputValues] = useState<Record<string, number>>({});
  const [loadingDailyMeals, setLoadingDailyMeals] = useState(false);
  const [isSavingMeals, setIsSavingMeals] = useState(false);

  // Member Order State
  const [membersList, setMembersList] = useState<any[]>([]);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  useEffect(() => {
    if (data && data.members) {
      setMembersList(data.members);
    }
  }, [data]);

  const fetchData = async (month?: string, dismissPopup = false, silent = false) => {
    if (!silent) setLoading(true);
    const res = await getMessData(month || selectedMonth);
    setData(res);
    if (res.settings) {
      setSettingsForm({
        defaultDailyMealThreshold: res.settings.defaultDailyMealThreshold,
        needX2MealLimit: res.settings.needX2MealLimit,
        defaultMarketFine: res.settings.defaultMarketFine,
        extraMarketRate: res.settings.extraMarketRate,
        mealCutoffTime: res.settings.mealCutoffTime,
        defaultKhalaBill: res.settings.defaultKhalaBill,
        defaultManagerBill: res.settings.defaultManagerBill,
        defaultGasBill: res.settings.defaultGasBill,
        defaultPaperBill: res.settings.defaultPaperBill,
        defaultCurrentBill: res.settings.defaultCurrentBill,
        defaultFestivalBill: res.settings.defaultFestivalBill,
        applyDefaultBills: res.settings.applyDefaultBills,
      });
      // Only dismiss the popup if explicitly requested (i.e. user clicked "Start Managing")
      if (dismissPopup) {
        setHasSelectedMonth(true);
      }
    }
    if (!silent) setLoading(false);
  };

  const fetchAvailableMonths = async () => {
    const months = await getAvailableMonths();
    setAvailableMonths(months);
  };

  const fetchSnapshots = async () => {
    const snaps = await getFinalizedSnapshots();
    setSnapshots(snaps);
  };

  const handleMonthChange = (newMonth: string) => {
    setSelectedMonth(newMonth);
    // Save the newly selected month so it persists across sessions
    localStorage.setItem("adminSelectedMonth", newMonth);
    fetchData(newMonth);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;

    const newMembers = [...membersList];
    const draggedItem = newMembers[draggedIdx];

    newMembers.splice(draggedIdx, 1);
    newMembers.splice(index, 0, draggedItem);

    setDraggedIdx(index);
    setMembersList(newMembers);
  };

  const handleDragEnd = async (e: React.DragEvent) => {
    e.preventDefault();
    setDraggedIdx(null);

    const updates = membersList.map((m, idx) => ({
      id: m.member.id,
      serial: idx,
    }));

    try {
      await updateMembersSerial(updates);
    } catch (err) {
      console.error(err);
    }
  };

  const openEditDeposit = (dep: any, memberName: string) => {
    setEditingDeposit({ ...dep, memberName });
    setEditDepositAmount(dep.amount.toString());
    setEditDepositDate(dep.date ? new Date(dep.date).toISOString().split("T")[0] : "");
    setIsEditDepositDialogOpen(true);
  };

  const handleUpdateDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDeposit) return;
    const formData = new FormData();
    formData.append("id", editingDeposit.id);
    formData.append("amount", editDepositAmount);
    formData.append("date", editDepositDate);
    await updateDeposit(formData);
    setIsEditDepositDialogOpen(false);
    setEditingDeposit(null);
    await fetchData(undefined, false, true);
    toast.success("Deposit updated successfully!");
  };

  const handleDeleteDeposit = async (depId: string, amount: number, memberName: string) => {
    if (!window.confirm(`${memberName} এর ৳${amount} ডিপোজিটটি মুছে ফেলতে চান?`)) return;
    const formData = new FormData();
    formData.append("id", depId);
    await deleteDeposit(formData);
    await fetchData(undefined, false, true);
    toast.success("Deposit deleted successfully!");
  };

  const handleFinalizeMonth = async () => {
    if (!window.confirm(`"${monthYearToLabel(selectedMonth)}" মাসের হিসাব চূড়ান্ত করে সেভ করবেন? এটি একটি স্থায়ী snapshot তৈরি করবে।`)) return;
    setIsFinalizing(true);
    await finalizeMonth(selectedMonth);
    await fetchSnapshots();
    setIsFinalizing(false);
    toast.success(`${monthYearToLabel(selectedMonth)} সফলভাবে চূড়ান্ত ও সেভ হয়েছে!`);
  };

  const handleDeleteSnapshot = async (id: string, monthLabel: string) => {
    if (!window.confirm(`"${monthLabel}" এর ফাইল হিস্ট্রি মুছে ফেলতে চান? এতে এই মাসের সংরক্ষিত হিসাব মুছে যাবে এবং পরবর্তী মাসের Due/Advance এ আর কোনো প্রভাব ফেলবে না।`)) return;
    await deleteFinalizedSnapshot(id);
    await fetchSnapshots();
    await fetchData(undefined, false, true);
    toast.success(`"${monthLabel}" এর হিস্ট্রি মুছে ফেলা হয়েছে!`);
  };

  useEffect(() => {
    // Read localStorage INSIDE the effect — the ONLY safe place in Next.js (no SSR here).
    const savedMonth = localStorage.getItem("adminSelectedMonth");
    const monthToLoad = savedMonth ?? defaultMonthYear();

    // KEY FIX: Call both setSelectedMonth + setHasSelectedMonth SYNCHRONOUSLY together.
    // React 18 batches all synchronous state updates from the same useEffect call into
    // a SINGLE re-render. This guarantees that when the dashboard becomes visible
    // (hasSelectedMonth=true), selectedMonth is ALREADY the saved month — never the
    // default current month. Previously, setHasSelectedMonth(true) was called inside
    // the async loadInitialData(), so they applied in separate renders and Vercel SSR
    // hydration could cause selectedMonth to drift back to current month.
    if (savedMonth) {
      setSelectedMonth(savedMonth);   // } batched → single re-render
      setHasSelectedMonth(true);      // } popup skipped with correct month
    }

    // Single consolidated network request to fetch ALL initial data
    const loadInitialData = async () => {
      setLoading(true);
      const res = await getAdminDashboardInitialData(monthToLoad, selectedMealDate);
      
      // Apply the fetched data
      setData(res.data);
      if (res.data.settings) {
        setSettingsForm({
          defaultDailyMealThreshold: res.data.settings.defaultDailyMealThreshold,
          needX2MealLimit: res.data.settings.needX2MealLimit,
          defaultMarketFine: res.data.settings.defaultMarketFine,
          extraMarketRate: res.data.settings.extraMarketRate,
          mealCutoffTime: res.data.settings.mealCutoffTime,
          defaultKhalaBill: res.data.settings.defaultKhalaBill,
          defaultManagerBill: res.data.settings.defaultManagerBill,
          defaultGasBill: res.data.settings.defaultGasBill,
          defaultPaperBill: res.data.settings.defaultPaperBill,
          defaultCurrentBill: res.data.settings.defaultCurrentBill,
          defaultFestivalBill: res.data.settings.defaultFestivalBill,
          applyDefaultBills: res.data.settings.applyDefaultBills,
        });
      }
      
      setDailyMealsData(res.meals);
      const initialInputs: Record<string, number> = {};
      res.meals.forEach((m: any) => {
        initialInputs[m.memberId] = m.mealRecord ? m.mealRecord.totalMeal : 0;
      });
      setMealInputValues(initialInputs);
      
      setAvailableMonths(res.availableMonths);
      setSnapshots(res.snapshots);
      setSession(res.session);
      setManagers(res.managers);
      
      // Save the loaded month to localStorage for next visit
      localStorage.setItem("adminSelectedMonth", monthToLoad);
      
      // If no savedMonth (first-ever login): let user pick & click "Start Managing".
      // If savedMonth existed: hasSelectedMonth was already set to true above (sync).
      if (!savedMonth) {
        // Keep hasSelectedMonth=false so popup remains visible for first-time setup.
        // The "Start Managing" button onClick will set it to true.
      }

      setLoading(false);
    };

    loadInitialData();
  }, []);

  const fetchManagers = async () => {
    const m = await getManagersAction();
    setManagers(m);
  };

  const handleAddManager = async (e: React.FormEvent) => {
    e.preventDefault();
    setManagerError("");
    const formData = new FormData();
    formData.append("name", managerForm.name);
    formData.append("email", managerForm.email);
    formData.append("phone", managerForm.phone);
    formData.append("password", managerForm.password);
    formData.append("role", managerForm.role);
    const res = await addManagerAction(formData);
    if (res.success) {
      setManagerForm({ name: "", email: "", phone: "", password: "", role: "ADMIN" });
      setIsAddManagerOpen(false);
      await fetchManagers();
    } else {
      setManagerError(res.error || "Failed to add manager.");
    }
  };

  const handleRemoveManager = async (userId: string, name: string) => {
    if (!window.confirm(`"${name}" কে Manager থেকে সরিয়ে দেবেন?`)) return;
    await removeManagerAction(userId);
    await fetchManagers();
  };

  // Update selected meal date when the selected month changes
  useEffect(() => {
    if (!hasSelectedMonth) return;
    
    const d = new Date();
    const currentMonthYear = `${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
    
    if (selectedMonth === currentMonthYear) {
      const todayDate = d.toISOString().split("T")[0];
      setSelectedMealDate(todayDate);
      fetchDailyMeals(todayDate);
    } else {
      setSelectedMealDate("");
      setDailyMealsData([]);
    }
  }, [selectedMonth, hasSelectedMonth]);

  const fetchDailyMeals = async (date: string) => {
    if (!date) {
      setDailyMealsData([]);
      setMealInputValues({});
      return;
    }
    setLoadingDailyMeals(true);
    const meals = await getDailyMealsByDate(date);
    setDailyMealsData(meals);
    const initialInputs: Record<string, number> = {};
    meals.forEach((m: any) => {
      initialInputs[m.memberId] = m.mealRecord ? m.mealRecord.totalMeal : 0;
    });
    setMealInputValues(initialInputs);
    setLoadingDailyMeals(false);
  };

  const handleMealDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setSelectedMealDate(newDate);
    fetchDailyMeals(newDate);
  };

  const handleSaveAllMeals = async () => {
    setIsSavingMeals(true);
    try {
      const mealsData = dailyMealsData.map(m => {
        const val = mealInputValues[m.memberId] !== undefined ? mealInputValues[m.memberId] : (m.mealRecord ? m.mealRecord.totalMeal : 0);
        return {
          memberId: m.memberId,
          totalMeal: val,
          dateStr: selectedMealDate
        };
      });

      const res = await saveAllDailyMeals(mealsData);
      if (res.error) {
        toast.error(res.error);
      } else {
        await Promise.all([fetchDailyMeals(selectedMealDate), fetchData(undefined, false, true)]);
        toast.success("All meals saved successfully!");
      }
    } finally {
      setIsSavingMeals(false);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("defaultDailyMealThreshold", settingsForm.defaultDailyMealThreshold.toString());
    formData.append("needX2MealLimit", settingsForm.needX2MealLimit.toString());
    formData.append("defaultMarketFine", settingsForm.defaultMarketFine.toString());
    formData.append("extraMarketRate", settingsForm.extraMarketRate.toString());
    formData.append("mealCutoffTime", settingsForm.mealCutoffTime);
    formData.append("defaultKhalaBill", settingsForm.defaultKhalaBill.toString());
    formData.append("defaultManagerBill", settingsForm.defaultManagerBill.toString());
    formData.append("defaultGasBill", settingsForm.defaultGasBill.toString());
    formData.append("defaultPaperBill", settingsForm.defaultPaperBill.toString());
    formData.append("defaultCurrentBill", settingsForm.defaultCurrentBill.toString());
    formData.append("defaultFestivalBill", settingsForm.defaultFestivalBill.toString());

    await updateMessSettings(formData);
    await fetchData(undefined, false, true);
    toast.success("Mess Rules updated successfully!");
  };

  const handleRemoveMember = async (memberId: string) => {
    if (window.confirm("Are you sure you want to remove this member? All their data will be deleted.")) {
      const formData = new FormData();
      formData.append("memberId", memberId);
      await removeMember(formData);
      await fetchData(undefined, false, true);
      toast.success("Member removed successfully!");
    }
  };

  const openEditMemberDialog = (m: any) => {
    setEditingMemberInfo(m);
    setEditMemberForm({
      name: m.member.user.name,
      email: m.member.user.email,
      phone: m.member.phone || "",
      password: "",
    });
    setEditMemberError("");
    setIsEditMemberDialogOpen(true);
  };

  const handleEditMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEditMemberError("");
    const formData = new FormData();
    formData.append("memberId", editingMemberInfo.member.id);
    formData.append("name", editMemberForm.name);
    formData.append("email", editMemberForm.email);
    formData.append("phone", editMemberForm.phone);
    if (editMemberForm.password) {
      formData.append("password", editMemberForm.password);
    }
    const res = await updateMember(formData);
    if (res.success) {
      setIsEditMemberDialogOpen(false);
      setEditingMemberInfo(null);
      await fetchData(undefined, false, true);
      toast.success("Member info updated successfully!");
    } else {
      setEditMemberError(res.error || "Failed to update member.");
    }
  };

  const handleAddSpecificBill = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append("monthYear", selectedMonth);
    await addSpecificBill(formData);
    await fetchData(undefined, false, true);
    (e.target as HTMLFormElement).reset();
    toast.success("Specific Bill Added!");
  };

  const handleAddMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await addMember(formData);
    setIsMemberDialogOpen(false);
    setAddMemberForm({ name: "", emailPrefix: "", emailSuffix: "@gmail.com" });
    await fetchData(undefined, false, true);
    toast.success("Member added successfully!");
  };

  const handleAddMarket = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const res = await addMarketEntry(formData);
    if (res?.error) {
      toast.error(res.error);
      return;
    }
    setIsMarketDialogOpen(false);
    await fetchData(undefined, false, true);
    toast.success("Market entry added successfully!");
  };


  const handleEditMarket = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await updateMarketEntry(formData);
    setIsEditMarketDialogOpen(false);
    setEditingMarket(null);
    await fetchData(undefined, false, true);
  };

  const handleEditSpecificBill = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await updateSpecificBill(formData);
    setIsEditSpecificBillDialogOpen(false);
    setEditingMember(null);
    await fetchData(undefined, false, true);
  };

  const handleAddDeposit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await addDeposit(formData);
    setIsDepositDialogOpen(false);
    await fetchData(undefined, false, true);
  };

  const handleSaveFineOverride = async (memberId: string, customFine: number) => {
    const formData = new FormData();
    formData.append("memberId", memberId);
    formData.append("marketFine", customFine.toString());
    formData.append("monthYear", selectedMonth);
    await saveFineOverride(formData);
    await fetchData(undefined, false, true);
  };

  const handleRevertFineOverride = async (memberId: string) => {
    const formData = new FormData();
    formData.append("memberId", memberId);
    formData.append("monthYear", selectedMonth);
    await revertFineOverride(formData);
    await fetchData(undefined, false, true);
  };

  // Open member filter popup before export
  const openMemberFilter = (type: 'pdf' | 'word') => {
    if (!data) return;
    setExportType(type);
    // Pre-select all members
    setSelectedExportMembers(new Set(data.members.map((m: any) => m.member.id)));
    setIsMemberFilterOpen(true);
  };

  const toggleExportMember = (id: string) => {
    setSelectedExportMembers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const runExport = async () => {
    setIsMemberFilterOpen(false);
    if (!data) return;
    const filteredData = {
      ...data,
      members: data.members.filter((m: any) => selectedExportMembers.has(m.member.id))
    };
    if (exportType === 'pdf') {
      const diningData = await getDiningCalc(selectedMonth);
      generatePDFForData(filteredData, monthYearToLabel(selectedMonth), false, diningData);
    } else {
      const diningData = await getDiningCalc(selectedMonth);
      generateWordForData(filteredData, monthYearToLabel(selectedMonth), false, diningData);
    }
  };

  const exportToPDF = async () => openMemberFilter('pdf');
  const exportToWord = async () => openMemberFilter('word');

  const generateWordForData = async (exportData: any, label: string, isSnapshot = false, diningData?: any) => {
    const members = exportData.members;

    const headerRow = new DocxTableRow({
      tableHeader: true,
      children: [
        "SI", "Name", "Total Meal", "Meal Cost", "Khala Bill", "Manager Bill",
        "Paper Bill", "Current Bill", "Gas Bill", "Fest Meal", "Market Fine",
        "Total Cost", "Total Deposit", "Due", "Advanced"
      ].map(text => new DocxTableCell({
        children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 22, font: "Times New Roman" })], alignment: AlignmentType.CENTER })],
        borders: { top: { style: BorderStyle.SINGLE, size: 4 }, bottom: { style: BorderStyle.SINGLE, size: 4 }, left: { style: BorderStyle.SINGLE, size: 4 }, right: { style: BorderStyle.SINGLE, size: 4 } },
        shading: { fill: "FFFFFF" }
      }))
    });

    const dataRows = members.map((m: any, index: number) => new DocxTableRow({
      children: [
        `${index + 1}.`,
        m.member.user.name,
        m.totalMeals.toString(),
        m.individualMealCost.toFixed(2),
        isSnapshot ? m.adjustedOverheads.toFixed(0) : m.baseKhala.toFixed(0),
        m.baseManager.toFixed(0),
        m.paper.toFixed(0),
        m.current.toFixed(0),
        m.baseGas.toFixed(0),
        m.festival.toFixed(0),
        m.marketFine > 0 ? m.marketFine.toFixed(0) : "",
        m.totalCost.toFixed(2),
        m.totalDeposits.toFixed(0),
        m.due > 0 ? m.due.toFixed(0) : "0",
        m.advance > 0 ? m.advance.toFixed(0) : "0"
      ].map((cellText, ci) => new DocxTableCell({
        children: [new Paragraph({ children: [new TextRun({ text: String(cellText), bold: [0,1,2,11,12,13,14].includes(ci), size: 22, font: "Times New Roman" })], alignment: [0,2,3,4,5,6,7,8,9,10,11,12,13,14].includes(ci) ? AlignmentType.CENTER : AlignmentType.LEFT })],
        borders: { top: { style: BorderStyle.SINGLE, size: 2 }, bottom: { style: BorderStyle.SINGLE, size: 2 }, left: { style: BorderStyle.SINGLE, size: 2 }, right: { style: BorderStyle.SINGLE, size: 2 } }
      }))
    }));

    const mainTable = new DocxTable({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow, ...dataRows]
    });

    const diningParagraphs: Paragraph[] = [];
    if (diningData) {
      const totalDeposit = diningData.depositAmount + diningData.previousRemaining;
      const remaining = totalDeposit - diningData.totalCost;
      diningParagraphs.push(
        new Paragraph({ children: [new TextRun({ text: "Dining Charge:", bold: true, size: 24, font: "Times New Roman" })], spacing: { before: 200 } }),
        new Paragraph({ children: [new TextRun({ text: `Total deposit (Up to ${label}): ${totalDeposit} tk`, size: 22, font: "Times New Roman" })] }),
        new Paragraph({ children: [new TextRun({ text: `Total cost: ${diningData.totalCost} tk`, size: 22, font: "Times New Roman" })] }),
        new Paragraph({ children: [new TextRun({ text: `Remaining amount: ${remaining} tk`, bold: true, size: 22, font: "Times New Roman" })] })
      );
    }

    const doc = new Document({
      sections: [{
        properties: { page: { size: { width: 16838, height: 11906, orientation: PageOrientation.LANDSCAPE }, margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
        children: [
          new Paragraph({ children: [new TextRun({ text: "MOSJID-E-NUR_COMPLEX (MESS)", bold: true, size: 28, font: "Times New Roman" })], alignment: AlignmentType.CENTER, heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ children: [new TextRun({ text: "Terokhadiya, Cantonment Road, Rajshahi.", size: 22, font: "Times New Roman" })], alignment: AlignmentType.CENTER }),
          new Paragraph({ children: [new TextRun({ text: `Month: ${label}   |   Total Cost: ${exportData.totalMarketCost}   |   Total Meal: ${exportData.totalMessMeals}   |   Meal Rate: ${exportData.liveMealRate?.toFixed(2)}`, bold: true, size: 22, font: "Times New Roman" })], spacing: { before: 100, after: 100 } }),
          mainTable,
          ...diningParagraphs
        ]
      }]
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Mess_Ledger_${label.replace(/\s+/g, "_")}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportDailyMealsPDF = () => {
    if (!data) return;

    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape A4
    const monthStr = monthYearToLabel(selectedMonth).toUpperCase();

    // Title
    doc.setFont("times", "bold");
    doc.setFontSize(16);
    doc.text(monthStr, 148, 15, { align: "center" });

    // Determine days in month
    const [month, year] = selectedMonth.split("-").map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();

    // Build Table Columns
    const daysColumns = Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString());
    const head = [["SI No.", "NAME", ...daysColumns, "TOTAL", "Ex Meal", "Need x2!"]];

    // Build Table Rows
    const body = data.members.map((m: any, idx: number) => {
      const mealsByDay: Record<number, number> = {};
      if (m.member.dailyMeals) {
        m.member.dailyMeals.forEach((dm: any) => {
          // ensure dm.date is treated as a local date conceptually since it was saved correctly
          const d = new Date(dm.date).getDate();
          mealsByDay[d] = dm.totalMeal;
        });
      }

      const dayCells = Array.from({ length: daysInMonth }, (_, i) => {
        const meal = mealsByDay[i + 1];
        return meal && meal > 0 ? meal.toString() : "";
      });

      return [
        (idx + 1).toString(),
        m.member.user.name,
        ...dayCells,
        m.totalMeals.toString(),
        m.totalExtraMeals.toString(),
        m.isNeedX2 ? "YES" : "NO"
      ];
    });

    autoTable(doc, {
      head,
      body,
      startY: 20,
      theme: "grid",
      styles: {
        font: "times",
        fontSize: 11,
        cellPadding: 1,
        halign: "center",
        valign: "middle",
        lineWidth: 0.1,
        lineColor: [0, 0, 0],
        textColor: [0, 0, 0],
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        lineWidth: 0.1,
      },
      columnStyles: {
        1: { halign: "left", minCellWidth: 20 }, // NAME
      },
    });

    doc.save(`Daily_Meals_${selectedMonth}.pdf`);
  };

  const exportSnapshotToPDF = async (snap: any) => {
    // Reconstruct data shape to match what generatePDFForData expects
    const snapData = {
      totalMessMeals: snap.totalMessMeals,
      totalMarketCost: snap.totalMarketCost,
      liveMealRate: snap.liveMealRate,
      grandTotalDeposits: snap.memberSnapshots.reduce((s: number, m: any) => s + m.totalDeposits, 0),
      grandTotalDues: snap.memberSnapshots.reduce((s: number, m: any) => s + m.due, 0),
      grandTotalAdvances: snap.memberSnapshots.reduce((s: number, m: any) => s + m.advance, 0),
      members: snap.memberSnapshots.map((ms: any) => ({
        member: { user: { name: ms.memberName } },
        totalMeals: ms.totalMeals,
        individualMealCost: ms.individualMealCost,
        baseKhala: 0, // Since we only have adjustedOverheads in snapshot, we mock base values
        M_X2: 1,
        baseManager: 0,
        paper: 0,
        current: 0,
        adjustedOverheads: ms.adjustedOverheads,
        totalCost: ms.totalCost,
        totalDeposits: ms.totalDeposits,
        due: ms.due,
        advance: ms.advance
      }))
    };

    const diningData = await getDiningCalc(snap.monthYear);
    generatePDFForData(snapData, snap.monthLabel, true, diningData);
  };

  const generatePDFForData = (exportData: any, label: string, isSnapshot = false, diningData?: any) => {
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape A4
    doc.setFont("times", "bold");
    doc.setFontSize(15);
    doc.text("MOSJID-E-NUR_COMPLEX (MESS)", 148.5, 12, { align: "center" });

    doc.setFontSize(11);
    doc.setFont("times", "normal");
    doc.text("Terokhadiya, Cantonment Road, Rajshahi.", 148.5, 17, { align: "center" });

    doc.setFont("times", "bold");
    doc.setFontSize(11);
    doc.text(`Month: ${label}`, 8, 25);
    doc.text(`Total Cost: ${exportData.totalMarketCost}`, 80, 25);
    doc.text(`Total Meal: ${exportData.totalMessMeals}`, 160, 25);
    doc.text(`Meal Rate: ${exportData.liveMealRate.toFixed(2)}`, 235, 25);

    const tableColumn = [
      "SI\nNo", "Name", "Total\nMeal", "Meal\nCost",
      "Khala\nBill", "Manager\nBill", "Paper\nBill", "Current\nBill",
      "Gas\nBill", "Fest\nMeal", "Market\nfine", "Total\ncost",
      "Total\nDeposit", "Due", "Advanced"
    ];

    let totalMealCost = 0;
    let totalKhala = 0;
    let totalManager = 0;
    let totalPaper = 0;
    let totalCurrent = 0;
    let totalGas = 0;
    let totalFest = 0;
    let totalFine = 0;
    let totalCostAll = 0;

    const tableRows = exportData.members.map((m: any, index: number) => {
      totalMealCost += m.individualMealCost;
      totalKhala += m.baseKhala;
      totalManager += m.baseManager;
      totalPaper += m.paper;
      totalCurrent += m.current;
      totalGas += m.baseGas;
      totalFest += m.festival;
      totalFine += m.marketFine;
      totalCostAll += m.totalCost;

      return [
        (index + 1).toString() + ".",
        m.member.user.name,
        m.totalMeals,
        m.individualMealCost.toFixed(2),
        isSnapshot ? m.adjustedOverheads.toFixed(0) : m.baseKhala.toFixed(0),
        m.baseManager.toFixed(0),
        m.paper.toFixed(0),
        m.current.toFixed(0),
        m.baseGas.toFixed(0),
        m.festival.toFixed(0),
        m.marketFine > 0 ? m.marketFine.toFixed(0) : "",
        m.totalCost.toFixed(2),
        m.totalDeposits.toFixed(0),
        m.due > 0 ? m.due.toFixed(0) : "0",
        m.advance > 0 ? m.advance.toFixed(0) : "0"
      ];
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 28,
      margin: { left: 8, right: 8, top: 20, bottom: 8 },
      showHead: 'everyPage',
      theme: 'grid',
      styles: {
        font: "times",
        fontSize: 10.5,
        cellPadding: { top: 0.8, bottom: 0.8, left: 1, right: 1 },
        minCellHeight: 0,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
        fillColor: [255, 255, 255]
      },
      alternateRowStyles: { fillColor: [255, 255, 255] },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        halign: "center",
        fontSize: 10.5,
        cellPadding: { top: 1, bottom: 1, left: 1, right: 1 }
      },
      columnStyles: {
        0: { halign: 'left' },
        1: { halign: 'left' },
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'center' },
        6: { halign: 'center' },
        7: { halign: 'center' },
        8: { halign: 'center' },
        9: { halign: 'center' },
        10: { halign: 'center' },
        11: { halign: 'center' },
        12: { halign: 'center' },
        13: { halign: 'center' },
        14: { halign: 'center' }
      },
      didParseCell: function (data: any) {
        if (data.section === 'body') {
          const boldCols = [0, 1, 2, 11, 12, 13, 14];
          if (boldCols.includes(data.column.index)) {
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });

    if (diningData) {
      const finalY = (doc as any).lastAutoTable.finalY || 100;
      const startX = 105; // Left-aligned block positioned centrally on page
      doc.setFont("times", "bold");
      doc.setFontSize(11.5);
      doc.text("Dining Charge:", startX, finalY + 6);

      doc.setFontSize(10.5);
      doc.setFont("times", "normal");
      const totalDeposit = diningData.depositAmount + diningData.previousRemaining;
      doc.text(`Total deposit (Up to ${label}): ${totalDeposit} tk`, startX, finalY + 11);
      doc.text(`Total cost: ${diningData.totalCost} tk`, startX, finalY + 16);

      const remaining = totalDeposit - diningData.totalCost;
      doc.setFont("times", "bold");
      doc.text(`Remaining amount: ${remaining} tk`, startX, finalY + 21);
    }

    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont("times", "normal");
      doc.text("© 2026 ALL RIGHTS RESERVED by SoftTech", 148.5, 202, { align: "center" });
    }

    doc.save(`Mess_Ledger_${label.replace(/\s+/g, "_")}.pdf`);
  };


  const tabProps = {
    data, loading, activeTab, setActiveTab, hasSelectedMonth, setHasSelectedMonth, session, setSession, managers, setManagers, isAddManagerOpen, setIsAddManagerOpen, managerForm, setManagerForm, managerError, setManagerError, selectedMonth, setSelectedMonth, availableMonths, setAvailableMonths, snapshots, setSnapshots, isFinalizing, setIsFinalizing, isMemberDialogOpen, setIsMemberDialogOpen, isMarketDialogOpen, setIsMarketDialogOpen, isEditMarketDialogOpen, setIsEditMarketDialogOpen, editingMarket, setEditingMarket, isDepositDialogOpen, setIsDepositDialogOpen, isEditDepositDialogOpen, setIsEditDepositDialogOpen, editingDeposit, setEditingDeposit, editDepositAmount, setEditDepositAmount, editDepositDate, setEditDepositDate, isEditSpecificBillDialogOpen, setIsEditSpecificBillDialogOpen, editingMember, setEditingMember, editingBillId, setEditingBillId, editBillCategory, setEditBillCategory, editBillAmount, setEditBillAmount, isMemberFilterOpen, setIsMemberFilterOpen, exportType, setExportType, selectedExportMembers, setSelectedExportMembers, isEditMemberDialogOpen, setIsEditMemberDialogOpen, editingMemberInfo, setEditingMemberInfo, editMemberForm, setEditMemberForm, editMemberError, setEditMemberError, addMemberForm, setAddMemberForm, settingsForm, setSettingsForm, selectedMealDate, setSelectedMealDate, dailyMealsData, setDailyMealsData, mealInputValues, setMealInputValues, loadingDailyMeals, setLoadingDailyMeals, isSavingMeals, setIsSavingMeals, membersList, setMembersList, draggedIdx, setDraggedIdx, fetchData, fetchAvailableMonths, fetchSnapshots, handleMonthChange, handleDragStart, handleDragOver, handleDragEnd, openEditDeposit, handleUpdateDeposit, handleDeleteDeposit, handleFinalizeMonth, handleDeleteSnapshot, fetchManagers, handleAddManager, handleRemoveManager, fetchDailyMeals, handleMealDateChange, handleSaveAllMeals, handleUpdateSettings, handleRemoveMember, openEditMemberDialog, handleEditMember, handleAddSpecificBill, handleAddMember, handleAddMarket, handleEditMarket, handleEditSpecificBill, handleAddDeposit, handleSaveFineOverride, handleRevertFineOverride, openMemberFilter, toggleExportMember, runExport, exportToPDF, exportToWord, generateWordForData, exportDailyMealsPDF, exportSnapshotToPDF, generatePDFForData, monthYearToLabel
  };

  if (!hasSelectedMonth) {
  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-500" style={{ background: 'oklch(0.08 0.015 260 / 92%)', backdropFilter: 'blur(16px)' }}>
        <div className="w-full max-w-sm glass-card-elevated rounded-2xl overflow-hidden animate-in zoom-in-95 duration-500">
          {/* top accent */}
          <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, oklch(0.65 0.25 275 / 60%), oklch(0.72 0.18 200 / 60%), transparent)' }} />
          <div className="p-7 space-y-5">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, oklch(0.25 0.12 275), oklch(0.20 0.10 265))', border: '1px solid oklch(1 0 0 / 10%)' }}>
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gradient">Select Month</h2>
                <p className="text-sm text-muted-foreground mt-1">Choose the month you want to manage</p>
              </div>
            </div>
            <div className="flex gap-2">
              <select
                className="flex-1 h-11 rounded-xl px-3 text-sm font-semibold focus:outline-none focus:ring-2 appearance-none cursor-pointer"
                style={{ background: 'oklch(0.18 0.02 260)', border: '1px solid oklch(1 0 0 / 12%)', color: 'oklch(0.93 0.01 260)' }}
                value={selectedMonth.split('-')[0]}
                onChange={(e) => {
                  const val = e.target.value;
                  const newMonth = `${val}-${selectedMonth.split('-')[1]}`;
                  setSelectedMonth(newMonth);
                }}
              >
                {Array.from({ length: 12 }, (_, i) => {
                  const val = String(i + 1).padStart(2, "0");
                  const d = new Date(2000, i, 1);
                  return <option key={val} value={val} style={{ background: 'oklch(0.18 0.02 260)', color: 'oklch(0.93 0.01 260)' }}>{d.toLocaleString("en-US", { month: "long" })}</option>;
                })}
              </select>
              <input
                type="number"
                min="2020" max="2100"
                value={selectedMonth.split('-')[1]}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedMonth(`${selectedMonth.split('-')[0]}-${val}`);
                }}
                className="w-24 h-11 rounded-xl text-center font-bold text-sm focus:outline-none"
                style={{ background: 'oklch(0.18 0.02 260)', border: '1px solid oklch(1 0 0 / 12%)', color: 'oklch(0.93 0.01 260)' }}
              />
            </div>
            <Button
              className="w-full h-11 text-sm font-bold btn-glow rounded-xl gap-2"
              onClick={() => {
                localStorage.setItem("adminSelectedMonth", selectedMonth);
                setHasSelectedMonth(true);
              }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Start Managing →"
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-2xl blur-xl opacity-60" style={{ background: 'linear-gradient(135deg, oklch(0.58 0.26 278), oklch(0.65 0.20 200))' }} />
          <div className="relative p-4 rounded-2xl animate-float" style={{ background: 'linear-gradient(135deg, oklch(0.25 0.12 275), oklch(0.20 0.10 265))', border: '1px solid oklch(1 0 0 / 12%)' }}>
            <RefreshCw className="h-7 w-7 animate-spin text-white" />
          </div>
        </div>
        <p className="text-muted-foreground font-semibold">Loading Mess Calculations…</p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen">
      <div className="p-4 md:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto w-full">

        {/* ── Modern Dark Top Bar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl px-5 py-4"
          style={{ background: 'oklch(0.14 0.018 260)', border: '1px solid oklch(1 0 0 / 8%)' }}>

          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, oklch(0.55 0.26 278), oklch(0.50 0.22 265))' }}>
              <ShieldCheck className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground leading-none">Admin Workspace</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Mess Accounting Engine</p>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: 'oklch(0.65 0.25 275 / 12%)', color: 'oklch(0.75 0.20 275)', border: '1px solid oklch(0.65 0.25 275 / 20%)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              Live
            </span>
          </div>

          {/* Month Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl" style={{ background: 'oklch(0.18 0.02 260)', border: '1px solid oklch(1 0 0 / 10%)' }}>
              <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <select
                value={selectedMonth.split('-')[0]}
                onChange={(e) => {
                  const newMonth = `${e.target.value}-${selectedMonth.split('-')[1]}`;
                  setSelectedMonth(newMonth);
                  localStorage.setItem("adminSelectedMonth", newMonth);
                  fetchData(newMonth);
                }}
                className="bg-transparent text-sm font-semibold focus:outline-none cursor-pointer text-foreground"
              >
                {Array.from({ length: 12 }, (_, i) => {
                  const val = String(i + 1).padStart(2, "0");
                  const d = new Date(2000, i, 1);
                  return <option key={val} value={val} style={{ background: 'oklch(0.18 0.02 260)' }}>{d.toLocaleString("en-US", { month: "short" })}</option>;
                })}
              </select>
              <input
                type="number" min="2020" max="2100"
                value={selectedMonth.split('-')[1]}
                onChange={(e) => {
                  const newMonth = `${selectedMonth.split('-')[0]}-${e.target.value}`;
                  setSelectedMonth(newMonth);
                }}
                onBlur={(e) => {
                  if (e.target.value.length === 4) {
                    const newMonth = `${selectedMonth.split('-')[0]}-${e.target.value}`;
                    localStorage.setItem("adminSelectedMonth", newMonth);
                    fetchData(newMonth);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.length === 4) {
                    const newMonth = `${selectedMonth.split('-')[0]}-${e.currentTarget.value}`;
                    localStorage.setItem("adminSelectedMonth", newMonth);
                    fetchData(newMonth);
                  }
                }}
                className="bg-transparent text-sm font-semibold focus:outline-none w-14 text-foreground"
              />
            </div>
            <Button onClick={() => fetchData()} size="sm" variant="ghost"
              className="h-9 px-3 rounded-xl gap-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5">
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-xs font-semibold">Refresh</span>
            </Button>
            <Button size="sm" variant="ghost"
              onClick={async () => { await logoutAction(); window.location.href = "/"; }}
              className="h-9 px-3 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-white/5">
              Sign Out
            </Button>
          </div>
        </div>

        {/* ── Modern Pill Tab Navigation ── */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="tab-nav w-full h-auto p-1 flex justify-start overflow-x-auto flex-nowrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {([
              { value: 'overview',      icon: <Calculator className="h-3.5 w-3.5" />,     label: 'Overview'       },
              { value: 'dailymeals',   icon: <Utensils className="h-3.5 w-3.5" />,        label: 'Meals'          },
              { value: 'settings',     icon: <Settings className="h-3.5 w-3.5" />,         label: 'Rules'          },
              { value: 'members',      icon: <Users className="h-3.5 w-3.5" />,            label: 'Members'        },
              { value: 'markets',      icon: <ShoppingCart className="h-3.5 w-3.5" />,     label: 'Markets'        },
              { value: 'extramarkets', icon: <PlusCircle className="h-3.5 w-3.5" />,       label: 'Extra Duty'     },
              { value: 'overheads',    icon: <Receipt className="h-3.5 w-3.5" />,          label: 'Bills'          },
              { value: 'specificbills',icon: <FileText className="h-3.5 w-3.5" />,         label: 'Specific Bills' },
              { value: 'deposits',     icon: <Wallet className="h-3.5 w-3.5" />,           label: 'Deposits'       },
              { value: 'ledger',       icon: <FileSpreadsheet className="h-3.5 w-3.5" />,  label: 'Ledger'         },
              { value: 'history',      icon: <History className="h-3.5 w-3.5" />,          label: 'History'        },
            ] as { value: string; icon: React.ReactNode; label: string }[]).map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center shrink-0 gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-white/5 data-[state=active]:text-white data-[state=active]:shadow-lg"
                style={{ ['--tw-data-active-bg' as any]: 'transparent' }}
                data-tab={tab.value}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </TabsTrigger>
            ))}
            {session?.role === "SUPER_ADMIN" && (
              <TabsTrigger value="manageadmins"
                className="flex items-center shrink-0 gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 data-[state=active]:text-white"
                style={{ color: 'oklch(0.70 0.22 27)' }}>
                <UserCog className="h-3.5 w-3.5" />
                <span>Admins</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* TAB 1: OVERVIEW DASHBOARD METRICS */}
          <TabsContent value="overview" className="mt-5 animate-slide-in-up space-y-4">
  <OverviewTab props={tabProps} />
</TabsContent>

          {/* TAB 2: RULES / SETTINGS */}
          <TabsContent value="settings" className="mt-5 animate-slide-in-up space-y-4">
  <SettingsTab props={tabProps} />
</TabsContent>

          {/* TAB 3: MEMBER MANAGEMENT MODULE */}
          <TabsContent value="members" className="mt-5 animate-slide-in-up space-y-4">
  <MembersTab props={tabProps} />
</TabsContent>

          {/* TAB 4: MARKET & GROCERY INVENTORY MODULE */}
          <TabsContent value="markets" className="mt-5 animate-slide-in-up space-y-4">
  <MarketsTab props={tabProps} />
</TabsContent>

          {/* TAB 5: EXTRA MARKET SUMMARY MODULE */}
          <TabsContent value="extramarkets" className="mt-5 animate-slide-in-up space-y-4">
  <ExtramarketsTab props={tabProps} />
</TabsContent>

          {/* TAB 6: OVERHEAD BILLS & AUTO-FINE ENGINE */}
          <TabsContent value="overheads" className="mt-5 animate-slide-in-up space-y-4">
  <OverheadsTab props={tabProps} />
</TabsContent>

          {/* TAB: DAILY MEALS MANAGER */}
          <TabsContent value="dailymeals" className="mt-5 animate-slide-in-up space-y-4">
  <DailymealsTab props={tabProps} />
</TabsContent>

          {/* TAB 6.5: SPECIFIC BILLS MODULE */}
          <TabsContent value="specificbills" className="mt-5 animate-slide-in-up space-y-4">
  <SpecificbillsTab props={tabProps} />
</TabsContent>

          {/* TAB: DEPOSITS MODULE */}
          <TabsContent value="deposits" className="mt-5 animate-slide-in-up space-y-4">
  <DepositsTab props={tabProps} />
</TabsContent>


          {/* TAB 7: MASTER LEDGER & EXPORT */}
          <TabsContent value="ledger" className="mt-5 animate-slide-in-up space-y-4">
  <LedgerTab props={tabProps} />
</TabsContent>

          {/* TAB 8: HISTORY (Finalized Snapshots) */}
          <TabsContent value="history" className="mt-5 animate-slide-in-up space-y-4">
  <HistoryTab props={tabProps} />
</TabsContent>

          {/* SUPER ADMIN ONLY: Manage Admins Tab */}
          {session?.role === "SUPER_ADMIN" && (
            <TabsContent value="manageadmins" className="mt-5 animate-slide-in-up space-y-4">
  <ManageadminsTab props={tabProps} />
</TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}

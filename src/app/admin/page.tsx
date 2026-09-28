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
  const [hasSelectedMonth, setHasSelectedMonth] = useState(false);

  // Session & Super Admin state
  const [session, setSession] = useState<any>(null);
  const [managers, setManagers] = useState<any[]>([]);
  const [isAddManagerOpen, setIsAddManagerOpen] = useState(false);
  const [managerForm, setManagerForm] = useState({ name: "", email: "", phone: "", password: "", role: "ADMIN" });
  const [managerError, setManagerError] = useState("");

  // Month selector state
  const defaultMonthYear = () => {
    const d = new Date();
    return `${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
  };
  const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonthYear());
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

  const fetchData = async (month?: string, dismissPopup = false) => {
    setLoading(true);
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
    setLoading(false);
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
    await fetchData();
    toast.success("Deposit updated successfully!");
  };

  const handleDeleteDeposit = async (depId: string, amount: number, memberName: string) => {
    if (!window.confirm(`${memberName} এর ৳${amount} ডিপোজিটটি মুছে ফেলতে চান?`)) return;
    const formData = new FormData();
    formData.append("id", depId);
    await deleteDeposit(formData);
    await fetchData();
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
    await fetchData();
    toast.success(`"${monthLabel}" এর হিস্ট্রি মুছে ফেলা হয়েছে!`);
  };

  useEffect(() => {
    // Initial background load — do NOT dismiss the popup (user must click "Start Managing")
    fetchData(undefined, false);
    fetchDailyMeals(selectedMealDate);
    fetchAvailableMonths();
    fetchSnapshots();
    // Fetch session to detect Super Admin role
    getSession().then(setSession);
    getManagersAction().then(setManagers);
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

      await saveAllDailyMeals(mealsData);
      await Promise.all([fetchDailyMeals(selectedMealDate), fetchData()]);
      toast.success("All meals saved successfully!");
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
    await fetchData();
    toast.success("Mess Rules updated successfully!");
  };

  const handleRemoveMember = async (memberId: string) => {
    if (window.confirm("Are you sure you want to remove this member? All their data will be deleted.")) {
      const formData = new FormData();
      formData.append("memberId", memberId);
      await removeMember(formData);
      await fetchData();
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
      await fetchData();
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
    await fetchData();
    (e.target as HTMLFormElement).reset();
    toast.success("Specific Bill Added!");
  };

  const handleAddMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await addMember(formData);
    setIsMemberDialogOpen(false);
    setAddMemberForm({ name: "", emailPrefix: "", emailSuffix: "@gmail.com" });
    await fetchData();
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
    await fetchData();
    toast.success("Market entry added successfully!");
  };


  const handleEditMarket = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await updateMarketEntry(formData);
    setIsEditMarketDialogOpen(false);
    setEditingMarket(null);
    await fetchData();
  };

  const handleEditSpecificBill = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await updateSpecificBill(formData);
    setIsEditSpecificBillDialogOpen(false);
    setEditingMember(null);
    await fetchData();
  };

  const handleAddDeposit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await addDeposit(formData);
    setIsDepositDialogOpen(false);
    await fetchData();
  };

  const handleSaveFineOverride = async (memberId: string, customFine: number) => {
    const formData = new FormData();
    formData.append("memberId", memberId);
    formData.append("marketFine", customFine.toString());
    formData.append("monthYear", selectedMonth);
    await saveFineOverride(formData);
    await fetchData();
  };

  const handleRevertFineOverride = async (memberId: string) => {
    const formData = new FormData();
    formData.append("memberId", memberId);
    formData.append("monthYear", selectedMonth);
    await revertFineOverride(formData);
    await fetchData();
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
        isSnapshot ? m.adjustedOverheads.toFixed(0) : (m.baseKhala * m.M_X2).toFixed(0),
        (m.baseManager * m.M_X2).toFixed(0),
        m.paper.toFixed(0),
        m.current.toFixed(0),
        (m.baseGas * m.M_X2).toFixed(0),
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
      totalKhala += m.baseKhala * m.M_X2;
      totalManager += m.baseManager * m.M_X2;
      totalPaper += m.paper;
      totalCurrent += m.current;
      totalGas += m.baseGas * m.M_X2;
      totalFest += m.festival;
      totalFine += m.marketFine;
      totalCostAll += m.totalCost;

      return [
        (index + 1).toString() + ".",
        m.member.user.name,
        m.totalMeals,
        m.individualMealCost.toFixed(2),
        isSnapshot ? m.adjustedOverheads.toFixed(0) : (m.baseKhala * m.M_X2).toFixed(0),
        (m.baseManager * m.M_X2).toFixed(0),
        m.paper.toFixed(0),
        m.current.toFixed(0),
        (m.baseGas * m.M_X2).toFixed(0),
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
              className="w-full h-11 text-sm font-bold btn-glow rounded-xl"
              onClick={() => fetchData(selectedMonth, true)}
            >
              Start Managing →
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
                onChange={(e) => setSelectedMonth(`${selectedMonth.split('-')[0]}-${e.target.value}`)}
                onBlur={(e) => { if (e.target.value.length === 4) fetchData(`${selectedMonth.split('-')[0]}-${e.target.value}`); }}
                onKeyDown={(e) => { if (e.key === 'Enter' && e.currentTarget.value.length === 4) fetchData(`${selectedMonth.split('-')[0]}-${e.currentTarget.value}`); }}
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
          <TabsContent value="overview" className="space-y-5 mt-5 animate-slide-in-up">

            {/* Primary KPI cards */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <div className="stat-card stat-card-indigo card-hover">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Active Members</p>
                <div className="text-3xl font-extrabold" style={{ color: 'oklch(0.72 0.22 275)' }}>{data.members.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Full mess enrollment</p>
              </div>
              <div className="stat-card stat-card-amber card-hover">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Total Meals</p>
                <div className="text-3xl font-extrabold" style={{ color: 'oklch(0.78 0.18 80)' }}>{data.totalMessMeals}</div>
                <p className="text-xs text-muted-foreground mt-1">Consumed this month</p>
              </div>
              <div className="stat-card stat-card-cyan card-hover">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Market Expenses</p>
                <div className="text-3xl font-extrabold" style={{ color: 'oklch(0.72 0.18 200)' }}>৳ {data.totalMarketCost.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">Grocery & raw materials</p>
              </div>
              <div className="stat-card stat-card-emerald card-hover">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Live Meal Rate</p>
                <div className="text-3xl font-extrabold" style={{ color: 'oklch(0.70 0.19 162)' }}>৳ {data.liveMealRate.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">Market Cost ÷ Total Meals</p>
              </div>
            </div>

            {/* Secondary Financial Totals */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
              <div className="stat-card card-hover">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Total Cash Deposits</p>
                <div className="text-2xl font-bold" style={{ color: 'oklch(0.70 0.19 162)' }}>৳ {data.grandTotalDeposits.toLocaleString()}</div>
              </div>
              <div className="stat-card card-hover">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Total Pending Dues</p>
                <div className="text-2xl font-bold" style={{ color: 'oklch(0.65 0.24 27)' }}>৳ {data.grandTotalDues.toFixed(2)}</div>
              </div>
              <div className="stat-card card-hover">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Total Excess Advances</p>
                <div className="text-2xl font-bold" style={{ color: 'oklch(0.72 0.18 200)' }}>৳ {data.grandTotalAdvances.toFixed(2)}</div>
              </div>
            </div>

            {/* Member Overview Table */}
            <div className="section-panel">
              <div className="section-panel-header">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Member Quick Summary</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Members exceeding {data.settings.needX2MealLimit} extra meals → Need X2 (2× overhead bills)</p>
                </div>
              </div>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Member Name</th>
                      <th>Room</th>
                      <th>Total Meals</th>
                      <th>Extra Meals</th>
                      <th>Status</th>
                      <th>Deposits</th>
                      <th>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.members.map((m: any) => (
                      <tr key={m.member.id}>
                        <td className="font-semibold text-foreground">{m.member.user.name}</td>
                        <td><span className="badge-indigo">{m.member.roomNo}</span></td>
                        <td className="font-medium">{m.totalMeals}</td>
                        <td className="font-medium">{m.totalExtraMeals}</td>
                        <td>
                          {m.isNeedX2 ? (
                            <span className="badge-rose flex items-center gap-1 w-fit">
                              <AlertTriangle className="w-3 h-3" /> X2
                            </span>
                          ) : (
                            <span className="badge-emerald">Normal</span>
                          )}
                        </td>
                        <td className="font-medium">৳ {m.totalDeposits}</td>
                        <td className="font-bold">
                          {m.due > 0 ? (
                            <span style={{ color: 'oklch(0.68 0.22 27)' }}>Due ৳{m.due.toFixed(2)}</span>
                          ) : (
                            <span style={{ color: 'oklch(0.70 0.19 162)' }}>+৳{m.advance.toFixed(2)}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: RULES / SETTINGS */}
          <TabsContent value="settings" className="mt-5 animate-slide-in-up">
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
          </TabsContent>

          {/* TAB 3: MEMBER MANAGEMENT MODULE */}
          <TabsContent value="members" className="mt-5 space-y-4 animate-slide-in-up">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="text-sm font-bold text-foreground">Registered Mess Members</h2>
              <Dialog open={isMemberDialogOpen} onOpenChange={(open) => {
                setIsMemberDialogOpen(open);
                if (!open) setAddMemberForm({ name: "", emailPrefix: "", emailSuffix: "@gmail.com" });
              }}>
                <Button className="gap-2 btn-glow h-9 text-xs" onClick={() => setIsMemberDialogOpen(true)}><PlusCircle className="w-3.5 h-3.5" /> Add New Member</Button>
                <DialogContent className="rounded-2xl mx-4 sm:mx-auto max-w-md">
                  <DialogHeader>
                    <DialogTitle className="font-bold">Register New Mess Member</DialogTitle>
                    <DialogDescription>Add a new member to the active mess roll.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddMember} className="space-y-3 pt-2">
                    <div className="space-y-1.5"><Label className="text-xs font-semibold">Full Name</Label><Input name="name" value={addMemberForm.name} onChange={(e) => { const name = e.target.value; const emailPrefix = name.replace(/\s+/g, "_").toLowerCase(); setAddMemberForm(prev => ({ ...prev, name, emailPrefix })); }} placeholder="Member Name" required className="h-10 rounded-xl bg-white/5 border-white/10 text-foreground" /></div>
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
                    <Button type="submit" className="w-full h-10 font-bold btn-glow">Register Member</Button>
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
                  <form onSubmit={handleEditMember} className="space-y-3 pt-2">
                    <div className="space-y-1.5"><Label className="text-xs font-semibold">Full Name</Label><Input value={editMemberForm.name} onChange={(e) => setEditMemberForm({ ...editMemberForm, name: e.target.value })} placeholder="Member Name" required className="h-10 rounded-xl bg-white/5 border-white/10 text-foreground" /></div>
                    <div className="space-y-1.5"><Label className="text-xs font-semibold">Email Address</Label><Input type="email" value={editMemberForm.email} onChange={(e) => setEditMemberForm({ ...editMemberForm, email: e.target.value })} placeholder="user@mess.com" required className="h-10 rounded-xl bg-white/5 border-white/10 text-foreground" /></div>
                    <div className="space-y-1.5"><Label className="text-xs font-semibold">Phone Number (Optional)</Label><Input value={editMemberForm.phone} onChange={(e) => setEditMemberForm({ ...editMemberForm, phone: e.target.value })} placeholder="017XXXXXXXX" className="h-10 rounded-xl bg-white/5 border-white/10 text-foreground" /></div>
                    <div className="space-y-1.5"><Label className="text-xs font-semibold">New Password (Leave blank to keep same)</Label><Input type="text" value={editMemberForm.password} onChange={(e) => setEditMemberForm({ ...editMemberForm, password: e.target.value })} placeholder="New Password" className="h-10 rounded-xl bg-white/5 border-white/10 text-foreground" /></div>
                    {editMemberError && <p className="text-sm font-medium" style={{ color: 'oklch(0.68 0.22 27)' }}>{editMemberError}</p>}
                    <Button type="submit" className="w-full h-10 font-bold btn-glow">Save Changes</Button>
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
                              <Pencil className="w-3 h-3" /> Edit
                            </Button>
                            <Button onClick={() => handleRemoveMember(m.member.id)} variant="destructive" size="sm"
                              className="h-7 px-2.5 text-xs rounded-lg font-semibold">
                              Remove
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* TAB 4: MARKET & GROCERY INVENTORY MODULE */}
          <TabsContent value="markets" className="mt-5 space-y-4 animate-slide-in-up">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="text-sm font-bold text-foreground">Market Expenses &amp; Grocery Log</h2>
              <Dialog open={isMarketDialogOpen} onOpenChange={setIsMarketDialogOpen}>
                <Button className="gap-2 btn-glow h-9 text-xs" onClick={() => setIsMarketDialogOpen(true)}><PlusCircle className="w-3.5 h-3.5" /> Log Market Expense</Button>
                <DialogContent className="rounded-2xl mx-4 sm:mx-auto max-w-md">
                  <DialogHeader><DialogTitle className="font-bold">Log Grocery Market Entry</DialogTitle><DialogDescription>Record market expenditure.</DialogDescription></DialogHeader>
                  <form onSubmit={handleAddMarket} className="space-y-3 pt-2">
                    <div className="space-y-1.5"><Label className="text-xs font-semibold">Market Date</Label><Input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required className="h-10 rounded-xl bg-white/5 border-white/10 text-foreground" /></div>
                    <div className="space-y-1.5"><Label className="text-xs font-semibold">Marketer</Label><select name="marketerId" className="w-full h-10 px-3 rounded-xl text-sm font-medium focus:outline-none" style={{ background: 'oklch(0.18 0.02 260)', border: '1px solid oklch(1 0 0 / 12%)', color: 'oklch(0.93 0.01 260)' }} required>{data.members.map((m: any) => <option key={m.member.id} value={m.member.id} style={{ background: 'oklch(0.18 0.02 260)' }}>{m.member.user.name} (Room {m.member.roomNo})</option>)}</select></div>
                    <div className="space-y-1.5"><Label className="text-xs font-semibold">Amount (Tk)</Label><Input name="amount" type="number" placeholder="2500" required className="h-10 rounded-xl bg-white/5 border-white/10 text-foreground" /></div>
                    <Button type="submit" className="w-full h-10 font-bold btn-glow">Save Market Entry</Button>
                  </form>
                </DialogContent>
              </Dialog>
              <Dialog open={isEditMarketDialogOpen} onOpenChange={(open) => { setIsEditMarketDialogOpen(open); if (!open) setEditingMarket(null); }}>
                <DialogContent className="rounded-2xl mx-4 sm:mx-auto max-w-md">
                  <DialogHeader><DialogTitle className="font-bold">Edit Market Entry</DialogTitle><DialogDescription>Modify existing market details.</DialogDescription></DialogHeader>
                  {editingMarket && (
                    <form onSubmit={handleEditMarket} className="space-y-3 pt-2">
                      <input type="hidden" name="id" value={editingMarket.id} />
                      <div className="space-y-1.5"><Label className="text-xs font-semibold">Market Date</Label><Input type="date" defaultValue={new Date(editingMarket.date).toISOString().split('T')[0]} disabled className="h-10 rounded-xl bg-white/5 border-white/10 text-muted-foreground opacity-60" /><p className="text-xs text-muted-foreground">Date cannot be changed.</p></div>
                      <div className="space-y-1.5"><Label className="text-xs font-semibold">Marketer</Label><select name="marketerId" defaultValue={editingMarket.marketerId} className="w-full h-10 px-3 rounded-xl text-sm font-medium focus:outline-none" style={{ background: 'oklch(0.18 0.02 260)', border: '1px solid oklch(1 0 0 / 12%)', color: 'oklch(0.93 0.01 260)' }} required>{data.members.map((m: any) => <option key={m.member.id} value={m.member.id} style={{ background: 'oklch(0.18 0.02 260)' }}>{m.member.user.name} (Room {m.member.roomNo})</option>)}</select></div>
                      <div className="space-y-1.5"><Label className="text-xs font-semibold">Amount (Tk)</Label><Input name="amount" type="number" defaultValue={editingMarket.amount} required className="h-10 rounded-xl bg-white/5 border-white/10 text-foreground" /></div>
                      <Button type="submit" className="w-full h-10 font-bold btn-glow">Update Market Entry</Button>
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
                          <td className="font-medium">{new Date(m.date).toLocaleDateString()}</td>
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
                              <Button variant="destructive" size="sm" onClick={async () => { if (confirm("Delete this market entry?")) { const fd = new FormData(); fd.append("id", m.id); await deleteMarketEntry(fd); await fetchData(); } }} className="h-7 px-2.5 text-xs rounded-lg">Delete</Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* TAB 5: EXTRA MARKET SUMMARY MODULE */}
          <TabsContent value="extramarkets" className="mt-5 space-y-4 animate-slide-in-up">
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
          </TabsContent>

          {/* TAB 6: OVERHEAD BILLS & AUTO-FINE ENGINE */}
          <TabsContent value="overheads" className="mt-5 space-y-4 animate-slide-in-up">
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
          </TabsContent>

          {/* TAB: DAILY MEALS MANAGER */}
          <TabsContent value="dailymeals" className="mt-5 space-y-4 animate-slide-in-up">
            <div className="section-panel">
              <div className="section-panel-header">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Daily Meals Management</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Add or override daily meals for all members.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="mealDate" className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Date:</Label>
                  <Input id="mealDate" type="date" value={selectedMealDate} onChange={handleMealDateChange}
                    className="h-9 rounded-xl bg-white/5 border-white/10 text-foreground w-36 text-sm" />
                </div>
              </div>
              {loadingDailyMeals ? (
                <div className="flex justify-center p-8">
                  <RefreshCw className="h-7 w-7 animate-spin" style={{ color: 'oklch(0.65 0.25 275)' }} />
                </div>
              ) : (
                <>
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead><tr><th>Member Name</th><th>Total Meal</th><th>Room</th><th>Status</th></tr></thead>
                      <tbody>
                        {dailyMealsData.map((m: any) => {
                          const hasSubmitted = !!m.mealRecord;
                          const val = mealInputValues[m.memberId] !== undefined ? mealInputValues[m.memberId] : (hasSubmitted ? m.mealRecord.totalMeal : 0);
                          return (
                            <tr key={m.memberId}>
                              <td className="font-semibold text-foreground">{m.name}</td>
                               <td className="py-3">
                                 <div className="flex items-center gap-2 flex-wrap">
                                   <div className="flex items-center gap-1">
                                     <button type="button" onClick={() => setMealInputValues((prev) => ({ ...prev, [m.memberId]: Math.max(0, (prev[m.memberId] !== undefined ? prev[m.memberId] : val) - 0.5) }))} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 font-extrabold text-sm flex items-center justify-center text-foreground cursor-pointer">-</button>
                                     <Input type="number" step="0.5" value={val}
                                       onChange={(e) => { const v = parseFloat(e.target.value) || 0; setMealInputValues((prev) => ({ ...prev, [m.memberId]: v })); }}
                                       id={`meal-${m.memberId}`}
                                       className="w-16 h-8 text-center px-1 rounded-lg bg-white/5 border-white/10 text-foreground font-bold text-sm" />
                                     <button type="button" onClick={() => setMealInputValues((prev) => ({ ...prev, [m.memberId]: (prev[m.memberId] !== undefined ? prev[m.memberId] : val) + 0.5 }))} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 font-extrabold text-sm flex items-center justify-center text-foreground cursor-pointer">+</button>
                                   </div>
                                   <div className="flex items-center gap-1 flex-wrap">
                                     {[0, 1, 1.5, 2, 2.5].map((preset) => (
                                       <button key={preset} type="button" onClick={() => setMealInputValues((prev) => ({ ...prev, [m.memberId]: preset }))} className={`px-2 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${val === preset ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10'}`}>{preset}</button>
                                     ))}
                                   </div>
                                 </div>
                               </td>
                               <td><span className="badge-indigo">{m.roomNo}</span></td>
                               <td>{hasSubmitted ? <span className="badge-emerald">Submitted</span> : <span className="badge-amber">Pending</span>}</td>
                             </tr>
                           );
                         })}
                       </tbody>
                     </table>
                   </div>
                   <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-t" style={{ borderColor: 'oklch(1 0 0 / 7%)' }}>
                     <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold" style={{ background: 'oklch(0.65 0.25 275 / 10%)', border: '1px solid oklch(0.65 0.25 275 / 20%)', color: 'oklch(0.75 0.20 275)' }}>
                       <Utensils className="w-4 h-4" />
                       <span>Total Day Meals:</span>
                       <span className="text-base font-extrabold">{Object.values(mealInputValues).reduce((sum, v) => sum + (v || 0), 0)}</span>
                     </div>
                     <Button onClick={handleSaveAllMeals} disabled={isSavingMeals} className="btn-glow font-bold h-10 px-6 rounded-xl text-sm">
                       {isSavingMeals ? "Saving Meals..." : "Save All Meals"}
                     </Button>
                   </div>
                </>
              )}
            </div>
          </TabsContent>

          {/* TAB 6.5: SPECIFIC BILLS MODULE */}
          <TabsContent value="specificbills" className="mt-5 space-y-4 animate-slide-in-up">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-1">
                <div className="section-panel h-full">
                  <div className="section-panel-header">
                    <div><h3 className="text-sm font-bold text-foreground">Add Specific Bill</h3><p className="text-xs text-muted-foreground mt-0.5">Assign a bill to specific members.</p></div>
                  </div>
                  <div className="p-4">
                    <form onSubmit={handleAddSpecificBill} className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Select Members</Label>
                        <div className="rounded-xl p-3 max-h-48 overflow-y-auto space-y-1" style={{ background: 'oklch(0.18 0.02 260)', border: '1px solid oklch(1 0 0 / 10%)' }}>
                          {data.members.map((m: any) => (
                            <label key={m.member.id} className="flex items-center gap-2 cursor-pointer rounded-lg px-2 py-1.5 transition-colors hover:bg-white/5">
                              <input type="checkbox" name="memberId" value={m.member.id} className="w-4 h-4 rounded" style={{ accentColor: 'oklch(0.65 0.25 275)' }} />
                              <span className="text-sm font-medium text-foreground">{m.member.user.name}</span>
                              <span className="text-xs text-muted-foreground ml-auto">R{m.member.roomNo}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Bill Category</Label>
                        <select name="description" required className="w-full h-10 px-3 rounded-xl text-sm font-medium focus:outline-none" style={{ background: 'oklch(0.18 0.02 260)', border: '1px solid oklch(1 0 0 / 12%)', color: 'oklch(0.93 0.01 260)' }}>
                          <option value="">Select category...</option>
                          {['Khala Bill','Manager Bill','Paper Bill','Current Bill','Gas Bill','Fest Meal','Market Fine','Other'].map(c => <option key={c} value={c} style={{ background: 'oklch(0.18 0.02 260)' }}>{c}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Amount (Tk)</Label>
                        <Input name="amount" type="number" step="0.01" min="0" required className="h-10 rounded-xl bg-white/5 border-white/10 text-foreground" />
                      </div>
                      <Button type="submit" className="w-full h-10 font-bold btn-glow text-sm">Add Bill to Selected Members</Button>
                    </form>
                  </div>
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="section-panel h-full">
                  <div className="section-panel-header"><h3 className="text-sm font-bold text-foreground">Recent Specific Bills</h3></div>
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead><tr><th>Member</th><th>Description</th><th>Amount</th><th className="text-right">Edit</th></tr></thead>
                      <tbody>
                        {data.members.filter((m: any) => m.member.specificBills && m.member.specificBills.length > 0).map((m: any) => {
                          const totalAmount = m.member.specificBills.reduce((sum: number, bill: any) => sum + parseFloat(bill.amount), 0);
                          const descriptionStr = m.member.specificBills.map((bill: any) => `${bill.description} - ${bill.amount}`).join(", ");
                          return (
                            <tr key={m.member.id}>
                              <td className="font-semibold text-foreground">{m.member.user.name}</td>
                              <td className="max-w-[200px] truncate text-muted-foreground text-xs" title={descriptionStr}>{descriptionStr}</td>
                              <td className="font-bold" style={{ color: 'oklch(0.70 0.19 162)' }}>৳ {totalAmount.toFixed(2)}</td>
                              <td className="text-right"><Button variant="outline" size="sm" onClick={() => { setEditingMember(m.member); setIsEditSpecificBillDialogOpen(true); }} className="h-7 px-2.5 text-xs rounded-lg border-white/10 hover:bg-white/5 text-muted-foreground">Edit</Button></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Specific Bill Dialog */}
            <Dialog open={isEditSpecificBillDialogOpen} onOpenChange={(open) => { setIsEditSpecificBillDialogOpen(open); if (!open) { setEditingMember(null); setEditingBillId(null); } }}>
              <DialogContent className="rounded-2xl mx-4 sm:mx-auto max-w-md max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle className="font-bold">Manage Bills: {editingMember?.user?.name}</DialogTitle>
                  <DialogDescription>Edit or remove individual bills.</DialogDescription>
                </DialogHeader>
                <datalist id="edit-bill-categories">
                  {['Khala Bill','Manager Bill','Paper Bill','Current Bill','Gas Bill','Fest Meal','Market Fine','Other'].map(c => <option key={c} value={c} />)}
                </datalist>
                <div className="space-y-2 pt-2 overflow-y-auto flex-1 pr-1">
                  {editingMember?.specificBills?.map((bill: any) => {
                    const isEditingThisBill = editingBillId === bill.id;
                    if (isEditingThisBill) {
                      return (
                        <div key={bill.id} className="p-3 rounded-xl space-y-2.5" style={{ background: 'oklch(0.65 0.25 275 / 8%)', border: '1px solid oklch(0.65 0.25 275 / 20%)' }}>
                          <div className="grid grid-cols-2 gap-2">
                            <div><label className="text-[11px] font-semibold text-muted-foreground block mb-1">Category</label><input type="text" list="edit-bill-categories" value={editBillCategory} onChange={(e) => setEditBillCategory(e.target.value)} className="w-full h-8 px-2.5 text-xs rounded-lg focus:outline-none" style={{ background: 'oklch(0.18 0.02 260)', border: '1px solid oklch(1 0 0 / 12%)', color: 'oklch(0.93 0.01 260)' }} /></div>
                            <div><label className="text-[11px] font-semibold text-muted-foreground block mb-1">Amount (Tk)</label><input type="number" step="0.01" min="0" value={editBillAmount} onChange={(e) => setEditBillAmount(e.target.value)} className="w-full h-8 px-2.5 text-xs rounded-lg focus:outline-none" style={{ background: 'oklch(0.18 0.02 260)', border: '1px solid oklch(1 0 0 / 12%)', color: 'oklch(0.93 0.01 260)' }} /></div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setEditingBillId(null)} className="h-7 px-2.5 text-xs rounded-lg">Cancel</Button>
                            <Button size="sm" onClick={async () => { if (!editBillCategory.trim() || !editBillAmount) return; const fd = new FormData(); fd.append("id", bill.id); fd.append("description", editBillCategory); fd.append("amount", editBillAmount); await updateSpecificBill(fd); setEditingMember((prev: any) => ({ ...prev, specificBills: prev.specificBills.map((b: any) => b.id === bill.id ? { ...b, description: editBillCategory, amount: parseFloat(editBillAmount) || 0 } : b) })); await fetchData(); setEditingBillId(null); }} className="h-7 px-3 text-xs font-semibold btn-glow rounded-lg">Save</Button>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={bill.id} className="flex justify-between items-center p-3 rounded-xl" style={{ background: 'oklch(0.16 0.018 260)', border: '1px solid oklch(1 0 0 / 8%)' }}>
                        <div><p className="font-semibold text-sm text-foreground">{bill.description}</p><p className="text-xs font-bold" style={{ color: 'oklch(0.70 0.19 162)' }}>৳ {parseFloat(bill.amount).toFixed(2)}</p></div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => { setEditingBillId(bill.id); setEditBillCategory(bill.description); setEditBillAmount(bill.amount.toString()); }} className="h-7 px-2.5 text-xs rounded-lg border-white/10 hover:bg-white/5 text-muted-foreground">Edit</Button>
                          <Button variant="destructive" size="sm" onClick={async () => { if (confirm("Delete this bill?")) { const fd = new FormData(); fd.append("id", bill.id); await deleteSpecificBill(fd); setEditingMember((prev: any) => ({ ...prev, specificBills: prev.specificBills.filter((b: any) => b.id !== bill.id) })); await fetchData(); } }} className="h-7 px-2.5 text-xs rounded-lg">Delete</Button>
                        </div>
                      </div>
                    );
                  })}
                  {(!editingMember?.specificBills || editingMember.specificBills.length === 0) && <p className="text-center text-sm text-muted-foreground py-4">No bills left.</p>}
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* TAB: DEPOSITS MODULE */}
          <TabsContent value="deposits" className="mt-5 space-y-4 animate-slide-in-up">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-1">
                <div className="section-panel h-full">
                  <div className="section-panel-header">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, oklch(0.55 0.26 278), oklch(0.50 0.22 265))' }}>
                        <DollarSign className="w-4 h-4 text-white" />
                      </div>
                      <div><h3 className="text-sm font-bold text-foreground">Add Member Deposit</h3><p className="text-xs text-muted-foreground">Record cash deposit</p></div>
                    </div>
                  </div>
                  <div className="p-4">
                    <form onSubmit={async (e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); await addDeposit(fd); (e.target as HTMLFormElement).reset(); await fetchData(); toast.success("Deposit added successfully!"); }} className="space-y-3">
                      <div className="space-y-1.5"><Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Select Member</Label><select name="memberId" required className="w-full h-10 px-3 rounded-xl text-sm font-medium focus:outline-none" style={{ background: 'oklch(0.18 0.02 260)', border: '1px solid oklch(1 0 0 / 12%)', color: 'oklch(0.93 0.01 260)' }}><option value="">Choose a member...</option>{data.members.map((m: any) => <option key={m.member.id} value={m.member.id} style={{ background: 'oklch(0.18 0.02 260)' }}>{m.member.user.name} (R{m.member.roomNo})</option>)}</select></div>
                      <div className="space-y-1.5"><Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Deposit Amount (Tk)</Label><Input name="amount" type="number" step="0.01" min="1" placeholder="3000" required className="h-10 rounded-xl bg-white/5 border-white/10 text-foreground" /></div>
                      <div className="space-y-1.5"><Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Deposit Date</Label><Input name="date" type="date" required defaultValue={new Date().toISOString().split("T")[0]} className="h-10 rounded-xl bg-white/5 border-white/10 text-foreground" /></div>
                      <Button type="submit" className="w-full h-10 font-bold btn-glow text-sm gap-2"><CheckCircle2 className="w-4 h-4" /> Record Deposit</Button>
                    </form>
                  </div>
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="section-panel h-full">
                  <div className="section-panel-header"><div><h3 className="text-sm font-bold text-foreground">All Member Deposits</h3><p className="text-xs text-muted-foreground mt-0.5">Summed automatically per member</p></div></div>
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead><tr><th>Member</th><th>Room</th><th>Prev. Due</th><th>Prev. Advance</th><th className="min-w-[200px]">Deposit History & Actions</th><th>Total Deposited</th><th>Balance</th></tr></thead>
                      <tbody>
                        {data.members.map((m: any) => {
                          const netDepositBalance = m.totalDeposits + m.previousAdvance - m.previousDue;
                          return (
                            <tr key={m.member.id}>
                              <td className="font-semibold text-foreground">{m.member.user.name}</td>
                              <td><span className="badge-indigo">{m.member.roomNo}</span></td>
                              <td>{m.previousDue > 0 ? <span className="font-bold" style={{ color: 'oklch(0.68 0.22 27)' }}>৳{m.previousDue.toFixed(2)}</span> : <span className="text-muted-foreground">—</span>}</td>
                              <td>{m.previousAdvance > 0 ? <span className="font-bold" style={{ color: 'oklch(0.70 0.19 162)' }}>৳{m.previousAdvance.toFixed(2)}</span> : <span className="text-muted-foreground">—</span>}</td>
                              <td>
                                <div className="flex flex-col gap-1.5">
                                  {m.member.deposits?.length > 0 ? (
                                    m.member.deposits.map((dep: any) => (
                                      <div key={dep.id} className="flex items-center justify-between gap-2 p-1.5 rounded-lg border bg-white/5 border-white/10">
                                        <div className="flex items-center gap-2">
                                          <span className="badge-cyan text-[11px]">{new Date(dep.date).toLocaleDateString()}</span>
                                          <span className="font-bold text-xs" style={{ color: 'oklch(0.70 0.19 162)' }}>৳{dep.amount.toLocaleString()}</span>
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
                                            <Pencil className="w-3.5 h-3.5" />
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteDeposit(dep.id, dep.amount, m.member.user.name)}
                                            className="h-6 w-6 p-0 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-md"
                                            title="Delete Deposit"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
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
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Deposit Dialog */}
            <Dialog open={isEditDepositDialogOpen} onOpenChange={setIsEditDepositDialogOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Edit Deposit</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Update deposit amount or date for {editingDeposit?.memberName || "Member"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpdateDeposit} className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Deposit Amount (Tk)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="1"
                      value={editDepositAmount}
                      onChange={(e) => setEditDepositAmount(e.target.value)}
                      required
                      className="h-10 rounded-xl bg-white/5 border-white/10 text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Deposit Date</Label>
                    <Input
                      type="date"
                      value={editDepositDate}
                      onChange={(e) => setEditDepositDate(e.target.value)}
                      required
                      className="h-10 rounded-xl bg-white/5 border-white/10 text-foreground"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" type="button" onClick={() => setIsEditDepositDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" className="btn-glow font-bold">Save Changes</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>


          {/* TAB 7: MASTER LEDGER & EXPORT */}
          <TabsContent value="ledger" className="mt-5 space-y-4 animate-slide-in-up">
            <DiningCalcCard selectedMonth={selectedMonth} />
            <div className="section-panel">
              <div className="section-panel-header">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Monthly Master Audit Ledger</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Complete breakdown of meals, overheads, deposits, and net balance.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button onClick={handleFinalizeMonth} disabled={isFinalizing} size="sm"
                    className="btn-glow h-9 px-3 text-xs font-bold gap-2 rounded-xl">
                    <Lock className="w-3.5 h-3.5" />{isFinalizing ? "Saving..." : "Finalize & Save"}
                  </Button>
                  <div className="flex items-center gap-1.5">
                    <Button size="sm" variant="ghost" onClick={exportToPDF} className="h-8 px-2.5 text-xs rounded-lg gap-1 text-muted-foreground hover:text-foreground hover:bg-white/5">
                      <FileText className="w-3.5 h-3.5" style={{ color: 'oklch(0.68 0.22 27)' }} /> PDF
                    </Button>
                    <Button size="sm" variant="ghost" onClick={exportToWord} className="h-8 px-2.5 text-xs rounded-lg gap-1 text-muted-foreground hover:text-foreground hover:bg-white/5">
                      <FileText className="w-3.5 h-3.5" style={{ color: 'oklch(0.55 0.26 278)' }} /> Word
                    </Button>
                    <Button size="sm" variant="ghost" onClick={exportDailyMealsPDF} className="h-8 px-2.5 text-xs rounded-lg gap-1 text-muted-foreground hover:text-foreground hover:bg-white/5">
                      <FileText className="w-3.5 h-3.5" /> Meals PDF
                    </Button>
                  </div>
                </div>
              </div>
              <div className="table-responsive">
                <table className="data-table">
                  <thead><tr>
                    <th>SI</th><th>Name</th><th>Meals</th><th>Meal Cost</th>
                    <th>Khala</th><th>Manager</th><th>Paper</th><th>Current</th><th>Gas</th><th>Fest</th><th>Fine</th>
                    <th>Total Cost</th><th>Deposit</th><th>Due</th><th>Advance</th>
                  </tr></thead>
                  <tbody>
                    {data.members.map((m: any, index: number) => (
                      <tr key={m.member.id}>
                        <td className="text-muted-foreground">{index + 1}</td>
                        <td className="font-semibold text-foreground whitespace-nowrap">{m.member.user.name}</td>
                        <td className="font-medium">{m.totalMeals}</td>
                        <td>৳{m.individualMealCost.toFixed(2)}</td>
                        <td>৳{(m.baseKhala * m.M_X2).toFixed(2)}</td>
                        <td>৳{(m.baseManager * m.M_X2).toFixed(2)}</td>
                        <td>৳{m.paper.toFixed(2)}</td>
                        <td>৳{m.current.toFixed(2)}</td>
                        <td>৳{(m.baseGas * m.M_X2).toFixed(2)}</td>
                        <td>৳{m.festival.toFixed(2)}</td>
                        <td>৳{m.marketFine.toFixed(2)}</td>
                        <td className="font-bold text-foreground">৳{m.totalCost.toFixed(2)}</td>
                        <td className="font-bold" style={{ color: 'oklch(0.70 0.19 162)' }}>৳{m.totalDeposits.toFixed(2)}</td>
                        <td className="font-extrabold" style={{ color: m.due > 0 ? 'oklch(0.68 0.22 27)' : 'oklch(0.45 0.02 260)' }}>{m.due > 0 ? `৳${m.due.toFixed(2)}` : "—"}</td>
                        <td className="font-extrabold" style={{ color: m.advance > 0 ? 'oklch(0.70 0.19 162)' : 'oklch(0.45 0.02 260)' }}>{m.advance > 0 ? `৳${m.advance.toFixed(2)}` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Member Filter Dialog for PDF/Word export */}
            <Dialog open={isMemberFilterOpen} onOpenChange={setIsMemberFilterOpen}>
              <DialogContent className="sm:max-w-md rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Choose Members to Export</DialogTitle>
                  <DialogDescription className="text-muted-foreground">Checked members will be included in the {exportType === 'pdf' ? 'PDF' : 'Word'} file.</DialogDescription>
                </DialogHeader>
                <div className="max-h-72 overflow-y-auto space-y-1 py-2">
                  {data && data.members.map((m: any) => (
                    <label key={m.member.id} className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedExportMembers.has(m.member.id)}
                        onChange={() => toggleExportMember(m.member.id)}
                        className="w-4 h-4 accent-violet-500"
                      />
                      <span className="text-sm font-medium text-foreground">{m.member.user.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">R{m.member.roomNo}</span>
                    </label>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-white/10">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => data && setSelectedExportMembers(new Set(data.members.map((m: any) => m.member.id)))}
                      className="text-xs text-muted-foreground hover:text-foreground underline"
                    >Select All</button>
                    <button
                      type="button"
                      onClick={() => setSelectedExportMembers(new Set())}
                      className="text-xs text-muted-foreground hover:text-foreground underline"
                    >Deselect All</button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsMemberFilterOpen(false)}>Cancel</Button>
                    <Button size="sm" className="btn-glow font-bold" onClick={runExport} disabled={selectedExportMembers.size === 0}>
                      Export {exportType === 'pdf' ? 'PDF' : 'Word'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* TAB 8: HISTORY (Finalized Snapshots) */}
          <TabsContent value="history" className="mt-5 space-y-4 animate-slide-in-up">
            <div className="section-panel">
              <div className="section-panel-header">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4" style={{ color: 'oklch(0.65 0.25 275)' }} />
                  <div><h3 className="text-sm font-bold text-foreground">Archived Months History</h3><p className="text-xs text-muted-foreground mt-0.5">Permanent finalized records — read-only.</p></div>
                </div>
              </div>
              <div className="p-4">
                {snapshots.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <History className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium">No months finalized yet.</p>
                    <p className="text-xs mt-1">Go to Ledger → click "Finalize &amp; Save"</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {snapshots.map((snap) => (
                      <div key={snap.id} className="rounded-xl overflow-hidden" style={{ border: '1px solid oklch(1 0 0 / 8%)' }}>
                        <div className="flex flex-wrap justify-between items-center gap-4 p-4" style={{ background: 'oklch(0.65 0.25 275 / 7%)' }}>
                          <div>
                            <h3 className="text-sm font-bold text-foreground">{snap.monthLabel}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">Finalized: {new Date(snap.finalizedAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Meal Rate</p>
                              <p className="font-bold text-sm" style={{ color: 'oklch(0.72 0.18 200)' }}>৳ {snap.liveMealRate.toFixed(2)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Market Total</p>
                              <p className="font-bold text-sm" style={{ color: 'oklch(0.70 0.19 162)' }}>৳ {snap.totalMarketCost.toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" onClick={() => exportSnapshotToPDF(snap)} className="btn-glow h-8 px-3 text-xs rounded-lg gap-1.5">
                                <FileText className="w-3.5 h-3.5" /> PDF
                              </Button>
                              <Button size="sm" variant="ghost" onClick={async () => { const dd = await getDiningCalc(snap.monthYear); const snapData = { totalMessMeals: snap.totalMessMeals, totalMarketCost: snap.totalMarketCost, liveMealRate: snap.liveMealRate, members: snap.memberSnapshots.map((ms: any) => ({ member: { user: { name: ms.memberName }, roomNo: '' }, totalMeals: ms.totalMeals, individualMealCost: ms.individualMealCost, baseKhala: 0, M_X2: 1, baseManager: 0, paper: 0, current: 0, baseGas: 0, festival: 0, marketFine: 0, adjustedOverheads: ms.adjustedOverheads, totalCost: ms.totalCost, totalDeposits: ms.totalDeposits, due: ms.due, advance: ms.advance })) }; generateWordForData(snapData, snap.monthLabel, true, dd); }} className="h-8 px-2.5 text-xs rounded-lg gap-1 text-muted-foreground hover:text-foreground hover:bg-white/5">
                                <FileText className="w-3.5 h-3.5" style={{ color: 'oklch(0.55 0.26 278)' }} /> Word
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDeleteSnapshot(snap.id, snap.monthLabel)} className="h-8 px-2.5 text-xs rounded-lg gap-1">
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* SUPER ADMIN ONLY: Manage Admins Tab */}
          {session?.role === "SUPER_ADMIN" && (
            <TabsContent value="manageadmins" className="mt-5 space-y-4 animate-slide-in-up">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <UserCog className="w-4 h-4" style={{ color: 'oklch(0.68 0.22 27)' }} />
                  <div>
                    <h2 className="text-sm font-bold text-foreground">Manage Admins &amp; Managers</h2>
                    <p className="text-xs text-muted-foreground">System users who access Admin panel (not counted in meal tracking)</p>
                  </div>
                </div>
                <Button size="sm" className="h-9 px-3 text-xs font-bold gap-1.5 rounded-xl" style={{ background: 'linear-gradient(135deg, oklch(0.55 0.26 27), oklch(0.50 0.23 20))' }}
                  onClick={() => { setManagerError(""); setIsAddManagerOpen(true); }}>
                  <PlusCircle className="w-3.5 h-3.5" /> Add Manager
                </Button>
              </div>

              <Dialog open={isAddManagerOpen} onOpenChange={setIsAddManagerOpen}>
                <DialogContent className="rounded-2xl mx-4 sm:mx-auto max-w-md">
                  <DialogHeader>
                    <DialogTitle className="font-bold">Add Manager</DialogTitle>
                    <DialogDescription>Create a new admin/manager account.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddManager} className="space-y-3 pt-2">
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
                    <Button type="submit" className="w-full h-10 font-bold btn-glow">Add Manager</Button>
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
                              <Button variant="ghost" size="sm" onClick={() => handleRemoveManager(m.id, m.name)} className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg">
                                <Trash2 className="w-4 h-4" />
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
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}

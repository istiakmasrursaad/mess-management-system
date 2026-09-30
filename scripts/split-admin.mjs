import fs from 'fs';
import path from 'path';

const pagePath = path.resolve('src/app/admin/page.tsx');
const componentsDir = path.resolve('src/components/admin');

if (!fs.existsSync(componentsDir)) {
  fs.mkdirSync(componentsDir, { recursive: true });
}

let pageContent = fs.readFileSync(pagePath, 'utf8');

// Match each TabsContent block
const tabsRegex = /<TabsContent value="([^"]+)"[^>]*>([\s\S]*?)<\/TabsContent>/g;

let match;
const tabs = [];

while ((match = tabsRegex.exec(pageContent)) !== null) {
  tabs.push({
    value: match[1],
    fullMatch: match[0],
    innerContent: match[2]
  });
}

// Generate the massive props destructing string
const allProps = [
  "data", "loading", "activeTab", "setActiveTab", "hasSelectedMonth", "setHasSelectedMonth",
  "session", "setSession", "managers", "setManagers", "isAddManagerOpen", "setIsAddManagerOpen",
  "managerForm", "setManagerForm", "managerError", "setManagerError", "selectedMonth", "setSelectedMonth",
  "availableMonths", "setAvailableMonths", "snapshots", "setSnapshots", "isFinalizing", "setIsFinalizing",
  "isMemberDialogOpen", "setIsMemberDialogOpen", "isMarketDialogOpen", "setIsMarketDialogOpen",
  "isEditMarketDialogOpen", "setIsEditMarketDialogOpen", "editingMarket", "setEditingMarket",
  "isDepositDialogOpen", "setIsDepositDialogOpen", "isEditDepositDialogOpen", "setIsEditDepositDialogOpen",
  "editingDeposit", "setEditingDeposit", "editDepositAmount", "setEditDepositAmount",
  "editDepositDate", "setEditDepositDate", "isEditSpecificBillDialogOpen", "setIsEditSpecificBillDialogOpen",
  "editingMember", "setEditingMember", "editingBillId", "setEditingBillId", "editBillCategory", "setEditBillCategory",
  "editBillAmount", "setEditBillAmount", "isMemberFilterOpen", "setIsMemberFilterOpen", "exportType", "setExportType",
  "selectedExportMembers", "setSelectedExportMembers", "isEditMemberDialogOpen", "setIsEditMemberDialogOpen",
  "editingMemberInfo", "setEditingMemberInfo", "editMemberForm", "setEditMemberForm", "editMemberError", "setEditMemberError",
  "addMemberForm", "setAddMemberForm", "settingsForm", "setSettingsForm", "selectedMealDate", "setSelectedMealDate",
  "dailyMealsData", "setDailyMealsData", "mealInputValues", "setMealInputValues", "loadingDailyMeals", "setLoadingDailyMeals",
  "isSavingMeals", "setIsSavingMeals", "membersList", "setMembersList", "draggedIdx", "setDraggedIdx",
  "fetchData", "fetchAvailableMonths", "fetchSnapshots", "handleMonthChange", "handleDragStart", "handleDragOver", "handleDragEnd",
  "openEditDeposit", "handleUpdateDeposit", "handleDeleteDeposit", "handleFinalizeMonth", "handleDeleteSnapshot",
  "fetchManagers", "handleAddManager", "handleRemoveManager", "fetchDailyMeals", "handleMealDateChange", "handleSaveAllMeals",
  "handleUpdateSettings", "handleRemoveMember", "openEditMemberDialog", "handleEditMember", "handleAddSpecificBill",
  "handleAddMember", "handleAddMarket", "handleEditMarket", "handleEditSpecificBill", "handleAddDeposit", "handleSaveFineOverride",
  "handleRevertFineOverride", "openMemberFilter", "toggleExportMember", "runExport", "exportToPDF", "exportToWord",
  "generateWordForData", "exportDailyMealsPDF", "exportSnapshotToPDF", "generatePDFForData", "monthYearToLabel"
];

const getImports = (content) => {
  const uiComponents = [
    "Button", "Card", "CardContent", "CardDescription", "CardHeader", "CardTitle",
    "Input", "Label", "Table", "TableBody", "TableCell", "TableHead", "TableHeader", "TableRow",
    "Badge", "Dialog", "DialogContent", "DialogDescription", "DialogHeader", "DialogTitle", "DialogTrigger",
    "Switch", "Select", "SelectContent", "SelectItem", "SelectTrigger", "SelectValue"
  ].filter(c => content.includes(c));

  const icons = [
    "Users", "Utensils", "ShoppingCart", "Calculator", "DollarSign", "Receipt", "Wallet",
    "Settings", "FileSpreadsheet", "FileText", "Printer", "PlusCircle", "AlertTriangle",
    "CheckCircle2", "RefreshCw", "ShieldCheck", "Leaf", "History", "Calendar", "Lock",
    "UserCog", "Trash2", "Pencil"
  ].filter(i => content.includes(i));

  let imports = `import React from "react";\n`;
  if (uiComponents.length > 0) {
    if (uiComponents.includes("Button")) imports += `import { Button } from "@/components/ui/button";\n`;
    const cardComps = ["Card", "CardContent", "CardDescription", "CardHeader", "CardTitle"].filter(c => uiComponents.includes(c));
    if (cardComps.length > 0) imports += `import { ${cardComps.join(", ")} } from "@/components/ui/card";\n`;
    if (uiComponents.includes("Input")) imports += `import { Input } from "@/components/ui/input";\n`;
    if (uiComponents.includes("Label")) imports += `import { Label } from "@/components/ui/label";\n`;
    const tableComps = ["Table", "TableBody", "TableCell", "TableHead", "TableHeader", "TableRow"].filter(c => uiComponents.includes(c));
    if (tableComps.length > 0) imports += `import { ${tableComps.join(", ")} } from "@/components/ui/table";\n`;
    if (uiComponents.includes("Badge")) imports += `import { Badge } from "@/components/ui/badge";\n`;
    const dialogComps = ["Dialog", "DialogContent", "DialogDescription", "DialogHeader", "DialogTitle", "DialogTrigger"].filter(c => uiComponents.includes(c));
    if (dialogComps.length > 0) imports += `import { ${dialogComps.join(", ")} } from "@/components/ui/dialog";\n`;
    if (uiComponents.includes("Switch")) imports += `import { Switch } from "@/components/ui/switch";\n`;
    const selectComps = ["Select", "SelectContent", "SelectItem", "SelectTrigger", "SelectValue"].filter(c => uiComponents.includes(c));
    if (selectComps.length > 0) imports += `import { ${selectComps.join(", ")} } from "@/components/ui/select";\n`;
  }

  if (icons.length > 0) {
    imports += `import { ${icons.join(", ")} } from "lucide-react";\n`;
  }
  
  if (content.includes("DiningCalcCard")) {
    imports += `import { DiningCalcCard } from "@/components/DiningCalcCard";\n`;
  }
  
  // also add some standard imports if needed
  return imports;
};

let modifiedPageContent = pageContent;

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const componentNames = [];

for (const tab of tabs) {
  const compName = capitalize(tab.value) + 'Tab';
  componentNames.push(compName);
  
  // Generate the component file
  const usedProps = allProps.filter(p => tab.innerContent.includes(p));
  
  const componentContent = `"use client";\n\n${getImports(tab.innerContent)}\n\n` +
    `export default function ${compName}({ props }: { props: any }) {\n` +
    `  const { ${usedProps.join(", ")} } = props;\n\n` +
    `  return (\n    <>\n      ${tab.innerContent.trim()}\n    </>\n  );\n}\n`;

  fs.writeFileSync(path.join(componentsDir, `${compName}.tsx`), componentContent);
  console.log(`Created ${compName}.tsx`);

  // Replace in main file
  const replacement = `<TabsContent value="${tab.value}" className="mt-5 animate-slide-in-up space-y-4">\n` +
    `  <${compName} props={tabProps} />\n` +
    `</TabsContent>`;
  
  modifiedPageContent = modifiedPageContent.replace(tab.fullMatch, replacement);
}

// Add dynamic imports at the top of the main file
let dynamicImports = `import dynamic from "next/dynamic";\n`;
for (const compName of componentNames) {
  dynamicImports += `const ${compName} = dynamic(() => import("@/components/admin/${compName}"));\n`;
}

// Insert dynamic imports after the last regular import
const lastImportIdx = modifiedPageContent.lastIndexOf('import ');
const nextNewLine = modifiedPageContent.indexOf('\n', lastImportIdx);
modifiedPageContent = modifiedPageContent.substring(0, nextNewLine + 1) + '\n' + dynamicImports + modifiedPageContent.substring(nextNewLine + 1);

// Add the massive tabProps object inside AdminWorkspace component
const propsObjectStr = `  const tabProps = {\n    ` + allProps.join(", ") + `\n  };\n`;
const returnIdx = modifiedPageContent.indexOf('return (', modifiedPageContent.indexOf('export default function AdminWorkspace'));

modifiedPageContent = modifiedPageContent.substring(0, returnIdx) + propsObjectStr + '\n  ' + modifiedPageContent.substring(returnIdx);

fs.writeFileSync(pagePath, modifiedPageContent);
console.log('Updated src/app/admin/page.tsx');

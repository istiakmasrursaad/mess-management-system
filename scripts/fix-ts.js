const fs = require('fs');

// 1. Fix DailymealsTab
let dm = fs.readFileSync('src/components/admin/DailymealsTab.tsx', 'utf8');
dm = dm.replace(/\(prev\)/g, '(prev: any)');
// Also sum was implicit any
dm = dm.replace(/sum \+ val/g, '(sum: any) + val'); 
fs.writeFileSync('src/components/admin/DailymealsTab.tsx', dm);

// 2. Fix DepositsTab
let dep = fs.readFileSync('src/components/admin/DepositsTab.tsx', 'utf8');
dep = 'import { addDeposit } from "@/app/actions/mess";\nimport { toast } from "react-toastify";\n' + dep;
fs.writeFileSync('src/components/admin/DepositsTab.tsx', dep);

// 3. Fix HistoryTab
let hist = fs.readFileSync('src/components/admin/HistoryTab.tsx', 'utf8');
hist = hist.replace(/\(snap\)/g, '(snap: any)');
hist = 'import { getDiningCalc } from "@/app/actions/dining-calc";\n' + hist;
fs.writeFileSync('src/components/admin/HistoryTab.tsx', hist);

// 4. Fix MarketsTab
let mkt = fs.readFileSync('src/components/admin/MarketsTab.tsx', 'utf8');
mkt = 'import { deleteMarketEntry } from "@/app/actions/mess";\nimport { toast } from "react-toastify";\n' + mkt;
fs.writeFileSync('src/components/admin/MarketsTab.tsx', mkt);

// 5. Fix MembersTab
let mem = fs.readFileSync('src/components/admin/MembersTab.tsx', 'utf8');
mem = mem.replace(/\(prev\)/g, '(prev: any)');
fs.writeFileSync('src/components/admin/MembersTab.tsx', mem);

// 6. Fix SettingsTab
let set = fs.readFileSync('src/components/admin/SettingsTab.tsx', 'utf8');
set = 'import { toggleApplyDefaultBills } from "@/app/actions/mess";\n' + set;
fs.writeFileSync('src/components/admin/SettingsTab.tsx', set);

// 7. Fix SpecificbillsTab
let spec = fs.readFileSync('src/components/admin/SpecificbillsTab.tsx', 'utf8');
spec = 'import { updateSpecificBill, deleteSpecificBill } from "@/app/actions/mess";\nimport { toast } from "react-toastify";\n' + spec;
fs.writeFileSync('src/components/admin/SpecificbillsTab.tsx', spec);

console.log('Fixed types and imports');

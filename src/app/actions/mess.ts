"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { getSession, getManagersAction } from "./auth";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convert a Date to "MM-YYYY" string */
function dateToMonthYear(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${month}-${year}`;
}

/** Convert "MM-YYYY" to readable label like "August 2026" */
function monthYearToLabel(monthYear: string): string {
  const [month, year] = monthYear.split("-");
  const d = new Date(parseInt(year), parseInt(month) - 1, 1);
  return d.toLocaleString("en-US", { month: "long", year: "numeric" });
}

// Helper to get or create MessSettings
export async function getMessSettings() {
  let settings = await prisma.messSettings.findFirst();
  if (!settings) {
    settings = await prisma.messSettings.create({
      data: {
        id: "default",
        defaultDailyMealThreshold: 2.5,
        defaultMarketFine: 130.0,
        extraMarketRate: 130.0,
        mealCutoffTime: "22:00",
        defaultKhalaBill: 300.0,
        defaultManagerBill: 100.0,
        defaultGasBill: 200.0,
        defaultPaperBill: 20.0,
        defaultCurrentBill: 150.0,
        defaultFestivalBill: 0.0,
      },
    });
  }
  return settings;
}

// Helper to calculate exact single month metrics for all members
async function calculateMonthMetrics(targetMonth: string, settings: any) {
  const members = await prisma.member.findMany({
    include: {
      user: true,
      dailyMeals: { where: { monthYear: targetMonth } },
      bills: { where: { monthYear: targetMonth } },
      deposits: { where: { monthYear: targetMonth } },
      specificBills: { where: { monthYear: targetMonth } },
    },
    where: {
      user: {
        role: "MEMBER",
      },
    },
    orderBy: {
      serial: 'asc',
    },
  });

  const markets = await prisma.market.findMany({
    include: { inventoryItems: true },
    where: { monthYear: targetMonth },
    orderBy: { date: "desc" },
  });

  const totalMarketCost = markets.reduce((sum, m) => sum + m.amount, 0);
  let totalMessMeals = 0;

  const dateTotalMeals = new Map<string, number>();
  members.forEach((member) => {
    member.dailyMeals.forEach((d) => {
      const dateKey = new Date(d.date).toISOString().split("T")[0];
      const current = dateTotalMeals.get(dateKey) || 0;
      dateTotalMeals.set(dateKey, current + d.totalMeal);
    });
  });

  const memberCalculations = members.map((member) => {
    const totalMeals = member.dailyMeals.reduce((sum, d) => sum + d.totalMeal, 0);
    totalMessMeals += totalMeals;

    const totalExtraMeals = member.dailyMeals.reduce((sum, d) => {
      const extra = Math.max(0, d.totalMeal - settings.defaultDailyMealThreshold);
      return sum + extra;
    }, 0);

    const isNeedX2 = totalExtraMeals > settings.needX2MealLimit;
    const M_X2 = isNeedX2 ? 2 : 1;

    const memberMarkets = markets.filter((m) => m.marketerId === member.id);
    const totalMarketsCount = memberMarkets.length;

    const extraMarketDays = Math.max(0, totalMarketsCount - 1);
    const extraMarketAllowance = extraMarketDays * settings.extraMarketRate;

    const memberBill = member.bills[0];
    let marketFine = 0;
    let isFineOverridden = false;

    if (memberBill && memberBill.isFineOverridden) {
      marketFine = memberBill.marketFine;
      isFineOverridden = true;
    } else {
      marketFine = totalMarketsCount === 0 ? settings.defaultMarketFine : 0;
    }

    let baseKhala = (memberBill && memberBill.isKhalaOverridden) ? memberBill.baseKhala : (settings.applyDefaultBills ? settings.defaultKhalaBill : 0);
    let baseManager = (memberBill && memberBill.isManagerOverridden) ? memberBill.manager : (settings.applyDefaultBills ? settings.defaultManagerBill : 0);
    let baseGas = (memberBill && memberBill.isGasOverridden) ? memberBill.gasBill : (settings.applyDefaultBills ? settings.defaultGasBill : 0);
    let paper = (memberBill && memberBill.isPaperOverridden) ? memberBill.paper : (settings.applyDefaultBills ? settings.defaultPaperBill : 0);
    let current = (memberBill && memberBill.isCurrentOverridden) ? memberBill.current : (settings.applyDefaultBills ? settings.defaultCurrentBill : 0);
    let festival = (memberBill && memberBill.isFestivalOverridden) ? memberBill.festival : (settings.applyDefaultBills ? settings.defaultFestivalBill : 0);
    let specificOther = 0;

    member.specificBills.forEach((b: any) => {
      if (b.description.startsWith("Khala Bill")) baseKhala += b.amount;
      else if (b.description.startsWith("Manager Bill")) baseManager += b.amount;
      else if (b.description.startsWith("Gas Bill")) baseGas += b.amount;
      else if (b.description.startsWith("Paper Bill")) paper += b.amount;
      else if (b.description.startsWith("Current Bill")) current += b.amount;
      else if (b.description.startsWith("Fest Meal")) festival += b.amount;
      else if (b.description.startsWith("Market Fine")) marketFine += b.amount;
      else specificOther += b.amount;
    });

    baseKhala *= M_X2;
    baseManager *= M_X2;
    baseGas *= M_X2;

    const adjustedOverheads = baseKhala + baseManager + baseGas + paper + current + festival + marketFine + specificOther;
    const totalDeposits = member.deposits.reduce((sum: number, dep: any) => sum + dep.amount, 0);

    return {
      member,
      totalMeals,
      totalExtraMeals,
      isNeedX2,
      M_X2,
      totalMarketsCount,
      extraMarketDays,
      extraMarketAllowance,
      marketFine,
      isFineOverridden,
      isKhalaOverridden: memberBill?.isKhalaOverridden || false,
      isManagerOverridden: memberBill?.isManagerOverridden || false,
      isGasOverridden: memberBill?.isGasOverridden || false,
      isPaperOverridden: memberBill?.isPaperOverridden || false,
      isCurrentOverridden: memberBill?.isCurrentOverridden || false,
      isFestivalOverridden: memberBill?.isFestivalOverridden || false,
      rawBaseKhala: memberBill?.baseKhala || 0,
      rawManager: memberBill?.manager || 0,
      rawGas: memberBill?.gasBill || 0,
      rawPaper: memberBill?.paper || 0,
      rawCurrent: memberBill?.current || 0,
      rawFestival: memberBill?.festival || 0,
      baseKhala,
      baseManager,
      baseGas,
      paper,
      current,
      festival,
      specificOther,
      adjustedOverheads,
      totalDeposits,
    };
  });

  const liveMealRate = totalMessMeals > 0 ? totalMarketCost / totalMessMeals : 0;

  const membersWithCosts = memberCalculations.map((calc) => {
    const individualMealCost = liveMealRate * calc.totalMeals;
    // Total cost MUST be Meal Cost + All Overheads & Bills
    const totalCost = individualMealCost + calc.adjustedOverheads;
    const currentMonthDiff = totalCost - calc.totalDeposits;

    return {
      ...calc,
      individualMealCost,
      totalCost,
      currentMonthDiff,
    };
  });

  return {
    members: membersWithCosts,
    markets: markets.map((m) => {
      const dateKey = new Date(m.date).toISOString().split("T")[0];
      const mealsOnDate = dateTotalMeals.get(dateKey) || 0;
      const perDayMealRate = mealsOnDate > 0 ? m.amount / mealsOnDate : 0;
      return {
        ...m,
        totalMealsOnDate: mealsOnDate,
        perDayMealRate,
      };
    }),
    totalMarketCost,
    totalMessMeals,
    liveMealRate,
  };
}

// Helper to calculate cumulative net balance from prior months
async function getPriorNetBalances(targetMonth: string, settings: any): Promise<Record<string, number>> {
  const priorBalances: Record<string, number> = {};

  const [marketMonths, mealMonths, depositMonths, snapshots] = await Promise.all([
    prisma.market.findMany({ distinct: ["monthYear"], select: { monthYear: true } }),
    prisma.dailyMeal.findMany({ distinct: ["monthYear"], select: { monthYear: true } }),
    prisma.deposit.findMany({ distinct: ["monthYear"], select: { monthYear: true } }),
    prisma.monthlySnapshot.findMany({ include: { memberSnapshots: true } }),
  ]);

  const allMonths = Array.from(
    new Set<string>([
      ...marketMonths.map((m) => m.monthYear),
      ...mealMonths.map((m) => m.monthYear),
      ...depositMonths.map((m) => m.monthYear),
      ...snapshots.map((s) => s.monthYear),
    ])
  );

  const compareMY = (a: string, b: string) => {
    const [am, ay] = a.split("-").map(Number);
    const [bm, by] = b.split("-").map(Number);
    if (ay !== by) return ay - by;
    return am - bm;
  };

  const priorMonths = allMonths.filter((m) => compareMY(m, targetMonth) < 0).sort(compareMY);
  if (priorMonths.length === 0) return priorBalances;

  const snapshotMap = new Map(snapshots.map((s) => [s.monthYear, s]));

  // Sequentially set ending balance of each prior month from earliest to latest (ONLY if finalized in history)
  for (const mYear of priorMonths) {
    const snap = snapshotMap.get(mYear);
    if (snap) {
      // If month mYear was snapshot-finalized, its ending balance is snapshot's due - advance
      for (const ms of snap.memberSnapshots) {
        priorBalances[ms.memberId] = ms.due - ms.advance;
      }
    }
  }

  return priorBalances;
}

// ─── 1. Get Complete System State & Dynamic Calculations ──────────────────────

export async function getMessData(monthYear?: string) {
  const targetMonth = monthYear || dateToMonthYear(new Date());
  const settings = await getMessSettings();
  const priorBalances = await getPriorNetBalances(targetMonth, settings);
  const monthData = await calculateMonthMetrics(targetMonth, settings);

  let grandTotalDeposits = 0;
  let grandTotalDues = 0;
  let grandTotalAdvances = 0;

  const fullLedger = monthData.members.map((calc) => {
    const previousBalance = priorBalances[calc.member.id] || 0;
    const previousDue = previousBalance > 0 ? Math.round(previousBalance) : 0;
    const previousAdvance = previousBalance < 0 ? Math.round(Math.abs(previousBalance)) : 0;
    const cumulativeBalance = previousBalance + calc.currentMonthDiff;

    const due = cumulativeBalance > 0 ? Math.round(cumulativeBalance) : 0;
    const advance = cumulativeBalance < 0 ? Math.round(Math.abs(cumulativeBalance)) : 0;

    grandTotalDeposits += calc.totalDeposits;
    grandTotalDues += due;
    grandTotalAdvances += advance;

    return {
      ...calc,
      previousBalance,
      previousDue,
      previousAdvance,
      due,
      advance,
    };
  });

  return {
    settings,
    members: fullLedger,
    markets: monthData.markets,
    totalMarketCost: monthData.totalMarketCost,
    totalMessMeals: monthData.totalMessMeals,
    liveMealRate: monthData.liveMealRate,
    grandTotalDeposits,
    grandTotalDues,
    grandTotalAdvances,
    monthYear: targetMonth,
    monthLabel: monthYearToLabel(targetMonth),
  };
}

// ─── 2. Get Available Months (months that have data) ──────────────────────────

export async function getAvailableMonths(): Promise<string[]> {
  const [marketMonths, mealMonths, depositMonths] = await Promise.all([
    prisma.market.findMany({ distinct: ["monthYear"], select: { monthYear: true } }),
    prisma.dailyMeal.findMany({ distinct: ["monthYear"], select: { monthYear: true } }),
    prisma.deposit.findMany({ distinct: ["monthYear"], select: { monthYear: true } }),
  ]);

  const allMonths = new Set<string>([
    ...marketMonths.map((m) => m.monthYear),
    ...mealMonths.map((m) => m.monthYear),
    ...depositMonths.map((m) => m.monthYear),
    dateToMonthYear(new Date()), // Always include current month
  ]);

  return Array.from(allMonths).sort((a, b) => {
    const [am, ay] = a.split("-").map(Number);
    const [bm, by] = b.split("-").map(Number);
    if (ay !== by) return by - ay; // Descending year
    return bm - am; // Descending month
  });
}

// ─── 3. Update Mess Settings ──────────────────────────────────────────────────

export async function updateMessSettings(formData: FormData) {
  const defaultDailyMealThreshold = parseFloat(formData.get("defaultDailyMealThreshold") as string);
  const needX2MealLimit = parseInt(formData.get("needX2MealLimit") as string);
  const defaultMarketFine = parseFloat(formData.get("defaultMarketFine") as string);
  const extraMarketRate = parseFloat(formData.get("extraMarketRate") as string);
  const mealCutoffTime = formData.get("mealCutoffTime") as string;
  const defaultKhalaBill = parseFloat(formData.get("defaultKhalaBill") as string || "300");
  const defaultManagerBill = parseFloat(formData.get("defaultManagerBill") as string || "100");
  const defaultGasBill = parseFloat(formData.get("defaultGasBill") as string || "200");
  const defaultPaperBill = parseFloat(formData.get("defaultPaperBill") as string || "20");
  const defaultCurrentBill = parseFloat(formData.get("defaultCurrentBill") as string || "150");
  const defaultFestivalBill = parseFloat(formData.get("defaultFestivalBill") as string || "0");

  await prisma.messSettings.updateMany({
    data: {
      defaultDailyMealThreshold,
      needX2MealLimit,
      defaultMarketFine,
      extraMarketRate,
      mealCutoffTime,
      defaultKhalaBill,
      defaultManagerBill,
      defaultGasBill,
      defaultPaperBill,
      defaultCurrentBill,
      defaultFestivalBill,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/member");
}

export async function toggleApplyDefaultBills(applyDefaultBills: boolean) {
  await prisma.messSettings.updateMany({
    data: { applyDefaultBills },
  });
  revalidatePath("/admin");
  revalidatePath("/member");
}

// ─── 4. Add Member ────────────────────────────────────────────────────────────

export async function addMember(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const roomNo = formData.get("roomNo") as string;
  const password = formData.get("password") as string || "password123";

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "MEMBER",
      status: "ACTIVE",
    },
  });

  await prisma.member.create({
    data: {
      userId: user.id,
      phone,
      roomNo,
      defaultMeal: 2.5,
      status: "ACTIVE",
    },
  });

  revalidatePath("/admin");
  return { success: true };
}

// ─── 4b. Update Member Info ───────────────────────────────────────────────────

export async function updateMember(formData: FormData) {
  const memberId = formData.get("memberId") as string;
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string || "";
  const password = formData.get("password") as string;

  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member) return { success: false, error: "Member not found" };

  const userUpdateData: any = { name, email };
  if (password) {
    userUpdateData.passwordHash = await bcrypt.hash(password, 10);
  }

  await prisma.user.update({
    where: { id: member.userId },
    data: userUpdateData,
  });

  await prisma.member.update({
    where: { id: memberId },
    data: { phone },
  });

  revalidatePath("/admin");
  revalidatePath("/member");
  return { success: true };
}

// ─── 5. Add Market Entry with Inventory Items ─────────────────────────────────

export async function addMarketEntry(formData: FormData) {
  const dateStr = formData.get("date") as string;
  const marketerId = formData.get("marketerId") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const description = formData.get("description") as string;
  const itemsJson = formData.get("itemsJson") as string;

  const items = itemsJson ? JSON.parse(itemsJson) : [];
  const monthYear = dateToMonthYear(new Date(dateStr));
  const dateObj = new Date(dateStr);

  const existingMarket = await prisma.market.findFirst({
    where: { date: dateObj }
  });

  if (existingMarket) {
    return { error: "A market entry already exists for this date. Please edit it instead." };
  }

  await prisma.market.create({
    data: {
      date: dateObj,
      monthYear,
      marketerId,
      amount,
      inventoryItems: {
        create: items.map((item: any) => ({
          itemName: item.itemName,
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
        })),
      },
    },
  });

  revalidatePath("/admin");
  revalidatePath("/member");
  return { success: true };
}

export async function deleteMarketEntry(formData: FormData) {
  const id = formData.get("id") as string;
  await prisma.market.delete({ where: { id } });
  revalidatePath("/admin");
  revalidatePath("/member");
  return { success: true };
}

export async function updateMarketEntry(formData: FormData) {
  const id = formData.get("id") as string;
  const marketerId = formData.get("marketerId") as string;
  const amount = parseFloat(formData.get("amount") as string);

  await prisma.market.update({
    where: { id },
    data: {
      marketerId,
      amount,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/member");
  return { success: true };
}

// ─── 6. Log Cash Deposit ──────────────────────────────────────────────────────

export async function addDeposit(formData: FormData) {
  const memberId = formData.get("memberId") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const dateStr = formData.get("date") as string;
  const date = dateStr ? new Date(dateStr) : new Date();
  const monthYear = formData.get("monthYear") as string || dateToMonthYear(date);

  const adminUser = await prisma.user.findFirst({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
  });

  await prisma.deposit.create({
    data: {
      memberId,
      amount,
      date,
      monthYear,
      recordedById: adminUser?.id || memberId,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/member");
  return { success: true };
}

export async function updateDeposit(formData: FormData) {
  const id = formData.get("id") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const dateStr = formData.get("date") as string;

  const updateData: any = {};
  if (!isNaN(amount)) {
    updateData.amount = amount;
  }
  if (dateStr) {
    const date = new Date(dateStr);
    updateData.date = date;
    updateData.monthYear = dateToMonthYear(date);
  }

  await prisma.deposit.update({
    where: { id },
    data: updateData,
  });

  revalidatePath("/admin");
  revalidatePath("/member");
  return { success: true };
}

export async function deleteDeposit(formData: FormData) {
  const id = formData.get("id") as string;
  await prisma.deposit.delete({
    where: { id },
  });

  revalidatePath("/admin");
  revalidatePath("/member");
  return { success: true };
}

// ─── 7. Save Fine Override ────────────────────────────────────────────────────

export async function saveFineOverride(formData: FormData) {
  const memberId = formData.get("memberId") as string;
  const monthYear = formData.get("monthYear") as string || "08-2026";
  const rawMarketFine = formData.get("marketFine");
  const parsedFine = rawMarketFine ? parseFloat(rawMarketFine as string) : 0;
  const marketFine = isNaN(parsedFine) ? 0 : parsedFine;

  const existingBill = await prisma.bill.findFirst({
    where: { memberId, monthYear },
  });

  if (existingBill) {
    await prisma.bill.update({
      where: { id: existingBill.id },
      data: { marketFine, isFineOverridden: true },
    });
  } else {
    await prisma.bill.create({
      data: {
        memberId,
        monthYear,
        marketFine,
        isFineOverridden: true,
        baseKhala: 300,
        manager: 100,
        gasBill: 200,
        paper: 20,
        current: 150,
        festival: 0,
      },
    });
  }

  revalidatePath("/admin");
  revalidatePath("/member");
  return { success: true };
}

export async function revertFineOverride(formData: FormData) {
  const memberId = formData.get("memberId") as string;
  const monthYear = formData.get("monthYear") as string || "08-2026";

  const existingBill = await prisma.bill.findFirst({
    where: { memberId, monthYear },
  });

  if (existingBill) {
    await prisma.bill.update({
      where: { id: existingBill.id },
      data: { marketFine: 0, isFineOverridden: false },
    });
  }

  revalidatePath("/admin");
  revalidatePath("/member");
  return { success: true };
}

export async function saveBillOverrides(formData: FormData) {
  const memberId = formData.get("memberId") as string;
  const monthYear = formData.get("monthYear") as string || "08-2026";
  
  const overrides: any = {};
  
  // Parse inputs (null means no override/revert)
  const baseKhala = formData.get("baseKhala");
  if (baseKhala !== null) { overrides.baseKhala = baseKhala === "" ? null : parseFloat(baseKhala as string); }
  
  const manager = formData.get("manager");
  if (manager !== null) { overrides.manager = manager === "" ? null : parseFloat(manager as string); }
  
  const gasBill = formData.get("gasBill");
  if (gasBill !== null) { overrides.gasBill = gasBill === "" ? null : parseFloat(gasBill as string); }
  
  const paper = formData.get("paper");
  if (paper !== null) { overrides.paper = paper === "" ? null : parseFloat(paper as string); }
  
  const current = formData.get("current");
  if (current !== null) { overrides.current = current === "" ? null : parseFloat(current as string); }
  
  const festival = formData.get("festival");
  if (festival !== null) { overrides.festival = festival === "" ? null : parseFloat(festival as string); }

  const existingBill = await prisma.bill.findFirst({
    where: { memberId, monthYear },
  });

  const updateData: any = {};
  
  if (overrides.baseKhala !== undefined) {
    updateData.isKhalaOverridden = overrides.baseKhala !== null;
    if (overrides.baseKhala !== null) updateData.baseKhala = overrides.baseKhala;
  }
  if (overrides.manager !== undefined) {
    updateData.isManagerOverridden = overrides.manager !== null;
    if (overrides.manager !== null) updateData.manager = overrides.manager;
  }
  if (overrides.gasBill !== undefined) {
    updateData.isGasOverridden = overrides.gasBill !== null;
    if (overrides.gasBill !== null) updateData.gasBill = overrides.gasBill;
  }
  if (overrides.paper !== undefined) {
    updateData.isPaperOverridden = overrides.paper !== null;
    if (overrides.paper !== null) updateData.paper = overrides.paper;
  }
  if (overrides.current !== undefined) {
    updateData.isCurrentOverridden = overrides.current !== null;
    if (overrides.current !== null) updateData.current = overrides.current;
  }
  if (overrides.festival !== undefined) {
    updateData.isFestivalOverridden = overrides.festival !== null;
    if (overrides.festival !== null) updateData.festival = overrides.festival;
  }

  if (existingBill) {
    await prisma.bill.update({
      where: { id: existingBill.id },
      data: updateData,
    });
  } else {
    // defaults needed for fields not being overridden right now
    await prisma.bill.create({
      data: {
        memberId,
        monthYear,
        ...updateData,
      },
    });
  }

  revalidatePath("/admin");
  revalidatePath("/member");
  return { success: true };
}

// ─── 8. Toggle Daily Meal (Member or Admin) ───────────────────────────────────

export async function toggleDailyMeal(formData: FormData) {
  const memberId = formData.get("memberId") as string;
  const breakfast = parseFloat(formData.get("breakfast") as string);
  const lunchDinner = parseFloat(formData.get("lunchDinner") as string);

  const settings = await getMessSettings();
  const dateStr = formData.get("date") as string || new Date().toISOString().split("T")[0];
  const dateObj = new Date(dateStr);
  const monthYear = dateToMonthYear(dateObj);

  // Check Cutoff Time rule
  const now = new Date();
  const [cutoffHours, cutoffMinutes] = settings.mealCutoffTime.split(":").map(Number);
  const cutoffToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), cutoffHours, cutoffMinutes);
  const isPastCutoff = now > cutoffToday;

  const totalMeal = breakfast + lunchDinner;

  const existingMeal = await prisma.dailyMeal.findFirst({
    where: { memberId, date: dateObj },
  });

  if (existingMeal) {
    await prisma.dailyMeal.update({
      where: { id: existingMeal.id },
      data: { breakfast, lunchDinner, totalMeal },
    });
  } else {
    await prisma.dailyMeal.create({
      data: { memberId, date: dateObj, monthYear, breakfast, lunchDinner, totalMeal },
    });
  }

  revalidatePath("/admin");
  revalidatePath("/member");
  return { success: true, isPastCutoff };
}

// ─── 9. Get Daily Meals for all members by Date ───────────────────────────────

export async function getDailyMealsByDate(dateStr: string) {
  const dateObj = new Date(dateStr);
  const startOfDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
  const endOfDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 23, 59, 59, 999);

  const members = await prisma.member.findMany({
    where: {
      user: {
        role: "MEMBER",
      },
    },
    include: {
      user: true,
      dailyMeals: {
        where: { date: { gte: startOfDay, lte: endOfDay } },
      },
    },
    orderBy: {
      serial: 'asc',
    },
  });

  return members.map((member) => ({
    memberId: member.id,
    name: member.user.name,
    roomNo: member.roomNo,
    defaultMeal: member.defaultMeal,
    mealRecord: member.dailyMeals.length > 0 ? member.dailyMeals[0] : null,
  }));
}

// ─── 10. Update Member Daily Meal (Admin) ─────────────────────────────────────

export async function updateMemberDailyMeal(formData: FormData) {
  const memberId = formData.get("memberId") as string;
  const dateStr = formData.get("date") as string;
  const totalMeal = parseFloat(formData.get("totalMeal") as string);

  const dateObj = new Date(dateStr);
  const monthYear = dateToMonthYear(dateObj);
  const startOfDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
  const endOfDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 23, 59, 59, 999);

  const existingMeal = await prisma.dailyMeal.findFirst({
    where: { memberId, date: { gte: startOfDay, lte: endOfDay } },
  });

  if (existingMeal) {
    await prisma.dailyMeal.update({
      where: { id: existingMeal.id },
      data: { totalMeal },
    });
  } else {
    await prisma.dailyMeal.create({
      data: { memberId, date: dateObj, monthYear, breakfast: 0, lunchDinner: 0, totalMeal },
    });
  }

  revalidatePath("/admin");
  return { success: true };
}

// ─── 11. Save All Daily Meals ─────────────────────────────────────────────────

export async function saveAllDailyMeals(mealsData: { memberId: string; totalMeal: number; dateStr: string }[]) {
  if (!mealsData || mealsData.length === 0) return { success: true };

  try {
    const firstDate = new Date(mealsData[0].dateStr);
    if (isNaN(firstDate.getTime())) {
      return { success: false, error: "Invalid date provided." };
    }
    const monthYear = dateToMonthYear(firstDate);
    const startOfDay = new Date(firstDate.getFullYear(), firstDate.getMonth(), firstDate.getDate());
    const endOfDay = new Date(firstDate.getFullYear(), firstDate.getMonth(), firstDate.getDate(), 23, 59, 59, 999);

    const existingMeals = await prisma.dailyMeal.findMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
      },
    });

    const existingMap = new Map(existingMeals.map((m) => [m.memberId, m]));

    const operations = mealsData.map((meal) => {
      const existing = existingMap.get(meal.memberId);
      if (existing) {
        return prisma.dailyMeal.update({
          where: { id: existing.id },
          data: { totalMeal: meal.totalMeal },
        });
      } else {
        return prisma.dailyMeal.create({
          data: {
            memberId: meal.memberId,
            date: new Date(meal.dateStr),
            monthYear,
            breakfast: 0,
            lunchDinner: 0,
            totalMeal: meal.totalMeal,
          },
        });
      }
    });

    await prisma.$transaction(operations);
    revalidatePath("/admin");
    revalidatePath("/member");
    return { success: true };
  } catch (err: any) {
    console.error("saveAllDailyMeals Error:", err);
    return { success: false, error: err.message || "Failed to save meals. Connection might have timed out." };
  }
}

// ─── 12. Add Specific Bill ────────────────────────────────────────────────────

export async function addSpecificBill(formData: FormData) {
  const memberIds = formData.getAll("memberId") as string[];
  const amount = parseFloat(formData.get("amount") as string);
  const description = formData.get("description") as string;
  const monthYear = formData.get("monthYear") as string || dateToMonthYear(new Date());

  if (!memberIds || memberIds.length === 0) return { error: "No member selected" };

  const records = memberIds.map((id) => {
    const countStr = formData.get(`count_${id}`) as string;
    const count = countStr ? parseInt(countStr, 10) : 1;
    const finalAmount = amount * (isNaN(count) ? 1 : count);
    return { memberId: id, amount: finalAmount, description: count > 1 ? `${description} (x${count})` : description, monthYear };
  });

  await prisma.specificBill.createMany({ data: records });

  revalidatePath("/admin");
  revalidatePath("/member");
  return { success: true };
}

export async function updateSpecificBill(formData: FormData) {
  const id = formData.get("id") as string;
  const description = formData.get("description") as string;
  const amount = parseFloat(formData.get("amount") as string);

  await prisma.specificBill.update({
    where: { id },
    data: { description, amount },
  });

  revalidatePath("/admin");
  revalidatePath("/member");
  return { success: true };
}

export async function deleteSpecificBill(formData: FormData) {
  const id = formData.get("id") as string;
  await prisma.specificBill.delete({ where: { id } });

  revalidatePath("/admin");
  revalidatePath("/member");
  return { success: true };
}

// ─── 13. Remove Member ────────────────────────────────────────────────────────

export async function removeMember(formData: FormData) {
  const memberId = formData.get("memberId") as string;

  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (member) {
    await prisma.user.delete({ where: { id: member.userId } });
  }

  revalidatePath("/admin");
  return { success: true };
}

// ─── 14. Finalize Month — Save Permanent Snapshot ─────────────────────────────

export async function finalizeMonth(monthYear: string) {
  try {
    const data = await getMessData(monthYear);
    const monthLabel = monthYearToLabel(monthYear);

    // Delete old snapshot if exists (overwrite/re-finalize)
    await prisma.monthlySnapshot.deleteMany({ where: { monthYear } });

    await prisma.monthlySnapshot.create({
      data: {
        monthYear,
        monthLabel,
        totalMessMeals: data.totalMessMeals,
        totalMarketCost: data.totalMarketCost,
        liveMealRate: data.liveMealRate,
        memberSnapshots: {
          create: data.members.map((m: any) => ({
            memberId: m.member.id,
            memberName: m.member.user.name ?? "Unknown",
            roomNo: m.member.roomNo ?? null,
            totalMeals: m.totalMeals,
            individualMealCost: m.individualMealCost,
            adjustedOverheads: m.adjustedOverheads,
            totalCost: m.totalCost,
            totalDeposits: m.totalDeposits,
            due: Math.round(m.due),
            advance: Math.round(m.advance),
          })),
        },
      },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    console.error("Finalize Month Error:", err);
    return { success: false, error: err.message || "Unknown error occurred" };
  }
}

// ─── 15. Get All Finalized Monthly Snapshots ──────────────────────────────────

export async function getFinalizedSnapshots() {
  return await prisma.monthlySnapshot.findMany({
    include: {
      memberSnapshots: {
        orderBy: { memberName: "asc" },
      },
    },
    orderBy: { finalizedAt: "desc" },
  });
}

// ─── 16. Delete Finalized Monthly Snapshot ──────────────────────────────────

export async function deleteFinalizedSnapshot(id: string) {
  await prisma.monthlySnapshot.delete({
    where: { id },
  });
  revalidatePath("/admin");
  return { success: true };
}

// ─── 16. Update Members Serial (Drag & Drop) ──────────────────────────────────

export async function updateMembersSerial(updates: { id: string; serial: number }[]) {
  const transactions = updates.map((update) => 
    prisma.member.update({
      where: { id: update.id },
      data: { serial: update.serial },
    })
  );

  await prisma.$transaction(transactions);
  
  revalidatePath("/admin");
  return { success: true };
}


export async function getAdminDashboardInitialData(monthStr?: string, mealDate?: string) {
  const [data, meals, availableMonths, snapshots, session, managers] = await Promise.all([
    getMessData(monthStr),
    mealDate ? getDailyMealsByDate(mealDate) : Promise.resolve([]),
    getAvailableMonths(),
    getFinalizedSnapshots(),
    getSession(),
    getManagersAction()
  ]);

  return {
    data,
    meals,
    availableMonths,
    snapshots,
    session,
    managers
  };
}

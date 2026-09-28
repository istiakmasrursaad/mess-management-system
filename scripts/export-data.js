const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function exportData() {
  console.log("Exporting local SQLite data...");
  try {
    const users = await prisma.user.findMany();
    const members = await prisma.member.findMany();
    const messSettings = await prisma.messSettings.findMany();
    const dailyMeals = await prisma.dailyMeal.findMany();
    const markets = await prisma.market.findMany();
    const inventories = await prisma.inventory.findMany();
    const bills = await prisma.bill.findMany();
    const deposits = await prisma.deposit.findMany();
    const monthlyAccounts = await prisma.monthlyAccount.findMany();
    const specificBills = await prisma.specificBill.findMany();
    const monthlySnapshots = await prisma.monthlySnapshot.findMany();
    const memberMonthlySnapshots = await prisma.memberMonthlySnapshot.findMany();
    const diningCalc = await prisma.diningCalc.findMany();

    const data = {
      users,
      members,
      messSettings,
      dailyMeals,
      markets,
      inventories,
      bills,
      deposits,
      monthlyAccounts,
      specificBills,
      monthlySnapshots,
      memberMonthlySnapshots,
      diningCalc,
    };

    const outputPath = path.join(__dirname, "../prisma/local-data.json");
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), "utf8");
    console.log(`✅ Data exported successfully to: ${outputPath}`);
    console.log(`Total exported counts:`);
    console.log(`- Users: ${users.length}`);
    console.log(`- Members: ${members.length}`);
    console.log(`- MessSettings: ${messSettings.length}`);
    console.log(`- DailyMeals: ${dailyMeals.length}`);
    console.log(`- Markets: ${markets.length}`);
    console.log(`- Deposits: ${deposits.length}`);
  } catch (error) {
    console.error("❌ Export failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

exportData();

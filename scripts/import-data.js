const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function importData() {
  console.log("Reading exported JSON data...");
  const dataPath = path.join(__dirname, "../prisma/local-data.json");
  if (!fs.existsSync(dataPath)) {
    console.error("❌ local-data.json file not found!");
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));

  console.log("Starting data import to cloud PostgreSQL database...");

  try {
    // 1. MessSettings
    if (data.messSettings && data.messSettings.length > 0) {
      for (const item of data.messSettings) {
        await prisma.messSettings.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
      console.log(`✅ Imported ${data.messSettings.length} MessSettings`);
    }

    // 2. Users
    if (data.users && data.users.length > 0) {
      for (const item of data.users) {
        const payload = {
          ...item,
          emailVerified: item.emailVerified ? new Date(item.emailVerified) : null,
        };
        await prisma.user.upsert({
          where: { id: item.id },
          update: payload,
          create: payload,
        });
      }
      console.log(`✅ Imported ${data.users.length} Users`);
    }

    // 3. Members
    if (data.members && data.members.length > 0) {
      for (const item of data.members) {
        await prisma.member.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
      console.log(`✅ Imported ${data.members.length} Members`);
    }

    // 4. DailyMeals
    if (data.dailyMeals && data.dailyMeals.length > 0) {
      for (const item of data.dailyMeals) {
        const payload = {
          ...item,
          date: new Date(item.date),
        };
        await prisma.dailyMeal.upsert({
          where: { id: item.id },
          update: payload,
          create: payload,
        });
      }
      console.log(`✅ Imported ${data.dailyMeals.length} DailyMeals`);
    }

    // 5. Markets
    if (data.markets && data.markets.length > 0) {
      for (const item of data.markets) {
        const payload = {
          ...item,
          date: new Date(item.date),
        };
        await prisma.market.upsert({
          where: { id: item.id },
          update: payload,
          create: payload,
        });
      }
      console.log(`✅ Imported ${data.markets.length} Markets`);
    }

    // 6. Inventories
    if (data.inventories && data.inventories.length > 0) {
      for (const item of data.inventories) {
        await prisma.inventory.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
      console.log(`✅ Imported ${data.inventories.length} Inventories`);
    }

    // 7. Bills
    if (data.bills && data.bills.length > 0) {
      for (const item of data.bills) {
        await prisma.bill.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
      console.log(`✅ Imported ${data.bills.length} Bills`);
    }

    // 8. Deposits
    if (data.deposits && data.deposits.length > 0) {
      for (const item of data.deposits) {
        const payload = {
          ...item,
          date: new Date(item.date),
        };
        await prisma.deposit.upsert({
          where: { id: item.id },
          update: payload,
          create: payload,
        });
      }
      console.log(`✅ Imported ${data.deposits.length} Deposits`);
    }

    // 9. MonthlyAccounts
    if (data.monthlyAccounts && data.monthlyAccounts.length > 0) {
      for (const item of data.monthlyAccounts) {
        await prisma.monthlyAccount.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
      console.log(`✅ Imported ${data.monthlyAccounts.length} MonthlyAccounts`);
    }

    // 10. SpecificBills
    if (data.specificBills && data.specificBills.length > 0) {
      for (const item of data.specificBills) {
        const payload = {
          ...item,
          date: new Date(item.date),
        };
        await prisma.specificBill.upsert({
          where: { id: item.id },
          update: payload,
          create: payload,
        });
      }
      console.log(`✅ Imported ${data.specificBills.length} SpecificBills`);
    }

    // 11. MonthlySnapshots
    if (data.monthlySnapshots && data.monthlySnapshots.length > 0) {
      for (const item of data.monthlySnapshots) {
        const payload = {
          ...item,
          finalizedAt: new Date(item.finalizedAt),
        };
        await prisma.monthlySnapshot.upsert({
          where: { id: item.id },
          update: payload,
          create: payload,
        });
      }
      console.log(`✅ Imported ${data.monthlySnapshots.length} MonthlySnapshots`);
    }

    // 12. MemberMonthlySnapshots
    if (data.memberMonthlySnapshots && data.memberMonthlySnapshots.length > 0) {
      for (const item of data.memberMonthlySnapshots) {
        await prisma.memberMonthlySnapshot.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
      console.log(`✅ Imported ${data.memberMonthlySnapshots.length} MemberMonthlySnapshots`);
    }

    // 13. DiningCalc
    if (data.diningCalc && data.diningCalc.length > 0) {
      for (const item of data.diningCalc) {
        await prisma.diningCalc.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
      console.log(`✅ Imported ${data.diningCalc.length} DiningCalc records`);
    }

    console.log("🎉 ALL LOCAL DATA IMPORTED SUCCESSFULLY TO CLOUD POSTGRESQL!");
  } catch (error) {
    console.error("❌ Import failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

importData();

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Create MessSettings default
  await prisma.messSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      defaultDailyMealThreshold: 2.5,
      needX2MealLimit: 7,
      defaultMarketFine: 130.0,
      extraMarketRate: 130.0,
      mealCutoffTime: '22:00',
    },
  });

  // 2. Super Admin User
  await prisma.user.upsert({
    where: { email: 'superadmin@mess.com' },
    update: { passwordHash: hashedPassword },
    create: {
      name: 'Super Admin',
      email: 'superadmin@mess.com',
      passwordHash: hashedPassword,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
  });

  // 3. Admin User & Member (Mess Manager)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@mess.com' },
    update: { passwordHash: hashedPassword },
    create: {
      name: 'Mess Manager (Tanvir)',
      email: 'admin@mess.com',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  const adminMember = await prisma.member.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      phone: '01711111111',
      roomNo: '101',
      defaultMeal: 2.5,
      status: 'ACTIVE',
    },
  });

  // 4. Regular Member 1: Istiak Masrur (0 markets -> auto fine 130)
  const memberUser1 = await prisma.user.upsert({
    where: { email: 'member@mess.com' },
    update: { passwordHash: hashedPassword },
    create: {
      name: 'Istiak Masrur',
      email: 'member@mess.com',
      passwordHash: hashedPassword,
      role: 'MEMBER',
      status: 'ACTIVE',
    },
  });

  const member1 = await prisma.member.upsert({
    where: { userId: memberUser1.id },
    update: {},
    create: {
      userId: memberUser1.id,
      phone: '01722222222',
      roomNo: '204',
      defaultMeal: 2.5,
      status: 'ACTIVE',
    },
  });

  // 5. Regular Member 2: Rakib Hossain (1 market -> 0 extra days)
  const memberUser2 = await prisma.user.upsert({
    where: { email: 'rakib@mess.com' },
    update: { passwordHash: hashedPassword },
    create: {
      name: 'Rakib Hossain',
      email: 'rakib@mess.com',
      passwordHash: hashedPassword,
      role: 'MEMBER',
      status: 'ACTIVE',
    },
  });

  const member2 = await prisma.member.upsert({
    where: { userId: memberUser2.id },
    update: {},
    create: {
      userId: memberUser2.id,
      phone: '01733333333',
      roomNo: '205',
      defaultMeal: 2.5,
      status: 'ACTIVE',
    },
  });

  // 6. Regular Member 3: Sakib Hasan (2 markets -> 1 extra market day)
  const memberUser3 = await prisma.user.upsert({
    where: { email: 'sakib@mess.com' },
    update: { passwordHash: hashedPassword },
    create: {
      name: 'Sakib Hasan',
      email: 'sakib@mess.com',
      passwordHash: hashedPassword,
      role: 'MEMBER',
      status: 'ACTIVE',
    },
  });

  const member3 = await prisma.member.upsert({
    where: { userId: memberUser3.id },
    update: {},
    create: {
      userId: memberUser3.id,
      phone: '01744444444',
      roomNo: '206',
      defaultMeal: 2.5,
      status: 'ACTIVE',
    },
  });

  // Create sample Market Entries
  await prisma.market.deleteMany({});

  const m1 = await prisma.market.create({
    data: {
      date: new Date('2026-08-05'),
      marketerId: member2.id, // Rakib (1st market)
      amount: 4500,
      description: 'Rice 25kg bag, Soybean Oil 5L, Spices',
      inventoryItems: {
        create: [
          { itemName: 'Minikat Rice', quantity: 25, unitPrice: 70 },
          { itemName: 'Rupchanda Oil 5L', quantity: 1, unitPrice: 850 },
          { itemName: 'Mixed Spices', quantity: 2, unitPrice: 150 },
        ]
      }
    }
  });

  const m2 = await prisma.market.create({
    data: {
      date: new Date('2026-08-12'),
      marketerId: member3.id, // Sakib (1st market)
      amount: 3200,
      description: 'Chicken 5kg, Fish, Vegetables',
      inventoryItems: {
        create: [
          { itemName: 'Broiler Chicken', quantity: 5, unitPrice: 200 },
          { itemName: 'Ruhi Fish', quantity: 3, unitPrice: 350 },
        ]
      }
    }
  });

  const m3 = await prisma.market.create({
    data: {
      date: new Date('2026-08-20'),
      marketerId: member3.id, // Sakib (2nd market -> Extra Duty!)
      amount: 2800,
      description: 'Beef 2kg, Onions, Potatoes',
      inventoryItems: {
        create: [
          { itemName: 'Beef', quantity: 2, unitPrice: 750 },
          { itemName: 'Onion', quantity: 5, unitPrice: 90 },
        ]
      }
    }
  });

  // Create Daily Meals for members for 10 days
  await prisma.dailyMeal.deleteMany({});
  const allMembers = [adminMember, member1, member2, member3];

  for (const m of allMembers) {
    for (let day = 1; day <= 10; day++) {
      // Give member1 (Istiak) 3.5 meals on some days to trigger Extra Meals > 7 (Need X2!)
      const extraBoost = (m.id === member1.id && day <= 8) ? 1.5 : 0;
      await prisma.dailyMeal.create({
        data: {
          memberId: m.id,
          date: new Date(`2026-08-${day.toString().padStart(2, '0')}`),
          breakfast: 0.5,
          lunchDinner: 2.0 + extraBoost,
          totalMeal: 2.5 + extraBoost,
        }
      });
    }
  }

  // Create Cash Deposits
  await prisma.deposit.deleteMany({});
  await prisma.deposit.create({
    data: { memberId: member1.id, amount: 2500, date: new Date('2026-08-01'), note: 'Advance Cash', recordedById: adminUser.id }
  });
  await prisma.deposit.create({
    data: { memberId: member2.id, amount: 3000, date: new Date('2026-08-01'), note: 'bKash Deposit', recordedById: adminUser.id }
  });
  await prisma.deposit.create({
    data: { memberId: member3.id, amount: 3500, date: new Date('2026-08-01'), note: 'Hand Cash', recordedById: adminUser.id }
  });
  await prisma.deposit.create({
    data: { memberId: adminMember.id, amount: 3000, date: new Date('2026-08-01'), note: 'Manager Deposit', recordedById: adminUser.id }
  });

  console.log('Database seeded with complete realistic mess accounting data!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

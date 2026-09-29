import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetMemberPasswords() {
  console.log('🔐 Resetting all member passwords...\n');

  const users = await prisma.user.findMany({
    where: { role: 'MEMBER' },
    include: { member: true },
  });

  console.log(`Found ${users.length} members.\n`);

  const results = [];

  for (const user of users) {
    // Password = email prefix (before @) + "123"
    // e.g. saad@gmail.com → saad123
    const emailPrefix = user.email ? user.email.split('@')[0] : null;

    if (!emailPrefix) {
      console.log(`⚠️  Skipping ${user.name} - no email found`);
      continue;
    }

    const newPassword = `${emailPrefix}123`;
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    results.push({
      name: user.name,
      email: user.email,
      phone: user.member?.phone || 'N/A',
      password: newPassword,
    });

    console.log(`✅ ${user.name} | Email: ${user.email} | New Password: ${newPassword}`);
  }

  console.log('\n========================================');
  console.log('📋 MEMBER LOGIN CREDENTIALS SUMMARY');
  console.log('========================================');
  console.log(`${'Name'.padEnd(20)} | ${'Email'.padEnd(30)} | ${'Phone'.padEnd(15)} | Password`);
  console.log('-'.repeat(90));
  for (const r of results) {
    console.log(
      `${r.name.padEnd(20)} | ${r.email.padEnd(30)} | ${r.phone.padEnd(15)} | ${r.password}`
    );
  }
  console.log('========================================\n');
  console.log('✨ Done! Members can now login with their email and the password shown above.');
}

resetMemberPasswords()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

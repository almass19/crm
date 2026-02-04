import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const pm = await prisma.user.upsert({
    where: { email: 'pm@crm.local' },
    update: {},
    create: {
      email: 'pm@crm.local',
      password: passwordHash,
      fullName: 'Иванов Петр Сергеевич',
      role: Role.PROJECT_MANAGER,
    },
  });

  const sales = await prisma.user.upsert({
    where: { email: 'sales@crm.local' },
    update: {},
    create: {
      email: 'sales@crm.local',
      password: passwordHash,
      fullName: 'Сидорова Анна Михайловна',
      role: Role.SALES_MANAGER,
    },
  });

  const spec1 = await prisma.user.upsert({
    where: { email: 'spec1@crm.local' },
    update: {},
    create: {
      email: 'spec1@crm.local',
      password: passwordHash,
      fullName: 'Козлов Дмитрий Андреевич',
      role: Role.SPECIALIST,
    },
  });

  const spec2 = await prisma.user.upsert({
    where: { email: 'spec2@crm.local' },
    update: {},
    create: {
      email: 'spec2@crm.local',
      password: passwordHash,
      fullName: 'Морозова Елена Викторовна',
      role: Role.SPECIALIST,
    },
  });

  console.log('Seed data created:');
  console.log(`  Project Manager: ${pm.email}`);
  console.log(`  Sales Manager: ${sales.email}`);
  console.log(`  Specialist 1: ${spec1.email}`);
  console.log(`  Specialist 2: ${spec2.email}`);
  console.log('  Password for all: password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

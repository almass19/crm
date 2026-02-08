import { PrismaClient, Role, ClientStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@crm.local' },
    update: {},
    create: {
      email: 'admin@crm.local',
      password: passwordHash,
      fullName: 'Иванов Петр Сергеевич',
      role: Role.ADMIN,
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

  const designer1 = await prisma.user.upsert({
    where: { email: 'designer1@crm.local' },
    update: {},
    create: {
      email: 'designer1@crm.local',
      password: passwordHash,
      fullName: 'Петрова Мария Алексеевна',
      role: Role.DESIGNER,
    },
  });

  // Create example clients with payments
  const client1 = await prisma.client.upsert({
    where: { id: 'client-001' },
    update: {},
    create: {
      id: 'client-001',
      fullName: 'Смирнов Алексей Иванович',
      companyName: 'ООО Ромашка',
      phone: '+7 (777) 123-45-67',
      groupName: 'Группа А',
      services: ['Таргетированная реклама', 'СММ'],
      status: ClientStatus.IN_WORK,
      createdById: sales.id,
      assignedToId: spec1.id,
      assignedAt: new Date('2026-01-15'),
      assignmentSeen: true,
    },
  });

  const client2 = await prisma.client.upsert({
    where: { id: 'client-002' },
    update: {},
    create: {
      id: 'client-002',
      fullName: 'Кузнецова Мария Петровна',
      companyName: 'ИП Кузнецова',
      phone: '+7 (777) 234-56-78',
      groupName: 'Группа Б',
      services: ['Сайт', 'Контекстная реклама'],
      status: ClientStatus.IN_WORK,
      createdById: sales.id,
      assignedToId: spec1.id,
      assignedAt: new Date('2026-01-10'),
      assignmentSeen: true,
    },
  });

  const client3 = await prisma.client.upsert({
    where: { id: 'client-003' },
    update: {},
    create: {
      id: 'client-003',
      fullName: 'Попов Николай Сергеевич',
      companyName: 'ТОО Прогресс',
      phone: '+7 (777) 345-67-89',
      groupName: 'Группа А',
      services: ['Таргетированная реклама'],
      status: ClientStatus.IN_WORK,
      createdById: sales.id,
      assignedToId: spec2.id,
      assignedAt: new Date('2026-01-20'),
      assignmentSeen: true,
    },
  });

  // Current month for renewals
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prevMonth = now.getMonth() === 0
    ? `${now.getFullYear() - 1}-12`
    : `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`;

  // Create payments including renewals
  // Client 1: First payment in January, renewal in February
  await prisma.payment.upsert({
    where: { id: 'payment-001' },
    update: {},
    create: {
      id: 'payment-001',
      amount: 150000,
      month: prevMonth,
      isRenewal: false,
      clientId: client1.id,
      managerId: sales.id,
    },
  });

  await prisma.payment.upsert({
    where: { id: 'payment-002' },
    update: {},
    create: {
      id: 'payment-002',
      amount: 150000,
      month: currentMonth,
      isRenewal: true,
      clientId: client1.id,
      managerId: sales.id,
    },
  });

  // Client 2: First payment in January, renewal in February
  await prisma.payment.upsert({
    where: { id: 'payment-003' },
    update: {},
    create: {
      id: 'payment-003',
      amount: 200000,
      month: prevMonth,
      isRenewal: false,
      clientId: client2.id,
      managerId: sales.id,
    },
  });

  await prisma.payment.upsert({
    where: { id: 'payment-004' },
    update: {},
    create: {
      id: 'payment-004',
      amount: 200000,
      month: currentMonth,
      isRenewal: true,
      clientId: client2.id,
      managerId: sales.id,
    },
  });

  // Client 3: Only first payment (no renewal yet)
  await prisma.payment.upsert({
    where: { id: 'payment-005' },
    update: {},
    create: {
      id: 'payment-005',
      amount: 100000,
      month: currentMonth,
      isRenewal: false,
      clientId: client3.id,
      managerId: sales.id,
    },
  });

  console.log('Seed data created:');
  console.log(`  Admin: ${admin.email}`);
  console.log(`  Sales Manager: ${sales.email}`);
  console.log(`  Specialist 1: ${spec1.email}`);
  console.log(`  Specialist 2: ${spec2.email}`);
  console.log(`  Designer 1: ${designer1.email}`);
  console.log('  Password for all: password123');
  console.log('');
  console.log('Example clients:');
  console.log(`  ${client1.companyName} - assigned to ${spec1.fullName}`);
  console.log(`  ${client2.companyName} - assigned to ${spec1.fullName}`);
  console.log(`  ${client3.companyName} - assigned to ${spec2.fullName}`);
  console.log('');
  console.log('Payments:');
  console.log(`  Client 1: Primary (${prevMonth}), Renewal (${currentMonth})`);
  console.log(`  Client 2: Primary (${prevMonth}), Renewal (${currentMonth})`);
  console.log(`  Client 3: Primary only (${currentMonth})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

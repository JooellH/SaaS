import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create default plans in ARS (Argentine Pesos) - Mercado Pago requires minimum $15 ARS
  const basicPlan = await prisma.plan.upsert({
    where: { id: 'plan_basic' },
    update: {},
    create: {
      id: 'plan_basic',
      name: 'Basic',
      price: 0,
      currency: 'ARS',
      limits: {
        maxStaff: 1,
        maxServices: 2,
        maxBookingsPerMonth: 20,
      },
    },
  });

  const proPlan = await prisma.plan.upsert({
    where: { id: 'plan_pro' },
    update: {},
    create: {
      id: 'plan_pro',
      name: 'Pro',
      price: 1500,
      currency: 'ARS',
      limits: {
        maxStaff: 10,
        maxServices: 30,
        maxBookingsPerMonth: 1000,
      },
    },
  });

  const enterprisePlan = await prisma.plan.upsert({
    where: { id: 'plan_enterprise' },
    update: {},
    create: {
      id: 'plan_enterprise',
      name: 'Enterprise',
      price: 3000,
      currency: 'ARS',
      limits: {
        maxStaff: -1, // unlimited
        maxServices: -1,
        maxBookingsPerMonth: -1,
      },
    },
  });

  console.log('✅ Plans created:', { basicPlan, proPlan, enterprisePlan });

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

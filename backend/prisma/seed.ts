import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create default plans
  const basicPlan = await prisma.plan.upsert({
    where: { id: 'plan_basic' },
    update: {},
    create: {
      id: 'plan_basic',
      name: 'Basic',
      price: 29.99,
      currency: 'USD',
      limits: {
        maxStaff: 3,
        maxServices: 5,
        maxBookingsPerMonth: 50,
      },
    },
  });

  const proPlan = await prisma.plan.upsert({
    where: { id: 'plan_pro' },
    update: {},
    create: {
      id: 'plan_pro',
      name: 'Pro',
      price: 79.99,
      currency: 'USD',
      limits: {
        maxStaff: 10,
        maxServices: 20,
        maxBookingsPerMonth: 200,
      },
    },
  });

  const enterprisePlan = await prisma.plan.upsert({
    where: { id: 'plan_enterprise' },
    update: {},
    create: {
      id: 'plan_enterprise',
      name: 'Enterprise',
      price: 199.99,
      currency: 'USD',
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

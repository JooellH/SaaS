import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Exchange rates as of December 15, 2025
  const exchangeRates = {
    ARS: 1020, // Argentine Peso (1 USD = 1020 ARS)
    BRL: 5.25, // Brazilian Real
    MXN: 17.50, // Mexican Peso
    COP: 3800, // Colombian Peso
    PEN: 3.50, // Peruvian Nuevo Sol
    CLP: 950, // Chilean Peso
    UYU: 42, // Uruguayan Peso
    VES: 36, // Venezuelan Bolívar
  };

  // Pricing strategy: 
  // - Base prices thought in ARS (~$1500-3000 ARS monthly subscription is realistic)
  // - Pro: 1500 ARS/month (meets Mercado Pago minimum $15)
  // - Enterprise: 3000 ARS/month (double Pro)
  const basicPlan = await prisma.plan.upsert({
    where: { id: 'plan_basic' },
    update: {},
    create: {
      id: 'plan_basic',
      name: 'Basic',
      price: 0, // Free plan
      currency: 'ARS',
      limits: {
        maxStaff: 1,
        maxServices: 2,
        maxBookingsPerMonth: 20,
      },
    },
  });

  // Pro plan: 1500 ARS/month (~1.47 USD at Dec 15, 2025 rates)
  // This is a testing/MVP price. Real price would be ~300-500 ARS
  const proPlan = await prisma.plan.upsert({
    where: { id: 'plan_pro' },
    update: {},
    create: {
      id: 'plan_pro',
      name: 'Pro',
      price: 1500, // ARS - Mercado Pago minimum requirement ($15 ARS threshold)
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
      price: 3000, // ARS
      currency: 'ARS',
      limits: {
        maxStaff: -1, // unlimited
        maxServices: -1,
        maxBookingsPerMonth: -1,
      },
    },
  });

  console.log('📊 Exchange rates reference (Dec 15, 2025):', exchangeRates);
  console.log('💱 Pro Plan pricing in different currencies:');
  console.log(`   ARS: $${proPlan.price}`);
  console.log(`   USD: $${Math.round((proPlan.price / exchangeRates.ARS) * 100) / 100}`);
  console.log(`   BRL: R$${Math.round((proPlan.price / exchangeRates.ARS) * exchangeRates.BRL * 100) / 100}`);
  console.log(`   MXN: $${Math.round((proPlan.price / exchangeRates.ARS) * exchangeRates.MXN * 100) / 100}`);
  console.log(`   COP: $${Math.round((proPlan.price / exchangeRates.ARS) * exchangeRates.COP)}`);

  // Seed exchange rates into database
  console.log('\n💱 Initializing exchange rates...');
  for (const [currency, rate] of Object.entries(exchangeRates)) {
    await prisma.exchangeRate.upsert({
      where: { currency },
      update: { rate },
      create: {
        currency,
        rate,
        source: 'freecurrencyapi',
      },
    });
  }
  console.log('✅ Exchange rates initialized');

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

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo user
  const hashedPassword = await bcrypt.hash('demo123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'demo@reservapro.com' },
    update: {},
    create: {
      name: 'Demo User',
      email: 'demo@reservapro.com',
      password: hashedPassword,
    },
  });

  console.log('✅ Created demo user:', user.email);

  // Create demo business
  const business = await prisma.business.upsert({
    where: { slug: 'demo-salon' },
    update: {},
    create: {
      name: 'Demo Salon & Spa',
      slug: 'demo-salon',
      ownerId: user.id,
      timezone: 'America/Argentina/Buenos_Aires',
      phoneNumber: '+5491112345678',
    },
  });

  console.log('✅ Created demo business:', business.name);

  // Create demo services
  const services = await Promise.all([
    prisma.service.upsert({
      where: { id: 'service-1' },
      update: {},
      create: {
        id: 'service-1',
        businessId: business.id,
        name: 'Corte de Cabello',
        durationMinutes: 30,
        cleaningTimeMinutes: 10,
        price: 5000,
      },
    }),
    prisma.service.upsert({
      where: { id: 'service-2' },
      update: {},
      create: {
        id: 'service-2',
        businessId: business.id,
        name: 'Manicura',
        durationMinutes: 45,
        cleaningTimeMinutes: 15,
        price: 3500,
      },
    }),
    prisma.service.upsert({
      where: { id: 'service-3' },
      update: {},
      create: {
        id: 'service-3',
        businessId: business.id,
        name: 'Masaje Relajante',
        durationMinutes: 60,
        cleaningTimeMinutes: 20,
        price: 8000,
      },
    }),
  ]);

  console.log('✅ Created', services.length, 'demo services');

  // Create demo schedule (Monday to Friday, 9am to 6pm)
  const schedules = await Promise.all([
    ...Array.from({ length: 5 }, (_, i) =>
      prisma.schedule.create({
        data: {
          businessId: business.id,
          weekday: i + 1,
          openTime: '09:00',
          closeTime: '18:00',
          breakStart: '13:00',
          breakEnd: '14:00',
        },
      }),
    ),
  ]);

  console.log('✅ Created', schedules.length, 'demo schedules');

  console.log('🎉 Seeding completed!');
  console.log('\n📧 Demo credentials:');
  console.log('Email: demo@reservapro.com');
  console.log('Password: demo123');
  console.log('Business URL: /demo-salon');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

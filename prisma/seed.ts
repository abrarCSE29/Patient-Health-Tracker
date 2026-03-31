import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create a default user
  const user = await prisma.user.upsert({
    where: { email: 'abrar@softograph.com' },
    update: {},
    create: {
      email: 'abrar@softograph.com',
      password: 'password123',
      name: 'Abrar',
    },
  });

  // Create a default profile
  const profile = await prisma.profile.create({
    data: {
      name: 'Abrar',
      age: 28,
      gender: 'Male',
      bloodGroup: 'O+',
      height: "5'10\"",
      weight: '75kg',
      userId: user.id,
    },
  });

  // Create some doctors
  const doctor1 = await prisma.doctor.create({
    data: {
      name: 'Dr. Sarah Smith',
      specialty: 'Cardiologist',
      hospital: 'City General Hospital',
      phone: '555-0101',
      email: 'sarah.smith@hospital.com',
      profileId: profile.id,
    },
  });

  const doctor2 = await prisma.doctor.create({
    data: {
      name: 'Dr. Michael Chen',
      specialty: 'General Practitioner',
      hospital: 'Westside Clinic',
      phone: '555-0102',
      email: 'michael.chen@clinic.com',
      profileId: profile.id,
    },
  });

  // Create some medications
  await prisma.medication.create({
    data: {
      name: 'Lisinopril 10mg',
      morningDosage: '1',
      morningMeal: 'After Meal',
      startDate: new Date().toISOString(),
      status: 'active',
      profileId: profile.id,
    },
  });

  await prisma.medication.create({
    data: {
      name: 'Metformin 500mg',
      morningDosage: '1',
      morningMeal: 'Before Meal',
      nightDosage: '1',
      nightMeal: 'After Meal',
      startDate: new Date().toISOString(),
      status: 'active',
      profileId: profile.id,
    },
  });

  // Create a visit
  await prisma.visit.create({
    data: {
      date: new Date().toISOString(),
      reason: 'Regular Checkup',
      diagnosis: 'Healthy',
      notes: 'Blood pressure is normal.',
      profileId: profile.id,
      doctorId: doctor1.id,
    },
  });

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

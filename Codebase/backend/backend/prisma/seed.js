import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.thought.deleteMany();
  await prisma.planet.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@gedankenwelt.local',
      username: 'admin',
      passwordHash: adminPassword,
      displayName: 'System Administrator',
      isAdmin: true,
    },
  });
  console.log('✓ Admin user created:', admin.email);

  // Create sample users
  const sampleUsers = await Promise.all(
    [
      { email: 'alice@example.com', username: 'alice', name: 'Alice Chen' },
      { email: 'bob@example.com', username: 'bob', name: 'Bob Smith' },
      { email: 'carol@example.com', username: 'carol', name: 'Carol Johnson' },
    ].map(async (user) => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      return prisma.user.create({
        data: {
          email: user.email,
          username: user.username,
          displayName: user.name,
          passwordHash: hashedPassword,
          emailVerified: new Date(),
        },
      });
    })
  );
  console.log(`✓ Created ${sampleUsers.length} sample users`);

  // Create sample planets
  const planets = await Promise.all([
    {
      name: 'Wisdom',
      description: 'The sphere of ancient wisdom and philosophical truth',
      color: '#8B5CF6',
      creatorId: admin.id,
    },
    {
      name: 'Creativity',
      description: 'Where imagination and creative expression flourish',
      color: '#EC4899',
      creatorId: sampleUsers[0].id,
    },
    {
      name: 'Ethics',
      description: 'Discussions on morality, right and wrong',
      color: '#06B6D4',
      creatorId: sampleUsers[1].id,
    },
    {
      name: 'Consciousness',
      description: 'Exploring the nature of awareness and being',
      color: '#F59E0B',
      creatorId: sampleUsers[2].id,
    },
  ].map((planet) =>
    prisma.planet.create({
      data: planet,
    })
  ));
  console.log(`✓ Created ${planets.length} sample planets`);

  // Create sample thoughts
  const thoughts = await Promise.all([
    {
      content: 'The unexamined life is not worth living. - Socrates',
      authorId: sampleUsers[0].id,
      planetId: planets[0].id,
      status: 'APPROVED',
      approvedAt: new Date(),
    },
    {
      content: 'Every moment is an opportunity for creative expression and growth.',
      authorId: sampleUsers[1].id,
      planetId: planets[1].id,
      status: 'APPROVED',
      approvedAt: new Date(),
    },
    {
      content: 'The ethical path requires constant reflection and humility.',
      authorId: sampleUsers[2].id,
      planetId: planets[2].id,
      status: 'APPROVED',
      approvedAt: new Date(),
    },
    {
      content: 'What makes us conscious? Is it merely matter, or something more?',
      authorId: admin.id,
      planetId: planets[3].id,
      status: 'PENDING',
    },
  ].map((thought) =>
    prisma.thought.create({
      data: thought,
    })
  ));
  console.log(`✓ Created ${thoughts.length} sample thoughts`);

  // Update planet thought counts
  for (const planet of planets) {
    const count = await prisma.thought.count({
      where: { planetId: planet.id },
    });
    await prisma.planet.update({
      where: { id: planet.id },
      data: { thoughtCount: count },
    });
  }
  console.log('✓ Updated planet thought counts');

  console.log('✅ Database seeding complete!');
  console.log('\n📝 Test credentials:');
  console.log('  Admin: admin@gedankenwelt.local / admin123');
  console.log('  User: alice@example.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

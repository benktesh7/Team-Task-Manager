const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Admin user
  const adminPass = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@taskmanager.com' },
    update: {},
    create: { name: 'Admin User', email: 'admin@taskmanager.com', password: adminPass, role: 'ADMIN' },
  });

  // Member user
  const memberPass = await bcrypt.hash('member123', 12);
  const member = await prisma.user.upsert({
    where: { email: 'member@taskmanager.com' },
    update: {},
    create: { name: 'Jane Member', email: 'member@taskmanager.com', password: memberPass, role: 'MEMBER' },
  });

  // Project
  const project = await prisma.project.upsert({
    where: { id: 'seed-project-1' },
    update: {},
    create: {
      id: 'seed-project-1',
      name: 'Website Redesign',
      description: 'Complete redesign of the company website with new branding',
      color: '#6366f1',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      ownerId: admin.id,
      members: {
        create: [
          { userId: admin.id, role: 'ADMIN' },
          { userId: member.id, role: 'MEMBER' },
        ],
      },
    },
  });

  // Tasks
  const tasks = [
    { title: 'Design new homepage mockups', status: 'DONE', priority: 'HIGH', assigneeId: member.id },
    { title: 'Set up CI/CD pipeline', status: 'IN_PROGRESS', priority: 'URGENT', assigneeId: admin.id },
    { title: 'Write API documentation', status: 'TODO', priority: 'MEDIUM', assigneeId: member.id },
    { title: 'Implement authentication', status: 'IN_REVIEW', priority: 'HIGH', assigneeId: admin.id },
    { title: 'Database schema design', status: 'DONE', priority: 'HIGH', assigneeId: admin.id },
  ];

  for (const t of tasks) {
    await prisma.task.create({
      data: {
        title: t.title,
        status: t.status,
        priority: t.priority,
        projectId: project.id,
        assigneeId: t.assigneeId,
        creatorId: admin.id,
        dueDate: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log('✅ Seed complete!');
  console.log('👤 Admin:  admin@taskmanager.com / admin123');
  console.log('👤 Member: member@taskmanager.com / member123');
}

main().catch(console.error).finally(() => prisma.$disconnect());

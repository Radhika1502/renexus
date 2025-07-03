const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Create sample project
  const project = await prisma.project.create({
    data: {
      id: 'project-1',
      name: 'Sample Project',
      description: 'A sample project for testing the dashboard',
    },
  });

  // Create sample tasks
  await prisma.task.createMany({
    data: [
      {
        id: 'task-1',
        title: 'Set up development environment',
        description: 'Configure the development environment for the project',
        status: 'done',
        priority: 'high',
        projectId: project.id,
        estimatedHours: 4,
      },
      {
        id: 'task-2',
        title: 'Implement dashboard components',
        description: 'Create dashboard components for project overview',
        status: 'in_progress',
        priority: 'medium',
        projectId: project.id,
        estimatedHours: 8,
      },
      {
        id: 'task-3',
        title: 'Write tests',
        description: 'Write unit and integration tests',
        status: 'todo',
        priority: 'medium',
        projectId: project.id,
        estimatedHours: 6,
      },
    ],
  });

  console.log('✅ Sample data created successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
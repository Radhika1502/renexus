import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create teams
  const team1 = await prisma.team.create({
    data: {
      name: 'Development Team',
      description: 'Frontend and backend developers',
    },
  });

  const team2 = await prisma.team.create({
    data: {
      name: 'QA Team',
      description: 'Quality assurance and testing',
    },
  });

  // Create users
  const user1 = await prisma.user.create({
    data: {
      email: 'john.doe@example.com',
      name: 'John Doe',
      teamId: team1.id,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'jane.smith@example.com',
      name: 'Jane Smith',
      teamId: team1.id,
    },
  });

  const user3 = await prisma.user.create({
    data: {
      email: 'mike.johnson@example.com',
      name: 'Mike Johnson',
      teamId: team2.id,
    },
  });

  // Create projects
  const project1 = await prisma.project.create({
    data: {
      name: 'E-commerce Platform',
      description: 'Building a modern e-commerce platform with React and Node.js',
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Mobile App',
      description: 'Cross-platform mobile application using React Native',
    },
  });

  // Create tasks with different statuses
  const tasks = [
    {
      title: 'Set up project structure',
      description: 'Initialize the project with proper folder structure and dependencies',
      status: 'done',
      priority: 'high',
      estimatedHours: 8,
      projectId: project1.id,
      assigneeId: user1.id,
      dueDate: new Date('2024-01-15'),
    },
    {
      title: 'Design user authentication',
      description: 'Create login and registration forms with validation',
      status: 'in_progress',
      priority: 'high',
      estimatedHours: 16,
      projectId: project1.id,
      assigneeId: user2.id,
      dueDate: new Date('2024-01-20'),
    },
    {
      title: 'Implement product catalog',
      description: 'Build product listing and detail pages',
      status: 'todo',
      priority: 'medium',
      estimatedHours: 24,
      projectId: project1.id,
      assigneeId: user1.id,
      dueDate: new Date('2024-01-25'),
    },
    {
      title: 'Set up CI/CD pipeline',
      description: 'Configure automated testing and deployment',
      status: 'review',
      priority: 'medium',
      estimatedHours: 12,
      projectId: project1.id,
      assigneeId: user3.id,
      dueDate: new Date('2024-01-18'),
    },
    {
      title: 'Mobile app wireframes',
      description: 'Create wireframes for all mobile app screens',
      status: 'done',
      priority: 'high',
      estimatedHours: 20,
      projectId: project2.id,
      assigneeId: user2.id,
      dueDate: new Date('2024-01-10'),
    },
    {
      title: 'API integration',
      description: 'Integrate mobile app with backend APIs',
      status: 'in_progress',
      priority: 'high',
      estimatedHours: 32,
      projectId: project2.id,
      assigneeId: user1.id,
      dueDate: new Date('2024-01-30'),
    },
    {
      title: 'Performance testing',
      description: 'Conduct load and performance tests',
      status: 'todo',
      priority: 'low',
      estimatedHours: 16,
      projectId: project2.id,
      assigneeId: user3.id,
      dueDate: new Date('2024-02-05'),
    },
    {
      title: 'Database optimization',
      description: 'Optimize database queries and indexing',
      status: 'done',
      priority: 'medium',
      estimatedHours: 10,
      projectId: project1.id,
      assigneeId: user1.id,
      dueDate: new Date('2024-01-12'),
    },
  ];

  // Create tasks
  for (const taskData of tasks) {
    await prisma.task.create({
      data: taskData,
    });
  }

  // Create some time logs
  const allTasks = await prisma.task.findMany();
  
  for (const task of allTasks.slice(0, 4)) {
    await prisma.timeLog.create({
      data: {
        taskId: task.id,
        userId: task.assigneeId || user1.id,
        userName: 'John Doe',
        startTime: new Date('2024-01-10T09:00:00Z'),
        endTime: new Date('2024-01-10T12:00:00Z'),
        duration: 10800, // 3 hours in seconds
        notes: 'Working on initial implementation',
      },
    });
  }

  // Create task dependencies
  const taskList = await prisma.task.findMany();
  if (taskList.length >= 2) {
    await prisma.taskDependency.create({
      data: {
        taskId: taskList[1].id, // "Design user authentication" depends on
        dependsOnTaskId: taskList[0].id, // "Set up project structure"
      },
    });
  }

  // Create task templates
  await prisma.taskTemplate.create({
    data: {
      name: 'Feature Development Template',
      description: 'Standard template for new feature development',
      priority: 'medium',
      estimatedHours: 16,
      category: 'development',
      fields: JSON.stringify({
        requirements: '',
        acceptanceCriteria: '',
        testingNotes: '',
      }),
    },
  });

  await prisma.taskTemplate.create({
    data: {
      name: 'Bug Fix Template',
      description: 'Template for bug fixes and issue resolution',
      priority: 'high',
      estimatedHours: 4,
      category: 'bugfix',
      fields: JSON.stringify({
        reproductionSteps: '',
        expectedBehavior: '',
        actualBehavior: '',
        solution: '',
      }),
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log(`📊 Created:`);
  console.log(`  - ${await prisma.team.count()} teams`);
  console.log(`  - ${await prisma.user.count()} users`);
  console.log(`  - ${await prisma.project.count()} projects`);
  console.log(`  - ${await prisma.task.count()} tasks`);
  console.log(`  - ${await prisma.timeLog.count()} time logs`);
  console.log(`  - ${await prisma.taskDependency.count()} task dependencies`);
  console.log(`  - ${await prisma.taskTemplate.count()} task templates`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
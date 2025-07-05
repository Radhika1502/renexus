import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create teams
  const team1 = await prisma.team.create({
    data: {
      name: 'Development Team',
      description: 'Main development team for Renexus project',
    },
  });

  const team2 = await prisma.team.create({
    data: {
      name: 'Design Team',
      description: 'UI/UX design team',
    },
  });

  // Create users
  const user1 = await prisma.user.create({
    data: {
      email: 'john.doe@renexus.com',
      name: 'John Doe',
      teamId: team1.id,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'jane.smith@renexus.com',
      name: 'Jane Smith',
      teamId: team1.id,
    },
  });

  const user3 = await prisma.user.create({
    data: {
      email: 'mike.johnson@renexus.com',
      name: 'Mike Johnson',
      teamId: team2.id,
    },
  });

  const user4 = await prisma.user.create({
    data: {
      email: 'sarah.wilson@renexus.com',
      name: 'Sarah Wilson',
      teamId: team2.id,
    },
  });

  // Create projects
  const project1 = await prisma.project.create({
    data: {
      name: 'Renexus Core Development',
      description: 'Main project for developing the Renexus application',
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'UI Component Library',
      description: 'Building reusable UI components',
    },
  });

  const project3 = await prisma.project.create({
    data: {
      name: 'API Development',
      description: 'Backend API development and integration',
    },
  });

  // Create tasks for project 1
  const task1 = await prisma.task.create({
    data: {
      title: 'Setup Database Schema',
      description: 'Design and implement the database schema using Prisma',
      status: 'done',
      priority: 'high',
      estimatedHours: 8,
      dueDate: new Date('2025-01-10'),
      projectId: project1.id,
      assigneeId: user1.id,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: 'Implement Dashboard API',
      description: 'Create REST API endpoints for dashboard functionality',
      status: 'in_progress',
      priority: 'high',
      estimatedHours: 12,
      dueDate: new Date('2025-01-15'),
      projectId: project1.id,
      assigneeId: user1.id,
    },
  });

  const task3 = await prisma.task.create({
    data: {
      title: 'Frontend Dashboard Components',
      description: 'Build React components for the dashboard',
      status: 'in_progress',
      priority: 'medium',
      estimatedHours: 16,
      dueDate: new Date('2025-01-20'),
      projectId: project1.id,
      assigneeId: user2.id,
    },
  });

  const task4 = await prisma.task.create({
    data: {
      title: 'User Authentication',
      description: 'Implement user login and registration',
      status: 'todo',
      priority: 'high',
      estimatedHours: 10,
      dueDate: new Date('2025-01-25'),
      projectId: project1.id,
      assigneeId: user1.id,
    },
  });

  // Create tasks for project 2
  const task5 = await prisma.task.create({
    data: {
      title: 'Design Button Components',
      description: 'Create reusable button components with variants',
      status: 'done',
      priority: 'medium',
      estimatedHours: 6,
      dueDate: new Date('2025-01-08'),
      projectId: project2.id,
      assigneeId: user3.id,
    },
  });

  const task6 = await prisma.task.create({
    data: {
      title: 'Form Components',
      description: 'Build form input components and validation',
      status: 'in_progress',
      priority: 'medium',
      estimatedHours: 8,
      dueDate: new Date('2025-01-18'),
      projectId: project2.id,
      assigneeId: user3.id,
    },
  });

  const task7 = await prisma.task.create({
    data: {
      title: 'Navigation Components',
      description: 'Create navigation and menu components',
      status: 'todo',
      priority: 'low',
      estimatedHours: 4,
      dueDate: new Date('2025-01-22'),
      projectId: project2.id,
      assigneeId: user4.id,
    },
  });

  // Create tasks for project 3
  const task8 = await prisma.task.create({
    data: {
      title: 'Setup API Gateway',
      description: 'Configure and setup the main API gateway',
      status: 'done',
      priority: 'high',
      estimatedHours: 6,
      dueDate: new Date('2025-01-05'),
      projectId: project3.id,
      assigneeId: user1.id,
    },
  });

  const task9 = await prisma.task.create({
    data: {
      title: 'Database Integration',
      description: 'Connect API to PostgreSQL database',
      status: 'done',
      priority: 'high',
      estimatedHours: 4,
      dueDate: new Date('2025-01-07'),
      projectId: project3.id,
      assigneeId: user1.id,
    },
  });

  const task10 = await prisma.task.create({
    data: {
      title: 'API Documentation',
      description: 'Create comprehensive API documentation',
      status: 'todo',
      priority: 'medium',
      estimatedHours: 8,
      dueDate: new Date('2025-01-30'),
      projectId: project3.id,
      assigneeId: user2.id,
    },
  });

  // Create time logs
  await prisma.timeLog.create({
    data: {
      taskId: task1.id,
      userId: user1.id,
      userName: user1.name,
      startTime: new Date('2025-01-03T09:00:00Z'),
      endTime: new Date('2025-01-03T17:00:00Z'),
      duration: 28800, // 8 hours in seconds
      notes: 'Completed database schema design and implementation',
    },
  });

  await prisma.timeLog.create({
    data: {
      taskId: task2.id,
      userId: user1.id,
      userName: user1.name,
      startTime: new Date('2025-01-04T09:00:00Z'),
      endTime: new Date('2025-01-04T15:00:00Z'),
      duration: 21600, // 6 hours in seconds
      notes: 'Working on dashboard API endpoints',
    },
  });

  await prisma.timeLog.create({
    data: {
      taskId: task5.id,
      userId: user3.id,
      userName: user3.name,
      startTime: new Date('2025-01-02T10:00:00Z'),
      endTime: new Date('2025-01-02T16:00:00Z'),
      duration: 21600, // 6 hours in seconds
      notes: 'Designed and implemented button components',
    },
  });

  await prisma.timeLog.create({
    data: {
      taskId: task8.id,
      userId: user1.id,
      userName: user1.name,
      startTime: new Date('2025-01-01T09:00:00Z'),
      endTime: new Date('2025-01-01T15:00:00Z'),
      duration: 21600, // 6 hours in seconds
      notes: 'Setup and configured API gateway',
    },
  });

  // Create task templates
  await prisma.taskTemplate.create({
    data: {
      name: 'Bug Fix Template',
      description: 'Standard template for bug fixes',
      priority: 'high',
      estimatedHours: 2,
      category: 'bug',
      fields: JSON.stringify({
        steps_to_reproduce: '',
        expected_behavior: '',
        actual_behavior: '',
        browser_version: '',
        operating_system: ''
      }),
    },
  });

  await prisma.taskTemplate.create({
    data: {
      name: 'Feature Development Template',
      description: 'Template for new feature development',
      priority: 'medium',
      estimatedHours: 8,
      category: 'feature',
      fields: JSON.stringify({
        user_story: '',
        acceptance_criteria: '',
        technical_requirements: '',
        design_mockups: ''
      }),
    },
  });

  console.log('✅ Database seeding completed successfully!');
  console.log(`📊 Created:
    - ${await prisma.team.count()} teams
    - ${await prisma.user.count()} users  
    - ${await prisma.project.count()} projects
    - ${await prisma.task.count()} tasks
    - ${await prisma.timeLog.count()} time logs
    - ${await prisma.taskTemplate.count()} task templates`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
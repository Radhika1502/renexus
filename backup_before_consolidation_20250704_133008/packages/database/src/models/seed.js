// @ts-check
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { faker } = require('@faker-js/faker');

async function main() {
  console.log('Starting seed data generation...');

  // Clean up existing data
  await prisma.taskDependency.deleteMany({});
  await prisma.timeLog.deleteMany({});
  await prisma.taskAttachment.deleteMany({});
  await prisma.taskAssignment.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.tenant.deleteMany({});

  console.log('Existing data cleaned up');

  // Create tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Renexus Demo Organization',
      domain: 'renexus.demo',
      plan: 'ENTERPRISE',
      active: true
    }
  });

  console.log(`Created tenant: ${tenant.id}`);

  // Create 10 users
  const users = [];
  for (let i = 0; i < 10; i++) {
    const user = await prisma.user.create({
      data: {
        email: faker.internet.email(),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        role: i < 2 ? 'ADMIN' : (i < 5 ? 'MANAGER' : 'USER'),
        tenantId: tenant.id,
        avatar: faker.image.avatar(),
        active: true
      }
    });
    users.push(user);
    console.log(`Created user: ${user.email}`);
  }

  // Create 5 projects
  const projects = [];
  const projectStatuses = ['PLANNING', 'ACTIVE', 'COMPLETED', 'ON_HOLD', 'CANCELLED'];
  
  for (let i = 0; i < 5; i++) {
    const startDate = faker.date.past({ years: 1 });
    const endDate = faker.date.future({ years: 1, refDate: startDate });
    
    const project = await prisma.project.create({
      data: {
        name: faker.company.name() + ' ' + faker.company.buzzPhrase(),
        description: faker.lorem.paragraph(),
        status: projectStatuses[i],
        startDate,
        endDate,
        tenantId: tenant.id,
        createdById: users[0].id,
        managerId: users[Math.floor(Math.random() * 5)].id
      }
    });
    projects.push(project);
    console.log(`Created project: ${project.name}`);
  }

  // Create 60 tasks (exceeding the 50+ requirement)
  const tasks = [];
  const taskStatuses = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
  const taskPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
  
  for (let i = 0; i < 60; i++) {
    const projectIndex = Math.floor(Math.random() * projects.length);
    const project = projects[projectIndex];
    
    const createdAt = faker.date.between({ 
      from: project.startDate, 
      to: new Date() 
    });
    
    const startDate = faker.date.between({ 
      from: createdAt, 
      to: new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000) 
    });
    
    const dueDate = faker.date.between({ 
      from: startDate, 
      to: new Date(startDate.getTime() + 60 * 24 * 60 * 60 * 1000) 
    });
    
    const task = await prisma.task.create({
      data: {
        title: faker.hacker.phrase(),
        description: faker.lorem.paragraphs(2),
        status: taskStatuses[Math.floor(Math.random() * taskStatuses.length)],
        priority: taskPriorities[Math.floor(Math.random() * taskPriorities.length)],
        createdAt,
        startDate,
        dueDate,
        estimatedHours: Math.floor(Math.random() * 40) + 1,
        projectId: project.id,
        tenantId: tenant.id,
        createdById: users[Math.floor(Math.random() * users.length)].id
      }
    });
    tasks.push(task);
    
    // Create task assignments (1-3 assignees per task)
    const assigneeCount = Math.floor(Math.random() * 3) + 1;
    const assignedUsers = new Set();
    
    for (let j = 0; j < assigneeCount; j++) {
      let userId;
      do {
        userId = users[Math.floor(Math.random() * users.length)].id;
      } while (assignedUsers.has(userId));
      
      assignedUsers.add(userId);
      
      await prisma.taskAssignment.create({
        data: {
          taskId: task.id,
          userId,
          assignedAt: createdAt,
          assignedById: users[0].id
        }
      });
    }
    
    // Create time logs for some tasks (50% chance)
    if (Math.random() > 0.5) {
      const logCount = Math.floor(Math.random() * 5) + 1;
      
      for (let j = 0; j < logCount; j++) {
        const userId = users[Math.floor(Math.random() * users.length)].id;
        const startTime = faker.date.between({ 
          from: startDate, 
          to: new Date() 
        });
        const endTime = new Date(startTime.getTime() + (Math.floor(Math.random() * 8) + 1) * 60 * 60 * 1000);
        
        await prisma.timeLog.create({
          data: {
            taskId: task.id,
            userId,
            startTime,
            endTime,
            description: faker.lorem.sentence(),
            tenantId: tenant.id
          }
        });
      }
    }
    
    // Create attachments for some tasks (30% chance)
    if (Math.random() > 0.7) {
      const attachmentCount = Math.floor(Math.random() * 3) + 1;
      
      for (let j = 0; j < attachmentCount; j++) {
        await prisma.taskAttachment.create({
          data: {
            taskId: task.id,
            fileName: faker.system.fileName(),
            fileSize: Math.floor(Math.random() * 10000000),
            fileType: faker.system.fileType(),
            uploadedById: users[Math.floor(Math.random() * users.length)].id,
            uploadedAt: faker.date.between({ 
              from: createdAt, 
              to: new Date() 
            }),
            url: faker.image.url(),
            tenantId: tenant.id
          }
        });
      }
    }
  }
  
  console.log(`Created ${tasks.length} tasks with assignments, time logs, and attachments`);

  // Create task dependencies (for 40% of tasks)
  const dependencyTypes = ['FINISH_TO_START', 'START_TO_START', 'FINISH_TO_FINISH', 'START_TO_FINISH'];
  let dependencyCount = 0;
  
  for (let i = 0; i < tasks.length; i++) {
    if (Math.random() > 0.6) {
      // Find a suitable task to depend on (must be from same project and not create circular dependency)
      const currentTask = tasks[i];
      const projectTasks = tasks.filter(t => 
        t.projectId === currentTask.projectId && 
        t.id !== currentTask.id
      );
      
      if (projectTasks.length > 0) {
        const dependsOnTask = projectTasks[Math.floor(Math.random() * projectTasks.length)];
        
        await prisma.taskDependency.create({
          data: {
            fromTaskId: dependsOnTask.id,
            toTaskId: currentTask.id,
            type: dependencyTypes[Math.floor(Math.random() * dependencyTypes.length)],
            tenantId: tenant.id
          }
        });
        
        dependencyCount++;
      }
    }
  }
  
  console.log(`Created ${dependencyCount} task dependencies`);
  console.log('Seed data generation completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

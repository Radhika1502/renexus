const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Create teams
    const teams = await prisma.team.createMany({
      data: [
        {
          id: 'team-1',
          name: 'Development Team',
          description: 'Frontend and backend developers'
        },
        {
          id: 'team-2',
          name: 'QA Team',
          description: 'Quality assurance engineers'
        },
        {
          id: 'team-3',
          name: 'Design Team',
          description: 'UI/UX designers'
        },
        {
          id: 'team-4',
          name: 'DevOps Team',
          description: 'Infrastructure and deployment'
        }
      ],
      skipDuplicates: true
    });
    console.log('✅ Created teams');

    // Create users
    const users = await prisma.user.createMany({
    data: [
      {
          id: 'user-1',
          name: 'John Developer',
          email: 'john@example.com',
          teamId: 'team-1'
        },
        {
          id: 'user-2',
          name: 'Sarah QA',
          email: 'sarah@example.com',
          teamId: 'team-2'
        },
        {
          id: 'user-3',
          name: 'Mike Designer',
          email: 'mike@example.com',
          teamId: 'team-3'
        }
      ],
      skipDuplicates: true
    });
    console.log('✅ Created users');

    // Create projects
    const projects = await Promise.all([
      prisma.project.upsert({
        where: { id: 'project-1' },
        update: {},
        create: {
          id: 'project-1',
          name: 'Sample Project',
          description: 'A sample project for testing the dashboard'
        }
      }),
      prisma.project.upsert({
        where: { id: 'project-2' },
        update: {},
        create: {
          id: 'project-2',
          name: 'E-commerce Platform',
          description: 'Online shopping platform with payment integration'
        }
      }),
      prisma.project.upsert({
        where: { id: 'project-3' },
        update: {},
        create: {
          id: 'project-3',
          name: 'Mobile App',
          description: 'Cross-platform mobile application'
        }
      })
    ]);
    console.log('✅ Created projects');

    // Create tasks
    const tasks = await Promise.all([
      // Sample Project tasks
      prisma.task.upsert({
        where: { id: 'task-1' },
        update: {},
        create: {
        id: 'task-1',
        title: 'Set up development environment',
        description: 'Configure the development environment for the project',
        status: 'done',
        priority: 'high',
          projectId: 'project-1',
        estimatedHours: 4,
          assigneeId: 'user-1'
        }
      }),
      prisma.task.upsert({
        where: { id: 'task-2' },
        update: {},
        create: {
        id: 'task-2',
        title: 'Implement dashboard components',
        description: 'Create dashboard components for project overview',
        status: 'in_progress',
        priority: 'medium',
          projectId: 'project-1',
        estimatedHours: 8,
          assigneeId: 'user-1'
        }
      }),
      prisma.task.upsert({
        where: { id: 'task-3' },
        update: {},
        create: {
        id: 'task-3',
        title: 'Write tests',
        description: 'Write unit and integration tests',
        status: 'todo',
        priority: 'medium',
          projectId: 'project-1',
          estimatedHours: 6,
          assigneeId: 'user-2'
        }
      }),
      
      // E-commerce Platform tasks
      prisma.task.upsert({
        where: { id: 'task-4' },
        update: {},
        create: {
          id: 'task-4',
          title: 'Design product page',
          description: 'Create UI design for product details page',
          status: 'done',
          priority: 'high',
          projectId: 'project-2',
        estimatedHours: 6,
          assigneeId: 'user-3'
        }
      }),
      prisma.task.upsert({
        where: { id: 'task-5' },
        update: {},
        create: {
          id: 'task-5',
          title: 'Implement shopping cart',
          description: 'Create shopping cart functionality',
          status: 'done',
          priority: 'high',
          projectId: 'project-2',
          estimatedHours: 10,
          assigneeId: 'user-1'
        }
      }),
      prisma.task.upsert({
        where: { id: 'task-6' },
        update: {},
        create: {
          id: 'task-6',
          title: 'Payment gateway integration',
          description: 'Integrate with payment processor',
          status: 'in_progress',
          priority: 'high',
          projectId: 'project-2',
          estimatedHours: 12,
          assigneeId: 'user-1'
        }
      }),
      prisma.task.upsert({
        where: { id: 'task-7' },
        update: {},
        create: {
          id: 'task-7',
          title: 'User authentication',
          description: 'Implement user login and registration',
          status: 'todo',
          priority: 'medium',
          projectId: 'project-2',
          estimatedHours: 8,
          assigneeId: 'user-1'
        }
      }),
      prisma.task.upsert({
        where: { id: 'task-8' },
        update: {},
        create: {
          id: 'task-8',
          title: 'Order management',
          description: 'Create order processing system',
          status: 'todo',
          priority: 'medium',
          projectId: 'project-2',
          estimatedHours: 14,
          assigneeId: null
        }
      }),
      
      // Mobile App tasks
      prisma.task.upsert({
        where: { id: 'task-9' },
        update: {},
        create: {
          id: 'task-9',
          title: 'App wireframes',
          description: 'Create wireframes for mobile app',
          status: 'done',
          priority: 'medium',
          projectId: 'project-3',
          estimatedHours: 8,
          assigneeId: 'user-3'
        }
      }),
      prisma.task.upsert({
        where: { id: 'task-10' },
        update: {},
        create: {
          id: 'task-10',
          title: 'React Native setup',
          description: 'Set up React Native development environment',
          status: 'in_progress',
          priority: 'high',
          projectId: 'project-3',
          estimatedHours: 4,
          assigneeId: 'user-1'
        }
      }),
      prisma.task.upsert({
        where: { id: 'task-11' },
        update: {},
        create: {
          id: 'task-11',
          title: 'API integration',
          description: 'Connect mobile app to backend APIs',
          status: 'review',
          priority: 'high',
          projectId: 'project-3',
          estimatedHours: 10,
          assigneeId: 'user-1'
        }
      })
    ]);
    console.log('✅ Created tasks');

    // Create time logs
    const timeLogs = await prisma.timeLog.createMany({
      data: [
        {
          id: 'log-1',
          taskId: 'task-1',
          userId: 'user-1',
          userName: 'John Developer',
          startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          endTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
          duration: 4 * 60 * 60, // 4 hours in seconds
          notes: 'Initial setup completed'
        },
        {
          id: 'log-2',
          taskId: 'task-5',
          userId: 'user-1',
          userName: 'John Developer',
          startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          endTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
          duration: 6 * 60 * 60, // 6 hours in seconds
          notes: 'Shopping cart functionality implemented'
        },
        {
          id: 'log-3',
          taskId: 'task-9',
          userId: 'user-3',
          userName: 'Mike Designer',
          startTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          endTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000),
          duration: 8 * 60 * 60, // 8 hours in seconds
          notes: 'Completed all wireframes'
        },
        {
          id: 'log-4',
          taskId: 'task-4',
          userId: 'user-3',
          userName: 'Mike Designer',
          startTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          endTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
          duration: 6 * 60 * 60, // 6 hours in seconds
          notes: 'Product page design completed'
        }
      ],
      skipDuplicates: true
    });
    console.log('✅ Created time logs');

    // Create task dependencies
    const dependencies = await prisma.taskDependency.upsert({
      where: {
        taskId_dependsOnTaskId: {
          taskId: 'task-2',
          dependsOnTaskId: 'task-1'
        }
      },
      update: {},
      create: {
        id: 'dependency-1',
        taskId: 'task-2', // "Implement dashboard components"
        dependsOnTaskId: 'task-1' // depends on "Set up development environment"
      }
    });
    console.log('✅ Created task dependencies');

    // Create task templates
    const templates = await Promise.all([
      prisma.taskTemplate.upsert({
        where: { id: 'template-1' },
        update: {},
        create: {
          id: 'template-1',
          name: 'Bug Fix Template',
          description: 'Template for bug fixing tasks',
          priority: 'high',
          estimatedHours: 4,
          category: 'bug',
          fields: JSON.stringify({
            steps_to_reproduce: '',
            expected_behavior: '',
            actual_behavior: '',
            browser_version: '',
            os_version: ''
          })
        }
      }),
      prisma.taskTemplate.upsert({
        where: { id: 'template-2' },
        update: {},
        create: {
          id: 'template-2',
          name: 'Feature Request Template',
          description: 'Template for new feature tasks',
          priority: 'medium',
          estimatedHours: 8,
          category: 'feature',
          fields: JSON.stringify({
            user_story: '',
            acceptance_criteria: '',
            design_links: '',
            technical_notes: ''
          })
        }
      })
    ]);
    console.log('✅ Created task templates');

    console.log('✅ All sample data created successfully!');
    console.log(`
    Data Summary:
    - Teams: 4
    - Users: 3
    - Projects: 3
    - Tasks: 11
    - Time Logs: 4
    - Dependencies: 1
    - Templates: 2
    `);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
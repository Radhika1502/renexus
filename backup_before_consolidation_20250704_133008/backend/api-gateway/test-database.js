const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabase() {
  console.log('🧪 Testing Database Implementation...\n');

  try {
    // Test 1: Check if all models are accessible
    console.log('✅ Test 1: Database Connection');
    await prisma.$connect();
    console.log('   Database connected successfully\n');

    // Test 2: Check data counts
    console.log('✅ Test 2: Data Verification');
    const counts = {
      teams: await prisma.team.count(),
      users: await prisma.user.count(),
      projects: await prisma.project.count(),
      tasks: await prisma.task.count(),
      timeLogs: await prisma.timeLog.count(),
      taskDependencies: await prisma.taskDependency.count(),
      taskTemplates: await prisma.taskTemplate.count(),
    };
    
    console.log('   Data counts:', counts);
    console.log('');

    // Test 3: Test dashboard summary logic
    console.log('✅ Test 3: Dashboard Summary Logic');
    
    const totalTasks = await prisma.task.count();
    const completedTasks = await prisma.task.count({
      where: { status: 'done' }
    });
    const inProgressTasks = await prisma.task.count({
      where: { status: 'in_progress' }
    });
    const todoTasks = await prisma.task.count({
      where: { status: 'todo' }
    });
    
    console.log('   Task Summary:');
    console.log(`     Total: ${totalTasks}`);
    console.log(`     Completed: ${completedTasks}`);
    console.log(`     In Progress: ${inProgressTasks}`);
    console.log(`     Todo: ${todoTasks}`);
    console.log('');

    // Test 4: Test task status distribution
    console.log('✅ Test 4: Task Status Distribution');
    const tasks = await prisma.task.findMany({
      select: { status: true }
    });
    
    const statusCounts = {};
    tasks.forEach(task => {
      statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
    });
    
    console.log('   Status Distribution:', statusCounts);
    console.log('');

    // Test 5: Test team performance
    console.log('✅ Test 5: Team Performance');
    const teams = await prisma.team.findMany({
      include: {
        users: true
      }
    });
    
    for (const team of teams) {
      const userIds = team.users.map(user => user.id);
      const teamTasks = await prisma.task.findMany({
        where: {
          assigneeId: {
            in: userIds
          }
        }
      });
      
      console.log(`   Team: ${team.name}`);
      console.log(`     Members: ${team.users.length}`);
      console.log(`     Tasks: ${teamTasks.length}`);
      console.log(`     Completed: ${teamTasks.filter(t => t.status === 'done').length}`);
    }
    console.log('');

    // Test 6: Test project data
    console.log('✅ Test 6: Project Data');
    const projects = await prisma.project.findMany({
      include: {
        tasks: {
          select: {
            id: true,
            status: true,
            title: true
          }
        }
      }
    });
    
    projects.forEach(project => {
      console.log(`   Project: ${project.name}`);
      console.log(`     Tasks: ${project.tasks.length}`);
      console.log(`     Completed: ${project.tasks.filter(t => t.status === 'done').length}`);
    });
    console.log('');

    // Test 7: Test task dependencies
    console.log('✅ Test 7: Task Dependencies');
    const dependencies = await prisma.taskDependency.findMany({
      include: {
        task: { select: { title: true } },
        dependsOnTask: { select: { title: true } }
      }
    });
    
    dependencies.forEach(dep => {
      console.log(`   "${dep.task.title}" depends on "${dep.dependsOnTask.title}"`);
    });
    console.log('');

    console.log('🎉 All database tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the tests
testDatabase(); 
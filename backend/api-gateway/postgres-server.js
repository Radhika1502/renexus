const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const PORT = 3001;
const prisma = new PrismaClient();

console.log('🚀 Starting Renexus PostgreSQL Server...');

// Enable CORS for frontend
app.use(cors({
  origin: ['http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

// Test database connection
async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL database');
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to PostgreSQL:', error.message);
    return false;
  }
}

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Renexus PostgreSQL Server is running',
    database: 'postgresql',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'API is running',
    database: 'postgresql',
    timestamp: new Date().toISOString()
  });
});

// Dashboard summary endpoint
app.get('/dashboard/summary', async (req, res) => {
  try {
    console.log('📊 Fetching dashboard summary from PostgreSQL...');
    
    const [
      totalProjects,
      totalTasks,
      completedTasks,
      totalUsers,
      activeUsers
    ] = await Promise.all([
      prisma.project.count(),
      prisma.task.count(),
      prisma.task.count({ where: { status: 'done' } }),
      prisma.user.count(),
      prisma.user.count() // For now, all users are considered active
    ]);

    const pendingTasks = totalTasks - completedTasks;

    const summary = {
      totalProjects,
      totalTasks,
      completedTasks,
      pendingTasks,
      totalUsers,
      activeUsers
    };

    console.log('✅ Dashboard summary:', summary);
    res.json(summary);
  } catch (error) {
    console.error('❌ Error fetching dashboard summary:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
});

// Projects endpoint
app.get('/dashboard/projects', async (req, res) => {
  try {
    console.log('📋 Fetching projects from PostgreSQL...');
    
    const projects = await prisma.project.findMany({
      include: {
        tasks: {
          select: {
            id: true,
            status: true
          }
        }
      }
    });

    const projectSummaries = projects.map(project => {
      const totalTasks = project.tasks.length;
      const completedTasks = project.tasks.filter(task => task.status === 'done').length;
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        completionRate,
        totalTasks,
        completedTasks,
        status: 'active'
      };
    });

    console.log(`✅ Found ${projectSummaries.length} projects`);
    res.json(projectSummaries);
  } catch (error) {
    console.error('❌ Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Task status endpoint
app.get('/dashboard/tasks/status', async (req, res) => {
  try {
    console.log('📋 Fetching task status from PostgreSQL...');
    
    const tasksByStatus = await prisma.task.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });

    const totalTasks = tasksByStatus.reduce((sum, group) => sum + group._count.status, 0);
    
    const taskStatus = tasksByStatus.map(group => ({
      status: group.status,
      count: group._count.status,
      percentage: totalTasks > 0 ? Math.round((group._count.status / totalTasks) * 100) : 0
    }));

    console.log('✅ Task status:', taskStatus);
    res.json(taskStatus);
  } catch (error) {
    console.error('❌ Error fetching task status:', error);
    res.status(500).json({ error: 'Failed to fetch task status' });
  }
});

// Activity endpoint
app.get('/dashboard/activity', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    console.log(`📋 Fetching activity from PostgreSQL (limit: ${limit})...`);
    
    // Get recent time logs as activities
    const timeLogs = await prisma.timeLog.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        task: {
          select: {
            title: true,
            status: true
          }
        }
      }
    });

    const activities = timeLogs.map(log => ({
      id: log.id,
      userName: log.userName,
      action: log.endTime ? 'completed work on' : 'started working on',
      entityName: log.task.title,
      entityType: 'TASK',
      timestamp: log.createdAt.toISOString(),
      userAvatar: null
    }));

    console.log(`✅ Found ${activities.length} activities`);
    res.json(activities);
  } catch (error) {
    console.error('❌ Error fetching activity:', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// Users endpoint
app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        team: {
          select: {
            name: true
          }
        }
      }
    });
    res.json(users);
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Teams endpoint
app.get('/api/teams', async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    res.json(teams);
  } catch (error) {
    console.error('❌ Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// Tasks endpoint
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        project: {
          select: {
            name: true
          }
        },
        timeLogs: {
          select: {
            duration: true
          }
        }
      }
    });
    res.json(tasks);
  } catch (error) {
    console.error('❌ Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Projects endpoint (full)
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        tasks: {
          include: {
            timeLogs: {
              select: {
                duration: true
              }
            }
          }
        }
      }
    });
    res.json(projects);
  } catch (error) {
    console.error('❌ Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
async function startServer() {
  const dbConnected = await testDatabaseConnection();
  
  if (!dbConnected) {
    console.error('❌ Cannot start server without database connection');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`✅ Renexus PostgreSQL Server running on http://localhost:${PORT}`);
    console.log(`🗄️  Database: PostgreSQL (Real-time data)`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard/summary`);
    console.log(`🔍 Health Check: http://localhost:${PORT}/health`);
  });
}

startServer().catch(console.error); 
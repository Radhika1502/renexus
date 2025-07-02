/**
 * Automated Failover Script for Renexus
 * 
 * This script manages automatic failover between primary and standby servers
 * Usage: node scripts/failover.js --mode=auto|manual --target=primary|standby
 */

const { execSync } = require('child_process');
const dotenv = require('dotenv');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const logger = require('../config/logging/logger-config');

// Load environment variables
dotenv.config();

// Parse command line arguments
const args = process.argv.slice(2);
let mode = 'auto'; // Default to automatic mode
let target = null; // Manual target server (primary or standby)

args.forEach(arg => {
  if (arg.startsWith('--mode=')) {
    mode = arg.split('=')[1];
  } else if (arg.startsWith('--target=')) {
    target = arg.split('=')[1];
  }
});

// Validate arguments
if (mode !== 'auto' && mode !== 'manual') {
  logger.error('Invalid mode. Use --mode=auto or --mode=manual');
  process.exit(1);
}

if (mode === 'manual' && (target !== 'primary' && target !== 'standby')) {
  logger.error('Invalid target for manual mode. Use --target=primary or --target=standby');
  process.exit(1);
}

// Configuration
const config = {
  primary: {
    apiUrl: process.env.PRIMARY_API_URL || 'http://primary:3000/api/health',
    dbUrl: process.env.PRIMARY_DB_URL || 'postgresql://primary:5432',
    webUrl: process.env.PRIMARY_WEB_URL || 'http://primary:80/health'
  },
  standby: {
    apiUrl: process.env.STANDBY_API_URL || 'http://standby:3000/api/health',
    dbUrl: process.env.STANDBY_DB_URL || 'postgresql://standby:5432',
    webUrl: process.env.STANDBY_WEB_URL || 'http://standby:80/health'
  },
  healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '5000', 10),
  failoverThreshold: parseInt(process.env.FAILOVER_THRESHOLD || '3', 10),
  haproxyConfig: process.env.HAPROXY_CONFIG || '/etc/haproxy/haproxy.cfg',
  stateFile: path.join(__dirname, '../data/failover-state.json')
};

// Ensure state directory exists
const stateDir = path.dirname(config.stateFile);
if (!fs.existsSync(stateDir)) {
  fs.mkdirSync(stateDir, { recursive: true });
}

// State management
let state = {
  activeServer: 'primary',
  failureCount: {
    primary: 0,
    standby: 0
  },
  lastFailover: null,
  status: {
    primary: {
      api: true,
      db: true,
      web: true,
      lastCheck: null
    },
    standby: {
      api: true,
      db: true,
      web: true,
      lastCheck: null
    }
  }
};

// Load state if exists
if (fs.existsSync(config.stateFile)) {
  try {
    state = JSON.parse(fs.readFileSync(config.stateFile, 'utf8'));
    logger.info('Loaded failover state:', { state });
  } catch (error) {
    logger.error('Failed to load state file:', error);
  }
}

// Save state
function saveState() {
  try {
    fs.writeFileSync(config.stateFile, JSON.stringify(state, null, 2));
  } catch (error) {
    logger.error('Failed to save state file:', error);
  }
}

// Check server health
async function checkHealth(server) {
  const serverConfig = config[server];
  const serverState = state.status[server];
  
  try {
    // Check API health
    try {
      await axios.get(serverConfig.apiUrl, { timeout: 5000 });
      serverState.api = true;
    } catch (error) {
      logger.warn(`${server.toUpperCase()} API health check failed:`, error.message);
      serverState.api = false;
    }
    
    // Check Web health
    try {
      await axios.get(serverConfig.webUrl, { timeout: 5000 });
      serverState.web = true;
    } catch (error) {
      logger.warn(`${server.toUpperCase()} Web health check failed:`, error.message);
      serverState.web = false;
    }
    
    // Check DB health - using pg-ping or similar would be better, but this is a simplified example
    try {
      execSync(`pg_isready -h ${serverConfig.dbUrl.split('://')[1].split(':')[0]} -t 5`);
      serverState.db = true;
    } catch (error) {
      logger.warn(`${server.toUpperCase()} Database health check failed:`, error.message);
      serverState.db = false;
    }
    
    serverState.lastCheck = new Date().toISOString();
    
    // Update failure count
    if (!serverState.api || !serverState.web || !serverState.db) {
      state.failureCount[server]++;
      logger.warn(`${server.toUpperCase()} health check failure count: ${state.failureCount[server]}`);
    } else {
      state.failureCount[server] = 0;
    }
    
    saveState();
    return serverState.api && serverState.web && serverState.db;
  } catch (error) {
    logger.error(`Error checking ${server} health:`, error);
    state.failureCount[server]++;
    saveState();
    return false;
  }
}

// Perform failover
async function performFailover(from, to) {
  logger.warn(`INITIATING FAILOVER from ${from} to ${to}...`);
  
  try {
    // 1. Update HAProxy configuration to route traffic to the new server
    logger.info('Updating HAProxy configuration...');
    const backupHaproxyConfig = `${config.haproxyConfig}.bak`;
    fs.copyFileSync(config.haproxyConfig, backupHaproxyConfig);
    
    let haproxyContent = fs.readFileSync(config.haproxyConfig, 'utf8');
    
    // Simplified example - in production, use a more robust approach
    if (to === 'standby') {
      haproxyContent = haproxyContent.replace(/server primary.*? check/g, 'server primary primary:3000 check backup');
      haproxyContent = haproxyContent.replace(/server standby.*? check backup/g, 'server standby standby:3000 check');
    } else {
      haproxyContent = haproxyContent.replace(/server primary.*? check backup/g, 'server primary primary:3000 check');
      haproxyContent = haproxyContent.replace(/server standby.*? check/g, 'server standby standby:3000 check backup');
    }
    
    fs.writeFileSync(config.haproxyConfig, haproxyContent);
    
    // 2. Reload HAProxy
    logger.info('Reloading HAProxy...');
    execSync('systemctl reload haproxy');
    
    // 3. Update state
    state.activeServer = to;
    state.lastFailover = new Date().toISOString();
    state.failureCount[from] = 0;
    saveState();
    
    logger.info(`Failover to ${to} completed successfully`);
    return true;
  } catch (error) {
    logger.error('Failover failed:', error);
    return false;
  }
}

// Main execution
async function run() {
  logger.info('Starting Renexus Failover Manager');
  logger.info(`Mode: ${mode}, Target: ${target || 'auto'}`);
  
  // Manual failover
  if (mode === 'manual') {
    if (target === state.activeServer) {
      logger.info(`${target} is already the active server. No action needed.`);
      process.exit(0);
    }
    
    logger.info(`Initiating manual failover to ${target}`);
    const success = await performFailover(state.activeServer, target);
    
    if (success) {
      logger.info('Manual failover completed successfully');
      process.exit(0);
    } else {
      logger.error('Manual failover failed');
      process.exit(1);
    }
  }
  
  // Automatic failover
  logger.info('Starting automatic failover monitoring...');
  
  // Initial health check
  const primaryHealth = await checkHealth('primary');
  const standbyHealth = await checkHealth('standby');
  
  logger.info('Initial health status:', {
    primary: primaryHealth ? 'healthy' : 'unhealthy',
    standby: standbyHealth ? 'healthy' : 'unhealthy'
  });
  
  // Start monitoring loop for auto mode
  setInterval(async () => {
    const activeServer = state.activeServer;
    const passiveServer = activeServer === 'primary' ? 'standby' : 'primary';
    
    // Check active server health
    const activeHealth = await checkHealth(activeServer);
    
    // If active server is unhealthy and exceeds threshold
    if (!activeHealth && state.failureCount[activeServer] >= config.failoverThreshold) {
      // Check if passive server is healthy
      const passiveHealth = await checkHealth(passiveServer);
      
      if (passiveHealth) {
        logger.warn(`Active server (${activeServer}) exceeded failure threshold and passive server (${passiveServer}) is healthy`);
        await performFailover(activeServer, passiveServer);
      } else {
        logger.error('Both servers are unhealthy! Cannot perform failover.');
      }
    }
  }, config.healthCheckInterval);
}

// Run the script
run().catch(error => {
  logger.error('Unexpected error in failover script:', error);
  process.exit(1);
});

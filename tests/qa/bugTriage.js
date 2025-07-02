/**
 * Bug Triage and Management System for Renexus
 * Phase 5.2.1 - Bug Triage Process
 */
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  bugsDir: path.join(__dirname, 'bugs'),
  templateFile: path.join(__dirname, 'bug-template.md'),
  statuses: ['New', 'Triaged', 'In Progress', 'Fixed', 'Verified', 'Closed', 'Reopened'],
  priorities: ['P0 (Blocker)', 'P1 (Critical)', 'P2 (Major)', 'P3 (Minor)', 'P4 (Trivial)'],
  environments: ['Development', 'Testing', 'Staging', 'Production'],
  userImpacts: ['High', 'Medium', 'Low']
};

// Ensure bugs directory exists
if (!fs.existsSync(CONFIG.bugsDir)) {
  fs.mkdirSync(CONFIG.bugsDir, { recursive: true });
}

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper functions
function generateBugId() {
  const timestamp = Date.now().toString();
  const randomString = crypto.randomBytes(3).toString('hex');
  return `BUG-${timestamp.slice(-6)}-${randomString}`;
}

function formatDate(date = new Date()) {
  return date.toISOString().split('T')[0];
}

function saveToMarkdown(bugData) {
  // Read the template
  let template = fs.readFileSync(CONFIG.templateFile, 'utf8');
  
  // Replace placeholders with actual data
  Object.keys(bugData).forEach(key => {
    const placeholder = `\${${key}}`;
    template = template.replace(placeholder, bugData[key] || '');
  });
  
  // Save to file
  const filename = `${bugData.BUG_ID}.md`;
  const filePath = path.join(CONFIG.bugsDir, filename);
  fs.writeFileSync(filePath, template);
  
  return filePath;
}

// CLI commands
const commands = {
  // Create a new bug report
  async create() {
    const bugData = {
      BUG_ID: generateBugId(),
      STATUS: 'New',
      REPORT_DATE: formatDate()
    };
    
    console.log('\n--- Creating New Bug Report ---');
    
    bugData.TITLE = await askQuestion('Title: ');
    bugData.REPORTER = await askQuestion('Reporter: ');
    bugData.PRIORITY = await askFromList('Priority', CONFIG.priorities);
    bugData.ENVIRONMENT = await askFromList('Environment', CONFIG.environments);
    bugData.VERSION = await askQuestion('Version: ');
    bugData.DESCRIPTION = await askQuestion('Description (press Enter twice to finish):\n', true);
    
    // Steps to reproduce
    console.log('\nSteps to Reproduce (enter empty line to finish):');
    const steps = [];
    let stepCount = 1;
    let stepInput;
    
    while (true) {
      stepInput = await askQuestion(`Step ${stepCount}: `);
      if (!stepInput.trim()) break;
      steps.push(stepInput);
      stepCount++;
    }
    
    for (let i = 0; i < steps.length; i++) {
      bugData[`STEP_${i+1}`] = steps[i];
    }
    
    bugData.EXPECTED_BEHAVIOR = await askQuestion('Expected Behavior: ');
    bugData.ACTUAL_BEHAVIOR = await askQuestion('Actual Behavior: ');
    bugData.USER_IMPACT = await askFromList('User Impact', CONFIG.userImpacts);
    bugData.SCOPE = await askQuestion('Scope (e.g., "All users"): ');
    bugData.COMPONENT = await askQuestion('Component (e.g., "Authentication", "Dashboard"): ');
    bugData.BROWSER_DEVICE = await askQuestion('Browser/Device: ');
    bugData.OS = await askQuestion('Operating System: ');
    
    // Save the bug report
    const filePath = saveToMarkdown(bugData);
    console.log(`\nBug report created: ${filePath}`);
    
    return bugData.BUG_ID;
  },
  
  // List all bugs or filter by status/priority
  list(options = {}) {
    console.log('\n--- Bug List ---');
    const files = fs.readdirSync(CONFIG.bugsDir).filter(file => file.endsWith('.md'));
    
    if (files.length === 0) {
      console.log('No bugs found.');
      return;
    }
    
    const bugs = files.map(file => {
      const content = fs.readFileSync(path.join(CONFIG.bugsDir, file), 'utf8');
      const bugId = file.replace('.md', '');
      const title = content.match(/\*\*Title\*\*: (.*)/)?.[1] || 'Unknown';
      const status = content.match(/\*\*Status\*\*: (.*)/)?.[1] || 'Unknown';
      const priority = content.match(/\*\*Priority\*\*: (.*)/)?.[1] || 'Unknown';
      const assignee = content.match(/\*\*Assigned To\*\*: (.*)/)?.[1] || 'Unassigned';
      
      return { bugId, title, status, priority, assignee };
    });
    
    // Apply filters
    let filtered = bugs;
    if (options.status) {
      filtered = filtered.filter(bug => bug.status.includes(options.status));
    }
    if (options.priority) {
      filtered = filtered.filter(bug => bug.priority.includes(options.priority));
    }
    if (options.assignee) {
      filtered = filtered.filter(bug => bug.assignee.includes(options.assignee));
    }
    
    // Print bugs in table format
    console.log('\nBug ID         | Priority | Status     | Assignee       | Title');
    console.log('---------------|----------|------------|----------------|------------------');
    
    filtered.forEach(bug => {
      console.log(
        `${bug.bugId.padEnd(15)} | ${bug.priority.substring(0, 8).padEnd(8)} | ${bug.status.padEnd(10)} | ${bug.assignee.substring(0, 14).padEnd(14)} | ${bug.title.substring(0, 40)}`
      );
    });
    
    console.log(`\nTotal: ${filtered.length} bug(s)`);
  },
  
  // Show bug details
  view(bugId) {
    const bugFile = path.join(CONFIG.bugsDir, `${bugId}.md`);
    
    if (!fs.existsSync(bugFile)) {
      console.log(`Bug ${bugId} not found.`);
      return;
    }
    
    const content = fs.readFileSync(bugFile, 'utf8');
    console.log('\n--- Bug Details ---\n');
    console.log(content);
  },
  
  // Update bug status, priority, or assignee
  async update(bugId) {
    const bugFile = path.join(CONFIG.bugsDir, `${bugId}.md`);
    
    if (!fs.existsSync(bugFile)) {
      console.log(`Bug ${bugId} not found.`);
      return;
    }
    
    let content = fs.readFileSync(bugFile, 'utf8');
    console.log('\n--- Update Bug ---');
    
    const updateField = await askFromList('Field to update', [
      'Status',
      'Priority',
      'Assignee',
      'Add Root Cause Analysis',
      'Add Fix Details',
      'Verify Fix'
    ]);
    
    switch (updateField) {
      case 'Status':
        const newStatus = await askFromList('New Status', CONFIG.statuses);
        content = content.replace(/\*\*Status\*\*: .*/, `**Status**: ${newStatus}`);
        break;
        
      case 'Priority':
        const newPriority = await askFromList('New Priority', CONFIG.priorities);
        content = content.replace(/\*\*Priority\*\*: .*/, `**Priority**: ${newPriority}`);
        break;
        
      case 'Assignee':
        const newAssignee = await askQuestion('New Assignee: ');
        content = content.replace(/\*\*Assigned To\*\*: .*/, `**Assigned To**: ${newAssignee}`);
        break;
        
      case 'Add Root Cause Analysis':
        const rootCause = await askQuestion('Root Cause Analysis (press Enter twice to finish):\n', true);
        content = content.replace(/\${ROOT_CAUSE}/, rootCause);
        break;
        
      case 'Add Fix Details':
        const fixer = await askQuestion('Fixed By: ');
        const fixDate = formatDate();
        const prCommit = await askQuestion('PR/Commit: ');
        const fixDescription = await askQuestion('Fix Description (press Enter twice to finish):\n', true);
        
        content = content.replace(/\${FIXER}/, fixer);
        content = content.replace(/\${FIX_DATE}/, fixDate);
        content = content.replace(/\${PR_COMMIT}/, prCommit);
        content = content.replace(/\${FIX_DESCRIPTION}/, fixDescription);
        
        // Update status to Fixed if not already
        if (!content.includes('**Status**: Fixed')) {
          content = content.replace(/\*\*Status\*\*: .*/, '**Status**: Fixed');
        }
        break;
        
      case 'Verify Fix':
        const verifier = await askQuestion('Verified By: ');
        const verificationDate = formatDate();
        const testCases = await askQuestion('Test Cases Used: ');
        
        content = content.replace(/\${VERIFIER}/, verifier);
        content = content.replace(/\${VERIFICATION_DATE}/, verificationDate);
        content = content.replace(/\${TEST_CASES}/, testCases);
        
        // Update status to Verified if not already
        if (!content.includes('**Status**: Verified')) {
          content = content.replace(/\*\*Status\*\*: .*/, '**Status**: Verified');
        }
        break;
    }
    
    fs.writeFileSync(bugFile, content);
    console.log(`Bug ${bugId} updated successfully.`);
  },
  
  // Generate bug stats and report
  stats() {
    console.log('\n--- Bug Statistics ---');
    const files = fs.readdirSync(CONFIG.bugsDir).filter(file => file.endsWith('.md'));
    
    if (files.length === 0) {
      console.log('No bugs found.');
      return;
    }
    
    const bugs = files.map(file => {
      const content = fs.readFileSync(path.join(CONFIG.bugsDir, file), 'utf8');
      const status = content.match(/\*\*Status\*\*: (.*)/)?.[1] || 'Unknown';
      const priority = content.match(/\*\*Priority\*\*: (.*)/)?.[1] || 'Unknown';
      const environment = content.match(/\*\*Environment\*\*: (.*)/)?.[1] || 'Unknown';
      const component = content.match(/\*\*Component\*\*: (.*)/)?.[1] || 'Unknown';
      
      return { status, priority, environment, component };
    });
    
    // Stats by status
    console.log('\nBugs by Status:');
    const statusStats = {};
    bugs.forEach(bug => {
      statusStats[bug.status] = (statusStats[bug.status] || 0) + 1;
    });
    
    Object.keys(statusStats).forEach(status => {
      console.log(`${status}: ${statusStats[status]}`);
    });
    
    // Stats by priority
    console.log('\nBugs by Priority:');
    const priorityStats = {};
    bugs.forEach(bug => {
      priorityStats[bug.priority] = (priorityStats[bug.priority] || 0) + 1;
    });
    
    Object.keys(priorityStats).forEach(priority => {
      console.log(`${priority}: ${priorityStats[priority]}`);
    });
    
    // Stats by environment
    console.log('\nBugs by Environment:');
    const envStats = {};
    bugs.forEach(bug => {
      envStats[bug.environment] = (envStats[bug.environment] || 0) + 1;
    });
    
    Object.keys(envStats).forEach(env => {
      console.log(`${env}: ${envStats[env]}`);
    });
    
    // Stats by component
    console.log('\nBugs by Component:');
    const componentStats = {};
    bugs.forEach(bug => {
      componentStats[bug.component] = (componentStats[bug.component] || 0) + 1;
    });
    
    Object.keys(componentStats).forEach(component => {
      console.log(`${component}: ${componentStats[component]}`);
    });
    
    console.log(`\nTotal: ${bugs.length} bug(s)`);
  },
  
  // Export bugs to CSV
  export() {
    console.log('\n--- Exporting Bugs to CSV ---');
    const files = fs.readdirSync(CONFIG.bugsDir).filter(file => file.endsWith('.md'));
    
    if (files.length === 0) {
      console.log('No bugs found.');
      return;
    }
    
    const bugs = files.map(file => {
      const content = fs.readFileSync(path.join(CONFIG.bugsDir, file), 'utf8');
      const bugId = file.replace('.md', '');
      const title = content.match(/\*\*Title\*\*: (.*)/)?.[1] || '';
      const status = content.match(/\*\*Status\*\*: (.*)/)?.[1] || '';
      const priority = content.match(/\*\*Priority\*\*: (.*)/)?.[1] || '';
      const reporter = content.match(/\*\*Reported By\*\*: (.*)/)?.[1] || '';
      const reportDate = content.match(/\*\*Reported On\*\*: (.*)/)?.[1] || '';
      const assignee = content.match(/\*\*Assigned To\*\*: (.*)/)?.[1] || '';
      const environment = content.match(/\*\*Environment\*\*: (.*)/)?.[1] || '';
      const component = content.match(/\*\*Component\*\*: (.*)/)?.[1] || '';
      
      return {
        bugId,
        title,
        status,
        priority,
        reporter,
        reportDate,
        assignee,
        environment,
        component
      };
    });
    
    // Create CSV
    const csvHeader = 'Bug ID,Title,Status,Priority,Reporter,Report Date,Assignee,Environment,Component';
    const csvRows = bugs.map(bug => {
      return `${bug.bugId},"${bug.title.replace(/"/g, '""')}",${bug.status},${bug.priority},${bug.reporter},${bug.reportDate},${bug.assignee},${bug.environment},${bug.component}`;
    });
    
    const csv = [csvHeader, ...csvRows].join('\n');
    const exportPath = path.join(__dirname, 'bug_export.csv');
    fs.writeFileSync(exportPath, csv);
    
    console.log(`Bugs exported to: ${exportPath}`);
  }
};

// Helper for asking questions
function askQuestion(question, multiline = false) {
  return new Promise(resolve => {
    if (!multiline) {
      rl.question(question, answer => {
        resolve(answer);
      });
    } else {
      console.log(question);
      const lines = [];
      
      rl.on('line', line => {
        if (line === '' && lines.length > 0) {
          rl.removeAllListeners('line');
          resolve(lines.join('\n'));
        } else {
          lines.push(line);
        }
      });
    }
  });
}

// Helper for asking from a list
function askFromList(label, options) {
  return new Promise(resolve => {
    console.log(`\n${label} options:`);
    options.forEach((option, index) => {
      console.log(`${index + 1}. ${option}`);
    });
    
    rl.question(`\nSelect ${label} (1-${options.length}): `, answer => {
      const index = parseInt(answer) - 1;
      if (index >= 0 && index < options.length) {
        resolve(options[index]);
      } else {
        console.log('Invalid selection. Using default.');
        resolve(options[0]);
      }
    });
  });
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command) {
    showHelp();
    rl.close();
    return;
  }
  
  try {
    switch (command) {
      case 'create':
        await commands.create();
        break;
        
      case 'list':
        const listOptions = {};
        if (args[1] === '--status' && args[2]) listOptions.status = args[2];
        if (args[1] === '--priority' && args[2]) listOptions.priority = args[2];
        if (args[1] === '--assignee' && args[2]) listOptions.assignee = args[2];
        commands.list(listOptions);
        break;
        
      case 'view':
        if (!args[1]) {
          console.log('Error: Bug ID required.');
          showHelp();
          break;
        }
        commands.view(args[1]);
        break;
        
      case 'update':
        if (!args[1]) {
          console.log('Error: Bug ID required.');
          showHelp();
          break;
        }
        await commands.update(args[1]);
        break;
        
      case 'stats':
        commands.stats();
        break;
        
      case 'export':
        commands.export();
        break;
        
      default:
        console.log(`Unknown command: ${command}`);
        showHelp();
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  rl.close();
}

function showHelp() {
  console.log(`
Renexus Bug Triage System - Usage:

  node bugTriage.js create               - Create a new bug report
  node bugTriage.js list                 - List all bugs
  node bugTriage.js list --status [status]    - List bugs by status
  node bugTriage.js list --priority [priority] - List bugs by priority
  node bugTriage.js list --assignee [name]    - List bugs by assignee
  node bugTriage.js view [bugId]         - View bug details
  node bugTriage.js update [bugId]       - Update bug information
  node bugTriage.js stats                - Show bug statistics
  node bugTriage.js export               - Export bugs to CSV
  `);
}

// Run the script
main();

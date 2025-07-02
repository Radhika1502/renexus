/**
 * Test Report Generator for Renexus Pipeline
 * Phase 5.1.4 - Automated Testing Pipeline
 */
const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

// Create test report directory if it doesn't exist
const reportDir = path.join(__dirname, '..', '..', 'test-report');
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

// Function to parse JUnit XML reports
async function parseJunitReport(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`Warning: File does not exist: ${filePath}`);
    return null;
  }

  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(data);
    return result;
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error);
    return null;
  }
}

// Function to generate HTML report
async function generateReport() {
  console.log('Generating consolidated test report...');
  
  // Collect results from different test types
  const unitTestReport = await parseJunitReport(path.join(__dirname, '..', '..', 'test-results', 'unit-test-results', 'junit.xml'));
  const integrationTestReport = await parseJunitReport(path.join(__dirname, '..', '..', 'test-results', 'integration-test-results', 'junit.xml'));
  
  // Read coverage data
  let coverageData = { total: { statements: { pct: 0 }, branches: { pct: 0 }, functions: { pct: 0 }, lines: { pct: 0 } } };
  try {
    const coverageJsonPath = path.join(__dirname, '..', '..', '.nyc_output', 'coverage-summary.json');
    if (fs.existsSync(coverageJsonPath)) {
      coverageData = JSON.parse(fs.readFileSync(coverageJsonPath, 'utf8'));
    }
  } catch (error) {
    console.warn('Warning: Could not read coverage data:', error.message);
  }

  // Process test results
  const testResults = {
    unit: processTestSuite(unitTestReport),
    integration: processTestSuite(integrationTestReport),
    coverage: {
      statements: coverageData.total.statements.pct.toFixed(2),
      branches: coverageData.total.branches.pct.toFixed(2),
      functions: coverageData.total.functions.pct.toFixed(2),
      lines: coverageData.total.lines.pct.toFixed(2),
    }
  };

  // Generate HTML report
  const htmlReport = generateHtmlReport(testResults);
  fs.writeFileSync(path.join(reportDir, 'index.html'), htmlReport);
  
  // Generate Markdown summary for PR comments
  const mdSummary = generateMarkdownSummary(testResults);
  fs.writeFileSync(path.join(reportDir, 'summary.md'), mdSummary);

  console.log('Test report generated successfully!');
}

// Process test suite data from JUnit XML
function processTestSuite(report) {
  if (!report || !report.testsuites) {
    return { tests: 0, failures: 0, errors: 0, skipped: 0, time: 0, suites: [] };
  }
  
  const suites = Array.isArray(report.testsuites.testsuite) 
    ? report.testsuites.testsuite 
    : [report.testsuites.testsuite];
    
  const result = {
    tests: parseInt(report.testsuites.$.tests || 0),
    failures: parseInt(report.testsuites.$.failures || 0),
    errors: parseInt(report.testsuites.$.errors || 0),
    skipped: parseInt(report.testsuites.$.skipped || 0),
    time: parseFloat(report.testsuites.$.time || 0).toFixed(2),
    suites: []
  };
  
  // Process individual suites
  for (const suite of suites) {
    result.suites.push({
      name: suite.$.name,
      tests: parseInt(suite.$.tests || 0),
      failures: parseInt(suite.$.failures || 0),
      errors: parseInt(suite.$.errors || 0),
      skipped: parseInt(suite.$.skipped || 0),
      time: parseFloat(suite.$.time || 0).toFixed(2)
    });
  }
  
  return result;
}

// Generate HTML report
function generateHtmlReport(results) {
  const totalTests = (results.unit?.tests || 0) + (results.integration?.tests || 0);
  const totalFailures = (results.unit?.failures || 0) + (results.integration?.failures || 0);
  const totalErrors = (results.unit?.errors || 0) + (results.integration?.errors || 0);
  const totalSkipped = (results.unit?.skipped || 0) + (results.integration?.skipped || 0);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Renexus Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
    h1, h2, h3 { color: #2c3e50; }
    .container { max-width: 1200px; margin: 0 auto; }
    .summary { display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 30px; }
    .summary-card { background: #f8f9fa; border-radius: 8px; padding: 15px; flex: 1; min-width: 200px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .summary-card h3 { margin-top: 0; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 14px; font-weight: bold; }
    .badge-success { background: #d4edda; color: #155724; }
    .badge-warning { background: #fff3cd; color: #856404; }
    .badge-danger { background: #f8d7da; color: #721c24; }
    .badge-info { background: #d1ecf1; color: #0c5460; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f8f9fa; }
    tr:hover { background-color: #f1f1f1; }
    .progress-container { height: 20px; background-color: #e9ecef; border-radius: 10px; margin-bottom: 10px; overflow: hidden; }
    .progress-bar { height: 100%; color: white; text-align: center; line-height: 20px; font-size: 12px; transition: width 0.5s; }
    .bg-success { background-color: #28a745; }
    .bg-warning { background-color: #ffc107; }
    .bg-danger { background-color: #dc3545; }
    footer { margin-top: 30px; text-align: center; color: #6c757d; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Renexus Test Report</h1>
    <p>Generated on ${new Date().toLocaleString()}</p>
    
    <div class="summary">
      <div class="summary-card">
        <h3>Test Results</h3>
        <p>Total Tests: <strong>${totalTests}</strong></p>
        <p>Passed: <span class="badge badge-success">${totalTests - totalFailures - totalErrors - totalSkipped}</span></p>
        <p>Failed: <span class="badge badge-danger">${totalFailures}</span></p>
        <p>Errors: <span class="badge badge-danger">${totalErrors}</span></p>
        <p>Skipped: <span class="badge badge-warning">${totalSkipped}</span></p>
      </div>
      
      <div class="summary-card">
        <h3>Coverage</h3>
        <p>Statements: 
          <div class="progress-container">
            <div class="progress-bar ${getCoverageBadgeClass(results.coverage.statements)}" 
                 style="width: ${results.coverage.statements}%">
              ${results.coverage.statements}%
            </div>
          </div>
        </p>
        <p>Branches: 
          <div class="progress-container">
            <div class="progress-bar ${getCoverageBadgeClass(results.coverage.branches)}" 
                 style="width: ${results.coverage.branches}%">
              ${results.coverage.branches}%
            </div>
          </div>
        </p>
        <p>Functions: 
          <div class="progress-container">
            <div class="progress-bar ${getCoverageBadgeClass(results.coverage.functions)}" 
                 style="width: ${results.coverage.functions}%">
              ${results.coverage.functions}%
            </div>
          </div>
        </p>
        <p>Lines: 
          <div class="progress-container">
            <div class="progress-bar ${getCoverageBadgeClass(results.coverage.lines)}" 
                 style="width: ${results.coverage.lines}%">
              ${results.coverage.lines}%
            </div>
          </div>
        </p>
      </div>
    </div>
    
    <h2>Unit Tests</h2>
    ${renderTestSuiteTable(results.unit)}
    
    <h2>Integration Tests</h2>
    ${renderTestSuiteTable(results.integration)}
    
    <footer>
      <p>Renexus Testing Pipeline &copy; ${new Date().getFullYear()}</p>
    </footer>
  </div>
</body>
</html>`;
}

// Generate Markdown summary for PR comments
function generateMarkdownSummary(results) {
  const totalTests = (results.unit?.tests || 0) + (results.integration?.tests || 0);
  const totalFailures = (results.unit?.failures || 0) + (results.integration?.failures || 0);
  const totalErrors = (results.unit?.errors || 0) + (results.integration?.errors || 0);
  const totalPassed = totalTests - totalFailures - totalErrors - (results.unit?.skipped || 0) - (results.integration?.skipped || 0);
  
  let status = '✅ All tests passed';
  if (totalFailures > 0 || totalErrors > 0) {
    status = '❌ Some tests failed';
  }
  
  return `## Test Results Summary - ${status}

### Overall Stats
- **Total Tests**: ${totalTests}
- **Passed**: ${totalPassed} (${((totalPassed / totalTests) * 100).toFixed(2)}%)
- **Failed**: ${totalFailures}
- **Errors**: ${totalErrors}

### Coverage
- **Statements**: ${results.coverage.statements}%
- **Branches**: ${results.coverage.branches}%
- **Functions**: ${results.coverage.functions}%
- **Lines**: ${results.coverage.lines}%

### Unit Tests
- **Tests**: ${results.unit?.tests || 0}
- **Failures**: ${results.unit?.failures || 0}
- **Time**: ${results.unit?.time || 0}s

### Integration Tests
- **Tests**: ${results.integration?.tests || 0}
- **Failures**: ${results.integration?.failures || 0}
- **Time**: ${results.integration?.time || 0}s

${totalFailures > 0 || totalErrors > 0 ? '⚠️ Please check the build logs for more details on failing tests.' : ''}
`;
}

// Helper functions
function renderTestSuiteTable(suite) {
  if (!suite || !suite.suites || suite.suites.length === 0) {
    return '<p>No test results available.</p>';
  }
  
  return `
  <table>
    <thead>
      <tr>
        <th>Test Suite</th>
        <th>Tests</th>
        <th>Passed</th>
        <th>Failed</th>
        <th>Skipped</th>
        <th>Time (s)</th>
      </tr>
    </thead>
    <tbody>
      ${suite.suites.map(s => `
        <tr>
          <td>${s.name}</td>
          <td>${s.tests}</td>
          <td><span class="badge badge-success">${s.tests - s.failures - s.errors - s.skipped}</span></td>
          <td>
            ${s.failures > 0 || s.errors > 0 ? 
              `<span class="badge badge-danger">${s.failures + s.errors}</span>` : 
              `<span class="badge badge-success">0</span>`}
          </td>
          <td>
            ${s.skipped > 0 ? 
              `<span class="badge badge-warning">${s.skipped}</span>` : 
              `<span class="badge badge-info">0</span>`}
          </td>
          <td>${s.time}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>`;
}

function getCoverageBadgeClass(value) {
  const coverage = parseFloat(value);
  if (coverage >= 80) return 'bg-success';
  if (coverage >= 60) return 'bg-warning';
  return 'bg-danger';
}

// Run the report generator
generateReport().catch(error => {
  console.error('Error generating report:', error);
  process.exit(1);
});

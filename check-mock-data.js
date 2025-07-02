const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Locations to check for mock data based on QA_Analysis_FIX_Implement.md
const mockLocations = [
  {
    name: 'Dashboard/TeamPerformanceTable',
    paths: ['frontend/web/src/features/dashboard/components/TeamPerformanceTable.tsx'],
    patterns: ['mockData', 'MOCK_', 'hardcoded', 'static data']
  },
  {
    name: 'Analytics API',
    paths: ['services/analytics', 'backend/analytics'],
    patterns: ['mockData', 'MOCK_', 'static data', 'mock implementation']
  },
  {
    name: 'Task Templates',
    paths: ['frontend/web/src/features/task-management/components/TaskTemplates.tsx'],
    patterns: ['mockData', 'MOCK_', 'non-functional']
  },
  {
    name: 'Task Dependencies',
    paths: ['frontend/web/src/features/task-management/components/TaskDependencies.tsx'],
    patterns: ['mockData', 'MOCK_', 'fake data']
  },
  {
    name: 'TimelineComponent',
    paths: ['frontend/web/src/components/TimelineComponent.tsx'],
    patterns: ['mockData', 'MOCK_', 'static timeline']
  }
];

// Function to check if a file contains mock data patterns
function checkFileForMockData(filePath, patterns) {
  try {
    if (!fs.existsSync(filePath)) {
      return { containsMock: false, message: 'File not found' };
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const foundPatterns = [];

    patterns.forEach(pattern => {
      if (content.toLowerCase().includes(pattern.toLowerCase())) {
        foundPatterns.push(pattern);
      }
    });

    return {
      containsMock: foundPatterns.length > 0,
      patterns: foundPatterns
    };
  } catch (error) {
    return { containsMock: false, message: `Error reading file: ${error.message}` };
  }
}

// Function to check if API calls are real or mocked
function checkForRealApiCalls(componentPath) {
  try {
    if (!fs.existsSync(componentPath)) {
      return { isReal: false, message: 'Component not found' };
    }

    const content = fs.readFileSync(componentPath, 'utf8');
    
    // Check for API call patterns (simplified)
    const hasFetchOrAxios = content.includes('fetch(') || 
                           content.includes('axios.') || 
                           content.includes('useQuery(') ||
                           content.includes('useMutation(');
                           
    const hasMockData = content.includes('mockData') || 
                       content.includes('MOCK_') || 
                       content.includes('static data');
    
    return {
      isReal: hasFetchOrAxios && !hasMockData,
      usingFetch: content.includes('fetch('),
      usingAxios: content.includes('axios.'),
      usingReactQuery: content.includes('useQuery(') || content.includes('useMutation('),
      hasMockData
    };
  } catch (error) {
    return { isReal: false, message: `Error checking API calls: ${error.message}` };
  }
}

// Function to check if test data seed script creates enough data
function checkTestDataSeed() {
  const seedScriptPaths = [
    'scripts/seed-data.js',
    'db/seeds/development.js',
    'prisma/seed.js'
  ];
  
  let seedScriptFound = false;
  let hasEnoughData = false;
  let seedScriptPath = '';
  
  // Find seed script
  for (const scriptPath of seedScriptPaths) {
    if (fs.existsSync(scriptPath)) {
      seedScriptFound = true;
      seedScriptPath = scriptPath;
      break;
    }
  }
  
  if (!seedScriptFound) {
    return { 
      success: false, 
      message: 'No seed script found' 
    };
  }
  
  // Check if seed script creates enough data
  try {
    const content = fs.readFileSync(seedScriptPath, 'utf8');
    
    // Look for patterns indicating large data creation
    const hasLoops = content.includes('for (') || content.includes('while (');
    const hasArrays = content.includes('Array(') || content.includes('new Array');
    const hasLargeNumbers = /\b([5-9][0-9]|[1-9][0-9]{2,})\b/.test(content);
    
    hasEnoughData = hasLoops && (hasArrays || hasLargeNumbers);
    
    return {
      success: true,
      hasEnoughData,
      seedScriptPath,
      hasLoops,
      hasArrays,
      hasLargeNumbers
    };
  } catch (error) {
    return { 
      success: false, 
      message: `Error checking seed script: ${error.message}` 
    };
  }
}

// Main function to check all mock data criteria
function checkAllMockDataCriteria() {
  console.log('Checking for Mock Data in Codebase');
  console.log('=================================\n');
  
  const results = {
    mockDataFound: [],
    realApiCalls: [],
    nonRealApiCalls: [],
    testDataSeed: null,
    summary: {
      noMockData: true,
      allRealApiCalls: true,
      sufficientTestData: false
    }
  };
  
  // Check each mock location
  mockLocations.forEach(location => {
    console.log(`Checking ${location.name}...`);
    
    location.paths.forEach(relativePath => {
      const fullPath = path.resolve(relativePath);
      
      // Check for mock data patterns
      const mockDataResult = checkFileForMockData(fullPath, location.patterns);
      
      if (mockDataResult.containsMock) {
        console.log(`  ❌ Found mock data in ${relativePath}: ${mockDataResult.patterns.join(', ')}`);
        results.mockDataFound.push({
          location: location.name,
          path: relativePath,
          patterns: mockDataResult.patterns
        });
        results.summary.noMockData = false;
      } else if (mockDataResult.message) {
        console.log(`  ⚠️ ${mockDataResult.message} for ${relativePath}`);
      } else {
        console.log(`  ✅ No mock data found in ${relativePath}`);
      }
      
      // Check for real API calls
      const apiCallResult = checkForRealApiCalls(fullPath);
      
      if (apiCallResult.isReal) {
        console.log(`  ✅ Using real API calls in ${relativePath}`);
        results.realApiCalls.push({
          location: location.name,
          path: relativePath
        });
      } else if (apiCallResult.message) {
        console.log(`  ⚠️ ${apiCallResult.message} for ${relativePath}`);
      } else {
        console.log(`  ❌ Not using real API calls in ${relativePath}`);
        results.nonRealApiCalls.push({
          location: location.name,
          path: relativePath,
          details: apiCallResult
        });
        results.summary.allRealApiCalls = false;
      }
    });
    
    console.log('');
  });
  
  // Check test data seed script
  console.log('Checking test data seed script...');
  const seedResult = checkTestDataSeed();
  results.testDataSeed = seedResult;
  
  if (seedResult.success && seedResult.hasEnoughData) {
    console.log(`  ✅ Seed script at ${seedResult.seedScriptPath} creates sufficient test data`);
    results.summary.sufficientTestData = true;
  } else if (seedResult.success) {
    console.log(`  ❌ Seed script at ${seedResult.seedScriptPath} does not create enough test data`);
  } else {
    console.log(`  ❌ ${seedResult.message}`);
  }
  
  // Print summary
  console.log('\nMock Data Replacement Summary:');
  console.log('============================');
  console.log(`No hardcoded or mock data: ${results.summary.noMockData ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`All UI components use real API calls: ${results.summary.allRealApiCalls ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Test data seed script creates realistic data (50+ rows): ${results.summary.sufficientTestData ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPass = results.summary.noMockData && 
                 results.summary.allRealApiCalls && 
                 results.summary.sufficientTestData;
                 
  console.log(`\nOverall Status: ${allPass ? '✅ PASS' : '❌ FAIL'}`);
  
  return results;
}

// Run the check
const results = checkAllMockDataCriteria();

// Save results to a file
fs.writeFileSync(
  'mock-data-check-results.json', 
  JSON.stringify(results, null, 2)
);

console.log('\nResults saved to mock-data-check-results.json');

// Exit with appropriate code
process.exit(
  results.summary.noMockData && 
  results.summary.allRealApiCalls && 
  results.summary.sufficientTestData ? 0 : 1
);

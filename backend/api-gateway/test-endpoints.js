const http = require('http');

const endpoints = [
  '/dashboard/summary',
  '/dashboard/tasks/status',
  '/dashboard/teams/performance',
  '/dashboard/timeline',
  '/dashboard/projects',
  '/dashboard/activity',
];

function testEndpoint(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: endpoint,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            endpoint,
            status: res.statusCode,
            data: parsed,
          });
        } catch (e) {
          resolve({
            endpoint,
            status: res.statusCode,
            error: 'Invalid JSON response',
            raw: data,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject({ endpoint, error: error.message });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject({ endpoint, error: 'Request timeout' });
    });

    req.end();
  });
}

async function testAllEndpoints() {
  console.log('🧪 Testing API Gateway endpoints...\n');

  for (const endpoint of endpoints) {
    try {
      const result = await testEndpoint(endpoint);
      if (result.status === 200) {
        console.log(`✅ ${endpoint} - Status: ${result.status}`);
        if (result.data) {
          console.log(`   Data keys: ${Object.keys(result.data).join(', ')}`);
          if (Array.isArray(result.data)) {
            console.log(`   Array length: ${result.data.length}`);
          }
        }
      } else {
        console.log(`❌ ${endpoint} - Status: ${result.status}`);
        if (result.error) {
          console.log(`   Error: ${result.error}`);
        }
      }
    } catch (error) {
      console.log(`❌ ${endpoint} - Error: ${error.error}`);
    }
    console.log('');
  }
}

// Wait for server to start
setTimeout(() => {
  testAllEndpoints().catch(console.error);
}, 3000); 
import * as k6 from 'k6';
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Ramp up to 20 users over 30 seconds
    { duration: '1m', target: 20 },  // Stay at 20 users for 1 minute
    { duration: '30s', target: 0 },  // Ramp down to 0 users over 30 seconds
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95% of requests should be below 200ms
    http_req_failed: ['rate<0.01'],   // Less than 1% of requests should fail
  },
};

// Simulate user session
export default function() {
  // Login
  const loginRes = http.post('http://localhost:3000/api/auth/login', {
    email: 'test@example.com',
    password: 'password123',
  });
  
  check(loginRes, {
    'login successful': (r) => r.status === 200,
    'login response time < 200ms': (r) => r.timings.duration < 200,
  });
  
  const authToken = loginRes.json('token');
  const params = {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  };
  
  // Get projects (read operation)
  const projectsRes = http.get('http://localhost:3000/api/projects', params);
  
  check(projectsRes, {
    'projects retrieved successfully': (r) => r.status === 200,
    'projects response time < 200ms': (r) => r.timings.duration < 200,
  });
  
  // Get a specific project
  const projectId = projectsRes.json('data[0].id');
  const projectRes = http.get(`http://localhost:3000/api/projects/${projectId}`, params);
  
  check(projectRes, {
    'project retrieved successfully': (r) => r.status === 200,
    'project response time < 150ms': (r) => r.timings.duration < 150,
  });
  
  // Get tasks for a project
  const tasksRes = http.get(`http://localhost:3000/api/projects/${projectId}/tasks`, params);
  
  check(tasksRes, {
    'tasks retrieved successfully': (r) => r.status === 200,
    'tasks response time < 200ms': (r) => r.timings.duration < 200,
  });
  
  // Get workflow suggestions (complex operation)
  const suggestionsRes = http.get(`http://localhost:3000/api/projects/${projectId}/suggestions`, params);
  
  check(suggestionsRes, {
    'suggestions retrieved successfully': (r) => r.status === 200,
    'suggestions response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  // Create a new task (write operation)
  const createTaskRes = http.post(`http://localhost:3000/api/projects/${projectId}/tasks`, JSON.stringify({
    title: `Performance Test Task ${Date.now()}`,
    description: 'Task created during performance testing',
    status: 'TODO',
  }), params);
  
  check(createTaskRes, {
    'task created successfully': (r) => r.status === 201,
    'task creation response time < 300ms': (r) => r.timings.duration < 300,
  });
  
  // Get analytics (complex operation with aggregation)
  const analyticsRes = http.get(`http://localhost:3000/api/projects/${projectId}/analytics/completion-trends`, params);
  
  check(analyticsRes, {
    'analytics retrieved successfully': (r) => r.status === 200,
    'analytics response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  sleep(1);
}

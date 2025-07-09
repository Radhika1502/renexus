import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 4001;

// Middleware
app.use(cors());
app.use(express.json());

// Mock data
const users = [
  { id: 1, username: 'john.doe', email: 'john@example.com', role: 'admin' },
  { id: 2, username: 'jane.smith', email: 'jane@example.com', role: 'user' }
];

app.get('/health', (_req, res) => {
  res.json({ status: 'healthy' });
});

// Mock authentication endpoints
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  // Simple mock authentication
  const user = users.find(u => u.username === username);
  if (user) {
    res.json({
      token: 'mock_jwt_token',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { username, email, password } = req.body;
  
  // Simple mock registration
  const newUser = {
    id: users.length + 1,
    username,
    email,
    role: 'user'
  };
  
  users.push(newUser);
  res.status(201).json({
    message: 'User registered successfully',
    user: newUser
  });
});

app.get('/api/auth/me', (_req, res) => {
  // Mock authenticated user
  res.json({
    id: 1,
    username: 'john.doe',
    email: 'john@example.com',
    role: 'admin'
  });
});

app.listen(port, () => {
  console.log(`Auth service running on port ${port}`);
}); 
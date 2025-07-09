import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 4003;

// Middleware
app.use(cors());
app.use(express.json());

// Mock data
const notifications = [
  { id: 1, userId: 1, message: 'New task assigned', read: false },
  { id: 2, userId: 2, message: 'Task status updated', read: true }
];

app.get('/health', (_req, res) => {
  res.json({ status: 'healthy' });
});

// Notification endpoints
app.get('/api/notifications', (req, res) => {
  const userId = parseInt(req.query.userId as string);
  const userNotifications = notifications.filter(n => n.userId === userId);
  res.json(userNotifications);
});

app.post('/api/notifications', (req, res) => {
  const { userId, message } = req.body;
  const newNotification = {
    id: notifications.length + 1,
    userId,
    message,
    read: false
  };
  notifications.push(newNotification);
  res.status(201).json(newNotification);
});

app.patch('/api/notifications/:id/read', (req, res) => {
  const notification = notifications.find(n => n.id === parseInt(req.params.id));
  if (notification) {
    notification.read = true;
    res.json(notification);
  } else {
    res.status(404).json({ message: 'Notification not found' });
  }
});

app.listen(port, () => {
  console.log(`Notification service running on port ${port}`);
}); 
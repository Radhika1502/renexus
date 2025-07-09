import { app } from './app';

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`Task service listening on port ${PORT}`);
}); 
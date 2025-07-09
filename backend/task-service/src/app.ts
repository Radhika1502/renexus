import express from 'express';
import cors from 'cors';
import { json } from 'body-parser';
import { taskRouter } from './routes/task';
import { errorHandler } from './middleware/error';

const app = express();

app.use(cors());
app.use(json());

app.use('/tasks', taskRouter);

app.use(errorHandler);

export { app }; 
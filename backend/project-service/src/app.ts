import express from 'express';
import cors from 'cors';
import { json } from 'body-parser';
import { projectRouter } from './routes/project';
import { templateRouter } from './routes/template';
import { errorHandler } from './middleware/error';

const app = express();

app.use(cors());
app.use(json());

// Mount template routes before project routes to ensure they are matched first
app.use('/projects/templates', templateRouter);
app.use('/projects', projectRouter);

app.use(errorHandler);

export { app }; 
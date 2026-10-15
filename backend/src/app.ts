import express from 'express';
import cors from 'cors';
import { errorHandler } from './http';
import { schoolsRouter } from './routes/schools';
import { teachersRouter } from './routes/teachers';
import { subjectsRouter } from './routes/subjects';
import { classesRouter } from './routes/classes';
import { schedulesRouter } from './routes/schedules';

/** Monta o app Express (sem chamar `listen`, para facilitar testes). */
export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '5mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/api', schoolsRouter, teachersRouter, subjectsRouter, classesRouter, schedulesRouter);

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Rota não encontrada.' });
  });
  app.use(errorHandler);

  return app;
}

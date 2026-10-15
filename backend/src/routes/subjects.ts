import { Router } from 'express';
import { prisma } from '../db';
import { texto } from '../http';

export const subjectsRouter = Router();

subjectsRouter.post('/schools/:schoolId/subjects', async (req, res) => {
  const subject = await prisma.subject.create({
    data: {
      name: texto(req.body.name, 'nome'),
      sigla: texto(req.body.sigla, 'sigla').toUpperCase(),
      schoolId: req.params.schoolId,
    },
  });
  res.json(subject);
});

subjectsRouter.get('/schools/:schoolId/subjects', async (req, res) => {
  const subjects = await prisma.subject.findMany({
    where: { schoolId: req.params.schoolId },
    include: { teachers: { orderBy: { name: 'asc' } } },
    orderBy: { name: 'asc' },
  });
  res.json(subjects);
});

subjectsRouter.put('/subjects/:subjectId', async (req, res) => {
  const subject = await prisma.subject.update({
    where: { id: req.params.subjectId },
    data: { name: texto(req.body.name, 'nome'), sigla: texto(req.body.sigla, 'sigla').toUpperCase() },
  });
  res.json(subject);
});

subjectsRouter.delete('/subjects/:subjectId', async (req, res) => {
  await prisma.subject.delete({ where: { id: req.params.subjectId } });
  res.json({ success: true });
});

import { Router } from 'express';
import { prisma } from '../db';
import { restricoesJson, texto } from '../http';

export const teachersRouter = Router();

teachersRouter.post('/schools/:schoolId/teachers', async (req, res) => {
  const teacher = await prisma.teacher.create({
    data: {
      name: texto(req.body.name, 'nome'),
      schoolId: req.params.schoolId,
      restrictions: restricoesJson(req.body.restrictions),
    },
  });
  res.json(teacher);
});

teachersRouter.get('/schools/:schoolId/teachers', async (req, res) => {
  const teachers = await prisma.teacher.findMany({
    where: { schoolId: req.params.schoolId },
    include: { subjects: { orderBy: { name: 'asc' } }, classes: { select: { aulas: true } } },
    orderBy: { name: 'asc' },
  });
  res.json(teachers.map(({ classes, ...t }) => ({ ...t, totalAulas: classes.reduce((s, c) => s + c.aulas, 0) })));
});

teachersRouter.put('/teachers/:teacherId', async (req, res) => {
  const teacher = await prisma.teacher.update({
    where: { id: req.params.teacherId },
    data: { name: texto(req.body.name, 'nome') },
  });
  res.json(teacher);
});

teachersRouter.put('/teachers/:teacherId/restrictions', async (req, res) => {
  const teacher = await prisma.teacher.update({
    where: { id: req.params.teacherId },
    data: { restrictions: restricoesJson(req.body.restrictions) },
  });
  res.json(teacher);
});

teachersRouter.delete('/teachers/:teacherId', async (req, res) => {
  await prisma.teacher.delete({ where: { id: req.params.teacherId } });
  res.json({ success: true });
});

// --- Vínculo professor <-> disciplina ---
teachersRouter.post('/teachers/:teacherId/subjects/:subjectId', async (req, res) => {
  const teacher = await prisma.teacher.update({
    where: { id: req.params.teacherId },
    data: { subjects: { connect: { id: req.params.subjectId } } },
  });
  res.json(teacher);
});

teachersRouter.delete('/teachers/:teacherId/subjects/:subjectId', async (req, res) => {
  const teacher = await prisma.teacher.update({
    where: { id: req.params.teacherId },
    data: { subjects: { disconnect: { id: req.params.subjectId } } },
  });
  res.json(teacher);
});

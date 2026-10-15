import { Router } from 'express';
import { prisma } from '../db';
import { HttpError, quantidadeAulas, texto } from '../http';

export const classesRouter = Router();

// --- Turmas ---
classesRouter.post('/schools/:schoolId/classes', async (req, res) => {
  const cls = await prisma.class.create({
    data: { name: texto(req.body.name, 'nome'), schoolId: req.params.schoolId },
  });
  res.json(cls);
});

classesRouter.get('/schools/:schoolId/classes', async (req, res) => {
  const classes = await prisma.class.findMany({ where: { schoolId: req.params.schoolId }, orderBy: { name: 'asc' } });
  res.json(classes);
});

classesRouter.put('/classes/:classId', async (req, res) => {
  const cls = await prisma.class.update({
    where: { id: req.params.classId },
    data: { name: texto(req.body.name, 'nome') },
  });
  res.json(cls);
});

classesRouter.delete('/classes/:classId', async (req, res) => {
  await prisma.class.delete({ where: { id: req.params.classId } });
  res.json({ success: true });
});

// --- Atribuições de aulas (professor + disciplina + turma + quantidade) ---
classesRouter.post('/schools/:schoolId/lessons', async (req, res) => {
  const { schoolId } = req.params;
  const { teacherId, classId, subjectId } = req.body;
  const aulas = quantidadeAulas(req.body.aulas);

  const [teacher, cls, subject] = await Promise.all([
    prisma.teacher.findFirst({ where: { id: teacherId, schoolId } }),
    prisma.class.findFirst({ where: { id: classId, schoolId } }),
    prisma.subject.findFirst({ where: { id: subjectId, schoolId } }),
  ]);
  if (!teacher || !cls || !subject) throw new HttpError(400, 'Professor, turma ou disciplina inválidos para esta escola.');

  // Mesma combinação já existe? Soma as aulas em vez de duplicar.
  const existente = await prisma.teacherClassSubject.findFirst({ where: { teacherId, classId, subjectId } });
  const lesson = existente
    ? await prisma.teacherClassSubject.update({ where: { id: existente.id }, data: { aulas: existente.aulas + aulas } })
    : await prisma.teacherClassSubject.create({ data: { teacherId, classId, subjectId, aulas } });

  // Mantém o vínculo professor <-> disciplina coerente com as atribuições.
  await prisma.teacher.update({ where: { id: teacherId }, data: { subjects: { connect: { id: subjectId } } } });
  res.json(lesson);
});

classesRouter.get('/schools/:schoolId/lessons', async (req, res) => {
  const lessons = await prisma.teacherClassSubject.findMany({
    where: { teacher: { schoolId: req.params.schoolId } },
    include: { teacher: true, subject: true, class: true },
    orderBy: { subject: { name: 'asc' } },
  });
  res.json(lessons);
});

classesRouter.put('/lessons/:id', async (req, res) => {
  const lesson = await prisma.teacherClassSubject.update({
    where: { id: req.params.id },
    data: { aulas: quantidadeAulas(req.body.aulas) },
  });
  res.json(lesson);
});

classesRouter.delete('/lessons/:id', async (req, res) => {
  await prisma.teacherClassSubject.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

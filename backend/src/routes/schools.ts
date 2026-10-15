import { Router } from 'express';
import { prisma } from '../db';
import { HttpError, horariosDaEscola, listaHorarios, texto } from '../http';

export const schoolsRouter = Router();

const contagens = { _count: { select: { teachers: true, classes: true, subjects: true, schedules: true } } };

schoolsRouter.post('/schools', async (req, res) => {
  const school = await prisma.school.create({ data: { name: texto(req.body.name, 'nome') }, include: contagens });
  res.json({ ...school, horarios: horariosDaEscola(school.horarios) });
});

schoolsRouter.get('/schools', async (_req, res) => {
  const schools = await prisma.school.findMany({ orderBy: { createdAt: 'asc' }, include: contagens });
  res.json(schools.map(s => ({ ...s, horarios: horariosDaEscola(s.horarios) })));
});

schoolsRouter.get('/schools/:id', async (req, res) => {
  const school = await prisma.school.findUnique({ where: { id: req.params.id }, include: contagens });
  if (!school) throw new HttpError(404, 'Escola não encontrada.');

  // Total de aulas semanais cadastradas (soma das atribuições), útil para o painel.
  const { _sum } = await prisma.teacherClassSubject.aggregate({
    where: { class: { schoolId: school.id } },
    _sum: { aulas: true },
  });
  res.json({ ...school, horarios: horariosDaEscola(school.horarios), totalAulas: _sum.aulas ?? 0 });
});

schoolsRouter.put('/schools/:id', async (req, res) => {
  const data: { name?: string; horarios?: string } = {};
  if (req.body.name !== undefined) data.name = texto(req.body.name, 'nome');
  if (req.body.horarios !== undefined) {
    const horarios = listaHorarios(req.body.horarios);
    if (!horarios) throw new HttpError(400, 'Horários inválidos.');
    data.horarios = JSON.stringify(horarios);
  }
  const school = await prisma.school.update({ where: { id: req.params.id }, data });
  res.json({ ...school, horarios: horariosDaEscola(school.horarios) });
});

schoolsRouter.delete('/schools/:id', async (req, res) => {
  await prisma.school.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

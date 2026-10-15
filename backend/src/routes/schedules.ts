import { Router } from 'express';
import multer from 'multer';
import { prisma } from '../db';
import { GradeImpossivelError, resolverGrade } from '../generator';
import { processAiImport } from '../ai';
import { carregarMaterias } from '../school-data';
import { DEFAULT_HORARIOS, HttpError, listaHorarios, texto } from '../http';

export const schedulesRouter = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// --- Gerar grade ---
schedulesRouter.post('/schools/:schoolId/generate', async (req, res) => {
  const { schoolId } = req.params;
  const horarios = listaHorarios(req.body.horarios) ?? DEFAULT_HORARIOS;

  // Lembra os horários usados para a próxima vez (e para a tela de restrições).
  await prisma.school.update({ where: { id: schoolId }, data: { horarios: JSON.stringify(horarios) } });

  const materias = await carregarMaterias(prisma, schoolId);
  try {
    const resultado = await resolverGrade(materias, horarios);
    res.json({ ...resultado, horarios });
  } catch (error) {
    if (error instanceof GradeImpossivelError) {
      res.status(422).json({ error: 'Não é possível montar a grade com os dados atuais.', problemas: error.problemas });
      return;
    }
    throw error;
  }
});

// --- Grades salvas (histórico) ---
schedulesRouter.post('/schools/:schoolId/schedules', async (req, res) => {
  const data = typeof req.body.data === 'string' ? req.body.data : JSON.stringify(req.body.data);
  if (!data) throw new HttpError(400, 'Grade vazia.');
  const schedule = await prisma.schedule.create({
    data: { name: texto(req.body.name, 'nome'), schoolId: req.params.schoolId, data },
  });
  res.json(schedule);
});

schedulesRouter.get('/schools/:schoolId/schedules', async (req, res) => {
  const schedules = await prisma.schedule.findMany({
    where: { schoolId: req.params.schoolId },
    orderBy: { createdAt: 'desc' },
  });
  res.json(schedules);
});

schedulesRouter.put('/schedules/:id', async (req, res) => {
  const schedule = await prisma.schedule.update({
    where: { id: req.params.id },
    data: { name: texto(req.body.name, 'nome') },
  });
  res.json(schedule);
});

schedulesRouter.delete('/schedules/:id', async (req, res) => {
  await prisma.schedule.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// --- Importação mágica com IA ---
schedulesRouter.post('/schools/:schoolId/ai-import', upload.single('image'), async (req, res) => {
  const { provider, token, text } = req.body;
  if (!token) throw new HttpError(400, 'Configure sua API Key nas configurações primeiro.');
  try {
    const resumo = await processAiImport(String(req.params.schoolId), provider, token, text, req.file?.buffer, req.file?.mimetype);
    res.json({ success: true, ...resumo });
  } catch (error: any) {
    console.error('AI Import Error:', error);
    throw new HttpError(400, error?.message || 'Falha ao processar com IA');
  }
});

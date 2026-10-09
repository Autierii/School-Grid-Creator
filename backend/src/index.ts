import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import { GradeImpossivelError, resolverGrade } from './generator';
import { processAiImport } from './ai';
import { carregarMaterias, parseRestricoes } from './school-data';
import { prisma } from './db';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const texto = (valor: unknown, campo: string) => {
  const s = typeof valor === 'string' ? valor.trim() : '';
  if (!s) throw new HttpError(400, `O campo "${campo}" é obrigatório.`);
  return s;
};

const restricoesJson = (valor: unknown) => {
  const lista = typeof valor === 'string' ? parseRestricoes(valor) : Array.isArray(valor) ? valor : [];
  return JSON.stringify(lista.map((r: any) => ({ dia: String(r.dia), hora: String(r.hora).trim() })));
};

const DEFAULT_HORARIOS = ["7h", "8h", "9h", "10h", "11h"];

const horariosDaEscola = (raw: string | null) => {
  try {
    const lista = JSON.parse(raw || '');
    if (Array.isArray(lista) && lista.length > 0) return lista.map(String);
  } catch { /* usa o padrão */ }
  return DEFAULT_HORARIOS;
};

// --- SCHOOLS ---
app.post('/api/schools', async (req, res) => {
  const school = await prisma.school.create({ data: { name: texto(req.body.name, 'nome') } });
  res.json(school);
});

app.get('/api/schools', async (_req, res) => {
  const schools = await prisma.school.findMany({
    orderBy: { createdAt: 'asc' },
    include: { _count: { select: { teachers: true, classes: true, subjects: true, schedules: true } } },
  });
  res.json(schools);
});

app.get('/api/schools/:id', async (req, res) => {
  const school = await prisma.school.findUnique({ where: { id: req.params.id } });
  if (!school) throw new HttpError(404, 'Escola não encontrada.');
  res.json({ ...school, horarios: horariosDaEscola(school.horarios) });
});

app.put('/api/schools/:id', async (req, res) => {
  const data: { name?: string; horarios?: string } = {};
  if (req.body.name !== undefined) data.name = texto(req.body.name, 'nome');
  if (req.body.horarios !== undefined) {
    if (!Array.isArray(req.body.horarios)) throw new HttpError(400, 'Horários inválidos.');
    data.horarios = JSON.stringify(req.body.horarios.map((h: unknown) => String(h).trim()).filter(Boolean));
  }
  const school = await prisma.school.update({ where: { id: req.params.id }, data });
  res.json({ ...school, horarios: horariosDaEscola(school.horarios) });
});

app.delete('/api/schools/:id', async (req, res) => {
  await prisma.school.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// --- TEACHERS ---
app.post('/api/schools/:schoolId/teachers', async (req, res) => {
  const teacher = await prisma.teacher.create({
    data: {
      name: texto(req.body.name, 'nome'),
      schoolId: req.params.schoolId,
      restrictions: restricoesJson(req.body.restrictions),
    },
  });
  res.json(teacher);
});

app.get('/api/schools/:schoolId/teachers', async (req, res) => {
  const teachers = await prisma.teacher.findMany({
    where: { schoolId: req.params.schoolId },
    include: { subjects: true, classes: { select: { aulas: true } } },
    orderBy: { name: 'asc' },
  });
  res.json(teachers.map(({ classes, ...t }) => ({ ...t, totalAulas: classes.reduce((s, c) => s + c.aulas, 0) })));
});

app.put('/api/teachers/:teacherId', async (req, res) => {
  const teacher = await prisma.teacher.update({
    where: { id: req.params.teacherId },
    data: { name: texto(req.body.name, 'nome') },
  });
  res.json(teacher);
});

app.put('/api/teachers/:teacherId/restrictions', async (req, res) => {
  const teacher = await prisma.teacher.update({
    where: { id: req.params.teacherId },
    data: { restrictions: restricoesJson(req.body.restrictions) },
  });
  res.json(teacher);
});

app.delete('/api/teachers/:teacherId', async (req, res) => {
  await prisma.teacher.delete({ where: { id: req.params.teacherId } });
  res.json({ success: true });
});

// --- SUBJECTS ---
app.post('/api/schools/:schoolId/subjects', async (req, res) => {
  const subject = await prisma.subject.create({
    data: {
      name: texto(req.body.name, 'nome'),
      sigla: texto(req.body.sigla, 'sigla').toUpperCase(),
      schoolId: req.params.schoolId,
    },
  });
  res.json(subject);
});

app.get('/api/schools/:schoolId/subjects', async (req, res) => {
  const subjects = await prisma.subject.findMany({
    where: { schoolId: req.params.schoolId },
    include: { teachers: true },
    orderBy: { name: 'asc' },
  });
  res.json(subjects);
});

app.put('/api/subjects/:subjectId', async (req, res) => {
  const subject = await prisma.subject.update({
    where: { id: req.params.subjectId },
    data: { name: texto(req.body.name, 'nome'), sigla: texto(req.body.sigla, 'sigla').toUpperCase() },
  });
  res.json(subject);
});

app.delete('/api/subjects/:subjectId', async (req, res) => {
  await prisma.subject.delete({ where: { id: req.params.subjectId } });
  res.json({ success: true });
});

// --- TEACHER <-> SUBJECT RELATION ---
app.post('/api/teachers/:teacherId/subjects/:subjectId', async (req, res) => {
  const teacher = await prisma.teacher.update({
    where: { id: req.params.teacherId },
    data: { subjects: { connect: { id: req.params.subjectId } } },
  });
  res.json(teacher);
});

app.delete('/api/teachers/:teacherId/subjects/:subjectId', async (req, res) => {
  const teacher = await prisma.teacher.update({
    where: { id: req.params.teacherId },
    data: { subjects: { disconnect: { id: req.params.subjectId } } },
  });
  res.json(teacher);
});

// --- CLASSES ---
app.post('/api/schools/:schoolId/classes', async (req, res) => {
  const cls = await prisma.class.create({
    data: { name: texto(req.body.name, 'nome'), schoolId: req.params.schoolId },
  });
  res.json(cls);
});

app.get('/api/schools/:schoolId/classes', async (req, res) => {
  const classes = await prisma.class.findMany({ where: { schoolId: req.params.schoolId }, orderBy: { name: 'asc' } });
  res.json(classes);
});

app.put('/api/classes/:classId', async (req, res) => {
  const cls = await prisma.class.update({
    where: { id: req.params.classId },
    data: { name: texto(req.body.name, 'nome') },
  });
  res.json(cls);
});

app.delete('/api/classes/:classId', async (req, res) => {
  await prisma.class.delete({ where: { id: req.params.classId } });
  res.json({ success: true });
});

// --- TEACHER_CLASS_SUBJECT (Lessons) ---
app.post('/api/schools/:schoolId/lessons', async (req, res) => {
  const { schoolId } = req.params;
  const { teacherId, classId, subjectId } = req.body;
  const aulas = Number(req.body.aulas);
  if (!Number.isInteger(aulas) || aulas < 1) throw new HttpError(400, 'A quantidade de aulas deve ser um número inteiro maior que zero.');

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

app.get('/api/schools/:schoolId/lessons', async (req, res) => {
  const lessons = await prisma.teacherClassSubject.findMany({
    where: { teacher: { schoolId: req.params.schoolId } },
    include: { teacher: true, subject: true, class: true },
  });
  res.json(lessons);
});

app.put('/api/lessons/:id', async (req, res) => {
  const aulas = Number(req.body.aulas);
  if (!Number.isInteger(aulas) || aulas < 1) throw new HttpError(400, 'A quantidade de aulas deve ser um número inteiro maior que zero.');
  const lesson = await prisma.teacherClassSubject.update({ where: { id: req.params.id }, data: { aulas } });
  res.json(lesson);
});

app.delete('/api/lessons/:id', async (req, res) => {
  await prisma.teacherClassSubject.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// --- GENERATE ---
app.post('/api/schools/:schoolId/generate', async (req, res) => {
  const { schoolId } = req.params;
  const horarios: string[] = Array.isArray(req.body.horarios)
    ? req.body.horarios.map((h: unknown) => String(h).trim()).filter(Boolean)
    : DEFAULT_HORARIOS;

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

// --- SCHEDULES (Saved Grids) ---
app.post('/api/schools/:schoolId/schedules', async (req, res) => {
  const data = typeof req.body.data === 'string' ? req.body.data : JSON.stringify(req.body.data);
  if (!data) throw new HttpError(400, 'Grade vazia.');
  const schedule = await prisma.schedule.create({
    data: { name: texto(req.body.name, 'nome'), schoolId: req.params.schoolId, data },
  });
  res.json(schedule);
});

app.get('/api/schools/:schoolId/schedules', async (req, res) => {
  const schedules = await prisma.schedule.findMany({
    where: { schoolId: req.params.schoolId },
    orderBy: { createdAt: 'desc' },
  });
  res.json(schedules);
});

app.put('/api/schedules/:id', async (req, res) => {
  const schedule = await prisma.schedule.update({
    where: { id: req.params.id },
    data: { name: texto(req.body.name, 'nome') },
  });
  res.json(schedule);
});

app.delete('/api/schedules/:id', async (req, res) => {
  await prisma.schedule.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// --- AI IMPORT ---
app.post('/api/schools/:schoolId/ai-import', upload.single('image'), async (req, res) => {
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

// --- ERROS ---
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
  } else if (err?.code === 'P2025') {
    res.status(404).json({ error: 'Registro não encontrado.' });
  } else if (err?.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({ error: 'Imagem muito grande (máximo 10 MB).' });
  } else {
    console.error(err);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

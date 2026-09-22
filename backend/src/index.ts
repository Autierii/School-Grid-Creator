import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- SCHOOLS ---
app.post('/api/schools', async (req, res) => {
  const { name } = req.body;
  try {
    const school = await prisma.school.create({ data: { name } });
    res.json(school);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create school' });
  }
});

app.get('/api/schools', async (req, res) => {
  const schools = await prisma.school.findMany();
  res.json(schools);
});

// --- TEACHERS ---
app.post('/api/schools/:schoolId/teachers', async (req, res) => {
  const { schoolId } = req.params;
  const { name, restrictions } = req.body;
  try {
    const teacher = await prisma.teacher.create({
      data: { name, schoolId, restrictions },
    });
    res.json(teacher);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create teacher' });
  }
});

app.get('/api/schools/:schoolId/teachers', async (req, res) => {
  const { schoolId } = req.params;
  const teachers = await prisma.teacher.findMany({ where: { schoolId } });
  res.json(teachers);
});

// --- SUBJECTS ---
app.post('/api/schools/:schoolId/subjects', async (req, res) => {
  const { schoolId } = req.params;
  const { name, sigla } = req.body;
  try {
    const subject = await prisma.subject.create({
      data: { name, sigla, schoolId },
    });
    res.json(subject);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create subject' });
  }
});

app.get('/api/schools/:schoolId/subjects', async (req, res) => {
  const { schoolId } = req.params;
  const subjects = await prisma.subject.findMany({ where: { schoolId } });
  res.json(subjects);
});

// --- CLASSES ---
app.post('/api/schools/:schoolId/classes', async (req, res) => {
  const { schoolId } = req.params;
  const { name } = req.body;
  try {
    const cls = await prisma.class.create({
      data: { name, schoolId },
    });
    res.json(cls);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create class' });
  }
});

app.get('/api/schools/:schoolId/classes', async (req, res) => {
  const { schoolId } = req.params;
  const classes = await prisma.class.findMany({ where: { schoolId } });
  res.json(classes);
});

// --- TEACHER_CLASS_SUBJECT (Lessons) ---
app.post('/api/schools/:schoolId/lessons', async (req, res) => {
  const { teacherId, classId, subjectId, aulas } = req.body;
  try {
    const lesson = await prisma.teacherClassSubject.create({
      data: { teacherId, classId, subjectId, aulas },
    });
    res.json(lesson);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create lesson' });
  }
});

app.get('/api/schools/:schoolId/lessons', async (req, res) => {
  const { schoolId } = req.params;
  // Get all lessons for this school's teachers
  const lessons = await prisma.teacherClassSubject.findMany({
    where: { teacher: { schoolId } },
    include: { teacher: true, subject: true, class: true },
  });
  res.json(lessons);
});

app.delete('/api/lessons/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.teacherClassSubject.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: 'Failed to delete lesson' });
  }
});

import { resolverGrade } from './generator';

// --- GENERATE ---
app.post('/api/schools/:schoolId/generate', async (req, res) => {
  const { schoolId } = req.params;
  const { horarios } = req.body; // array of strings, e.g. ["7h", "8h", "9h"]

  try {
    const dbSubjects = await prisma.subject.findMany({
      where: { schoolId },
      include: {
        classes: {
          include: {
            teacher: true,
            class: true
          }
        }
      }
    });

    const materiasFormatadas = dbSubjects.map(sub => {
      // Group classes by teacher
      const teachersMap: any = {};
      sub.classes.forEach(c => {
        const tId = c.teacherId;
        if (!teachersMap[tId]) {
          teachersMap[tId] = {
            id: c.teacher.id,
            nome: c.teacher.name,
            indisponibilidades: c.teacher.restrictions ? JSON.parse(c.teacher.restrictions) : [],
            turmas: []
          };
        }
        teachersMap[tId].turmas.push({
          id: c.class.id,
          nome: c.class.name,
          aulas: c.aulas
        });
      });

      return {
        id: sub.id,
        sigla: sub.sigla,
        professores: Object.values(teachersMap)
      };
    });

    const result = await resolverGrade(materiasFormatadas, horarios || ["7h", "8h", "9h", "10h", "11h"]);
    res.json({ grade: result });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to generate schedule' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

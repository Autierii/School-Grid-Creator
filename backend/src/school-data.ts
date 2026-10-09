import { PrismaClient } from '@prisma/client';
import { Indisponibilidade, MateriaReq, ProfessorReq } from './generator';

export function parseRestricoes(raw: string | null | undefined): Indisponibilidade[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(r => r && typeof r.dia === 'string' && r.hora != null) : [];
  } catch {
    return [];
  }
}

// Converte os dados da escola no formato esperado pelo gerador de grade.
export async function carregarMaterias(prisma: PrismaClient, schoolId: string): Promise<MateriaReq[]> {
  const subjects = await prisma.subject.findMany({
    where: { schoolId },
    include: { classes: { include: { teacher: true, class: true } } },
  });

  return subjects.map(sub => {
    const professores = new Map<string, ProfessorReq>();
    for (const lesson of sub.classes) {
      let prof = professores.get(lesson.teacherId);
      if (!prof) {
        prof = {
          id: lesson.teacher.id,
          nome: lesson.teacher.name,
          indisponibilidades: parseRestricoes(lesson.teacher.restrictions),
          turmas: [],
        };
        professores.set(lesson.teacherId, prof);
      }
      prof.turmas.push({ id: lesson.class.id, nome: lesson.class.name, aulas: lesson.aulas });
    }
    return { id: sub.id, sigla: sub.sigla, professores: [...professores.values()] };
  });
}

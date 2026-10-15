/**
 * Cria uma escola de exemplo realista (8 turmas, 17 professores, 10 disciplinas,
 * dezenas de restrições) e roda o gerador para conferir que ela tem solução.
 *
 *   npm run seed
 *
 * Pode ser executado várias vezes: a escola de exemplo anterior é substituída.
 */
import { PrismaClient } from '@prisma/client';
import { DIAS, Indisponibilidade, resolverGrade } from '../src/generator';
import { carregarMaterias } from '../src/school-data';

const prisma = new PrismaClient();

const NOME_ESCOLA = 'Escola Exemplo (Turno Manhã)';

const HORARIOS = [
  '7h - 7h45',
  '7h45 - 8h30',
  '8h50 - 9h35',
  '9h35 - 10h20',
  '10h20 - 11h05',
  '11h05 - 11h50',
];
const [A1, A2, A3, A4, A5, A6] = HORARIOS;

const DISCIPLINAS = [
  { name: 'Português', sigla: 'PORT' },
  { name: 'Matemática', sigla: 'MAT' },
  { name: 'Inglês', sigla: 'ING' },
  { name: 'História', sigla: 'HIST' },
  { name: 'Geografia', sigla: 'GEO' },
  { name: 'Ciências', sigla: 'CIE' },
  { name: 'Artes', sigla: 'ART' },
  { name: 'Educação Física', sigla: 'EF' },
  { name: 'Informática', sigla: 'INF' },
  { name: 'Leitura', sigla: 'LEI' },
];

type Atribuicao = [professor: string, sigla: string, aulas: number];

// Disciplinas comuns a todas as turmas
const COMUNS: Atribuicao[] = [
  ['Juliana S', 'ART', 2],
  ['Rafael', 'EF', 3],
  ['Marcos', 'INF', 1],
  ['Raimundo', 'LEI', 1],
];

const TURMAS: Record<string, Atribuicao[]> = {
  '6A': [['Juliana', 'PORT', 5], ['Dani', 'MAT', 5], ['Elisangela', 'ING', 2], ['Mikhail', 'HIST', 4], ['Ana Paula', 'GEO', 3], ['Aparecida', 'CIE', 4]],
  '6B': [['Juliana', 'PORT', 5], ['Dani', 'MAT', 5], ['Elisangela', 'ING', 2], ['Cida', 'HIST', 4], ['Ana Paula', 'GEO', 3], ['Aparecida', 'CIE', 4]],
  '7A': [['Denise', 'PORT', 5], ['Dani', 'MAT', 5], ['Andreia', 'ING', 2], ['Mikhail', 'HIST', 4], ['Ana Paula', 'GEO', 3], ['Aline', 'CIE', 4]],
  '7B': [['Denise', 'PORT', 5], ['Eliane', 'MAT', 5], ['Andreia', 'ING', 2], ['Mikhail', 'HIST', 4], ['Ana Paula', 'GEO', 3], ['Aline', 'CIE', 4]],
  '8A': [['Juliana', 'PORT', 5], ['Eliane', 'MAT', 5], ['Andreia', 'ING', 2], ['Mikhail', 'HIST', 3], ['Ana Paula', 'GEO', 4], ['Aline', 'CIE', 4]],
  '8B': [['Denise', 'PORT', 5], ['Eliane', 'MAT', 5], ['Andreia', 'ING', 2], ['Mikhail', 'HIST', 3], ['Ana Paula', 'GEO', 4], ['Aline', 'CIE', 4]],
  '9A': [['Juliana', 'PORT', 5], ['Dan', 'MAT', 5], ['Andreia', 'ING', 2], ['Mikhail', 'HIST', 3], ['Ana Paula', 'GEO', 4], ['Aline', 'CIE', 4]],
  '9B': [['Juliana', 'PORT', 5], ['Dani', 'MAT', 5], ['Andreia', 'ING', 2], ['Mikhail', 'HIST', 3], ['Robson', 'GEO', 4], ['Aline', 'CIE', 4]],
};

/** Bloqueia os horários informados em cada um dos dias. */
const bloquear = (dias: string[], horas: string[]): Indisponibilidade[] =>
  dias.flatMap(dia => horas.map(hora => ({ dia, hora })));

const [SEG, TER, QUA, QUI, SEX] = DIAS;

const RESTRICOES: Record<string, Indisponibilidade[]> = {
  'Juliana': [...bloquear([SEG, TER], [A5, A6]), ...bloquear([QUI], [A1])],
  'Denise': [...bloquear([SEG, TER, QUA], [A1, A2, A3]), ...bloquear([QUA], [A4]), ...bloquear([SEG, TER], [A5, A6])],
  'Dani': bloquear([SEG, QUA], [A5, A6]),
  'Eliane': bloquear([SEX], [A5, A6]),
  'Andreia': bloquear([QUA, QUI], [A6]),
  'Elisangela': [...bloquear(DIAS, [A1, A2, A3, A4]), ...bloquear([SEX], [A5, A6])],
  'Cida': bloquear(DIAS, [A1, A2, A3]),
  'Mikhail': bloquear([TER], [A1, A2]),
  'Ana Paula': [...bloquear([SEG], [A1]), ...bloquear([SEX], [A6])],
  'Robson': bloquear([TER, QUI], [A1]),
  'Aline': bloquear([SEG, QUA], [A1]),
  'Aparecida': bloquear([SEX], [A5, A6]),
  'Juliana S': [...bloquear([TER, QUA], [A1, A2, A3, A4]), ...bloquear([SEG, TER, QUA], [A5, A6])],
  'Rafael': [...bloquear([SEG, TER], [A5, A6]), ...bloquear([QUA], [A6])],
  'Marcos': [...bloquear([QUA, QUI, SEX], [A1, A2, A3, A4]), ...bloquear(DIAS, [A5, A6])],
  'Raimundo': [...bloquear([QUA, QUI, SEX], [A1, A2, A3, A4]), ...bloquear(DIAS, [A5, A6])],
};

async function main() {
  const antigas = await prisma.school.deleteMany({ where: { name: NOME_ESCOLA } });
  if (antigas.count > 0) console.log(`🧹 Escola de exemplo anterior removida.`);

  const school = await prisma.school.create({ data: { name: NOME_ESCOLA, horarios: JSON.stringify(HORARIOS) } });
  console.log(`🏫 Escola criada: ${school.name}`);

  const disciplinas = new Map<string, string>();
  for (const d of DISCIPLINAS) {
    const subject = await prisma.subject.create({ data: { ...d, schoolId: school.id } });
    disciplinas.set(d.sigla, subject.id);
  }

  const atribuicoes = Object.entries(TURMAS).flatMap(([turma, lista]) =>
    [...lista, ...COMUNS].map(([prof, sigla, aulas]) => ({ turma, prof, sigla, aulas })));

  const professores = new Map<string, string>();
  for (const nome of new Set(atribuicoes.map(a => a.prof))) {
    const teacher = await prisma.teacher.create({
      data: { name: nome, schoolId: school.id, restrictions: JSON.stringify(RESTRICOES[nome] ?? []) },
    });
    professores.set(nome, teacher.id);
  }

  const turmas = new Map<string, string>();
  for (const nome of Object.keys(TURMAS)) {
    const cls = await prisma.class.create({ data: { name: nome, schoolId: school.id } });
    turmas.set(nome, cls.id);
  }

  for (const a of atribuicoes) {
    const teacherId = professores.get(a.prof)!;
    const subjectId = disciplinas.get(a.sigla)!;
    await prisma.teacherClassSubject.create({ data: { teacherId, subjectId, classId: turmas.get(a.turma)!, aulas: a.aulas } });
    await prisma.teacher.update({ where: { id: teacherId }, data: { subjects: { connect: { id: subjectId } } } });
  }
  console.log(`👩‍🏫 ${professores.size} professores, ${disciplinas.size} disciplinas, ${turmas.size} turmas, ${atribuicoes.length} atribuições.`);

  console.log('🧠 Testando o gerador...');
  const resultado = await resolverGrade(await carregarMaterias(prisma, school.id), HORARIOS);
  if (resultado.completa) {
    console.log(`✅ Grade sem conflitos encontrada em ${resultado.tempoMs} ms.`);
  } else {
    console.log(`⚠️  Grade gerada com conflitos:\n- ${resultado.conflitos.join('\n- ')}`);
  }
}

main()
  .catch(err => {
    console.error('❌ Falha no seed:', err.message ?? err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

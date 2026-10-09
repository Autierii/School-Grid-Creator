import { PrismaClient } from '@prisma/client';
import { resolverGrade } from './src/generator';
import { carregarMaterias } from './src/school-data';
import * as fs from 'fs';

const prisma = new PrismaClient();

const HORARIOS = [
  "7h - 7h45min",
  "7h45min - 8h30min",
  "8h50min - 9:35h",
  "9h35min - 10h20min",
  "10h20min - 11h05min",
  "11h05min - 11h50min"
];

// Mapeamento de aulas
const AULA_1 = HORARIOS[0];
const AULA_2 = HORARIOS[1];
const AULA_3 = HORARIOS[2];
const AULA_4 = HORARIOS[3];
const AULA_5 = HORARIOS[4];
const AULA_6 = HORARIOS[5];

const TURMAS = ["6A", "6B", "7A", "7B", "8A", "8B", "9A", "9B"];

const DISCIPLINAS = [
  { name: "Português", sigla: "Port" },
  { name: "Matemática", sigla: "Mat" },
  { name: "Inglês", sigla: "Ing" },
  { name: "História", sigla: "Hist" },
  { name: "Geografia", sigla: "Geo" },
  { name: "Ciências", sigla: "Cie" },
  { name: "Artes", sigla: "Art" },
  { name: "Educação Física", sigla: "EF" },
  { name: "Informática", sigla: "Inf" },
  { name: "Leitura", sigla: "Lei" },
];

const PROFESSORES_AULAS: any = {
  "6A": {
    "Juliana": { mat: "Port", aulas: 5 },
    "Dani": { mat: "Mat", aulas: 5 },
    "Elisangela": { mat: "Ing", aulas: 2 },
    "Mikhail": { mat: "Hist", aulas: 4 },
    "Ana Paula": { mat: "Geo", aulas: 3 },
    "Aparecida": { mat: "Cie", aulas: 4 },
    "Juliana S": { mat: "Art", aulas: 2 },
    "Rafael": { mat: "EF", aulas: 3 },
    "Marcos": { mat: "Inf", aulas: 1 },
    "Raimundo": { mat: "Lei", aulas: 1 },
  },
  "6B": {
    "Juliana": { mat: "Port", aulas: 5 },
    "Dani": { mat: "Mat", aulas: 5 },
    "Elisangela": { mat: "Ing", aulas: 2 },
    "Cida": { mat: "Hist", aulas: 4 },
    "Ana Paula": { mat: "Geo", aulas: 3 },
    "Aparecida": { mat: "Cie", aulas: 4 },
    "Juliana S": { mat: "Art", aulas: 2 },
    "Rafael": { mat: "EF", aulas: 3 },
    "Marcos": { mat: "Inf", aulas: 1 },
    "Raimundo": { mat: "Lei", aulas: 1 },
  },
  "7A": {
    "Denise": { mat: "Port", aulas: 5 },
    "Dani": { mat: "Mat", aulas: 5 },
    "Andreia": { mat: "Ing", aulas: 2 },
    "Mikhail": { mat: "Hist", aulas: 4 },
    "Ana Paula": { mat: "Geo", aulas: 3 },
    "Aline": { mat: "Cie", aulas: 4 },
    "Juliana S": { mat: "Art", aulas: 2 },
    "Rafael": { mat: "EF", aulas: 3 },
    "Marcos": { mat: "Inf", aulas: 1 },
    "Raimundo": { mat: "Lei", aulas: 1 },
  },
  "7B": {
    "Denise": { mat: "Port", aulas: 5 },
    "Eliane": { mat: "Mat", aulas: 5 },
    "Andreia": { mat: "Ing", aulas: 2 },
    "Mikhail": { mat: "Hist", aulas: 4 },
    "Ana Paula": { mat: "Geo", aulas: 3 },
    "Aline": { mat: "Cie", aulas: 4 },
    "Juliana S": { mat: "Art", aulas: 2 },
    "Rafael": { mat: "EF", aulas: 3 },
    "Marcos": { mat: "Inf", aulas: 1 },
    "Raimundo": { mat: "Lei", aulas: 1 },
  },
  "8A": {
    "Juliana": { mat: "Port", aulas: 5 },
    "Eliane": { mat: "Mat", aulas: 5 },
    "Andreia": { mat: "Ing", aulas: 2 },
    "Mikhail": { mat: "Hist", aulas: 3 },
    "Ana Paula": { mat: "Geo", aulas: 4 },
    "Aline": { mat: "Cie", aulas: 4 },
    "Juliana S": { mat: "Art", aulas: 2 },
    "Rafael": { mat: "EF", aulas: 3 },
    "Marcos": { mat: "Inf", aulas: 1 },
    "Raimundo": { mat: "Lei", aulas: 1 },
  },
  "8B": {
    "Denise": { mat: "Port", aulas: 5 },
    "Eliane": { mat: "Mat", aulas: 5 },
    "Andreia": { mat: "Ing", aulas: 2 },
    "Mikhail": { mat: "Hist", aulas: 3 },
    "Ana Paula": { mat: "Geo", aulas: 4 },
    "Aline": { mat: "Cie", aulas: 4 },
    "Juliana S": { mat: "Art", aulas: 2 },
    "Rafael": { mat: "EF", aulas: 3 },
    "Marcos": { mat: "Inf", aulas: 1 },
    "Raimundo": { mat: "Lei", aulas: 1 },
  },
  "9A": {
    "Juliana": { mat: "Port", aulas: 5 },
    "Dan": { mat: "Mat", aulas: 5 },
    "Andreia": { mat: "Ing", aulas: 2 },
    "Mikhail": { mat: "Hist", aulas: 3 },
    "Ana Paula": { mat: "Geo", aulas: 4 },
    "Aline": { mat: "Cie", aulas: 4 },
    "Juliana S": { mat: "Art", aulas: 2 },
    "Rafael": { mat: "EF", aulas: 3 },
    "Marcos": { mat: "Inf", aulas: 1 },
    "Raimundo": { mat: "Lei", aulas: 1 },
  },
  "9B": {
    "Juliana": { mat: "Port", aulas: 5 },
    "Dani": { mat: "Mat", aulas: 5 },
    "Andreia": { mat: "Ing", aulas: 2 },
    "Mikhail": { mat: "Hist", aulas: 3 },
    "Robson": { mat: "Geo", aulas: 4 },
    "Aline": { mat: "Cie", aulas: 4 },
    "Juliana S": { mat: "Art", aulas: 2 },
    "Rafael": { mat: "EF", aulas: 3 },
    "Marcos": { mat: "Inf", aulas: 1 },
    "Raimundo": { mat: "Lei", aulas: 1 },
  }
};

const INDISPONIBILIDADES: any = {
  "Juliana": [
    { dia: "Segunda", hora: AULA_5 }, { dia: "Terça", hora: AULA_5 },
    { dia: "Segunda", hora: AULA_6 }, { dia: "Terça", hora: AULA_6 },
    { dia: "Quinta", hora: AULA_1 }
  ],
  "Denise": [
    { dia: "Segunda", hora: AULA_1 }, { dia: "Terça", hora: AULA_1 }, { dia: "Quarta", hora: AULA_1 },
    { dia: "Segunda", hora: AULA_2 }, { dia: "Terça", hora: AULA_2 }, { dia: "Quarta", hora: AULA_2 },
    { dia: "Segunda", hora: AULA_3 }, { dia: "Terça", hora: AULA_3 }, { dia: "Quarta", hora: AULA_3 },
    { dia: "Quarta", hora: AULA_4 },
    { dia: "Segunda", hora: AULA_5 }, { dia: "Terça", hora: AULA_5 },
    { dia: "Segunda", hora: AULA_6 }, { dia: "Terça", hora: AULA_6 },
  ],
  "Dani": [
    { dia: "Segunda", hora: AULA_5 }, { dia: "Quarta", hora: AULA_5 },
    { dia: "Segunda", hora: AULA_6 }, { dia: "Quarta", hora: AULA_6 },
  ],
  "Eliane": [
    { dia: "Sexta", hora: AULA_5 }, { dia: "Sexta", hora: AULA_6 }
  ],
  "Andreia": [
    { dia: "Quarta", hora: AULA_6 }, { dia: "Quinta", hora: AULA_6 }
  ],
  "Elisangela": [
    ...["Segunda","Terça","Quarta","Quinta","Sexta"].flatMap(d => [
      { dia: d, hora: AULA_1 }, { dia: d, hora: AULA_2 }, { dia: d, hora: AULA_3 }, { dia: d, hora: AULA_4 }
    ]),
    { dia: "Sexta", hora: AULA_5 }, { dia: "Sexta", hora: AULA_6 }
  ],
  "Cida": [
    ...["Segunda","Terça","Quarta","Quinta","Sexta"].flatMap(d => [
      { dia: d, hora: AULA_1 }, { dia: d, hora: AULA_2 }, { dia: d, hora: AULA_3 }
    ])
  ],
  "Mikhail": [
    { dia: "Terça", hora: AULA_1 }, { dia: "Terça", hora: AULA_2 }
  ],
  "Ana Paula": [
    { dia: "Segunda", hora: AULA_1 }, { dia: "Sexta", hora: AULA_6 }
  ],
  "Robson": [
    { dia: "Terça", hora: AULA_1 }, { dia: "Quinta", hora: AULA_1 }
  ],
  "Aline": [
    { dia: "Segunda", hora: AULA_1 }, { dia: "Quarta", hora: AULA_1 }
  ],
  "Aparecida": [
    { dia: "Sexta", hora: AULA_5 }, { dia: "Sexta", hora: AULA_6 }
  ],
  "Juliana S": [
    { dia: "Terça", hora: AULA_1 }, { dia: "Quarta", hora: AULA_1 },
    { dia: "Terça", hora: AULA_2 }, { dia: "Quarta", hora: AULA_2 },
    { dia: "Terça", hora: AULA_3 }, { dia: "Quarta", hora: AULA_3 },
    { dia: "Terça", hora: AULA_4 }, { dia: "Quarta", hora: AULA_4 },
    { dia: "Segunda", hora: AULA_5 }, { dia: "Terça", hora: AULA_5 }, { dia: "Quarta", hora: AULA_5 },
    { dia: "Segunda", hora: AULA_6 }, { dia: "Terça", hora: AULA_6 }, { dia: "Quarta", hora: AULA_6 },
  ],
  "Rafael": [
    { dia: "Segunda", hora: AULA_5 }, { dia: "Terça", hora: AULA_5 },
    { dia: "Segunda", hora: AULA_6 }, { dia: "Terça", hora: AULA_6 }, { dia: "Quarta", hora: AULA_6 }
  ],
  "Marcos": [
    ...["Quarta", "Quinta", "Sexta"].flatMap(d => [
      { dia: d, hora: AULA_1 }, { dia: d, hora: AULA_2 }, { dia: d, hora: AULA_3 }, { dia: d, hora: AULA_4 }
    ]),
    ...["Segunda", "Terça", "Quarta", "Quinta", "Sexta"].flatMap(d => [
      { dia: d, hora: AULA_5 }, { dia: d, hora: AULA_6 }
    ])
  ],
  "Raimundo": [
    ...["Quarta", "Quinta", "Sexta"].flatMap(d => [
      { dia: d, hora: AULA_1 }, { dia: d, hora: AULA_2 }, { dia: d, hora: AULA_3 }, { dia: d, hora: AULA_4 }
    ]),
    ...["Segunda", "Terça", "Quarta", "Quinta", "Sexta"].flatMap(d => [
      { dia: d, hora: AULA_5 }, { dia: d, hora: AULA_6 }
    ])
  ]
};

async function main() {
  console.log("Inserindo escola no banco...");
  const school = await prisma.school.create({ data: { name: "Escola Turno Manhã (Complexa)" } });

  console.log("Inserindo Turmas...");
  const turmasDb: any = {};
  for (let t of TURMAS) {
    const res = await prisma.class.create({ data: { name: t, schoolId: school.id } });
    turmasDb[t] = res.id;
  }

  console.log("Inserindo Matérias...");
  const matsDb: any = {};
  for (let m of DISCIPLINAS) {
    const res = await prisma.subject.create({ data: { name: m.name, sigla: m.sigla, schoolId: school.id } });
    matsDb[m.sigla] = res.id;
  }

  console.log("Inserindo Professores e pegando ID...");
  const profsDb: any = {};
  // Extrair todos os nomes de professores únicos
  const profNames = new Set<string>();
  Object.values(PROFESSORES_AULAS).forEach((t: any) => Object.keys(t).forEach(p => profNames.add(p)));
  
  for (let p of Array.from(profNames)) {
    const rests = INDISPONIBILIDADES[p] || [];
    const res = await prisma.teacher.create({
      data: { name: p, schoolId: school.id, restrictions: JSON.stringify(rests) }
    });
    profsDb[p] = res.id;
  }

  console.log("Inserindo Aulas (TeacherClassSubject)...");
  for (let turma of Object.keys(PROFESSORES_AULAS)) {
    const profs = PROFESSORES_AULAS[turma];
    for (let p of Object.keys(profs)) {
      const pData = profs[p];
      await prisma.teacherClassSubject.create({
        data: {
          teacherId: profsDb[p],
          classId: turmasDb[turma],
          subjectId: matsDb[pData.mat],
          aulas: pData.aulas
        }
      });
    }
  }

  console.log("Dados inseridos com sucesso! Preparando para gerar a grade...");
  
  const materiasFormatadas = await carregarMaterias(prisma, school.id);

  console.log("Gerando a grade...");
  try {
    const result = await resolverGrade(materiasFormatadas, HORARIOS);
    console.log(result.completa ? "Grade gerada sem conflitos!" : "Grade gerada COM conflitos:\n" + result.conflitos.join("\n"));
    fs.writeFileSync("grade-final.json", JSON.stringify(result.grade, null, 2));
    console.log("Salvo em grade-final.json");
  } catch (err: any) {
    console.error("Falha ao gerar grade:", err.message);
  }
}

main();

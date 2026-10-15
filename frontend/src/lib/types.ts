// Tipos das respostas da API (ver docs/API.md).

export type Restricao = { dia: string; hora: string };

/** grade[turma][dia][hora] = "SIGLA (Professor)" ou "—" */
export type Grade = Record<string, Record<string, Record<string, string>>>;

export type Contagens = { teachers: number; classes: number; subjects: number; schedules: number };

export type School = {
  id: string;
  name: string;
  horarios: string[];
  createdAt: string;
  _count: Contagens;
  totalAulas?: number;
};

export type Subject = { id: string; name: string; sigla: string };
export type SubjectWithTeachers = Subject & { teachers: { id: string; name: string }[] };

export type Teacher = {
  id: string;
  name: string;
  restrictions: string | null;
  subjects: Subject[];
  totalAulas: number;
};

export type ClassItem = { id: string; name: string };

export type Lesson = {
  id: string;
  classId: string;
  aulas: number;
  teacher: { id: string; name: string };
  subject: Subject;
};

export type Schedule = { id: string; name: string; data: string; createdAt: string };

export type ResultadoGrade = {
  grade: Grade;
  horarios: string[];
  completa: boolean;
  conflitos: string[];
  avisos: string[];
  tempoMs: number;
};

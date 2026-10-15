import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DIAS, GradeImpossivelError, MateriaReq, VAGO, resolverGrade } from '../src/generator';

const HORARIOS = ['7h', '8h', '9h', '10h', '11h'];

/** Atalho para montar uma matéria com um professor. */
function materia(sigla: string, prof: string, turmas: Record<string, number>, bloqueios: [string, string][] = []): MateriaReq {
  return {
    id: sigla,
    sigla,
    professores: [{
      id: prof,
      nome: prof,
      indisponibilidades: bloqueios.map(([dia, hora]) => ({ dia, hora })),
      turmas: Object.entries(turmas).map(([nome, aulas]) => ({ id: nome, nome, aulas })),
    }],
  };
}

/** Conta quantas aulas de cada "SIGLA (Professor)" a turma recebeu na semana. */
function contarAulas(grade: Record<string, Record<string, string>>) {
  const contagem = new Map<string, number>();
  for (const dia of DIAS) {
    for (const valor of Object.values(grade[dia])) {
      if (valor !== VAGO) contagem.set(valor, (contagem.get(valor) ?? 0) + 1);
    }
  }
  return contagem;
}

test('gera grade completa respeitando a carga de cada turma', async () => {
  const materias = [
    materia('MAT', 'Ana', { '1A': 5, '1B': 5 }),
    materia('POR', 'Bruno', { '1A': 5, '1B': 5 }),
    materia('HIS', 'Carla', { '1A': 3, '1B': 3 }),
  ];
  const r = await resolverGrade(materias, HORARIOS);

  assert.equal(r.completa, true);
  assert.deepEqual(r.conflitos, []);
  for (const turma of ['1A', '1B']) {
    const contagem = contarAulas(r.grade[turma]);
    assert.equal(contagem.get('MAT (Ana)'), 5);
    assert.equal(contagem.get('POR (Bruno)'), 5);
    assert.equal(contagem.get('HIS (Carla)'), 3);
  }
});

test('nunca coloca o mesmo professor em duas turmas no mesmo horário', async () => {
  const materias = [
    materia('MAT', 'Ana', { '1A': 10, '1B': 10 }),
    materia('POR', 'Bruno', { '1A': 10, '1B': 10 }),
  ];
  const r = await resolverGrade(materias, HORARIOS);

  assert.equal(r.completa, true);
  for (const dia of DIAS) {
    for (const hora of HORARIOS) {
      const a = r.grade['1A'][dia][hora];
      const b = r.grade['1B'][dia][hora];
      if (a !== VAGO) assert.notEqual(a, b, `choque em ${dia} ${hora}`);
    }
  }
});

test('respeita os horários bloqueados do professor', async () => {
  const bloqueios = DIAS.map(dia => [dia, '7h'] as [string, string]);
  const r = await resolverGrade([materia('MAT', 'Ana', { '1A': 10 }, bloqueios)], HORARIOS);

  assert.equal(r.completa, true);
  for (const dia of DIAS) assert.equal(r.grade['1A'][dia]['7h'], VAGO);
});

test('avisa quando uma restrição usa um horário que não existe', async () => {
  const r = await resolverGrade([materia('MAT', 'Ana', { '1A': 2 }, [['Segunda', '6h']])], HORARIOS);
  assert.ok(r.avisos.some(a => a.includes('Segunda 6h')));
});

test('detecta professor com mais aulas do que horários livres', async () => {
  const bloqueios = DIAS.flatMap(dia => ['7h', '8h', '9h'].map(hora => [dia, hora] as [string, string]));
  await assert.rejects(
    resolverGrade([materia('MAT', 'Ana', { '1A': 11 }, bloqueios)], HORARIOS),
    (err: unknown) => err instanceof GradeImpossivelError && err.problemas[0].includes('Ana precisa dar 11 aulas'),
  );
});

test('detecta turma com mais aulas do que horários na semana', async () => {
  await assert.rejects(
    resolverGrade([materia('MAT', 'Ana', { '1A': 26 })], HORARIOS),
    (err: unknown) => err instanceof GradeImpossivelError && err.problemas[0].includes('25 horários'),
  );
});

test('recusa lista de horários vazia ou repetida', async () => {
  await assert.rejects(resolverGrade([materia('MAT', 'Ana', { '1A': 1 })], []), GradeImpossivelError);
  await assert.rejects(resolverGrade([materia('MAT', 'Ana', { '1A': 1 })], ['7h', '7h']), GradeImpossivelError);
});

test('recusa escola sem nenhuma aula atribuída', async () => {
  await assert.rejects(resolverGrade([], HORARIOS), GradeImpossivelError);
});

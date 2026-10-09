export const DIAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];

export const VAGO = "—";

export interface Indisponibilidade { dia: string; hora: string }
export interface TurmaReq { id: string; nome: string; aulas: number }
export interface ProfessorReq { id: string; nome: string; indisponibilidades: Indisponibilidade[]; turmas: TurmaReq[] }
export interface MateriaReq { id: string; sigla: string; professores: ProfessorReq[] }

// grade[turma][dia][hora] = "SIGLA (Professor)" ou VAGO
export type Grade = Record<string, Record<string, Record<string, string>>>;

export interface ResultadoGrade {
  grade: Grade;
  completa: boolean;     // true = nenhum choque de professor nem horário bloqueado
  conflitos: string[];   // problemas graves que sobraram na grade
  avisos: string[];      // preferências não atendidas / dados suspeitos
  tempoMs: number;
}

export interface OpcoesGerador {
  tempoLimiteMs?: number;
  maxAulasMesmaMateriaPorDia?: number;
}

const PESO_GRAVE = 100;   // choque de professor ou horário bloqueado
const PESO_LEVE = 1;      // muitas aulas da mesma matéria no mesmo dia

export class GradeImpossivelError extends Error {
  constructor(public problemas: string[]) {
    super(problemas.join("\n"));
  }
}

/**
 * Monta a grade semanal usando busca tabu orientada a conflitos.
 *
 * Cada turma tem uma linha de slots (dias x horários) contendo todas as suas aulas
 * mais "vagos" para completar. Como só trocamos células dentro da mesma turma,
 * a turma nunca tem duas aulas no mesmo horário; o algoritmo só precisa eliminar
 * choques de professor e horários bloqueados.
 */
export async function resolverGrade(
  materias: MateriaReq[],
  horarios: string[],
  opcoes: OpcoesGerador = {}
): Promise<ResultadoGrade> {
  const inicio = Date.now();
  const tempoLimite = opcoes.tempoLimiteMs ?? 20000;
  const maxPorDia = opcoes.maxAulasMesmaMateriaPorDia ?? 2;

  if (horarios.length === 0) throw new GradeImpossivelError(["Informe pelo menos um horário de aula."]);
  if (new Set(horarios).size !== horarios.length) throw new GradeImpossivelError(["Existem horários repetidos na lista de blocos de aula."]);

  const H = horarios.length;
  const S = DIAS.length * H;
  const slotIndex = new Map<string, number>();
  DIAS.forEach((d, di) => horarios.forEach((h, hi) => slotIndex.set(`${d}|${h}`, di * H + hi)));

  // --- Indexa turmas, professores e pares turma/matéria ---
  const turmas: { id: string; nome: string }[] = [];
  const turmaIdx = new Map<string, number>();
  const profs: { id: string; nome: string; indisp: boolean[]; carga: number }[] = [];
  const profIdx = new Map<string, number>();
  const pares = new Map<string, number>();
  const aulas: { turma: number; prof: number; par: number; sigla: string }[] = [];
  const avisos: string[] = [];

  for (const mat of materias) {
    for (const prof of mat.professores) {
      let p = profIdx.get(prof.id);
      if (p === undefined) {
        p = profs.length;
        profIdx.set(prof.id, p);
        profs.push({ id: prof.id, nome: prof.nome, indisp: new Array(S).fill(false), carga: 0 });
        for (const ind of prof.indisponibilidades ?? []) {
          const s = slotIndex.get(`${ind?.dia}|${String(ind?.hora ?? "").trim()}`);
          if (s === undefined) {
            avisos.push(`Restrição de ${prof.nome} (${ind?.dia} ${ind?.hora}) não corresponde a nenhum horário configurado e foi ignorada.`);
          } else {
            profs[p].indisp[s] = true;
          }
        }
      }

      for (const turma of prof.turmas) {
        const qtd = Math.floor(Number(turma.aulas));
        if (!turma.nome || !(qtd > 0)) continue;
        let t = turmaIdx.get(turma.id);
        if (t === undefined) {
          t = turmas.length;
          turmaIdx.set(turma.id, t);
          turmas.push({ id: turma.id, nome: turma.nome });
        }
        const chavePar = `${t}|${mat.id}`;
        let par = pares.get(chavePar);
        if (par === undefined) { par = pares.size; pares.set(chavePar, par); }
        for (let i = 0; i < qtd; i++) aulas.push({ turma: t, prof: p, par, sigla: mat.sigla });
        profs[p].carga += qtd;
      }
    }
  }

  if (turmas.length === 0) {
    throw new GradeImpossivelError(["Nenhuma aula cadastrada. Atribua professores e disciplinas às turmas antes de gerar a grade."]);
  }

  // --- Verificador de viabilidade ---
  const problemas: string[] = [];
  const cargaTurma = new Array(turmas.length).fill(0);
  aulas.forEach(a => cargaTurma[a.turma]++);
  turmas.forEach((t, i) => {
    if (cargaTurma[i] > S) problemas.push(`A turma ${t.nome} tem ${cargaTurma[i]} aulas, mas a semana só tem ${S} horários.`);
  });
  profs.forEach(p => {
    const livres = p.indisp.filter(x => !x).length;
    if (p.carga > livres) problemas.push(`${p.nome} precisa dar ${p.carga} aulas, mas só tem ${livres} horários disponíveis na semana.`);
  });
  if (problemas.length > 0) throw new GradeImpossivelError(problemas);

  // --- Estado da busca ---
  const T = turmas.length;
  const P = profs.length;
  const D = DIAS.length;
  const grid: Int32Array[] = turmas.map(() => new Int32Array(S).fill(-1)); // índice da aula ou -1 (vago)
  const ocupacaoProf = new Int32Array(P * S);
  const parDia = new Int32Array(pares.size * D);
  let custo = 0;

  const custoProfSlot = (p: number, s: number) => {
    const n = ocupacaoProf[p * S + s];
    return (n > 1 ? n - 1 : 0) + (profs[p].indisp[s] ? n : 0);
  };
  const custoParDia = (par: number, d: number) => Math.max(0, parDia[par * D + d] - maxPorDia);

  // Retorna a variação de custo ao adicionar (+1) ou remover (-1) a aula `a` do slot `s`.
  const mover = (a: number, s: number, sinal: 1 | -1) => {
    const { prof, par } = aulas[a];
    const d = Math.floor(s / H);
    const antes = PESO_GRAVE * custoProfSlot(prof, s) + PESO_LEVE * custoParDia(par, d);
    ocupacaoProf[prof * S + s] += sinal;
    parDia[par * D + d] += sinal;
    const depois = PESO_GRAVE * custoProfSlot(prof, s) + PESO_LEVE * custoParDia(par, d);
    return depois - antes;
  };

  const trocar = (t: number, s1: number, s2: number) => {
    const a = grid[t][s1], b = grid[t][s2];
    let delta = 0;
    if (a >= 0) delta += mover(a, s1, -1);
    if (b >= 0) delta += mover(b, s2, -1);
    if (a >= 0) delta += mover(a, s2, 1);
    if (b >= 0) delta += mover(b, s1, 1);
    grid[t][s1] = b;
    grid[t][s2] = a;
    return delta;
  };

  // --- Solução inicial gulosa: aulas de professores mais "apertados" primeiro ---
  const folga = profs.map(p => p.indisp.filter(x => !x).length - p.carga);
  const ordem = aulas.map((_, i) => i).sort((x, y) => folga[aulas[x].prof] - folga[aulas[y].prof] || Math.random() - 0.5);
  for (const a of ordem) {
    const { turma, prof, par } = aulas[a];
    let melhor = -1, melhorCusto = Infinity;
    for (let s = 0; s < S; s++) {
      if (grid[turma][s] !== -1) continue;
      const c = PESO_GRAVE * ((ocupacaoProf[prof * S + s] > 0 ? 1 : 0) + (profs[prof].indisp[s] ? 1 : 0))
        + PESO_LEVE * (parDia[par * D + Math.floor(s / H)] >= maxPorDia ? 1 : 0)
        + Math.random() * 0.5;
      if (c < melhorCusto) { melhorCusto = c; melhor = s; }
    }
    grid[turma][melhor] = a;
    custo += mover(a, melhor, 1);
  }

  // --- Busca tabu ---
  const tabu = new Int32Array(aulas.length * S); // iteração até a qual a aula não pode voltar ao slot
  let melhorCusto = custo;
  let melhorGrid = grid.map(r => r.slice());
  let semMelhora = 0;
  let ultimaPausa = Date.now();

  const celulaConflitante = (t: number, s: number) => {
    const a = grid[t][s];
    if (a < 0) return 0;
    const { prof, par } = aulas[a];
    const grave = ocupacaoProf[prof * S + s] > 1 || profs[prof].indisp[s];
    if (grave) return 2;
    return parDia[par * D + Math.floor(s / H)] > maxPorDia ? 1 : 0;
  };

  for (let iter = 1; custo > 0 && Date.now() - inicio < tempoLimite; iter++) {
    if (Date.now() - ultimaPausa > 50) {
      await new Promise(r => setImmediate(r)); // não trava o servidor
      ultimaPausa = Date.now();
    }

    // Escolhe uma célula em conflito (priorizando conflitos graves)
    const graves: number[] = [], leves: number[] = [];
    for (let t = 0; t < T; t++) {
      for (let s = 0; s < S; s++) {
        const c = celulaConflitante(t, s);
        if (c === 2) graves.push(t * S + s);
        else if (c === 1) leves.push(t * S + s);
      }
    }
    const lista = graves.length > 0 ? graves : leves;
    const escolhida = lista[Math.floor(Math.random() * lista.length)];
    const t = Math.floor(escolhida / S), s1 = escolhida % S;

    // Avalia todas as trocas dentro da turma e aplica a melhor não-tabu
    let melhorDelta = Infinity, melhorS2 = -1, empates = 0;
    for (let s2 = 0; s2 < S; s2++) {
      if (s2 === s1) continue;
      const a = grid[t][s1], b = grid[t][s2];
      if (a < 0 && b < 0) continue;
      const delta = trocar(t, s1, s2);
      trocar(t, s1, s2); // desfaz
      const ehTabu = (a >= 0 && tabu[a * S + s2] > iter) || (b >= 0 && tabu[b * S + s1] > iter);
      if (ehTabu && custo + delta >= melhorCusto) continue; // critério de aspiração
      if (delta < melhorDelta) { melhorDelta = delta; melhorS2 = s2; empates = 1; }
      else if (delta === melhorDelta && Math.random() * ++empates < 1) melhorS2 = s2;
    }
    if (melhorS2 < 0) continue;

    const a = grid[t][s1], b = grid[t][melhorS2];
    custo += trocar(t, s1, melhorS2);
    const permanencia = 7 + Math.floor(Math.random() * 10);
    if (a >= 0) tabu[a * S + s1] = iter + permanencia;
    if (b >= 0) tabu[b * S + melhorS2] = iter + permanencia;

    if (custo < melhorCusto) {
      melhorCusto = custo;
      melhorGrid = grid.map(r => r.slice());
      semMelhora = 0;
    } else if (++semMelhora > 3000) {
      // Estagnou: volta à melhor solução e embaralha um pouco
      for (let tt = 0; tt < T; tt++) {
        for (let s = 0; s < S; s++) {
          if (grid[tt][s] >= 0) mover(grid[tt][s], s, -1);
          grid[tt][s] = melhorGrid[tt][s];
          if (grid[tt][s] >= 0) mover(grid[tt][s], s, 1);
        }
      }
      custo = melhorCusto;
      for (let k = 0; k < T * 2; k++) {
        const tt = Math.floor(Math.random() * T);
        custo += trocar(tt, Math.floor(Math.random() * S), Math.floor(Math.random() * S));
      }
      tabu.fill(0);
      semMelhora = 0;
    }
  }

  // --- Monta o resultado a partir da melhor solução encontrada ---
  const conflitos: string[] = [];
  const grade: Grade = {};
  const profNoSlot = new Map<string, string[]>();

  turmas.forEach((turma, t) => {
    grade[turma.nome] = {};
    DIAS.forEach((dia, d) => {
      grade[turma.nome][dia] = {};
      const contagem = new Map<string, number>();
      horarios.forEach((hora, h) => {
        const a = melhorGrid[t][d * H + h];
        if (a < 0) { grade[turma.nome][dia][hora] = VAGO; return; }
        const aula = aulas[a];
        const prof = profs[aula.prof];
        grade[turma.nome][dia][hora] = `${aula.sigla} (${prof.nome})`;

        const chave = `${aula.prof}|${d * H + h}`;
        profNoSlot.set(chave, [...(profNoSlot.get(chave) ?? []), turma.nome]);
        if (prof.indisp[d * H + h]) conflitos.push(`${prof.nome} está bloqueado(a) em ${dia} ${hora}, mas ficou com aula na turma ${turma.nome}.`);
        contagem.set(aula.sigla, (contagem.get(aula.sigla) ?? 0) + 1);
      });
      contagem.forEach((n, sigla) => {
        if (n > maxPorDia) avisos.push(`Turma ${turma.nome} tem ${n} aulas de ${sigla} na ${dia}.`);
      });
    });
  });
  profNoSlot.forEach((ts, chave) => {
    if (ts.length < 2) return;
    const [p, s] = chave.split("|").map(Number);
    conflitos.push(`${profs[p].nome} ficou em ${ts.length} turmas ao mesmo tempo (${ts.join(", ")}) em ${DIAS[Math.floor(s / H)]} ${horarios[s % H]}.`);
  });

  return { grade, completa: conflitos.length === 0, conflitos, avisos, tempoMs: Date.now() - inicio };
}

const DIAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];

export const resolverGrade = async (materias: any[], horarios: string[]) => {
  const turmasSet = new Set<string>();
  let requirements: any[] = [];
  let indispMap: Record<string, Set<string>> = {};
  let requiredHoursCount = 0;

  materias.forEach(mat => {
      mat.professores.forEach((prof: any) => {
          if (!indispMap[prof.nome]) indispMap[prof.nome] = new Set();
          prof.indisponibilidades?.forEach((ind: any) => {
              if(ind.dia && ind.hora) indispMap[prof.nome].add(`${ind.dia}-${ind.hora}`);
          });
          
          prof.turmas.forEach((turma: any) => {
              if (!turma.nome || parseInt(turma.aulas) <= 0) return;
              turmasSet.add(turma.nome);
              requirements.push({ mat: mat.sigla, prof: prof.nome, turma: turma.nome, total: parseInt(turma.aulas) });
              requiredHoursCount += parseInt(turma.aulas);
          });
      });
  });

  const turmasList = Array.from(turmasSet);
  const slotsPerTurma = DIAS.length * horarios.length;
  const maxCapacity = turmasList.length * slotsPerTurma;
  
  if (requiredHoursCount > maxCapacity) {
      throw new Error(`Capacidade excedida. Exigido: ${requiredHoursCount} aulas. Capacidade máxima: ${maxCapacity}.`);
  }
  
  for (let t of turmasList) {
      const reqsTurma = requirements.filter(r => r.turma === t).reduce((sum, r) => sum + r.total, 0);
      if (reqsTurma > slotsPerTurma) {
          throw new Error(`Conflito: A turma ${t} exige ${reqsTurma} aulas, mas o quadro semanal possui apenas ${slotsPerTurma} horários disponíveis.`);
      }
  }

  // Cria instâncias individuais de cada aula
  const classItems: any[] = [];
  requirements.forEach((r) => {
      for (let i = 0; i < r.total; i++) {
          classItems.push({
              id: classItems.length,
              turma: r.turma,
              prof: r.prof,
              mat: r.mat
          });
      }
  });

  // Cria coordenadas dos slots semanais
  const allSlots: any[] = [];
  DIAS.forEach(d => {
      horarios.forEach(h => {
          allSlots.push({ d, h });
      });
  });

  // Agrupa as aulas por turma e preenche com vago se necessário
  const turmaClasses: Record<string, any[]> = {};
  turmasList.forEach(t => {
      const items = classItems.filter(c => c.turma === t);
      while (items.length < slotsPerTurma) {
          items.push({ id: -1, turma: t, prof: "", mat: "—" });
      }
      turmaClasses[t] = items;
  });

  // Funções de avaliação de conflitos
  function getSlotConflicts(timetable: any, sIdx: number) {
      const slot = allSlots[sIdx];
      let conf = 0;
      const profsInSlot = new Set();
      for (let t of turmasList) {
          const c = timetable[t][sIdx];
          if (c && c.id !== -1) {
              if (profsInSlot.has(c.prof)) {
                  conf += 20; // Penalidade choque de professor no mesmo horário
              } else {
                  profsInSlot.add(c.prof);
              }
              if (indispMap[c.prof] && indispMap[c.prof].has(`${slot.d}-${slot.h}`)) {
                  conf += 20; // Penalidade professor alocado em horário bloqueado
              }
          }
      }
      return conf;
  }

  function getTurmaDayConflicts(timetable: any, t: string, dIdx: number) {
      const subjectCounts: Record<string, number> = {};
      let conf = 0;
      for (let hIdx = 0; hIdx < horarios.length; hIdx++) {
          const sIdx = dIdx * horarios.length + hIdx;
          const c = timetable[t][sIdx];
          if (c && c.id !== -1) {
              subjectCounts[c.mat] = (subjectCounts[c.mat] || 0) + 1;
              if (subjectCounts[c.mat] > 2) {
                  conf += 2; // Penalidade mais de 2 aulas da mesma matéria no mesmo dia
              }
          }
      }
      return conf;
  }

  function countTotalConflicts(timetable: any) {
      let total = 0;
      for (let s = 0; s < slotsPerTurma; s++) {
          total += getSlotConflicts(timetable, s);
      }
      for (let t of turmasList) {
          for (let d = 0; d < DIAS.length; d++) {
              total += getTurmaDayConflicts(timetable, t, d);
          }
      }
      return total;
  }

  // Otimização Estocástica (Simulated Annealing + Min-Conflicts)
  let solvedTimetable: any = null;
  const NUM_RESTARTS = 120;
  const ITERS_PER_RESTART = 8000;
  let lastYield = Date.now();

  for (let restart = 0; restart < NUM_RESTARTS; restart++) {
      let currentTimetable: any = {};
      turmasList.forEach(t => {
          const items = [...turmaClasses[t]];
          // Embaralha slots da turma
          for (let i = items.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [items[i], items[j]] = [items[j], items[i]];
          }
          currentTimetable[t] = items;
      });

      let currentConflicts = countTotalConflicts(currentTimetable);
      if (currentConflicts === 0) {
          solvedTimetable = currentTimetable;
          break;
      }

      let temp = 20.0;

      for (let iter = 0; iter < ITERS_PER_RESTART; iter++) {
          if (Date.now() - lastYield > 20) {
              await new Promise(r => setTimeout(r, 0));
              lastYield = Date.now();
          }

          const t = turmasList[Math.floor(Math.random() * turmasList.length)];
          const s1 = Math.floor(Math.random() * slotsPerTurma);
          const s2 = Math.floor(Math.random() * slotsPerTurma);
          if (s1 === s2) continue;

          const d1 = Math.floor(s1 / horarios.length);
          const d2 = Math.floor(s2 / horarios.length);

          const oldConf = getSlotConflicts(currentTimetable, s1) + 
                         getSlotConflicts(currentTimetable, s2) + 
                         getTurmaDayConflicts(currentTimetable, t, d1) + 
                         (d1 !== d2 ? getTurmaDayConflicts(currentTimetable, t, d2) : 0);

          // Troca de posição
          const tempC = currentTimetable[t][s1];
          currentTimetable[t][s1] = currentTimetable[t][s2];
          currentTimetable[t][s2] = tempC;

          const newConf = getSlotConflicts(currentTimetable, s1) + 
                         getSlotConflicts(currentTimetable, s2) + 
                         getTurmaDayConflicts(currentTimetable, t, d1) + 
                         (d1 !== d2 ? getTurmaDayConflicts(currentTimetable, t, d2) : 0);

          const delta = newConf - oldConf;

          if (delta <= 0 || Math.random() < Math.exp(-delta / temp)) {
              currentConflicts += delta;
              if (currentConflicts === 0) {
                  solvedTimetable = currentTimetable;
                  break;
              }
          } else {
              // Reverte a troca
              currentTimetable[t][s2] = currentTimetable[t][s1];
              currentTimetable[t][s1] = tempC;
          }

          temp *= 0.9995;
      }

      if (solvedTimetable) break;
  }

  if (!solvedTimetable) {
      throw new Error("Não foi possível fechar uma grade com 0 choques com essas restrições. Verifique se os bloqueios de professores deixam horários livres suficientes.");
  }

  let newGrade: any = {};
  turmasList.forEach(t => {
      newGrade[t] = {};
      DIAS.forEach((d, dIdx) => {
          newGrade[t][d] = {};
          horarios.forEach((h, hIdx) => {
              const sIdx = dIdx * horarios.length + hIdx;
              const c = solvedTimetable[t][sIdx];
              newGrade[t][d][h] = (c && c.id !== -1 && c.mat !== "—") ? `${c.mat} (${c.prof})` : "—";
          });
      });
  });

  return newGrade;
};

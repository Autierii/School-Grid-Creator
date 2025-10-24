# GradeCurricular.py — versão otimizada

def input_int(prompt):
    while True:
        try:
            return int(input(prompt))
        except ValueError:
            print("❌ Por favor, insira um número inteiro válido.")


def input_str(prompt):
    while True:
        value = input(prompt).strip()
        if value:
            return value
        print("❌ Por favor, insira um texto não vazio.")


def coletar_horarios():
    num_aulas = input_int("Quantas aulas por dia serão? ")
    horarios = [input_str(f"Horário da aula {i+1}: ") for i in range(num_aulas)]
    return horarios


def coletar_materias():
    materias = {}
    turmas = set()
    num_materias = input_int("Quantas matérias serão dadas? ")

    for i in range(num_materias):
        sigla = input_str(f"Sigla da matéria {i+1}: ").upper()
        num_prof = input_int(f"Quantos professores têm a matéria {sigla}? ")
        professores = {}

        for j in range(num_prof):
            nome_prof = input_str(f"Nome do professor {j+1} da matéria {sigla}: ")
            aulas_prof = {}
            indispon = set()

            n_turmas = input_int(f"Em quantas turmas o professor {nome_prof} leciona? ")
            for k in range(n_turmas):
                turma = input_str(f"Nome da turma {k+1}: ").upper()
                turmas.add(turma)
                aulas_semana = input_int(f"Quantas aulas por semana para a turma {turma}? ")
                aulas_profaturma = aulas_prof.get(turma, 0)
                aulas_prof[turma] = aulas_profaturma + aulas_semana

            n_indisp = input_int(f"Quantos horários indisponíveis {nome_prof} tem? ")
            for k in range(n_indisp):
                dia = input_str(f"Dia indisponível {k+1}: ").capitalize()
                hora = input_str(f"Horário indisponível {k+1}: ")
                indispon.add((dia, hora))

            professores[nome_prof] = {"aulas": aulas_prof, "indisp": indispon}

        materias[sigla] = professores
    return materias, list(turmas)


def gerar_grade(horarios, materias, turmas):
    dias = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"]
    grade = {t: {d: {h: "" for h in horarios} for d in dias} for t in turmas}

    # Estado de aulas remanescentes
    aulas_rest = {
        (prof, turma, mat): prof_data["aulas"][turma]
        for mat, profs in materias.items()
        for prof, prof_data in profs.items()
        for turma in prof_data["aulas"]
    }

    for dia in dias:
        for hora in horarios:
            professores_usados = set()
            for turma in turmas:
                melhor_opcao = None
                for mat, profs in materias.items():
                    for prof, info in profs.items():
                        if (prof, turma, mat) not in aulas_rest:
                            continue
                        if aulas_rest[(prof, turma, mat)] <= 0:
                            continue
                        if (dia, hora) in info["indisp"]:
                            continue
                        if prof in professores_usados:
                            continue

                        melhor_opcao = (mat, prof)
                        break
                    if melhor_opcao:
                        break

                if melhor_opcao:
                    mat, prof = melhor_opcao
                    grade[turma][dia][hora] = f"{mat} ({prof})"
                    aulas_rest[(prof, turma, mat)] -= 1
                    professores_usados.add(prof)
                else:
                    grade[turma][dia][hora] = "—"

    for turma in turmas:
        print(f"\n📚 Grade da turma {turma}:")
        for dia in dias:
            print(f"\n🗓 {dia}:")
            for hora in horarios:
                print(f"  {hora}: {grade[turma][dia][hora]}")


def main():
    print("🧮 Sistema Gerador de Grade Curricular\n")
    horarios = coletar_horarios()
    materias, turmas = coletar_materias()
    gerar_grade(horarios, materias, turmas)


if __name__ == "__main__":
    main()

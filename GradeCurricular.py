def input_int(prompt):
    while True:
        try:
            return int(input(prompt))
        except ValueError:
            print("Por favor, insira um número inteiro.")

def input_str(prompt):
    while True:
        value = input(prompt)
        if value:
            return value
        else:
            print("Por favor, insira um valor válido.")

def primeiro_passo():
    num_aulas = input_int("Quantas aulas por dia serão? ")
    horarios = [input_str(f"Horário da aula {i+1}: ") for i in range(num_aulas)]
    return num_aulas, horarios

def segundo_passo(num_materias):
    materias_orig = {}
    turmas = set()
    for i in range(num_materias):
        sigla = input_str(f"Sigla da matéria {i+1}: ")
        num_professores = input_int(f"Quantos professores tem a matéria {sigla}? ")
        professores = {}
        for j in range(num_professores):
            professor = input_str(f"Nome do professor {j+1} da matéria {sigla}: ")
            num_turmas_professor = input_int(f"Em quantas turmas o professor {professor} dará aula? ")
            aulas_professor = {}
            indisponibilidades_professor = []
            num_indisponibilidades = input_int(f"Quantas indisponibilidades o professor {professor} tem? ")
            for k in range(num_indisponibilidades):
                dia_indisponivel = input_str(f"Qual o dia de indisponibilidade {k+1} do professor {professor}? ")
                horario_indisponivel = input_str(f"Qual o horário de indisponibilidade {k+1} do professor {professor} no dia {dia_indisponivel}? ")
                indisponibilidades_professor.append((dia_indisponivel, horario_indisponivel))
            for k in range(num_turmas_professor):
                turma = input_str(f"Qual a turma {k+1} que o professor {professor} dará aula? ")
                turmas.add(turma)
                num_aulas_turma = input_int(f"Quantas aulas o professor {professor} dará durante a semana para a {turma}? ")
                aulas_professor[turma] = num_aulas_turma
            professores[professor] = (aulas_professor, indisponibilidades_professor)
        materias_orig[sigla] = professores
    return materias_orig, list(turmas)

def quarto_passo(num_aulas, num_materias, horarios, materias_orig, turmas):
    # Criando a grade de horário
    dias_semana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta']
    grade = {turma: {dia: {horario: "" for horario in horarios} for dia in dias_semana} for turma in turmas}

    # Preenchendo a grade com as matérias e professores
    professor_ocupado = {}
    aulas_por_dia = {}
    for dia in dias_semana:
        for horario in horarios:
            for turma in turmas:
                materias = materias_orig.copy()
                while materias:
                    materia, professores = materias.popitem()
                    for professor, (aulas, indisponibilidades) in list(professores.items()):
                        if aulas.get(turma, 0) > 0 and professor not in professor_ocupado and (dia, horario) not in indisponibilidades and aulas_por_dia.get((professor, dia), 0) < 2:
                            aulas[turma] -= 1
                            grade[turma][dia][horario] = f"{materia} ({professor})"
                            professor_ocupado[professor] = True
                            aulas_por_dia[(professor, dia)] = aulas_por_dia.get((professor, dia), 0) + 1
                            break
                    else:
                        continue
                    break
                else:
                    grade[turma][dia][horario] = "Nenhum professor disponível"
            professor_ocupado.clear()

    # Exibindo a grade de horário para cada turma
    for turma in turmas:
        print(f"\nGrade de Horário da {turma}:")
        for dia in dias_semana:
            print(f"\n{dia}:")
            for horario in horarios:
                print(f"{horario}: {grade[turma][dia][horario]}")

def main():
    while True:
        try:
            num_aulas, horarios = primeiro_passo()
            num_materias = input_int("Quantas matérias serão dadas ao longo da semana? ")
            materias_orig, turmas = segundo_passo(num_materias)
            quarto_passo(num_aulas, num_materias, horarios, materias_orig, turmas)
            break
        except Exception as e:
            print(f"Ocorreu um erro: {e}. Vamos começar de novo.")

if __name__ == "__main__":
    main()

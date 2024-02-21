# Primeiro passo
num_aulas = int(input("Quantas aulas por dia serão? "))
horarios = [input(f"Horário da aula {i+1}: ") for i in range(num_aulas)]

# Segundo passo
num_materias = int(input("Quantas matérias serão dadas ao longo da semana? "))
materias_orig = {}
for i in range(num_materias):
    sigla = input(f"Sigla da matéria {i+1}: ")
    num_professores = 0
    while True:
        try:
            num_professores = int(input(f"Quantos professores tem a matéria {sigla}? "))
            break
        except ValueError:
            print("Por favor, insira um número inteiro.")
    professores = {}
    for j in range(num_professores):
        professor = input(f"Nome do professor {j+1} da matéria {sigla}: ")
        num_turmas_professor = int(input(f"Em quantas turmas o professor {professor} dará aula? "))
        aulas_professor = {}
        indisponibilidades_professor = []
        num_indisponibilidades = int(input(f"Quantas indisponibilidades o professor {professor} tem? "))
        for k in range(num_indisponibilidades):
            dia_indisponivel = input(f"Qual o dia de indisponibilidade {k+1} do professor {professor}? ")
            horario_indisponivel = input(f"Qual o horário de indisponibilidade {k+1} do professor {professor} no dia {dia_indisponivel}? ")
            indisponibilidades_professor.append((dia_indisponivel, horario_indisponivel))
        for k in range(num_turmas_professor):
            turma = input(f"Qual a turma {k+1} que o professor {professor} dará aula? ")
            num_aulas_turma = int(input(f"Quantas aulas o professor {professor} dará durante a semana para a {turma}? "))
            aulas_professor[turma] = num_aulas_turma
        professores[professor] = (aulas_professor, indisponibilidades_professor)
    materias_orig[sigla] = professores

# Terceiro passo
num_turmas = int(input("Número de turmas: "))
turmas = [f"Turma {i+1}" for i in range(num_turmas)]

# Criando a grade de horário
dias_semana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta']
grade = {turma: {dia: {horario: "" for horario in horarios} for dia in dias_semana} for turma in turmas}

# Preenchendo a grade com as matérias e professores
professor_ocupado = {}
for dia in dias_semana:
    for horario in horarios:
        for turma in turmas:
            materias = materias_orig.copy()
            while materias:
                materia, professores = materias.popitem()
                for professor, (aulas, indisponibilidades) in list(professores.items()):
                    if aulas.get(turma, 0) > 0 and professor not in professor_ocupado and (dia, horario) not in indisponibilidades:
                        aulas[turma] -= 1
                        grade[turma][dia][horario] = f"{materia} ({professor})"
                        professor_ocupado[professor] = True
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

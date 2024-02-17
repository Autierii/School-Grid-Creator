# Primeiro passo
num_aulas = int(input("Quantas aulas por dia serão? ")) # Criada para saber quantas aulas serão
horarios = [input(f"Horário da aula {i+1}: ") for i in range(num_aulas)] # Saber quais são os horários das aulas

# Segundo passo
num_materias = int(input("Quantas matérias serão dadas ao longo da semana? ")) # Quantidade de matérias que tem 
materias_orig = {} #Dicionário para criar as matérias
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
        num_aulas_professor = int(input(f"Quantas aulas o professor {professor} dará durante a semana? "))
        professores[professor] = num_aulas_professor
    materias_orig[sigla] = professores

# Terceiro passo
num_turmas = int(input("Número de turmas: "))
turmas = [f"Turma {i+1}" for i in range(num_turmas)]

# Criando a grade de horário
dias_semana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta']
grade = {turma: {dia: {horario: "" for horario in horarios} for dia in dias_semana} for turma in turmas}

# Preenchendo a grade com as matérias e professores
for turma in turmas:
    materias = materias_orig.copy()
    for dia in dias_semana:
        for horario in horarios:
            if not materias:  # se o dicionário estiver vazio, recarregue as matérias
                materias = materias_orig.copy()
            materia, professores = materias.popitem()
            professor = next((k for k, v in professores.items() if v > 0), "Nenhum professor disponível")
            if professor != "Nenhum professor disponível":
                professores[professor] -= 1
            grade[turma][dia][horario] = f"{materia} ({professor})"
            if any(v > 0 for v in professores.values()):
                materias[materia] = professores

# Exibindo a grade de horário para cada turma
for turma in turmas:
    print(f"\nGrade de Horário da {turma}:")
    for dia in dias_semana:
        print(f"\n{dia}:")
        for horario in horarios:
            print(f"{horario}: {grade[turma][dia][horario]}")

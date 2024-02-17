# Primeiro passo
num_aulas = int(input("Quantas aulas por dia serão? "))
horarios = [input(f"Horário da aula {i+1}: ") for i in range(num_aulas)]

# Segundo passo
num_materias = int(input("Quantas matérias serão dadas ao longo da semana? "))
materias_orig = {input(f"Sigla da matéria {i+1}: "): input("Nome do professor: ") for i in range(num_materias)}
materias = materias_orig.copy()

# Terceiro passo
num_turmas = int(input("Número de turmas: "))
turmas = [f"Turma {i+1}" for i in range(num_turmas)]

# Criando a grade de horário
dias_semana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta']
grade = {dia: {horario: "" for horario in horarios} for dia in dias_semana}

# Preenchendo a grade com as matérias e professores
for dia in dias_semana:
    for horario in horarios:
        if not materias:  # se o dicionário estiver vazio, recarregue as matérias
            materias = materias_orig.copy()
        materia, professor = materias.popitem()
        grade[dia][horario] = f"{materia} ({professor})"

# Exibindo a grade de horário para cada turma
for turma in turmas:
    print(f"\nGrade de Horário da {turma}:")
    for dia in dias_semana:
        print(f"\n{dia}:")
        for horario in horarios:
            print(f"{horario}: {grade[dia][horario]}")

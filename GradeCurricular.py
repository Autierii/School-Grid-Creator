class Professor:
    def __init__(self, nome):
        self.nome = nome
        self.materias = []

    def adicionar_materia(self, materia):
        self.materias.append(materia)


class Materia:
    def __init__(self, nome, quantidade_aulas, horarios_disponiveis):
        self.nome = nome
        self.quantidade_aulas = quantidade_aulas
        self.horarios_disponiveis = horarios_disponiveis


def criar_horario_semana():
    horario_semana = {
        "Segunda-feira": [],
        "Terça-feira": [],
        "Quarta-feira": [],
        "Quinta-feira": [],
        "Sexta-feira": []
    }
    return horario_semana


def criar_grade_curricular():
    turma = input("Digite o nome da turma (por exemplo, '6A', '7B'): ")
    horario_semana = criar_horario_semana()
    professores = []

    while True:
        nome_professor = input("Digite o nome do professor (ou digite 'sair' para encerrar): ")
        if nome_professor.lower() == 'sair':
            break

        professor = Professor(nome_professor)

        while True:
            nome_materia = input("Digite o nome da matéria que o professor dá aula: ")
            quantidade_aulas = int(input("Digite a quantidade de aulas que o professor deve ter para essa matéria: "))
            try:
                horarios_disponiveis = input("Digite os horários disponíveis para a aula (por exemplo, 'Segunda-feira 08:00-09:30, Terça-feira 10:00-11:30'): ").split(",")
                for horario in horarios_disponiveis:
                    dia, horario_intervalo = horario.split()
                    horario_inicio, horario_fim = horario_intervalo.split("-")
                    horario_semana[dia].append((nome_professor, horario_inicio, horario_fim))
            except ValueError:
                print("Formato inválido. Por favor, insira os horários no formato correto.")
                continue

            materia = Materia(nome_materia, quantidade_aulas, horarios_disponiveis)
            professor.adicionar_materia(materia)

            continuar = input("Deseja adicionar outra matéria para esse professor? (s/n): ")
            if continuar.lower() != 's':
                break

        professores.append(professor)

    return turma, horario_semana, professores


def main():
    turma, horario_semana, grade_curricular = criar_grade_curricular()

    print("\nGrade Curricular:")
    print(f"Turma: {turma}")

    for dia, horarios in horario_semana.items():
        print(f"\n{dia}:")
        for horario in horarios:
            nome_professor, horario_inicio, horario_fim = horario
            print(f"Professor: {nome_professor}, Horário: {horario_inicio} - {horario_fim}")

    print("\nProfessores:")
    for professor in grade_curricular:
        print(f"\nProfessor: {professor.nome}")
        for materia in professor.materias:
            print(f"Matéria: {materia.nome}, Quantidade de Aulas: {materia.quantidade_aulas}")
            print(f"Horários Disponíveis: {', '.join(materia.horarios_disponiveis)}")


if __name__ == "__main__":
    main()

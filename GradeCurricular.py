import json

class Professor:
    def __init__(self, apelido):
        self.apelido = apelido
        self.horarios = {}

    def adicionar_aula(self, dia, horario, materia):
        if dia in self.horarios:
            if horario in self.horarios[dia]:
                return False
        else:
            self.horarios[dia] = {}
        self.horarios[dia][horario] = materia
        return True

def criar_horario(professores):
    horario = {"segunda": {}, "terça": {}, "quarta": {}, "quinta": {}, "sexta": {}}
    aulas_por_dia = int(input("Quantas aulas por dia serão? "))
    for dia in horario:
        for i in range(aulas_por_dia):
            horario_aula = input(f"Qual o horário da aula {i+1} no dia {dia}? ")
            materia = input("Qual a matéria que será dada (em sigla)? ")
            apelido_professor = input("Qual o apelido do professor que dará essa matéria? ")
            if apelido_professor not in professores:
                professores[apelido_professor] = Professor(apelido_professor)
            if not professores[apelido_professor].adicionar_aula(dia, horario_aula, materia):
                print(f"Conflito de horário para o professor {apelido_professor} no dia {dia} às {horario_aula}")
            else:
                horario[dia][horario_aula] = {"materia": materia, "professor": apelido_professor}
    return horario

def salvar_horario(horario):
    with open('horario.json', 'w') as f:
        json.dump(horario, f)

def main():
    professores = {}
    horario = criar_horario(professores)
    salvar_horario(horario)

if __name__ == "__main__":
    main()

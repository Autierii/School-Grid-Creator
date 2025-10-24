# 🧮 Gerador de Grade Curricular — Python

![Python](https://img.shields.io/badge/Python-3.10+-blue?style=for-the-badge&logo=python)
![License](https://img.shields.io/badge/license-MIT-lightgrey?style=for-the-badge)

---

## 📘 Descrição

Este projeto é um **gerador automático de grade curricular**, desenvolvido em **Python**, que permite organizar aulas, professores, turmas e horários respeitando indisponibilidades e limites de carga horária.

Ele foi criado para facilitar a **distribuição de aulas** semanais em escolas e faculdades, garantindo que:
- Um professor não seja escalado para duas turmas no mesmo horário;
- Horários de indisponibilidade sejam respeitados;
- As aulas sejam distribuídas de forma equilibrada ao longo da semana.

---

## 🚀 Como Executar

### ✅ Pré-requisitos
- Python 3.10 ou superior instalado

### 🧭 Execução

```bash
# Clonar o repositório
git clone https://github.com/usuario/grade-curricular.git
cd grade-curricular

# Executar
python GradeCurricular.py
```

O sistema pedirá as informações via terminal e, ao final, exibirá a grade de horários.

---

## 📚 Exemplo de Execução

```
🧮 Sistema Gerador de Grade Curricular

Quantas aulas por dia serão? 3
Horário da aula 1: 8h
Horário da aula 2: 10h
Horário da aula 3: 14h

Quantas matérias serão dadas? 1
Sigla da matéria 1: MAT
Quantos professores têm a matéria MAT? 1
Nome do professor 1 da matéria MAT: João
Em quantas turmas o professor João leciona? 1
Nome da turma 1: 1A
Quantas aulas por semana para a turma 1A? 3
Quantos horários indisponíveis João tem? 1
Dia indisponível 1: Segunda
Horário indisponível 1: 8h

📚 Grade da turma 1A:
🗓 Segunda:
  8h: —
  10h: MAT (João)
  14h: MAT (João)
🗓 Terça:
  8h: MAT (João)
```

---

## 🧠 Funcionalidades

- Inserção interativa de:
  - Matérias
  - Professores
  - Turmas
  - Indisponibilidades
- Geração automática da grade semanal
- Respeito a restrições de horários e carga semanal

---

## 🧱 Estrutura do Projeto

```
GradeCurricular.py    # Código principal
README.md             # Documentação
```

---

## 📝 Licença

Este projeto está licenciado sob a licença MIT — sinta-se livre para usar e modificar.

> 💡 *"Educar é distribuir o tempo com sabedoria."*

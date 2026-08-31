# 🧮 Gerador de Grade Curricular

![License](https://img.shields.io/badge/license-MIT-lightgrey?style=for-the-badge)
![Web](https://img.shields.io/badge/Web-Frontend-blue?style=for-the-badge&logo=html5)
![Python](https://img.shields.io/badge/Python-3.10+-blue?style=for-the-badge&logo=python)

---

## 📘 Descrição

Este projeto é um **gerador automático de grade curricular** que permite organizar aulas, professores, turmas e horários respeitando indisponibilidades e limites de carga horária.

Ele foi criado para facilitar a **distribuição de aulas** semanais em escolas e faculdades, garantindo que:
- Um professor não seja escalado para duas turmas no mesmo horário;
- Horários de indisponibilidade sejam respeitados;
- As aulas sejam distribuídas de forma equilibrada ao longo da semana.

O projeto foi totalmente refeito para incluir uma **Interface Web (Frontend)** moderna, feita com React e Tailwind CSS, sem perder a versão original em Python.

---

## 🚀 Como Executar (Interface Web - Novo!)

A maneira mais fácil e visual de usar o gerador agora é através da interface web interativa.

1. Navegue até a pasta do projeto.
2. Abra o arquivo `index.html` em qualquer navegador moderno (Chrome, Firefox, Edge, Safari).
   - Você pode simplesmente dar um **duplo clique** no arquivo `index.html`.
3. Siga o passo a passo na tela para configurar horários, professores e gerar a grade.
4. Você pode imprimir a grade diretamente do navegador ao final!

---

## 🚀 Como Executar (Versão Terminal Python)

Se preferir usar a versão original via terminal:

### ✅ Pré-requisitos
- Python 3.10 ou superior instalado

### 🧭 Execução

```bash
# Executar o script Python
python GradeCurricular.py
```

O sistema pedirá as informações via terminal e, ao final, exibirá a grade de horários.

---

## 🧠 Funcionalidades

- Inserção interativa de:
  - Matérias
  - Professores
  - Turmas
  - Indisponibilidades
- Geração automática da grade semanal usando algoritmo guloso
- Respeito a restrições de horários e carga semanal
- **[NOVO]** Interface gráfica fácil de usar
- **[NOVO]** Opção de impressão das grades geradas na web

---

## 🧱 Estrutura do Projeto

```
index.html            # Nova interface Web Completa (React + Tailwind)
GradeCurricular.py    # Código principal em Python (Terminal)
README.md             # Documentação
```

---

## 📝 Licença

Este projeto está licenciado sob a licença MIT — sinta-se livre para usar e modificar.

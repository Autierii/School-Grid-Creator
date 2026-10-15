<div align="center">

# 🏫 School Grid Creator

**Monte a grade horária da sua escola em segundos — sem choques de professores, respeitando a disponibilidade de cada um.**

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-SQLite-2D3748?logo=prisma&logoColor=white)

[Funcionalidades](#-funcionalidades) •
[Começando](#-começando) •
[Como usar](#-como-usar-em-6-passos) •
[Documentação](#-documentação) •
[Arquitetura](#-arquitetura)

</div>

---

## ✨ O que é

Montar o horário de uma escola é um quebra-cabeça: cada turma precisa de N aulas de cada matéria, cada professor só pode estar em uma sala por vez, e muitos professores têm dias e horários em que não podem dar aula.

O **School Grid Creator** resolve isso para você. Você cadastra professores, disciplinas, turmas e restrições — ou deixa uma **IA ler uma foto ou texto** e cadastrar tudo — e o sistema gera a grade semanal completa, pronta para imprimir ou exportar para o Excel.

> 💡 Uma escola real com 8 turmas, 17 professores, 30 horários semanais e dezenas de restrições é resolvida **em menos de 10 milissegundos**, sem nenhum conflito.

---

## 🚀 Funcionalidades

| | Funcionalidade | Descrição |
|---|---|---|
| 🧠 | **Gerador inteligente** | Busca tabu orientada a conflitos: zero choques de professor, horários bloqueados respeitados e no máximo 2 aulas da mesma matéria por dia. |
| 🔍 | **Verificador de viabilidade** | Antes de gerar, diz exatamente por que uma grade é impossível (ex.: *"Ana precisa dar 10 aulas, mas só tem 9 horários livres"*). |
| 🗓️ | **Restrições clicáveis** | Marque os horários em que cada professor **não** pode dar aula clicando numa tabela dia × horário (ou um dia/horário inteiro de uma vez). |
| 🧭 | **Visão geral guiada** | Painel da escola com números e um checklist de primeiros passos. |
| 👀 | **Duas visões da grade** | Veja a grade **por turma** ou **por professor**. |
| 📤 | **Exportação e impressão** | Exporte para CSV (abre direto no Excel, com acentos) ou imprima uma turma/professor por página. |
| 🗂️ | **Histórico** | Salve, renomeie, reabra e exclua grades geradas. |
| 🪄 | **Importação Mágica com IA** | Envie uma foto de tabela ou um texto livre; Gemini, Claude ou Cohere extraem professores, matérias, turmas, cargas e restrições. |
| 🏫 | **Multi-escolas** | Gerencie quantas escolas quiser num só painel. |
| ⚠️ | **Alertas de sobrecarga** | Cartões ficam vermelhos quando um professor ou turma tem mais aulas que horários disponíveis. |
| 📱 | **Responsivo** | Menu em gaveta no celular, diálogos e avisos no próprio app. |
| 🔒 | **Local e privado** | Dados em SQLite na sua máquina. Chaves de IA ficam só no seu navegador. |

---

## ⚡ Começando

### Pré-requisitos

- [Node.js](https://nodejs.org/) **20.19+ ou 22.12+** (testado no Node 24)
- npm (já vem com o Node)

### Instalação e execução

```bash
git clone https://github.com/Autierii/School-Grid-Creator.git
cd School-Grid-Creator

npm run setup   # instala backend + frontend e cria o banco SQLite
npm run dev     # sobe a API (:3001) e a interface (:5173) juntas
```

Abra **http://localhost:5173** no navegador. Pronto! 🎉

> 🧪 **Quer testar com dados reais?** Rode `npm run seed` para criar a *Escola Exemplo* completa (8 turmas, 17 professores, 10 disciplinas, dezenas de restrições).

<details>
<summary>Prefere rodar cada parte num terminal?</summary>

```bash
# Terminal 1 — API
cd backend && npm install && npm run db:push && npm run dev

# Terminal 2 — interface
cd frontend && npm install && npm run dev
```

</details>

### Scripts úteis (na raiz)

| Comando | O que faz |
|---|---|
| `npm run dev` | API + interface com recarga automática |
| `npm run seed` | Cria a escola de exemplo |
| `npm test` | Testes do gerador de grade |
| `npm run check` | Tipos + testes + lint + build (rode antes de commitar) |

---

## 🧭 Como usar em 6 passos

1. **Crie a escola** na tela inicial — a *Visão geral* mostra um checklist com os próximos passos.
2. **Cadastre disciplinas** (nome + sigla, ex.: *Matemática / MAT*).
3. Em **Gerar nova grade**, defina os **horários das aulas** (ou escolha um modelo pronto) e salve.
4. **Cadastre professores** e, na aba *Restrições de horário*, clique nos horários em que cada um não pode dar aula.
5. **Crie as turmas** e atribua a cada uma: professor + disciplina + aulas por semana.
6. Clique em **Gerar grade**. Salve no histórico, exporte para o Excel ou imprima.

📖 Passo a passo detalhado, com dicas e solução de problemas: **[Guia de Uso](docs/GUIA-DE-USO.md)**.

---

## 📚 Documentação

| Documento | Para quem | Conteúdo |
|---|---|---|
| 📖 [Guia de Uso](docs/GUIA-DE-USO.md) | Coordenação / usuários | Fluxo completo, importação por IA, dicas e problemas comuns |
| 🏗️ [Arquitetura](docs/ARQUITETURA.md) | Desenvolvedores | Visão geral, modelo de dados, fluxo de geração, estrutura de pastas |
| 🧠 [Algoritmo do Gerador](docs/GERADOR.md) | Desenvolvedores / curiosos | Como a grade é calculada, restrições, pesos e desempenho |
| 🔌 [Referência da API](docs/API.md) | Desenvolvedores / integrações | Todos os endpoints REST com exemplos |
| 🛠️ [Desenvolvimento](docs/DESENVOLVIMENTO.md) | Contribuidores | Scripts, variáveis de ambiente, banco de dados, convenções |

---

## 🏗️ Arquitetura

```mermaid
flowchart LR
    U([👤 Usuário]) --> F[Frontend<br/>React + Vite + Tailwind<br/>:5173]
    F -- REST/JSON --> B[Backend<br/>Express 5 + TypeScript<br/>:3001]
    B --> P[(SQLite<br/>via Prisma)]
    B --> G[Gerador de Grade<br/>busca tabu]
    B -. importação opcional .-> IA[Gemini / Claude / Cohere]
```

```
School-Grid-Creator/
├── package.json                 # scripts da raiz: setup, dev, seed, test, check
├── backend/
│   ├── prisma/schema.prisma     # modelo de dados
│   ├── src/
│   │   ├── app.ts               # app Express (middlewares, rotas, erros)
│   │   ├── routes/              # escolas, professores, disciplinas, turmas, grades
│   │   ├── generator.ts         # algoritmo de geração da grade
│   │   ├── school-data.ts       # banco → formato do gerador
│   │   ├── ai.ts                # importação mágica com IA
│   │   └── http.ts              # validação e tratamento de erros
│   ├── scripts/seed.ts          # escola de exemplo
│   └── tests/                   # testes do gerador (node:test)
├── frontend/
│   └── src/
│       ├── pages/               # Escolas, Visão geral, Professores, Disciplinas, Turmas, Gerar, Histórico
│       ├── components/          # AppShell, GradeView, MagicImport, HorariosEditor...
│       │   └── ui/              # componentes base: Button, Modal, Alert, Tabs...
│       └── lib/                 # cliente da API, tipos, hooks, diálogos
└── docs/                        # documentação
```

Detalhes em **[docs/ARQUITETURA.md](docs/ARQUITETURA.md)**.

---

## 🛠️ Stack

| Camada | Tecnologias |
|---|---|
| **Frontend** | React 19, TypeScript, Vite 8, Tailwind CSS 4, React Router 7, Lucide Icons, Oxlint |
| **Backend** | Node.js, Express 5, TypeScript, Prisma 5, SQLite, Multer, `node:test` |
| **IA (opcional)** | `@google/generative-ai`, `@anthropic-ai/sdk`, API REST do Cohere |

---

## ⚙️ Configuração

Tudo funciona sem configuração. Se precisar, copie `backend/.env.example` para `backend/.env` (ou `frontend/.env.example` para `frontend/.env.local`):

| Onde | Variável | Padrão | Para quê |
|---|---|---|---|
| backend | `PORT` | `3001` | Porta da API |
| backend | `GEMINI_MODEL` | `gemini-2.5-flash` | Modelo usado na importação via Gemini |
| backend | `CLAUDE_MODEL` | `claude-opus-5-5` | Modelo usado na importação via Claude |
| backend | `COHERE_MODEL` | `command-a-03-2025` | Modelo usado na importação via Cohere |
| frontend | `VITE_API_URL` | `http://localhost:3001/api` | Endereço da API |

---

## 🗺️ Próximos passos (ideias)

- [ ] Arrastar e soltar aulas na grade gerada para ajustes manuais
- [ ] Aulas geminadas (duas aulas seguidas da mesma matéria)
- [ ] Preferências de horário (além de bloqueios)
- [ ] Turnos e dias da semana configuráveis
- [ ] Exportação em PDF

---

<div align="center">
Feito com ❤️ para quem já perdeu um fim de semana montando horário escolar no Excel.
</div>

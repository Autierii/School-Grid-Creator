# 🏗️ Arquitetura

Visão técnica de como o School Grid Creator é organizado.

> ⬅️ [Voltar ao README](../README.md)

## Sumário

- [Visão geral](#visão-geral)
- [Backend](#backend)
- [Modelo de dados](#modelo-de-dados)
- [Frontend](#frontend)
- [Fluxo de geração da grade](#fluxo-de-geração-da-grade)
- [Fluxo da importação com IA](#fluxo-da-importação-com-ia)
- [Decisões de projeto](#decisões-de-projeto)

---

## Visão geral

O projeto é um monorepo com duas aplicações independentes que conversam por HTTP/JSON:

```mermaid
flowchart TB
    subgraph Navegador
        F[React SPA<br/>Vite :5173]
        LS[(localStorage<br/>provedor + chave de IA)]
        F --- LS
    end

    subgraph "Servidor Node :3001"
        R[Rotas Express<br/>src/routes/*.ts]
        SD[school-data.ts<br/>banco → formato do gerador]
        G[generator.ts<br/>busca tabu]
        AI[ai.ts<br/>importação]
        DB[db.ts<br/>PrismaClient]
        R --> SD --> DB
        R --> G
        R --> AI --> DB
        R --> DB
    end

    F -- "fetch /api/*" --> R
    DB --> SQL[(SQLite<br/>prisma/dev.db)]
    AI -. HTTPS .-> EXT[Gemini · Claude · Cohere]
```

| Camada | Responsabilidade |
|---|---|
| **Frontend** | Interface, cadastro, edição das restrições, visualização/exportação/impressão das grades. Não tem lógica de negócio crítica. |
| **Backend** | Persistência, validação, verificação de viabilidade, geração da grade, integração com IA. |
| **Banco** | SQLite local, acessado só pelo Prisma. |

---

## Backend

```
backend/
├── prisma/
│   ├── schema.prisma          # modelo de dados (fonte da verdade)
│   └── dev.db                 # banco SQLite (ignorado no git)
├── src/
│   ├── index.ts               # ponto de entrada: carrega .env e sobe o servidor
│   ├── env.ts                 # lê backend/.env (process.loadEnvFile)
│   ├── app.ts                 # createApp(): middlewares, routers, 404 e erros
│   ├── http.ts                # HttpError, validadores e errorHandler
│   ├── routes/
│   │   ├── schools.ts         # /schools (+ contadores e total de aulas)
│   │   ├── teachers.ts        # /teachers, restrições, vínculo com disciplinas
│   │   ├── subjects.ts        # /subjects
│   │   ├── classes.ts         # /classes e /lessons (atribuições)
│   │   └── schedules.ts       # /generate, /schedules e /ai-import
│   ├── generator.ts           # resolverGrade(): verificação + busca tabu
│   ├── school-data.ts         # carregarMaterias(), parseRestricoes()
│   ├── ai.ts                  # processAiImport(): chama a IA e grava os dados
│   └── db.ts                  # instância única do PrismaClient
├── scripts/
│   └── seed.ts                # npm run seed: escola de exemplo + teste do gerador
└── tests/
    └── generator.test.ts      # npm test: testes do gerador (node:test)
```

### `app.ts`, `routes/` e `http.ts`

- `createApp()` monta o Express sem chamar `listen` (fácil de testar). Cada arquivo em `routes/` exporta um `Router` com caminhos completos (`/schools/:schoolId/teachers`, `/teachers/:id`…), montado em `/api`.
- Express 5 — erros lançados em handlers `async` vão direto ao middleware de erro.
- `HttpError(status, mensagem)` para erros esperados; o `errorHandler` converte:
  - `HttpError` → status + `{ error }`;
  - Prisma `P2025` (registro inexistente) → `404`;
  - Prisma `P2003` (escola/professor/disciplina relacionado não existe) → `404`;
  - JSON malformado no corpo → `400`;
  - upload acima de 10 MB → `400`;
  - qualquer outro → `500` (logado no console).
- Rotas desconhecidas em `/api/*` → `404 { error: "Rota não encontrada." }`. `GET /api/health` responde `{ ok: true }`.
- Validadores: `texto()` (obrigatório), `quantidadeAulas()` (inteiro ≥ 1), `listaHorarios()`, `restricoesJson()` (aceita array ou string JSON).

### `school-data.ts`

`carregarMaterias(prisma, schoolId)` lê disciplinas → atribuições → professor/turma e monta a estrutura que o gerador espera:

```ts
MateriaReq[] = [{
  id, sigla,
  professores: [{ id, nome, indisponibilidades: [{ dia, hora }], turmas: [{ id, nome, aulas }] }]
}]
```

### `generator.ts`

Função pura (não acessa banco) — veja **[GERADOR.md](GERADOR.md)**.

### `ai.ts`

Monta o prompt, chama o provedor escolhido, extrai o JSON da resposta e grava tudo numa transação. Veja o [fluxo abaixo](#fluxo-da-importação-com-ia).

---

## Modelo de dados

```mermaid
erDiagram
    School ||--o{ Teacher : possui
    School ||--o{ Subject : possui
    School ||--o{ Class : possui
    School ||--o{ Schedule : "histórico"
    Teacher }o--o{ Subject : "leciona (TeacherSubjects)"
    Teacher ||--o{ TeacherClassSubject : "atribui"
    Class ||--o{ TeacherClassSubject : "atribui"
    Subject ||--o{ TeacherClassSubject : "atribui"

    School {
        string id PK
        string name
        string horarios "JSON: blocos de aula usados na última geração"
        datetime createdAt
        datetime updatedAt
    }
    Teacher {
        string id PK
        string name
        string restrictions "JSON: [{dia, hora}]"
        string schoolId FK
    }
    Subject {
        string id PK
        string name
        string sigla
        string schoolId FK
    }
    Class {
        string id PK
        string name
        string schoolId FK
    }
    TeacherClassSubject {
        string id PK
        string teacherId FK
        string classId FK
        string subjectId FK
        int aulas "aulas semanais"
    }
    Schedule {
        string id PK
        string name
        string data "JSON: grade[turma][dia][hora]"
        string schoolId FK
        datetime createdAt
    }
```

Observações:

- **`TeacherClassSubject`** é a "atribuição": a unidade de trabalho do gerador.
- **`Teacher.subjects`** (relação N:N) é informativa — filtra a lista de disciplinas na UI. É preenchida automaticamente ao criar uma atribuição.
- **Exclusões em cascata**: apagar escola, professor, turma ou disciplina apaga as atribuições ligadas.
- Campos JSON em `String` porque o SQLite não tem tipo JSON nativo no Prisma 5.

### Formatos JSON

**`Teacher.restrictions`**
```json
[{ "dia": "Segunda", "hora": "7h" }, { "dia": "Sexta", "hora": "11h05" }]
```

**`School.horarios`**
```json
["7h", "7h50", "8h40", "9h50", "10h40"]
```

**`Schedule.data`** — chaves: turma → dia → bloco; valor `"SIGLA (Professor)"` ou `"—"` (vago):
```json
{
  "6A": {
    "Segunda": { "7h": "MAT (Dani)", "7h50": "PORT (Juliana)", "8h40": "—" }
  }
}
```

Dias válidos: `Segunda`, `Terça`, `Quarta`, `Quinta`, `Sexta`.

---

## Frontend

```
frontend/src/
├── main.tsx                 # bootstrap do React
├── App.tsx                  # rotas (React Router) + DialogProvider
├── index.css                # Tailwind, tema (cor brand, fontes, animações), impressão
├── lib/
│   ├── api.ts               # api() helper, ApiError, DIAS, parseAula(), plural()
│   ├── types.ts             # tipos das respostas da API
│   ├── grade.ts             # grade por turma/professor, cores, exportação CSV
│   ├── hooks.ts             # useSchool() e useAction()
│   ├── dialogs.ts           # useDialogs(): confirm, prompt e toast
│   └── aiConfig.ts          # provedor + chave de IA no localStorage
├── pages/
│   ├── Schools.tsx          # lista de escolas
│   ├── SchoolLayout.tsx     # menu da escola + <Outlet> com a escola carregada
│   ├── SchoolHome.tsx       # visão geral: números e primeiros passos
│   ├── Teachers.tsx         # professores + tabela de restrições
│   ├── Subjects.tsx         # disciplinas
│   ├── Classes.tsx          # turmas + atribuições (+ MagicImport)
│   ├── Generate.tsx         # horários + geração da grade
│   └── Schedules.tsx        # histórico
└── components/
    ├── ui/index.tsx         # Button, Modal, Alert, Tabs, EmptyState, Field...
    ├── AppShell.tsx         # layout: menu lateral (gaveta no celular)
    ├── DialogProvider.tsx   # diálogos e toasts no lugar de alert/confirm/prompt
    ├── HorariosEditor.tsx   # editor de blocos de aula com modelos prontos
    ├── GradeView.tsx        # GradeView (tabelas, CSV, impressão) e GradeModal (tela cheia)
    ├── MagicImport.tsx      # painel de importação por IA
    └── AiConfigModal.tsx    # provedor + chave de IA
```

### Rotas

| Caminho | Tela |
|---|---|
| `/` | Lista de escolas |
| `/school/:schoolId` | Visão geral da escola |
| `/school/:schoolId/teachers` | Professores |
| `/school/:schoolId/subjects` | Disciplinas |
| `/school/:schoolId/classes` | Turmas + Importação Mágica |
| `/school/:schoolId/generate` | Gerar Nova Grade |
| `/school/:schoolId/schedules` | Histórico de Grades |

### Padrões

- **`api()`** em `lib/api.ts` centraliza `fetch`: prefixa `VITE_API_URL`, serializa `json`, converte erros em `ApiError` (com `status` e `data`) e dá uma mensagem amigável quando o backend está offline.
- **`SchoolLayout`** carrega a escola uma vez e a entrega às páginas via `<Outlet context>`; as páginas leem com **`useSchool()`** (nome, horários, contadores) e chamam `reloadSchool()` quando algo muda.
- **`useAction(refresh)`** executa uma mutação, mostra erro/sucesso em toast e recarrega a página e os contadores do menu.
- **Diálogos**: nada de `alert/confirm/prompt` do navegador — use `useDialogs()` (`confirm`, `prompt` com vários campos, `toast`).
- **Componentes de UI** em `components/ui`: use-os em vez de repetir classes Tailwind. A cor da marca é `brand-*` (definida em `index.css`).
- O item selecionado é guardado por **id** e derivado da lista, evitando dados desatualizados. O `Modal` fecha com Esc/clique fora e trava a rolagem do fundo.
- **Impressão**: `GradeModal` recebe a classe `print-root`; o CSS de `@media print` esconde o resto da página e quebra uma tabela por folha (A4 paisagem).

---

## Fluxo de geração da grade

```mermaid
sequenceDiagram
    participant UI as Generate.tsx
    participant API as POST /generate
    participant DB as Prisma/SQLite
    participant G as resolverGrade()

    UI->>API: { horarios: ["7h","8h",...] }
    API->>DB: salva School.horarios
    API->>DB: carregarMaterias(schoolId)
    API->>G: materias, horarios
    G->>G: indexa turmas, professores, aulas
    G->>G: verificador de viabilidade
    alt impossível
        G-->>API: GradeImpossivelError(problemas)
        API-->>UI: 422 { error, problemas[] }
    else viável
        G->>G: solução gulosa inicial
        G->>G: busca tabu até custo 0 ou tempo limite
        G-->>API: { grade, completa, conflitos, avisos, tempoMs }
        API-->>UI: 200 { ..., horarios }
    end
    UI->>UI: GradeModal + GradeView
```

---

## Fluxo da importação com IA

```mermaid
sequenceDiagram
    participant UI as MagicImport.tsx
    participant API as POST /ai-import
    participant AI as ai.ts
    participant P as Provedor (Gemini/Claude/Cohere)
    participant DB as Prisma (transação)

    UI->>API: multipart: provider, token, text?, image?
    API->>AI: processAiImport(...)
    AI->>P: systemPrompt + texto/imagem
    P-->>AI: JSON { materias: [...] }
    AI->>AI: extrairJson() + validação
    AI->>DB: $transaction
    loop cada matéria / professor / turma
        DB->>DB: encontra-ou-cria (sem duplicar)
        DB->>DB: mescla restrições, vincula professor↔disciplina
        DB->>DB: cria/atualiza atribuição
    end
    DB-->>AI: commit
    AI-->>API: resumo { disciplinas, professores, turmas, atribuicoes }
    API-->>UI: 200 { success, ...resumo }
```

---

## Decisões de projeto

| Decisão | Motivo |
|---|---|
| **SQLite + Prisma** | Zero configuração, roda offline, dados ficam na máquina do usuário. |
| **Gerador em função pura** | Testável isoladamente; o mesmo código roda na API e no script de seed. |
| **Gerador cede o event loop** (`setImmediate` a cada ~50 ms) | Gerações longas não travam outras requisições. |
| **Grade salva como "foto" JSON** | O histórico não muda quando cadastros mudam depois. |
| **Chave de IA no navegador** | O backend não armazena segredos; cada usuário usa a própria conta. |
| **Restrições ligadas ao *nome* do bloco** | Simples e flexível (aceita qualquer formato de horário). O preço é que renomear blocos invalida restrições — a UI e os avisos do gerador deixam isso visível. |

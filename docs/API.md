# 🔌 Referência da API

API REST do backend (`backend/src/index.ts`).

> ⬅️ [Voltar ao README](../README.md)

- **URL base:** `http://localhost:3001/api`
- **Formato:** JSON (`Content-Type: application/json`), exceto a importação por IA (`multipart/form-data`)
- **Autenticação:** nenhuma — a API foi pensada para uso local
- **CORS:** liberado para qualquer origem

## Sumário

| Recurso | Endpoints |
|---|---|
| [Escolas](#escolas) | `GET/POST /schools` · `GET/PUT/DELETE /schools/:id` |
| [Professores](#professores) | `GET/POST /schools/:schoolId/teachers` · `PUT/DELETE /teachers/:id` · `PUT /teachers/:id/restrictions` |
| [Disciplinas](#disciplinas) | `GET/POST /schools/:schoolId/subjects` · `PUT/DELETE /subjects/:id` |
| [Professor ↔ Disciplina](#professor--disciplina) | `POST/DELETE /teachers/:teacherId/subjects/:subjectId` |
| [Turmas](#turmas) | `GET/POST /schools/:schoolId/classes` · `PUT/DELETE /classes/:id` |
| [Atribuições](#atribuições-aulas) | `GET/POST /schools/:schoolId/lessons` · `PUT/DELETE /lessons/:id` |
| [Geração](#geração-da-grade) | `POST /schools/:schoolId/generate` |
| [Histórico](#histórico-de-grades) | `GET/POST /schools/:schoolId/schedules` · `PUT/DELETE /schedules/:id` |
| [Importação IA](#importação-com-ia) | `POST /schools/:schoolId/ai-import` |

---

## Erros

Todas as falhas retornam:

```json
{ "error": "Mensagem legível em português" }
```

| Status | Quando |
|---|---|
| `400` | Campo obrigatório vazio, valor inválido, IDs de outra escola, falha da IA, imagem > 10 MB |
| `404` | Registro não encontrado |
| `422` | Grade impossível (inclui `problemas: string[]`) |
| `500` | Erro inesperado (detalhes no console do servidor) |

---

## Escolas

### `GET /schools`

Lista as escolas (mais antigas primeiro) com contagens.

```json
[
  {
    "id": "6f1c…",
    "name": "Escola Turno Manhã",
    "horarios": "[\"7h\",\"8h\"]",
    "createdAt": "2026-10-08T12:00:00.000Z",
    "updatedAt": "2026-10-08T12:00:00.000Z",
    "_count": { "teachers": 17, "classes": 8, "subjects": 10, "schedules": 2 }
  }
]
```

### `POST /schools`

```json
{ "name": "Escola Nova" }
```

Retorna a escola criada.

### `GET /schools/:id`

Retorna a escola com `horarios` **já como array** (padrão `["7h","8h","9h","10h","11h"]` se nunca gerou grade).

```json
{ "id": "6f1c…", "name": "Escola Nova", "horarios": ["7h", "8h", "9h", "10h", "11h"], "…": "…" }
```

### `PUT /schools/:id`

Campos opcionais:

```json
{ "name": "Novo nome", "horarios": ["7h", "7h50", "8h40"] }
```

### `DELETE /schools/:id`

Exclui a escola e **todos** os dados ligados a ela. → `{ "success": true }`

---

## Professores

### `GET /schools/:schoolId/teachers`

Ordenados por nome. Inclui disciplinas vinculadas e o total de aulas atribuídas.

```json
[
  {
    "id": "a1…",
    "name": "Dani",
    "schoolId": "6f1c…",
    "restrictions": "[{\"dia\":\"Segunda\",\"hora\":\"7h\"}]",
    "subjects": [{ "id": "m1…", "name": "Matemática", "sigla": "MAT", "schoolId": "6f1c…" }],
    "totalAulas": 20
  }
]
```

> `restrictions` é uma **string JSON** (`[{ dia, hora }]`).

### `POST /schools/:schoolId/teachers`

```json
{ "name": "Maria", "restrictions": [{ "dia": "Terça", "hora": "7h" }] }
```

`restrictions` é opcional; aceita array ou string JSON.

### `PUT /teachers/:teacherId`

Renomeia. → `{ "name": "Maria Silva" }`

### `PUT /teachers/:teacherId/restrictions`

Substitui **todas** as restrições:

```json
{ "restrictions": [{ "dia": "Segunda", "hora": "7h" }, { "dia": "Sexta", "hora": "11h" }] }
```

Dias válidos: `Segunda`, `Terça`, `Quarta`, `Quinta`, `Sexta`. A `hora` deve ser igual ao nome de um bloco de aula.

### `DELETE /teachers/:teacherId`

Exclui o professor e suas atribuições.

---

## Disciplinas

### `GET /schools/:schoolId/subjects`

Ordenadas por nome, com `teachers` vinculados.

### `POST /schools/:schoolId/subjects`

```json
{ "name": "Matemática", "sigla": "mat" }
```

A sigla é salva em maiúsculas (`MAT`).

### `PUT /subjects/:subjectId`

```json
{ "name": "Matemática", "sigla": "MAT" }
```

Ambos obrigatórios.

### `DELETE /subjects/:subjectId`

Exclui a disciplina e suas atribuições.

---

## Professor ↔ Disciplina

Vínculo informativo (filtra opções na interface).

| Método | Rota | Efeito |
|---|---|---|
| `POST` | `/teachers/:teacherId/subjects/:subjectId` | Vincula |
| `DELETE` | `/teachers/:teacherId/subjects/:subjectId` | Desvincula |

---

## Turmas

### `GET /schools/:schoolId/classes`

Ordenadas por nome.

### `POST /schools/:schoolId/classes`

```json
{ "name": "6º A" }
```

### `PUT /classes/:classId`

```json
{ "name": "6º Ano A" }
```

### `DELETE /classes/:classId`

Exclui a turma e suas atribuições.

---

## Atribuições (aulas)

Uma atribuição diz: *"professor X dá N aulas semanais de Y na turma Z"*.

### `GET /schools/:schoolId/lessons`

```json
[
  {
    "id": "l1…",
    "teacherId": "a1…", "classId": "c1…", "subjectId": "m1…",
    "aulas": 5,
    "teacher": { "id": "a1…", "name": "Dani", "…": "…" },
    "class":   { "id": "c1…", "name": "6A", "…": "…" },
    "subject": { "id": "m1…", "name": "Matemática", "sigla": "MAT", "…": "…" }
  }
]
```

### `POST /schools/:schoolId/lessons`

```json
{ "teacherId": "a1…", "classId": "c1…", "subjectId": "m1…", "aulas": 5 }
```

- `aulas` deve ser inteiro ≥ 1.
- Professor, turma e disciplina precisam pertencer à escola (senão `400`).
- Se a combinação já existe, as aulas são **somadas** à existente.
- Vincula automaticamente o professor à disciplina.

### `PUT /lessons/:id`

```json
{ "aulas": 4 }
```

### `DELETE /lessons/:id`

---

## Geração da grade

### `POST /schools/:schoolId/generate`

```json
{ "horarios": ["7h", "7h50", "8h40", "9h50", "10h40"] }
```

`horarios` é opcional (padrão `["7h","8h","9h","10h","11h"]`) e fica salvo em `School.horarios`.

**200 — grade gerada**

```json
{
  "grade": {
    "6A": {
      "Segunda": { "7h": "MAT (Dani)", "7h50": "PORT (Juliana)", "8h40": "—", "…": "…" },
      "Terça":   { "…": "…" }
    }
  },
  "completa": true,
  "conflitos": [],
  "avisos": ["Restrição de João (Segunda 6h) não corresponde a nenhum horário configurado e foi ignorada."],
  "tempoMs": 8,
  "horarios": ["7h", "7h50", "8h40", "9h50", "10h40"]
}
```

| Campo | Significado |
|---|---|
| `grade` | `grade[turma][dia][hora]` = `"SIGLA (Professor)"` ou `"—"` |
| `completa` | `true` se não há choques nem aulas em horários bloqueados |
| `conflitos` | Problemas rígidos que sobraram (normalmente vazio) |
| `avisos` | Preferências não atendidas e dados suspeitos |
| `tempoMs` | Tempo de cálculo |

**422 — grade impossível**

```json
{
  "error": "Não é possível montar a grade com os dados atuais.",
  "problemas": [
    "A turma 6A tem 32 aulas, mas a semana só tem 30 horários.",
    "João precisa dar 24 aulas, mas só tem 20 horários disponíveis na semana."
  ]
}
```

Detalhes do algoritmo em [GERADOR.md](GERADOR.md).

---

## Histórico de grades

### `GET /schools/:schoolId/schedules`

Mais recentes primeiro. `data` é a grade em **string JSON**.

```json
[{ "id": "g1…", "name": "Grade 2026", "data": "{\"6A\":{…}}", "schoolId": "6f1c…", "createdAt": "…" }]
```

### `POST /schools/:schoolId/schedules`

```json
{ "name": "Grade 2026 — versão final", "data": "{\"6A\":{…}}" }
```

`data` pode ser string JSON ou objeto.

### `PUT /schedules/:id`

```json
{ "name": "Novo nome" }
```

### `DELETE /schedules/:id`

---

## Importação com IA

### `POST /schools/:schoolId/ai-import`

`multipart/form-data`:

| Campo | Obrigatório | Descrição |
|---|---|---|
| `provider` | sim | `gemini`, `claude` ou `cohere` |
| `token` | sim | API key do provedor |
| `text` | um dos dois | Texto livre descrevendo professores, turmas, cargas e restrições |
| `image` | um dos dois | Imagem (máx. 10 MB). Claude: JPG/PNG/GIF/WEBP. Cohere: não suporta |

**200**

```json
{ "success": true, "disciplinas": 2, "professores": 3, "turmas": 4, "atribuicoes": 9 }
```

Os números de `disciplinas`, `professores` e `turmas` contam **apenas os criados**; `atribuicoes` conta todas as processadas (criadas ou atualizadas). A gravação é atômica.

Exemplo com `curl`:

```bash
curl -X POST http://localhost:3001/api/schools/<id>/ai-import \
  -F provider=gemini \
  -F token=$GEMINI_API_KEY \
  -F "text=João dá Matemática, 5 aulas no 6A. Não pode segunda às 7h." \
  -F image=@horarios.jpg
```

---

## Exemplo completo (JavaScript)

```js
const API = 'http://localhost:3001/api';
const post = (path, body) =>
  fetch(API + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    .then(r => r.json());

const escola = await post('/schools', { name: 'Demo' });
const prof   = await post(`/schools/${escola.id}/teachers`, { name: 'Ana' });
const mat    = await post(`/schools/${escola.id}/subjects`, { name: 'Matemática', sigla: 'MAT' });
const turma  = await post(`/schools/${escola.id}/classes`, { name: '6A' });
await post(`/schools/${escola.id}/lessons`, { teacherId: prof.id, classId: turma.id, subjectId: mat.id, aulas: 5 });

const { grade, completa } = await post(`/schools/${escola.id}/generate`, { horarios: ['7h', '8h', '9h'] });
console.log(completa, grade['6A']);
```

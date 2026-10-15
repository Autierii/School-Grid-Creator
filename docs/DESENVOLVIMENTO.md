# 🛠️ Guia de Desenvolvimento

Tudo o que você precisa para rodar, modificar e contribuir com o projeto.

> ⬅️ [Voltar ao README](../README.md)

## Sumário

- [Ambiente](#ambiente)
- [Scripts](#scripts)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Banco de dados](#banco-de-dados)
- [Dados de exemplo](#dados-de-exemplo)
- [Testes](#testes)
- [Convenções de código](#convenções-de-código)
- [Receitas](#receitas)
- [Checklist antes do commit](#checklist-antes-do-commit)
- [Solução de problemas](#solução-de-problemas)

---

## Ambiente

| Ferramenta | Versão |
|---|---|
| Node.js | 20.19+ ou 22.12+ (exigência do Vite 8; testado no 24) |
| npm | o que vem com o Node |
| Editor | VS Code recomendado (TypeScript + Tailwind IntelliSense) |

Na raiz do projeto:

```bash
npm run setup   # instala tudo e cria o banco SQLite
npm run dev     # sobe API (:3001) e interface (:5173) juntas
```

- O backend recarrega sozinho ao salvar arquivos (`nodemon` + `ts-node`).
- O frontend tem hot reload (Vite).
- Prefere terminais separados? `npm run dev` dentro de `backend/` e de `frontend/` também funciona.

---

## Scripts

### Raiz (`package.json`)

| Comando | O que faz |
|---|---|
| `npm run setup` | `npm install` na raiz, no backend e no frontend + `db:push` |
| `npm run dev` | Backend e frontend juntos (via `concurrently`) |
| `npm run seed` | Cria a escola de exemplo |
| `npm test` | Testes do gerador |
| `npm run check` | Tudo o que o CI deveria rodar: tipos, testes, lint e build |

### Backend (`backend/package.json`)

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor em modo desenvolvimento em `:3001` |
| `npm test` | Testes (`node:test`) em `tests/` |
| `npm run typecheck` | Verifica tipos sem gerar arquivos |
| `npm run build` | Compila para `dist/` |
| `npm start` | Roda a versão compilada (`dist/src/index.js`) |
| `npm run seed` | Escola de exemplo (`scripts/seed.ts`) |
| `npm run db:push` | Sincroniza o banco com o `schema.prisma` |
| `npm run db:studio` | Interface web para ver/editar o banco |

### Frontend (`frontend/package.json`)

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor Vite em `:5173` |
| `npm run build` | Checagem de tipos (`tsc -b`) + build de produção em `dist/` |
| `npm run preview` | Serve o build de produção |
| `npm run lint` | Oxlint |

---

## Variáveis de ambiente

Tudo é opcional. Há modelos prontos em `backend/.env.example` e `frontend/.env.example`.

**Backend** — copie para `backend/.env` (lido automaticamente na inicialização, já está no `.gitignore`):

| Variável | Padrão | Descrição |
|---|---|---|
| `PORT` | `3001` | Porta HTTP |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Modelo do Gemini na importação |
| `CLAUDE_MODEL` | `claude-opus-5-5` | Modelo do Claude na importação |
| `COHERE_MODEL` | `command-a-03-2025` | Modelo do Cohere na importação |

**Frontend** — copie para `frontend/.env.local`:

```env
VITE_API_URL=http://localhost:3001/api
```

> As **chaves** de IA não ficam em variáveis de ambiente: cada usuário informa a sua em *Configurações de IA*, e ela fica só no navegador.

---

## Banco de dados

- SQLite em `backend/prisma/dev.db` (**não versionado**).
- O schema fica em `backend/prisma/schema.prisma` — veja o diagrama em [ARQUITETURA.md](ARQUITETURA.md#modelo-de-dados).

### Alterando o schema

1. Edite `schema.prisma`.
2. **Pare o backend** (no Windows, o servidor rodando trava o arquivo do Prisma Client e o `generate` falha com `EPERM`).
3. Rode `npm run db:push` em `backend/` — sincroniza o banco e regera o client.
4. Suba o backend de novo.

> O projeto usa `db push` (sem migrations) por ser um app local. Mudanças destrutivas (remover/renomear colunas) podem apagar dados: faça backup do `dev.db` antes.

### Resetar o banco

```bash
cd backend
rm prisma/dev.db        # PowerShell: Remove-Item prisma/dev.db
npm run db:push
```

---

## Dados de exemplo

```bash
npm run seed
```

Cria a **Escola Exemplo (Turno Manhã)**: 8 turmas (6A–9B), 10 disciplinas, 17 professores, 6 blocos de aula e dezenas de restrições — e já roda o gerador para confirmar que existe solução. Rodar de novo **substitui** a escola de exemplo anterior (as outras escolas não são tocadas).

---

## Testes

```bash
npm test
```

Os testes ficam em `backend/tests/` e usam o runner nativo do Node (`node:test`) com `ts-node`, sem dependências extras. Cobrem o gerador: cargas corretas por turma, ausência de choques de professor, horários bloqueados, avisos e os erros do verificador de viabilidade.

O gerador é uma função pura, então novos casos são fáceis de escrever:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolverGrade } from '../src/generator';

test('meu caso', async () => {
  const r = await resolverGrade([
    {
      id: 'mat', sigla: 'MAT',
      professores: [{
        id: 'p1', nome: 'Ana',
        indisponibilidades: [{ dia: 'Segunda', hora: '7h' }],
        turmas: [{ id: 't1', nome: '6A', aulas: 4 }],
      }],
    },
  ], ['7h', '8h']);
  assert.equal(r.completa, true);
});
```

---

## Convenções de código

- **Idioma:** interface, mensagens de erro e domínio em **português** (`turma`, `aulas`, `horarios`); infraestrutura pode ficar em inglês (`fetchData`, `handleDelete`), como no código existente.
- **TypeScript estrito** nos dois projetos. O frontend usa `erasableSyntaxOnly` — **não** use *parameter properties* (`constructor(public x)`) nem `enum`.
- **Backend:**
  - uma rota nova vai no arquivo de `src/routes/` do recurso (ou num novo router registrado em `app.ts`);
  - lance `HttpError(status, 'mensagem')` para erros esperados — o `errorHandler` cuida da resposta;
  - valide entradas com os helpers de `src/http.ts` (`texto`, `quantidadeAulas`, `listaHorarios`…);
  - use o `prisma` exportado de `src/db.ts` (não crie outro `PrismaClient`).
- **Frontend:**
  - chame a API sempre pelo helper `api()` de `src/lib/api.ts`;
  - use os componentes de `components/ui` (Button, Modal, Alert, EmptyState…) em vez de repetir classes;
  - nada de `alert/confirm/prompt`: use `useDialogs()`;
  - mutações via `useAction(refresh)` (toast de erro/sucesso + recarga automática);
  - guarde o item selecionado por **id** e derive o objeto da lista;
  - cores: `brand` (marca/ações), `amber` (restrições), `emerald` (sucesso), `red` (erro), `violet`/`fuchsia` (IA).

---

## Receitas

### Adicionar um endpoint

```ts
// backend/src/routes/classes.ts
classesRouter.put('/classes/:classId', async (req, res) => {
  const cls = await prisma.class.update({
    where: { id: req.params.classId },
    data: { name: texto(req.body.name, 'nome') },
  });
  res.json(cls);
});
```

Sem `try/catch`: erros chegam ao `errorHandler` automaticamente (Express 5).

### Consumir no frontend

```tsx
const run = useAction(fetchData);

run(() => api(`/classes/${id}`, { method: 'PUT', json: { name } }), 'Turma renomeada.');
```

### Adicionar uma tela da escola

1. Crie `frontend/src/pages/MinhaTela.tsx` (use `useSchool()` para pegar a escola aberta).
2. Registre a rota em `App.tsx`, dentro de `/school/:schoolId`: `<Route path="minha-tela" element={<MinhaTela />} />`.
3. Adicione o item no menu em `SchoolLayout.tsx`: `<NavItem to={`${base}/minha-tela`} icon={…} label="Minha tela" />`.

### Adicionar uma restrição ao gerador

Veja [GERADOR.md → Limitações e evoluções](GERADOR.md#limitações-e-evoluções). Acrescente um teste em `backend/tests/`.

### Trocar o modelo de IA

Sem código: defina `GEMINI_MODEL`, `CLAUDE_MODEL` ou `COHERE_MODEL` no `backend/.env`. O prompt do sistema está em `backend/src/ai.ts` (`systemPrompt`).

---

## Checklist antes do commit

```bash
npm run check
```

- [ ] Tipos, testes, lint e build passando
- [ ] Se mexeu no gerador: `npm run seed` ainda termina com "✅ Grade sem conflitos"
- [ ] Se mexeu no schema: `npm run db:push` e anote no PR
- [ ] Documentação atualizada (`docs/`)

---

## Solução de problemas

| Problema | Solução |
|---|---|
| `EPERM … query_engine` ao rodar `prisma db push`/`generate` | Pare o backend (ele trava a DLL do Prisma no Windows) e rode de novo. |
| `The table … does not exist` | Rode `npm run db:push` em `backend/`. |
| Porta 3001/5173 em uso | Encerre o processo antigo ou mude `PORT` no `backend/.env` / `npx vite --port …`. |
| Frontend: *"Não foi possível conectar ao servidor"* | Backend fora do ar ou `VITE_API_URL` errado. |
| Avisos `LF will be replaced by CRLF` no git | Inofensivos no Windows. |

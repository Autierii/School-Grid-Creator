# 🛠️ Guia de Desenvolvimento

Tudo o que você precisa para rodar, modificar e contribuir com o projeto.

> ⬅️ [Voltar ao README](../README.md)

## Sumário

- [Ambiente](#ambiente)
- [Scripts](#scripts)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Banco de dados](#banco-de-dados)
- [Dados de exemplo](#dados-de-exemplo)
- [Testando o gerador isoladamente](#testando-o-gerador-isoladamente)
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

```bash
# backend
cd backend && npm install && npx prisma db push && npm run dev

# frontend (outro terminal)
cd frontend && npm install && npm run dev
```

- O backend recarrega sozinho ao salvar arquivos (`nodemon` + `ts-node`).
- O frontend tem hot reload (Vite).

---

## Scripts

### Backend (`backend/package.json`)

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor em modo desenvolvimento em `:3001` |
| `npm run typecheck` | Verifica tipos sem gerar arquivos |
| `npm run build` | Compila para `dist/` |
| `npm start` | Roda a versão compilada (`dist/src/index.js`) |
| `npx prisma db push` | Sincroniza o banco com o `schema.prisma` |
| `npx prisma studio` | Interface web para ver/editar o banco |

### Frontend (`frontend/package.json`)

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor Vite em `:5173` |
| `npm run build` | Checagem de tipos (`tsc -b`) + build de produção em `dist/` |
| `npm run preview` | Serve o build de produção |
| `npm run lint` | Oxlint |

---

## Variáveis de ambiente

**Backend** (defina no shell ou num `.env` — já está no `.gitignore`):

| Variável | Padrão | Descrição |
|---|---|---|
| `PORT` | `3001` | Porta HTTP |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Modelo do Gemini na importação |
| `CLAUDE_MODEL` | `claude-opus-5-5` | Modelo do Claude na importação |
| `COHERE_MODEL` | `command-a-03-2025` | Modelo do Cohere na importação |

> O `ts-node` não carrega `.env` sozinho. No PowerShell: `$env:PORT=4000; npm run dev`. No bash: `PORT=4000 npm run dev`.

**Frontend** (arquivo `frontend/.env.local`):

```env
VITE_API_URL=http://localhost:3001/api
```

---

## Banco de dados

- SQLite em `backend/prisma/dev.db` (**não versionado**).
- O schema fica em `backend/prisma/schema.prisma` — veja o diagrama em [ARQUITETURA.md](ARQUITETURA.md#modelo-de-dados).

### Alterando o schema

1. Edite `schema.prisma`.
2. **Pare o backend** (no Windows, o servidor rodando trava o arquivo do Prisma Client e o `generate` falha com `EPERM`).
3. Rode `npx prisma db push` — sincroniza o banco e regera o client.
4. Suba o backend de novo.

> O projeto usa `db push` (sem migrations) por ser um app local. Mudanças destrutivas (remover/renomear colunas) podem apagar dados: faça backup do `dev.db` antes.

### Resetar o banco

```bash
cd backend
rm prisma/dev.db        # PowerShell: Remove-Item prisma/dev.db
npx prisma db push
```

---

## Dados de exemplo

```bash
cd backend
npx ts-node create_complex_school.ts     # cria "Escola Turno Manhã (Complexa)" e gera grade-final.json
node save_complex_schedule.js            # (opcional) salva grade-final.json no histórico da escola
```

A escola de exemplo tem 8 turmas (6A–9B), 10 disciplinas, 17 professores e 6 blocos de aula (`7h - 7h45min`, …), com várias restrições. É um bom caso de teste realista para o gerador.

> Rodar o seed duas vezes cria **duas** escolas com o mesmo nome.

`test-api.js` é um roteiro manual que exercita a API (cria escola, professores etc.). Rode com o backend no ar: `node test-api.js`.

---

## Testando o gerador isoladamente

O gerador é uma função pura, então dá para testá-lo sem servidor. Crie um arquivo temporário em `backend/`:

```ts
// teste-gerador.ts
import { resolverGrade, MateriaReq } from './src/generator';

const materias: MateriaReq[] = [
  {
    id: 'mat', sigla: 'MAT',
    professores: [{
      id: 'p1', nome: 'Ana',
      indisponibilidades: [{ dia: 'Segunda', hora: '7h' }],
      turmas: [{ id: 't1', nome: '6A', aulas: 4 }, { id: 't2', nome: '6B', aulas: 4 }],
    }],
  },
];

resolverGrade(materias, ['7h', '8h']).then(r => {
  console.log(r.completa, r.conflitos, r.avisos, `${r.tempoMs}ms`);
  console.table(r.grade['6A']);
});
```

```bash
npx ts-node teste-gerador.ts
```

Ou com dados reais do banco:

```ts
import { prisma } from './src/db';
import { carregarMaterias } from './src/school-data';
import { resolverGrade } from './src/generator';

(async () => {
  const escola = await prisma.school.findFirstOrThrow();
  const r = await resolverGrade(await carregarMaterias(prisma, escola.id), ['7h', '8h', '9h', '10h', '11h']);
  console.log(r.completa, r.conflitos);
  await prisma.$disconnect();
})();
```

---

## Convenções de código

- **Idioma:** interface, mensagens de erro e domínio em **português** (`turma`, `aulas`, `horarios`); infraestrutura pode ficar em inglês (`fetchData`, `handleDelete`), como no código existente.
- **TypeScript estrito** nos dois projetos. O frontend usa `erasableSyntaxOnly` — **não** use *parameter properties* (`constructor(public x)`) nem `enum`.
- **Backend:**
  - lance `HttpError(status, 'mensagem')` para erros esperados — o middleware cuida da resposta;
  - valide campos de texto com `texto(valor, 'campo')`;
  - use o `prisma` exportado de `src/db.ts` (não crie outro `PrismaClient`).
- **Frontend:**
  - chame a API sempre pelo helper `api()` de `src/api.ts`;
  - guarde o item selecionado por **id** e derive o objeto da lista;
  - estilos com classes Tailwind; cores principais `indigo` (ações), `amber` (restrições), `emerald` (sucesso), `red` (erro), `violet` (IA).

---

## Receitas

### Adicionar um endpoint

```ts
// backend/src/index.ts
app.put('/api/classes/:classId', async (req, res) => {
  const cls = await prisma.class.update({
    where: { id: req.params.classId },
    data: { name: texto(req.body.name, 'nome') },
  });
  res.json(cls);
});
```

Sem `try/catch`: erros chegam ao middleware de erro automaticamente (Express 5).

### Consumir no frontend

```ts
import { api } from '../api';

await api(`/classes/${id}`, { method: 'PUT', json: { name } });
```

### Adicionar uma tela

1. Crie `frontend/src/pages/MinhaTela.tsx`.
2. Registre a rota em `SchoolDashboard` (`App.tsx`): `<Route path="minha-tela" element={<MinhaTela />} />`.
3. Adicione o item no menu: `<SidebarItem to={`/school/${schoolId}/minha-tela`} … />`.

### Adicionar uma restrição ao gerador

Veja [GERADOR.md → Limitações e evoluções](GERADOR.md#limitações-e-evoluções).

### Trocar o modelo de IA

Sem código: defina `GEMINI_MODEL`, `CLAUDE_MODEL` ou `COHERE_MODEL`. O prompt do sistema está em `backend/src/ai.ts` (`systemPrompt`).

---

## Checklist antes do commit

```bash
cd backend  && npm run typecheck
cd ../frontend && npm run build && npm run lint
```

- [ ] Backend sem erros de tipo
- [ ] Frontend compila e lint sem avisos
- [ ] Se mexeu no gerador: rode-o com a escola de exemplo e confirme `completa: true`
- [ ] Se mexeu no schema: `npx prisma db push` e anote no PR
- [ ] Documentação atualizada (`docs/`)

---

## Solução de problemas

| Problema | Solução |
|---|---|
| `EPERM … query_engine` ao rodar `prisma db push`/`generate` | Pare o backend (ele trava a DLL do Prisma no Windows) e rode de novo. |
| `The table … does not exist` | Rode `npx prisma db push`. |
| Porta 3001/5173 em uso | Encerre o processo antigo ou use `PORT=…` / `npx vite --port …`. |
| Frontend: *"Não foi possível conectar ao servidor"* | Backend fora do ar ou `VITE_API_URL` errado. |
| `tsc` reclama de `prisma.config.ts` | Esse arquivo é só para ferramentas de agentes de IA e está excluído do `tsconfig`; não o inclua. |
| Avisos `LF will be replaced by CRLF` no git | Inofensivos no Windows. |

# 🏫 School Grid Creator (SaaS)

Um poderoso sistema de criação e otimização de grades horárias escolares, desenhado com uma arquitetura moderna (Frontend e Backend desacoplados). Este projeto não apenas calcula e resolve o quebra-cabeça complexo de horários de aulas (usando *busca tabu* orientada a conflitos, que resolve escolas inteiras em milissegundos), mas também integra o poder da **Inteligência Artificial Multimodal** para ler imagens e textos e preencher automaticamente todos os cadastros!

---

## 🚀 Funcionalidades

- **Multi-escolas (SaaS)**: Gerencie os horários de várias escolas em um único painel.
- **Gerador de Grade**: Aloca as aulas na semana sem choques de professores, respeitando os horários bloqueados de cada um e evitando mais de 2 aulas da mesma matéria no mesmo dia.
- **Verificador de Viabilidade**: Antes de gerar, avisa exatamente o que torna a grade impossível (ex: professor com mais aulas do que horários livres).
- **Visualização por Turma ou por Professor**, com exportação para CSV (abre no Excel) e impressão.
- **Restrições em Grade Clicável**: Marque os horários bloqueados de cada professor clicando numa tabela.
- **Histórico de Grades**: Salve, renomeie e reabra grades geradas.
- **✨ Importação Mágica de IA**: Fotografe uma tabela de horários ou copie um texto das regras escolares e envie para a aplicação. A plataforma usará **Google Gemini**, **Claude** ou **Cohere** para entender a imagem/texto e preencher automaticamente o banco de dados (Professores, Turmas, Matérias e Restrições).
- **Interface Dark Mode Premium**: Construída do zero com React, Tailwind CSS v4 e Lucide React.
- **Persistência Segura**: Os dados ficam salvos em um banco de dados local SQLite, garantindo privacidade e velocidade de carregamento (sem necessidade de internet).

---

## 🛠️ Tecnologias Utilizadas

### Frontend (`/frontend`)
- **React 19** (com Vite)
- **TypeScript**
- **Tailwind CSS v4** (Design moderno e responsivo)
- **React Router DOM** (Navegação dinâmica)
- **Lucide React** (Ícones incríveis)

### Backend (`/backend`)
- **Node.js** com **Express**
- **TypeScript**
- **Prisma ORM** (Gestão do banco de dados)
- **SQLite** (Banco de dados de zero-configuração)
- **SDKs de Inteligência Artificial** (`@google/generative-ai`, `@anthropic-ai/sdk`)
- **Multer** (Processamento de uploads de imagens)

---

## ⚙️ Como Rodar na Sua Máquina (Passo a Passo)

Como a aplicação é dividida em duas partes, você precisará inicializar tanto o **Backend** (Servidor e Banco de dados) quanto o **Frontend** (A tela interativa no navegador).

### 1️⃣ Preparando e Rodando o Backend

O backend é o cérebro da operação. Ele salva os dados e roda o algoritmo pesado da geração.

1. Abra o seu terminal e entre na pasta do backend:
   ```bash
   cd backend
   ```
2. Instale todas as dependências necessárias:
   ```bash
   npm install
   ```
3. Prepare o banco de dados local (SQLite):
   ```bash
   npx prisma db push
   ```
   *(Isso criará o arquivo `dev.db` onde tudo ficará salvo com segurança).*
4. Inicie o servidor:
   ```bash
   npm run dev
   ```
   O terminal dirá: `Server running on http://localhost:3001` 🎉

---

### 2️⃣ Preparando e Rodando o Frontend

Com o backend rodando (deixe aquele terminal aberto), abra uma **nova aba de terminal** para iniciarmos a interface visual.

1. Acesse a pasta do frontend:
   ```bash
   cd frontend
   ```
2. Instale as dependências visuais:
   ```bash
   npm install
   ```
3. Inicie o painel da web:
   ```bash
   npm run dev
   ```
   O terminal dirá: `Local: http://localhost:5173/` 🚀

---

### ⚙️ Variáveis de ambiente (opcionais)

| Onde | Variável | Padrão |
|---|---|---|
| backend | `PORT` | `3001` |
| backend | `GEMINI_MODEL` / `CLAUDE_MODEL` / `COHERE_MODEL` | `gemini-2.5-flash` / `claude-opus-5-5` / `command-a-03-2025` |
| frontend | `VITE_API_URL` | `http://localhost:3001/api` |

---

### 3️⃣ Acessando a Aplicação
Abra o seu navegador de preferência e acesse o endereço:
👉 **[http://localhost:5173](http://localhost:5173)**

---

## 🪄 Como usar a Importação Mágica (IA)

1. Acesse uma escola criada no sistema e clique em **"Configurações de IA"** no menu lateral.
2. Selecione a IA que deseja utilizar (Recomendamos o **Google Gemini** para processar imagens).
3. Cole sua própria **API Key** do provedor escolhido (Fique tranquilo, o código a salva apenas no seu navegador, via `localStorage`).
4. Clique em "Salvar".
5. Navegue até a tela **"Turmas"**, abra o painel **"Importação Mágica com IA"** e faça upload de uma foto de horário ou digite as regras dos professores na caixinha mágica.
6. Clique em **"Processar Dados"**. Em segundos a tabela e os professores serão criados sozinhos! 🪄

---
*Desenvolvido com ❤️ utilizando as mais novas práticas de desenvolvimento Full Stack.*

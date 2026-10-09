import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from './db';
import { parseRestricoes } from './school-data';

// Modelos podem ser trocados por variável de ambiente sem mexer no código.
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-opus-5-5';
const COHERE_MODEL = process.env.COHERE_MODEL || 'command-a-03-2025';

const systemPrompt = `Você é um assistente de IA focado em estruturar informações de horários escolares.
Seu objetivo é ler o texto ou imagem fornecida pelo usuário e extrair os Professores, suas Restrições de Horário (indisponibilidades), as Matérias e as Turmas que eles lecionam, bem como a quantidade de aulas semanais.
Devolva ESTRITAMENTE um JSON no seguinte formato, e nada mais:

{
  "materias": [
    {
      "sigla": "MAT",
      "nome": "Matemática",
      "professores": [
        {
          "nome": "João",
          "indisponibilidades": [
            { "dia": "Segunda", "hora": "7h" },
            { "dia": "Terça", "hora": "8h" }
          ],
          "turmas": [
            { "nome": "1º ANO A", "aulas": 5 },
            { "nome": "2º ANO B", "aulas": 3 }
          ]
        }
      ]
    }
  ]
}

Regras:
- "dia" deve ser exatamente um destes: Segunda, Terça, Quarta, Quinta, Sexta.
- Se a informação não for explícita (ex: se não houver restrição), retorne um array vazio [].
- A quantidade de aulas padrão caso não informada deve ser 1.
- Use sempre a mesma sigla para a mesma matéria e o mesmo nome para o mesmo professor/turma.
Retorne apenas o JSON.`;

const DIAS_VALIDOS = new Set(['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta']);
const CLAUDE_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;

async function callCohere(text: string, token: string) {
  const response = await fetch('https://api.cohere.ai/v2/chat', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      model: COHERE_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    }),
  });
  if (!response.ok) throw new Error(`Falha no Cohere (${response.status}): ${await response.text()}`);
  const data = await response.json();
  const textObj = data.message?.content?.find((c: any) => c.type === 'text');
  return textObj ? textObj.text : '{}';
}

async function callClaude(text: string, token: string, imageBuffer?: Buffer, mimeType?: string) {
  const client = new Anthropic({ apiKey: token });
  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  if (imageBuffer && mimeType) {
    const mediaType = CLAUDE_MEDIA_TYPES.find(t => t === mimeType);
    if (!mediaType) throw new Error('Formato de imagem não suportado. Use JPG, PNG, GIF ou WEBP.');
    content.push({ type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBuffer.toString('base64') } });
  }
  content.push({ type: 'text', text: text || 'Extraia os dados de horário escolar da imagem.' });

  // `fallbacks: "default"` faz a API repetir a chamada em outro modelo caso esta seja recusada.
  const msg = await client.beta.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 16000,
    system: systemPrompt,
    messages: [{ role: 'user', content }],
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
  });
  if (msg.stop_reason === 'refusal') throw new Error('O Claude recusou processar este conteúdo.');
  if (msg.stop_reason === 'max_tokens') throw new Error('A resposta da IA ficou grande demais. Tente enviar menos dados por vez.');
  return msg.content.map(b => (b.type === 'text' ? b.text : '')).join('');
}

async function callGemini(text: string, token: string, imageBuffer?: Buffer, mimeType?: string) {
  const genAI = new GoogleGenerativeAI(token);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: systemPrompt,
    generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
  });
  const parts: any[] = [];
  if (text) parts.push(text);
  if (imageBuffer && mimeType) parts.push({ inlineData: { data: imageBuffer.toString('base64'), mimeType } });
  const result = await model.generateContent(parts);
  return result.response.text();
}

function extrairJson(resposta: string) {
  const semCodeBlock = resposta.replace(/```(?:json)?\s*([\s\S]*?)\s*```/i, '$1').trim();
  const inicio = semCodeBlock.indexOf('{');
  const fim = semCodeBlock.lastIndexOf('}');
  try {
    return JSON.parse(inicio >= 0 && fim > inicio ? semCodeBlock.slice(inicio, fim + 1) : semCodeBlock);
  } catch {
    throw new Error('A IA não retornou um JSON válido. Tente novamente ou reformule o texto.');
  }
}

export async function processAiImport(
  schoolId: string,
  provider: string,
  token: string,
  text: string,
  imageBuffer?: Buffer,
  mimeType?: string
) {
  if (!text && !imageBuffer) throw new Error('Forneça um texto ou uma imagem.');

  let resposta: string;
  if (provider === 'gemini') resposta = await callGemini(text, token, imageBuffer, mimeType);
  else if (provider === 'claude') resposta = await callClaude(text, token, imageBuffer, mimeType);
  else if (provider === 'cohere') {
    if (imageBuffer) throw new Error('Cohere está configurado apenas para texto. Use Gemini ou Claude para imagens.');
    resposta = await callCohere(text, token);
  } else {
    throw new Error('Provedor não suportado');
  }

  const parsed = extrairJson(resposta);
  if (!Array.isArray(parsed?.materias)) throw new Error('JSON inválido retornado pela IA (campo "materias" ausente).');

  const resumo = { disciplinas: 0, professores: 0, turmas: 0, atribuicoes: 0 };

  // Tudo ou nada: se algo falhar no meio, nada é gravado.
  await prisma.$transaction(async tx => {
    const subjects = await tx.subject.findMany({ where: { schoolId } });
    const teachers = await tx.teacher.findMany({ where: { schoolId } });
    const classes = await tx.class.findMany({ where: { schoolId } });
    const norm = (s: string) => s.trim().toLowerCase();

    for (const mat of parsed.materias) {
      const sigla = String(mat?.sigla || mat?.nome || '').trim().toUpperCase();
      if (!sigla) continue;
      let subject = subjects.find(s => norm(s.sigla) === norm(sigla));
      if (!subject) {
        subject = await tx.subject.create({ data: { name: String(mat.nome || sigla).trim(), sigla, schoolId } });
        subjects.push(subject);
        resumo.disciplinas++;
      }

      for (const prof of Array.isArray(mat.professores) ? mat.professores : []) {
        const nome = String(prof?.nome || '').trim();
        if (!nome) continue;
        const novas = (Array.isArray(prof.indisponibilidades) ? prof.indisponibilidades : [])
          .filter((r: any) => DIAS_VALIDOS.has(r?.dia) && r?.hora)
          .map((r: any) => ({ dia: r.dia, hora: String(r.hora).trim() }));

        let teacher = teachers.find(t => norm(t.name) === norm(nome));
        if (!teacher) {
          teacher = await tx.teacher.create({ data: { name: nome, schoolId, restrictions: JSON.stringify(novas) } });
          teachers.push(teacher);
          resumo.professores++;
        } else if (novas.length > 0) {
          const todas = [...parseRestricoes(teacher.restrictions), ...novas];
          const unicas = todas.filter((r, i) => todas.findIndex(o => o.dia === r.dia && o.hora === r.hora) === i);
          teacher = await tx.teacher.update({ where: { id: teacher.id }, data: { restrictions: JSON.stringify(unicas) } });
          teachers[teachers.findIndex(t => t.id === teacher!.id)] = teacher;
        }
        await tx.teacher.update({ where: { id: teacher.id }, data: { subjects: { connect: { id: subject.id } } } });

        for (const t of Array.isArray(prof.turmas) ? prof.turmas : []) {
          const nomeTurma = String(t?.nome || '').trim();
          if (!nomeTurma) continue;
          let classRecord = classes.find(c => norm(c.name) === norm(nomeTurma));
          if (!classRecord) {
            classRecord = await tx.class.create({ data: { name: nomeTurma, schoolId } });
            classes.push(classRecord);
            resumo.turmas++;
          }

          const aulas = Math.max(1, Math.floor(Number(t.aulas)) || 1);
          const existente = await tx.teacherClassSubject.findFirst({
            where: { teacherId: teacher.id, classId: classRecord.id, subjectId: subject.id },
          });
          if (existente) {
            await tx.teacherClassSubject.update({ where: { id: existente.id }, data: { aulas } });
          } else {
            await tx.teacherClassSubject.create({
              data: { teacherId: teacher.id, classId: classRecord.id, subjectId: subject.id, aulas },
            });
          }
          resumo.atribuicoes++;
        }
      }
    }
  }, { timeout: 60000 });

  return resumo;
}

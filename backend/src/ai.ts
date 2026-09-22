import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const systemPrompt = `Você é um assistente de IA focado em estruturar informações de horários escolares.
Seu objetivo é ler o texto ou imagem fornecida pelo usuário e extrair os Professores, suas Restrições de Horário (indisponibilidades), as Matérias e as Turmas que eles lecionam, bem como a quantidade de aulas.
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

Se a informação não for explícita (ex: se não houver restrição), retorne um array vazio [].
A quantidade de aulas padrão caso não informada deve ser 1.
Retorne apenas o JSON.`;

// Para suportar o Cohere nativamente caso o usuário envie token do Cohere
// O Cohere usa fetch para a API /v2/chat
async function callCohere(text: string, token: string) {
  const response = await fetch('https://api.cohere.ai/v2/chat', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      model: "command-r-08-2024",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    })
  });
  if (!response.ok) throw new Error("Falha no Cohere");
  const data = await response.json();
  const textObj = data.message?.content?.find((c: any) => c.type === 'text');
  return textObj ? textObj.text : "{}";
}

export async function processAiImport(
  schoolId: string, 
  provider: string, 
  token: string, 
  text: string, 
  imageBuffer?: Buffer,
  mimeType?: string
) {
  let jsonString = '';

  if (provider === 'gemini') {
    const genAI = new GoogleGenerativeAI(token);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction: systemPrompt });
    
    const parts: any[] = [];
    if (text) parts.push(text);
    if (imageBuffer && mimeType) {
      parts.push({
        inlineData: {
          data: imageBuffer.toString("base64"),
          mimeType
        }
      });
    }
    const result = await model.generateContent(parts);
    jsonString = result.response.text();
  } 
  else if (provider === 'claude') {
    const anthropic = new Anthropic({ apiKey: token });
    const content: any[] = [];
    if (imageBuffer && mimeType) {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: mimeType,
          data: imageBuffer.toString("base64")
        }
      });
    }
    if (text) {
      content.push({ type: 'text', text });
    }

    const msg = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content }]
    });
    // @ts-ignore
    jsonString = msg.content[0].text;
  }
  else if (provider === 'cohere') {
    if (imageBuffer) throw new Error("Cohere atualmente configurado apenas para texto.");
    jsonString = await callCohere(text, token);
  } else {
    throw new Error("Provedor não suportado");
  }

  // Parse JSON and clean up markdown codeblocks if any
  const cleanedJsonString = jsonString.replace(/```(?:json)?\s*([\s\S]*?)\s*```/i, '$1').trim();
  const parsed = JSON.parse(cleanedJsonString);

  if (!parsed.materias) throw new Error("JSON Inválido retornado pela IA");

  // Salvar no Banco
  for (const mat of parsed.materias) {
    const subject = await prisma.subject.create({
      data: {
        name: mat.nome || mat.sigla,
        sigla: mat.sigla,
        schoolId
      }
    });

    for (const prof of mat.professores) {
      // Find or create teacher (to avoid duplicates by name in the same school)
      let teacher = await prisma.teacher.findFirst({
        where: { name: prof.nome, schoolId }
      });
      if (!teacher) {
        teacher = await prisma.teacher.create({
          data: {
            name: prof.nome,
            schoolId,
            restrictions: JSON.stringify(prof.indisponibilidades || [])
          }
        });
      } else {
        // Update restrictions
        const existingRest = JSON.parse(teacher.restrictions || '[]');
        const newRest = [...existingRest, ...(prof.indisponibilidades || [])];
        await prisma.teacher.update({
          where: { id: teacher.id },
          data: { restrictions: JSON.stringify(newRest) }
        });
      }

      for (const t of prof.turmas) {
        // Find or create class
        let classRecord = await prisma.class.findFirst({
          where: { name: t.nome, schoolId }
        });
        if (!classRecord) {
          classRecord = await prisma.class.create({
            data: { name: t.nome, schoolId }
          });
        }

        // Create Lesson mapping
        await prisma.teacherClassSubject.create({
          data: {
            teacherId: teacher.id,
            classId: classRecord.id,
            subjectId: subject.id,
            aulas: t.aulas || 1
          }
        });
      }
    }
  }

  return { success: true };
}

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  const school = await prisma.school.findFirst({
    where: { name: "Escola Turno Manhã (Complexa)" }
  });

  if (!school) {
    console.error("School not found!");
    return;
  }

  const gradeData = fs.readFileSync('grade-final.json', 'utf-8');

  await prisma.schedule.create({
    data: {
      name: "Grade do Algoritmo Complexo (Turno Manhã)",
      data: gradeData,
      schoolId: school.id
    }
  });

  console.log("Schedule successfully inserted into the database!");
}

main().catch(console.error).finally(() => prisma.$disconnect());

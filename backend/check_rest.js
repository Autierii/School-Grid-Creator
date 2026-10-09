const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const t = await prisma.teacher.findFirst({where: {restrictions: {not: "[]"}}});
  console.log(t ? t.restrictions : 'None');
  await prisma.$disconnect();
}
run();


const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.findFirst({
    where: {
      fileAssets: { some: {} }
    },
    include: {
      fileAssets: true
    }
  });
  console.log(JSON.stringify(project, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

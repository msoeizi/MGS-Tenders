const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const projects = await prisma.project.findMany({
      include: { fileAssets: true },
      take: 1
    });
    console.log(JSON.stringify(projects, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();

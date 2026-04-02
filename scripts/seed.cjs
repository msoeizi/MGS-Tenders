const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.create({
    data: {
      id: "test-project-123",
      project_title: "Sample Hospitality Renovation",
      project_address: "123 Main St, Toronto",
      project_description: "Sample lobby renovation project.",
      fileAssets: {
        create: {
          id: "test-doc-001",
          original_filename: "Lobby_Design.pdf",
          file_storage_path: "storage/Lobby_Design.pdf",
          extracted_text_path: "storage/Lobby_Design.txt",
          rendered_image_path_prefix: "storage/Lobby_Design",
          mime_type: "application/pdf"
        }
      }
    }
  });
  console.log("Created sample project:", project.id);
}

main().catch(console.error).finally(() => prisma.$disconnect());

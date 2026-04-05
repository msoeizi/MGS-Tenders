import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Storage Cleanup ---');
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // 1. Find projects not accessed in 30 days
  const projectsToCleanup = await prisma.project.findMany({
    where: {
      last_accessed_at: {
        lt: thirtyDaysAgo
      },
      fileAssets: {
        some: {
          is_deleted_from_disk: false
        }
      }
    },
    include: {
      fileAssets: true
    }
  });

  console.log(`Found ${projectsToCleanup.length} projects targeting for cleanup.`);

  let totalDeleted = 0;
  let totalSavedBytes = 0;

  for (const project of projectsToCleanup) {
    console.log(`Cleaning up project: ${project.project_title} (${project.id})`);
    
    for (const asset of project.fileAssets) {
      if (asset.is_deleted_from_disk) continue;

      const filePath = path.join(process.cwd(), asset.file_storage_path);
      
      try {
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          fs.unlinkSync(filePath);
          totalSavedBytes += stats.size;
          totalDeleted++;
          
          await prisma.fileAsset.update({
            where: { id: asset.id },
            data: { is_deleted_from_disk: true }
          });
          
          console.log(`  - Deleted: ${asset.original_filename}`);
        } else {
          console.warn(`  - File not found on disk: ${asset.file_storage_path}`);
          await prisma.fileAsset.update({
            where: { id: asset.id },
            data: { is_deleted_from_disk: true }
          });
        }
      } catch (err) {
        console.error(`  - Error deleting ${asset.original_filename}:`, err);
      }
    }
  }

  console.log('--- Cleanup Finished ---');
  console.log(`Total files deleted: ${totalDeleted}`);
  console.log(`Total space freed: ${(totalSavedBytes / (1024 * 1024)).toFixed(2)} MB`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

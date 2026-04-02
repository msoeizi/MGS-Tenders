import { prisma } from './prisma';

export async function logApiCommunication(
  projectId: string,
  endpoint: string,
  method: string,
  requestBody: any,
  responseBody: any,
  statusCode: number
) {
  try {
    // Resolve alias '1' if necessary (though usually the routes already do this)
    let actualProjectId = projectId;
    if (projectId === '1') {
      const latestProject = await prisma.project.findFirst({
        orderBy: { created_at: 'desc' },
      });
      if (latestProject) {
        actualProjectId = latestProject.id;
      } else {
        console.error('API Logger: Could not resolve alias "1" because no projects exist.');
        return;
      }
    }

    await prisma.apiLog.create({
      data: {
        project_id: actualProjectId,
        endpoint,
        method,
        request_body: requestBody ? JSON.stringify(requestBody, null, 2) : null,
        response_body: responseBody ? JSON.stringify(responseBody, null, 2) : null,
        status_code: statusCode,
      },
    });
  } catch (error) {
    console.error('Failed to log API communication:', error);
  }
}

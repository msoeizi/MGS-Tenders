const http = require('http');
const fs = require('fs');

async function test() {
  const projectId = 'test-project-123';
  const getUrl = `http://localhost:3232/api/projects/${projectId}/actions/initial-document-review/context`;
  const postUrl = `http://localhost:3232/api/projects/${projectId}/actions/initial-document-review/result`;

  console.log('Testing GET context...');
  const getRes = await fetch(getUrl);
  const getData = await getRes.json();
  console.log('GET Status:', getRes.status);
  console.log('GET Response:', JSON.stringify(getData, null, 2));

  console.log('\nTesting Auto-save (PATCH)...');
  const patchRes = await fetch(getUrl.replace('/actions/initial-document-review/context', ''), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_title: 'Updated Project Title', project_address: 'New Address' })
  });
  const patchData = await patchRes.json();
  console.log('PATCH Status:', patchRes.status);
  console.log('PATCH Response:', JSON.stringify(patchData, null, 2));
}

test().catch(console.error);

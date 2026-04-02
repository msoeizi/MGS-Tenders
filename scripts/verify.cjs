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

  console.log('\nTesting POST result...');
  const payload = JSON.parse(fs.readFileSync('sample_payload_v1.json', 'utf8'));
  
  // Patch payload with real document_id from seed
  if (payload.evidence_index) {
    payload.evidence_index.forEach(ev => ev.document_id = 'test-doc-001');
  }

  const postRes = await fetch(postUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const postData = await postRes.json();
  console.log('POST Status:', postRes.status);
  console.log('POST Response:', JSON.stringify(postData, null, 2));
}

test().catch(console.error);

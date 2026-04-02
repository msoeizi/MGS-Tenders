const http = require('http');

async function verify() {
  const baseUrl = 'http://localhost:3232';

  console.log('1. Creating a real project...');
  const createRes = await fetch(`${baseUrl}/api/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Verification Project',
      address: '789 Verification St',
      files: ['doc1.pdf', 'doc2.pdf']
    })
  });
  const newProject = await createRes.json();
  console.log('Created Project ID:', newProject.id);

  console.log('\n2. Fetching via alias "1"...');
  const aliasRes = await fetch(`${baseUrl}/api/projects/1`);
  const aliasData = await aliasRes.json();
  console.log('Alias "1" Project Title:', aliasData.project_title);
  
  if (aliasData.id === newProject.id) {
    console.log('\nSUCCESS: Alias "1" correctly points to the newest project!');
  } else {
    console.log('\nFAILURE: Alias "1" mismatch.');
  }
}

verify().catch(console.error);

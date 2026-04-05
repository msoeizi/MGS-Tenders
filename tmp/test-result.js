// Node 22+ has built-in fetch

async function testResultIngestion() {
  const projectId = '6cecb1c5-eeb9-41ba-bbf9-b7d5029b7303';
  const url = `http://localhost:3232/api/projects/${projectId}/actions/initial-document-review/result`;
  
  const payload = {
    id: projectId,
    result: JSON.stringify({
      project_info: {
        project_title: "Test Project Success",
        project_address: "123 Test St",
        project_description: "This is a test to verify stringified JSON ingestion."
      },
      evidence_index: [
        {
          evidence_id: "test_ev",
          document_id: "doc_123",
          page_number: 1,
          excerpt_text: "Found it!"
        }
      ]
    })
  };

  console.log('Sending stringified payload to:', url);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    console.log('Response Status:', response.status);
    console.log('Response Body:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Test Failed:', err);
  }
}

testResultIngestion();

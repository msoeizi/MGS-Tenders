export default function RulesPage() {
  const mockRules = [
    { title: "Supply and Install Flag", description: "Identify keywords like 'by others' or 'NIC' near millwork specs.", status: "Active", type: "Scope" },
    { title: "Material Inconsistency", description: "Flag when drawing callouts don't match provide Finish Schedule codes.", status: "Active", type: "Review" },
    { title: "Distance Threshold", description: "Warning for projects more than 100km from the primary shop location.", status: "Testing", type: "Distance" },
    { title: "Quantity Discrepancy", description: "Compare Floor Plan counts vs. Interior Elevation Schedule counts.", status: "Active", type: "Count" },
  ];

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Analysis Rules & Intelligence</h1>
          <p className="page-subtitle">Configure the GPT-powered extraction logic and lessons learned database.</p>
        </div>
        <button className="btn btn-primary">+ New Rule</button>
      </header>

      <div className="glass-panel animate-slide-up">
        <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
          <div style={{ flex: 1, padding: '1rem', background: 'rgba(158, 103, 38, 0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)' }}>
            <p className="nav-label">Extraction Accuracy</p>
            <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary)' }}>92.4%</p>
          </div>
          <div style={{ flex: 1, padding: '1rem', background: 'rgba(158, 103, 38, 0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)' }}>
            <p className="nav-label">Lessons Captured</p>
            <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary)' }}>156</p>
          </div>
          <div style={{ flex: 1, padding: '1rem', background: 'rgba(46, 125, 50, 0.03)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(46, 125, 50, 0.1)' }}>
            <p className="nav-label">Verified Savings</p>
            <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--success)' }}>$42,100</p>
          </div>
        </div>

        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--primary)' }}>Current Active Rules</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--surface-border)', color: 'var(--secondary)' }}>
              <th style={{ padding: '1rem' }}>Rule Name</th>
              <th style={{ padding: '1rem' }}>Internal Description</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Type</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Status</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockRules.map((rule, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid rgba(158, 103, 38, 0.05)' }}>
                <td style={{ padding: '1rem', fontWeight: '600' }}>{rule.title}</td>
                <td style={{ padding: '1rem', color: 'var(--secondary)' }}>{rule.description}</td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <span className="badge badge-info">{rule.type}</span>
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <span className={`badge ${rule.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                    {rule.status}
                  </span>
                </td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <button className="btn btn-ghost" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>Settings</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

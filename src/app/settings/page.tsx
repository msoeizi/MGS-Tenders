export default function SettingsPage() {
  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">App Settings</h1>
          <p className="page-subtitle">Manage global configurations for the MGS Tender Automation platform.</p>
        </div>
      </header>

      <div className="glass-panel animate-slide-up" style={{ maxWidth: '800px' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--primary)' }}>Environment & Intelligence</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>OpenAI API Key (GPT-4o Integration)</label>
            <input 
              type="password" 
              placeholder="sk-..." 
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--surface-border)', background: 'white' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>System Model Configuration</label>
            <select style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--surface-border)', background: 'white' }}>
              <option>gpt-4o (Standard)</option>
              <option>gpt-4 (Legacy)</option>
              <option>gpt-3.5-turbo (Drafting)</option>
            </select>
          </div>

          <div style={{ padding: '1rem', background: 'rgba(158, 103, 38, 0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)' }}>
            <p style={{ fontWeight: '600', color: 'var(--primary)', marginBottom: '0.5rem' }}>Storage Configuration</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--secondary)' }}><strong>Database:</strong> SQLite (file:./dev.db)</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--secondary)' }}><strong>Vector Engine:</strong> Local ChromaDB</p>
          </div>
        </div>

        <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button className="btn btn-ghost">Reset Defaults</button>
          <button className="btn btn-primary">Save Settings</button>
        </div>
      </div>
    </>
  );
}

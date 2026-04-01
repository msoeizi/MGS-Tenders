import Link from "next/link";

export default function TemplatesPage() {
  const mockTemplates = [
    { title: "Standard Millwork v1.2", category: "Estimation", items: 42, updated: "2 weeks ago" },
    { title: "Commercial Office Finish Schedule", category: "Finish", items: 15, updated: "1 month ago" },
    { title: "Hospitality FF&E List", category: "Budgeting", items: 120, updated: "3 days ago" },
    { title: "GC Compliance Checklist", category: "Compliance", items: 8, updated: "Just now" },
  ];

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">MGS Templates</h1>
          <p className="page-subtitle">Standardized tender analysis and spreadsheet templates.</p>
        </div>
        <button className="btn btn-primary">+ Create Template</button>
      </header>

      <div className="project-grid">
        {mockTemplates.map((template, index) => (
          <div key={index} className="glass-card animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span className="badge badge-info">{template.category}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>{template.updated}</span>
            </div>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>{template.title}</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--secondary)', marginBottom: '1.25rem' }}>
              📊 {template.items} standardization rules and predefined items.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-ghost" style={{ flex: 1 }}>Edit Template</button>
              <button className="btn btn-ghost" style={{ flex: 1 }}>Duplicate</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

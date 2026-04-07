import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="mgs-sidebar">
      <div className="logo-container">
        <div className="logo-icon">M</div>
        <span className="logo-text">MGS Tender</span>
      </div>

      <nav className="nav-group">
        <p className="nav-label">Main</p>
        <Link href="/" className="nav-link active">
          <span style={{ fontSize: '1.1rem' }}>📊</span> Dashboard
        </Link>
        <Link href="/projects" className="nav-link">
          <span style={{ fontSize: '1.1rem' }}>📁</span> Projects
        </Link>
      </nav>

      <nav className="nav-group">
        <p className="nav-label">Intelligence</p>
        <Link href="/templates" className="nav-link">
          <span style={{ fontSize: '1.1rem' }}>📄</span> Templates
        </Link>
        <Link href="/rules" className="nav-link">
          <span style={{ fontSize: '1.1rem' }}>🛠️</span> Analysis Rules
        </Link>
      </nav>

      <div style={{ marginTop: 'auto' }}>
        <Link href="/settings" className="nav-link">
          <span style={{ fontSize: '1.1rem' }}>⚙️</span> App Settings
        </Link>
      </div>
    </aside>
  );
}

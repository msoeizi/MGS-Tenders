'use client';

import { useState } from "react";
import Link from "next/link";
import NewProjectModal from "@/components/NewProjectModal";

const mockProjects = [
  { id: "1", project_title: "Hospitality Renovation - Phase 1", project_address: "123 Main St, Toronto", project_status: "User Review In Progress", scope_classification: "supply_and_install", updated: "2 hours ago" },
  { id: "2", project_title: "Commercial Office Millwork", project_address: "456 Business Ave, Vancouver", project_status: "Triaged", scope_classification: "install_only", updated: "Yesterday" },
  { id: "3", project_title: "Luxury Condo Lobby", project_address: "789 Highrise Dr, Montreal", project_status: "Draft", scope_classification: "supply_and_install", updated: "3 days ago" },
];

export default function ProjectsList() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">All Active Projects</h1>
          <p className="page-subtitle">Detailed management of your ongoing millwork tenders.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>+ New Project</button>
      </header>

      <NewProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />

      <div className="glass-panel animate-slide-up">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--surface-border)', color: 'var(--secondary)' }}>
              <th style={{ padding: '1rem' }}>Project Name</th>
              <th style={{ padding: '1rem' }}>Address</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem' }}>Classification</th>
              <th style={{ padding: '1rem' }}>Last Updated</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockProjects.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid rgba(158, 103, 38, 0.05)' }}>
                <td style={{ padding: '1rem', fontWeight: '600' }}>{p.project_title}</td>
                <td style={{ padding: '1rem', color: 'var(--secondary)' }}>{p.project_address}</td>
                <td style={{ padding: '1rem' }}>
                  <span className={`badge ${p.project_status === 'Triaged' ? 'badge-success' : 'badge-info'}`}>
                    {p.project_status}
                  </span>
                </td>
                <td style={{ padding: '1rem', fontWeight: '500', color: 'var(--primary)' }}>{p.scope_classification}</td>
                <td style={{ padding: '1rem', color: 'var(--secondary)' }}>{p.updated}</td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <Link href={`/projects/${p.id}`} className="btn btn-ghost">Workspace</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

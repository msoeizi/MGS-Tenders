'use client';

import { useState } from "react";
import Link from "next/link";
import NewProjectModal from "@/components/NewProjectModal";

const mockProjects = [
  {
    id: "1",
    project_title: "Hospitality Renovation - Phase 1",
    project_address: "123 Main St, Toronto",
    project_status: "User Review In Progress",
    files: 12,
    updated: "2 hours ago",
    scope_classification: "supply_and_install",
    confidence: 0.92,
  },
  {
    id: "2",
    project_title: "Commercial Office Millwork",
    project_address: "456 Business Ave, Vancouver",
    project_status: "Triaged",
    files: 5,
    updated: "Yesterday",
    scope_classification: "install_only",
    confidence: 0.85,
  },
  {
    id: "3",
    project_title: "Luxury Condo Lobby",
    project_address: "789 Highrise Dr, Montreal",
    project_status: "Draft",
    files: 2,
    updated: "3 days ago",
    scope_classification: "supply_and_install",
    confidence: 0.65,
  },
];

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Active Projects</h1>
          <p className="page-subtitle">Track and manage your millwork tender estimates.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <span>+</span> &nbsp; New Project
        </button>
      </header>

      <NewProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />

      <div className="project-grid">
        {mockProjects.map((project, index) => (
          <div 
            key={project.id} 
            className="glass-card animate-slide-up" 
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span className={`badge ${
                  project.project_status === 'User Review In Progress' ? 'badge-info' : 
                  project.project_status === 'Draft' ? 'badge-ghost' : 'badge-success'
                }`}>
                  {project.project_status}
                </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>
                {project.updated}
              </span>
            </div>

            <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '0.25rem' }}>{project.project_title}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', marginBottom: '1.25rem' }}>
              <span style={{ color: 'var(--secondary)' }}>📍 {project.project_address}</span>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '1rem', 
              paddingTop: '1rem',
              borderTop: '1px solid var(--surface-border)'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Classification</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{project.scope_classification}</span>
                </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: 'var(--secondary)', marginBottom: '0.25rem' }}>Confidence</p>
                <p style={{ fontWeight: '700', color: project.confidence > 0.8 ? 'var(--success)' : '#CE996A' }}>
                  {(project.confidence * 100).toFixed(0)}%
                </p>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
              <Link href={`/projects/${project.id}`} className="btn btn-ghost" style={{ flex: 1 }}>
                Open Workspace
              </Link>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

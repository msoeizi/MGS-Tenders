'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import NewProjectModal from "@/components/NewProjectModal";
import StorageUsageCard from "@/components/dashboard/StorageUsageCard";
import { Clock, MapPin, Activity, FileText } from "lucide-react";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const formatDistance = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diff = Math.abs(now.getTime() - then.getTime());
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <>
      <header className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h1 className="page-title" style={{ margin: 0 }}>Active Projects</h1>
            <span className="badge badge-success" style={{ 
              fontSize: '0.7rem', 
              padding: '0.2rem 0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              animation: 'pulse 2s infinite'
            }}>
              <span style={{ 
                width: '6px', 
                height: '6px', 
                borderRadius: '50%', 
                backgroundColor: 'currentColor' 
              }}></span>
              System Online
            </span>
            <style jsx>{`
              @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.6; }
                100% { opacity: 1; }
              }
            `}</style>
          </div>
          <p className="page-subtitle">Track and manage your millwork tender estimates from the live database.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <span>+</span> &nbsp; New Project
        </button>
      </header>

      <NewProjectModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          fetchProjects(); // Refresh after creation
        }} 
      />

      {!loading && <StorageUsageCard />}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#94a3b8]">
          <Clock className="w-8 h-8 mb-4 animate-spin text-[#3b82f6]" />
          <p>Syncing workspace data...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="glass-card p-12 text-center max-w-lg mx-auto mt-10">
          <Activity className="w-12 h-12 text-[#334155] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No Projects Found</h2>
          <p className="text-[#94a3b8] mb-6">Start by creating your first project and uploading project documents for AI analysis.</p>
          <button className="btn btn-primary mx-auto" onClick={() => setIsModalOpen(true)}>
            Create First Project
          </button>
        </div>
      ) : (
        <div className="project-grid">
          {projects.map((project, index) => (
            <div 
              key={project.id} 
              className="glass-card animate-slide-up" 
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                <span className={`badge ${
                  project.project_status === 'Ready for Review' ? 'badge-success' : 
                  project.project_status === 'Draft' ? 'badge-ghost' : 'badge-info'
                }`}>
                  {project.project_status}
                </span>
                <span className="flex items-center gap-1.5 text-[10px] text-[#64748b] font-bold uppercase tracking-wider">
                  <FileText className="w-3 h-3" />
                  {project._count?.fileAssets || 0} Files
                </span>
              </div>

              <h3 style={{ fontSize: '1.25rem', color: 'var(--primary)', marginBottom: '0.25rem' }}>{project.project_title}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', marginBottom: '1.25rem', color: 'var(--secondary)' }}>
                <MapPin className="w-3.5 h-3.5" />
                <span>{project.project_address}</span>
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '1rem', 
                paddingTop: '1rem',
                borderTop: '1px solid var(--surface-border)'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', textTransform: 'uppercase', fontWeight: '600' }}>Scope</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{project.scope_classification || 'Pending'}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ color: 'var(--secondary)', fontSize: '0.75rem', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: '600' }}>Confidence</p>
                  <p style={{ fontWeight: '700', fontSize: '1rem', color: project.confidence_score > 0.8 ? 'var(--success)' : '#CE996A' }}>
                    {((project.confidence_score || 0) * 100).toFixed(0)}%
                  </p>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
                <Link href={`/projects/${project.id}`} className="btn btn-primary" style={{ flex: 1, textAlign: 'center', backgroundColor: '#1e293b', border: '1px solid #334155' }}>
                  Workspace
                </Link>
                <div className="flex items-center text-[10px] text-[#64748b] font-medium italic">
                  Updated {formatDistance(project.updated_at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

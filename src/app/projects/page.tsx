'use client';

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import NewProjectModal from "@/components/NewProjectModal";
import { Copy, Trash2, Archive, ArchiveRestore } from "lucide-react";

export default function ProjectsList() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // New States
  const [showArchived, setShowArchived] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({
    key: 'created_at',
    direction: 'desc'
  });
  const [actionLoading, setActionLoading] = useState(false);

  async function fetchProjects() {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects?archived=${showArchived}`);
      const data = await res.json();
      setProjects(data);
      setSelectedIds(new Set()); // Clear selections on refresh
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProjects();
  }, [showArchived]);

  // Bulk Actions Function
  const handleBulkAction = async (action: 'archive' | 'unarchive' | 'hard_delete' | 'duplicate') => {
    if (action === 'hard_delete') {
      const isConfirmed = window.confirm(
        "Are you sure you want to permanently delete these projects? This cannot be undone."
      );
      if (!isConfirmed) return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/projects/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          projectIds: Array.from(selectedIds)
        })
      });
      if (res.ok) {
        await fetchProjects();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred during the bulk action.');
    } finally {
      setActionLoading(false);
    }
  };

  // Selection Logic
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(projects.map(p => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Sorting Logic
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedProjects = useMemo(() => {
    if (!sortConfig) return projects;
    return [...projects].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === 'files') {
        aVal = a._count?.fileAssets || 0;
        bVal = b._count?.fileAssets || 0;
      }

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [projects, sortConfig]);

  const allSelected = projects.length > 0 && selectedIds.size === projects.length;
  const isDuplicateDisabled = selectedIds.size !== 1;

  return (
    <>
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">Detailed management of your ongoing millwork tenders.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--secondary)', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="accent-primary"
            />
            Show Archives / Trash
          </label>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>+ New Project</button>
        </div>
      </header>

      <NewProjectModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          fetchProjects(); // Refresh list after modal closes
        }} 
      />

      {/* ACTION BAR */}
      {selectedIds.size > 0 && (
        <div className="animate-slide-up" style={{ 
          background: 'var(--surface-lifted)', 
          border: '1px solid var(--primary)', 
          padding: '1rem', 
          borderRadius: '0.5rem', 
          marginBottom: '1.5rem',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between'
        }}>
          <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
            {selectedIds.size} Project{selectedIds.size > 1 ? 's' : ''} Selected
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              disabled={isDuplicateDisabled || actionLoading}
              onClick={() => handleBulkAction('duplicate')}
              className="btn btn-ghost"
              style={{ display: 'flex', gap: '0.5rem', opacity: isDuplicateDisabled ? 0.5 : 1 }}
              title={isDuplicateDisabled ? "Select exactly 1 project to duplicate" : ""}
            >
              <Copy size={16} /> Duplicate
            </button>
            
            {showArchived ? (
              <button 
                disabled={actionLoading}
                onClick={() => handleBulkAction('unarchive')}
                className="btn btn-ghost"
                style={{ display: 'flex', gap: '0.5rem', color: 'var(--success)' }}
              >
                <ArchiveRestore size={16} /> Restore
              </button>
            ) : (
              <button 
                disabled={actionLoading}
                onClick={() => handleBulkAction('archive')}
                className="btn btn-ghost"
                style={{ display: 'flex', gap: '0.5rem', color: 'orange' }}
              >
                <Archive size={16} /> Archive to Trash
              </button>
            )}

            <button 
              disabled={actionLoading}
              onClick={() => handleBulkAction('hard_delete')}
              className="btn btn-ghost"
              style={{ display: 'flex', gap: '0.5rem', color: 'red' }}
            >
              <Trash2 size={16} /> Delete Forever
            </button>
          </div>
        </div>
      )}

      <div className="glass-panel animate-slide-up">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading projects...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--surface-border)', color: 'var(--secondary)' }}>
                <th style={{ padding: '1rem', width: '40px' }}>
                  <input 
                    type="checkbox" 
                    checked={allSelected}
                    onChange={handleSelectAll}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                <th 
                  style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleSort('project_title')}
                >
                  Project Name {sortConfig?.key === 'project_title' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th 
                  style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleSort('project_address')}
                >
                  Address {sortConfig?.key === 'project_address' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th 
                  style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleSort('project_status')}
                >
                  Status {sortConfig?.key === 'project_status' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th 
                  style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleSort('files')}
                >
                  Files {sortConfig?.key === 'files' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th 
                  style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleSort('created_at')}
                >
                  Created {sortConfig?.key === 'created_at' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedProjects.map((p: any) => (
                <tr key={p.id} style={{ 
                  borderBottom: '1px solid rgba(158, 103, 38, 0.05)',
                  backgroundColor: selectedIds.has(p.id) ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
                }}>
                  <td style={{ padding: '1rem' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(p.id)}
                      onChange={() => handleSelectOne(p.id)}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
                  <td style={{ padding: '1rem', fontWeight: '600' }}>
                     {showArchived && <Archive size={12} style={{ display: 'inline', marginRight: '4px', opacity: 0.5 }} />}
                     {p.project_title}
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--secondary)' }}>{p.project_address}</td>
                  <td style={{ padding: '1rem' }}>
                    <span className={`badge ${p.project_status === 'Draft' ? 'badge-info' : 'badge-success'}`}>
                      {p.project_status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: '500', color: 'var(--primary)' }}>
                    {p._count?.fileAssets || 0} docs
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--secondary)' }}>
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <Link href={`/projects/${p.id}`} className="btn btn-ghost">Workspace</Link>
                  </td>
                </tr>
              ))}
              {sortedProjects.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--secondary)' }}>
                    {showArchived ? 'No archived projects.' : 'No active projects found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

'use client';

import { useState, useEffect, use } from 'react';
import ProjectInfoTab from '@/components/workspace/ProjectInfoTab';
import ContactsTab from '@/components/workspace/ContactsTab';
import MillworkTab from '@/components/workspace/MillworkTab';
import FinishesTab from '@/components/workspace/FinishesTab';
import EstimateTab from '@/components/workspace/EstimateTab';
import ReviewFlagsTab from '@/components/workspace/ReviewFlagsTab';
import EvidenceTab from '@/components/workspace/EvidenceTab';
import DocumentsTab from '@/components/workspace/DocumentsTab';
import { CommunicationLogTab } from '@/components/workspace/CommunicationLogTab';

export default function ProjectWorkspace({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState('project_info');
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Fetch project data ONCE on mount
  useEffect(() => {
    async function fetchProject() {
      try {
        const res = await fetch(`/api/projects/${id}`);
        const data = await res.json();
        setProject(data);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProject();
  }, [id]);

  // Debounced Auto-save Logic
  useEffect(() => {
    if (!project || loading) return;

    const saveTimer = setTimeout(async () => {
      setSaving(true);
      try {
        await fetch(`/api/projects/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(project)
        });
        setLastSaved(new Date());
      } catch (err) {
        console.error('Auto-save error:', err);
      } finally {
        setSaving(false);
      }
    }, 1000);

    return () => clearTimeout(saveTimer);
  }, [project, id, loading]);

  const handleUpdate = async (section: string, data: any) => {
    // For now, log the intended update - in a real app, this would be a PATCH to /api/projects/[id]/[section]
    console.log(`Update ${section}:`, data);
    
    // Optimistic update
    setProject((prev: any) => ({ ...prev, [section]: data }));
    
    // In a real implementation, we would call the API here:
    // await fetch(`/api/projects/${id}/${section}`, { method: 'PATCH', body: JSON.stringify(data) });
  };

  const copyPrompt = () => {
    const prompt = `Run initial_document_review for project ${id}`;
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading project...</div>;
  if (!project) return <div style={{ padding: '2rem' }}>Project not found.</div>;

  const tabs = [
    { id: 'project_info', name: 'Project Info', icon: '📝' },
    { id: 'contacts', name: 'Contacts', icon: '👥' },
    { id: 'documents', name: 'Documents', icon: '📂' },
    { id: 'millwork', name: 'Millwork Schedule', icon: '🪑' },
    { id: 'finishes', name: 'Finish Schedule', icon: '🎨' },
    { id: 'estimate', name: 'Estimate Prefill', icon: '💰' },
    { id: 'flags', name: 'Review Flags', icon: '🚩' },
    { id: 'evidence', name: 'Evidence Index', icon: '🔍' },
    { id: 'logs', name: 'System Logs', icon: '📟' },
  ];

  const handleUpload = (newAssets: any[]) => {
    setProject((prev: any) => ({
      ...prev,
      fileAssets: [...(prev.fileAssets || []), ...newAssets]
    }));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'project_info':
        return <ProjectInfoTab project={project} onUpdate={(data) => handleUpdate('project_info', data)} />;
      case 'contacts':
        return <ContactsTab contacts={project.contacts} onUpdate={(data) => handleUpdate('contacts', data)} />;
      case 'documents':
        return <DocumentsTab project={project} onUpload={handleUpload} />;
      case 'millwork':
        return <MillworkTab items={project.millworkItems} onUpdate={(data) => handleUpdate('millworkItems', data)} onViewEvidence={() => setActiveTab('evidence')} />;
      case 'finishes':
        return <FinishesTab finishes={project.finishScheduleItems} onUpdate={(data) => handleUpdate('finishScheduleItems', data)} />;
      case 'estimate':
        return <EstimateTab estimateRows={project.estimateRows} finishes={project.finishScheduleItems} onUpdate={(data) => handleUpdate('estimateRows', data)} />;
      case 'flags':
        return <ReviewFlagsTab flags={project.reviewFlags} onUpdate={(data) => handleUpdate('reviewFlags', data)} onViewEvidence={() => setActiveTab('evidence')} />;
      case 'evidence':
        return <EvidenceTab evidence={project.evidenceRecords} onUpdate={(data) => handleUpdate('evidenceRecords', data)} />;
      case 'logs':
        return <CommunicationLogTab projectId={id} />;
      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header className="page-header" style={{ 
        marginBottom: '1rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start' 
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', color: 'var(--primary)' }}>Workspace: {project.project_title}</h1>
          <p style={{ color: 'var(--secondary)' }}>
            {project.project_address} 
            {saving ? (
              <span style={{ marginLeft: '1rem', color: 'var(--accent)', fontSize: '0.75rem', fontWeight: '600' }}>
                ● SAVING CHANGES...
              </span>
            ) : lastSaved ? (
              <span style={{ marginLeft: '1rem', color: 'var(--success)', fontSize: '0.75rem', fontWeight: '500' }}>
                ✓ SAVED {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            ) : null}
          </p>
        </div>
        <button 
          onClick={copyPrompt}
          className="btn btn-primary"
          style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
            border: 'none',
            boxShadow: 'var(--shadow-glow)'
          }}
        >
          <span>{copied ? '✅' : '✨'}</span> 
          {copied ? 'Copied to Clipboard!' : 'Copy GPT Prompt'}
        </button>
      </header>

      <nav style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        overflowX: 'auto', 
        paddingBottom: '1rem', 
        borderBottom: '1px solid var(--surface-border)',
        position: 'sticky',
        top: '0',
        background: 'rgba(253, 252, 251, 0.95)',
        backdropFilter: 'blur(10px)',
        zIndex: 10,
        paddingTop: '0.5rem'
      }}>
        {tabs.map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id)}
            className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'}`}
            style={{ whiteSpace: 'nowrap', padding: '0.5rem 1rem' }}
          >
            <span>{tab.icon}</span> &nbsp; {tab.name}
          </button>
        ))}
      </nav>

      <div className="tab-viewport">
        {renderTabContent()}
      </div>

      <div style={{ padding: '4rem 0', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>MGS Tender Automation v0.1-discovery</p>
      </div>
    </div>
  );
}

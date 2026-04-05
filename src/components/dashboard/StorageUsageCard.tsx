'use client';

import { useState, useEffect } from 'react';
import { Database, Trash2, ShieldAlert, Cpu } from 'lucide-react';

export default function StorageUsageCard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);

  const fetchUsage = async () => {
    try {
      const res = await fetch('/api/system/storage-usage');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to fetch storage usage:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  const handleCleanup = async () => {
    if (!confirm('This will delete physical files for projects not accessed in the last 30 days. Metadata will be preserved. Proceed?')) return;
    
    setCleaning(true);
    try {
      const res = await fetch('/api/system/cleanup', { method: 'POST' });
      const result = await res.json();
      alert(`Cleanup complete! Deleted ${result.details?.deleted_files_count || 0} files. Saved ${formatFileSize(result.details?.total_saved_bytes || 0)}.`);
      fetchUsage();
    } catch (err) {
      alert('Cleanup failed. Check server logs.');
    } finally {
      setCleaning(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) return null;

  const usagePercent = data ? (data.total_usage_bytes / data.server_limit_bytes) * 100 : 0;
  const isHighUsage = usagePercent > 80;

  return (
    <div className="glass-card mb-8 animate-fade-in relative overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute -right-4 -top-4 opacity-5 pointer-events-none">
        <Database size={120} />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${isHighUsage ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
            <Cpu size={24} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider">Server Storage Management</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{formatFileSize(data?.total_usage_bytes)}</span>
              <span className="text-xs text-[#64748b]">of {formatFileSize(data?.server_limit_bytes)} Capacity</span>
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-md">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-[#94a3b8]">Usage Density</span>
            <span className={isHighUsage ? 'text-red-400 font-bold' : 'text-blue-400'}>{usagePercent.toFixed(1)}%</span>
          </div>
          <div className="h-2 w-full bg-[#1e293b] rounded-full overflow-hidden border border-[#334155]/50">
            <div 
              className={`h-full transition-all duration-1000 ease-out ${isHighUsage ? 'bg-gradient-to-r from-red-500 to-orange-400' : 'bg-gradient-to-r from-blue-500 to-indigo-400'}`}
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-[#64748b] mt-2 italic flex items-center gap-1">
            <ShieldAlert size={10} /> 
            30-day auto-cleanup policy active for inactive projects
          </p>
        </div>

        <button 
          onClick={handleCleanup}
          disabled={cleaning}
          className="btn flex items-center gap-2 px-6 py-2.5 bg-[#1e293b] hover:bg-[#334155] border border-[#334155] text-white transition-all group"
        >
          <Trash2 size={16} className={`group-hover:text-red-400 transition-colors ${cleaning ? 'animate-spin' : ''}`} />
          {cleaning ? 'Processing...' : 'Run Manual Cleanup'}
        </button>
      </div>

      {data?.project_breakdown?.length > 0 && (
        <div className="mt-6 pt-6 border-t border-[#334155]/50 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[#64748b] uppercase tracking-tighter">
                <th className="pb-3 font-semibold">Top Storage Consumers</th>
                <th className="pb-3 font-semibold">Size</th>
                <th className="pb-3 font-semibold">Last Access</th>
                <th className="pb-3 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="text-[#94a3b8]">
              {data.project_breakdown.map((p: any) => (
                <tr key={p.id} className="border-t border-[#334155]/30 group hover:bg-white/5 transition-colors">
                  <td className="py-2 font-medium text-slate-200">{p.title}</td>
                  <td className="py-2">{formatFileSize(p.size_bytes)}</td>
                  <td className="py-2">{p.last_accessed ? new Date(p.last_accessed).toLocaleDateString() : 'Never'}</td>
                  <td className="py-2 text-right">
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[9px]">ACTIVE</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

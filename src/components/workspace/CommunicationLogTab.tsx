'use client';

import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  ChevronRight, 
  ChevronDown, 
  CheckCircle2, 
  XCircle, 
  Clock,
  ArrowRightLeft,
  Code
} from 'lucide-react';

interface ApiLog {
  id: string;
  created_at: string;
  endpoint: string;
  method: string;
  request_body: string | null;
  response_body: string | null;
  status_code: number;
}

export function CommunicationLogTab({ projectId }: { projectId: string }) {
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/logs`);
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // Poll every 10 seconds while tab is active
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[#94a3b8]">
        <Clock className="w-5 h-5 mr-2 animate-spin" />
        Processing logs...
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-[#3b82f6]" />
            GPT Communication Log
          </h2>
          <p className="text-sm text-[#94a3b8]">
            Real-time transparency into GPT Action calls and AI data extraction.
          </p>
        </div>
        <button 
          onClick={fetchLogs}
          className="px-3 py-1.5 text-xs font-medium bg-[#1e293b] text-[#94a3b8] hover:text-white rounded-md border border-[#334155] transition-colors"
        >
          Refresh Now
        </button>
      </div>

      {logs.length === 0 ? (
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-12 text-center">
          <ArrowRightLeft className="w-12 h-12 text-[#334155] mx-auto mb-4" />
          <h3 className="text-white font-medium mb-1">No Activity Yet</h3>
          <p className="text-[#94a3b8] max-w-sm mx-auto text-sm">
            Communication logs will appear here once the GPT Action starts processing project documents.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div 
              key={log.id} 
              className={`bg-[#0f172a] border ${expandedId === log.id ? 'border-[#3b82f6]' : 'border-[#1e293b]'} rounded-xl overflow-hidden transition-all duration-200`}
            >
              <button 
                onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[#1e293b]/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {log.status_code >= 200 && log.status_code < 300 ? (
                    <CheckCircle2 className="w-5 h-5 text-[#10b981]" />
                  ) : (
                    <XCircle className="w-5 h-5 text-[#ef4444]" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-[#1e293b] text-[#94a3b8]">
                        {log.method}
                      </span>
                      <span className="text-white text-sm font-medium">{log.endpoint}</span>
                    </div>
                    <div className="text-[10px] text-[#64748b] mt-1 uppercase tracking-wider font-semibold">
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-xs font-bold ${log.status_code >= 400 ? 'text-[#ef4444]' : 'text-[#10b981]'}`}>
                    HTTP {log.status_code}
                  </span>
                  {expandedId === log.id ? <ChevronDown className="w-4 h-4 text-[#64748b]" /> : <ChevronRight className="w-4 h-4 text-[#64748b]" />}
                </div>
              </button>

              {expandedId === log.id && (
                <div className="p-4 border-t border-[#1e293b] bg-[#020617] grid grid-cols-2 gap-4 animate-in slide-in-from-top-1">
                  <div>
                    <h4 className="text-[10px] font-bold text-[#64748b] uppercase mb-2 flex items-center gap-1">
                      <Code className="w-3 h-3" />
                      Request Payload
                    </h4>
                    <pre className="bg-[#0f172a] p-3 rounded-lg text-[11px] font-mono text-[#94a3b8] overflow-auto max-h-[300px] border border-[#1e293b] scrollbar-thin">
                      {log.request_body || '// No body'}
                    </pre>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-[#64748b] uppercase mb-2 flex items-center gap-1">
                      <Code className="w-3 h-3" />
                      Platform Response
                    </h4>
                    <pre className="bg-[#0f172a] p-3 rounded-lg text-[11px] font-mono text-[#94a3b8] overflow-auto max-h-[300px] border border-[#1e293b] scrollbar-thin">
                      {log.response_body || '// No body'}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

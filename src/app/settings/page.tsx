'use client';

import { useState } from 'react';
import StorageUsageCard from "@/components/dashboard/StorageUsageCard";
import { Settings, Database, Activity } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'storage'>('general');

  return (
    <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto py-8 px-4 md:px-8">
      <header className="border-b border-white/10 pb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-[#e2e8f0] bg-clip-text text-transparent mb-2">
          App Settings
        </h1>
        <p className="text-[#94a3b8] text-sm">
          Manage global configurations and server infrastructure for the MGS Tender platform.
        </p>
      </header>

      {/* Tabs Navigation */}
      <nav className="flex items-center gap-2 p-1 bg-[#1e293b]/50 border border-[#334155]/50 rounded-xl self-start backdrop-blur-sm">
        <button 
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === 'general' 
              ? 'bg-[#3b82f6]/20 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] border border-[#3b82f6]/30' 
              : 'text-[#94a3b8] hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Settings size={16} />
          General
        </button>
        <button 
          onClick={() => setActiveTab('storage')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === 'storage' 
              ? 'bg-orange-500/10 text-white shadow-[0_0_15px_rgba(249,115,22,0.2)] border border-orange-500/30' 
              : 'text-[#94a3b8] hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Database size={16} />
          Storage Management
        </button>
      </nav>

      {/* Tab Content */}
      <div className="mt-2 min-h-[400px]">
        {activeTab === 'general' && (
          <div className="glass-card max-w-3xl animate-slide-up p-8 border border-[#334155]/50 bg-[#0f172a]/40 shadow-2xl">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2 pb-4 border-b border-white/5">
              <Activity className="w-5 h-5 text-[#3b82f6]" />
              Environment & Intelligence
            </h2>
            
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#e2e8f0]">OpenAI API Key (GPT-4o Integration)</label>
                <input 
                  type="password" 
                  placeholder="sk-..........." 
                  className="w-full p-3 rounded-lg border border-[#334155] bg-[#0f172a] text-white focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-all outline-none placeholder-[#475569] shadow-inner"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#e2e8f0]">System Model Configuration</label>
                <select className="w-full p-3 rounded-lg border border-[#334155] bg-[#0f172a] text-white focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-all outline-none appearance-none shadow-inner cursor-pointer">
                  <option>gpt-4o (Standard)</option>
                  <option>gpt-4-turbo (Fast)</option>
                  <option>gpt-4 (Legacy)</option>
                </select>
              </div>
            </div>

            <div className="mt-10 flex justify-end gap-3 pt-6 border-t border-[#334155]/50">
              <button className="px-5 py-2.5 rounded-lg text-sm font-medium text-[#94a3b8] hover:text-white hover:bg-white/5 transition-colors">
                Reset
              </button>
              <button className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-[#3b82f6] to-[#2563eb] hover:from-[#60a5fa] hover:to-[#3b82f6] text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all transform hover:-translate-y-0.5 active:translate-y-0">
                Save Configuration
              </button>
            </div>
          </div>
        )}

        {activeTab === 'storage' && (
          <div className="w-full max-w-4xl animate-slide-up">
            <StorageUsageCard />
            <div className="mt-6 p-4 rounded-xl border border-orange-500/20 bg-orange-500/5 text-sm text-orange-200/80">
              <p className="flex items-center gap-2">
                <Database size={16} />
                <strong>Note:</strong> Database is configured as SQLite (file:./dev.db). Vector engine is Local ChromaDB.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

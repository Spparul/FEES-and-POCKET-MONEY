import React from 'react';
import { Lock, Unlock, Users, School, Plus, LayoutDashboard, Wallet, FileText } from 'lucide-react';
import type { SystemOverview } from '../api';

interface HeaderProps {
  activeTab: 'dashboard' | 'register' | 'pocket' | 'reports';
  onTabChange: (tab: 'dashboard' | 'register' | 'pocket' | 'reports') => void;
  overview: SystemOverview | null;
  onOpenLockModal: () => void;
  onOpenAddStudentModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  overview,
  onOpenLockModal,
  onOpenAddStudentModal,
}) => {
  const isLocked = overview?.is_register_locked ?? false;

  return (
    <header className="sticky top-0 z-30 bg-slate-900 text-white shadow-md border-b border-slate-800 font-sans">
      
      {/* Top Branding & Controls Bar (Full Widescreen Width) */}
      <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-10 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80">
        
        {/* School Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-600/30 text-white font-bold">
            <School className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              CANISIUS SECONDARY SCHOOL
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                School Master System
              </span>
            </h1>
            <p className="text-xs text-slate-300">
              Student Register, Term Fee Collections & Boarder Pocket Money
            </p>
          </div>
        </div>

        {/* System Counters & Register Lock Control */}
        <div className="flex items-center flex-wrap gap-3">
          
          <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-200">
            <Users className="w-4 h-4 text-indigo-400" />
            <span>Total Boys:</span>
            <span className="text-white font-bold text-sm">{overview?.total_students ?? 740}</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-200">
            <School className="w-4 h-4 text-emerald-400" />
            <span>Classes:</span>
            <span className="text-emerald-400 font-bold text-sm">17</span>
          </div>

          {/* Register Lock Control Pill */}
          <button
            onClick={onOpenLockModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
              isLocked
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
            }`}
            title="Click to toggle register lock status"
          >
            {isLocked ? (
              <>
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>REGISTER LOCKED</span>
              </>
            ) : (
              <>
                <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                <span>REGISTER UNLOCKED</span>
              </>
            )}
          </button>

          {/* Add Student Button */}
          <button
            onClick={onOpenAddStudentModal}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Student</span>
          </button>

        </div>
      </div>

      {/* Main View Navigation Tabs */}
      <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-10 flex items-center gap-1 overflow-x-auto py-1 bg-slate-950">
        
        <button
          onClick={() => onTabChange('dashboard')}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold border-b-2 transition ${
            activeTab === 'dashboard'
              ? 'border-indigo-400 text-indigo-300 bg-indigo-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard Overview</span>
        </button>

        <button
          onClick={() => onTabChange('register')}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold border-b-2 transition ${
            activeTab === 'register'
              ? 'border-indigo-400 text-indigo-300 bg-indigo-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Student Register</span>
        </button>

        <button
          onClick={() => onTabChange('pocket')}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold border-b-2 transition ${
            activeTab === 'pocket'
              ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Wallet className="w-4 h-4 text-emerald-400" />
          <span>Boarder Pocket Money</span>
        </button>

        <button
          onClick={() => onTabChange('reports')}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold border-b-2 transition ${
            activeTab === 'reports'
              ? 'border-purple-400 text-purple-300 bg-purple-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <FileText className="w-4 h-4 text-purple-400" />
          <span>Office Reports</span>
        </button>

      </div>

    </header>
  );
};

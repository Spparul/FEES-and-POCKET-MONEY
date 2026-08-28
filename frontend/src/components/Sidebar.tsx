import React from 'react';
import {
  Users, CreditCard, Wallet, Settings, PanelLeftClose, PanelLeftOpen, Receipt, Calculator
} from 'lucide-react';
import type { StudentFilterParams } from '../api';

interface SidebarProps {
  currentFilters: StudentFilterParams;
  activeView: 'register' | 'fees' | 'quick-search' | 'deficits' | 'excesses' | 'verification' | 'transactions' | 'pocket' | 'reports' | 'settings';
  onNavigate: (view: 'register' | 'fees' | 'quick-search' | 'deficits' | 'excesses' | 'verification' | 'transactions' | 'pocket' | 'reports' | 'settings', filters?: Partial<StudentFilterParams>) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  totalStudentsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentFilters,
  activeView,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  totalStudentsCount = 740,
}) => {
  return (
    <aside
      className={`sticky top-0 h-screen overflow-y-auto ${
        isCollapsed ? 'w-[60px] min-w-[60px]' : 'w-[210px] min-w-[210px]'
      } bg-[var(--bg-sidebar)] text-[var(--text-header)] border-r border-[var(--border-dark)] flex flex-col font-sans select-none z-20 transition-all duration-200`}
    >
      
      {/* Collapse / Expand Toggle Bar */}
      <div className="p-3 border-b border-[var(--border-dark)] flex items-center justify-between sticky top-0 bg-[var(--bg-sidebar)] z-10">
        {!isCollapsed && (
          <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-header-muted)] pl-2" style={{ fontSize: '11px' }}>
            Navigation Index
          </span>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-[var(--text-header-muted)] hover:text-[var(--text-header)] transition mx-auto cursor-pointer"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      {/* Scrollable Clean Navigation Menu */}
      <div className="p-3 flex-1 space-y-4">
        
        {/* SECTION 1: STUDENT REGISTER */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="px-2 py-1 text-xs font-extrabold text-[var(--text-header-muted)] uppercase tracking-wider flex items-center justify-between" style={{ fontSize: '10px' }}>
              <span>Student Register</span>
              <Users className="w-3.5 h-3.5 opacity-70" />
            </div>
          )}

          {/* All Students */}
          <button
            onClick={() => onNavigate('register', {})}
            className={`w-full text-left p-2 rounded-md font-bold transition flex items-center gap-2.5 cursor-pointer text-xs ${
              activeView === 'register' && !Object.values(currentFilters).some(Boolean)
                ? 'bg-[var(--accent-primary)] text-white shadow-sm border border-[var(--border-dark)] font-extrabold'
                : 'hover:bg-white/10 text-[var(--text-header)]'
            }`}
            title={`All Students (${totalStudentsCount})`}
          >
            <Users className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>All Students ({totalStudentsCount})</span>}
          </button>
        </div>

        {/* SECTION 2: SCHOOL FEES */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="px-2 py-1 text-xs font-extrabold text-[var(--text-header-muted)] uppercase tracking-wider flex items-center justify-between" style={{ fontSize: '10px' }}>
              <span>School Fees</span>
              <CreditCard className="w-3.5 h-3.5 opacity-70" />
            </div>
          )}

          {/* Quick Search */}
          <button
            onClick={() => onNavigate('quick-search')}
            className={`w-full text-left p-2 rounded-md font-bold transition flex items-center gap-2.5 cursor-pointer text-xs ${
              activeView === 'quick-search'
                ? 'bg-[var(--accent-primary)] text-white shadow-sm border border-[var(--border-dark)] font-extrabold'
                : 'hover:bg-white/10 text-[var(--text-header)] font-extrabold text-[var(--accent-gold)]'
            }`}
            title="Quick Student Search & Fee Payment"
          >
            <Calculator className="w-4 h-4 flex-shrink-0 text-[var(--accent-gold)]" />
            {!isCollapsed && <span>Quick Search</span>}
          </button>

          <button
            onClick={() => onNavigate('fees')}
            className={`w-full text-left p-2 rounded-md font-bold transition flex items-center gap-2.5 cursor-pointer text-xs ${
              activeView === 'fees'
                ? 'bg-[var(--accent-primary)] text-white shadow-sm border border-[var(--border-dark)] font-extrabold'
                : 'hover:bg-white/10 text-[var(--text-header)]'
            }`}
            title="Fee Collection Ledger & Defaulters"
          >
            <CreditCard className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>Fee Ledger</span>}
          </button>

          <button
            onClick={() => onNavigate('deficits')}
            className={`w-full text-left p-2 rounded-md font-bold transition flex items-center gap-2.5 cursor-pointer text-xs ${
              activeView === 'deficits'
                ? 'bg-[var(--accent-primary)] text-white shadow-sm border border-[var(--border-dark)] font-extrabold'
                : 'hover:bg-white/10 text-[var(--text-header)]'
            }`}
            title="Fee Deficits Register"
          >
            <CreditCard className="w-4 h-4 flex-shrink-0 text-amber-400" />
            {!isCollapsed && <span>Fee Deficits</span>}
          </button>

          <button
            onClick={() => onNavigate('excesses')}
            className={`w-full text-left p-2 rounded-md font-bold transition flex items-center gap-2.5 cursor-pointer text-xs ${
              activeView === 'excesses'
                ? 'bg-[var(--accent-primary)] text-white shadow-sm border border-[var(--border-dark)] font-extrabold'
                : 'hover:bg-white/10 text-[var(--text-header)]'
            }`}
            title="Fee Excesses & Decisions"
          >
            <Wallet className="w-4 h-4 flex-shrink-0 text-green-400" />
            {!isCollapsed && <span>Fee Excesses</span>}
          </button>

          <button
            onClick={() => onNavigate('transactions')}
            className={`w-full text-left p-2 rounded-md font-bold transition flex items-center gap-2.5 cursor-pointer text-xs ${
              activeView === 'transactions'
                ? 'bg-[var(--accent-primary)] text-white shadow-sm border border-[var(--border-dark)] font-extrabold'
                : 'hover:bg-white/10 text-[var(--text-header)]'
            }`}
            title="Fee Payment Transaction Records"
          >
            <Receipt className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>Transaction Records</span>}
          </button>
        </div>


        {/* SECTION 4: ADMINISTRATION */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="px-2 py-1 text-xs font-extrabold text-[var(--text-header-muted)] uppercase tracking-wider flex items-center justify-between" style={{ fontSize: '10px' }}>
              <span>Administration</span>
              <Settings className="w-3.5 h-3.5 opacity-70" />
            </div>
          )}

          <button
            onClick={() => onNavigate('settings')}
            className={`w-full text-left p-2 rounded-md font-bold transition flex items-center gap-2.5 cursor-pointer text-xs ${
              activeView === 'settings'
                ? 'bg-[var(--accent-primary)] text-white shadow-sm border border-[var(--border-dark)] font-extrabold'
                : 'hover:bg-white/10 text-[var(--text-header)]'
            }`}
            title="Appearance & Admin Settings"
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>Appearance & Settings</span>}
          </button>
        </div>

      </div>

      {!isCollapsed && (
        <div className="p-3 bg-black/30 border-t border-[var(--border-dark)] text-xs text-[var(--text-header-muted)] flex items-center justify-between mt-auto" style={{ fontSize: '11px' }}>
          <span className="font-bold">CANISIUS SECONDARY</span>
          <span className="font-mono">v1.0.0</span>
        </div>
      )}

    </aside>
  );
};

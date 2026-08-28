import React from 'react';
import { School, Search, Lock, Unlock, Plus, Palette, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import type { SystemOverview } from '../api';
import type { ThemeId } from '../theme';
import { THEMES } from '../theme';

interface TopBarProps {
  overview: SystemOverview | null;
  currentTheme: ThemeId;
  onThemeChange: (themeId: ThemeId) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenLockModal: () => void;
  onOpenAddStudentModal: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onNavigateHome?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  overview,
  currentTheme,
  onThemeChange,
  searchQuery,
  onSearchChange,
  onOpenLockModal,
  onOpenAddStudentModal,
  isSidebarCollapsed,
  onToggleSidebar,
  onNavigateHome,
}) => {
  const isLocked = overview?.is_register_locked ?? false;

  return (
    <header className="sticky top-0 z-30 bg-[var(--bg-header)] text-[var(--text-header)] shadow-md border-b border-[var(--border-dark)] font-sans">
      <div className="w-full px-4 py-2 flex items-center justify-between gap-3 flex-nowrap" style={{ whiteSpace: 'nowrap' }}>
        
        {/* Left Branding & Sidebar Toggle */}
        <div className="flex items-center gap-2.5 flex-shrink-0" style={{ whiteSpace: 'nowrap' }}>
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[var(--text-header-muted)] hover:text-[var(--text-header)] transition cursor-pointer"
            title={isSidebarCollapsed ? "Expand Sidebar (210px)" : "Collapse Sidebar"}
          >
            {isSidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>

          {/* CLICKABLE SCHOOL LOGO / TITLE NAVIGATION TO HOME */}
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-2 hover:opacity-90 transition text-left cursor-pointer group"
            title="Go to Home Screen"
          >
            <div className="w-7 h-7 rounded-md bg-[var(--accent-gold)] flex items-center justify-center text-slate-950 font-bold shadow-sm group-hover:scale-105 transition">
              <School className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xs font-extrabold tracking-tight leading-none font-heading uppercase text-[var(--text-header)] group-hover:underline" style={{ margin: 0 }}>
                CANISIUS SECONDARY SCHOOL
              </h1>
              <span className="text-[10px] text-[var(--text-header-muted)] font-semibold">Digital School Register</span>
            </div>
          </button>
        </div>

        {/* Global Quick Search */}
        <div className="flex-1 max-w-md relative hidden md:block">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-header-muted)] pointer-events-none z-10 opacity-70" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Global Search: student name, admission..."
            style={{ paddingLeft: '38px' }}
            className="w-full bg-[var(--bg-sidebar)] border border-[var(--border-dark)] rounded-md pr-3 py-1.5 text-xs text-[var(--text-header)] placeholder-[var(--text-header-muted)] focus:outline-none focus:border-[var(--accent-gold)] font-medium transition"
          />
        </div>

        {/* Theme Switcher, Register Lock, New Student */}
        <div className="flex items-center gap-2 flex-shrink-0" style={{ whiteSpace: 'nowrap' }}>
          
          {/* Theme Quick Selector Dropdown (Clean, High-Contrast Text) */}
          <div className="flex items-center gap-1.5 bg-[var(--bg-page)] border border-[var(--border-color)] px-2 py-1 rounded shadow-sm text-xs">
            <Palette className="w-3.5 h-3.5 text-[var(--accent-gold)]" />
            <select
              value={currentTheme}
              onChange={(e) => onThemeChange(e.target.value as ThemeId)}
              className="bg-[var(--bg-page)] text-[var(--text-primary)] font-extrabold focus:outline-none cursor-pointer text-xs border-0 py-0 px-1"
            >
              {THEMES.map((t) => (
                <option key={t.id} value={t.id} className="bg-[var(--bg-card)] text-[var(--text-primary)] font-bold">
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="hidden lg:flex items-center gap-1 text-xs text-[var(--text-header)] bg-[var(--bg-sidebar)] px-2 py-1 rounded-md border border-[var(--border-dark)] font-mono">
            <span className="text-[var(--text-header-muted)]">Year:</span>
            <strong className="font-bold">{overview?.active_academic_year || '2026-2027'}</strong>
          </div>

          {/* LOCK REGISTER BUTTON */}
          <button
            onClick={onOpenLockModal}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition border cursor-pointer ${
              isLocked
                ? 'bg-amber-900/40 text-amber-300 border-amber-500/50 hover:bg-amber-900/60'
                : 'bg-emerald-900/40 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900/60'
            }`}
          >
            {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            <span>{isLocked ? 'Register Locked' : 'Register Unlocked'}</span>
          </button>

          {/* NEW STUDENT BUTTON */}
          <button
            onClick={onOpenAddStudentModal}
            className="flex items-center gap-1 px-3 py-1 rounded-md bg-[var(--accent-gold)] text-slate-950 hover:brightness-110 font-bold transition text-xs shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Student</span>
          </button>

        </div>

      </div>
    </header>
  );
};

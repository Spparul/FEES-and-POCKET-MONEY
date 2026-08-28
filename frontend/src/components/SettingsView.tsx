import React from 'react';
import type { ThemeId } from '../theme';
import { THEMES } from '../theme';
import { Palette, Check, Shield } from 'lucide-react';

interface SettingsViewProps {
  currentTheme: ThemeId;
  onThemeChange: (themeId: ThemeId) => void;
  isLocked: boolean;
  onOpenLockModal: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentTheme,
  onThemeChange,
  isLocked,
  onOpenLockModal,
}) => {
  return (
    <div className="space-y-6 font-sans animate-fadeIn w-full">
      
      {/* Page Title */}
      <div className="pb-2 border-b border-[var(--border-color)]">
        <h2 className="text-xl font-extrabold font-heading text-[var(--text-primary)] tracking-tight">
          System Administration & Appearance Settings
        </h2>
        <p className="text-xs text-[var(--text-secondary)] font-medium">
          Customize the ledger visual theme pack and security lock configurations
        </p>
      </div>

      {/* SECTION 1: VISUAL THEME PACK SELECTION */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6 shadow-sm space-y-4">
        
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-[var(--accent-gold)]" />
          <div>
            <h3 className="text-base font-bold font-heading text-[var(--text-primary)]">
              Ledger Appearance Theme Pack
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Select your preferred physical school register visual theme pack. Switching themes immediately transforms headers, sidebars, ruled tables, and status pills across the application.
            </p>
          </div>
        </div>

        {/* 5 Theme Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {THEMES.map((theme) => {
            const isSelected = currentTheme === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => onThemeChange(theme.id)}
                className={`p-4 rounded-xl border text-left transition flex flex-col justify-between space-y-3 relative ${
                  isSelected
                    ? 'border-[var(--accent-gold)] ring-2 ring-[var(--accent-gold)]/40 bg-[var(--bg-table-head)] shadow-md'
                    : 'border-[var(--border-color)] bg-[var(--bg-page)] hover:border-[var(--text-secondary)]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-[var(--text-primary)] font-heading">{theme.name}</span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-[var(--accent-gold)] text-slate-950 flex items-center justify-center font-bold">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] font-medium">{theme.subtitle}</p>
                </div>

                {/* Color Swatch Preview */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-[var(--border-color)]">
                  <div
                    className="w-6 h-6 rounded-md border shadow-sm"
                    style={{ backgroundColor: theme.headerBg }}
                    title="Header / Nav Color"
                  />
                  <div
                    className="w-6 h-6 rounded-md border shadow-sm"
                    style={{ backgroundColor: theme.pageBg }}
                    title="Paper Background"
                  />
                  <div
                    className="w-6 h-6 rounded-md border shadow-sm"
                    style={{ backgroundColor: theme.cardBg }}
                    title="Card Background"
                  />
                  <div
                    className="w-6 h-6 rounded-md border shadow-sm"
                    style={{ backgroundColor: theme.accent }}
                    title="Accent / Highlight"
                  />
                </div>
              </button>
            );
          })}
        </div>

      </div>

      {/* SECTION 2: REGISTER SECURITY & LOCK CONFIGURATION */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--bg-table-head)] text-[var(--text-primary)] border border-[var(--border-color)] flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-heading text-[var(--text-primary)]">
                Student Register Lock Security
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Status: <strong className={isLocked ? 'text-[var(--pill-due-text)]' : 'text-[var(--pill-paid-text)]'}>
                  {isLocked ? '🔒 REGISTER LOCKED' : '🔓 REGISTER UNLOCKED'}
                </strong> (Admin password required when locked to add or remove student entries)
              </p>
            </div>
          </div>

          <button
            onClick={onOpenLockModal}
            className="px-4 py-2 bg-[var(--accent-gold)] hover:brightness-110 text-slate-950 font-extrabold text-xs rounded-lg transition shadow-sm"
          >
            Configure Lock Status
          </button>
        </div>
      </div>

    </div>
  );
};

import React from 'react';
import { ChevronRight, ArrowLeft } from 'lucide-react';

interface BreadcrumbsProps {
  breadcrumbs: { label: string; action: () => void }[];
  onBack?: () => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ breadcrumbs, onBack }) => {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-[var(--border-color)] text-xs font-sans mb-4">
      
      {/* Breadcrumb Trail */}
      <nav className="flex items-center gap-1.5 overflow-x-auto text-[var(--text-secondary)] font-medium">
        {breadcrumbs.map((crumb, idx) => {
          const isLast = idx === breadcrumbs.length - 1;
          return (
            <React.Fragment key={crumb.label + idx}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 opacity-60 flex-shrink-0" />}
              {isLast ? (
                <span className="font-extrabold text-[var(--text-primary)] font-heading">
                  {crumb.label}
                </span>
              ) : (
                <button
                  onClick={crumb.action}
                  className="hover:text-[var(--text-primary)] hover:underline transition flex-shrink-0"
                >
                  {crumb.label}
                </button>
              )}
            </React.Fragment>
          );
        })}
      </nav>

      {/* Back Action Button */}
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold transition flex-shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
      )}

    </div>
  );
};

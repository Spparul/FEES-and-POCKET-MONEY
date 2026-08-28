import React, { useState } from 'react';
import { School, ArrowRight } from 'lucide-react';
import { formatStandard } from '../utils/formatters';

interface StandardsViewProps {
  onSelectStandardSection: (standard: string, section?: string) => void;
}

export const StandardsView: React.FC<StandardsViewProps> = ({ onSelectStandardSection }) => {
  const [selectedStd, setSelectedStd] = useState<string | null>(null);

  const standardsMap = [
    { std: "VIII", name: "Form 1", desc: "Form 1 (4 Sections)", sections: ["E", "EE", "G", "GG"], total: "~180 boys" },
    { std: "IX", name: "Form 2", desc: "Form 2 (4 Sections)", sections: ["E", "EE", "G", "GG"], total: "~180 boys" },
    { std: "X", name: "Form 3", desc: "Form 3 (3 Sections)", sections: ["A", "B", "S"], total: "~129 boys" },
    { std: "XI", name: "11", desc: "11 (3 Sections)", sections: ["A", "B", "S"], total: "~129 boys" },
    { std: "XII", name: "12", desc: "12 (3 Sections)", sections: ["A", "B", "S"], total: "~132 boys" },
  ];

  const currentStdConfig = standardsMap.find(s => s.std === selectedStd);

  return (
    <div className="space-y-4 font-sans animate-fadeIn w-full">
      
      <div className="pb-2 border-b border-[var(--border-color)]">
        <h2 className="text-sm font-extrabold font-heading text-[var(--text-primary)] tracking-tight">
          School Classes Navigator
        </h2>
        <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">
          Select a class or section to open its dedicated student register.
        </p>
      </div>

      {/* STEP 1: STANDARDS SELECTION */}
      {!selectedStd ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {standardsMap.map((s) => (
            <button
              key={s.std}
              onClick={() => setSelectedStd(s.std)}
              className="card hover:bg-[var(--bg-hover)] p-4 rounded-xl text-left transition group shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-[var(--bg-table-head)] text-[var(--text-primary)] border border-[var(--border-color)] font-mono">
                    {s.name}
                  </span>
                  <ArrowRight size={15} className="text-[var(--text-secondary)] group-hover:text-[var(--accent-gold)] group-hover:translate-x-1 transition" />
                </div>
                <h3 className="text-lg font-extrabold font-mono text-[var(--text-primary)]">
                  {s.name}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">{s.desc}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-[var(--border-color)] flex items-center gap-1 flex-wrap">
                <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">Sections:</span>
                {s.sections.map((sec) => (
                  <span key={sec} className="text-xs font-bold px-2 py-0.5 rounded bg-[var(--bg-page)] text-[var(--text-primary)] border border-[var(--border-color)] font-mono">
                    {sec}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      ) : (
        /* STEP 2: SECTION SELECTION FOR CHOSEN STANDARD */
        <div className="card rounded-xl p-4 shadow-sm space-y-4">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-gold)] text-slate-950 flex items-center justify-center font-bold">
                <School size={16} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold font-heading text-[var(--text-primary)]">
                  {formatStandard(selectedStd)} Classes
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">{currentStdConfig?.desc}</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedStd(null)}
              className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold underline"
            >
              ← Back to All Classes
            </button>
          </div>

          <div>
            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider block mb-2">
              Select Section in {formatStandard(selectedStd)}:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              
              {/* All Sections Button */}
              <button
                onClick={() => onSelectStandardSection(selectedStd)}
                className="p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-page)] hover:bg-[var(--bg-hover)] text-left font-bold cursor-pointer text-xs"
              >
                All Sections ({formatStandard(selectedStd)})
              </button>

              {currentStdConfig?.sections.map((sec) => (
                <button
                  key={sec}
                  onClick={() => onSelectStandardSection(selectedStd, sec)}
                  className="p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-page)] hover:bg-[var(--bg-hover)] text-left font-bold cursor-pointer text-xs"
                >
                  Section {sec}
                </button>
              ))}

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

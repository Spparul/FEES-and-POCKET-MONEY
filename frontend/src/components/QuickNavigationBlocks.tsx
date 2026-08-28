import React from 'react';
import { Filter, CheckCircle2, Clock, XCircle, RotateCcw } from 'lucide-react';
import type { StudentFilterParams } from '../api';

interface QuickNavigationBlocksProps {
  currentFilters: StudentFilterParams;
  onFilterChange: (filters: Partial<StudentFilterParams>) => void;
  onResetFilters: () => void;
}

export const QuickNavigationBlocks: React.FC<QuickNavigationBlocksProps> = ({
  currentFilters,
  onFilterChange,
  onResetFilters,
}) => {
  const standards = ["VIII", "IX", "X", "XI", "XII"];
  const categories = [
    { label: "Day Scholars", value: "DAY_SCHOLAR" },
    { label: "Ordinary Hostellers", value: "HOSTEL_ORDINARY" },
    { label: "Special Scheme", value: "HOSTEL_SPECIAL" },
  ];
  const feeStatuses = [
    { label: "Fully Paid", value: "Fully Paid", icon: CheckCircle2, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
    { label: "2 Terms Paid", value: "Two Terms Paid", icon: Clock, color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30" },
    { label: "1 Term Paid", value: "One Term Paid", icon: Clock, color: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
    { label: "No Payment", value: "No Fees Paid", icon: XCircle, color: "text-rose-400 bg-rose-500/10 border-rose-500/30" },
    { label: "1 Term Due", value: "One Term Due", icon: Clock, color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
    { label: "2 Terms Due", value: "Two Terms Due", icon: Clock, color: "text-orange-400 bg-orange-500/10 border-orange-500/30" },
    { label: "3 Terms Due", value: "Three Terms Due", icon: XCircle, color: "text-rose-400 bg-rose-500/10 border-rose-500/30" },
  ];

  const activeCount = Object.values(currentFilters).filter(Boolean).length;

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 mb-6 backdrop-blur font-sans">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
            Quick Navigation & Filters
          </h2>
          {activeCount > 0 && (
            <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30 font-medium">
              {activeCount} active filter{activeCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={onResetFilters}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition bg-slate-800/80 hover:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* STANDARDS BLOCK */}
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2.5">
            Standards
          </span>
          <div className="flex flex-wrap gap-2">
            {standards.map((std) => {
              const isSelected = currentFilters.standard === std;
              return (
                <button
                  key={std}
                  onClick={() => onFilterChange({ standard: isSelected ? undefined : std, section: undefined })}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition border ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                      : 'bg-slate-800/70 text-slate-300 border-slate-700/80 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  Standard {std}
                </button>
              );
            })}
          </div>
        </div>

        {/* HOSTEL / DAY SCHOLAR BLOCK */}
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2.5">
            Hostel / Day Scholar
          </span>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const isSelected = currentFilters.boarding_category === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => onFilterChange({ boarding_category: isSelected ? undefined : cat.value })}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition border ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                      : 'bg-slate-800/70 text-slate-300 border-slate-700/80 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* FEE STATUS BLOCK */}
        <div className="lg:col-span-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2.5">
            Fee Status Entry Points
          </span>
          <div className="flex flex-wrap gap-2">
            {feeStatuses.map((fs) => {
              const isSelected = currentFilters.fee_status === fs.value;
              const Icon = fs.icon;
              return (
                <button
                  key={fs.value}
                  onClick={() => onFilterChange({ fee_status: isSelected ? undefined : fs.value })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                    isSelected
                      ? 'bg-slate-100 text-slate-950 border-white font-semibold shadow-md'
                      : `${fs.color} hover:brightness-125`
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{fs.label}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

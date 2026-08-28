import React, { useEffect, useState } from 'react';
import type { SystemOverview, DashboardSummary, FeeDrillDownResponse, StudentFilterParams } from '../api';
import { getDashboardSummary, getFeeDrilldown } from '../api';
import { formatStandard } from '../utils/formatters';
import { Users, CreditCard, Wallet, Calendar, RefreshCw, ChevronDown, ChevronRight, ArrowRight, Layers, AlertTriangle } from 'lucide-react';

interface HomeViewProps {
  overview: SystemOverview | null;
  onNavigateToRegister: (filters?: Partial<StudentFilterParams>) => void;
  onNavigateToFeeStatus: (filters?: Partial<StudentFilterParams>) => void;
  onNavigateToPocketMoney: () => void;
  onNavigateToExcesses: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigateToRegister,
  onNavigateToFeeStatus,
  onNavigateToPocketMoney,
  onNavigateToExcesses,
}) => {
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [drilldown, setDrilldown] = useState<FeeDrillDownResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Expandable Tree state
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);
  const [expandedStd, setExpandedStd] = useState<string | null>(null);

  const fetchDashboardData = () => {
    setLoading(true);
    Promise.all([
      getDashboardSummary(academicYear),
      getFeeDrilldown(academicYear)
    ])
      .then(([summaryData, drilldownData]) => {
        setSummary(summaryData);
        setDrilldown(drilldownData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboardData();
  }, [academicYear]);

  const toggleTerm = (tName: string) => {
    if (expandedTerm === tName) {
      setExpandedTerm(null);
      setExpandedStd(null);
    } else {
      setExpandedTerm(tName);
      setExpandedStd(null);
    }
  };

  const toggleStd = (stdName: string) => {
    if (expandedStd === stdName) {
      setExpandedStd(null);
    } else {
      setExpandedStd(stdName);
    }
  };

  return (
    <div className="space-y-4 font-sans animate-fadeIn w-full">
      
      {/* Top Banner Header (+4px font size) */}
      <div className="card px-4 py-3 rounded-xl shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3 w-full">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-[var(--accent-gold)] text-slate-950 font-extrabold text-xs uppercase tracking-wider">
              Live Database Dashboard
            </span>
            <h1 className="text-lg font-extrabold font-heading text-[var(--text-primary)]">
              CANISIUS SECONDARY SCHOOL
            </h1>
          </div>
          <p className="text-xs text-[var(--text-secondary)] font-semibold mt-1">
            Comprehensive Overview of Active Students, Fee Ledger Drill-Down, and Hosteller Pocket Money.
          </p>
        </div>

        {/* Academic Year Dropdown & Refresh Button */}
        <div className="flex items-center gap-2 self-start lg:self-center">
          <div className="flex items-center gap-2 bg-[var(--bg-page)] border border-[var(--border-color)] px-3 py-1.5 rounded text-xs">
            <Calendar size={15} className="text-[var(--accent-gold)]" />
            <span className="font-bold text-[var(--text-secondary)] uppercase text-xs">Year:</span>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="bg-transparent font-extrabold font-mono text-[var(--text-primary)] focus:outline-none cursor-pointer text-xs"
            >
              <option value="2026-2027">2026–2027</option>
              <option value="2025-2026">2025–2026</option>
              <option value="2024-2025">2024–2025</option>
            </select>
          </div>

          <button
            onClick={fetchDashboardData}
            className="p-1.5 rounded bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold transition cursor-pointer"
            title="Refresh Dashboard Summary Data"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 5 OVERVIEW CARDS (+4px larger metric typography) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 w-full">
        
        {/* Card 1: Active Student Registry */}
        <div className="card px-4 py-3 rounded-xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold text-[var(--text-secondary)] uppercase tracking-wider">
                Active Student Registry
              </span>
              <div className="w-7 h-7 rounded bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                <Users size={15} />
              </div>
            </div>
            <div className="text-xl font-extrabold font-mono text-[var(--text-primary)] mb-1">
              {summary?.students.active || 726} <span className="text-xs font-sans font-bold text-[var(--text-secondary)]">Active Boys</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] font-semibold">
              726 Active Boys Across 17 Classes (Excludes 14 Transferred)
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-[var(--border-color)] flex items-center justify-between gap-1 text-xs">
            <button
              onClick={() => onNavigateToRegister({ status: 'ACTIVE' })}
              className="text-[var(--accent-gold)] font-extrabold flex items-center gap-1 hover:gap-1.5 transition cursor-pointer"
            >
              <span>Active Register</span>
              <ArrowRight size={13} />
            </button>
            <button
              onClick={() => onNavigateToRegister({ status: 'TRANSFERRED' })}
              className="text-amber-700 dark:text-amber-400 font-extrabold hover:underline transition cursor-pointer"
              title="Check 14 Transferred Students"
            >
              <span>Transferred (14)</span>
            </button>
          </div>
        </div>

        {/* Card 2: Total Fees Collected */}
        <div className="card px-4 py-3 rounded-xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold text-[var(--text-secondary)] uppercase tracking-wider">
                Fees Collected
              </span>
              <div className="w-7 h-7 rounded bg-[var(--pill-paid-bg)] text-[var(--pill-paid-text)] border border-[var(--pill-paid-border)] flex items-center justify-center font-bold">
                <CreditCard size={15} />
              </div>
            </div>
            <div className="text-xl font-extrabold font-mono text-[var(--pill-paid-text)] mb-1">
              K {Math.round(summary?.fee_summary.total_collected || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-[var(--text-secondary)] font-semibold">
              {summary?.fee_summary.collection_percentage || 0}% of K {Math.round(summary?.fee_summary.total_expected || 0).toLocaleString('en-IN')} Expected
            </p>
          </div>
          <button
            onClick={() => onNavigateToFeeStatus()}
            className="mt-3 pt-2 border-t border-[var(--border-color)] text-[var(--accent-gold)] font-extrabold flex items-center gap-1.5 hover:gap-2 transition text-xs cursor-pointer"
          >
            <span>Open Fee Ledger</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Card 3: Total Outstanding Fees */}
        <div className="card px-4 py-3 rounded-xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold text-[var(--text-secondary)] uppercase tracking-wider">
                Fees Not Paid
              </span>
              <div className="w-7 h-7 rounded bg-[var(--pill-due-bg)] text-[var(--pill-due-text)] border border-[var(--pill-due-border)] flex items-center justify-center font-bold">
                <CreditCard size={15} />
              </div>
            </div>
            <div className="text-xl font-extrabold font-mono text-[var(--pill-due-text)] mb-1">
              K {Math.round(summary?.fee_summary.total_outstanding || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-[var(--text-secondary)] font-semibold">
              {summary?.fee_summary.status_counts['No Fees Paid'] || 0} Boys with 0 Fees Paid
            </p>
          </div>
          <button
            onClick={() => onNavigateToFeeStatus({ fee_status: 'No Fees Paid' })}
            className="mt-3 pt-2 border-t border-[var(--border-color)] text-[var(--accent-gold)] font-extrabold flex items-center gap-1.5 hover:gap-2 transition text-xs cursor-pointer"
          >
            <span>View All Unpaid Pupils</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Card 4: Boarder Pocket Money */}
        <div className="card px-4 py-3 rounded-xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold text-[var(--text-secondary)] uppercase tracking-wider">
                Pocket Money Held
              </span>
              <div className="w-7 h-7 rounded bg-[var(--pill-paid-bg)] text-[var(--pill-paid-text)] border border-[var(--pill-paid-border)] flex items-center justify-center font-bold">
                <Wallet size={15} />
              </div>
            </div>
            <div className="text-xl font-extrabold font-mono text-[var(--text-primary)] mb-1">
              K {Math.round(summary?.pocket_money.currently_held || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-[var(--text-secondary)] font-semibold">
              Across {summary?.pocket_money.hostellers_count ?? 662} Active Hosteller Accounts (Excludes Transferred)
            </p>
          </div>
          <button
            onClick={onNavigateToPocketMoney}
            className="mt-3 pt-2 border-t border-[var(--border-color)] text-[var(--accent-gold)] font-extrabold flex items-center gap-1.5 hover:gap-2 transition text-xs cursor-pointer"
          >
            <span>Hosteller Pocket Money</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Card 5: Fee Excess - Amount to Refund */}
        <div className="card px-4 py-3 rounded-xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold text-[var(--text-secondary)] uppercase tracking-wider">
                Refunds Pending
              </span>
              <div className="w-7 h-7 rounded bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
                <AlertTriangle size={15} />
              </div>
            </div>
            <div className="text-xl font-extrabold font-mono text-amber-800 mb-1">
              K {Math.round(((summary as any)?.fee_financials?.money_to_return_parent || 0) + ((summary as any)?.fee_financials?.money_to_return_sponsor || 0)).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-[var(--text-secondary)] font-semibold">
              Parent: K {Math.round((summary as any)?.fee_financials?.money_to_return_parent || 0).toLocaleString('en-IN')} • Sponsor: K {Math.round((summary as any)?.fee_financials?.money_to_return_sponsor || 0).toLocaleString('en-IN')}
            </p>
          </div>
          <button
            onClick={onNavigateToExcesses}
            className="mt-3 pt-2 border-t border-[var(--border-color)] text-amber-700 font-extrabold flex items-center gap-1.5 hover:gap-2 transition text-xs cursor-pointer"
          >
            <span>View Fee Excesses</span>
            <ArrowRight size={14} />
          </button>
        </div>

      </div>

      {/* HIERARCHICAL FEE DRILL-DOWN TREE (+4px larger typography, only 11 and 12 for grades) */}
      <div className="card rounded-xl p-4 shadow-sm space-y-4 w-full">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--border-color)]">
          <div>
            <div className="flex items-center gap-2">
              <Layers size={17} className="text-[var(--accent-gold)]" />
              <h3 className="text-sm font-extrabold text-[var(--text-primary)]">
                Interactive Fee Collection Drill-Down
              </h3>
            </div>
            <p className="text-xs text-[var(--text-secondary)] font-semibold mt-1">
              Click any Term to expand Grade breakdown, then click a Grade to reveal Sections, and click a Section to launch the Fee Ledger pre-filtered!
            </p>
          </div>

          <span className="px-2.5 py-1 rounded bg-[var(--bg-table-head)] border border-[var(--border-color)] text-[var(--text-primary)] font-mono font-bold text-xs self-start sm:self-center">
            Source of Truth: SQLite DB
          </span>
        </div>

        {/* TERM DRILL-DOWN TREE */}
        <div className="space-y-3">
          {['Term 1', 'Term 2', 'Term 3'].map((tName) => {
            const termNode = drilldown?.terms[tName];
            const isTermExpanded = expandedTerm === tName;
            const collected = termNode?.collected || 0;
            const expected = termNode?.expected || 0;
            const due = termNode?.due || 0;
            const collectionRate = expected > 0 ? ((collected / expected) * 100).toFixed(1) : '0.0';

            return (
              <div key={tName} className="border border-[var(--border-color)] rounded-lg overflow-hidden shadow-2xs transition">
                
                {/* TERM LEVEL ROW */}
                <div
                  onClick={() => toggleTerm(tName)}
                  className={`px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer transition select-none ${
                    isTermExpanded ? 'bg-[var(--bg-table-head)] border-b border-[var(--border-color)]' : 'hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded bg-[var(--accent-gold)] text-slate-950 flex items-center justify-center font-bold text-xs">
                      {isTermExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-[var(--text-primary)]">
                        {tName}
                      </h4>
                      <p className="text-xs text-[var(--text-secondary)] font-semibold uppercase tracking-wider">
                        Click to explore Grade Breakdown
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 font-mono text-xs">
                    <div>
                      <span className="text-xs font-sans font-bold text-[var(--text-secondary)] block uppercase">Collected</span>
                      <strong className="text-[var(--pill-paid-text)] font-extrabold text-sm">K {Math.round(collected).toLocaleString('en-IN')}</strong>
                    </div>

                    <div className="hidden md:block">
                      <span className="text-xs font-sans font-bold text-[var(--text-secondary)] block uppercase">Expected</span>
                      <strong className="text-[var(--text-primary)] font-bold text-sm">K {Math.round(expected).toLocaleString('en-IN')}</strong>
                    </div>

                    <div className="hidden md:block">
                      <span className="text-xs font-sans font-bold text-[var(--text-secondary)] block uppercase">Outstanding</span>
                      <strong className="text-[var(--pill-due-text)] font-bold text-sm">K {Math.round(due).toLocaleString('en-IN')}</strong>
                    </div>

                    <span className="px-2.5 py-1 rounded bg-[var(--pill-paid-bg)] border border-[var(--pill-paid-border)] text-[var(--pill-paid-text)] font-sans font-extrabold text-xs">
                      {collectionRate}%
                    </span>
                  </div>
                </div>

                {/* EXPANDED GRADES BREAKDOWN UNDER TERM */}
                {isTermExpanded && termNode && (
                  <div className="p-3 bg-[var(--bg-page)] space-y-2.5">
                    <div className="text-xs font-extrabold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                      {tName} — Class Breakdown (Click a Class to view Sections):
                    </div>

                    {['VIII', 'IX', 'X', 'XI', 'XII'].map((stdName) => {
                      const stdNode = termNode.standards[stdName];
                      const isStdExpanded = expandedStd === stdName;
                      const stdCollected = stdNode?.collected || 0;
                      const stdCount = stdNode?.student_count || 0;
                      const formattedGradeName = formatStandard(stdName);

                      return (
                        <div key={stdName} className="border border-[var(--border-color)] bg-[var(--bg-card)] rounded-lg overflow-hidden">
                          
                          {/* CLASS LEVEL ROW */}
                          <div
                            onClick={() => toggleStd(stdName)}
                            className={`px-3.5 py-2 flex items-center justify-between gap-2 cursor-pointer transition select-none ${
                              isStdExpanded ? 'bg-[var(--bg-table-head)] border-b border-[var(--border-color)]' : 'hover:bg-[var(--bg-hover)]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-5 h-5 rounded bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] flex items-center justify-center font-bold text-xs">
                                {isStdExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                              </div>
                              <span className="font-extrabold text-[var(--text-primary)] text-xs">
                                {formattedGradeName}
                              </span>
                            </div>

                            <div className="flex items-center gap-5 font-mono text-xs">
                              <span className="text-[var(--text-secondary)] font-sans font-semibold text-xs">
                                {stdCount} students
                              </span>
                              <strong className="text-[var(--pill-paid-text)] font-extrabold text-xs">
                                K {Math.round(stdCollected).toLocaleString('en-IN')}
                              </strong>
                            </div>
                          </div>

                          {/* EXPANDED SECTIONS BREAKDOWN UNDER GRADE */}
                          {isStdExpanded && stdNode && (
                            <div className="p-3 bg-[var(--bg-page)] border-t border-[var(--border-color)] space-y-2">
                              <div className="text-xs font-extrabold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                                {tName} • Grade {formattedGradeName} — Sections (Click Section to open Fee Ledger):
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                                {Object.entries(stdNode.sections).map(([secName, secNode]) => (
                                  <button
                                    key={secName}
                                    onClick={() => onNavigateToFeeStatus({
                                      academic_year: academicYear,
                                      term: tName,
                                      standard: stdName,
                                      section: secName,
                                    })}
                                    className="p-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--accent-gold)] hover:bg-[var(--bg-hover)] transition flex items-center justify-between gap-2 text-left cursor-pointer group text-xs"
                                  >
                                    <div>
                                      <span className="font-extrabold text-[var(--text-primary)] block group-hover:text-[var(--accent-gold)] text-xs">
                                        Section {secName}
                                      </span>
                                      <span className="text-xs text-[var(--text-secondary)] font-mono font-bold">
                                        {secNode.student_count} boys
                                      </span>
                                    </div>

                                    <div className="text-right font-mono">
                                      <span className="font-extrabold text-[var(--pill-paid-text)] block text-xs">
                                        K {Math.round(secNode.collected).toLocaleString('en-IN')}
                                      </span>
                                      <span className="text-xs text-[var(--accent-gold)] font-sans font-extrabold flex items-center gap-0.5">
                                        <span>Ledger</span>
                                        <ArrowRight size={11} />
                                      </span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                        </div>
                      );
                    })}

                  </div>
                )}

              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
};

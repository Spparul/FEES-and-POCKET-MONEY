import React, { useState, useEffect } from 'react';
import { Search, AlertTriangle, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

interface FeeDeficitItem {
  id: number;
  student_id: number;
  pay_id: string;
  student_name: string;
  class_name: string;
  section: string;
  boarding_category: string;
  is_sponsored: boolean;
  sponsor_name?: string;
  academic_year: string;
  term_name: string;
  expected_amount: number;
  allocated_amount: number;
  deficit_amount: number;
  status: string;
  created_at?: string;
}

export const FeeDeficitsView: React.FC = () => {
  const [deficits, setDeficits] = useState<FeeDeficitItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [classFilter, setClassFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  const fetchDeficits = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/deficits?status_filter=${statusFilter}&search=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setDeficits(data.deficits || []);
      }
    } catch (err) {
      console.error("Failed to fetch deficits:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeficits();
  }, [statusFilter, searchQuery]);

  const filtered = deficits.filter((d) => {
    if (!classFilter) return true;
    return d.class_name === classFilter;
  });

  const totalOutstandingSum = filtered
    .filter((d) => d.status === 'OUTSTANDING')
    .reduce((sum, d) => sum + d.deficit_amount, 0);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const pageData = filtered.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-4 animate-fade">
      
      {/* Header & Prominent Outstanding Metric Card */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-[var(--text-primary)] flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-800" />
            FEE DEFICITS REGISTER & AUDIT LEDGER
          </h2>
          <p className="text-xs text-[var(--text-secondary)] font-semibold mt-0.5">
            Independent ledger of all fee obligations where payments were less than required. (NO NETTING ENFORCED)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-900 font-mono flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-amber-800">TOTAL OUTSTANDING DEFICIT:</span>
            <span className="text-sm font-extrabold">K {Math.round(totalOutstandingSum).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Filter Control Box */}
      <div className="filter-box p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center flex-wrap gap-2 flex-1">
          <Filter size={13} className="text-[var(--accent-gold)]" />
          <span className="font-extrabold text-[var(--text-secondary)] uppercase">FILTERS:</span>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="select-field text-xs h-7 py-0 px-2 font-bold"
          >
            <option value="ALL">All Deficits</option>
            <option value="OUTSTANDING">Outstanding (Unpaid)</option>
            <option value="PARTIALLY_CLEARED">Partially Cleared</option>
            <option value="CLEARED">Cleared / Paid</option>
          </select>

          {/* Quick Search */}
          <div className="relative flex-1 min-w-[180px] max-w-[240px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none z-10 opacity-70" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search PayID, Student Name..."
              style={{ paddingLeft: '38px' }}
              className="w-full bg-[var(--bg-page)] border border-[var(--border-color)] rounded pr-2.5 py-1 text-xs text-[var(--text-primary)] font-bold focus:outline-none"
            />
          </div>

          {/* Class Filter */}
          <select
            value={classFilter}
            onChange={(e) => {
              setClassFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="select-field text-xs h-7 py-0 px-2 font-bold"
          >
            <option value="">All Classes (Form 1 - 12)</option>
            <option value="Form 1">Form 1</option>
            <option value="Form 2">Form 2</option>
            <option value="Form 3">Form 3</option>
            <option value="11">11</option>
            <option value="12">12</option>
          </select>
        </div>
      </div>

      {/* DEFICITS TABLE (RECORD COUNTER ON TOP) */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg overflow-hidden shadow-sm w-full">
        
        {/* TOP RECORD COUNTER BAR */}
        <div className="px-3.5 py-2 bg-[var(--bg-table-head)] border-b border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-xs">
          <span className="text-[var(--text-secondary)] font-semibold">
            Showing <strong className="text-[var(--text-primary)]">{filtered.length > 0 ? startIndex + 1 : 0}</strong> to <strong className="text-[var(--text-primary)]">{Math.min(startIndex + pageSize, filtered.length)}</strong> of <strong className="text-[var(--text-primary)]">{filtered.length}</strong> deficit records (Page {currentPage} of {totalPages})
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="px-2.5 py-0.5 rounded bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-color)] font-bold disabled:opacity-40 transition flex items-center gap-1 cursor-pointer text-xs"
            >
              <ChevronLeft size={13} />
              <span>Prev</span>
            </button>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="px-2.5 py-0.5 rounded bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-color)] font-bold disabled:opacity-40 transition flex items-center gap-1 cursor-pointer text-xs"
            >
              <span>Next</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-[var(--text-primary)] ledger-table text-xs">
            <thead className="bg-[var(--bg-table-head)] text-[var(--text-primary)] font-extrabold uppercase tracking-wider border-b border-[var(--border-color)]">
              <tr>
                <th className="py-2 px-3 font-mono font-bold border-r border-[var(--border-color)]" style={{ width: '14%' }}>PAY ID</th>
                <th className="py-2 px-3 font-extrabold border-r border-[var(--border-color)]" style={{ width: '26%' }}>STUDENT NAME</th>
                <th className="py-2 px-2 text-center font-bold border-r border-[var(--border-color)]" style={{ width: '8%' }}>CLASS</th>
                <th className="py-2 px-2 text-center font-bold border-r border-[var(--border-color)]" style={{ width: '6%' }}>SEC</th>
                <th className="py-2 px-3 font-bold border-r border-[var(--border-color)]" style={{ width: '12%' }}>TERM</th>
                <th className="py-2 px-3 text-right font-bold border-r border-[var(--border-color)]" style={{ width: '11%' }}>EXPECTED</th>
                <th className="py-2 px-3 text-right font-bold border-r border-[var(--border-color)]" style={{ width: '11%' }}>PAID</th>
                <th className="py-2 px-3 text-right font-extrabold border-r border-[var(--border-color)]" style={{ width: '12%' }}>DEFICIT</th>
                <th className="py-2 px-2 text-center font-bold" style={{ width: '10%' }}>STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)] font-medium text-xs">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[var(--text-secondary)] font-bold">
                    Loading fee deficit records...
                  </td>
                </tr>
              ) : pageData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[var(--text-secondary)] font-bold">
                    No fee deficits found matching selected search.
                  </td>
                </tr>
              ) : (
                pageData.map((d) => (
                  <tr key={d.id} className="hover:bg-[var(--bg-hover)] transition">
                    <td className="py-2 px-3 font-mono font-bold text-[var(--text-secondary)] border-r border-[var(--border-color)]">
                      {d.pay_id}
                    </td>
                    <td className="py-2 px-3 border-r border-[var(--border-color)]">
                      <div className="font-extrabold text-[var(--text-primary)]">{d.student_name}</div>
                      {d.is_sponsored && (
                        <div className="text-[10px] text-green-800 font-bold">
                          {d.sponsor_name || 'Sponsored'}
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-2 text-center font-extrabold border-r border-[var(--border-color)] text-[var(--text-primary)]">
                      {d.class_name}
                    </td>
                    <td className="py-2 px-2 text-center font-bold border-r border-[var(--border-color)] text-[var(--text-primary)]">
                      {d.section || '—'}
                    </td>
                    <td className="py-2 px-3 font-bold border-r border-[var(--border-color)] text-[var(--text-primary)]">
                      {d.term_name}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold border-r border-[var(--border-color)] text-[var(--text-secondary)]">
                      K {Math.round(d.expected_amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold border-r border-[var(--border-color)] text-[var(--pill-paid-text)]">
                      K {Math.round(d.allocated_amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-extrabold border-r border-[var(--border-color)] text-amber-900">
                      K {Math.round(d.deficit_amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-extrabold uppercase border ${
                        d.status === 'OUTSTANDING'
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : d.status === 'PARTIALLY_CLEARED'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-green-100 text-green-800 border-green-300'
                      }`}>
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

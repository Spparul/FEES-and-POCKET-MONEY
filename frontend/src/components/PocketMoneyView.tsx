import React, { useEffect, useState } from 'react';
import type { Student } from '../api';
import { getStudents } from '../api';
import { printDataset } from '../utils/printHelper';
import { formatStandard } from '../utils/formatters';
import { Wallet, Search, Printer, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

interface PocketMoneyViewProps {
  students?: Student[];
  onSelectStudent: (student: Student) => void;
  onOpenPocketMoneyModal: (student: Student) => void;
}

export const PocketMoneyView: React.FC<PocketMoneyViewProps> = ({
  students: propStudents,
  onSelectStudent,
  onOpenPocketMoneyModal,
}) => {
  const [boarders, setBoarders] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // Status Filter (Excludes TRANSFERRED by default)
  const [currentPage, setCurrentPage] = useState(1);
  const [printing, setPrinting] = useState(false);
  const pageSize = 10; // strictly 10 records per page

  const fetchBoarders = () => {
    setLoading(true);
    getStudents({ boarding_category: undefined, status: 'ALL' })
      .then((data) => {
        // EXCLUDE DAY SCHOLARS
        const hostellersOnly = data.filter(s => s.boarding_category !== 'DAY_SCHOLAR');
        setBoarders(hostellersOnly);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (propStudents && propStudents.length > 0) {
      const hostellersOnly = propStudents.filter(s => s.boarding_category !== 'DAY_SCHOLAR');
      setBoarders(hostellersOnly);
      setLoading(false);
    } else {
      fetchBoarders();
    }
  }, [propStudents]);

  // Active hostellers count (excluding transferred)
  const activeBoarders = boarders.filter(s => s.status !== 'TRANSFERRED');
  const ordinaryCount = activeBoarders.filter(s => s.boarding_category === 'HOSTEL_ORDINARY').length;
  const specialCount = activeBoarders.filter(s => s.boarding_category === 'HOSTEL_SPECIAL').length;

  const filteredBoarders = boarders.filter(s => {
    // Status Filter (Default to ACTIVE hostellers)
    const matchesStatus = statusFilter === 'TRANSFERRED'
      ? s.status === 'TRANSFERRED'
      : statusFilter === 'ALL'
      ? true
      : s.status !== 'TRANSFERRED';

    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.admission_no.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !categoryFilter || s.boarding_category === categoryFilter;
    
    return matchesStatus && matchesSearch && matchesCategory;
  });

  const totalHeldBalance = activeBoarders.reduce((acc, s) => acc + (s.pocket_money?.current_balance || 0), 0);
  const totalReceived = activeBoarders.reduce((acc, s) => acc + (s.pocket_money?.total_received || 0), 0);
  const totalGiven = activeBoarders.reduce((acc, s) => acc + (s.pocket_money?.total_given || 0), 0);
  const totalReturned = activeBoarders.reduce((acc, s) => acc + (s.pocket_money?.total_returned || 0), 0);

  const totalFilteredCount = filteredBoarders.length;
  const totalPages = Math.ceil(totalFilteredCount / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedBoarders = filteredBoarders.slice(startIndex, startIndex + pageSize);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handlePrintPocketMoney = () => {
    setPrinting(true);
    try {
      printDataset({
        title: 'BOARDER POCKET MONEY LEDGER REPORT',
        subtitle: `Hosteller Accounts (${filteredBoarders.length} boys)`,
        academicYear: '2026–2027',
        activeFilters: { boarding_category: categoryFilter || 'Ordinary & Special Scheme' },
        columns: [
          { header: 'Admission No', accessor: (s: Student) => s.admission_no, width: '15%' },
          { header: 'Student Name', accessor: (s: Student) => s.name, width: '23%' },
          { header: 'Class', accessor: (s: Student) => formatStandard(s.current_standard), align: 'center', width: '8%' },
          { header: 'Sec', accessor: (s: Student) => s.current_section || '—', align: 'center', width: '6%' },
          { header: 'Category', accessor: (s: Student) => s.boarding_category.replace('HOSTEL_', ''), width: '14%' },
          { header: 'Received (K)', accessor: (s: Student) => `K ${Math.round(s.pocket_money?.total_received || 0).toLocaleString('en-IN')}`, align: 'right', width: '10%' },
          { header: 'Given (K)', accessor: (s: Student) => `K ${Math.round(s.pocket_money?.total_given || 0).toLocaleString('en-IN')}`, align: 'right', width: '10%' },
          { header: 'Held Balance (K)', accessor: (s: Student) => `K ${Math.round(s.pocket_money?.current_balance || 0).toLocaleString('en-IN')}`, align: 'right', width: '14%' },
        ],
        data: filteredBoarders,
      });
    } catch (err) {
      console.error(err);
      alert('Failed to print pocket money dataset.');
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="space-y-3 font-sans animate-fadeIn w-full">
      
      {/* Header Summary Bar */}
      <div className="card px-3.5 py-2.5 rounded-lg shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3 w-full">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[var(--pill-paid-bg)] text-[var(--pill-paid-text)] border border-[var(--pill-paid-border)] flex items-center justify-center font-bold">
              <Wallet size={14} />
            </div>
            <h2 className="text-sm font-extrabold font-heading text-[var(--text-primary)]">
              Boarder Pocket Money Ledger
            </h2>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] font-semibold mt-0.5">
            Dedicated ledger for hostellers ({ordinaryCount} Ordinary & {specialCount} Special Scheme).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintPocketMoney}
            disabled={printing || filteredBoarders.length === 0}
            className="btn btn-primary flex items-center gap-1.5 px-3 py-1 text-xs"
            title="Print all filtered hosteller pocket money accounts"
          >
            <Printer size={13} className={printing ? 'animate-bounce' : ''} />
            <span>{printing ? 'Preparing Print...' : 'Print Results'}</span>
          </button>

          <div className="bg-[var(--pill-paid-bg)] border border-[var(--pill-paid-border)] px-3 py-1 rounded text-[var(--pill-paid-text)] shadow-sm font-mono text-xs flex items-center gap-2">
            <span className="font-sans font-extrabold uppercase text-[10px]">Total Held:</span>
            <span className="font-extrabold font-mono text-sm">K {Math.round(totalHeldBalance).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* 4 Stat Boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
        <div className="card px-3.5 py-2 rounded-lg shadow-sm">
          <span className="text-[var(--text-secondary)] font-extrabold uppercase block text-[10px] tracking-wider mb-0.5">Active Hostellers</span>
          <span className="text-base font-extrabold font-mono text-[var(--text-primary)]">{activeBoarders.length} boys</span>
        </div>
        <div className="card px-3.5 py-2 rounded-lg shadow-sm">
          <span className="text-[var(--text-secondary)] font-extrabold uppercase block text-[10px] tracking-wider mb-0.5">Total Deposits (Parents)</span>
          <span className="text-base font-extrabold font-mono text-[var(--pill-paid-text)]">K {Math.round(totalReceived).toLocaleString('en-IN')}</span>
        </div>
        <div className="card px-3.5 py-2 rounded-lg shadow-sm">
          <span className="text-[var(--text-secondary)] font-extrabold uppercase block text-[10px] tracking-wider mb-0.5">Disbursed to Students</span>
          <span className="text-base font-extrabold font-mono text-[var(--accent-gold)]">K {Math.round(totalGiven).toLocaleString('en-IN')}</span>
        </div>
        <div className="card px-3.5 py-2 rounded-lg shadow-sm">
          <span className="text-[var(--text-secondary)] font-extrabold uppercase block text-[10px] tracking-wider mb-0.5">Returned to Parents</span>
          <span className="text-base font-extrabold font-mono text-[var(--text-primary)]">K {Math.round(totalReturned).toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* SEARCH BAR & BOARDER TYPE / STATUS FILTER WITH STUDENT COUNTS */}
      <div className="filter-box rounded-lg px-3.5 py-2 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-2 w-full text-xs">
        
        {/* Filters Container */}
        <div className="flex items-center flex-wrap gap-2 text-[var(--text-secondary)] font-extrabold uppercase tracking-wider text-xs">
          <Filter size={13} className="text-[var(--accent-gold)]" />
          
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className={`select-field text-xs py-1 px-2 h-7 font-bold ${
              statusFilter === 'TRANSFERRED' ? 'bg-amber-100 text-amber-900 border-amber-400' : ''
            }`}
          >
            <option value="">Active Hostellers Only ({activeBoarders.length})</option>
            <option value="TRANSFERRED">Transferred Hostellers Only</option>
            <option value="ALL">All Hostellers (Inc Transferred)</option>
          </select>

          {/* Boarder Category Filter Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="select-field text-xs py-1 px-2 h-7 font-bold"
          >
            <option value="">All Boarder Types ({activeBoarders.length} boys)</option>
            <option value="HOSTEL_ORDINARY">Ordinary Hostellers ({ordinaryCount} boys)</option>
            <option value="HOSTEL_SPECIAL">Special Scheme ({specialCount} boys)</option>
          </select>

          {/* Quick Count Pill Badges */}
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="px-2 py-0.5 rounded bg-[var(--bg-table-head)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-[10px]">
              Ordinary: {ordinaryCount}
            </span>
            <span className="px-2 py-0.5 rounded bg-[var(--bg-table-head)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-[10px]">
              Special: {specialCount}
            </span>
          </div>
        </div>

        {/* Quick Search Input */}
        <div className="flex-1 relative w-full sm:w-auto max-w-[260px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none z-10 opacity-70" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search hosteller name, admission no..."
            style={{ paddingLeft: '38px' }}
            className="w-full bg-[var(--bg-page)] border border-[var(--border-color)] rounded pr-2.5 py-1 text-xs text-[var(--text-primary)] font-bold focus:outline-none focus:border-[var(--accent-gold)]"
          />
        </div>

      </div>

      {/* BOARDER POCKET MONEY TABLE WITH SEPARATE SEC COLUMN (RECORD COUNTER ON TOP) */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg overflow-hidden shadow-sm w-full">
        
        {/* TOP RECORD COUNTER BAR */}
        <div className="px-3.5 py-2 bg-[var(--bg-table-head)] border-b border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-xs">
          <span className="text-[var(--text-secondary)] font-semibold">
            Showing <strong className="text-[var(--text-primary)]">{totalFilteredCount > 0 ? startIndex + 1 : 0}</strong> to <strong className="text-[var(--text-primary)]">{Math.min(startIndex + pageSize, totalFilteredCount)}</strong> of <strong className="text-[var(--text-primary)]">{totalFilteredCount}</strong> records (Page {currentPage} of {totalPages})
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="px-2.5 py-0.5 rounded bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-color)] font-bold disabled:opacity-40 transition flex items-center gap-1 cursor-pointer text-xs"
            >
              <ChevronLeft size={13} />
              <span>Prev</span>
            </button>

            <button
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="px-2.5 py-0.5 rounded bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-color)] font-bold disabled:opacity-40 transition flex items-center gap-1 cursor-pointer text-xs"
            >
              <span>Next</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto min-w-full w-full">
          <table className="w-full text-left text-[var(--text-primary)] ledger-table text-xs">
            <thead className="bg-[var(--bg-table-head)] text-[var(--text-primary)] font-extrabold uppercase tracking-wider border-b border-[var(--border-color)]">
              <tr>
                <th className="py-2 px-3 font-mono font-bold border-r border-[var(--border-color)]" style={{ width: '15%' }}>ADMISSION NO.</th>
                <th className="py-2 px-3 font-extrabold border-r border-[var(--border-color)]" style={{ width: '23%' }}>STUDENT NAME</th>
                <th className="py-2 px-2 text-center font-bold border-r border-[var(--border-color)]" style={{ width: '8%' }}>CLASS</th>
                <th className="py-2 px-2 text-center font-bold border-r border-[var(--border-color)]" style={{ width: '6%' }}>SEC</th>
                <th className="py-2 px-3 font-bold border-r border-[var(--border-color)]" style={{ width: '16%' }}>CATEGORY</th>
                <th className="py-2 px-3 text-right font-bold border-r border-[var(--border-color)]" style={{ width: '10%' }}>RECEIVED</th>
                <th className="py-2 px-3 text-right font-bold border-r border-[var(--border-color)]" style={{ width: '10%' }}>GIVEN</th>
                <th className="py-2 px-3 text-right font-extrabold border-r border-[var(--border-color)]" style={{ width: '12%' }}>HELD BALANCE</th>
                <th className="py-2 px-2 text-center font-bold" style={{ width: '10%' }}>ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)] font-medium text-xs">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[var(--text-secondary)] font-bold">
                    <div className="inline-flex items-center gap-2 text-xs">
                      <div className="w-4 h-4 border-2 border-[var(--accent-gold)] border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading boarder accounts...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedBoarders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[var(--text-secondary)] font-bold text-xs">
                    No hostellers match your search query or selected boarder type.
                  </td>
                </tr>
              ) : (
                paginatedBoarders.map((student) => {
                  const pm = student.pocket_money;
                  const isTransferred = student.status === 'TRANSFERRED';

                  return (
                    <tr key={student.id} className={`transition ${isTransferred ? 'bg-amber-500/5 hover:bg-amber-500/10' : 'hover:bg-[var(--bg-hover)]'}`}>
                      <td className="py-2 px-3 font-mono font-bold text-[var(--text-secondary)] border-r border-[var(--border-color)]">
                        {student.admission_no}
                      </td>
                      <td className="py-2 px-3 font-extrabold text-[var(--text-primary)] border-r border-[var(--border-color)]">
                        <div className="flex flex-col">
                          <button
                            onClick={() => onSelectStudent(student)}
                            className="hover:text-[var(--accent-gold)] transition text-left cursor-pointer font-extrabold"
                          >
                            {student.name}
                          </button>
                          {isTransferred && (
                            <span className="text-[10px] font-bold text-amber-800 uppercase">
                              (Transferred)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-2 text-center font-extrabold text-[var(--text-primary)] border-r border-[var(--border-color)]">
                        {formatStandard(student.current_standard)}
                      </td>
                      <td className="py-2 px-2 text-center font-extrabold text-[var(--text-primary)] border-r border-[var(--border-color)]">
                        {student.current_section || '—'}
                      </td>
                      <td className="py-2 px-3 text-[var(--text-primary)] font-bold border-r border-[var(--border-color)]">
                        {student.boarding_category.replace('HOSTEL_', '')}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-[var(--text-primary)] border-r border-[var(--border-color)]">
                        K {Math.round(pm?.total_received || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-[var(--text-primary)] border-r border-[var(--border-color)]">
                        K {Math.round(pm?.total_given || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-extrabold text-[var(--pill-paid-text)] border-r border-[var(--border-color)]">
                        K {Math.round(pm?.current_balance || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {!isTransferred ? (
                          <button
                            onClick={() => onOpenPocketMoneyModal(student)}
                            className="px-2 py-1 rounded bg-[var(--pill-paid-bg)] text-[var(--pill-paid-text)] border border-[var(--pill-paid-border)] font-extrabold transition hover:brightness-105 cursor-pointer text-xs"
                          >
                            Record Tx
                          </button>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-500 font-bold text-[10px] cursor-not-allowed inline-block">
                            Tx Disabled
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

import React, { useState } from 'react';
import type { Student, StudentFilterParams } from '../api';
import { getStudents } from '../api';
import { printDataset } from '../utils/printHelper';
import { formatStandard } from '../utils/formatters';
import { Filter, RotateCcw, CreditCard, Eye, ChevronLeft, ChevronRight, Printer } from 'lucide-react';

interface FeeStatusViewProps {
  students: Student[];
  loading: boolean;
  filters: StudentFilterParams;
  onFilterChange: (newFilters: Partial<StudentFilterParams>) => void;
  onResetFilters: () => void;
  onSelectStudent: (student: Student) => void;
  onPayFee: (student: Student) => void;
}

export const FeeStatusView: React.FC<FeeStatusViewProps> = ({
  students,
  loading,
  filters,
  onFilterChange,
  onResetFilters,
  onSelectStudent,
  onPayFee,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [printing, setPrinting] = useState(false);
  const pageSize = 10; // strictly 10 records per page

  const formatCategory = (cat: string) => {
    switch (cat) {
      case 'DAY_SCHOLAR':
        return 'Day Scholar';
      case 'HOSTEL_ORDINARY':
        return 'Ordinary Hosteller';
      case 'HOSTEL_SPECIAL':
        return 'Special Scheme';
      default:
        return cat;
    }
  };

  // Filter out transferred students unless status is explicitly TRANSFERRED or ALL
  const activeStudents = students.filter((s) => {
    if (filters.status === 'TRANSFERRED') return s.status === 'TRANSFERRED';
    if (filters.status && filters.status !== 'ALL') return s.status === filters.status;
    return s.status !== 'TRANSFERRED';
  });

  // Apply fee_status filter to show only pupils matching payment status
  const feeStatusFiltered = filters.fee_status
    ? activeStudents.filter((s) => {
        const paidCount = s.fee_overview?.terms_paid_count ?? 0;
        if (filters.fee_status === 'No Fees Paid') return paidCount === 0;
        if (filters.fee_status === 'Fully Paid') return paidCount === 3;
        if (filters.fee_status === 'One Term Paid') return paidCount === 1;
        if (filters.fee_status === 'Two Terms Paid') return paidCount === 2;
        return true;
      })
    : activeStudents;

  // FILTERED HEADER FINANCIAL SUMMARY STRIP
  const matchingCount = feeStatusFiltered.length;
  
  let filteredExpected = 0.0;
  let filteredPaid = 0.0;
  let filteredDue = 0.0;

  feeStatusFiltered.forEach((s) => {
    const feeOverview = s.fee_overview;
    if (!feeOverview) return;

    if (filters.term) {
      const tDetail = feeOverview.term_details.find((t) => t.term_name === filters.term);
      if (tDetail) {
        filteredExpected += tDetail.expected_amount;
        filteredPaid += tDetail.paid_amount;
        filteredDue += tDetail.due_amount;
      }
    } else {
      filteredExpected += feeOverview.total_expected;
      filteredPaid += feeOverview.total_paid;
      filteredDue += feeOverview.total_due;
    }
  });

  const collectionRate = filteredExpected > 0 ? ((filteredPaid / filteredExpected) * 100).toFixed(1) : '0.0';

  const totalPages = Math.ceil(matchingCount / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedStudents = feeStatusFiltered.slice(startIndex, startIndex + pageSize);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handlePrintFilteredFees = async () => {
    setPrinting(true);
    try {
      const allMatchingData = await getStudents(filters);
      const printData = allMatchingData.filter(s => filters.status === 'TRANSFERRED' ? s.status === 'TRANSFERRED' : s.status !== 'TRANSFERRED');

      printDataset({
        title: 'FEE COLLECTION LEDGER REPORT',
        subtitle: `${filters.term ? `${filters.term} • ` : ''}${filters.standard ? `Grade ${formatStandard(filters.standard)} • ` : ''}${filters.section ? `Section ${filters.section} • ` : ''}Matching Dataset (${printData.length} records)`,
        academicYear: '2026–2027',
        activeFilters: filters,
        columns: [
          { header: 'Admission No', accessor: (s: Student) => s.admission_no, width: '15%' },
          { header: 'Student Name', accessor: (s: Student) => s.name, width: '25%' },
          { header: 'Grade', accessor: (s: Student) => formatStandard(s.current_standard), align: 'center', width: '8%' },
          { header: 'Sec', accessor: (s: Student) => s.current_section || '—', align: 'center', width: '8%' },
          { header: 'Boarding Category', accessor: (s: Student) => formatCategory(s.boarding_category), width: '20%' },
          { header: 'T1 Status', accessor: (s: Student) => (s.fee_overview?.term_details[0]?.status === 'Paid' ? 'PAID' : 'DUE'), align: 'center', width: '8%' },
          { header: 'T2 Status', accessor: (s: Student) => (s.fee_overview?.term_details[1]?.status === 'Paid' ? 'PAID' : 'DUE'), align: 'center', width: '8%' },
          { header: 'T3 Status', accessor: (s: Student) => (s.fee_overview?.term_details[2]?.status === 'Paid' ? 'PAID' : 'DUE'), align: 'center', width: '8%' },
        ],
        data: printData,
      });
    } catch (err) {
      console.error(err);
      alert('Failed to generate printable document.');
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="space-y-3 font-sans animate-fadeIn w-full">
      
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[var(--border-color)] w-full">
        <div>
          <h2 className="text-sm font-extrabold font-heading text-[var(--text-primary)] tracking-tight flex items-center gap-2">
            FEE COLLECTION LEDGER
            {filters.term && (
              <span className="px-2 py-0.5 rounded bg-[var(--accent-gold)] text-slate-950 font-mono text-xs font-bold">
                {filters.term}
              </span>
            )}
            {filters.standard && (
              <span className="px-2 py-0.5 rounded bg-[var(--bg-table-head)] text-[var(--text-primary)] border border-[var(--border-color)] font-mono text-xs font-semibold">
                Grade {formatStandard(filters.standard)}{filters.section ? ` - ${filters.section}` : ''}
              </span>
            )}
          </h2>
          <p className="text-[var(--text-secondary)] text-xs font-semibold mt-0.5">
            Academic Year 2026–27 • Showing {matchingCount > 0 ? startIndex + 1 : 0}–{Math.min(startIndex + pageSize, matchingCount)} of {matchingCount} matching records
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* PRINT BUTTON */}
          <button
            onClick={handlePrintFilteredFees}
            disabled={printing || matchingCount === 0}
            className="btn btn-primary flex items-center gap-1.5 px-3 py-1 text-xs"
            title="Print all matching fee ledger records"
          >
            <Printer size={13} className={printing ? 'animate-bounce' : ''} />
            <span>{printing ? 'Preparing...' : 'Print Results'}</span>
          </button>

          {/* Reset Filters Button */}
          {Object.values(filters).some(Boolean) && (
            <button
              onClick={() => {
                onResetFilters();
                setCurrentPage(1);
              }}
              className="btn btn-secondary flex items-center gap-1.5 px-3 py-1 text-xs"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* FINANCIAL SUMMARY STRIP */}
      <div className="card px-4 py-3 rounded-xl shadow-sm flex flex-wrap items-center justify-between gap-4 font-mono w-full">
        <div className="flex items-center gap-5 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-secondary)] font-sans font-extrabold text-sm uppercase tracking-wide">MATCHING BOYS:</span>
            <strong className="text-[var(--text-primary)] font-extrabold text-base font-mono">{matchingCount}</strong>
          </div>

          <div className="h-6 w-px bg-[var(--border-color)] hidden sm:block"></div>

          <div className="flex items-center gap-2">
            <span className="text-[var(--text-secondary)] font-sans font-extrabold text-sm uppercase tracking-wide">
              {filters.term ? `${filters.term} EXPECTED:` : 'ANNUAL EXPECTED:'}
            </span>
            <strong className="text-[var(--text-primary)] font-extrabold text-base font-mono">K {Math.round(filteredExpected).toLocaleString('en-IN')}</strong>
          </div>

          <div className="h-6 w-px bg-[var(--border-color)] hidden sm:block"></div>

          <div className="flex items-center gap-2">
            <span className="text-[var(--pill-paid-text)] font-sans font-extrabold text-sm uppercase tracking-wide">COLLECTED:</span>
            <strong className="text-[var(--pill-paid-text)] font-extrabold text-base font-mono">K {Math.round(filteredPaid).toLocaleString('en-IN')}</strong>
          </div>

          <div className="h-6 w-px bg-[var(--border-color)] hidden sm:block"></div>

          <div className="flex items-center gap-2">
            <span className="text-[var(--pill-due-text)] font-sans font-extrabold text-sm uppercase tracking-wide">OUTSTANDING:</span>
            <strong className="text-[var(--pill-due-text)] font-extrabold text-base font-mono">K {Math.round(filteredDue).toLocaleString('en-IN')}</strong>
          </div>
        </div>

        <div className="bg-[var(--pill-paid-bg)] border border-[var(--pill-paid-border)] px-3 py-1 rounded-lg text-[var(--pill-paid-text)] font-sans font-extrabold text-sm">
          {collectionRate}% Collection
        </div>
      </div>

      {/* FILTER BAR CONTAINER */}
      <div className="filter-box rounded-lg px-3.5 py-2.5 shadow-sm flex flex-wrap items-center justify-between gap-2 w-full text-xs">
        <div className="flex items-center flex-wrap gap-2">
          <div className="flex items-center gap-1 text-[var(--text-secondary)] font-extrabold uppercase tracking-wider text-xs">
            <Filter size={13} className="text-[var(--accent-gold)]" />
            <span>LEDGER FILTERS:</span>
          </div>

          {/* Student Status Filter */}
          <select
            value={filters.status || ''}
            onChange={(e) => {
              onFilterChange({ status: e.target.value || undefined });
              setCurrentPage(1);
            }}
            className={`select-field text-xs py-1 px-2 h-7 font-extrabold ${
              filters.status === 'TRANSFERRED' ? 'bg-amber-100 text-amber-900 border-amber-400' : ''
            }`}
          >
            <option value="">Active Boys Only (726)</option>
            <option value="TRANSFERRED">Transferred Boys Only (14 Transferred)</option>
            <option value="ALL">All Statuses (Inc Transferred)</option>
          </select>

          {/* Term Filter Dropdown */}
          <select
            value={filters.term || ''}
            onChange={(e) => {
              onFilterChange({ term: e.target.value || undefined });
              setCurrentPage(1);
            }}
            className="select-field text-xs py-1 px-2 h-7"
          >
            <option value="">All Terms (Term 1 - 3)</option>
            <option value="Term 1">Term 1 Only</option>
            <option value="Term 2">Term 2 Only</option>
            <option value="Term 3">Term 3 Only</option>
          </select>

          {/* Class / Standard Dropdown (Form 1, Form 2, Form 3, 11, 12) */}
          <select
            value={filters.academic_level || ''}
            onChange={(e) => {
              onFilterChange({ academic_level: e.target.value || undefined, standard: undefined, section: undefined });
              setCurrentPage(1);
            }}
            className="select-field text-xs py-1 px-2 h-7 font-bold"
          >
            <option value="">All Classes (Form 1 - 12)</option>
            <option value="Form 1">Form 1</option>
            <option value="Form 2">Form 2</option>
            <option value="Form 3">Form 3</option>
            <option value="11">11</option>
            <option value="12">12</option>
          </select>

          {/* Section Dropdown */}
          <select
            value={filters.section || ''}
            onChange={(e) => {
              onFilterChange({ section: e.target.value || undefined });
              setCurrentPage(1);
            }}
            className="select-field text-xs py-1 px-2 h-7"
          >
            <option value="">All Sections</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="S">Section S</option>
            <option value="E">Section E</option>
            <option value="EE">Section EE</option>
            <option value="G">Section G</option>
            <option value="GG">Section GG</option>
          </select>
        </div>
      </div>

      {/* FEE LEDGER TABLE (RECORD COUNTER ON TOP) */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg overflow-hidden shadow-sm w-full">
        
        {/* TOP RECORD COUNTER BAR */}
        <div className="px-3.5 py-2 bg-[var(--bg-table-head)] border-b border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-xs">
          <span className="text-[var(--text-secondary)] font-semibold">
            Showing <strong className="text-[var(--text-primary)]">{matchingCount > 0 ? startIndex + 1 : 0}</strong> to <strong className="text-[var(--text-primary)]">{Math.min(startIndex + pageSize, matchingCount)}</strong> of <strong className="text-[var(--text-primary)]">{matchingCount}</strong> records (Page {currentPage} of {totalPages})
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

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-[var(--text-primary)] ledger-table text-xs">
            <thead className="bg-[var(--bg-table-head)] text-[var(--text-primary)] font-extrabold uppercase tracking-wider border-b border-[var(--border-color)]">
              <tr>
                <th className="py-2 px-3 font-mono font-bold border-r border-[var(--border-color)]" style={{ width: '15%' }}>ADMISSION NO.</th>
                <th className="py-2 px-3 font-extrabold border-r border-[var(--border-color)]" style={{ width: '25%' }}>STUDENT NAME</th>
                <th className="py-2 px-2 text-center font-bold border-r border-[var(--border-color)]" style={{ width: '6%' }}>CLASS</th>
                <th className="py-2 px-2 text-center font-bold border-r border-[var(--border-color)]" style={{ width: '6%' }}>SEC</th>
                <th className="py-2 px-3 font-bold border-r border-[var(--border-color)]" style={{ width: '18%' }}>CATEGORY</th>
                <th className="py-2 px-2 text-center font-extrabold border-r border-[var(--border-color)]" style={{ width: '6%' }}>T1</th>
                <th className="py-2 px-2 text-center font-extrabold border-r border-[var(--border-color)]" style={{ width: '6%' }}>T2</th>
                <th className="py-2 px-2 text-center font-extrabold border-r border-[var(--border-color)]" style={{ width: '6%' }}>T3</th>
                <th className="py-2 px-2 text-center font-extrabold border-r border-[var(--border-color)]" style={{ width: '8%' }}>PAID</th>
                <th className="py-2 px-2 text-center font-bold" style={{ width: '10%' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)] font-medium text-xs">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-[var(--text-secondary)] font-bold">
                    <div className="inline-flex items-center gap-2 text-xs">
                      <div className="w-4 h-4 border-2 border-[var(--accent-gold)] border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading fee ledger...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-[var(--text-secondary)] font-bold text-xs">
                    No student fee records match the selected criteria.
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((student) => {
                  const feeOverview = student.fee_overview;
                  const t1 = feeOverview?.term_details[0]?.status === 'Paid';
                  const t2 = feeOverview?.term_details[1]?.status === 'Paid';
                  const t3 = feeOverview?.term_details[2]?.status === 'Paid';
                  const paidCount = feeOverview?.terms_paid_count ?? 0;
                  const isTransferred = student.status === 'TRANSFERRED';

                  return (
                    <tr
                      key={student.id}
                      className={`transition group ${isTransferred ? 'bg-amber-500/5 hover:bg-amber-500/10' : 'hover:bg-[var(--bg-hover)]'}`}
                    >
                      {/* Admission Number */}
                      <td className="py-2 px-3 font-mono font-bold text-[var(--text-secondary)] border-r border-[var(--border-color)]">
                        {student.admission_no}
                      </td>

                      {/* Student Name */}
                      <td className="py-2 px-3 font-extrabold text-[var(--text-primary)] border-r border-[var(--border-color)]">
                        <div className="flex flex-col">
                          <button
                            onClick={() => onSelectStudent(student)}
                            className="hover:text-[var(--accent-gold)] transition text-left cursor-pointer flex items-center gap-1.5 font-extrabold"
                          >
                            <span>{student.name}</span>
                            {student.is_sponsored && (
                              <span 
                                className="inline-block w-2 h-2 rounded-full bg-emerald-600 shadow-sm"
                                title={`Sponsored by: ${student.sponsor_name || 'Sponsored'}`}
                              />
                            )}
                          </button>
                          {student.is_sponsored && (
                            <span className="text-[10px] font-bold text-emerald-700">
                              {student.sponsor_name || 'Sponsored'}
                            </span>
                          )}
                          {isTransferred && (
                            <span className="text-[10px] font-bold text-amber-800 uppercase">
                              (Transferred)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Grade (Formatted as 11, 12, etc.) */}
                      <td className="py-2 px-2 text-center font-extrabold text-[var(--text-primary)] border-r border-[var(--border-color)]">
                        {formatStandard(student.current_standard)}
                      </td>

                      {/* Section */}
                      <td className="py-2 px-2 text-center font-extrabold text-[var(--text-primary)] border-r border-[var(--border-color)]">
                        {student.current_section || '—'}
                      </td>

                      {/* Boarding Category */}
                      <td className="py-2 px-3 text-[var(--text-primary)] font-bold border-r border-[var(--border-color)]">
                        {formatCategory(student.boarding_category)}
                      </td>

                      {/* Term 1 Status Badge */}
                      <td className="py-2 px-2 text-center border-r border-[var(--border-color)]">
                        {t1 ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded text-xs font-bold bg-[var(--pill-paid-bg)] text-[var(--pill-paid-text)] border border-[var(--pill-paid-border)]">
                            ✓
                          </span>
                        ) : (
                          <span className="text-[var(--text-secondary)] font-extrabold text-xs opacity-50">—</span>
                        )}
                      </td>

                      {/* Term 2 Status Badge */}
                      <td className="py-2 px-2 text-center border-r border-[var(--border-color)]">
                        {t2 ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded text-xs font-bold bg-[var(--pill-paid-bg)] text-[var(--pill-paid-text)] border border-[var(--pill-paid-border)]">
                            ✓
                          </span>
                        ) : (
                          <span className="text-[var(--text-secondary)] font-extrabold text-xs opacity-50">—</span>
                        )}
                      </td>

                      {/* Term 3 Status Badge */}
                      <td className="py-2 px-2 text-center border-r border-[var(--border-color)]">
                        {t3 ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded text-xs font-bold bg-[var(--pill-paid-bg)] text-[var(--pill-paid-text)] border border-[var(--pill-paid-border)]">
                            ✓
                          </span>
                        ) : (
                          <span className="text-[var(--text-secondary)] font-extrabold text-xs opacity-50">—</span>
                        )}
                      </td>

                      {/* Terms Paid Count Badge */}
                      <td className="py-2 px-2 text-center border-r border-[var(--border-color)]">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono font-extrabold border ${
                          paidCount === 3
                            ? 'bg-[var(--pill-paid-bg)] text-[var(--pill-paid-text)] border-[var(--pill-paid-border)]'
                            : 'bg-[var(--pill-due-bg)] text-[var(--pill-due-text)] border-[var(--pill-due-border)]'
                        }`}>
                          {paidCount} / 3
                        </span>
                      </td>

                      {/* Actions (Strictly Block Payment for Transferred Students) */}
                      <td className="py-2 px-2 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {!isTransferred ? (
                            <button
                              onClick={() => onPayFee(student)}
                              className="p-1 rounded bg-[var(--accent-gold)] text-slate-950 font-extrabold shadow-sm hover:brightness-110 transition cursor-pointer"
                              title="Record Fee Payment"
                            >
                              <CreditCard size={13} />
                            </button>
                          ) : (
                            <span 
                              className="p-1 rounded bg-slate-200 text-slate-400 cursor-not-allowed inline-block opacity-60"
                              title="Payment disabled for Transferred Student"
                            >
                              <CreditCard size={13} />
                            </span>
                          )}
                          <button
                            onClick={() => onSelectStudent(student)}
                            className="p-1 rounded bg-[var(--bg-table-head)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-color)] font-bold transition cursor-pointer"
                            title="View Profile"
                          >
                            <Eye size={13} />
                          </button>
                        </div>
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

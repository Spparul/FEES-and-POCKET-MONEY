import React, { useState } from 'react';
import type { Student, StudentFilterParams } from '../api';
import { getStudents } from '../api';
import { printDataset } from '../utils/printHelper';
import { formatStandard, formatCategory } from '../utils/formatters';
import { Filter, RotateCcw, Eye, ChevronLeft, ChevronRight, Printer, CreditCard } from 'lucide-react';

interface StudentRegisterViewProps {
  students: Student[];
  loading: boolean;
  filters: StudentFilterParams;
  onFilterChange: (newFilters: Partial<StudentFilterParams>) => void;
  onResetFilters: () => void;
  onSelectStudent: (student: Student) => void;
  onPayFee: (student: Student) => void;
  onPocketMoney: (student: Student) => void;
}

export const StudentRegisterView: React.FC<StudentRegisterViewProps> = ({
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
  // Exclude TRANSFERRED students unless status filter is explicitly set to TRANSFERRED
  const activeStudents = students.filter((s) => {
    if (filters.status === 'TRANSFERRED') return s.status === 'TRANSFERRED';
    if (filters.status && filters.status !== 'ALL') return s.status === filters.status;
    return s.status !== 'TRANSFERRED';
  });

  const totalStudentsCount = 726; // active non-transferred count
  const totalFilteredCount = activeStudents.length;
  const totalPages = Math.ceil(totalFilteredCount / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedStudents = activeStudents.slice(startIndex, startIndex + pageSize);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handlePrintFilteredResults = async () => {
    setPrinting(true);
    try {
      const allMatchingData = await getStudents(filters);
      const printData = allMatchingData.filter(s => filters.status === 'TRANSFERRED' ? s.status === 'TRANSFERRED' : s.status !== 'TRANSFERRED');

      printDataset({
        title: 'STUDENT REGISTER REPORT',
        subtitle: `Filtered Dataset (${printData.length} records)`,
        academicYear: '2026–2027',
        activeFilters: filters,
        columns: [
          { header: 'Admission No', accessor: (s: Student) => s.admission_no, width: '15%' },
          { header: 'Student Name', accessor: (s: Student) => s.name, width: '25%' },
          { header: 'Grade', accessor: (s: Student) => formatStandard(s.current_standard), align: 'center', width: '10%' },
          { header: 'Sec', accessor: (s: Student) => s.current_section || '—', align: 'center', width: '8%' },
          { header: 'Category', accessor: (s: Student) => formatCategory(s.boarding_category), width: '18%' },
          { header: 'Status', accessor: (s: Student) => s.status, align: 'center', width: '12%' },
          { header: 'Sponsor', accessor: (s: Student) => s.is_sponsored ? (s.sponsor_name || 'Sponsored') : 'Self-Paid', width: '12%' },
        ],
        data: printData,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="space-y-3 animate-fade font-sans">
      {/* Top Title & Quick Print Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-color)] pb-2">
        <div>
          <h2 className="text-sm font-extrabold font-heading text-[var(--text-primary)] tracking-tight flex items-center gap-2">
            STUDENT REGISTER
            {filters.standard && (
              <span className="px-2 py-0.5 rounded text-xs bg-[var(--bg-table-head)] text-[var(--text-primary)] border border-[var(--border-color)] font-sans">
                Grade {formatStandard(filters.standard)} {filters.section ? `- ${filters.section}` : ''}
              </span>
            )}
          </h2>
          <p className="text-[11px] text-[var(--text-secondary)] font-semibold mt-0.5">
            {filters.status === 'TRANSFERRED' ? (
              `Historical Archive • Showing ${totalFilteredCount > 0 ? startIndex + 1 : 0}–${Math.min(startIndex + pageSize, totalFilteredCount)} of ${totalFilteredCount} Transferred Student Records (Left School)`
            ) : totalFilteredCount === totalStudentsCount ? (
              `Academic Year 2026–27 • Showing ${totalFilteredCount > 0 ? startIndex + 1 : 0}–${Math.min(startIndex + pageSize, totalFilteredCount)} of ${totalStudentsCount} total active student records`
            ) : (
              `Academic Year 2026–27 • Showing ${totalFilteredCount > 0 ? startIndex + 1 : 0}–${Math.min(startIndex + pageSize, totalFilteredCount)} of ${totalFilteredCount} matching records`
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintFilteredResults}
            disabled={printing || totalFilteredCount === 0}
            className="btn btn-primary flex items-center gap-1.5 px-3 py-1 text-xs"
            title="Print all matching filtered student records"
          >
            <Printer size={13} className={printing ? 'animate-bounce' : ''} />
            <span>{printing ? 'Preparing...' : 'Print Results'}</span>
          </button>

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

      {/* FILTER CONTROL PANEL WITH EXPLICIT BACKGROUND FILL (PREVENTS NUDE LOOK) */}
      <div className="filter-box rounded-lg px-3.5 py-2.5 shadow-sm flex flex-wrap items-center justify-between gap-2 w-full text-xs">
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] font-extrabold uppercase tracking-wider">
          <Filter size={13} className="text-[var(--accent-gold)]" />
          <span>FILTERS:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search Field */}
          <div className="relative flex-1 min-w-[180px]">
            <input
              type="text"
              placeholder="Search student name, admission number..."
              value={filters.search || ''}
              onChange={(e) => {
                onFilterChange({ search: e.target.value || undefined });
                setCurrentPage(1);
              }}
              className="w-full bg-[var(--bg-page)] border border-[var(--border-color)] rounded px-2.5 py-1 text-xs text-[var(--text-primary)] font-bold focus:outline-none focus:border-[var(--accent-gold)]"
            />
          </div>

          {/* Boarding Category Filter */}
          <select
            value={filters.boarding_category || ''}
            onChange={(e) => {
              onFilterChange({ boarding_category: e.target.value || undefined });
              setCurrentPage(1);
            }}
            className="select-field text-xs py-1 px-2 h-7"
          >
            <option value="">All Boarding Categories</option>
            <option value="DAY_SCHOLAR">Day Scholar</option>
            <option value="HOSTEL_ORDINARY">Ordinary Hosteller</option>
            <option value="HOSTEL_SPECIAL">Special Scheme</option>
          </select>

          {/* Status Filter (Excludes Transferred by Default) */}
          <select
            value={filters.status || ''}
            onChange={(e) => {
              onFilterChange({ status: e.target.value || undefined });
              setCurrentPage(1);
            }}
            className="select-field text-xs py-1 px-2 h-7"
          >
            <option value="">Active Boys Only (Default)</option>
            <option value="TRANSFERRED">Transferred Boys Only</option>
            <option value="FINISHED">Finished Boys Only</option>
            <option value="ALL">All Statuses (Inc Transferred)</option>
          </select>

          {/* Sponsorship Filter */}
          <select
            value={filters.is_sponsored === undefined ? '' : filters.is_sponsored ? 'sponsored' : 'self'}
            onChange={(e) => {
              const val = e.target.value;
              onFilterChange({
                is_sponsored: val === 'sponsored' ? true : val === 'self' ? false : undefined,
                sponsor_name: val ? filters.sponsor_name : undefined
              });
              setCurrentPage(1);
            }}
            className="select-field text-xs py-1 px-2 h-7"
          >
            <option value="">All Sponsorship Categories</option>
            <option value="sponsored">All Sponsored Boys</option>
            <option value="self">Self-Paid Boys</option>
          </select>

          {/* Specific Sponsor Name Dropdown */}
          <select
            value={filters.sponsor_name || ''}
            onChange={(e) => {
              onFilterChange({
                sponsor_name: e.target.value || undefined,
                is_sponsored: e.target.value ? true : filters.is_sponsored
              });
              setCurrentPage(1);
            }}
            className="select-field text-xs py-1 px-2 h-7"
          >
            <option value="">All Sponsor Names</option>
            <option value="CDF Monze Central">CDF Monze Central</option>
            <option value="CDF Livingstone">CDF Livingstone</option>
            <option value="CDF Mazabuka">CDF Mazabuka</option>
            <option value="CDF Choma">CDF Choma</option>
            <option value="CDF Gwembe">CDF Gwembe</option>
            <option value="CDF Kalomo">CDF Kalomo</option>
            <option value="CDF Pemba">CDF Pemba</option>
            <option value="CDF Namwala">CDF Namwala</option>
            <option value="CDF Cho-Mbabala">CDF Cho-Mbabala</option>
            <option value="CDF Maz-Magoe">CDF Maz-Magoe</option>
            <option value="CDF Mze-Bweengwa">CDF Mze-Bweengwa</option>
            <option value="CDF Mze-Moomba">CDF Mze-Moomba</option>
            <option value="CDF Sinazongwe">CDF Sinazongwe</option>
            <option value="CDF Shangomba">CDF Shangomba</option>
            <option value="CDF Zimba">CDF Zimba</option>
            <option value="CDF Chirundu">CDF Chirundu</option>
            <option value="CDF Chongwe">CDF Chongwe</option>
            <option value="CDF KAL-DUNDUMWENZI">CDF KAL-DUNDUMWENZI</option>
            <option value="CDF Kazungula">CDF Kazungula</option>
            <option value="CDF LSK KABWATA">CDF LSK KABWATA</option>
            <option value="CDF LSK Matero">CDF LSK Matero</option>
            <option value="CDF LSK MUNALI">CDF LSK MUNALI</option>
            <option value="CDF Mumbwa">CDF Mumbwa</option>
            <option value="SOLON">SOLON Foundation</option>
            <option value="SJ">SJ Scholarship</option>
            <option value="Parent">Parent Direct</option>
          </select>
        </div>
      </div>

      {/* STUDENT REGISTER TABLE (RECORD COUNTER ON TOP) */}
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

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-[var(--text-primary)] ledger-table text-xs">
            <thead className="bg-[var(--bg-table-head)] text-[var(--text-primary)] font-extrabold uppercase tracking-wider border-b border-[var(--border-color)]">
              <tr>
                <th className="py-2 px-3 font-mono font-bold border-r border-[var(--border-color)]" style={{ width: '16%' }}>ADMISSION NO.</th>
                <th className="py-2 px-3 font-extrabold border-r border-[var(--border-color)]" style={{ width: '32%' }}>STUDENT NAME</th>
                <th className="py-2 px-2 text-center font-bold border-r border-[var(--border-color)]" style={{ width: '8%' }}>CLASS</th>
                <th className="py-2 px-2 text-center font-bold border-r border-[var(--border-color)]" style={{ width: '8%' }}>SEC</th>
                <th className="py-2 px-3 font-bold border-r border-[var(--border-color)]" style={{ width: '22%' }}>CATEGORY</th>
                <th className="py-2 px-2 text-center font-extrabold border-r border-[var(--border-color)]" style={{ width: '12%' }}>STATUS</th>
                <th className="py-2 px-2 text-center font-bold" style={{ width: '12%' }}>ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)] font-medium text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[var(--text-secondary)] font-bold">
                    <div className="inline-flex items-center gap-2 text-xs">
                      <div className="w-4 h-4 border-2 border-[var(--accent-gold)] border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading student register...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[var(--text-secondary)] font-bold text-xs">
                    No student records match the selected criteria.
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-[var(--bg-hover)] transition group"
                  >
                    {/* Admission Number */}
                    <td className="py-2 px-3 font-mono font-bold text-[var(--text-secondary)] border-r border-[var(--border-color)]">
                      {student.admission_no}
                    </td>

                    {/* Student Name with Green Dot and Sponsor Name Below */}
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

                    {/* Status Badge */}
                    <td className="py-2 px-2 text-center border-r border-[var(--border-color)]">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${student.status === 'ACTIVE'
                          ? 'bg-[var(--pill-paid-bg)] text-[var(--pill-paid-text)] border-[var(--pill-paid-border)]'
                          : student.status === 'TRANSFERRED'
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-slate-200 text-slate-800 border-slate-300'
                        }`}>
                        {student.status}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-2 px-2 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {student.status !== 'TRANSFERRED' && (
                          <button
                            onClick={() => onPayFee(student)}
                            className="p-1 rounded bg-[var(--accent-gold)] text-slate-950 font-extrabold shadow-sm hover:brightness-110 transition cursor-pointer"
                            title="Record Fee Payment via Quick Search"
                          >
                            <CreditCard size={13} />
                          </button>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import type { Student } from '../api';
import { printDataset } from '../utils/printHelper';
import { formatStandard } from '../utils/formatters';
import { Search, Wallet, Printer, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

interface BoarderRegisterViewProps {
  students: Student[];
  loading: boolean;
  onOpenCounterDesk: (student: Student) => void;
}

const formatCategory = (cat: string) => {
  if (cat === 'DAY_SCHOLAR') return 'Day Scholar';
  if (cat === 'HOSTEL_ORDINARY') return 'Ordinary Boarder';
  if (cat === 'HOSTEL_SPECIAL') return 'Special Boarder';
  return cat;
};

export const BoarderRegisterView: React.FC<BoarderRegisterViewProps> = ({
  students,
  loading,
  onOpenCounterDesk,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [schemeFilter, setSchemeFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sponsorFilter, setSponsorFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const activeStudents = students.filter(s => s.status !== 'TRANSFERRED');

  const filtered = students.filter((s) => {
    const matchesStatus = statusFilter === 'TRANSFERRED'
      ? s.status === 'TRANSFERRED'
      : statusFilter === 'ALL'
      ? true
      : s.status !== 'TRANSFERRED';

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.pay_id.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      (s.pupil_id && s.pupil_id.toLowerCase().includes(q));

    const matchesScheme = !schemeFilter || s.boarding_category === schemeFilter;
    const matchesClass = !classFilter || formatStandard(s.current_standard) === classFilter;

    let matchesSponsor = true;
    if (sponsorFilter === 'sponsored') {
      matchesSponsor = s.is_sponsored;
    } else if (sponsorFilter === 'self') {
      matchesSponsor = !s.is_sponsored;
    } else if (sponsorFilter) {
      matchesSponsor = s.sponsor_name === sponsorFilter;
    }

    return matchesStatus && matchesSearch && matchesScheme && matchesClass && matchesSponsor;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const pageData = filtered.slice(startIndex, startIndex + pageSize);

  const handlePrintRegister = () => {
    printDataset({
      title: 'CANISIUS SECONDARY SCHOOL — STUDENT POCKET MONEY REGISTER',
      subtitle: `Master Pocket Money Balances Register (${filtered.length} students)`,
      academicYear: '2026–2027',
      columns: [
        { header: 'PayID', accessor: (s: Student) => s.pay_id, width: '15%' },
        { header: 'Student Name', accessor: (s: Student) => s.name, width: '25%' },
        { header: 'Class', accessor: (s: Student) => formatStandard(s.current_standard), align: 'center', width: '8%' },
        { header: 'Sec', accessor: (s: Student) => s.current_section || '—', align: 'center', width: '6%' },
        { header: 'Category', accessor: (s: Student) => formatCategory(s.boarding_category), width: '18%' },
        { header: 'Sponsor Name', accessor: (s: Student) => s.is_sponsored ? (s.sponsor_name || 'Sponsored') : 'Self-Paid', width: '16%' },
        { header: 'Balance (K)', accessor: (s: Student) => `K ${Math.round(s.current_balance).toLocaleString('en-IN')}`, align: 'right', width: '12%' },
      ],
      data: filtered,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Header & Top Student Count Summary */}
      <div className="card" style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wallet size={18} style={{ color: 'var(--accent-gold)' }} />
              STUDENT POCKET MONEY REGISTER & BALANCES
            </h2>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '4px 0 0 0', fontWeight: 600 }}>
              Master ledger of all students ({activeStudents.length} active). Transferred students shown separately for refund processing.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ backgroundColor: 'var(--bg-table-head)', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-secondary)' }}>
                FILTERED STUDENTS:
              </span>
              <span style={{ fontSize: '14px', fontWeight: 800, fontFamily: 'monospace', color: 'var(--accent-gold)' }}>
                {filtered.length}
              </span>
            </div>

            <button
              onClick={handlePrintRegister}
              disabled={filtered.length === 0}
              className="btn btn-primary"
              style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Printer size={13} />
              <span>Print Results</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Control Box */}
      <div className="filter-box" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', fontSize: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', flex: 1 }}>
          <Filter size={13} style={{ color: 'var(--accent-gold)' }} />
          <span style={{ fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>FILTERS:</span>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="select-field"
            style={{ fontSize: '12px', height: '28px', padding: '0 8px', fontWeight: 'bold' }}
          >
            <option value="">Active Students Only ({activeStudents.length})</option>
            <option value="TRANSFERRED">Transferred Students Only</option>
            <option value="ALL">All Students (Inc Transferred)</option>
          </select>

          {/* Quick Search Input */}
          <div style={{ position: 'relative', flex: 1, minWidth: '160px', maxWidth: '220px' }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none', zIndex: 10, opacity: 0.7 }} />
            <input
              type="text"
              className="input-field"
              placeholder="Search PayID, Name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              style={{ paddingLeft: '34px', fontSize: '12px', height: '28px' }}
            />
          </div>

          {/* Class Filter */}
          <select
            value={classFilter}
            onChange={(e) => {
              setClassFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="select-field"
            style={{ fontSize: '12px', height: '28px', padding: '0 8px', fontWeight: 'bold' }}
          >
            <option value="">All Classes (Form 1 - 12)</option>
            <option value="Form 1">Form 1</option>
            <option value="Form 2">Form 2</option>
            <option value="Form 3">Form 3</option>
            <option value="11">11</option>
            <option value="12">12</option>
          </select>

          {/* Category Filter */}
          <select
            value={schemeFilter}
            onChange={(e) => {
              setSchemeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="select-field"
            style={{ fontSize: '12px', height: '28px', padding: '0 8px' }}
          >
            <option value="">All Categories</option>
            <option value="DAY_SCHOLAR">Day Scholar</option>
            <option value="HOSTEL_ORDINARY">Ordinary Boarder</option>
            <option value="HOSTEL_SPECIAL">Special Boarder</option>
          </select>
        </div>
      </div>

      {/* STUDENT POCKET MONEY TABLE */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>

        {/* TOP RECORD COUNTER BAR */}
        <div style={{ padding: '10px 14px', backgroundColor: 'var(--bg-table-head)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', fontSize: '12px', fontFamily: 'monospace' }}>
          <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
            Showing <strong>{filtered.length > 0 ? startIndex + 1 : 0}</strong> to <strong>{Math.min(startIndex + pageSize, filtered.length)}</strong> of <strong>{filtered.length}</strong> records (Page {currentPage} of {totalPages})
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="btn btn-secondary"
              style={{ fontSize: '11px', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <ChevronLeft size={13} />
              <span>Prev</span>
            </button>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="btn btn-secondary"
              style={{ fontSize: '11px', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <span>Next</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="ledger-table" style={{ width: '100%', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr>
                <th style={{ width: '14%', padding: '10px 12px', fontFamily: 'monospace' }}>PAY ID</th>
                <th style={{ width: '26%', padding: '10px 12px' }}>STUDENT NAME</th>
                <th style={{ width: '8%', padding: '10px 12px', textAlign: 'center' }}>CLASS</th>
                <th style={{ width: '6%', padding: '10px 12px', textAlign: 'center' }}>SEC</th>
                <th style={{ width: '18%', padding: '10px 12px' }}>CATEGORY</th>
                <th style={{ width: '14%', padding: '10px 12px', textAlign: 'right' }}>HELD BALANCE</th>
                <th style={{ width: '14%', padding: '10px 12px', textAlign: 'center' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                    Loading student records...
                  </td>
                </tr>
              ) : pageData.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                    No students match the selected search or filter criteria.
                  </td>
                </tr>
              ) : (
                pageData.map((student) => {
                  const isTransferred = student.status === 'TRANSFERRED';
                  return (
                    <tr key={student.id} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: isTransferred ? 'rgba(217, 119, 6, 0.05)' : undefined }}>
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                        {student.pay_id}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span>{student.name}</span>
                          {student.is_sponsored && (
                            <span style={{ fontSize: '10px', color: '#15803d', fontWeight: 'bold' }}>
                              {student.sponsor_name || 'Sponsored'}
                            </span>
                          )}
                          {isTransferred && (
                            <span style={{ fontSize: '10px', color: '#b45309', fontWeight: 'bold', textTransform: 'uppercase' }}>
                              (Transferred)
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {formatStandard(student.current_standard)}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {student.current_section || '—'}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        {formatCategory(student.boarding_category)}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: 'var(--pill-paid-text)' }}>
                        K {Math.round(student.current_balance || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <button
                          onClick={() => onOpenCounterDesk(student)}
                          className="btn btn-secondary"
                          style={{
                            fontSize: '11px',
                            padding: '4px 8px',
                            fontWeight: 'bold',
                            ...(isTransferred ? { backgroundColor: 'rgba(217, 119, 6, 0.1)', borderColor: '#d97706', color: '#92400e' } : {})
                          }}
                        >
                          {isTransferred ? 'Refund' : 'Counter Desk'}
                        </button>
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

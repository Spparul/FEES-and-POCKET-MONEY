import React, { useState } from 'react';
import type { Student, PocketTransaction } from '../api';
import { formatStandard } from '../utils/formatters';
import { printDataset } from '../utils/printHelper';
import { Calendar, Printer, TrendingUp, Wallet, ArrowDownRight, ArrowUpRight, Award, Filter } from 'lucide-react';

interface YearlyAnalyticsViewProps {
  students: Student[];
  transactions: PocketTransaction[];
  loading: boolean;
}

export const YearlyAnalyticsView: React.FC<YearlyAnalyticsViewProps> = ({
  students,
  transactions,
  loading,
}) => {
  const [selectedYear, setSelectedYear] = useState('2026');
  const [classFilter, setClassFilter] = useState('');
  const [schemeFilter, setSchemeFilter] = useState('');
  const [printing, setPrinting] = useState(false);

  // Filter dataset by class and scheme
  const filteredStudents = students.filter(s => {
    const matchesClass = !classFilter || formatStandard(s.current_standard) === classFilter;
    const matchesScheme = !schemeFilter || s.boarding_category === schemeFilter;
    return matchesClass && matchesScheme;
  });

  const studentIds = new Set(filteredStudents.map(s => s.id));
  const filteredTx = transactions.filter(t => studentIds.has(t.student_id));

  // High level stat calculations
  const totalReceived = filteredTx
    .filter(t => t.transaction_type === 'RECEIVED_FROM_PARENT')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalGiven = filteredTx
    .filter(t => t.transaction_type === 'GIVEN_TO_STUDENT')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalReturned = filteredTx
    .filter(t => t.transaction_type === 'RETURNED_TO_PARENT')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalHeldBalance = filteredStudents.reduce((sum, s) => sum + (s.current_balance || 0), 0);

  // Monthly breakdown array Jan-Dec
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const monthlyData = months.map((monthName, idx) => {
    const monthTx = filteredTx.filter(t => {
      const d = new Date(t.created_at || t.transaction_date);
      return d.getMonth() === idx;
    });

    const topups = monthTx.filter(t => t.transaction_type === 'RECEIVED_FROM_PARENT').reduce((s, t) => s + t.amount, 0);
    const given = monthTx.filter(t => t.transaction_type === 'GIVEN_TO_STUDENT').reduce((s, t) => s + t.amount, 0);
    const refunds = monthTx.filter(t => t.transaction_type === 'RETURNED_TO_PARENT').reduce((s, t) => s + t.amount, 0);
    const netFlow = topups - (given + refunds);

    return {
      month: monthName,
      topups,
      given,
      refunds,
      netFlow,
    };
  });

  // Class breakdown: Form 1, Form 2, Form 3, 11, 12
  const classLevels = ['Form 1', 'Form 2', 'Form 3', '11', '12'];
  const classData = classLevels.map(clsName => {
    const clsStudents = filteredStudents.filter(s => formatStandard(s.current_standard) === clsName);
    const clsIds = new Set(clsStudents.map(s => s.id));
    const clsTx = filteredTx.filter(t => clsIds.has(t.student_id));

    const deposits = clsTx.filter(t => t.transaction_type === 'RECEIVED_FROM_PARENT').reduce((sum, t) => sum + t.amount, 0);
    const disbursed = clsTx.filter(t => t.transaction_type === 'GIVEN_TO_STUDENT').reduce((sum, t) => sum + t.amount, 0);
    const held = clsStudents.reduce((sum, s) => sum + (s.current_balance || 0), 0);
    const avgHeld = clsStudents.length > 0 ? held / clsStudents.length : 0;

    return {
      className: clsName,
      studentCount: clsStudents.length,
      deposits,
      disbursed,
      held,
      avgHeld,
    };
  });

  const handlePrintAnalytics = () => {
    setPrinting(true);
    try {
      printDataset({
        title: 'ANNUAL POCKET MONEY FINANCIAL ANALYTICS REPORT',
        subtitle: `Academic Year ${selectedYear} • (${filteredStudents.length} students analyzed)`,
        academicYear: selectedYear,
        columns: [
          { header: 'Class', accessor: (c: any) => c.className, align: 'center', width: '15%' },
          { header: 'Students', accessor: (c: any) => `${c.studentCount}`, align: 'center', width: '15%' },
          { header: 'Deposited (K)', accessor: (c: any) => `K ${Math.round(c.deposits).toLocaleString('en-IN')}`, align: 'right', width: '20%' },
          { header: 'Disbursed (K)', accessor: (c: any) => `K ${Math.round(c.disbursed).toLocaleString('en-IN')}`, align: 'right', width: '20%' },
          { header: 'Held Balance (K)', accessor: (c: any) => `K ${Math.round(c.held).toLocaleString('en-IN')}`, align: 'right', width: '15%' },
          { header: 'Avg / Student (K)', accessor: (c: any) => `K ${Math.round(c.avgHeld).toLocaleString('en-IN')}`, align: 'right', width: '15%' },
        ],
        data: classData,
      });
    } catch (err) {
      console.error(err);
      alert('Failed to print analytics report.');
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* HEADER BAR & PROMINENT TOP STUDENT COUNT PILL */}
      <div className="card" style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#c5a059', color: '#1c120c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                <TrendingUp size={16} />
              </div>
              <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                ANNUAL POCKET MONEY ANALYTICS ({selectedYear})
              </h2>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '4px 0 0 0', fontWeight: 600 }}>
              Comprehensive yearly financial reporting, cashflow trends, and class-wise pocket money analysis.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* PROMINENT TOP STUDENT COUNT PILL */}
            <div style={{ backgroundColor: 'var(--bg-table-head)', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-secondary)' }}>
                FILTERED STUDENTS:
              </span>
              <span style={{ fontSize: '14px', fontWeight: 800, fontFamily: 'monospace', color: 'var(--accent-gold)' }}>
                {filteredStudents.length}
              </span>
            </div>

            <button
              onClick={handlePrintAnalytics}
              disabled={printing}
              className="btn btn-primary"
              style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Printer size={13} className={printing ? 'animate-bounce' : ''} />
              <span>{printing ? 'Preparing...' : 'Print Report'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* FILTER BAR CONTAINER */}
      <div className="filter-box" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', fontSize: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>
            <Filter size={13} style={{ color: 'var(--accent-gold)' }} />
            <span>ANALYTICS FILTERS:</span>
          </div>

          {/* Academic Year Dropdown */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="select-field"
            style={{ fontSize: '12px', height: '28px', padding: '0 8px', fontWeight: 'bold' }}
          >
            <option value="2026">Academic Year 2026</option>
            <option value="2025">Academic Year 2025</option>
          </select>

          {/* Class Dropdown (Form 1, Form 2, Form 3, 11, 12 ONLY) */}
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
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

          {/* Scheme Dropdown */}
          <select
            value={schemeFilter}
            onChange={(e) => setSchemeFilter(e.target.value)}
            className="select-field"
            style={{ fontSize: '12px', height: '28px', padding: '0 8px' }}
          >
            <option value="">All Categories</option>
            <option value="DAY_SCHOLAR">Day Scholars</option>
            <option value="HOSTEL_ORDINARY">Ordinary Boarders</option>
            <option value="HOSTEL_SPECIAL">Special Boarders</option>
          </select>
        </div>
      </div>

      {/* 4 ANNUAL FINANCIAL METRIC CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        
        <div className="card" style={{ padding: '14px 16px' }}>
          <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>
            Annual Deposits (Parents)
          </span>
          <div style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'monospace', color: 'var(--pill-paid-text)', marginTop: '4px' }}>
            K {Math.round(totalReceived).toLocaleString('en-IN')}
          </div>
        </div>

        <div className="card" style={{ padding: '14px 16px' }}>
          <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>
            Annual Student Withdrawals
          </span>
          <div style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'monospace', color: 'var(--accent-gold)', marginTop: '4px' }}>
            K {Math.round(totalGiven).toLocaleString('en-IN')}
          </div>
        </div>

        <div className="card" style={{ padding: '14px 16px' }}>
          <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>
            Annual Parent Refunds
          </span>
          <div style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'monospace', color: 'var(--text-primary)', marginTop: '4px' }}>
            K {Math.round(totalReturned).toLocaleString('en-IN')}
          </div>
        </div>

        <div className="card" style={{ padding: '14px 16px' }}>
          <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>
            Current Held Balance
          </span>
          <div style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'monospace', color: 'var(--pill-paid-text)', marginTop: '4px' }}>
            K {Math.round(totalHeldBalance).toLocaleString('en-IN')}
          </div>
        </div>

      </div>

      {/* CLASS-WISE ANNUAL BREAKDOWN TABLE */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-table-head)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase' }}>
            CLASS-WISE ANNUAL POCKET MONEY ANALYSIS
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Form 1, Form 2, Form 3, 11, 12 Breakdown
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="ledger-table" style={{ width: '100%', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr>
                <th style={{ width: '15%', padding: '10px 12px' }}>CLASS</th>
                <th style={{ width: '15%', padding: '10px 12px', textAlign: 'center' }}>STUDENTS</th>
                <th style={{ width: '20%', padding: '10px 12px', textAlign: 'right' }}>TOTAL DEPOSITS (K)</th>
                <th style={{ width: '20%', padding: '10px 12px', textAlign: 'right' }}>TOTAL DISBURSED (K)</th>
                <th style={{ width: '15%', padding: '10px 12px', textAlign: 'right' }}>CURRENT HELD (K)</th>
                <th style={{ width: '15%', padding: '10px 12px', textAlign: 'right' }}>AVG / STUDENT (K)</th>
              </tr>
            </thead>
            <tbody>
              {classData.map((row) => (
                <tr key={row.className} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {row.className}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 'bold', fontFamily: 'monospace' }}>
                    {row.studentCount}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--pill-paid-text)' }}>
                    K {Math.round(row.deposits).toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--accent-gold)' }}>
                    K {Math.round(row.disbursed).toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: 'var(--pill-paid-text)' }}>
                    K {Math.round(row.held).toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' }}>
                    K {Math.round(row.avgHeld).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 12-MONTH FINANCIAL TREND BREAKDOWN TABLE */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-table-head)', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase' }}>
            MONTH-BY-MONTH YEARLY CASHFLOW LEDGER ({selectedYear})
          </h3>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="ledger-table" style={{ width: '100%', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr>
                <th style={{ width: '20%', padding: '10px 12px' }}>MONTH</th>
                <th style={{ width: '20%', padding: '10px 12px', textAlign: 'right' }}>DEPOSITS (K)</th>
                <th style={{ width: '20%', padding: '10px 12px', textAlign: 'right' }}>DISBURSED (K)</th>
                <th style={{ width: '20%', padding: '10px 12px', textAlign: 'right' }}>REFUNDS (K)</th>
                <th style={{ width: '20%', padding: '10px 12px', textAlign: 'right' }}>NET CASHFLOW (K)</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((m) => (
                <tr key={m.month} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    {m.month}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--pill-paid-text)' }}>
                    K {Math.round(m.topups).toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--accent-gold)' }}>
                    K {Math.round(m.given).toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' }}>
                    K {Math.round(m.refunds).toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: m.netFlow >= 0 ? 'var(--pill-paid-text)' : 'var(--pill-due-text)' }}>
                    {m.netFlow >= 0 ? '+' : ''}K {Math.round(m.netFlow).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

import React, { useState, useEffect } from 'react';
import type { MonthlyStatement, PocketTransaction } from '../api';
import { getMonthlyStatementApi } from '../api';
import { printDataset } from '../utils/printHelper';
import { formatStandard } from '../utils/formatters';
import { Calendar, ArrowDownLeft, ArrowUpRight, RotateCcw, Wallet, Users, Printer, Clock, FileText, RefreshCw } from 'lucide-react';

export const MonthlyStatementView: React.FC = () => {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [statement, setStatement] = useState<MonthlyStatement | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [typeFilter, setTypeFilter] = useState<string>('');

  const fetchStatement = async (y: number, m: number) => {
    setLoading(true);
    try {
      const data = await getMonthlyStatementApi(y, m);
      setStatement(data);
    } catch (err) {
      console.error("Failed to load monthly statement:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatement(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  const filteredTransactions = (statement?.transactions || []).filter((tx) => {
    if (!typeFilter) return true;
    return tx.transaction_type === typeFilter;
  });

  const handlePrintMonthlyStatement = () => {
    if (!statement) return;

    printDataset({
      title: "CANISIUS SECONDARY SCHOOL — POCKET MONEY MONTHLY STATEMENT",
      subtitle: `Official Statement for ${statement.month_label} • Net Change: K ${Math.round(statement.net_change).toLocaleString('en-IN')}`,
      academicYear: "2026–2027",
      columns: [
        { header: 'Date & Time', accessor: (t: PocketTransaction) => t.created_at || t.transaction_date, width: '16%' },
        { header: 'Receipt Ref', accessor: (t: PocketTransaction) => t.receipt_ref || '-', width: '15%' },
        { header: 'PayID', accessor: (t: PocketTransaction) => t.pay_id || '-', width: '12%' },
        { header: 'Student Name', accessor: (t: PocketTransaction) => t.student_name || 'Unknown', width: '22%' },
        { header: 'Transaction Type', accessor: (t: PocketTransaction) => t.transaction_type.replace(/_/g, ' '), width: '18%' },
        { header: 'Amount (K)', accessor: (t: PocketTransaction) => `K ${Math.round(t.amount).toLocaleString('en-IN')}`, align: 'right', width: '17%' },
      ],
      data: statement.transactions,
    });
  };

  const monthsList = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }} className="animate-fade">
      
      {/* Month / Year Selector Bar */}
      <div className="card" style={{ padding: '14px 18px' }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <FileText size={18} color="#422b1b" />
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#2c1f14' }}>
              Select Statement Month:
            </span>
            
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="select-field"
              style={{ width: '140px' }}
            >
              {monthsList.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="select-field"
              style={{ width: '100px' }}
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>

            <button
              onClick={() => fetchStatement(selectedYear, selectedMonth)}
              className="btn btn-secondary"
              style={{ height: '36px', fontSize: '12px' }}
            >
              <RefreshCw size={13} />
              <span>Refresh</span>
            </button>
          </div>

          <button
            onClick={handlePrintMonthlyStatement}
            disabled={loading || !statement || statement.transactions.length === 0}
            className="btn btn-primary"
            style={{ height: '36px', fontSize: '13px' }}
          >
            <Printer size={15} />
            <span>Print Monthly Statement Slip</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: '36px', textAlign: 'center', color: '#7c6a58', fontWeight: 700 }}>
          Calculating Monthly Financial Statement & Analytics...
        </div>
      ) : statement ? (
        <>
          {/* CHALLAN-STYLE MONTHLY FINANCIAL STATEMENT CONTAINER */}
          <div className="card" style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            {/* Header Statement Title */}
            <div className="flex items-center justify-between pb-3" style={{ borderBottom: '2px solid #a89876' }}>
              <div>
                <span className="badge badge-amber" style={{ marginBottom: '4px' }}>
                  OFFICIAL MONTHLY FINANCIAL CHALLAN
                </span>
                <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#2c1f14', margin: 0 }}>
                  POCKET MONEY MONTHLY STATEMENT — {statement.month_label.toUpperCase()}
                </h2>
                <div style={{ fontSize: '12px', color: '#7c6a58', fontWeight: 600, marginTop: '2px' }}>
                  Month Activity Period: <strong style={{ color: '#422b1b' }}>{statement.month_label}</strong>
                </div>
              </div>

              {/* Separately Displayed System Held Balance */}
              <div style={{ backgroundColor: '#ebd8ab', border: '1px solid #cbb27a', padding: '6px 14px', borderRadius: '6px', textAlign: 'right' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#4d370e', textTransform: 'uppercase', display: 'block' }}>
                  SYSTEM TOTAL HELD BALANCE
                </span>
                <span style={{ fontSize: '18px', fontWeight: 900, fontFamily: 'JetBrains Mono', color: '#4d370e' }}>
                  K {Math.round(statement.currently_held_balance).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* MONEY FLOW BREAKDOWN SECTIONS (Clickable Metrics) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
              
              {/* 1. CREDITED / TOP UPS */}
              <div
                onClick={() => setTypeFilter(typeFilter === 'RECEIVED_FROM_PARENT' ? '' : 'RECEIVED_FROM_PARENT')}
                style={{
                  backgroundColor: typeFilter === 'RECEIVED_FROM_PARENT' ? '#cce0c7' : '#d9e5d6',
                  border: '1px solid #b7cca4',
                  borderRadius: '8px',
                  padding: '14px 16px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="Click to filter transactions below to Top Ups"
              >
                <div className="flex items-center justify-between" style={{ marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#1e3b22', textTransform: 'uppercase' }}>
                    TOTAL CREDITED (TOP UPS)
                  </span>
                  <ArrowDownLeft size={16} color="#1e3b22" />
                </div>
                <div style={{ fontSize: '22px', fontWeight: 900, fontFamily: 'JetBrains Mono', color: '#1e3b22', marginBottom: '4px' }}>
                  K {Math.round(statement.total_credited).toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e3b22', display: 'flex', gap: '10px' }}>
                  <span>👥 <strong>{statement.students_credited}</strong> Students Credited</span>
                  <span>• <strong>{statement.transactions_credited}</strong> Txs</span>
                </div>
              </div>

              {/* 2. DEBITED / GIVEN TO STUDENTS */}
              <div
                onClick={() => setTypeFilter(typeFilter === 'GIVEN_TO_STUDENT' ? '' : 'GIVEN_TO_STUDENT')}
                style={{
                  backgroundColor: typeFilter === 'GIVEN_TO_STUDENT' ? '#e5cfc0' : '#eddcd0',
                  border: '1px solid #d9bfae',
                  borderRadius: '8px',
                  padding: '14px 16px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="Click to filter transactions below to Given to Student"
              >
                <div className="flex items-center justify-between" style={{ marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#4a2511', textTransform: 'uppercase' }}>
                    TOTAL DEBITED (GIVEN TO STUDENTS)
                  </span>
                  <ArrowUpRight size={16} color="#4a2511" />
                </div>
                <div style={{ fontSize: '22px', fontWeight: 900, fontFamily: 'JetBrains Mono', color: '#4a2511', marginBottom: '4px' }}>
                  K {Math.round(statement.total_debited).toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#4a2511', display: 'flex', gap: '10px' }}>
                  <span>👦 <strong>{statement.students_debited}</strong> Students Received</span>
                  <span>• <strong>{statement.transactions_debited}</strong> Txs</span>
                </div>
              </div>

              {/* 3. REFUNDED TO PARENTS */}
              <div
                onClick={() => setTypeFilter(typeFilter === 'RETURNED_TO_PARENT' ? '' : 'RETURNED_TO_PARENT')}
                style={{
                  backgroundColor: typeFilter === 'RETURNED_TO_PARENT' ? '#d9c9e0' : '#e3d7e8',
                  border: '1px solid #c7b3ce',
                  borderRadius: '8px',
                  padding: '14px 16px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="Click to filter transactions below to Refunds"
              >
                <div className="flex items-center justify-between" style={{ marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#3a1c42', textTransform: 'uppercase' }}>
                    TOTAL REFUNDED (TO PARENTS)
                  </span>
                  <RotateCcw size={16} color="#3a1c42" />
                </div>
                <div style={{ fontSize: '22px', fontWeight: 900, fontFamily: 'JetBrains Mono', color: '#3a1c42', marginBottom: '4px' }}>
                  K {Math.round(statement.total_refunded).toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#3a1c42', display: 'flex', gap: '10px' }}>
                  <span>👨‍👩‍👦 <strong>{statement.students_refunded}</strong> Students Refunded</span>
                  <span>• <strong>{statement.transactions_refunded}</strong> Txs</span>
                </div>
              </div>

            </div>

            {/* MONTHLY STATEMENT BOTTOM SUMMARY BAR */}
            <div style={{ backgroundColor: '#dfd7c2', border: '1px solid #a89876', borderRadius: '6px', padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#7c6a58', textTransform: 'uppercase', display: 'block' }}>
                  NET HELD BALANCE CHANGE ({statement.month_label.toUpperCase()})
                </span>
                <span style={{ fontSize: '20px', fontWeight: 900, fontFamily: 'JetBrains Mono', color: statement.net_change >= 0 ? '#1e3b22' : '#571b1b' }}>
                  {statement.net_change >= 0 ? '+' : ''}K {Math.round(statement.net_change).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex items-center gap-6" style={{ fontSize: '13px', color: '#2c1f14', fontWeight: 700 }}>
                <div>
                  <span style={{ color: '#7c6a58' }}>Unique Active Students:</span>
                  <strong style={{ fontFamily: 'JetBrains Mono', fontSize: '14px' }}>{statement.unique_students_with_activity} Students</strong>
                </div>

                <div>
                  <span style={{ color: '#7c6a58' }}>Total Transactions: </span>
                  <strong style={{ fontFamily: 'JetBrains Mono', fontSize: '14px' }}>{statement.total_transactions_count} Records</strong>
                </div>
              </div>
            </div>

          </div>

          {/* DAY-BY-DAY OPERATIONAL BREAKDOWN TABLE */}
          {statement.day_by_day.length > 0 && (
            <div className="table-container">
              <div style={{ padding: '10px 16px', backgroundColor: '#dfd7c2', borderBottom: '1px solid #c4b799', fontSize: '12px', fontWeight: 800, color: '#2c1f14', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                DAY-BY-DAY OPERATIONAL BREAKDOWN — {statement.month_label.toUpperCase()}
              </div>

              <table>
                <thead>
                  <tr>
                    <th style={{ width: '14%' }}>DATE</th>
                    <th style={{ width: '12%', textAlign: 'right' }}>CREDITED (K)</th>
                    <th style={{ width: '11%', textAlign: 'center' }}>STD CREDITED</th>
                    <th style={{ width: '12%', textAlign: 'right' }}>DEBITED (K)</th>
                    <th style={{ width: '11%', textAlign: 'center' }}>STD DEBITED</th>
                    <th style={{ width: '12%', textAlign: 'right' }}>REFUNDED (K)</th>
                    <th style={{ width: '11%', textAlign: 'center' }}>STD REFUNDED</th>
                    <th style={{ width: '10%', textAlign: 'center' }}>UNIQUE STUDENTS</th>
                    <th style={{ width: '12%', textAlign: 'right' }}>NET CHANGE (K)</th>
                  </tr>
                </thead>
                <tbody>
                  {statement.day_by_day.map((day) => (
                    <tr key={day.date}>
                      <td style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color: '#422b1b' }}>
                        {day.date}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono', fontWeight: 800, color: '#1e3b22' }}>
                        K {Math.round(day.credited).toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>
                        {day.students_credited}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono', fontWeight: 800, color: '#4a2511' }}>
                        K {Math.round(day.debited).toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>
                        {day.students_debited}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono', fontWeight: 800, color: '#3a1c42' }}>
                        K {Math.round(day.refunded).toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>
                        {day.students_refunded}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 800, color: '#2c1f14' }}>
                        {day.unique_students}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono', fontWeight: 900, color: day.net_change >= 0 ? '#1e3b22' : '#571b1b' }}>
                        {day.net_change >= 0 ? '+' : ''}K {Math.round(day.net_change).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* DETAILED MONTHLY TRANSACTION LEDGER (LATEST TRANSACTION FIRST) */}
          <div className="table-container">
            <div style={{ padding: '12px 16px', backgroundColor: '#dfd7c2', borderBottom: '1px solid #c4b799', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#2c1f14', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                FULL MONTHLY TRANSACTION LEDGER — {statement.month_label.toUpperCase()} (LATEST FIRST)
                {typeFilter && (
                  <span className="badge badge-amber" style={{ marginLeft: '8px' }}>
                    Filter: {typeFilter.replace(/_/g, ' ')}
                  </span>
                )}
              </div>

              {typeFilter && (
                <button
                  onClick={() => setTypeFilter('')}
                  className="btn btn-secondary"
                  style={{ height: '26px', fontSize: '11px', padding: '0 8px' }}
                >
                  Clear Filter
                </button>
              )}
            </div>

            {filteredTransactions.length === 0 ? (
              <div style={{ padding: '36px', textAlign: 'center', color: '#7c6a58', fontWeight: 700, fontSize: '13px' }}>
                No pocket money transactions recorded in {statement.month_label}.
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '18%' }}>TIMESTAMP</th>
                    <th style={{ width: '15%' }}>RECEIPT REF</th>
                    <th style={{ width: '12%' }}>PAYID</th>
                    <th style={{ width: '22%' }}>STUDENT NAME</th>
                    <th style={{ width: '15%', textAlign: 'center' }}>TRANSACTION TYPE</th>
                    <th style={{ width: '18%', textAlign: 'right' }}>AMOUNT (K)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id}>
                      <td style={{ fontFamily: 'JetBrains Mono', fontSize: '12px', color: '#7c6a58', fontWeight: 600 }}>
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} color="#7c6a58" />
                          <span>{tx.created_at || tx.transaction_date}</span>
                        </div>
                      </td>

                      <td style={{ fontFamily: 'JetBrains Mono', fontSize: '13px', color: '#422b1b', fontWeight: 700 }}>
                        {tx.receipt_ref || '-'}
                      </td>

                      <td style={{ fontFamily: 'JetBrains Mono', color: '#2c1f14', fontWeight: 700, fontSize: '13px' }}>
                        {tx.pay_id || '-'}
                      </td>

                      <td>
                        <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '12px' }}>{tx.student_name}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                          {formatStandard(tx.standard)} - {tx.section}
                        </div>
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${
                          tx.transaction_type === 'RECEIVED_FROM_PARENT'
                            ? 'badge-green'
                            : tx.transaction_type === 'GIVEN_TO_STUDENT'
                            ? 'badge-blue'
                            : 'badge-purple'
                        }`}>
                          {tx.transaction_type.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono', fontWeight: 800, fontSize: '14px', color: tx.transaction_type === 'RECEIVED_FROM_PARENT' ? '#1e3b22' : '#4d370e' }}>
                        {tx.transaction_type === 'RECEIVED_FROM_PARENT' ? '+' : '-'}K {Math.round(tx.amount).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : null}

    </div>
  );
};

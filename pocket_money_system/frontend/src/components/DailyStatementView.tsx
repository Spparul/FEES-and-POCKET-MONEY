import React, { useState, useEffect } from 'react';
import type { DailyStatement, PocketTransaction } from '../api';
import { getDailyStatementApi } from '../api';
import { printDataset } from '../utils/printHelper';
import { formatStandard } from '../utils/formatters';
import { Calendar, ArrowDownLeft, ArrowUpRight, RotateCcw, Wallet, Users, Printer, Clock, Filter, RefreshCw } from 'lucide-react';

interface DailyStatementViewProps {
  onNavigateLedgerWithType?: (type: string, date: string) => void;
}

export const DailyStatementView: React.FC<DailyStatementViewProps> = ({
  onNavigateLedgerWithType,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [statement, setStatement] = useState<DailyStatement | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [typeFilter, setTypeFilter] = useState<string>('');

  const fetchStatement = async (dateStr: string) => {
    setLoading(true);
    try {
      const data = await getDailyStatementApi(dateStr);
      setStatement(data);
    } catch (err) {
      console.error("Failed to load daily statement:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatement(selectedDate);
  }, [selectedDate]);

  const filteredTransactions = (statement?.transactions || []).filter((tx) => {
    if (!typeFilter) return true;
    return tx.transaction_type === typeFilter;
  });

  const handlePrintDailyStatement = () => {
    if (!statement) return;

    printDataset({
      title: "CANISIUS SECONDARY SCHOOL — POCKET MONEY DAILY STATEMENT",
      subtitle: `Official Statement for Date: ${statement.date} • Total Activity: K ${Math.round(statement.total_money_moved).toLocaleString('en-IN')}`,
      academicYear: "2026–2027",
      columns: [
        { header: 'Time', accessor: (t: PocketTransaction) => t.created_at || t.transaction_date, width: '16%' },
        { header: 'Receipt Ref', accessor: (t: PocketTransaction) => t.receipt_ref || '-', width: '15%' },
        { header: 'PayID', accessor: (t: PocketTransaction) => t.pay_id || '-', width: '12%' },
        { header: 'Hosteller Name', accessor: (t: PocketTransaction) => t.student_name || 'Unknown', width: '22%' },
        { header: 'Transaction Type', accessor: (t: PocketTransaction) => t.transaction_type.replace(/_/g, ' '), width: '18%' },
        { header: 'Amount (K)', accessor: (t: PocketTransaction) => `K ${Math.round(t.amount).toLocaleString('en-IN')}`, align: 'right', width: '17%' },
      ],
      data: statement.transactions,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }} className="animate-fade">
      
      {/* Date Picker Bar */}
      <div className="card" style={{ padding: '14px 18px' }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Calendar size={18} color="#422b1b" />
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#2c1f14' }}>
              Select Statement Date:
            </span>
            <input
              type="date"
              className="input-field"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ width: '170px', height: '36px', fontSize: '13px' }}
            />
            <button
              onClick={() => fetchStatement(selectedDate)}
              className="btn btn-secondary"
              style={{ height: '36px', fontSize: '12px' }}
            >
              <RefreshCw size={13} />
              <span>Refresh</span>
            </button>
          </div>

          <button
            onClick={handlePrintDailyStatement}
            disabled={loading || !statement || statement.transactions.length === 0}
            className="btn btn-primary"
            style={{ height: '36px', fontSize: '13px' }}
          >
            <Printer size={15} />
            <span>Print Daily Statement Slip</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: '36px', textAlign: 'center', color: '#7c6a58', fontWeight: 700 }}>
          Calculating Daily Financial Statement...
        </div>
      ) : statement ? (
        <>
          {/* CHALLAN-STYLE FINANCIAL STATEMENT CONTAINER */}
          <div className="card" style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            {/* Header Statement Title */}
            <div className="flex items-center justify-between pb-3" style={{ borderBottom: '2px solid #a89876' }}>
              <div>
                <span className="badge badge-amber" style={{ marginBottom: '4px' }}>
                  OFFICIAL DAILY FINANCIAL CHALLAN
                </span>
                <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#2c1f14', margin: 0 }}>
                  POCKET MONEY DAILY STATEMENT
                </h2>
                <div style={{ fontSize: '12px', color: '#7c6a58', fontWeight: 600, marginTop: '2px' }}>
                  Statement Date: <strong style={{ color: '#422b1b', fontFamily: 'JetBrains Mono' }}>{statement.date}</strong>
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
                    MONEY RECEIVED (TOP UPS)
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
                    MONEY ISSUED (GIVEN TO BOYS)
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
                    MONEY RETURNED (REFUNDS)
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

            {/* STATEMENT BOTTOM SUMMARY BAR */}
            <div style={{ backgroundColor: '#dfd7c2', border: '1px solid #a89876', borderRadius: '6px', padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#7c6a58', textTransform: 'uppercase', display: 'block' }}>
                  NET CHANGE IN HELD MONEY (TODAY)
                </span>
                <span style={{ fontSize: '20px', fontWeight: 900, fontFamily: 'JetBrains Mono', color: statement.net_change >= 0 ? '#1e3b22' : '#571b1b' }}>
                  {statement.net_change >= 0 ? '+' : ''}K {Math.round(statement.net_change).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex items-center gap-6" style={{ fontSize: '13px', color: '#2c1f14', fontWeight: 700 }}>
                <div>
                  <span style={{ color: '#7c6a58' }}>Unique Students Active: </span>
                  <strong style={{ fontFamily: 'JetBrains Mono', fontSize: '14px' }}>{statement.unique_students_with_activity} Boys</strong>
                </div>

                <div>
                  <span style={{ color: '#7c6a58' }}>Total Transactions: </span>
                  <strong style={{ fontFamily: 'JetBrains Mono', fontSize: '14px' }}>{statement.total_transactions_count} Records</strong>
                </div>
              </div>
            </div>

          </div>

          {/* DETAILED DAILY TRANSACTION LEDGER (LATEST TRANSACTION FIRST) */}
          <div className="table-container">
            <div style={{ padding: '12px 16px', backgroundColor: '#dfd7c2', borderBottom: '1px solid #c4b799', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#2c1f14', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                DAILY TRANSACTION LEDGER — {statement.date} (LATEST FIRST)
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
                No pocket money transactions recorded on {statement.date}.
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '18%' }}>TIMESTAMP</th>
                    <th style={{ width: '15%' }}>RECEIPT REF</th>
                    <th style={{ width: '12%' }}>PAYID</th>
                    <th style={{ width: '22%' }}>HOSTELLER NAME</th>
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

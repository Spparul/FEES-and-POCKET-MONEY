import React, { useState, useEffect } from 'react';
import type { Student, PocketTransaction } from '../api';
import { getStudentPocketProfile } from '../api';
import { printDataset } from '../utils/printHelper';
import { X, Printer, Clock, Wallet, CheckCircle2 } from 'lucide-react';

interface StudentHistoryModalProps {
  student: Student;
  onClose: () => void;
}

export const StudentHistoryModal: React.FC<StudentHistoryModalProps> = ({
  student,
  onClose,
}) => {
  const [history, setHistory] = useState<PocketTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const data = await getStudentPocketProfile(student.id);
        setHistory(data.pocket_transactions || []);
      } catch (err) {
        console.error("Failed to load student history:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [student.id]);

  const handlePrintStudentHistory = () => {
    printDataset({
      title: "CANISIUS SECONDARY SCHOOL — STUDENT POCKET MONEY LEDGER",
      subtitle: `Student: ${student.name} (${student.pay_id}) • Class: ${student.academic_level} • Current Held Balance: K ${Math.round(student.current_balance).toLocaleString('en-IN')}`,
      academicYear: "2026–2027",
      columns: [
        { header: 'Date & Time Timestamp', accessor: (t: PocketTransaction) => t.created_at || t.transaction_date, width: '20%' },
        { header: 'Receipt Ref', accessor: (t: PocketTransaction) => t.receipt_ref || '-', width: '15%' },
        { header: 'Transaction Type', accessor: (t: PocketTransaction) => t.transaction_type.replace(/_/g, ' '), width: '20%' },
        { header: 'Amount (K)', accessor: (t: PocketTransaction) => `K ${Math.round(t.amount).toLocaleString('en-IN')}`, align: 'right', width: '15%' },
        { header: 'Prev Balance', accessor: (t: PocketTransaction) => `K ${Math.round(t.previous_balance || 0).toLocaleString('en-IN')}`, align: 'right', width: '15%' },
        { header: 'New Balance', accessor: (t: PocketTransaction) => `K ${Math.round(t.new_balance || 0).toLocaleString('en-IN')}`, align: 'right', width: '15%' },
      ],
      data: history,
    });
  };

  const currentBalance = Math.round(student.current_balance || 0);

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-fade" style={{ maxWidth: '850px', padding: '24px' }}>
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3" style={{ borderBottom: '2px solid #a89876', marginBottom: '16px' }}>
          <div>
            <span className="badge badge-amber" style={{ marginBottom: '2px' }}>
              STUDENT POCKET MONEY AUDIT LEDGER
            </span>
            <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#2c1f14', margin: 0 }}>
              {student.name}
            </h2>
            <div style={{ fontSize: '12px', color: '#7c6a58', fontWeight: 600, marginTop: '2px' }}>
              PayID: <strong style={{ color: '#422b1b', fontFamily: 'JetBrains Mono' }}>{student.pay_id}</strong> • Class: <strong>{student.academic_level} ({student.current_standard}-{student.current_section})</strong> • Category: <strong>{student.boarding_category === 'HOSTEL_SPECIAL' ? 'Special Boarder' : student.boarding_category === 'DAY_SCHOLAR' ? 'Day Scholar' : 'Ordinary Boarder'}</strong>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrintStudentHistory}
              disabled={loading || history.length === 0}
              className="btn btn-primary"
              style={{ height: '34px', fontSize: '12px' }}
            >
              <Printer size={14} />
              <span>Print Student History</span>
            </button>

            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: '#7c6a58', cursor: 'pointer', padding: '4px' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Current Balance Focal Box */}
        <div style={{ backgroundColor: '#dfd7c2', border: '1px solid #a89876', borderRadius: '6px', padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#7c6a58', textTransform: 'uppercase', display: 'block' }}>
              CURRENT HELD BALANCE
            </span>
            <span style={{ fontSize: '24px', fontWeight: 900, fontFamily: 'JetBrains Mono', color: '#4d370e' }}>
              K {currentBalance.toLocaleString('en-IN')}
            </span>
          </div>

          <div style={{ fontSize: '12px', color: '#2c1f14', fontWeight: 700, textAlign: 'right' }}>
            <span>Total Transactions Recorded: </span>
            <strong style={{ fontFamily: 'JetBrains Mono', fontSize: '14px' }}>{history.length} Events</strong>
          </div>
        </div>

        {/* Chronological History Table (LATEST TRANSACTION FIRST) */}
        <div className="table-container" style={{ maxHeight: '420px', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '36px', textAlign: 'center', color: '#7c6a58', fontWeight: 700 }}>
              Loading Complete Transaction History...
            </div>
          ) : history.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: '#7c6a58', fontWeight: 700 }}>
              No transactions recorded yet for this student.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th style={{ width: '22%' }}>TIMESTAMP</th>
                  <th style={{ width: '16%' }}>RECEIPT REF</th>
                  <th style={{ width: '20%' }}>TYPE</th>
                  <th style={{ width: '14%', textAlign: 'right' }}>AMOUNT</th>
                  <th style={{ width: '14%', textAlign: 'right' }}>PREV BAL</th>
                  <th style={{ width: '14%', textAlign: 'right' }}>NEW BAL</th>
                </tr>
              </thead>
              <tbody>
                {history.map((tx) => (
                  <tr key={tx.id}>
                    <td style={{ fontFamily: 'JetBrains Mono', fontSize: '12px', color: '#7c6a58' }}>
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>{tx.created_at || tx.transaction_date}</span>
                      </div>
                    </td>

                    <td style={{ fontFamily: 'JetBrains Mono', fontSize: '12px', color: '#422b1b', fontWeight: 700 }}>
                      {tx.receipt_ref || '-'}
                    </td>

                    <td>
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

                    <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono', fontWeight: 800, color: tx.transaction_type === 'RECEIVED_FROM_PARENT' ? '#1e3b22' : '#4d370e' }}>
                      {tx.transaction_type === 'RECEIVED_FROM_PARENT' ? '+' : '-'}K {Math.round(tx.amount).toLocaleString('en-IN')}
                    </td>

                    <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono', color: '#7c6a58' }}>
                      K {Math.round(tx.previous_balance || 0).toLocaleString('en-IN')}
                    </td>

                    <td style={{ textAlign: 'right', fontFamily: 'JetBrains Mono', fontWeight: 800, color: '#2c1f14' }}>
                      K {Math.round(tx.new_balance || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ marginTop: '16px', textAlign: 'right' }}>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ height: '34px', fontSize: '12px' }}
          >
            Close History Ledger
          </button>
        </div>

      </div>
    </div>
  );
};

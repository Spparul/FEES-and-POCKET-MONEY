import React, { useState, useEffect } from 'react';
import type { Student, PocketTransaction } from '../api';
import { recordPocketMoneyTx, getStudentPocketProfile } from '../api';
import { printDataset } from '../utils/printHelper';
import { formatStandard } from '../utils/formatters';
import { StudentHistoryModal } from './StudentHistoryModal';
import { Search, ArrowDownLeft, ArrowUpRight, RotateCcw, CheckCircle2, Printer, AlertCircle, X, Clock, History } from 'lucide-react';

interface QuickDeskViewProps {
  students: Student[];
  onTransactionComplete: () => void;
  selectedDeskStudent?: Student | null;
  onClearDeskStudent?: () => void;
}

export const QuickDeskView: React.FC<QuickDeskViewProps> = ({
  students,
  onTransactionComplete,
  selectedDeskStudent,
  onClearDeskStudent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(selectedDeskStudent || null);
  const [studentTxHistory, setStudentTxHistory] = useState<PocketTransaction[]>([]);
  const [showFullHistoryModal, setShowFullHistoryModal] = useState<boolean>(false);

  // Transaction Input State
  const [amountStr, setAmountStr] = useState('');
  const [sourceRecipient, setSourceRecipient] = useState('');
  const [receiptRef, setReceiptRef] = useState('');
  const [remarks, setRemarks] = useState('');

  // Confirmation Modal State
  const [pendingAction, setPendingAction] = useState<'RECEIVED_FROM_PARENT' | 'GIVEN_TO_STUDENT' | 'RETURNED_TO_PARENT' | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Synchronize when selectedDeskStudent changes from external tabs
  useEffect(() => {
    if (selectedDeskStudent) {
      handleSelectStudent(selectedDeskStudent);
    }
  }, [selectedDeskStudent]);

  const searchMatches = students.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return false;
    return (
      s.pay_id.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      (s.pupil_id && s.pupil_id.toLowerCase().includes(q))
    );
  });

  const fetchStudentHistory = async (studentId: number) => {
    try {
      const data = await getStudentPocketProfile(studentId);
      setStudentTxHistory(data.pocket_transactions || []);
      if (data.student) {
        setSelectedStudent(data.student);
      }
    } catch (err) {
      console.error("Failed to load student history:", err);
    }
  };

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setSearchQuery(student.pay_id);
    setReceiptRef(`POCKET-REC-${Math.floor(100000 + Math.random() * 900000)}`);
    setError(null);
    setAmountStr('');
    setRemarks('');
    setSourceRecipient('');
    setPendingAction(null);
    fetchStudentHistory(student.id);
  };

  const handleClearStudent = () => {
    setSelectedStudent(null);
    setSearchQuery('');
    if (onClearDeskStudent) {
      onClearDeskStudent();
    }
  };

  const handleKeyDownSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchMatches.length > 0) {
      handleSelectStudent(searchMatches[0]);
    }
  };

  const numAmount = Math.round(parseFloat(amountStr) || 0);
  const currentBalance = Math.round(selectedStudent?.current_balance || 0);

  let newBalance = currentBalance;
  if (pendingAction === 'RECEIVED_FROM_PARENT') {
    newBalance = currentBalance + numAmount;
  } else if (pendingAction === 'GIVEN_TO_STUDENT' || pendingAction === 'RETURNED_TO_PARENT') {
    newBalance = currentBalance - numAmount;
  }

  const isInsufficient = (action: 'GIVEN_TO_STUDENT' | 'RETURNED_TO_PARENT') => numAmount > currentBalance;

  const handleTriggerAction = (action: 'RECEIVED_FROM_PARENT' | 'GIVEN_TO_STUDENT' | 'RETURNED_TO_PARENT') => {
    setError(null);
    if (numAmount <= 0) {
      setError('Please enter a valid transaction amount.');
      return;
    }

    if ((action === 'GIVEN_TO_STUDENT' || action === 'RETURNED_TO_PARENT') && isInsufficient(action)) {
      setError(`Insufficient balance! Held balance is K ${currentBalance.toLocaleString('en-IN')}, cannot issue K ${numAmount.toLocaleString('en-IN')}.`);
      return;
    }

    setPendingAction(action);
  };

  const handleConfirmSaveTransaction = async (shouldPrint: boolean = false) => {
    if (!selectedStudent || !pendingAction) return;

    setSaving(true);
    setError(null);

    try {
      await recordPocketMoneyTx({
        student_id: selectedStudent.id,
        transaction_date: new Date().toISOString().split('T')[0],
        transaction_type: pendingAction,
        amount: numAmount,
        source_or_recipient: sourceRecipient || undefined,
        receipt_ref: receiptRef || undefined,
        remarks: remarks || undefined,
      });

      if (shouldPrint) {
        const typeLabel = {
          RECEIVED_FROM_PARENT: "POCKET MONEY TOP UP (PARENT DEPOSIT)",
          GIVEN_TO_STUDENT: "POCKET MONEY ISSUE (GIVEN TO STUDENT)",
          RETURNED_TO_PARENT: "POCKET MONEY REFUND (RETURNED TO PARENT)"
        }[pendingAction];

        printDataset({
          title: "CANISIUS SECONDARY SCHOOL — POCKET MONEY SLIP",
          subtitle: `Receipt Ref: ${receiptRef} • Type: ${typeLabel}`,
          academicYear: '2026–2027',
          columns: [
            { header: 'Field', accessor: (row: any) => row.label, width: '40%' },
            { header: 'Details / Amount', accessor: (row: any) => row.value, width: '60%' },
          ],
          data: [
            { label: 'Student PayID', value: selectedStudent.pay_id },
            { label: 'Student Name', value: selectedStudent.name },
            { label: 'Academic Level & Class', value: `${selectedStudent.academic_level} (${selectedStudent.current_standard}-${selectedStudent.current_section})` },
            { label: 'Transaction Type', value: typeLabel },
            { label: 'Transaction Date', value: new Date().toISOString().split('T')[0] },
            { label: 'Source / Recipient Person', value: sourceRecipient || '-' },
            { label: 'Transaction Amount', value: `K ${numAmount.toLocaleString('en-IN')}` },
            { label: 'Previous Balance Held', value: `K ${currentBalance.toLocaleString('en-IN')}` },
            { label: 'New Balance Held', value: `K ${newBalance.toLocaleString('en-IN')}` },
            { label: 'Receipt Ref Number', value: receiptRef },
            { label: 'Remarks / Notes', value: remarks || 'Recorded via Quick Counter Desk' },
          ],
        });
      }

      // Refresh student & app stats
      await fetchStudentHistory(selectedStudent.id);
      onTransactionComplete();

      // Reset transaction form
      setAmountStr('');
      setRemarks('');
      setSourceRecipient('');
      setPendingAction(null);
      setReceiptRef(`POCKET-REC-${Math.floor(100000 + Math.random() * 900000)}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to record transaction');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* 1. COMPACT SEARCH BAR */}
      <div className="card" style={{ padding: selectedStudent ? '10px 14px' : '20px 18px' }}>
        <div style={{ maxWidth: '540px', margin: selectedStudent ? '0' : '0 auto', textAlign: selectedStudent ? 'left' : 'center' }}>
          {!selectedStudent && (
            <>
              <span className="badge badge-amber" style={{ marginBottom: '6px' }}>
                COUNTER TERMINAL
              </span>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#2c1f14', marginBottom: '2px' }}>
                Student Pocket Money Counter Desk
              </h2>
              <p style={{ fontSize: '12px', color: '#7c6a58', marginBottom: '12px' }}>
                Search PayID / Admission Number or Student Name and press <strong>ENTER</strong> to open counter.
              </p>
            </>
          )}

          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#7c6a58', pointerEvents: 'none', zIndex: 10, opacity: 0.7 }} />
            <input
              type="text"
              className="input-field"
              placeholder={selectedStudent ? "Search another student by PayID or name..." : "Type PayID (e.g. 12011/23) or Student Name and press ENTER..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDownSearch}
              style={{ paddingLeft: '38px', height: selectedStudent ? '36px' : '40px', fontSize: '13px' }}
              autoFocus
            />
          </div>

          {/* Search Dropdown Candidates */}
          {searchMatches.length > 0 && searchQuery && (!selectedStudent || selectedStudent.pay_id !== searchQuery) && (
            <div style={{ marginTop: '4px', backgroundColor: '#eae3d2', border: '1px solid #422b1b', borderRadius: '6px', overflow: 'hidden', boxShadow: '0 6px 14px rgba(44,31,20,0.12)', position: 'relative', zIndex: 10 }}>
              {searchMatches.slice(0, 5).map((student) => (
                <div
                  key={student.id}
                  onClick={() => handleSelectStudent(student)}
                  style={{ padding: '8px 12px', borderBottom: '1px solid #c4b799', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <div>
                    <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color: '#422b1b', fontSize: '13px', marginRight: '6px' }}>{student.pay_id}</span>
                    <span style={{ fontWeight: 800, color: '#2c1f14', fontSize: '13px' }}>{student.name}</span>
                    <span style={{ fontSize: '11px', color: '#7c6a58', marginLeft: '6px' }}>({student.academic_level})</span>
                  </div>
                  <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 800, fontSize: '13px', color: '#4d370e' }}>
                    K {Math.round(student.current_balance).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. UNIFIED COUNTER WORKSPACE CONTAINER */}
      {selectedStudent && (
        <div className="card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* SECTION A: STUDENT IDENTITY ANCHOR */}
          <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid #c4b799' }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#2c1f14' }}>
                {selectedStudent.name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '1px' }}>
                PayID: <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{selectedStudent.pay_id}</strong> • Class: <strong>{formatStandard(selectedStudent.current_standard)}</strong> • Sec: <strong>{selectedStudent.current_section || '—'}</strong> • Category: <strong>{selectedStudent.boarding_category === 'HOSTEL_SPECIAL' ? 'Special Boarder' : selectedStudent.boarding_category === 'DAY_SCHOLAR' ? 'Day Scholar' : 'Ordinary Boarder'}</strong>
                {selectedStudent.is_sponsored && (
                  <span style={{ marginLeft: '6px', color: '#1e3b22', fontWeight: 700 }}>• Sponsor: {selectedStudent.sponsor_name || 'Govt Sponsor'}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFullHistoryModal(true)}
                className="btn btn-secondary"
                style={{ height: '32px', fontSize: '12px' }}
                title="View complete transaction ledger for this student"
              >
                <History size={13} />
                <span>Full Ledger</span>
              </button>

              <button
                onClick={handleClearStudent}
                className="btn btn-secondary"
                style={{ height: '32px', fontSize: '12px' }}
              >
                <X size={13} />
                <span>Clear Student</span>
              </button>
            </div>
          </div>

          {/* SECTION B: HIGHEST VISUAL FOCAL POINT — CURRENT HELD BALANCE */}
          <div style={{ textAlign: 'center', padding: '14px 0' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#7c6a58', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '2px' }}>
              CURRENT HELD BALANCE
            </span>
            <div style={{ fontSize: '36px', fontWeight: 900, fontFamily: 'JetBrains Mono', color: '#4d370e', lineHeight: 1.1 }}>
              K {currentBalance.toLocaleString('en-IN')}
            </div>
          </div>

          {/* SECTION C: TRANSACTION CONTROLS & AMOUNT */}
          <div style={{ paddingTop: '16px', borderTop: '1px solid #c4b799', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            
            {error && (
              <div style={{ width: '100%', maxWidth: '480px', backgroundColor: '#edd5d5', border: '1px solid #d4a3a3', color: '#571b1b', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            {/* Enter Amount Input */}
            <div style={{ width: '100%', maxWidth: '340px', textAlign: 'center' }}>
              <label className="form-label" style={{ marginBottom: '4px', display: 'block', fontSize: '12px', color: '#5c4a3a' }}>
                Enter Transaction Amount (K)
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#422b1b', fontFamily: 'JetBrains Mono', fontSize: '15px' }}>
                  K
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  className="input-field"
                  placeholder="0"
                  value={amountStr}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                      setAmountStr(val);
                    }
                  }}
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  style={{ paddingLeft: '34px', height: '40px', fontSize: '15px', fontWeight: '800', fontFamily: 'JetBrains Mono', textAlign: 'left', borderColor: '#422b1b' }}
                />
              </div>
            </div>

            {/* Cohesive Action Group Buttons */}
            <div style={{ width: '100%', maxWidth: '520px' }}>
              <label className="form-label" style={{ marginBottom: '6px', display: 'block', textAlign: 'center', fontSize: '12px', color: '#5c4a3a' }}>
                Select Action:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleTriggerAction('RECEIVED_FROM_PARENT')}
                  className="btn btn-secondary"
                  style={{ height: '38px', fontSize: '12px', fontWeight: 700, borderColor: '#b7cca4', color: '#1e3b22', backgroundColor: '#d9e5d6' }}
                >
                  <ArrowDownLeft size={15} />
                  <span>+ TOP UP</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTriggerAction('GIVEN_TO_STUDENT')}
                  className="btn btn-primary"
                  style={{ height: '38px', fontSize: '12px', fontWeight: 700, backgroundColor: '#422b1b' }}
                >
                  <ArrowUpRight size={15} />
                  <span>− GIVE TO STUDENT</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTriggerAction('RETURNED_TO_PARENT')}
                  className="btn btn-secondary"
                  style={{ height: '38px', fontSize: '12px', fontWeight: 700, borderColor: '#c7b3ce', color: '#3a1c42', backgroundColor: '#e3d7e8' }}
                >
                  <RotateCcw size={15} />
                  <span>↩ REFUND TO PARENT</span>
                </button>
              </div>
            </div>

          </div>

          {/* SECTION D: RECENT ACTIVITY LEDGER (LATEST TRANSACTION FIRST) */}
          <div style={{ paddingTop: '16px', borderTop: '1px solid #c4b799' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#2c1f14', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                RECENT ACTIVITY ({selectedStudent.name.toUpperCase()} — LATEST FIRST)
              </div>

              <button
                onClick={() => setShowFullHistoryModal(true)}
                className="btn btn-secondary"
                style={{ height: '28px', fontSize: '11px', padding: '0 8px' }}
              >
                <History size={12} />
                <span>View Full Transaction History</span>
              </button>
            </div>

            {studentTxHistory.length === 0 ? (
              <div style={{ fontSize: '12px', color: '#7c6a58', fontWeight: 600, padding: '10px 0' }}>
                No transactions recorded yet for this student.
              </div>
            ) : (
              <table style={{ width: '100%', fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '6px 10px', fontSize: '11px' }}>DATE & TIME</th>
                    <th style={{ padding: '6px 10px', fontSize: '11px' }}>TYPE</th>
                    <th style={{ padding: '6px 10px', fontSize: '11px' }}>RECEIPT REF</th>
                    <th style={{ padding: '6px 10px', fontSize: '11px', textAlign: 'right' }}>AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {studentTxHistory.slice(0, 5).map((tx) => (
                    <tr key={tx.id}>
                      <td style={{ padding: '6px 10px', fontFamily: 'JetBrains Mono', color: '#7c6a58' }}>
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          <span>{tx.created_at || tx.transaction_date}</span>
                        </div>
                      </td>
                      <td style={{ padding: '6px 10px', fontWeight: 700 }}>
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
                      <td style={{ padding: '6px 10px', fontFamily: 'JetBrains Mono', color: '#422b1b', fontWeight: 600 }}>
                        {tx.receipt_ref || '-'}
                      </td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'JetBrains Mono', fontWeight: 800, color: tx.transaction_type === 'RECEIVED_FROM_PARENT' ? '#1e3b22' : '#4d370e' }}>
                        {tx.transaction_type === 'RECEIVED_FROM_PARENT' ? '+' : '-'}K {Math.round(tx.amount).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      )}

      {/* CONFIRMATION DIALOG MODAL */}
      {pendingAction && selectedStudent && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade" style={{ maxWidth: '440px', padding: '20px' }}>
            <div className="flex items-center justify-between" style={{ paddingBottom: '8px', borderBottom: '1px solid #c4b799', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#2c1f14', margin: 0 }}>
                Confirm {pendingAction === 'RECEIVED_FROM_PARENT' ? 'Top Up' : pendingAction === 'GIVEN_TO_STUDENT' ? 'Cash Issue' : 'Refund'}
              </h3>
              <button onClick={() => setPendingAction(null)} style={{ background: 'none', border: 'none', color: '#7c6a58', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#2c1f14' }}>
                {selectedStudent.name} <span style={{ color: '#422b1b', fontFamily: 'JetBrains Mono', fontSize: '12px' }}>({selectedStudent.pay_id})</span>
              </div>
            </div>

            <div style={{ backgroundColor: '#f8f4ea', border: '1px solid #c4b799', borderRadius: '6px', padding: '12px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '12px' }}>
              <div className="flex justify-between">
                <span style={{ color: '#7c6a58', fontWeight: 600 }}>Current Balance:</span>
                <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color: '#2c1f14' }}>K {currentBalance.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#7c6a58', fontWeight: 600 }}>Transaction Amount:</span>
                <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 800, color: '#422b1b' }}>K {numAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between" style={{ paddingTop: '5px', borderTop: '1px solid #a89876' }}>
                <span style={{ color: '#2c1f14', fontWeight: 800 }}>Balance After:</span>
                <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 800, color: '#4d370e', fontSize: '14px' }}>K {newBalance.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Optional Metadata Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              <input
                type="text"
                className="input-field"
                placeholder="Source / Recipient Person (Optional)..."
                value={sourceRecipient}
                onChange={(e) => setSourceRecipient(e.target.value)}
                style={{ height: '34px', fontSize: '12px' }}
              />
              <input
                type="text"
                className="input-field"
                placeholder="Remarks / Notes (Optional)..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                style={{ height: '34px', fontSize: '12px' }}
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleConfirmSaveTransaction(false)}
                disabled={saving}
                className="btn btn-primary flex-1"
                style={{ height: '36px', fontSize: '13px' }}
              >
                <CheckCircle2 size={15} />
                <span>{saving ? 'Processing...' : 'CONFIRM'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleConfirmSaveTransaction(true)}
                disabled={saving}
                className="btn btn-secondary"
                style={{ height: '36px', fontSize: '12px' }}
              >
                <Printer size={14} />
                <span>Save & Print</span>
              </button>

              <button
                type="button"
                onClick={() => setPendingAction(null)}
                className="btn btn-secondary"
                style={{ height: '36px', fontSize: '12px' }}
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

      {/* STUDENT COMPLETE HISTORY MODAL */}
      {showFullHistoryModal && selectedStudent && (
        <StudentHistoryModal
          student={selectedStudent}
          onClose={() => setShowFullHistoryModal(false)}
        />
      )}

    </div>
  );
};

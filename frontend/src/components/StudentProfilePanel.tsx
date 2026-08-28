import React, { useEffect, useState } from 'react';
import type { StudentProfileData } from '../api';
import { getStudentProfile } from '../api';
import { X, CreditCard, Wallet, Calendar, UserCheck } from 'lucide-react';

interface StudentProfilePanelProps {
  studentId: number | null;
  onClose: () => void;
  onPayFee: (student: any) => void;
  onPocketMoney: (student: any) => void;
}

export const StudentProfilePanel: React.FC<StudentProfilePanelProps> = ({
  studentId,
  onClose,
  onPayFee,
  onPocketMoney,
}) => {
  const [profileData, setProfileData] = useState<StudentProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'fees' | 'history' | 'pocket'>('overview');

  useEffect(() => {
    if (studentId) {
      setLoading(true);
      getStudentProfile(studentId)
        .then((data) => setProfileData(data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [studentId]);

  if (!studentId) return null;

  const student = profileData?.student;
  const feeOverview = student?.fee_overview;
  const pocketSummary = student?.pocket_money;
  const isHosteller = student?.boarding_category !== 'DAY_SCHOLAR';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm font-sans animate-fadeIn">
      <div className="bg-[var(--bg-card)] w-full max-w-3xl h-full flex flex-col shadow-2xl border-l border-[var(--border-color)] text-[var(--text-primary)]">
        
        {/* Drawer Header Bar */}
        <div className="px-6 py-4 bg-[var(--bg-header)] text-[var(--text-header)] flex items-center justify-between border-b border-[var(--border-dark)]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold font-heading">{student?.name || 'Student Profile'}</h2>
              {student && (
                <span className="px-2.5 py-0.5 rounded text-xs font-extrabold bg-[var(--accent-gold)] text-slate-950">
                  Standard {student.current_standard} — {student.current_section}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-[var(--text-header-muted)] mt-0.5 font-medium">
              <span className="font-mono">ADM: <strong className="text-[var(--text-header)]">{student?.admission_no}</strong></span>
              <span>•</span>
              <span>Adm Year: <strong className="text-[var(--text-header)]">{student?.admission_year}</strong></span>
              <span>•</span>
              <span>{student?.boarding_category?.replace(/_/g, ' ')}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[var(--bg-sidebar)] hover:brightness-125 text-[var(--text-header)] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading || !student ? (
          <div className="flex-1 flex items-center justify-center text-[var(--text-secondary)]">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-[var(--accent-gold)] border-t-transparent rounded-full animate-spin"></div>
              <span className="font-semibold text-xs">Loading complete student profile & ledgers...</span>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Drawer Tab Selectors */}
            <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition border ${
                  activeTab === 'overview'
                    ? 'bg-[var(--accent-primary)] text-white border-[var(--border-dark)]'
                    : 'bg-[var(--bg-page)] text-[var(--text-primary)] border-[var(--border-color)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Overview</span>
              </button>

              <button
                onClick={() => setActiveTab('fees')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition border ${
                  activeTab === 'fees'
                    ? 'bg-[var(--accent-primary)] text-white border-[var(--border-dark)]'
                    : 'bg-[var(--bg-page)] text-[var(--text-primary)] border-[var(--border-color)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Fee Ledger ({feeOverview?.terms_paid_count}/3 Paid)</span>
              </button>

              {isHosteller && (
                <button
                  onClick={() => setActiveTab('pocket')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition border ${
                    activeTab === 'pocket'
                      ? 'bg-[var(--accent-primary)] text-white border-[var(--border-dark)]'
                      : 'bg-[var(--bg-page)] text-[var(--text-primary)] border-[var(--border-color)] hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  <Wallet className="w-4 h-4" />
                  <span>Pocket Money (₹{pocketSummary?.current_balance || 0})</span>
                </button>
              )}

              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition border ${
                  activeTab === 'history'
                    ? 'bg-[var(--accent-primary)] text-white border-[var(--border-dark)]'
                    : 'bg-[var(--bg-page)] text-[var(--text-primary)] border-[var(--border-color)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Academic History</span>
              </button>
            </div>

            {/* TAB 1: OVERVIEW & PERSONAL DETAILS */}
            {activeTab === 'overview' && (
              <div className="space-y-6 text-xs">
                
                <div className="bg-[var(--bg-page)] p-5 rounded-xl border border-[var(--border-color)] space-y-4">
                  <h3 className="font-extrabold font-heading text-sm text-[var(--text-primary)] uppercase tracking-wider">
                    Student Personal & Parent Record
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[var(--text-secondary)] font-bold uppercase text-[10px] block mb-0.5">Student Full Name</span>
                      <span className="font-extrabold text-sm text-[var(--text-primary)]">{student.name}</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-secondary)] font-bold uppercase text-[10px] block mb-0.5">Admission Number</span>
                      <span className="font-mono font-bold text-sm text-[var(--text-primary)]">{student.admission_no}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[var(--border-color)]">
                    <div>
                      <span className="text-[var(--text-secondary)] font-bold uppercase text-[10px] block mb-0.5">Father / Guardian Name</span>
                      <span className="font-bold text-sm text-[var(--text-primary)]">{student.father_name}</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-secondary)] font-bold uppercase text-[10px] block mb-0.5">Contact Number</span>
                      <span className="font-mono font-bold text-sm text-[var(--text-primary)]">{student.contact_no}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[var(--border-color)]">
                    <div>
                      <span className="text-[var(--text-secondary)] font-bold uppercase text-[10px] block mb-0.5">Date of Birth</span>
                      <span className="font-semibold text-[var(--text-primary)]">{student.dob}</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-secondary)] font-bold uppercase text-[10px] block mb-0.5">Date of Admission</span>
                      <span className="font-semibold text-[var(--text-primary)]">{student.date_of_admission}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Fee Summary Box */}
                <div className="bg-[var(--bg-table-head)] p-4 rounded-xl border border-[var(--border-color)] flex items-center justify-between">
                  <div>
                    <span className="text-[var(--text-secondary)] font-bold uppercase text-[10px] block mb-0.5">Overall Fee Status</span>
                    <span className="font-extrabold text-base text-[var(--text-primary)] font-mono">{feeOverview?.overall_status} ({feeOverview?.terms_paid_count}/3 Terms)</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[var(--text-secondary)] font-bold uppercase text-[10px] block mb-0.5">Outstanding Balance</span>
                    <span className="font-extrabold text-lg text-[var(--pill-due-text)] font-mono">₹{feeOverview?.total_due.toLocaleString()}</span>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: SCHOOL FEES */}
            {activeTab === 'fees' && (
              <div className="space-y-5 text-xs">
                
                {/* 3-Term Fee Structure Table */}
                <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] overflow-hidden shadow-sm">
                  <div className="p-3 bg-[var(--bg-table-head)] border-b border-[var(--border-color)] flex items-center justify-between">
                    <h3 className="font-extrabold font-heading text-[var(--text-primary)] uppercase tracking-wider text-[11px]">
                      Three-Term Fee Structure Breakdown
                    </h3>
                    <button
                      onClick={() => onPayFee(student)}
                      className="flex items-center gap-1.5 bg-[var(--accent-gold)] text-slate-950 px-3 py-1 rounded text-xs font-extrabold shadow-sm transition hover:brightness-105"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Record Payment</span>
                    </button>
                  </div>

                  <table className="w-full text-left text-xs text-[var(--text-primary)] ledger-table">
                    <thead className="bg-[var(--bg-page)] text-[var(--text-primary)] font-bold uppercase text-[10px] border-b border-[var(--border-color)]">
                      <tr>
                        <th className="py-2 px-3">Term</th>
                        <th className="py-2 px-3 text-right">Expected Amount</th>
                        <th className="py-2 px-3 text-right">Paid Amount</th>
                        <th className="py-2 px-3 text-center">Payment Date</th>
                        <th className="py-2 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                      {feeOverview?.term_details.map((td) => (
                        <tr key={td.term_name}>
                          <td className="py-2.5 px-3 font-bold text-[var(--text-primary)]">{td.term_name}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold">₹{td.expected_amount.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-[var(--pill-paid-text)]">
                            ₹{td.paid_amount.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-medium text-[var(--text-secondary)]">
                            {td.payment_date || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                              td.status === 'Paid'
                                ? 'bg-[var(--pill-paid-bg)] text-[var(--pill-paid-text)] border-[var(--pill-paid-border)]'
                                : 'bg-[var(--pill-due-bg)] text-[var(--pill-due-text)] border-[var(--pill-due-border)]'
                            }`}>
                              {td.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Chronological Payment History Table */}
                <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] overflow-hidden shadow-sm">
                  <div className="p-3 bg-[var(--bg-table-head)] border-b border-[var(--border-color)]">
                    <h3 className="font-extrabold font-heading text-[var(--text-primary)] uppercase tracking-wider text-[11px]">
                      Chronological Payment Transactions Ledger
                    </h3>
                  </div>

                  {profileData.payment_history.length === 0 ? (
                    <p className="p-4 text-[var(--text-secondary)] italic">No fee payment transactions recorded yet.</p>
                  ) : (
                    <table className="w-full text-left text-xs text-[var(--text-primary)] ledger-table">
                      <thead className="bg-[var(--bg-page)] text-[var(--text-primary)] font-bold uppercase text-[10px] border-b border-[var(--border-color)]">
                        <tr>
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3">Receipt No.</th>
                          <th className="py-2 px-3 text-right">Amount</th>
                          <th className="py-2 px-3">Terms Covered</th>
                          <th className="py-2 px-3">Method</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-color)]">
                        {profileData.payment_history.map((ph) => (
                          <tr key={ph.id}>
                            <td className="py-2.5 px-3 font-mono font-medium">{ph.payment_date}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-[var(--text-primary)]">{ph.receipt_no}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-[var(--pill-paid-text)]">₹{ph.total_amount.toLocaleString()}</td>
                            <td className="py-2.5 px-3 font-bold text-[var(--accent-gold)]">{ph.terms_covered.join(' + ')}</td>
                            <td className="py-2.5 px-3 text-[var(--text-secondary)]">{ph.payment_method}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

              </div>
            )}

            {/* TAB 3: POCKET MONEY */}
            {activeTab === 'pocket' && isHosteller && (
              <div className="space-y-5 text-xs">
                
                <div className="grid grid-cols-4 gap-3 bg-[var(--bg-page)] p-4 rounded-xl border border-[var(--border-color)]">
                  <div className="bg-[var(--pill-paid-bg)] p-3 rounded-lg border border-[var(--pill-paid-border)]">
                    <span className="text-[var(--pill-paid-text)] font-bold uppercase text-[10px] block mb-0.5">Held Balance</span>
                    <span className="text-xl font-extrabold font-mono text-[var(--pill-paid-text)]">₹{pocketSummary?.current_balance.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-secondary)] font-bold uppercase text-[10px] block mb-0.5">Received Parents</span>
                    <span className="text-base font-bold font-mono text-[var(--text-primary)]">₹{pocketSummary?.total_received.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-secondary)] font-bold uppercase text-[10px] block mb-0.5">Disbursed Student</span>
                    <span className="text-base font-bold font-mono text-[var(--text-primary)]">₹{pocketSummary?.total_given.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-secondary)] font-bold uppercase text-[10px] block mb-0.5">Returned Parents</span>
                    <span className="text-base font-bold font-mono text-[var(--text-primary)]">₹{pocketSummary?.total_returned.toLocaleString()}</span>
                  </div>
                </div>

                {/* Pocket Money Ledger Table */}
                <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] overflow-hidden shadow-sm">
                  <div className="p-3 bg-[var(--bg-table-head)] border-b border-[var(--border-color)] flex items-center justify-between">
                    <h3 className="font-extrabold font-heading text-[var(--text-primary)] uppercase tracking-wider text-[11px]">
                      Pocket Money Transaction Ledger
                    </h3>
                    <button
                      onClick={() => onPocketMoney(student)}
                      className="flex items-center gap-1.5 bg-[var(--accent-gold)] text-slate-950 px-3 py-1 rounded text-xs font-extrabold shadow-sm transition hover:brightness-105"
                    >
                      <Wallet className="w-3.5 h-3.5" />
                      <span>New Transaction</span>
                    </button>
                  </div>

                  {profileData.pocket_transactions.length === 0 ? (
                    <p className="p-4 text-[var(--text-secondary)] italic">No pocket money transactions recorded.</p>
                  ) : (
                    <table className="w-full text-left text-xs text-[var(--text-primary)] ledger-table">
                      <thead className="bg-[var(--bg-page)] text-[var(--text-primary)] font-bold uppercase text-[10px] border-b border-[var(--border-color)]">
                        <tr>
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3">Type</th>
                          <th className="py-2 px-3 text-right">Amount</th>
                          <th className="py-2 px-3">Parent / Student Note</th>
                          <th className="py-2 px-3">Ref No</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-color)]">
                        {profileData.pocket_transactions.map((pt) => (
                          <tr key={pt.id}>
                            <td className="py-2.5 px-3 font-mono font-medium">{pt.transaction_date}</td>
                            <td className="py-2.5 px-3 font-bold text-[var(--accent-gold)]">
                              {pt.transaction_type.replace(/_/g, ' ')}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-[var(--text-primary)]">₹{pt.amount.toLocaleString()}</td>
                            <td className="py-2.5 px-3 text-[var(--text-secondary)]">{pt.source_or_recipient || '—'}</td>
                            <td className="py-2.5 px-3 font-mono text-[var(--text-secondary)]">{pt.receipt_ref || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

              </div>
            )}

            {/* TAB 4: ACADEMIC HISTORY */}
            {activeTab === 'history' && (
              <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] overflow-hidden shadow-sm text-xs">
                <div className="p-3 bg-[var(--bg-table-head)] border-b border-[var(--border-color)]">
                  <h3 className="font-extrabold font-heading text-[var(--text-primary)] uppercase tracking-wider text-[11px]">
                    Academic Enrollment History
                  </h3>
                </div>
                <table className="w-full text-left text-xs text-[var(--text-primary)] ledger-table">
                  <thead className="bg-[var(--bg-page)] text-[var(--text-primary)] font-bold uppercase text-[10px] border-b border-[var(--border-color)]">
                    <tr>
                      <th className="py-2 px-3">Academic Year</th>
                      <th className="py-2 px-3">Standard</th>
                      <th className="py-2 px-3">Section</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]">
                    {student.enrollment_history.map((eh) => (
                      <tr key={eh.id}>
                        <td className="py-2.5 px-3 font-mono font-bold">{eh.academic_year}</td>
                        <td className="py-2.5 px-3 font-bold text-[var(--accent-gold)]">{eh.standard}</td>
                        <td className="py-2.5 px-3 font-bold text-[var(--accent-gold)]">{eh.section}</td>
                        <td className="py-2.5 px-3">
                          {eh.is_current ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--pill-paid-bg)] text-[var(--pill-paid-text)] border border-[var(--pill-paid-border)]">
                              CURRENT CLASS
                            </span>
                          ) : (
                            <span className="text-[var(--text-secondary)]">Historical</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};

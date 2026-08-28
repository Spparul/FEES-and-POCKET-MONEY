import React, { useEffect, useState } from 'react';
import type { StudentProfileData } from '../api';
import { getStudentProfile } from '../api';
import { X, CreditCard, Wallet, Calendar, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface StudentProfileModalProps {
  studentId: number | null;
  onClose: () => void;
  onPayFee: (student: any) => void;
  onPocketMoney: (student: any) => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  studentId,
  onClose,
  onPayFee,
  onPocketMoney,
}) => {
  const [profileData, setProfileData] = useState<StudentProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'fees' | 'pocket' | 'history'>('fees');

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto font-sans">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-900">
        
        {/* Header Bar */}
        <div className="px-6 py-5 bg-slate-50 border-b border-slate-200 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-slate-900">{student?.name || 'Student Profile'}</h2>
              {student && (
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-50 text-indigo-900 border border-indigo-200">
                  {student.current_standard} — {student.current_section}
                </span>
              )}
            </div>
            <div className="flex items-center flex-wrap gap-4 text-xs text-slate-600">
              <span className="font-mono text-slate-700">Admission No: <strong className="text-slate-900">{student?.admission_no}</strong></span>
              <span>•</span>
              <span>Admission Year: <strong className="text-slate-900">{student?.admission_year}</strong></span>
              <span>•</span>
              <span>Category: <strong className="text-indigo-900 font-bold">{student?.boarding_category?.replace('_', ' ')}</strong></span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 hover:text-slate-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading || !student ? (
          <div className="py-20 text-center text-slate-600">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <span className="font-semibold">Fetching complete profile & ledgers...</span>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Guardian & Details Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 font-medium block mb-1">Father / Guardian</span>
                <span className="font-bold text-slate-900 text-sm">{student.father_name}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block mb-1">Contact Number</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{student.contact_no}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block mb-1">Date of Birth & Admission</span>
                <span className="text-slate-900 font-semibold">DOB: {student.dob} | Joined: {student.date_of_admission}</span>
              </div>
            </div>

            {/* Profile Tab Selector */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              <button
                onClick={() => setActiveTab('fees')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition border ${
                  activeTab === 'fees'
                    ? 'bg-indigo-700 text-white border-indigo-700 shadow-sm'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>School Fees & Ledger</span>
              </button>

              {isHosteller && (
                <button
                  onClick={() => setActiveTab('pocket')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition border ${
                    activeTab === 'pocket'
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  <Wallet className="w-4 h-4" />
                  <span>Pocket Money Ledger</span>
                </button>
              )}

              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition border ${
                  activeTab === 'history'
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Academic Class History</span>
              </button>
            </div>

            {/* TAB 1: SCHOOL FEES */}
            {activeTab === 'fees' && (
              <div className="space-y-6">
                
                {/* School Fee Summary Matrix */}
                <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Three-Term School Fee Summary ({feeOverview?.overall_status})
                    </h3>
                    <button
                      onClick={() => onPayFee(student)}
                      className="flex items-center gap-1.5 bg-indigo-700 hover:bg-indigo-800 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm transition"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Record Payment</span>
                    </button>
                  </div>

                  {/* Term Breakdown Table */}
                  <div className="overflow-x-auto mb-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <table className="w-full text-xs text-left text-slate-800">
                      <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px] border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-4">Term</th>
                          <th className="py-2.5 px-4 text-right">Expected Fee</th>
                          <th className="py-2.5 px-4 text-right">Paid Amount</th>
                          <th className="py-2.5 px-4 text-center">Payment Date</th>
                          <th className="py-2.5 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {feeOverview?.term_details.map((td) => (
                          <tr key={td.term_name}>
                            <td className="py-3 px-4 font-bold text-slate-900">{td.term_name}</td>
                            <td className="py-3 px-4 text-right font-mono font-semibold">₹{td.expected_amount.toLocaleString()}</td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800">
                              ₹{td.paid_amount.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-center text-slate-600 font-medium">
                              {td.payment_date || '—'}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold border ${
                                td.status === 'Paid'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-rose-50 text-rose-800 border-rose-200'
                              }`}>
                                {td.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Totals Box */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 text-xs shadow-sm">
                    <div>
                      <span className="text-slate-500 font-medium block mb-1">Terms Paid</span>
                      <span className="text-lg font-extrabold text-slate-900">{feeOverview?.terms_paid_count} / 3</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium block mb-1">Total Expected</span>
                      <span className="text-lg font-bold text-slate-900 font-mono">₹{feeOverview?.total_expected.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium block mb-1">Total Paid</span>
                      <span className="text-lg font-bold text-emerald-700 font-mono">₹{feeOverview?.total_paid.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium block mb-1">Outstanding Due</span>
                      <span className="text-lg font-bold text-rose-700 font-mono">₹{feeOverview?.total_due.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Chronological Payment History Ledger */}
                <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
                    Chronological Payment Transaction History
                  </h3>
                  {profileData.payment_history.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No fee payment transactions recorded yet.</p>
                  ) : (
                    <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm">
                      <table className="w-full text-xs text-left text-slate-800">
                        <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px] border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-4">Date</th>
                            <th className="py-2.5 px-4">Receipt No</th>
                            <th className="py-2.5 px-4 text-right">Amount</th>
                            <th className="py-2.5 px-4">Terms Covered</th>
                            <th className="py-2.5 px-4">Method</th>
                            <th className="py-2.5 px-4">Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {profileData.payment_history.map((ph) => (
                            <tr key={ph.id} className="hover:bg-slate-50">
                              <td className="py-3 px-4 font-mono font-medium text-slate-700">{ph.payment_date}</td>
                              <td className="py-3 px-4 font-mono font-bold text-slate-900">{ph.receipt_no}</td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800">₹{ph.total_amount.toLocaleString()}</td>
                              <td className="py-3 px-4 font-bold text-indigo-900">{ph.terms_covered.join(' + ')}</td>
                              <td className="py-3 px-4 text-slate-700">{ph.payment_method}</td>
                              <td className="py-3 px-4 text-slate-500">{ph.remarks || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* TAB 2: POCKET MONEY */}
            {activeTab === 'pocket' && isHosteller && (
              <div className="space-y-6">
                
                {/* Pocket Money Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-900">
                    <span className="text-xs uppercase font-bold block mb-1 text-emerald-800">Current Held Balance</span>
                    <span className="text-2xl font-extrabold font-mono">₹{pocketSummary?.current_balance.toLocaleString()}</span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                    <span className="text-xs uppercase font-bold text-slate-500 block mb-1">Total Received Parents</span>
                    <span className="text-xl font-bold font-mono text-slate-900">₹{pocketSummary?.total_received.toLocaleString()}</span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                    <span className="text-xs uppercase font-bold text-slate-500 block mb-1">Total Disbursed Student</span>
                    <span className="text-xl font-bold font-mono text-slate-900">₹{pocketSummary?.total_given.toLocaleString()}</span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                    <span className="text-xs uppercase font-bold text-slate-500 block mb-1">Total Returned Parents</span>
                    <span className="text-xl font-bold font-mono text-slate-900">₹{pocketSummary?.total_returned.toLocaleString()}</span>
                  </div>
                </div>

                {/* Pocket Money Transaction Ledger */}
                <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Pocket Money Transaction Ledger
                    </h3>
                    <button
                      onClick={() => onPocketMoney(student)}
                      className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm transition"
                    >
                      <Wallet className="w-4 h-4" />
                      <span>New Transaction</span>
                    </button>
                  </div>

                  {profileData.pocket_transactions.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No pocket money transactions recorded for this boarder.</p>
                  ) : (
                    <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm">
                      <table className="w-full text-xs text-left text-slate-800">
                        <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px] border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-4">Date</th>
                            <th className="py-2.5 px-4">Transaction Type</th>
                            <th className="py-2.5 px-4 text-right">Amount</th>
                            <th className="py-2.5 px-4">Parent / Student Note</th>
                            <th className="py-2.5 px-4">Ref / Receipt</th>
                            <th className="py-2.5 px-4">Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {profileData.pocket_transactions.map((pt) => {
                            const isRec = pt.transaction_type === 'RECEIVED_FROM_PARENT';
                            const isGiv = pt.transaction_type === 'GIVEN_TO_STUDENT';
                            return (
                              <tr key={pt.id} className="hover:bg-slate-50">
                                <td className="py-3 px-4 font-mono font-medium">{pt.transaction_date}</td>
                                <td className="py-3 px-4">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold border ${
                                    isRec
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                      : isGiv
                                      ? 'bg-blue-50 text-blue-800 border-blue-200'
                                      : 'bg-amber-50 text-amber-800 border-amber-200'
                                  }`}>
                                    {isRec ? <ArrowDownLeft className="w-3 h-3 text-emerald-700" /> : <ArrowUpRight className="w-3 h-3" />}
                                    {pt.transaction_type.replace(/_/g, ' ')}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                                  ₹{pt.amount.toLocaleString()}
                                </td>
                                <td className="py-3 px-4 font-medium text-slate-800">{pt.source_or_recipient || '—'}</td>
                                <td className="py-3 px-4 font-mono text-slate-600">{pt.receipt_ref || '—'}</td>
                                <td className="py-3 px-4 text-slate-500">{pt.remarks || '—'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* TAB 3: ACADEMIC HISTORY */}
            {activeTab === 'history' && (
              <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
                  Academic Enrollment & Class History
                </h3>
                <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm">
                  <table className="w-full text-xs text-left text-slate-800">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px] border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Academic Year</th>
                        <th className="py-2.5 px-4">Standard</th>
                        <th className="py-2.5 px-4">Section</th>
                        <th className="py-2.5 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {student.enrollment_history.map((eh) => (
                        <tr key={eh.id}>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">{eh.academic_year}</td>
                          <td className="py-3 px-4 font-bold text-indigo-900">{eh.standard}</td>
                          <td className="py-3 px-4 font-bold text-indigo-900">{eh.section}</td>
                          <td className="py-3 px-4">
                            {eh.is_current ? (
                              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                CURRENT CLASS
                              </span>
                            ) : (
                              <span className="text-slate-500 font-medium">Historical</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};

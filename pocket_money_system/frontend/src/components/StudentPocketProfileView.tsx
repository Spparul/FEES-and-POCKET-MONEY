import React, { useEffect, useState } from 'react';
import type { Student, StudentPocketProfileData } from '../api';
import { getStudentPocketProfile } from '../api';
import { printDataset } from '../utils/printHelper';
import { ArrowLeft, Wallet, Printer, PlusCircle, User, Calendar, ArrowDownLeft, ArrowUpRight, RotateCcw } from 'lucide-react';

interface StudentPocketProfileViewProps {
  studentId: number;
  onBack: () => void;
  onRecordPayment: (student: Student) => void;
}

export const StudentPocketProfileView: React.FC<StudentPocketProfileViewProps> = ({
  studentId,
  onBack,
  onRecordPayment,
}) => {
  const [data, setData] = useState<StudentPocketProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getStudentPocketProfile(studentId)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading || !data) {
    return (
      <div className="p-16 text-center text-slate-400 font-bold text-xl animate-fadeIn">
        Loading Student Pocket Money Profile...
      </div>
    );
  }

  const { student, summary, pocket_transactions } = data;

  const handlePrintStudentStatement = () => {
    printDataset({
      title: `CANISIUS SECONDARY SCHOOL — POCKET MONEY STATEMENT`,
      subtitle: `Student: ${student.name} • PayID: ${student.pay_id} • Currently Held Balance: ₹${summary.current_balance.toLocaleString('en-IN')}`,
      academicYear: '2026–2027',
      columns: [
        { header: 'Date', accessor: (row: any) => row.transaction_date, width: '15%' },
        { header: 'Type', accessor: (row: any) => row.transaction_type.replace(/_/g, ' '), width: '25%' },
        { header: 'Ref / Person', accessor: (row: any) => row.receipt_ref || row.source_or_recipient || '-', width: '20%' },
        { header: 'Amount (₹)', accessor: (row: any) => row.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }), align: 'right', width: '20%' },
        { header: 'Remarks', accessor: (row: any) => row.remarks || '-', width: '20%' },
      ],
      data: pocket_transactions,
    });
  };

  return (
    <div className="space-y-8 font-sans max-w-6xl mx-auto py-4 px-2 animate-fadeIn w-full">
      {/* Navigation Top Bar */}
      <div className="flex items-center justify-between border-b-2 border-slate-700 pb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white font-bold bg-slate-800 hover:bg-slate-700 px-5 py-3 rounded-2xl border border-slate-700 transition cursor-pointer shadow-sm text-lg"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Register</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onRecordPayment(student)}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-5 py-3 rounded-2xl shadow-md transition flex items-center gap-2 cursor-pointer text-lg"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Record Pocket Money</span>
          </button>

          <button
            onClick={handlePrintStudentStatement}
            className="bg-slate-800 hover:bg-slate-700 text-white font-extrabold px-5 py-3 rounded-2xl border border-slate-700 transition flex items-center gap-2 cursor-pointer text-lg"
          >
            <Printer className="w-5 h-5" />
            <span>Print Account Statement</span>
          </button>
        </div>
      </div>

      {/* Student Banner */}
      <div className="bg-slate-800/90 border-2 border-slate-700 p-8 rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-6">
        <div>
          <span className="px-3 py-1 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20 text-xs font-mono font-extrabold uppercase">
            STUDENT POCKET MONEY ACCOUNT
          </span>
          <h2 className="text-4xl font-extrabold font-heading text-white mt-2">{student.name}</h2>
          <div className="flex items-center gap-4 text-slate-300 font-mono text-lg mt-1 font-bold">
            <span>PayID: <strong className="text-amber-400">{student.pay_id}</strong></span>
            <span>•</span>
            <span>Class: {student.academic_level} ({student.current_standard}-{student.current_section})</span>
          </div>
        </div>

        <div className="bg-slate-900 border-2 border-amber-500/40 p-6 rounded-2xl text-right">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block">Current Held Balance</span>
          <span className="text-4xl font-extrabold font-mono text-amber-400 block mt-1">
            ₹{summary.current_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-slate-800/90 border border-slate-700 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Total Received (Parents)</span>
            <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-emerald-400">
            ₹{summary.total_received.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-slate-800/90 border border-slate-700 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Total Given to Student</span>
            <ArrowUpRight className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-indigo-400">
            ₹{summary.total_given.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-slate-800/90 border border-slate-700 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Total Returned to Parents</span>
            <RotateCcw className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-purple-400">
            ₹{summary.total_returned.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Account Statement History Ledger */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-3xl overflow-hidden shadow-lg p-6 space-y-4">
        <h3 className="text-2xl font-extrabold font-heading text-white flex items-center gap-2">
          <Wallet className="w-6 h-6 text-amber-400" />
          <span>Account Statement Ledger ({pocket_transactions.length} entries)</span>
        </h3>

        {pocket_transactions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-bold text-lg bg-slate-900 rounded-2xl border border-slate-700">
            No pocket money transactions recorded for this student yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-slate-400 border-b border-slate-700 uppercase font-extrabold tracking-wider text-xs">
                  <th className="py-4 px-5">Date</th>
                  <th className="py-4 px-5 text-center">Transaction Type</th>
                  <th className="py-4 px-5 text-right">Amount</th>
                  <th className="py-4 px-5">Receipt Ref / Person</th>
                  <th className="py-4 px-5">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700 font-bold text-white text-lg">
                {pocket_transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-700/50 transition">
                    <td className="py-4 px-5 font-mono text-slate-400 text-base">{tx.transaction_date}</td>
                    <td className="py-4 px-5 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase border ${
                        tx.transaction_type === 'RECEIVED_FROM_PARENT'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : tx.transaction_type === 'GIVEN_TO_STUDENT'
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                          : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      }`}>
                        {tx.transaction_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right font-mono font-extrabold text-2xl text-amber-400">
                      ₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-5 font-mono text-sm">{tx.receipt_ref || tx.source_or_recipient || '-'}</td>
                    <td className="py-4 px-5 text-sm font-normal text-slate-300">{tx.remarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

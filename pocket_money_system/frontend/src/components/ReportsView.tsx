import React from 'react';
import type { Student, PocketTransaction } from '../api';
import { printDataset } from '../utils/printHelper';
import { Printer, Wallet, Users, FileText } from 'lucide-react';

interface ReportsViewProps {
  students: Student[];
  transactions: PocketTransaction[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ students, transactions }) => {
  const studentsWithBalance = students.filter((s) => s.current_balance > 0);

  const handlePrintMasterHeldBalanceReport = () => {
    printDataset({
      title: 'CANISIUS SECONDARY SCHOOL — STUDENT HELD BALANCES REPORT',
      subtitle: `Master Pocket Money Balances Held Across All Active Students (${studentsWithBalance.length} students with active balances)`,
      academicYear: '2026–2027',
      columns: [
        { header: 'PayID', accessor: (s: Student) => s.pay_id, width: '15%' },
        { header: 'Student Name', accessor: (s: Student) => s.name, width: '35%' },
        { header: 'Class / Level', accessor: (s: Student) => `${s.academic_level} (${s.current_standard}-${s.current_section})`, width: '25%' },
        { header: 'Scheme', accessor: (s: Student) => s.boarding_category.replace('HOSTEL_', ''), width: '15%' },
        { header: 'Held Balance (₹)', accessor: (s: Student) => s.current_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 }), align: 'right', width: '20%' },
      ],
      data: studentsWithBalance,
    });
  };

  const handlePrintFullAuditLog = () => {
    printDataset({
      title: 'CANISIUS SECONDARY SCHOOL — MASTER POCKET MONEY AUDIT LOG',
      subtitle: `Complete Pocket Money Transaction History (${transactions.length} total entries)`,
      academicYear: '2026–2027',
      columns: [
        { header: 'Date', accessor: (tx: PocketTransaction) => tx.transaction_date, width: '12%' },
        { header: 'PayID', accessor: (tx: PocketTransaction) => tx.pay_id || '-', width: '12%' },
        { header: 'Student Name', accessor: (tx: PocketTransaction) => tx.student_name || 'Unknown', width: '22%' },
        { header: 'Type', accessor: (tx: PocketTransaction) => tx.transaction_type.replace(/_/g, ' '), width: '20%' },
        { header: 'Receipt Ref', accessor: (tx: PocketTransaction) => tx.receipt_ref || '-', width: '16%' },
        { header: 'Amount (₹)', accessor: (tx: PocketTransaction) => tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }), align: 'right', width: '18%' },
      ],
      data: transactions,
    });
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-fadeIn font-sans">
      <div className="bg-slate-800/90 border border-slate-700 p-8 rounded-3xl shadow-xl">
        <h2 className="text-3xl font-extrabold font-heading text-white mb-2 flex items-center gap-3">
          <FileText className="w-8 h-8 text-amber-400" />
          <span>Audit Reports & Printing Portal</span>
        </h2>
        <p className="text-slate-300 font-bold text-lg">
          Generate, export, and print official Canisius Secondary School pocket money ledger statements and balance reports.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Report Card 1: Active Student Held Balances */}
        <div className="bg-slate-800/90 border-2 border-slate-700 p-8 rounded-3xl shadow-lg flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-extrabold">
              <Wallet className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-extrabold font-heading text-white">
              Student Held Balances Summary
            </h3>
            <p className="text-slate-300 font-semibold text-base">
              Comprehensive financial audit report listing all students currently holding active pocket money balances.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-700 flex items-center justify-between">
            <span className="text-sm font-mono text-slate-400 font-bold">
              {studentsWithBalance.length} active balance accounts
            </span>
            <button
              onClick={handlePrintMasterHeldBalanceReport}
              disabled={studentsWithBalance.length === 0}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-6 py-3 rounded-2xl font-extrabold shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-40 text-base"
            >
              <Printer className="w-5 h-5" />
              <span>Print Balances Report</span>
            </button>
          </div>
        </div>

        {/* Report Card 2: Master Transaction Audit Log */}
        <div className="bg-slate-800/90 border-2 border-slate-700 p-8 rounded-3xl shadow-lg flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center font-extrabold">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-extrabold font-heading text-white">
              Master Pocket Money Audit Log
            </h3>
            <p className="text-slate-300 font-semibold text-base">
              Complete transaction history containing all parent deposits, disbursements to students, and parent refunds.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-700 flex items-center justify-between">
            <span className="text-sm font-mono text-slate-400 font-bold">
              {transactions.length} total transaction entries
            </span>
            <button
              onClick={handlePrintFullAuditLog}
              disabled={transactions.length === 0}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-extrabold shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-40 text-base"
            >
              <Printer className="w-5 h-5" />
              <span>Print Audit Log</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

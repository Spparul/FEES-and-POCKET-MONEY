import React, { useState, useEffect } from 'react';
import type { PaymentTransaction, PocketTransaction } from '../api';
import { getAllPaymentTransactions, getAllPocketMoneyTransactions } from '../api';
import { printDataset } from '../utils/printHelper';
import { formatStandard } from '../utils/formatters';
import { Receipt, Wallet, CreditCard, RotateCcw, Eye, Printer, AlertTriangle, Search } from 'lucide-react';

interface TransactionRecordsViewProps {
  onSelectStudent?: (studentId: number) => void;
}

export const TransactionRecordsView: React.FC<TransactionRecordsViewProps> = ({ onSelectStudent }) => {
  const [activeTab, setActiveTab] = useState<'fees' | 'pocket'>('fees');
  
  // Data state
  const [feeTransactions, setFeeTransactions] = useState<PaymentTransaction[]>([]);
  const [pocketTransactions, setPocketTransactions] = useState<PocketTransaction[]>([]);
  const [feeLoading, setFeeLoading] = useState(true);
  const [pocketLoading, setPocketLoading] = useState(true);

  // Search & Filter state
  const [feeSearchQuery, setFeeSearchQuery] = useState('');
  const [feeMethodFilter, setFeeMethodFilter] = useState('');
  const [feeTermFilter, setFeeTermFilter] = useState('');

  const [pocketSearchQuery, setPocketSearchQuery] = useState('');
  const [pocketTypeFilter, setPocketTypeFilter] = useState('');

  // Selected Detail Modal State
  const [selectedFeeTx, setSelectedFeeTx] = useState<PaymentTransaction | null>(null);

  const loadData = async () => {
    setFeeLoading(true);
    setPocketLoading(true);
    try {
      const [fees, pockets] = await Promise.all([
        getAllPaymentTransactions(),
        getAllPocketMoneyTransactions()
      ]);
      setFeeTransactions(fees);
      setPocketTransactions(pockets);
    } catch (err) {
      console.error(err);
    } finally {
      setFeeLoading(false);
      setPocketLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);


  // Filter calculations
  const filteredFeeTransactions = feeTransactions.filter((tx) => {
    const q = feeSearchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      (tx.receipt_no && tx.receipt_no.toLowerCase().includes(q)) ||
      (tx.student_name && tx.student_name.toLowerCase().includes(q)) ||
      (tx.pay_id && tx.pay_id.toLowerCase().includes(q)) ||
      (tx.payment_no && tx.payment_no.toLowerCase().includes(q))
    );
    const matchesMethod = !feeMethodFilter || tx.payment_method === feeMethodFilter;
    const matchesTerm = !feeTermFilter || (tx.terms_covered && tx.terms_covered.includes(feeTermFilter));

    return matchesSearch && matchesMethod && matchesTerm;
  });

  const filteredPocketTransactions = pocketTransactions.filter((tx) => {
    const q = pocketSearchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      (tx.student_name && tx.student_name.toLowerCase().includes(q)) ||
      (tx.pay_id && tx.pay_id.toLowerCase().includes(q)) ||
      (tx.receipt_ref && tx.receipt_ref.toLowerCase().includes(q)) ||
      (tx.remarks && tx.remarks.toLowerCase().includes(q))
    );
    const matchesType = !pocketTypeFilter || tx.transaction_type === pocketTypeFilter;

    return matchesSearch && matchesType;
  });

  // Financial summary totals
  const totalFeeCollected = feeTransactions.reduce((acc, curr) => acc + curr.total_amount, 0);
  const totalMismatch = feeTransactions.reduce((acc, curr) => acc + Math.abs(curr.mismatch_amount || 0), 0);

  const totalPocketReceived = pocketTransactions
    .filter(t => t.transaction_type === 'RECEIVED_FROM_PARENT')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalPocketGiven = pocketTransactions
    .filter(t => t.transaction_type === 'GIVEN_TO_STUDENT')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const handlePrintFeeTransactions = () => {
    printDataset({
      title: 'SCHOOL FEE AUDIT TRANSACTIONS LEDGER',
      subtitle: `Filtered Fee Payment Receipts (${filteredFeeTransactions.length} records)`,
      academicYear: '2026–2027',
      columns: [
        { header: 'Date', accessor: (t: PaymentTransaction) => t.payment_date, width: '12%' },
        { header: 'Receipt No', accessor: (t: PaymentTransaction) => t.receipt_no, width: '16%' },
        { header: 'PayID', accessor: (t: PaymentTransaction) => t.pay_id || '-', width: '12%' },
        { header: 'Student Name', accessor: (t: PaymentTransaction) => t.student_name || 'Unknown', width: '22%' },
        { header: 'Class', accessor: (t: PaymentTransaction) => `${t.academic_level || ''} (${t.standard || ''}-${t.section || ''})`, width: '14%' },
        { header: 'Method', accessor: (t: PaymentTransaction) => t.payment_method, width: '12%' },
        { header: 'Amount Paid (K)', accessor: (t: PaymentTransaction) => `K ${Math.round(t.total_amount).toLocaleString('en-IN')}`, align: 'right', width: '12%' },
      ],
      data: filteredFeeTransactions,
    });
  };

  const handlePrintPocketTransactions = () => {
    printDataset({
      title: 'HOSTELLER POCKET MONEY TRANSACTIONS LEDGER',
      subtitle: `Filtered Pocket Money Transactions (${filteredPocketTransactions.length} records)`,
      academicYear: '2026–2027',
      columns: [
        { header: 'Date', accessor: (t: PocketTransaction) => t.transaction_date, width: '12%' },
        { header: 'PayID', accessor: (t: PocketTransaction) => t.pay_id || '-', width: '12%' },
        { header: 'Student Name', accessor: (t: PocketTransaction) => t.student_name || 'Unknown', width: '25%' },
        { header: 'Type', accessor: (t: PocketTransaction) => t.transaction_type.replace(/_/g, ' '), width: '20%' },
        { header: 'Receipt Ref', accessor: (t: PocketTransaction) => t.receipt_ref || '-', width: '15%' },
        { header: 'Amount (K)', accessor: (t: PocketTransaction) => `K ${Math.round(t.amount).toLocaleString('en-IN')}`, align: 'right', width: '16%' },
      ],
      data: filteredPocketTransactions,
    });
  };

  return (
    <div className="space-y-3 font-sans animate-fadeIn w-full">
      {/* Header Banner */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] px-3 py-2 rounded-lg shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-2 w-full">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold">
              <Receipt size={14} />
            </div>
            <h2 className="text-sm font-extrabold font-heading text-[var(--text-primary)]">
              Master Transaction Records Ledger
            </h2>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] font-semibold mt-0.5">
            Complete financial audit ledger of School Fee Payments & Hosteller Pocket Money deposits across Canisius Secondary School.
          </p>
        </div>

        {activeTab === 'fees' ? (
          <button
            onClick={handlePrintFeeTransactions}
            disabled={feeLoading || filteredFeeTransactions.length === 0}
            className="btn btn-primary flex items-center gap-1.5 px-3 py-1 text-xs"
          >
            <Printer size={13} />
            <span>Print Fee Report</span>
          </button>
        ) : (
          <button
            onClick={handlePrintPocketTransactions}
            disabled={pocketLoading || filteredPocketTransactions.length === 0}
            className="btn btn-primary flex items-center gap-1.5 px-3 py-1 text-xs"
          >
            <Printer size={13} />
            <span>Print Pocket Money Report</span>
          </button>
        )}
      </div>

      {/* TAB NAVIGATION BAR */}
      <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-2">
        <button
          onClick={() => setActiveTab('fees')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-extrabold text-xs transition cursor-pointer ${
            activeTab === 'fees'
              ? 'bg-indigo-700 text-white shadow-sm'
              : 'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-color)] hover:bg-slate-100'
          }`}
        >
          <CreditCard size={13} />
          <span>School Fee Payment Receipts ({feeTransactions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pocket')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-extrabold text-xs transition cursor-pointer ${
            activeTab === 'pocket'
              ? 'bg-indigo-700 text-white shadow-sm'
              : 'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-color)] hover:bg-slate-100'
          }`}
        >
          <Wallet size={13} />
          <span>Boarder Pocket Money Transactions ({pocketTransactions.length})</span>
        </button>
      </div>

      {/* TAB 1: SCHOOL FEE TRANSACTIONS */}
      {activeTab === 'fees' && (
        <div className="space-y-3">
          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="card px-4 py-3 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-extrabold text-[var(--text-secondary)] uppercase tracking-wide">
                  Total Fee Transactions
                </span>
                <Receipt size={15} className="text-indigo-600" />
              </div>
              <div className="text-lg font-extrabold font-mono text-[var(--text-primary)]">
                {feeTransactions.length}
              </div>
              <span className="text-xs text-[var(--text-secondary)] block mt-0.5 font-semibold">Recorded Receipts</span>
            </div>

            <div className="card px-4 py-3 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-extrabold text-[var(--text-secondary)] uppercase tracking-wide">
                  Total Revenue Collected
                </span>
                <CreditCard size={15} className="text-emerald-600" />
              </div>
              <div className="text-lg font-extrabold font-mono text-emerald-800">
                K {Math.round(totalFeeCollected).toLocaleString('en-IN')}
              </div>
              <span className="text-xs text-[var(--text-secondary)] block mt-0.5 font-semibold">School Fee Receipts</span>
            </div>

            <div className="card px-4 py-3 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-extrabold text-[var(--text-secondary)] uppercase tracking-wide">
                  Total Flagged Mismatches
                </span>
                <AlertTriangle size={15} className="text-amber-600" />
              </div>
              <div className="text-lg font-extrabold font-mono text-amber-800">
                K {Math.round(totalMismatch).toLocaleString('en-IN')}
              </div>
              <span className="text-xs text-[var(--text-secondary)] block mt-0.5 font-semibold">Overpaid / Underpaid Balances</span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] px-3 py-2 rounded-lg shadow-sm flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center flex-wrap gap-2 flex-1">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none z-10 opacity-70" />
                <input
                  type="text"
                  placeholder="Search by PayID, Student Name, Receipt No..."
                  value={feeSearchQuery}
                  onChange={(e) => setFeeSearchQuery(e.target.value)}
                  style={{ paddingLeft: '38px' }}
                  className="w-full bg-[var(--bg-page)] border border-[var(--border-color)] rounded pr-2.5 py-1 text-xs text-[var(--text-primary)] font-bold focus:outline-none focus:border-[var(--accent-gold)]"
                />
              </div>

              <select
                value={feeTermFilter}
                onChange={(e) => setFeeTermFilter(e.target.value)}
                className="select-field text-xs py-1 px-2 h-7"
              >
                <option value="">All Terms</option>
                <option value="Term 1">Term 1 Transactions</option>
                <option value="Term 2">Term 2 Transactions</option>
                <option value="Term 3">Term 3 Transactions</option>
              </select>

              <select
                value={feeMethodFilter}
                onChange={(e) => setFeeMethodFilter(e.target.value)}
                className="select-field text-xs py-1 px-2 h-7"
              >
                <option value="">All Payment Methods</option>
                <option value="CASH">Cash Deposit</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
                <option value="CHEQUE">Cheque / Draft</option>
              </select>
            </div>

            {(feeSearchQuery || feeMethodFilter || feeTermFilter) && (
              <button
                onClick={() => {
                  setFeeSearchQuery('');
                  setFeeMethodFilter('');
                  setFeeTermFilter('');
                }}
                className="btn btn-secondary text-xs px-2 py-1"
              >
                <RotateCcw size={12} />
                <span>Remove Filters</span>
              </button>
            )}
          </div>

          {/* Fee Transactions Table */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg overflow-hidden shadow-sm">
            {feeLoading ? (
              <div className="p-6 text-center text-[var(--text-secondary)] font-bold text-xs">
                Loading Fee Transaction Records...
              </div>
            ) : filteredFeeTransactions.length === 0 ? (
              <div className="p-6 text-center text-[var(--text-secondary)] font-bold text-xs">
                No fee payment transaction records found matching your filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse ledger-table text-xs">
                  <thead>
                    <tr className="bg-[var(--bg-table-head)] text-[var(--text-primary)] border-b border-[var(--border-color)] uppercase font-extrabold tracking-wider">
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Receipt No</th>
                      <th className="py-2 px-3">PayID</th>
                      <th className="py-2 px-3">Student Name</th>
                      <th className="py-2 px-2 text-center">Class</th>
                      <th className="py-2 px-3 text-right">Expected</th>
                      <th className="py-2 px-3 text-right">Amount Paid</th>
                      <th className="py-2 px-2 text-center">Mismatch</th>
                      <th className="py-2 px-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y border-[var(--border-color)] font-medium text-xs text-[var(--text-primary)]">
                    {filteredFeeTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-[var(--bg-hover)] transition">
                        <td className="py-2 px-3 font-mono text-[var(--text-secondary)]">{tx.payment_date}</td>
                        <td className="py-2 px-3 font-mono font-extrabold text-indigo-700">{tx.receipt_no}</td>
                        <td className="py-2 px-3 font-mono text-[var(--accent-gold)]">{tx.pay_id || '-'}</td>
                        <td className="py-2 px-3">
                          <button
                            onClick={() => onSelectStudent && tx.student_id && onSelectStudent(tx.student_id)}
                            className="font-extrabold text-[var(--text-primary)] hover:text-indigo-600 text-left cursor-pointer"
                          >
                            {tx.student_name}
                          </button>
                          <div className="text-[10px] text-[var(--text-secondary)] font-mono">{tx.payment_no}</div>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <span className="px-2 py-0.5 rounded bg-[var(--bg-table-head)] border border-[var(--border-color)] font-mono text-[10px]">
                            Grade {formatStandard(tx.standard)} - {tx.section}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-[var(--text-secondary)]">
                          K {Math.round(tx.expected_amount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-emerald-800 font-extrabold">
                          K {Math.round(tx.total_amount).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2 px-2 text-center font-mono">
                          {tx.mismatch_amount && tx.mismatch_amount > 0 ? (
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold block">
                              +K {Math.round(tx.mismatch_amount).toLocaleString('en-IN')} Excess
                            </span>
                          ) : tx.mismatch_amount && tx.mismatch_amount < 0 ? (
                            <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-900 border border-red-300 text-[10px] font-bold block">
                              -K {Math.round(Math.abs(tx.mismatch_amount)).toLocaleString('en-IN')} Deficit
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-bold">Exact</span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setSelectedFeeTx(tx)}
                              className="p-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition cursor-pointer"
                              title="View Full Payment Slip"
                            >
                              <Eye size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: BOARDER POCKET MONEY TRANSACTIONS */}
      {activeTab === 'pocket' && (
        <div className="space-y-3">
          {/* Pocket Money Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-[var(--bg-card)] px-3 py-2 rounded-lg border border-[var(--border-color)] shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider">
                  Total Received From Parents
                </span>
                <Wallet size={13} className="text-emerald-600" />
              </div>
              <div className="text-base font-extrabold font-mono text-emerald-800">
                K {Math.round(totalPocketReceived).toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-[var(--text-secondary)] block mt-0.5 font-bold">Parent Deposits</span>
            </div>

            <div className="bg-[var(--bg-card)] px-3 py-2 rounded-lg border border-[var(--border-color)] shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-extrabold text-[var(--text-secondary)] uppercase tracking-wider">
                  Total Issued To Students
                </span>
                <Wallet size={13} className="text-indigo-600" />
              </div>
              <div className="text-base font-extrabold font-mono text-indigo-800">
                K {Math.round(totalPocketGiven).toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-[var(--text-secondary)] block mt-0.5 font-bold">Student Disbursements</span>
            </div>
          </div>

          {/* Pocket Money Filter Bar */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] px-3 py-2 rounded-lg shadow-sm flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center flex-wrap gap-2 flex-1">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none z-10 opacity-70" />
                <input
                  type="text"
                  placeholder="Search by PayID, Student Name, Receipt Ref..."
                  value={pocketSearchQuery}
                  onChange={(e) => setPocketSearchQuery(e.target.value)}
                  style={{ paddingLeft: '38px' }}
                  className="w-full bg-[var(--bg-page)] border border-[var(--border-color)] rounded pr-2.5 py-1 text-xs text-[var(--text-primary)] font-bold focus:outline-none focus:border-[var(--accent-gold)]"
                />
              </div>

              <select
                value={pocketTypeFilter}
                onChange={(e) => setPocketTypeFilter(e.target.value)}
                className="select-field text-xs py-1 px-2 h-7"
              >
                <option value="">All Transaction Types</option>
                <option value="RECEIVED_FROM_PARENT">Received from Parent</option>
                <option value="GIVEN_TO_STUDENT">Given to Student</option>
                <option value="RETURNED_TO_PARENT">Returned to Parent</option>
              </select>
            </div>

            {(pocketSearchQuery || pocketTypeFilter) && (
              <button
                onClick={() => {
                  setPocketSearchQuery('');
                  setPocketTypeFilter('');
                }}
                className="btn btn-secondary text-xs px-2 py-1"
              >
                <RotateCcw size={12} />
                <span>Remove Filters</span>
              </button>
            )}
          </div>

          {/* Pocket Money Transactions Table */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg overflow-hidden shadow-sm">
            {pocketLoading ? (
              <div className="p-6 text-center text-[var(--text-secondary)] font-bold text-xs">
                Loading Pocket Money Transactions...
              </div>
            ) : filteredPocketTransactions.length === 0 ? (
              <div className="p-6 text-center text-[var(--text-secondary)] font-bold text-xs">
                No boarder pocket money transactions recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse ledger-table text-xs">
                  <thead>
                    <tr className="bg-[var(--bg-table-head)] text-[var(--text-primary)] border-b border-[var(--border-color)] uppercase font-extrabold tracking-wider">
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">PayID</th>
                      <th className="py-2 px-3">Student Name</th>
                      <th className="py-2 px-2 text-center">Type</th>
                      <th className="py-2 px-3 text-right">Amount</th>
                      <th className="py-2 px-3">Receipt Ref</th>
                      <th className="py-2 px-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y border-[var(--border-color)] font-medium text-xs text-[var(--text-primary)]">
                    {filteredPocketTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-[var(--bg-hover)] transition">
                        <td className="py-2 px-3 font-mono text-[var(--text-secondary)]">{tx.transaction_date}</td>
                        <td className="py-2 px-3 font-mono text-[var(--accent-gold)]">{tx.pay_id || '-'}</td>
                        <td className="py-2 px-3">
                          <button
                            onClick={() => onSelectStudent && tx.student_id && onSelectStudent(tx.student_id)}
                            className="font-extrabold text-[var(--text-primary)] hover:text-indigo-600 text-left cursor-pointer"
                          >
                            {tx.student_name}
                          </button>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                            tx.transaction_type === 'RECEIVED_FROM_PARENT'
                              ? 'bg-[var(--pill-paid-bg)] text-[var(--pill-paid-text)] border-[var(--pill-paid-border)]'
                              : tx.transaction_type === 'GIVEN_TO_STUDENT'
                              ? 'bg-[var(--pill-due-bg)] text-[var(--pill-due-text)] border-[var(--pill-due-border)]'
                              : 'bg-purple-100 text-purple-900 border-purple-300'
                          }`}>
                            {tx.transaction_type.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-extrabold text-emerald-800">
                          K {Math.round(tx.amount).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2 px-3 font-mono text-xs">{tx.receipt_ref || tx.source_or_recipient || '-'}</td>
                        <td className="py-2 px-3 text-xs text-slate-700">{tx.remarks || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fee Slip Detail Modal (Rules 25-28) */}
      {selectedFeeTx && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade" style={{ maxWidth: '580px', padding: '22px' }}>
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3 mb-4">
              <div>
                <span className="badge badge-amber">ORIGINAL PAYMENT DISTRIBUTION</span>
                <h3 className="text-base font-extrabold font-mono text-[var(--text-primary)] mt-1">Receipt #{selectedFeeTx.receipt_no}</h3>
              </div>
              <button
                onClick={() => setSelectedFeeTx(null)}
                className="text-[var(--text-secondary)] font-bold text-sm cursor-pointer hover:text-slate-900"
              >
                ✕
              </button>
            </div>

            {/* Header Student & Payment Metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-bold text-[var(--text-primary)] bg-[var(--bg-page)] p-3.5 rounded-xl border border-[var(--border-color)] font-mono mb-4">
              <div>
                <span className="text-[10px] text-[var(--text-secondary)] font-sans block uppercase font-bold">Student Name</span>
                <span className="text-xs font-extrabold font-sans text-indigo-950">{selectedFeeTx.student_name}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-secondary)] font-sans block uppercase font-bold">PayID</span>
                <span className="text-xs font-mono text-[var(--accent-gold)]">{selectedFeeTx.pay_id}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-secondary)] font-sans block uppercase font-bold">Payment Date</span>
                <span>{selectedFeeTx.payment_date}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-secondary)] font-sans block uppercase font-bold">Payment Method</span>
                <span className="text-indigo-600">{selectedFeeTx.payment_method}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-secondary)] font-sans block uppercase font-bold">Original Payment</span>
                <span className="text-sm font-extrabold text-emerald-800">K {Math.round(selectedFeeTx.total_amount).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Complete Distribution Breakdown (Rules 25-28) */}
            <div className="space-y-3 mb-5">
              <h4 className="text-xs font-extrabold uppercase text-[var(--text-secondary)] tracking-wider">Distribution Breakdown</h4>
              
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3.5 space-y-2.5 text-xs font-mono">
                {/* 1. Fees Allocated */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-slate-700">Fees Collected:</span>
                  <span className="font-extrabold text-emerald-700 text-sm">
                    K {Math.round(
                      Object.values(selectedFeeTx.allocations_breakdown || {}).reduce((a, b) => a + b, 0)
                    ).toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Term allocations breakdown */}
                {selectedFeeTx.allocations_breakdown && (
                  <div className="pl-3 space-y-1 text-[11px] text-slate-600">
                    {['Term 1', 'Term 2', 'Term 3'].map((tName) => {
                      const allocAmt = selectedFeeTx.allocations_breakdown?.[tName] || 0;
                      return (
                        <div key={tName} className="flex justify-between">
                          <span>{tName}:</span>
                          <span className={allocAmt > 0 ? 'font-bold text-emerald-800' : 'text-slate-400'}>
                            K {Math.round(allocAmt).toLocaleString('en-IN')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 2. Deficit Cleared */}
                {(selectedFeeTx.deficit_cleared || 0) > 0 && (
                  <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-indigo-900">
                    <span className="font-bold">Previous Deficit Cleared:</span>
                    <span className="font-extrabold">K {Math.round(selectedFeeTx.deficit_cleared || 0).toLocaleString('en-IN')}</span>
                  </div>
                )}

                {/* 3. Fee Excess */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-amber-900">
                  <span className="font-bold">Fee Excess:</span>
                  <span className="font-extrabold text-amber-800 text-sm">
                    K {Math.round(selectedFeeTx.fee_excess_amount || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                {/* 4. Excess Decision & Classification */}
                {(selectedFeeTx.fee_excess_amount || 0) > 0 && (
                  <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-2.5 mt-2 space-y-1 text-[11px]">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-amber-900">Excess Decision:</span>
                      <span className="font-extrabold bg-amber-200/80 text-amber-950 px-2 py-0.5 rounded uppercase">
                        {(selectedFeeTx.excess_decision || selectedFeeTx.excess_status || 'TAGGED AS EXCESS').replace(/_/g, ' ')}
                      </span>
                    </div>

                    {selectedFeeTx.sponsor_name && (
                      <div className="flex justify-between">
                        <span className="text-amber-800 font-medium">Sponsor Name:</span>
                        <span className="font-bold text-amber-950">{selectedFeeTx.sponsor_name}</span>
                      </div>
                    )}

                    {selectedFeeTx.pocket_money_tx_id && (
                      <div className="flex justify-between">
                        <span className="text-amber-800 font-medium">Pocket Money Tx ID:</span>
                        <span className="font-mono font-bold text-indigo-900">{selectedFeeTx.pocket_money_tx_id}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-[var(--border-color)]">
              <button
                onClick={() => setSelectedFeeTx(null)}
                className="btn btn-primary text-xs px-5 py-1.5 font-bold cursor-pointer"
              >
                Close Breakdown
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

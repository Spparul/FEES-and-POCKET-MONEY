import React, { useState } from 'react';
import type { Student } from '../api';
import { recordPocketMoneyTx } from '../api';
import { printDataset } from '../utils/printHelper';
import { Wallet, Calendar, Printer, ArrowLeft, AlertCircle, CheckCircle2, ArrowDownLeft, ArrowUpRight, RotateCcw } from 'lucide-react';

interface RecordTransactionScreenProps {
  student: Student;
  onBack: () => void;
  onTransactionRecorded: () => void;
}

export const RecordTransactionScreen: React.FC<RecordTransactionScreenProps> = ({
  student,
  onBack,
  onTransactionRecorded,
}) => {
  const [txType, setTxType] = useState<'RECEIVED_FROM_PARENT' | 'GIVEN_TO_STUDENT' | 'RETURNED_TO_PARENT'>('RECEIVED_FROM_PARENT');
  const [txDate, setTxDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [amountStr, setAmountStr] = useState('');
  const [sourceRecipient, setSourceRecipient] = useState('');
  const [receiptRef, setReceiptRef] = useState(() => `POCKET-REC-${Math.floor(100000 + Math.random() * 900000)}`);
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numAmount = parseFloat(amountStr) || 0;
  const currentBalance = student.current_balance || 0;

  // Expected new balance calculation
  let newBalance = currentBalance;
  if (txType === 'RECEIVED_FROM_PARENT') {
    newBalance = currentBalance + numAmount;
  } else if (txType === 'GIVEN_TO_STUDENT' || txType === 'RETURNED_TO_PARENT') {
    newBalance = currentBalance - numAmount;
  }

  const isInsufficient = (txType === 'GIVEN_TO_STUDENT' || txType === 'RETURNED_TO_PARENT') && numAmount > currentBalance;

  const handleSubmit = async (e: React.FormEvent, shouldPrint: boolean = false) => {
    e.preventDefault();
    if (numAmount <= 0) {
      setError('Please enter a valid transaction amount.');
      return;
    }

    if (isInsufficient) {
      setError(`Insufficient held balance! Available balance is ₹${currentBalance.toLocaleString('en-IN')}, cannot issue ₹${numAmount.toLocaleString('en-IN')}.`);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await recordPocketMoneyTx({
        student_id: student.id,
        transaction_date: txDate,
        transaction_type: txType,
        amount: numAmount,
        source_or_recipient: sourceRecipient || undefined,
        receipt_ref: receiptRef || undefined,
        remarks: remarks || undefined,
      });

      if (shouldPrint) {
        const typeLabel = {
          RECEIVED_FROM_PARENT: "POCKET MONEY DEPOSIT (FROM PARENT)",
          GIVEN_TO_STUDENT: "POCKET MONEY ISSUE (GIVEN TO STUDENT)",
          RETURNED_TO_PARENT: "POCKET MONEY REFUND (RETURNED TO PARENT)"
        }[txType];

        printDataset({
          title: "CANISIUS SECONDARY SCHOOL — POCKET MONEY RECEIPT",
          subtitle: `Receipt Ref: ${receiptRef} • Type: ${typeLabel}`,
          academicYear: '2026–2027',
          columns: [
            { header: 'Field', accessor: (row: any) => row.label, width: '40%' },
            { header: 'Details / Amount', accessor: (row: any) => row.value, width: '60%' },
          ],
          data: [
            { label: 'Student PayID', value: student.pay_id },
            { label: 'Student Name', value: student.name },
            { label: 'Academic Level & Class', value: `${student.academic_level} (${student.current_standard}-${student.current_section})` },
            { label: 'Transaction Type', value: typeLabel },
            { label: 'Transaction Date', value: txDate },
            { label: 'Source / Recipient Person', value: sourceRecipient || '-' },
            { label: 'Transaction Amount', value: `₹${numAmount.toLocaleString('en-IN')}` },
            { label: 'Previous Balance Held', value: `₹${currentBalance.toLocaleString('en-IN')}` },
            { label: 'New Balance Held', value: `₹${newBalance.toLocaleString('en-IN')}` },
            { label: 'Receipt Ref Number', value: receiptRef },
            { label: 'Remarks / Notes', value: remarks || 'Recorded in official Pocket Money Register' },
          ],
        });
      }

      onTransactionRecorded();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to record pocket money transaction.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 font-sans max-w-5xl mx-auto py-6 px-4 animate-fadeIn w-full">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between border-b-2 border-slate-700 pb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white font-bold bg-slate-800 hover:bg-slate-700 px-5 py-3 rounded-2xl border border-slate-700 transition cursor-pointer shadow-sm text-lg"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Hosteller Register</span>
        </button>

        <div className="text-right">
          <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
            Canisius Boarder Pocket Money System
          </span>
          <h2 className="text-3xl font-extrabold font-heading text-white">
            Record Pocket Money Transaction
          </h2>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border-2 border-red-500/40 text-red-200 p-5 rounded-2xl flex items-center gap-3 font-bold text-lg">
          <AlertCircle className="w-6 h-6 flex-shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Card */}
      <div className="bg-slate-800/90 border-2 border-slate-700 p-8 rounded-3xl shadow-xl space-y-8">
        
        {/* Student Information Banner */}
        <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hosteller Name & PayID</span>
            <h3 className="text-3xl font-extrabold text-white">{student.name}</h3>
            <span className="text-base font-mono font-bold text-amber-400 block mt-0.5">PayID: {student.pay_id}</span>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Currently Held Balance</span>
            <span className="text-4xl font-extrabold font-mono text-amber-400 block mt-1">
              ₹{currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-slate-400 block mt-1">
              {student.academic_level} ({student.current_standard}-{student.current_section})
            </span>
          </div>
        </div>

        <form className="space-y-8">
          
          {/* 1. Transaction Type Selection */}
          <div className="space-y-3">
            <label className="text-xl font-extrabold text-white flex items-center gap-2">
              <Wallet className="w-6 h-6 text-amber-400" />
              <span>Select Transaction Type:</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => setTxType('RECEIVED_FROM_PARENT')}
                className={`p-5 rounded-2xl border-3 text-left transition cursor-pointer ${
                  txType === 'RECEIVED_FROM_PARENT'
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg font-extrabold'
                    : 'bg-slate-900 text-slate-300 border-slate-700 font-bold hover:bg-slate-700/50'
                }`}
              >
                <div className="flex items-center gap-2 text-lg">
                  <ArrowDownLeft className="w-5 h-5" />
                  <span>Deposit from Parent</span>
                </div>
                <span className="text-xs opacity-90 block mt-1">Money received from parent into student account</span>
              </button>

              <button
                type="button"
                onClick={() => setTxType('GIVEN_TO_STUDENT')}
                className={`p-5 rounded-2xl border-3 text-left transition cursor-pointer ${
                  txType === 'GIVEN_TO_STUDENT'
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg font-extrabold'
                    : 'bg-slate-900 text-slate-300 border-slate-700 font-bold hover:bg-slate-700/50'
                }`}
              >
                <div className="flex items-center gap-2 text-lg">
                  <ArrowUpRight className="w-5 h-5" />
                  <span>Given to Student</span>
                </div>
                <span className="text-xs opacity-90 block mt-1">Cash disbursed to student for expenses</span>
              </button>

              <button
                type="button"
                onClick={() => setTxType('RETURNED_TO_PARENT')}
                className={`p-5 rounded-2xl border-3 text-left transition cursor-pointer ${
                  txType === 'RETURNED_TO_PARENT'
                    ? 'bg-purple-600 text-white border-purple-400 shadow-lg font-extrabold'
                    : 'bg-slate-900 text-slate-300 border-slate-700 font-bold hover:bg-slate-700/50'
                }`}
              >
                <div className="flex items-center gap-2 text-lg">
                  <RotateCcw className="w-5 h-5" />
                  <span>Returned to Parent</span>
                </div>
                <span className="text-xs opacity-90 block mt-1">Unused balance refunded back to parent</span>
              </button>
            </div>
          </div>

          {/* 2. Transaction Date Picker */}
          <div className="space-y-3">
            <label className="text-lg font-extrabold text-white flex items-center gap-2">
              <Calendar className="w-6 h-6 text-amber-400" />
              <span>Transaction Date:</span>
            </label>
            <input
              type="date"
              value={txDate}
              onChange={(e) => setTxDate(e.target.value)}
              className="w-full bg-slate-900 border-2 border-amber-500/60 rounded-2xl py-4 px-6 text-3xl font-mono font-extrabold text-white focus:outline-none focus:ring-4 focus:ring-amber-400/20"
              required
            />
          </div>

          {/* 3. Transaction Amount & Expected New Balance */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-lg font-extrabold text-white">
                Transaction Amount (₹):
              </label>
              <span className="text-base font-mono font-bold text-amber-400">
                New Balance: ₹{newBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <input
              type="number"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="Enter amount..."
              className={`w-full bg-slate-900 border-3 rounded-2xl px-6 py-4 text-4xl font-mono font-extrabold text-white focus:outline-none focus:ring-4 ${
                isInsufficient
                  ? 'border-red-500 focus:ring-red-500/20'
                  : 'border-amber-400 focus:ring-amber-400/20'
              }`}
              required
            />

            {isInsufficient && (
              <p className="text-red-400 font-bold text-base flex items-center gap-2 bg-red-500/10 p-3 rounded-xl border border-red-500/30">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>INSUFFICIENT BALANCE: Cannot disburse ₹{numAmount.toLocaleString()} when held balance is ₹{currentBalance.toLocaleString()}.</span>
              </p>
            )}
          </div>

          {/* 4. Source / Recipient & Receipt Ref */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-base font-extrabold text-white">
                Source / Recipient Person Name:
              </label>
              <input
                type="text"
                value={sourceRecipient}
                onChange={(e) => setSourceRecipient(e.target.value)}
                placeholder="e.g. Parent Name or Student Name..."
                className="w-full bg-slate-900 border-2 border-slate-700 rounded-2xl p-4 text-white font-bold text-lg focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-2">
              <label className="text-base font-extrabold text-white">
                Receipt Reference No:
              </label>
              <input
                type="text"
                value={receiptRef}
                onChange={(e) => setReceiptRef(e.target.value)}
                className="w-full bg-slate-900 border-2 border-slate-700 rounded-2xl p-4 text-white font-mono font-bold text-lg focus:outline-none focus:border-amber-400"
                required
              />
            </div>
          </div>

          {/* 5. Remarks */}
          <div className="space-y-2">
            <label className="text-base font-extrabold text-white">
              Remarks / Transaction Notes:
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Optional notes, purpose of disbursement, or parent deposit instructions..."
              className="w-full bg-slate-900 border-2 border-slate-700 rounded-2xl p-4 text-white font-bold text-base focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Submit Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-4 border-t-2 border-slate-700">
            {/* Option 1: Save Only */}
            <button
              type="button"
              onClick={(e) => handleSubmit(e, false)}
              disabled={saving || isInsufficient}
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold py-4 px-6 rounded-2xl shadow-lg transition flex items-center justify-center gap-3 cursor-pointer disabled:opacity-40 text-xl"
            >
              <CheckCircle2 className="w-6 h-6" />
              <span>{saving ? 'Recording Transaction...' : 'Record Transaction'}</span>
            </button>

            {/* Option 2: Save & Print */}
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              disabled={saving || isInsufficient}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-4 px-6 rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 text-lg"
            >
              <Printer className="w-5 h-5" />
              <span>Record & Print Slip</span>
            </button>

            <button
              type="button"
              onClick={onBack}
              className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-4 px-6 rounded-2xl cursor-pointer text-lg"
            >
              Cancel
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

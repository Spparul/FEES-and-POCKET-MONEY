import React, { useState } from 'react';
import type { Student } from '../api';
import { recordPocketMoneyTx } from '../api';
import { X, Wallet, ArrowDownLeft, ArrowUpRight, RotateCcw, ShieldAlert } from 'lucide-react';

interface PocketMoneyModalProps {
  student: Student | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const PocketMoneyModal: React.FC<PocketMoneyModalProps> = ({
  student,
  onClose,
  onSuccess,
}) => {
  if (!student) return null;

  const currentBalance = student.pocket_money?.current_balance || 0;

  const [txType, setTxType] = useState<'RECEIVED_FROM_PARENT' | 'GIVEN_TO_STUDENT' | 'RETURNED_TO_PARENT'>('RECEIVED_FROM_PARENT');
  const [amount, setAmount] = useState<string>('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [sourceRecipient, setSourceRecipient] = useState(student.father_name);
  const [refNo, setRefNo] = useState(`PM-REF-${Math.floor(1000 + Math.random() * 9000)}`);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTabChange = (type: 'RECEIVED_FROM_PARENT' | 'GIVEN_TO_STUDENT' | 'RETURNED_TO_PARENT') => {
    setTxType(type);
    setError(null);
    if (type === 'GIVEN_TO_STUDENT') {
      setSourceRecipient(student.name);
    } else {
      setSourceRecipient(student.father_name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError("Please enter a valid amount greater than zero.");
      return;
    }

    // STRICT DISBURSEMENT LIMIT VALIDATION: Cannot give or refund more than currently held parent deposits
    if ((txType === 'GIVEN_TO_STUDENT' || txType === 'RETURNED_TO_PARENT') && numericAmount > currentBalance) {
      setError(`Disbursement limit exceeded! The school cannot issue ₹${numericAmount.toLocaleString()} because the available balance deposited by the parent is only ₹${currentBalance.toLocaleString()}.`);
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await recordPocketMoneyTx({
        student_id: student.id,
        transaction_date: txDate,
        transaction_type: txType,
        amount: numericAmount,
        source_or_recipient: sourceRecipient.trim() || undefined,
        receipt_ref: refNo.trim() || undefined,
        remarks: remarks.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to record pocket money transaction.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm font-sans">
      <div className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl text-[var(--text-primary)]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-[var(--bg-table-head)] border-b-2 border-[var(--border-color)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--pill-paid-bg)] text-[var(--pill-paid-text)] border border-[var(--pill-paid-border)] flex items-center justify-center font-bold">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-[var(--text-primary)]" style={{ fontSize: '22px' }}>
                Boarder Pocket Money Transaction
              </h3>
              <p className="text-sm font-bold text-[var(--text-secondary)]">
                {student.name} ({student.current_standard}-{student.current_section}) • Adm #{student.admission_no}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] transition cursor-pointer"
          >
            <X className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Current Balance Indicator */}
        <div className="p-6 bg-[var(--pill-paid-bg)] border-b-2 border-[var(--pill-paid-border)] text-[var(--pill-paid-text)] flex items-center justify-between">
          <div>
            <span className="font-extrabold uppercase text-xs tracking-wider block" style={{ fontSize: '14px' }}>Current Held Balance (Parent Deposits)</span>
            <span className="font-extrabold font-mono text-3xl" style={{ fontSize: '32px' }}>₹{currentBalance.toLocaleString()}</span>
          </div>
          <div className="text-right font-bold text-sm">
            <span className="block opacity-90">Maximum Allowed Disbursement:</span>
            <span className="font-mono text-xl font-extrabold">₹{currentBalance.toLocaleString()}</span>
          </div>
        </div>

        {/* Transaction Type Tabs */}
        <div className="p-6 pb-0 flex gap-2">
          <button
            type="button"
            onClick={() => handleTabChange('RECEIVED_FROM_PARENT')}
            className={`flex-1 py-3 px-3 rounded-xl font-extrabold text-sm transition flex items-center justify-center gap-2 cursor-pointer border-2 ${
              txType === 'RECEIVED_FROM_PARENT'
                ? 'bg-[var(--pill-paid-bg)] text-[var(--pill-paid-text)] border-[var(--pill-paid-border)] shadow-sm'
                : 'bg-[var(--bg-page)] text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--bg-hover)]'
            }`}
            style={{ fontSize: '16px' }}
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Deposit (Parent)</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('GIVEN_TO_STUDENT')}
            className={`flex-1 py-3 px-3 rounded-xl font-extrabold text-sm transition flex items-center justify-center gap-2 cursor-pointer border-2 ${
              txType === 'GIVEN_TO_STUDENT'
                ? 'bg-[var(--accent-gold)] text-slate-950 border-[var(--accent-gold)] shadow-sm'
                : 'bg-[var(--bg-page)] text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--bg-hover)]'
            }`}
            style={{ fontSize: '16px' }}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Give to Student</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('RETURNED_TO_PARENT')}
            className={`flex-1 py-3 px-3 rounded-xl font-extrabold text-sm transition flex items-center justify-center gap-2 cursor-pointer border-2 ${
              txType === 'RETURNED_TO_PARENT'
                ? 'bg-[var(--bg-table-head)] text-[var(--text-primary)] border-[var(--border-color)] shadow-sm'
                : 'bg-[var(--bg-page)] text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--bg-hover)]'
            }`}
            style={{ fontSize: '16px' }}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Refund Parent</span>
          </button>
        </div>

        {/* Transaction Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border-2 border-red-500/30 text-red-700 font-bold flex items-start gap-3" style={{ fontSize: '18px' }}>
              <ShieldAlert className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Amount */}
            <div>
              <label className="block font-bold text-[var(--text-primary)] mb-1" style={{ fontSize: '18px' }}>
                Amount (₹) *
              </label>
              <input
                type="text"
                inputMode="decimal"
                required
                value={amount}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^\d*\.?\d*$/.test(val)) {
                    setAmount(val);
                  }
                }}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                placeholder="0.00"
                className="w-full bg-[var(--bg-page)] border-2 border-[var(--border-color)] rounded-xl px-4 py-2.5 font-mono font-extrabold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                style={{ fontSize: '20px' }}
              />
              {txType !== 'RECEIVED_FROM_PARENT' && (
                <span className="text-xs font-bold text-[var(--text-secondary)] mt-1 block">
                  Limit: Cannot exceed ₹{currentBalance.toLocaleString()}
                </span>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block font-bold text-[var(--text-primary)] mb-1" style={{ fontSize: '18px' }}>
                Transaction Date *
              </label>
              <input
                type="date"
                required
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
                className="w-full bg-[var(--bg-page)] border-2 border-[var(--border-color)] rounded-xl px-4 py-2.5 font-mono font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                style={{ fontSize: '18px' }}
              />
            </div>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Source or Recipient */}
            <div>
              <label className="block font-bold text-[var(--text-primary)] mb-1" style={{ fontSize: '18px' }}>
                {txType === 'RECEIVED_FROM_PARENT' ? 'Deposited By (Parent Name)' : txType === 'GIVEN_TO_STUDENT' ? 'Issued To (Student Name)' : 'Refunded To (Parent Name)'}
              </label>
              <input
                type="text"
                value={sourceRecipient}
                onChange={(e) => setSourceRecipient(e.target.value)}
                className="w-full bg-[var(--bg-page)] border-2 border-[var(--border-color)] rounded-xl px-4 py-2.5 font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                style={{ fontSize: '18px' }}
              />
            </div>

            {/* Receipt / Ref No */}
            <div>
              <label className="block font-bold text-[var(--text-primary)] mb-1" style={{ fontSize: '18px' }}>
                Ref / Voucher No.
              </label>
              <input
                type="text"
                value={refNo}
                onChange={(e) => setRefNo(e.target.value)}
                className="w-full bg-[var(--bg-page)] border-2 border-[var(--border-color)] rounded-xl px-4 py-2.5 font-mono font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                style={{ fontSize: '18px' }}
              />
            </div>

          </div>

          {/* Remarks */}
          <div>
            <label className="block font-bold text-[var(--text-primary)] mb-1" style={{ fontSize: '18px' }}>
              Remarks / Purpose
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Canteen allowance, stationery, weekend pass allowance..."
              className="w-full bg-[var(--bg-page)] border-2 border-[var(--border-color)] rounded-xl px-4 py-2.5 font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
              style={{ fontSize: '18px' }}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-[var(--border-color)]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-[var(--bg-page)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-color)] font-bold transition cursor-pointer"
              style={{ fontSize: '18px' }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-[var(--accent-gold)] text-slate-950 font-extrabold shadow-sm hover:brightness-110 transition cursor-pointer disabled:opacity-50"
              style={{ fontSize: '20px' }}
            >
              {submitting ? 'Recording Transaction...' : 'Save Transaction'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

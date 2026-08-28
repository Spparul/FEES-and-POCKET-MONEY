import React, { useState } from 'react';
import type { Student } from '../api';
import { recordFeePayment } from '../api';
import { X, CreditCard, Check, AlertCircle } from 'lucide-react';

interface RecordPaymentModalProps {
  student: Student | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  student,
  onClose,
  onSuccess,
}) => {
  if (!student) return null;

  if (student.status === 'TRANSFERRED') {
    return (
      <div className="modal-overlay z-50 fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="modal-content animate-fade max-w-sm p-5 bg-[var(--bg-card)] border-2 border-amber-300 rounded-xl text-center space-y-3 shadow-xl">
          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center mx-auto text-base font-bold">
            ⚠️
          </div>
          <h3 className="text-sm font-extrabold text-[var(--text-primary)]">
            Payment Recording Disabled
          </h3>
          <p className="text-xs font-semibold text-[var(--text-secondary)]">
            Student <strong>{student.name}</strong> ({student.admission_no}) is a <strong>TRANSFERRED</strong> student. Payment recording is strictly disabled.
          </p>
          <button
            onClick={onClose}
            className="btn btn-primary px-5 py-1 text-xs"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const getTermRate = (cat: string) => {
    switch (cat) {
      case 'DAY_SCHOLAR': return 1500;
      case 'HOSTEL_ORDINARY': return 2800;
      case 'HOSTEL_SPECIAL': return 4400;
      default: return 1500;
    }
  };

  const termRate = getTermRate(student.boarding_category);

  const termDetails = student.fee_overview?.term_details || [];
  const t1Paid = termDetails.find(t => t.term_name === 'Term 1')?.status === 'Paid';
  const t2Paid = termDetails.find(t => t.term_name === 'Term 2')?.status === 'Paid';
  const t3Paid = termDetails.find(t => t.term_name === 'Term 3')?.status === 'Paid';

  const [selectedTerms, setSelectedTerms] = useState<string[]>(() => {
    if (!t1Paid) return ['Term 1'];
    if (!t2Paid) return ['Term 2'];
    if (!t3Paid) return ['Term 3'];
    return [];
  });

  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [receiptNo, setReceiptNo] = useState(`R-${Math.floor(10000 + Math.random() * 90000)}`);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleTerm = (termName: string) => {
    if (selectedTerms.includes(termName)) {
      setSelectedTerms(selectedTerms.filter(t => t !== termName));
    } else {
      setSelectedTerms([...selectedTerms, termName]);
    }
  };

  const totalAmount = selectedTerms.length * termRate;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTerms.length === 0) {
      setError("Please select at least one fee term to record payment.");
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      await recordFeePayment({
        student_id: student.id,
        academic_year: student.academic_year || '2026-2027',
        payment_date: paymentDate,
        terms_covered: selectedTerms,
        payment_method: paymentMethod,
        receipt_no: receiptNo,
        remarks: remarks.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm font-sans">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl text-slate-900">
        
        {/* Header */}
        <div className="px-6 py-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Record Fee Payment</h3>
              <p className="text-xs text-slate-600 font-medium">
                {student.name} ({student.current_standard}-{student.current_section}) • ADM: {student.admission_no}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-700 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Student Category & Rate Card */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-slate-500 font-medium block mb-0.5">Boarding Category</span>
              <span className="font-bold text-slate-900 text-sm">{student.boarding_category.replace(/_/g, ' ')}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 font-medium block mb-0.5">Rate Per Term</span>
              <span className="font-extrabold text-indigo-800 text-base font-mono">₹{termRate.toLocaleString()}</span>
            </div>
          </div>

          {/* Multi-Term Selection Checkboxes */}
          <div>
            <label className="block text-slate-800 font-bold mb-2 uppercase tracking-wider">
              Select Terms Covered by Payment
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { name: 'Term 1', isPaid: t1Paid },
                { name: 'Term 2', isPaid: t2Paid },
                { name: 'Term 3', isPaid: t3Paid },
              ].map((term) => {
                const isSelected = selectedTerms.includes(term.name);
                return (
                  <button
                    type="button"
                    key={term.name}
                    disabled={term.isPaid}
                    onClick={() => toggleTerm(term.name)}
                    className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1 ${
                      term.isPaid
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-70'
                        : isSelected
                        ? 'bg-indigo-50 text-indigo-900 border-indigo-500 shadow-sm font-bold'
                        : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs font-bold">{term.name}</span>
                    <span className="text-[11px] font-semibold">
                      {term.isPaid ? 'Already Paid' : `₹${termRate.toLocaleString()}`}
                    </span>
                    {isSelected && (
                      <span className="mt-1 w-4 h-4 rounded-full bg-indigo-700 text-white flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Total Calculated Amount */}
          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200 flex items-center justify-between">
            <span className="font-bold text-slate-900 text-sm">Total Payment Amount:</span>
            <span className="text-2xl font-extrabold font-mono text-emerald-800">₹{totalAmount.toLocaleString()}</span>
          </div>

          {/* Date & Receipt Number */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 mb-1 font-bold">Payment Date</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1 font-bold">Receipt / Ref No</label>
              <input
                type="text"
                value={receiptNo}
                onChange={(e) => setReceiptNo(e.target.value)}
                required
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          {/* Payment Method & Remarks */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 mb-1 font-bold">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-indigo-600"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 mb-1 font-bold">Remarks (Optional)</label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Paid in full by father"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || selectedTerms.length === 0}
              className="px-5 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold shadow-sm transition disabled:opacity-50"
            >
              {submitting ? 'Recording...' : 'Confirm Payment'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

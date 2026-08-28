import React, { useEffect, useState } from 'react';
import type { Student } from '../api';
import { recordFeePayment, getStudentProfile } from '../api';
import { printDataset } from '../utils/printHelper';
import { CreditCard, Calendar, Printer, ArrowLeft, AlertCircle, ShieldCheck, AlertTriangle, ArrowDownLeft, CheckCircle2, Lock } from 'lucide-react';

interface RecordPaymentScreenProps {
  student: Student;
  onBack: () => void;
  onPaymentRecorded: () => void;
}

export const RecordPaymentScreen: React.FC<RecordPaymentScreenProps> = ({
  student,
  onBack,
  onPaymentRecorded,
}) => {
  if (student.status === 'TRANSFERRED') {
    return (
      <div className="card rounded-xl p-8 max-w-md mx-auto text-center space-y-4 shadow-sm animate-fadeIn">
        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center mx-auto text-xl font-bold">
          ⚠️
        </div>
        <h3 className="text-base font-extrabold text-[var(--text-primary)]">
          Fee Payment Recording Disabled
        </h3>
        <p className="text-xs font-semibold text-[var(--text-secondary)]">
          Student <strong>{student.name}</strong> ({student.admission_no}) is a <strong>TRANSFERRED</strong> student. Payment recording is strictly disabled.
        </p>
        <button
          onClick={onBack}
          className="btn btn-primary px-5 py-1.5 text-xs"
        >
          Return Back
        </button>
      </div>
    );
  }
  const [selectedTerms, setSelectedTerms] = useState<('Term 1' | 'Term 2' | 'Term 3')[]>([]);
  const [paidTerms, setPaidTerms] = useState<string[]>([]);

  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'MOBILE_MONEY' | 'CHEQUE'>('CASH');
  const [receiptNo, setReceiptNo] = useState(() => `REC-${Math.floor(100000 + Math.random() * 900000)}`);
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Exact term rate based on student boarding category
  const termRate = student.boarding_category === 'DAY_SCHOLAR'
    ? 1500
    : student.boarding_category === 'HOSTEL_ORDINARY'
    ? 2800
    : 4400; // HOSTEL_SPECIAL / Hosteller

  // Fetch student profile to check which terms are already fully paid
  useEffect(() => {
    getStudentProfile(student.id)
      .then((data) => {
        const paid = (data.payment_history || []).flatMap((p) => p.terms_covered || []);
        setPaidTerms(paid);

        // Auto-select first unpaid term
        const unpaid = (['Term 1', 'Term 2', 'Term 3'] as const).filter((t) => !paid.includes(t));
        if (unpaid.length > 0) {
          setSelectedTerms([unpaid[0]]);
          setAmountPaidStr((1 * termRate).toString());
        } else {
          setSelectedTerms([]);
          setAmountPaidStr('0');
        }
      })
      .catch(console.error);
  }, [student.id, termRate]);

  const expectedTotal = selectedTerms.length * termRate;
  
  // Open typing string state so user can freely type any payment amount
  const [amountPaidStr, setAmountPaidStr] = useState<string>(expectedTotal.toString());
  const numAmountPaid = parseFloat(amountPaidStr) || 0;

  // Live mismatch & sponsor return calculations
  const mismatchAmount = numAmountPaid - expectedTotal;
  const isExcess = mismatchAmount > 0;
  const isDeficit = mismatchAmount < 0;
  const sponsorReturn = (isExcess && student.is_sponsored) ? mismatchAmount : 0;

  const handleTermToggle = (term: 'Term 1' | 'Term 2' | 'Term 3') => {
    if (paidTerms.includes(term)) return; // Prevent selecting already paid terms!

    setSelectedTerms((prev) => {
      const next = prev.includes(term) ? prev.filter((t) => t !== term) : [...prev, term];
      const newExpected = next.length * termRate;
      setAmountPaidStr(newExpected.toString());
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent, shouldPrint: boolean = false) => {
    e.preventDefault();
    if (selectedTerms.length === 0) {
      setError('Please select at least one unpaid term to record payment for.');
      return;
    }

    if (numAmountPaid <= 0) {
      setError('Please enter a valid total payment amount.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await recordFeePayment({
        student_id: student.id,
        academic_year: '2026-2027',
        payment_date: paymentDate,
        total_amount: numAmountPaid,
        payment_method: paymentMethod,
        receipt_no: receiptNo,
        remarks: remarks || undefined,
        terms_covered: selectedTerms,
      });

      // Print slip only if requested by user
      if (shouldPrint) {
        printDataset({
          title: "CANISIUS SECONDARY SCHOOL — OFFICIAL FEE RECEIPT",
          subtitle: `Receipt No: ${receiptNo} • Payment Ref No: PAY-${receiptNo}`,
          academicYear: '2026–2027',
          columns: [
            { header: 'Payment Field', accessor: (row: any) => row.label, width: '40%' },
            { header: 'Payment Information / Amount', accessor: (row: any) => row.value, width: '60%' },
          ],
          data: [
            { label: 'Student PayID', value: student.pay_id },
            { label: 'Student Name', value: student.name },
            { label: 'Academic Level & Class', value: `${student.academic_level} (${student.current_standard}-${student.current_section})` },
            { label: 'Boarding Category', value: student.boarding_category.replace('HOSTEL_', '') },
            { label: 'Sponsorship Status', value: student.is_sponsored ? `Sponsored (${student.sponsor_name || 'Govt'})` : 'Self-Paid' },
            { label: 'Payment Date', value: paymentDate },
            { label: 'Payment Method', value: paymentMethod },
            { label: 'Terms Paid', value: selectedTerms.join(', ') },
            { label: 'Expected Term Amount', value: `₹${expectedTotal.toLocaleString('en-IN')}` },
            { label: 'Total Amount Recorded / Paid', value: `₹${numAmountPaid.toLocaleString('en-IN')}` },
            { label: 'Mismatch / Excess Amount', value: isExcess ? `+₹${mismatchAmount.toLocaleString('en-IN')} (OVERPAID / EXCESS)` : isDeficit ? `-₹${Math.abs(mismatchAmount).toLocaleString('en-IN')} (DEFICIT / UNDERPAID)` : '₹0 (Exact Amount)' },
            { label: 'Amount to Return Sponsor', value: sponsorReturn > 0 ? `₹${sponsorReturn.toLocaleString('en-IN')} (Refund due to ${student.sponsor_name || 'Sponsor'})` : '₹0' },
            { label: 'Receipt Reference', value: receiptNo },
            { label: 'Remarks / Notes', value: remarks || 'Payment recorded in Canisius Secondary School fee register' },
          ],
        });
      }

      onPaymentRecorded();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to record fee payment.');
    } finally {
      setSaving(false);
    }
  };

  const allTermsPaid = paidTerms.length === 3;

  return (
    <div className="space-y-8 font-sans max-w-6xl mx-auto py-6 px-4 animate-fadeIn w-full">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between border-b-2 border-[var(--border-color)] pb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[var(--text-primary)] hover:opacity-80 font-bold transition bg-[var(--bg-card)] px-5 py-3 rounded-2xl border-2 border-[var(--border-color)] cursor-pointer shadow-sm"
          style={{ fontSize: '18px' }}
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Register</span>
        </button>

        <div className="text-right">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[var(--text-secondary)]">
            Canisius Secondary School Portal
          </span>
          <h2 className="text-3xl font-extrabold font-heading text-[var(--text-primary)]" style={{ fontSize: '32px' }}>
            Record Fee Payment
          </h2>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-300 text-red-800 p-5 rounded-2xl flex items-center gap-3 font-bold" style={{ fontSize: '18px' }}>
          <AlertCircle className="w-6 h-6 flex-shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {allTermsPaid && (
        <div className="bg-emerald-50 border-3 border-emerald-400 text-emerald-900 p-6 rounded-3xl flex items-center gap-4 font-bold text-xl shadow-sm">
          <CheckCircle2 className="w-8 h-8 text-emerald-700 flex-shrink-0" />
          <div>
            <div className="font-extrabold text-2xl">ALL TERMS FULLY PAID!</div>
            <p className="text-base text-emerald-800 font-medium">This student ({student.name}) has already completed payments for Term 1, Term 2, and Term 3 for the academic year 2026-2027.</p>
          </div>
        </div>
      )}

      {/* Main Grid: Left Form Controls, Right Enlarged Slip Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: FORM CONTROLS (7 Cols) */}
        <div className="lg:col-span-7 bg-[var(--bg-card)] border-3 border-[var(--border-color)] p-8 rounded-3xl shadow-md space-y-8">
          
          {/* Student Banner */}
          <div className="bg-[var(--bg-page)] border-2 border-[var(--border-color)] p-6 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Student Name & PayID</span>
              <h3 className="text-2xl font-extrabold text-[var(--text-primary)]">{student.name}</h3>
              <span className="text-sm font-mono font-bold text-[var(--accent-gold)] block mt-0.5">PayID: {student.pay_id}</span>
            </div>
            <div className="text-right">
              <span className="px-3.5 py-1.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-300 font-extrabold text-sm block">
                {student.academic_level} ({student.current_standard}-{student.current_section})
              </span>
              <span className="text-xs text-slate-600 font-extrabold block mt-1">
                Category: {student.boarding_category.replace('HOSTEL_', '')} (₹{termRate.toLocaleString()}/term)
              </span>
              {student.is_sponsored && (
                <span className="text-xs text-emerald-700 font-extrabold block mt-0.5">
                  Sponsor: {student.sponsor_name || 'Govt'}
                </span>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* 1. ENLARGED CALENDAR & DATE SELECTOR */}
            <div className="space-y-3">
              <label className="text-lg font-extrabold text-[var(--text-primary)] flex items-center gap-2" style={{ fontSize: '22px' }}>
                <Calendar className="w-6 h-6 text-indigo-600" />
                <span>Select Payment Date:</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full bg-[var(--bg-page)] border-3 border-indigo-500 rounded-2xl py-4 px-6 text-3xl font-mono font-extrabold text-[var(--text-primary)] focus:outline-none focus:ring-4 focus:ring-indigo-200 shadow-inner"
                  style={{ fontSize: '26px' }}
                  required
                />
              </div>
            </div>

            {/* 2. SELECT TERMS COVERED WITH DUPLICATE PAYMENT GUARD */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-lg font-extrabold text-[var(--text-primary)]" style={{ fontSize: '20px' }}>
                  Select Terms Covered:
                </label>
                <span className="text-sm font-mono text-[var(--text-secondary)] font-bold">Expected: ₹{expectedTotal.toLocaleString('en-IN')}</span>
              </div>

              {paidTerms.length > 0 && (
                <p className="text-xs font-extrabold text-amber-800 bg-amber-50 border border-amber-200 p-2.5 rounded-xl flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-600" />
                  <span>Terms marked as "Paid" have already been completed for this student and cannot be selected again.</span>
                </p>
              )}

              <div className="grid grid-cols-3 gap-4">
                {(['Term 1', 'Term 2', 'Term 3'] as const).map((term) => {
                  const isAlreadyPaid = paidTerms.includes(term);
                  const isChecked = selectedTerms.includes(term);
                  return (
                    <button
                      type="button"
                      key={term}
                      disabled={isAlreadyPaid}
                      onClick={() => handleTermToggle(term)}
                      className={`p-4 rounded-2xl border-3 text-center transition ${
                        isAlreadyPaid
                          ? 'bg-emerald-100 text-emerald-950 border-emerald-400 opacity-90 cursor-not-allowed font-extrabold shadow-inner'
                          : isChecked
                          ? 'bg-indigo-700 text-white border-indigo-900 shadow-md font-extrabold cursor-pointer'
                          : 'bg-[var(--bg-page)] text-[var(--text-primary)] border-[var(--border-color)] font-bold hover:bg-slate-100 cursor-pointer'
                      }`}
                      style={{ fontSize: '18px' }}
                    >
                      <div className="font-extrabold flex items-center justify-center gap-1.5">
                        <span>{term}</span>
                        {isAlreadyPaid && <CheckCircle2 className="w-4 h-4 text-emerald-700" />}
                      </div>
                      <div className="text-xs opacity-90 mt-1">
                        {isAlreadyPaid ? '✓ Paid (Done)' : `₹${termRate.toLocaleString('en-IN')}`}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Payment Method & Receipt Reference */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-base font-extrabold text-[var(--text-primary)]" style={{ fontSize: '18px' }}>
                  Payment Method:
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e: any) => setPaymentMethod(e.target.value)}
                  className="w-full bg-[var(--bg-page)] border-2 border-[var(--border-color)] rounded-2xl px-5 py-3.5 text-[var(--text-primary)] font-bold text-lg focus:outline-none focus:border-indigo-600 cursor-pointer"
                  style={{ fontSize: '18px' }}
                >
                  <option value="CASH">Cash Deposit</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="MOBILE_MONEY">Mobile Money</option>
                  <option value="CHEQUE">Cheque / Bank Draft</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-base font-extrabold text-[var(--text-primary)]" style={{ fontSize: '18px' }}>
                  Receipt / Ref Number:
                </label>
                <input
                  type="text"
                  value={receiptNo}
                  onChange={(e) => setReceiptNo(e.target.value)}
                  className="w-full bg-[var(--bg-page)] border-2 border-[var(--border-color)] rounded-2xl px-5 py-3.5 text-[var(--text-primary)] font-mono font-bold text-lg focus:outline-none focus:border-indigo-600"
                  style={{ fontSize: '18px' }}
                  required
                />
              </div>
            </div>

            {/* 4. OPEN TYPING TOTAL AMOUNT PAID WITH LIVE MISMATCH ALERTS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-base font-extrabold text-[var(--text-primary)]" style={{ fontSize: '18px' }}>
                  Total Amount Paid (₹) — <span className="text-indigo-600">Open Typing Allowed</span>:
                </label>
                <span className="text-xs font-bold text-[var(--text-secondary)]">Type any custom amount</span>
              </div>
              <input
                type="text"
                value={amountPaidStr}
                onChange={(e) => setAmountPaidStr(e.target.value)}
                placeholder="Enter paid amount..."
                className={`w-full bg-[var(--bg-page)] border-3 rounded-2xl px-6 py-4 text-3xl font-mono font-extrabold focus:outline-none focus:ring-4 shadow-inner ${
                  isExcess
                    ? 'border-amber-500 text-amber-900 focus:ring-amber-200'
                    : isDeficit
                    ? 'border-red-500 text-red-900 focus:ring-red-200'
                    : 'border-emerald-600 text-emerald-800 focus:ring-emerald-200'
                }`}
                style={{ fontSize: '26px' }}
                required
              />

              {/* LIVE MISMATCH / EXCESS FLAGGING BANNER */}
              {isExcess && (
                <div className="bg-amber-50 border-2 border-amber-300 p-4 rounded-2xl flex flex-col gap-2 font-bold text-amber-900">
                  <div className="flex items-center gap-2 text-base">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <span>EXCESS PAYMENT FLAGGED: +₹{mismatchAmount.toLocaleString('en-IN')} over expected term total (₹{expectedTotal.toLocaleString('en-IN')})</span>
                  </div>
                  {sponsorReturn > 0 && (
                    <div className="flex items-center gap-2 text-sm text-purple-900 bg-purple-50 p-3 rounded-xl border border-purple-200">
                      <ArrowDownLeft className="w-4 h-4 text-purple-600 flex-shrink-0" />
                      <span>SPONSOR REFUND FLAGGED: ₹{sponsorReturn.toLocaleString('en-IN')} will be marked to return to {student.sponsor_name || 'Sponsor'}.</span>
                    </div>
                  )}
                </div>
              )}

              {isDeficit && (
                <div className="bg-red-50 border-2 border-red-300 p-4 rounded-2xl flex items-center gap-2 font-bold text-red-900 text-base">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <span>UNDERPAYMENT FLAGGED: -₹{Math.abs(mismatchAmount).toLocaleString('en-IN')} below expected term total (₹{expectedTotal.toLocaleString('en-IN')})</span>
                </div>
              )}
            </div>

            {/* 5. Remarks */}
            <div className="space-y-2">
              <label className="text-base font-extrabold text-[var(--text-primary)]" style={{ fontSize: '18px' }}>
                Remarks / Audit Notes:
              </label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional payment notes, bank transaction ref, sponsor deposit details..."
                className="w-full bg-[var(--bg-page)] border-2 border-[var(--border-color)] rounded-2xl p-4 text-[var(--text-primary)] font-bold focus:outline-none focus:border-indigo-600"
                style={{ fontSize: '16px' }}
              />
            </div>

            {/* Submit Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-4 border-t-2 border-[var(--border-color)]">
              {/* Option 1: Record Payment Only (No auto-print) */}
              <button
                type="button"
                onClick={(e) => handleSubmit(e, false)}
                disabled={saving || allTermsPaid}
                className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold py-4 px-6 rounded-2xl shadow-lg transition flex items-center justify-center gap-3 cursor-pointer disabled:opacity-40"
                style={{ fontSize: '20px' }}
              >
                <CheckCircle2 className="w-6 h-6" />
                <span>{saving ? 'Recording Payment...' : allTermsPaid ? 'All Terms Paid (Completed)' : 'Record Payment'}</span>
              </button>

              {/* Option 2: Record Payment & Print Receipt Slip */}
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={saving || allTermsPaid}
                className="bg-[var(--accent-gold)] hover:opacity-90 text-slate-950 font-extrabold py-4 px-6 rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                style={{ fontSize: '18px' }}
                title="Save payment and open print dialog"
              >
                <Printer className="w-5 h-5" />
                <span>Record & Print Slip</span>
              </button>

              <button
                type="button"
                onClick={onBack}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-4 px-6 rounded-2xl cursor-pointer"
                style={{ fontSize: '18px' }}
              >
                Cancel
              </button>
            </div>

          </form>
        </div>

        {/* RIGHT COLUMN: ENLARGED PAYMENT SLIP PREVIEW (5 Cols) */}
        <div className="lg:col-span-5 bg-[var(--bg-card)] border-3 border-[var(--border-color)] p-8 rounded-3xl shadow-md flex flex-col justify-between space-y-6">
          <div>
            <div className="text-center border-b-3 border-dashed border-[var(--border-color)] pb-6 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-extrabold mx-auto mb-3">
                <CreditCard className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-extrabold font-heading text-[var(--text-primary)] uppercase tracking-wider">
                RECEIPT SLIP PREVIEW
              </h3>
              <span className="text-xs text-[var(--text-secondary)] font-bold block mt-1">
                CANISIUS SECONDARY SCHOOL • Master Fee Register
              </span>
            </div>

            {/* Slip Details Table */}
            <div className="space-y-3 font-mono text-base font-bold">
              <div className="flex justify-between py-2 border-b border-[var(--border-color)]">
                <span className="text-[var(--text-secondary)] font-sans">Receipt Ref:</span>
                <span className="text-indigo-600 font-extrabold">{receiptNo}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--border-color)]">
                <span className="text-[var(--text-secondary)] font-sans">Payment Date:</span>
                <span className="text-lg font-extrabold text-slate-900">{paymentDate}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--border-color)]">
                <span className="text-[var(--text-secondary)] font-sans">Student PayID:</span>
                <span className="text-[var(--accent-gold)]">{student.pay_id}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--border-color)]">
                <span className="text-[var(--text-secondary)] font-sans">Student Name:</span>
                <span className="font-sans text-slate-900 font-extrabold">{student.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--border-color)]">
                <span className="text-[var(--text-secondary)] font-sans">Class Level:</span>
                <span>{student.academic_level} ({student.current_standard}-{student.current_section})</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--border-color)]">
                <span className="text-[var(--text-secondary)] font-sans">Terms Paid:</span>
                <span className="text-indigo-700">{selectedTerms.join(', ') || 'None selected'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--border-color)]">
                <span className="text-[var(--text-secondary)] font-sans">Expected Fee:</span>
                <span>₹{expectedTotal.toLocaleString('en-IN')}</span>
              </div>

              {/* Excess / Mismatch Line Item */}
              {mismatchAmount !== 0 && (
                <div className="flex justify-between py-2 border-b border-[var(--border-color)]">
                  <span className="text-[var(--text-secondary)] font-sans">Mismatch / Excess:</span>
                  <span className={isExcess ? 'text-amber-700 font-extrabold' : 'text-red-700 font-extrabold'}>
                    {isExcess ? `+₹${mismatchAmount.toLocaleString('en-IN')}` : `-₹${Math.abs(mismatchAmount).toLocaleString('en-IN')}`}
                  </span>
                </div>
              )}

              {sponsorReturn > 0 && (
                <div className="flex justify-between py-2 border-b border-[var(--border-color)]">
                  <span className="text-[var(--text-secondary)] font-sans">Sponsor Refund:</span>
                  <span className="text-purple-700 font-extrabold">₹{sponsorReturn.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="bg-emerald-50 border-2 border-emerald-300 p-4 rounded-2xl flex items-center justify-between mt-4">
                <span className="text-sm font-sans font-extrabold text-emerald-900 uppercase">Total Amount Paid</span>
                <span className="text-3xl font-extrabold text-emerald-800">₹{numAmountPaid.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-100 p-4 rounded-2xl border border-slate-300 text-xs font-bold text-slate-600 flex items-center gap-3 mt-4">
            <ShieldCheck className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            <span>This payment will be recorded in the offline SQLite database and appended to official school financial ledgers.</span>
          </div>

        </div>

      </div>
    </div>
  );
};

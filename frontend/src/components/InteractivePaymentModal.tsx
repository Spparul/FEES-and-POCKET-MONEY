import React, { useState, useEffect } from 'react';
import type { Student } from '../api';
import { formatStandard } from '../utils/formatters';
import { AlertTriangle, X, Calculator, Shield } from 'lucide-react';

interface InteractivePaymentModalProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface PreviewData {
  student_id: number;
  pay_id: string;
  student_name: string;
  is_sponsored: boolean;
  sponsor_name?: string;
  amount_received: number;
  existing_deficit_total: number;
  existing_deficit_cleared: number;
  existing_deficit_items: Array<{
    deficit_id: number;
    term_name: string;
    original_deficit: number;
    cleared_amount: number;
    remaining_deficit: number;
  }>;
  amount_left_for_terms: number;
  term_allocations: Array<{
    term_name: string;
    is_selected: boolean;
    expected_fee: number;
    already_paid: number;
    needed_for_term: number;
    allocated_amount: number;
    calculated_deficit: number;
    status: string;
  }>;
  total_fees_allocated: number;
  total_new_deficits: number;
  remaining_excess: number;
  excess_status?: string;
}

export const InteractivePaymentModal: React.FC<InteractivePaymentModalProps> = ({
  student,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [amountReceivedStr, setAmountReceivedStr] = useState<string>('2800');
  const [selectedTerms, setSelectedTerms] = useState<string[]>(['Term 1']);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [receiptNo, setReceiptNo] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  
  const [excessAction, setExcessAction] = useState<string>('');
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const numAmount = parseFloat(amountReceivedStr) || 0;

  // Fetch preview whenever amount or term selections change
  useEffect(() => {
    if (!isOpen) return;
    setExcessAction('');

    const fetchPreview = async () => {
      setLoadingPreview(true);
      try {
        const res = await fetch('/api/fees/payments/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: student.id,
            amount_received: numAmount,
            selected_term_names: selectedTerms,
            academic_year: '2026-2027',
          }),
        });

        if (!res.ok) {
          throw new Error('Failed to fetch allocation preview');
        }

        const data = await res.json();
        setPreview(data);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoadingPreview(false);
      }
    };

    const timer = setTimeout(fetchPreview, 150);
    return () => clearTimeout(timer);
  }, [isOpen, student.id, numAmount, selectedTerms]);

  if (!isOpen) return null;

  const toggleTerm = (termName: string) => {
    if (selectedTerms.includes(termName)) {
      setSelectedTerms(selectedTerms.filter((t) => t !== termName));
    } else {
      setSelectedTerms([...selectedTerms, termName]);
    }
  };

  const handleFinalSubmit = async () => {
    if (preview && preview.remaining_excess > 0 && !excessAction) {
      setError('You must select what to do with the excess amount before confirming.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/fees/payments/interactive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: student.id,
          amount_received: numAmount,
          selected_term_names: selectedTerms,
          payment_date: paymentDate,
          payment_method: paymentMethod,
          receipt_no: receiptNo || undefined,
          remarks: remarks || undefined,
          academic_year: '2026-2027',
          excess_action: excessAction || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to record fee payment');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error processing payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-[var(--bg-table-head)] border-b border-[var(--border-color)] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2">
              <Calculator size={16} className="text-[var(--accent-gold)]" />
              INTERACTIVE FEE PAYMENT RECORDING
            </h2>
            <p className="text-[11px] text-[var(--text-secondary)] font-semibold mt-0.5">
              Select target terms interactively. System calculates exact allocation in real time.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs font-sans">
          
          {/* Student Identity Banner */}
          <div className="p-3 rounded-lg bg-[var(--bg-page)] border border-[var(--border-color)] flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="text-sm font-extrabold text-[var(--text-primary)]">{student.name}</div>
              <div className="text-[11px] text-[var(--text-secondary)] font-semibold mt-0.5">
                PayID: <strong className="font-mono text-[var(--text-primary)]">{student.pay_id}</strong> • Class: <strong>{formatStandard(student.current_standard)} ({student.current_section || '—'})</strong> • Category: <strong>{student.boarding_category === 'DAY_SCHOLAR' ? 'Day Scholar' : student.boarding_category === 'HOSTEL_SPECIAL' ? 'Special Boarder' : 'Ordinary Boarder'}</strong>
              </div>
            </div>
            {student.is_sponsored && (
              <span className="px-2.5 py-1 rounded bg-green-100 border border-green-300 text-green-900 font-extrabold text-[10px]">
                SPONSORED: {student.sponsor_name || 'Govt Sponsor'}
              </span>
            )}
          </div>

          {/* Alert if Student Has Existing Deficit */}
          {preview && preview.existing_deficit_total > 0 && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-900 flex items-start gap-2">
              <AlertTriangle size={16} className="shrink-0 text-amber-700 mt-0.5" />
              <div>
                <div className="font-extrabold text-xs">EXISTING OUTSTANDING DEFICIT DETECTED: K {Math.round(preview.existing_deficit_total).toLocaleString('en-IN')}</div>
                <div className="text-[11px] mt-0.5 font-medium">
                  Incoming payment will automatically clear old deficits first (K {Math.round(preview.existing_deficit_cleared).toLocaleString('en-IN')} cleared) before allocating remaining funds (K {Math.round(preview.amount_left_for_terms).toLocaleString('en-IN')}) to selected terms.
                </div>
              </div>
            </div>
          )}

          {/* Form Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase mb-1">
                Exact Amount Received (K) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-[var(--text-secondary)] text-xs">K</span>
                <input
                  type="number"
                  value={amountReceivedStr}
                  onChange={(e) => setAmountReceivedStr(e.target.value)}
                  placeholder="e.g. 6000"
                  className="w-full bg-[var(--bg-page)] border border-[var(--border-color)] rounded-lg pl-7 pr-3 py-1.5 font-mono font-extrabold text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase mb-1">
                Payment Date
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full bg-[var(--bg-page)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 font-bold text-xs text-[var(--text-primary)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase mb-1">
                Payment Method / Channel
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="select-field w-full text-xs py-1.5 px-3 font-bold"
              >
                <option value="CASH">Cash Deposit</option>
                <option value="BANK_TRANSFER">Direct Bank Transfer</option>
                <option value="CHEQUE">Cheque</option>
                <option value="SPONSOR_DIRECT">Sponsor Direct Disbursement</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase mb-1">
                Receipt Ref / Deposit Slip No
              </label>
              <input
                type="text"
                value={receiptNo}
                onChange={(e) => setReceiptNo(e.target.value)}
                placeholder="Auto-generated if blank"
                className="input-field w-full text-xs py-1.5 px-3 font-mono font-bold"
              />
            </div>
          </div>

          {/* INTERACTIVE TERM SELECTOR BUTTONS */}
          <div>
            <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase mb-1.5 flex items-center justify-between">
              <span>SELECT TERMS TO APPLY PAYMENT (NO AUTO-TERM ASSUMPTION)</span>
              <span className="text-[10px] text-[var(--text-secondary)] font-mono lowercase">click terms to toggle</span>
            </label>

            <div className="grid grid-cols-3 gap-2">
              {['Term 1', 'Term 2', 'Term 3'].map((termName) => {
                const isSelected = selectedTerms.includes(termName);
                const termAlloc = preview?.term_allocations.find((t) => t.term_name === termName);

                return (
                  <button
                    key={termName}
                    type="button"
                    onClick={() => toggleTerm(termName)}
                    className={`p-3 rounded-lg border text-left transition flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--bg-table-head)] border-[var(--accent-gold)] ring-1 ring-[var(--accent-gold)] text-[var(--text-primary)] shadow-xs'
                        : 'bg-[var(--bg-page)] border-[var(--border-color)] opacity-70 hover:opacity-100 text-[var(--text-secondary)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs">{termName}</span>
                      <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-bold ${
                        isSelected ? 'bg-[var(--accent-gold)] text-white border-[var(--accent-gold)]' : 'border-[var(--border-color)]'
                      }`}>
                        {isSelected ? '✓' : ''}
                      </span>
                    </div>

                    <div className="mt-2 font-mono text-[11px] font-bold">
                      {termAlloc ? (
                        <>
                          <div className="text-[var(--text-primary)]">Allocated: K {Math.round(termAlloc.allocated_amount).toLocaleString('en-IN')}</div>
                          {termAlloc.calculated_deficit > 0 && (
                            <div className="text-amber-800 text-[10px]">Deficit: K {Math.round(termAlloc.calculated_deficit).toLocaleString('en-IN')}</div>
                          )}
                        </>
                      ) : (
                        <div className="text-[var(--text-secondary)]">Required: K 2,800</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Remarks */}
          <div>
            <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase mb-1">
              Payment Remarks / Notes
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Bank slip #984210, Paid by Father"
              className="input-field w-full text-xs py-1.5 px-3 font-medium"
            />
          </div>

          {/* REAL-TIME LIVE ALLOCATION PREVIEW PANEL */}
          {preview && (
            <div className="p-3.5 rounded-lg bg-[var(--bg-page)] border border-[var(--border-color)] space-y-2 font-mono text-xs relative">
              {loadingPreview && (
                <div className="absolute right-3 top-3 text-[10px] text-[var(--accent-gold)] font-bold animate-pulse">
                  Recalculating...
                </div>
              )}
              <div className="text-[11px] font-extrabold uppercase text-[var(--text-secondary)] tracking-wider border-b border-[var(--border-color)] pb-1">
                LIVE ALLOCATION BREAKDOWN (NO NETTING)
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">Payment Received:</span>
                <span className="font-extrabold text-[var(--text-primary)]">K {Math.round(preview.amount_received).toLocaleString('en-IN')}</span>
              </div>

              {preview.existing_deficit_cleared > 0 && (
                <div className="flex items-center justify-between text-amber-800 font-bold">
                  <span>Existing Deficit Cleared:</span>
                  <span>- K {Math.round(preview.existing_deficit_cleared).toLocaleString('en-IN')}</span>
                </div>
              )}

              {preview.term_allocations.filter((t) => t.is_selected).map((t) => (
                <div key={t.term_name} className="flex items-center justify-between pl-3 border-l-2 border-[var(--accent-gold)]">
                  <span className="text-[var(--text-primary)] font-bold">{t.term_name} Allocated:</span>
                  <span className="font-extrabold text-[var(--pill-paid-text)]">K {Math.round(t.allocated_amount).toLocaleString('en-IN')}</span>
                </div>
              ))}

              <div className="flex items-center justify-between border-t border-[var(--border-color)] pt-1.5 font-extrabold">
                <span>Total Fees Allocated:</span>
                <span className="text-[var(--text-primary)]">K {Math.round(preview.total_fees_allocated).toLocaleString('en-IN')}</span>
              </div>

              {preview.remaining_excess > 0 && (
                <div className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-900 font-extrabold mt-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span>UNALLOCATED EXCESS:</span>
                      <div className="text-[10px] font-semibold text-amber-800">
                        Admin must decide allocation below
                      </div>
                    </div>
                    <span className="text-sm">K {Math.round(preview.remaining_excess).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}

              {preview.total_new_deficits > 0 && (
                <div className="flex items-center justify-between p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-900 font-extrabold mt-1">
                  <div>
                    <span>CALCULATED FEE DEFICIT:</span>
                    <div className="text-[10px] font-semibold text-amber-800">
                      Status: OUTSTANDING
                    </div>
                  </div>
                  <span className="text-sm">K {Math.round(preview.total_new_deficits).toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>
          )}

          {/* EXCESS ACTION SELECTOR — shown only when there is remaining excess */}
          {preview && preview.remaining_excess > 0 && (
            <div className="p-3.5 rounded-lg bg-amber-50 border-2 border-amber-300 space-y-2">
              <div className="text-[11px] font-extrabold uppercase text-amber-900 tracking-wider">
                ADMINISTRATOR DECISION: What to do with excess K {Math.round(preview.remaining_excess).toLocaleString('en-IN')}?
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'TRANSFER_TO_POCKET_MONEY', label: 'Transfer to Pocket Money', desc: 'Credit to student pocket money held' },
                  { value: 'RETURN_TO_PARENT', label: 'Refund to Parent', desc: 'Return excess to parent/guardian' },
                  { value: 'RETURN_TO_SPONSOR', label: 'Refund to Sponsor', desc: 'Return excess to sponsor' },
                  { value: 'TAG_AS_EXCESS', label: 'Tag as Excess (Hold)', desc: 'Keep as unallocated excess on record' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setExcessAction(opt.value)}
                    className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
                      excessAction === opt.value
                        ? 'bg-amber-100 border-amber-500 ring-1 ring-amber-500 shadow-xs'
                        : 'bg-white border-amber-200 hover:border-amber-400'
                    }`}
                  >
                    <div className="font-extrabold text-[11px] text-amber-900">{opt.label}</div>
                    <div className="text-[10px] text-amber-700 font-medium mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
              {!excessAction && (
                <div className="text-[10px] text-red-700 font-bold mt-1">
                  * You must select an action before confirming payment.
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="p-2.5 rounded bg-red-100 border border-red-300 text-red-900 text-xs font-bold">
              {error}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-[var(--bg-table-head)] border-t border-[var(--border-color)] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-color)] font-bold text-xs hover:bg-[var(--bg-hover)] transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={() => setShowConfirmation(true)}
            disabled={numAmount <= 0 || selectedTerms.length === 0 || (!!preview && preview.remaining_excess > 0 && !excessAction)}
            className="px-4 py-1.5 rounded-lg bg-[var(--accent-gold)] text-white font-extrabold text-xs shadow-xs hover:brightness-105 transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            <span>Review & Confirm Allocation</span>
          </button>
        </div>

        {/* FINAL CONFIRMATION OVERLAY MODAL */}
        {showConfirmation && preview && (
          <div className="absolute inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fade">
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 max-w-md w-full space-y-4 text-xs font-sans shadow-2xl">
              <div className="text-sm font-extrabold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2 flex items-center gap-2">
                <Shield size={16} className="text-[var(--accent-gold)]" />
                CONFIRM FEE PAYMENT ALLOCATION
              </div>

              <div className="space-y-1.5 font-mono text-xs p-3 rounded bg-[var(--bg-page)] border border-[var(--border-color)]">
                <div className="flex justify-between"><span>Original Payment:</span><strong>K {Math.round(preview.amount_received).toLocaleString('en-IN')}</strong></div>
                {preview.existing_deficit_cleared > 0 && (
                  <div className="flex justify-between text-amber-800"><span>Deficit Cleared:</span><strong>- K {Math.round(preview.existing_deficit_cleared).toLocaleString('en-IN')}</strong></div>
                )}
                <div className="flex justify-between border-t border-[var(--border-color)] pt-1"><span>Selected Terms:</span><strong>{selectedTerms.join(', ')}</strong></div>
                <div className="flex justify-between"><span>Fees Allocated:</span><strong className="text-[var(--pill-paid-text)]">K {Math.round(preview.total_fees_allocated).toLocaleString('en-IN')}</strong></div>
                {preview.remaining_excess > 0 && (
                  <div className="border-t border-[var(--border-color)] pt-1 space-y-0.5">
                    <div className="flex justify-between text-amber-800"><span>Remaining Excess:</span><strong>K {Math.round(preview.remaining_excess).toLocaleString('en-IN')}</strong></div>
                    <div className="flex justify-between text-amber-900"><span>Decision:</span><strong>{excessAction.replace(/_/g, ' ')}</strong></div>
                  </div>
                )}
                {preview.total_new_deficits > 0 && (
                  <div className="flex justify-between text-amber-900 border-t border-[var(--border-color)] pt-1"><span>New Fee Deficit:</span><strong>K {Math.round(preview.total_new_deficits).toLocaleString('en-IN')} (OUTSTANDING)</strong></div>
                )}
              </div>

              <div className="text-[11px] text-[var(--text-secondary)] font-semibold">
                Confirming will save payment record #{receiptNo || 'Auto'} preserving original received amount of K {Math.round(preview.amount_received).toLocaleString('en-IN')}.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowConfirmation(false)}
                  disabled={submitting}
                  className="px-3 py-1.5 rounded-lg bg-[var(--bg-page)] text-[var(--text-primary)] border border-[var(--border-color)] font-bold text-xs hover:bg-[var(--bg-hover)] transition cursor-pointer"
                >
                  Back to Edit
                </button>
                <button
                  onClick={handleFinalSubmit}
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-lg bg-[var(--accent-gold)] text-white font-extrabold text-xs hover:brightness-105 transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {submitting ? 'Saving...' : 'Finalize & Save Payment'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

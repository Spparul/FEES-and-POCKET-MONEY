import React, { useState, useEffect } from 'react';
import type { Student } from '../api';
import { formatStandard } from '../utils/formatters';
import { Search, Calculator, ShieldCheck, AlertTriangle, Wallet, Lock, CheckCircle2, RefreshCw, X, ArrowRight } from 'lucide-react';

interface TermAllocItem {
  term_name: string;
  is_selected: boolean;
  is_locked: boolean;
  lock_reason?: string;
  expected_fee: number;
  previously_paid?: number;    // Rule 11: historical allocations only
  cleared_from_deficit?: number; // Rule 11: from current payment's deficit clearance
  already_paid: number;        // backward compat (same as previously_paid)
  needed_for_term: number;     // current outstanding before this payment's term alloc
  allocated_amount: number;    // current payment's term allocation
  calculated_deficit: number;  // new deficit after this payment
  total_paid_after?: number;   // Rule 11: hist + deficit_clr + allocated
  current_outstanding?: number; // Rule 11: remaining after this payment
  status: string;
}

interface PreviewResponse {
  student_id: number;
  pay_id: string;
  student_name: string;
  is_sponsored: boolean;
  sponsor_name?: string;
  amount_received: number;
  existing_deficit_total: number;
  existing_deficit_cleared: number;
  amount_left_for_terms: number;
  term_allocations: TermAllocItem[];
  total_fees_allocated: number;
  total_new_deficits: number;
  remaining_excess: number;
  excess_status?: string;
}

interface QuickSearchViewProps {
  initialStudent?: Student | null;
  onSelectStudentProfile?: (studentId: number) => void;
}

export const QuickSearchView: React.FC<QuickSearchViewProps> = ({ initialStudent, onSelectStudentProfile }) => {
  const [searchQuery, setSearchQuery] = useState<string>(initialStudent ? initialStudent.name : '');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [searching, setSearching] = useState<boolean>(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(initialStudent || null);

  // Payment Form State
  const [amountStr, setAmountStr] = useState<string>('');
  const [selectedTerms, setSelectedTerms] = useState<string[]>(['Term 1']);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [receiptNo, setReceiptNo] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [excessAction, setExcessAction] = useState<string | null>(null);

  // Preview & Confirmation State
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Search Students API call
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/students?search=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.slice(0, 8));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const numAmount = parseFloat(amountStr) || 0;

  // Real-time Preview API call whenever amount or term selection changes
  useEffect(() => {
    if (!selectedStudent) {
      setPreview(null);
      return;
    }

    const fetchPreview = async () => {
      setLoadingPreview(true);
      try {
        const res = await fetch('/fees/payments/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: selectedStudent.id,
            amount_received: numAmount,
            selected_term_names: selectedTerms,
            academic_year: '2026-2027',
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setPreview(data);
        }
      } catch (err) {
        console.error("Preview fetch error:", err);
      } finally {
        setLoadingPreview(false);
      }
    };

    const timer = setTimeout(fetchPreview, 150);
    return () => clearTimeout(timer);
  }, [selectedStudent, numAmount, selectedTerms]);

  const toggleTermSelection = (termName: string, isLocked: boolean) => {
    if (isLocked) return;
    if (selectedTerms.includes(termName)) {
      setSelectedTerms(selectedTerms.filter((t) => t !== termName));
    } else {
      setSelectedTerms([...selectedTerms, termName]);
    }
  };

  const handleFinalConfirm = async () => {
    if (!selectedStudent) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/fees/payments/interactive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: selectedStudent.id,
          amount_received: numAmount,
          selected_term_names: selectedTerms,
          payment_date: paymentDate,
          payment_method: paymentMethod,
          receipt_no: receiptNo || undefined,
          remarks: remarks || undefined,
          excess_action: excessAction || undefined,
          academic_year: '2026-2027',
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to record fee payment');
      }

      const resData = await res.json();
      setSuccessMessage(`Fee Payment #${resData.payment_no} successfully recorded!`);
      setShowReviewModal(false);
      
      // Reset form after short delay
      setTimeout(() => {
        setAmountStr('');
        setSelectedTerms(['Term 1']);
        setRemarks('');
        setReceiptNo('');
        setExcessAction(null);
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Error executing payment recording');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fade font-sans">
      
      {/* Header Banner */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-[var(--text-primary)] flex items-center gap-2">
            <Calculator size={18} className="text-[var(--accent-gold)]" />
            QUICK SEARCH & FEE PAYMENT ALLOCATION
          </h2>
          <p className="text-xs text-[var(--text-secondary)] font-semibold mt-0.5">
            Rapid student lookup, interactive term selection, sequential unlocking, and atomic excess handling.
          </p>
        </div>
      </div>

      {/* 1. STUDENT SEARCH BAR */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 shadow-sm space-y-3 relative">
        <label className="block text-xs font-extrabold uppercase text-[var(--text-secondary)] tracking-wider">
          Search Student (By PayID, Name, or Pupil ID)
        </label>
        
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none z-10 opacity-70" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type PayID (e.g. 12011/23) or Student Name..."
            style={{ paddingLeft: '44px' }}
            className="w-full bg-[var(--bg-page)] border border-[var(--border-color)] rounded-lg pr-4 py-2.5 font-bold text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
          />
          {searching && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--accent-gold)] font-mono font-bold animate-pulse">
              Searching...
            </span>
          )}
        </div>

        {/* Live Search Results Dropdown */}
        {searchResults.length > 0 && !selectedStudent && (
          <div className="absolute left-4 right-4 top-full z-30 mt-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-2xl overflow-hidden divide-y divide-[var(--border-color)] max-h-60 overflow-y-auto">
            {searchResults.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSelectedStudent(s);
                  setSearchResults([]);
                  setSearchQuery(s.name);
                }}
                className="w-full text-left p-3 hover:bg-[var(--bg-hover)] transition flex items-center justify-between cursor-pointer"
              >
                <div>
                  <div className="font-extrabold text-xs text-[var(--text-primary)]">{s.name}</div>
                  <div className="text-[11px] text-[var(--text-secondary)] font-mono">
                    PayID: {s.pay_id} • Class: {formatStandard(s.current_standard)} ({s.current_section || '—'})
                  </div>
                </div>
                {s.is_sponsored && (
                  <span className="px-2 py-0.5 rounded bg-green-100 text-green-900 border border-green-300 text-[10px] font-extrabold">
                    {s.sponsor_name || 'Sponsored'}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. SELECTED STUDENT COMPACT CARD */}
      {selectedStudent && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 shadow-sm space-y-4">
          
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[var(--border-color)] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-[var(--text-primary)]">{selectedStudent.name}</h3>
                <button
                  onClick={() => {
                    setSelectedStudent(null);
                    setSearchQuery('');
                    setPreview(null);
                  }}
                  className="text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline font-bold cursor-pointer"
                >
                  Change Student
                </button>
                {onSelectStudentProfile && (
                  <button
                    onClick={() => onSelectStudentProfile(selectedStudent.id)}
                    className="text-[10px] text-[var(--accent-gold)] hover:underline font-bold cursor-pointer ml-2"
                  >
                    View Full Profile →
                  </button>
                )}
              </div>
              <div className="text-xs text-[var(--text-secondary)] font-semibold mt-0.5">
                PayID: <strong className="font-mono text-[var(--text-primary)]">{selectedStudent.pay_id}</strong> • Class: <strong>{formatStandard(selectedStudent.current_standard)} ({selectedStudent.current_section || '—'})</strong> • Category: <strong>{selectedStudent.boarding_category === 'DAY_SCHOLAR' ? 'Day Scholar' : selectedStudent.boarding_category === 'HOSTEL_SPECIAL' ? 'Special Boarder' : 'Ordinary Boarder'}</strong>
              </div>
            </div>

            {selectedStudent.is_sponsored && (
              <span className="px-3 py-1 rounded-lg bg-green-100 border border-green-300 text-green-900 font-extrabold text-xs">
                SPONSORED: {selectedStudent.sponsor_name || 'Govt Sponsor'}
              </span>
            )}
          </div>

          {/* Alert if Student Has Existing Deficit */}
          {preview && preview.existing_deficit_total > 0 && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-900 flex items-start gap-2">
              <AlertTriangle size={16} className="shrink-0 text-amber-700 mt-0.5" />
              <div className="text-xs">
                <div className="font-extrabold">EXISTING OUTSTANDING DEFICIT: K {Math.round(preview.existing_deficit_total).toLocaleString('en-IN')}</div>
                <div className="text-[11px] mt-0.5">
                  Incoming payment will clear old deficits first (K {Math.round(preview.existing_deficit_cleared).toLocaleString('en-IN')} cleared) before allocating remaining K {Math.round(preview.amount_left_for_terms).toLocaleString('en-IN')} to selected terms.
                </div>
              </div>
            </div>
          )}

          {/* 3. ENTER PAYMENT AMOUNT & METADATA */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase mb-1">
                Exact Amount Received (K) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-[var(--text-secondary)] text-xs">K</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={amountStr}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                      setAmountStr(val);
                    }
                  }}
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  placeholder="e.g. 6000"
                  className="w-full bg-[var(--bg-page)] border border-[var(--border-color)] rounded-lg pl-7 pr-3 py-2 font-mono font-extrabold text-base text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
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
                className="w-full bg-[var(--bg-page)] border border-[var(--border-color)] rounded-lg px-3 py-2 font-bold text-xs text-[var(--text-primary)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="select-field w-full text-xs py-2 px-3 font-bold"
              >
                <option value="CASH">Cash Deposit</option>
                <option value="BANK_TRANSFER">Direct Bank Transfer</option>
                <option value="CHEQUE">Cheque</option>
                <option value="SPONSOR_DIRECT">Sponsor Direct Disbursement</option>
              </select>
            </div>
          </div>

          {/* 4. SEQUENTIAL TERM SELECTION BUTTONS */}
          <div>
            <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase mb-2 flex items-center justify-between">
              <span>SELECTABLE FEE TERMS (SEQUENTIAL PAYMENT UNLOCKING RULE ENFORCED)</span>
              <span className="text-[10px] text-[var(--text-secondary)] font-mono lowercase">Term 1 must be satisfied before Term 2 unlocks</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {['Term 1', 'Term 2', 'Term 3'].map((termName) => {
                const termAlloc = preview?.term_allocations.find((t) => t.term_name === termName);
                const isSelected = selectedTerms.includes(termName);
                const isLocked = termAlloc?.is_locked || false;
                const isFullyPaid = (termAlloc?.already_paid || 0) >= (termAlloc?.expected_fee || 2800);
                const isPartiallyPaid = (termAlloc?.already_paid || 0) > 0 && !isFullyPaid;

                return (
                  <button
                    key={termName}
                    type="button"
                    disabled={isLocked}
                    onClick={() => toggleTermSelection(termName, isLocked)}
                    className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                      isFullyPaid
                        ? 'bg-emerald-500/10 border-emerald-500/30 opacity-85 cursor-not-allowed'
                        : isLocked
                        ? 'bg-[var(--bg-page)] border-[var(--border-color)] opacity-50 cursor-not-allowed'
                        : isSelected
                        ? 'bg-[var(--bg-table-head)] border-[var(--accent-gold)] ring-2 ring-[var(--accent-gold)] text-[var(--text-primary)] shadow-md'
                        : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[var(--accent-gold)] text-[var(--text-secondary)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm flex items-center gap-1.5">
                        {termName}
                        {isPartiallyPaid && (
                          <span className="text-[9px] bg-amber-100 text-amber-900 border border-amber-300 font-extrabold px-1.5 py-0.5 rounded">
                            PARTIAL
                          </span>
                        )}
                      </span>

                      {isFullyPaid ? (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-900 font-extrabold bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                          <CheckCircle2 size={11} className="text-emerald-700" /> FULLY PAID
                        </span>
                      ) : isLocked ? (
                        <span className="flex items-center gap-1 text-[10px] text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded">
                          <Lock size={11} /> Locked
                        </span>
                      ) : (
                        <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold ${
                          isSelected ? 'bg-[var(--accent-gold)] text-white border-[var(--accent-gold)]' : 'border-[var(--border-color)]'
                        }`}>
                          {isSelected ? '✓' : ''}
                        </span>
                      )}
                    </div>

                    {/* Rules 11, 33: 5-field per-term breakdown */}
                    <div className="mt-3 font-mono text-[11px] space-y-0.5">
                      {termAlloc ? (
                        <>
                          <div className="flex justify-between text-[var(--text-secondary)]">
                            <span>Term Fee:</span>
                            <span className="font-bold">K {Math.round(termAlloc.expected_fee).toLocaleString('en-IN')}</span>
                          </div>

                          {(termAlloc.previously_paid ?? termAlloc.already_paid ?? 0) > 0 && (
                            <div className="flex justify-between text-slate-500">
                              <span>Previously Paid:</span>
                              <span className="font-bold">K {Math.round(termAlloc.previously_paid ?? termAlloc.already_paid ?? 0).toLocaleString('en-IN')}</span>
                            </div>
                          )}

                          {(termAlloc.cleared_from_deficit ?? 0) > 0 && (
                            <div className="flex justify-between text-indigo-700">
                              <span>Deficit Cleared:</span>
                              <span className="font-bold">K {Math.round(termAlloc.cleared_from_deficit ?? 0).toLocaleString('en-IN')}</span>
                            </div>
                          )}

                          {termAlloc.allocated_amount > 0 && (
                            <div className="flex justify-between text-[var(--pill-paid-text)] font-extrabold">
                              <span>Allocating Now:</span>
                              <span>K {Math.round(termAlloc.allocated_amount).toLocaleString('en-IN')}</span>
                            </div>
                          )}

                          {termAlloc.needed_for_term > 0 && (
                            <div className={`flex justify-between font-extrabold ${
                              termAlloc.calculated_deficit > 0 ? 'text-amber-800' : 'text-slate-500'
                            }`}>
                              <span>{termAlloc.calculated_deficit > 0 ? 'New Deficit:' : 'Outstanding:'}</span>
                              <span>K {Math.round(
                                termAlloc.calculated_deficit > 0 ? termAlloc.calculated_deficit : termAlloc.needed_for_term
                              ).toLocaleString('en-IN')}</span>
                            </div>
                          )}

                          {isLocked && !isFullyPaid && (
                            <div className="text-[10px] text-amber-900 font-semibold mt-1">
                              {termAlloc.lock_reason}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-[var(--text-secondary)]">Fee: K 2,800</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. LIVE DISTRIBUTION SUMMARY PANEL */}
          {preview && (
            <div className="p-4 rounded-xl bg-[var(--bg-page)] border border-[var(--border-color)] space-y-2.5 font-mono text-xs relative">
              {loadingPreview && (
                <div className="absolute right-4 top-4 text-[11px] text-[var(--accent-gold)] font-bold animate-pulse flex items-center gap-1">
                  <RefreshCw size={12} className="animate-spin" /> Recalculating...
                </div>
              )}
              
              <div className="text-xs font-extrabold uppercase text-[var(--text-secondary)] tracking-wider border-b border-[var(--border-color)] pb-1.5 flex items-center gap-2">
                <Calculator size={14} className="text-[var(--accent-gold)]" />
                LIVE ALLOCATION BREAKDOWN (NO NETTING)
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">Payment Received:</span>
                <span className="font-extrabold text-[var(--text-primary)] text-sm">K {Math.round(preview.amount_received).toLocaleString('en-IN')}</span>
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

              {/* Rule 12: Show balance breakdown — no netting */}
              <div className="border-t border-[var(--border-color)] pt-2 space-y-1">
                <div className="flex items-center justify-between font-bold text-xs">
                  <span className="text-slate-500">Existing Outstanding Cleared:</span>
                  <span className="text-indigo-800">K {Math.round(preview.existing_deficit_cleared || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between font-bold text-xs">
                  <span className="text-slate-500">Current Term Allocations:</span>
                  <span className="text-emerald-800">K {Math.round((preview as any).term_fees_allocated || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between font-extrabold text-sm border-t border-[var(--border-color)] pt-1">
                  <span>FEES COLLECTED:</span>
                  <span className="text-[var(--text-primary)]">K {Math.round(preview.total_fees_allocated).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {preview.remaining_excess > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-900 font-extrabold mt-2">
                  <div>
                    <span className="text-xs">FEE EXCESS (Rule 13):</span>
                    <div className="text-[10px] font-semibold text-amber-800">
                      Administrator decision required below ↓
                    </div>
                  </div>
                  <span className="text-base font-extrabold text-amber-800">K {Math.round(preview.remaining_excess).toLocaleString('en-IN')}</span>
                </div>
              )}

              {preview.total_new_deficits > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-200 text-red-900 font-extrabold mt-2">
                  <div>
                    <span className="text-xs">FEE TO COLLECT (New Deficit):</span>
                    <div className="text-[10px] font-semibold text-red-800">
                      Recorded as OUTSTANDING — must be cleared in future payment
                    </div>
                  </div>
                  <span className="text-base font-extrabold">K {Math.round(preview.total_new_deficits).toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>
          )}

          {/* 6. REMAINING AMOUNT ACTION SELECTOR */}
          {preview && preview.remaining_excess > 0 && (
            <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--accent-gold)] space-y-3">
              <label className="block text-xs font-extrabold text-[var(--text-primary)] uppercase flex items-center gap-2">
                <Wallet size={15} className="text-[var(--accent-gold)]" />
                EXCESS ACTION: WHAT SHOULD HAPPEN TO REMAINING K {Math.round(preview.remaining_excess).toLocaleString('en-IN')}? *
              </label>

              {/* Rule 16: Exactly 4 administrator-defined excess actions. No automatic choice. */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold">
                {[
                  { action: 'EXCESS', label: 'TAG AS EXCESS', desc: 'Remain in Fee Excess ledger — no refund, no pocket money' },
                  { action: 'RETURN_TO_PARENT', label: 'RETURN TO PARENT', desc: 'Record excess for parent refund (Rule 18)' },
                  ...(selectedStudent.is_sponsored
                    ? [{ action: 'RETURN_TO_SPONSOR', label: 'RETURN TO SPONSOR', desc: `Refund to ${selectedStudent.sponsor_name || 'Sponsor'} (Rule 20)` }]
                    : []
                  ),
                  { action: 'TRANSFER_TO_POCKET_MONEY', label: 'TRANSFER TO POCKET MONEY', desc: 'Create actual Pocket Money transaction (Rule 22-23)' },
                ].map(({ action, label, desc }) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => setExcessAction(action)}
                    className={`p-3 rounded-lg border text-left transition flex items-center justify-between cursor-pointer ${
                      excessAction === action
                        ? 'bg-[var(--accent-gold)] text-white border-[var(--accent-gold)] font-extrabold shadow-sm'
                        : 'bg-[var(--bg-page)] border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                    }`}
                  >
                    <div>
                      <span>{label}</span>
                      <div className="text-[10px] opacity-80 font-normal">{desc}</div>
                    </div>
                    {excessAction === action && <span>✓</span>}
                  </button>
                ))}
              </div>

              {/* Warn if no action selected */}
              {!excessAction && (
                <div className="text-[11px] text-amber-800 font-bold bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  ⚠ Select one of the above actions before proceeding. Excess cannot be left unclassified (Rules 16, 31).
                </div>
              )}
            </div>
          )}

          {/* Payment Remarks Input */}
          <div>
            <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase mb-1">
              Payment Remarks / Deposit Slip Reference
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Cash deposit by father, slip #84912"
              className="input-field w-full text-xs py-1.5 px-3 font-medium"
            />
          </div>

          {successMessage && (
            <div className="p-3 rounded-lg bg-green-100 border border-green-300 text-green-900 text-xs font-extrabold flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-700" />
              <span>{successMessage}</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-100 border border-red-300 text-red-900 text-xs font-bold">
              {error}
            </div>
          )}

          {/* Submit Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--border-color)]">
            <button
              onClick={() => setShowReviewModal(true)}
              disabled={
                numAmount <= 0 ||
                selectedTerms.length === 0 ||
                // Rule 16: Review blocked if excess exists and no decision made
                ((preview?.remaining_excess ?? 0) > 0 && !excessAction)
              }
              className="px-5 py-2.5 rounded-xl bg-[var(--accent-gold)] text-white font-extrabold text-xs shadow-md hover:brightness-105 transition disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              <span>Review Complete Allocation</span>
              <ArrowRight size={15} />
            </button>
          </div>

        </div>
      )}

      {/* 7. QUICK SEARCH FINAL CONFIRMATION REVIEW MODAL */}
      {showReviewModal && preview && selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fade">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 max-w-md w-full space-y-4 text-xs font-sans shadow-2xl">
            <div className="text-sm font-extrabold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-[var(--accent-gold)]" />
                CONFIRM FEE ALLOCATION
              </span>
              <button onClick={() => setShowReviewModal(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <X size={16} />
              </button>
            </div>

            <div className="p-3.5 rounded-lg bg-[var(--bg-page)] border border-[var(--border-color)] space-y-2 font-mono text-xs">
              <div className="flex justify-between"><span>STUDENT:</span><strong>{selectedStudent.name} ({selectedStudent.pay_id})</strong></div>
              <div className="flex justify-between border-t border-[var(--border-color)] pt-1"><span>PAYMENT RECEIVED:</span><strong className="text-sm">K {Math.round(preview.amount_received).toLocaleString('en-IN')}</strong></div>
              
              {preview.existing_deficit_cleared > 0 && (
                <div className="flex justify-between text-amber-800 font-bold"><span>Existing Deficit Cleared:</span><span>- K {Math.round(preview.existing_deficit_cleared).toLocaleString('en-IN')}</span></div>
              )}

              {preview.term_allocations.filter((t) => t.is_selected).map((t) => (
                <div key={t.term_name} className="flex justify-between pl-2 border-l-2 border-[var(--accent-gold)]">
                  <span>{t.term_name}:</span>
                  <strong className="text-[var(--pill-paid-text)]">K {Math.round(t.allocated_amount).toLocaleString('en-IN')}</strong>
                </div>
              ))}

              <div className="flex justify-between border-t border-[var(--border-color)] pt-1.5 font-extrabold">
                <span>TOTAL PAYMENT ALLOCATED:</span>
                <span>K {Math.round(preview.total_fees_allocated).toLocaleString('en-IN')}</span>
              </div>

              {preview.remaining_excess > 0 && (
                <div className="flex justify-between text-emerald-900 border-t border-[var(--border-color)] pt-1 font-bold">
                  <span>EXCESS (K {Math.round(preview.remaining_excess).toLocaleString('en-IN')}):</span>
                  <span className="uppercase">{(excessAction || 'NOT SET').replace(/_/g, ' ')}</span>
                </div>
              )}
            </div>

            <div className="text-[11px] text-[var(--text-secondary)] font-semibold">
              Saving executes 1 atomic DB operation creating fee payment, allocations, deficits, and excess sync events.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-color)]">
              <button
                onClick={() => setShowReviewModal(false)}
                disabled={submitting}
                className="px-3.5 py-1.5 rounded-lg bg-[var(--bg-page)] text-[var(--text-primary)] border border-[var(--border-color)] font-bold text-xs hover:bg-[var(--bg-hover)] cursor-pointer"
              >
                Back to Edit
              </button>
              <button
                onClick={handleFinalConfirm}
                disabled={submitting}
                className="px-4 py-1.5 rounded-lg bg-[var(--accent-gold)] text-white font-extrabold text-xs hover:brightness-105 cursor-pointer flex items-center gap-1.5"
              >
                {submitting ? 'Saving Payment...' : 'Confirm & Save Transaction'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

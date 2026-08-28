import React, { useState, useEffect } from 'react';
import { Search, Wallet, ChevronLeft, ChevronRight, Filter, ShieldCheck, X } from 'lucide-react';

interface FeeExcessItem {
  id: number;
  student_id: number;
  pay_id: string;
  student_name: string;
  class_name: string;
  section: string;
  boarding_category: string;
  is_sponsored: boolean;
  sponsor_name?: string;
  original_payment_id: number;
  payment_no: string;
  amount_received: number;
  fees_allocated: number;
  excess_amount: number;
  status: string;
  decision?: string;
  approved_by?: string;
  transfer_id?: string;
  remarks?: string;
  created_at?: string;
}

export const FeeExcessesView: React.FC = () => {
  const [excesses, setExcesses] = useState<FeeExcessItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [classFilter, setClassFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Modal decision state
  const [selectedExcess, setSelectedExcess] = useState<FeeExcessItem | null>(null);
  const [chosenDecision, setChosenDecision] = useState<string>('TRANSFER_TO_POCKET_MONEY');
  const [approvedBy, setApprovedBy] = useState<string>('Administrator');
  const [decisionRemarks, setDecisionRemarks] = useState<string>('');
  const [submittingDecision, setSubmittingDecision] = useState<boolean>(false);
  const [decisionSuccess, setDecisionSuccess] = useState<string | null>(null);

  const fetchExcesses = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/excesses?status_filter=${statusFilter}&search=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setExcesses(data.excesses || []);
      }
    } catch (err) {
      console.error("Failed to fetch fee excesses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExcesses();
  }, [statusFilter, searchQuery]);

  const filtered = excesses.filter((e) => {
    if (!classFilter) return true;
    return e.class_name === classFilter;
  });

  const totalUnallocatedSum = filtered
    .filter((e) => e.status === 'UNALLOCATED' || e.status === 'PENDING_VERIFICATION')
    .reduce((sum, e) => sum + e.excess_amount, 0);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const pageData = filtered.slice(startIndex, startIndex + pageSize);

  const handleExecuteDecision = async () => {
    if (!selectedExcess) return;
    setSubmittingDecision(true);
    setDecisionSuccess(null);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/excesses/decide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          excess_id: selectedExcess.id,
          decision: chosenDecision,
          approved_by: approvedBy,
          remarks: decisionRemarks || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to record decision');
      }

      const resData = await res.json();
      setDecisionSuccess(`Decision executed successfully. ${resData.transfer_id ? `Transfer ID: ${resData.transfer_id}` : ''}`);
      setTimeout(() => {
        setSelectedExcess(null);
        setDecisionSuccess(null);
        fetchExcesses();
      }, 1200);
    } catch (err: any) {
      alert(err.message || 'Error processing decision');
    } finally {
      setSubmittingDecision(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade">
      
      {/* Header & Prominent Unallocated Metric Card */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-[var(--text-primary)] flex items-center gap-2">
            <Wallet size={18} className="text-[var(--accent-gold)]" />
            FEE EXCESS REGISTER & ALLOCATION DECISIONS
          </h2>
          <p className="text-xs text-[var(--text-secondary)] font-semibold mt-0.5">
            Audit ledger of unallocated payment excesses. Excesses start as UNALLOCATED until explicitly assigned.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-lg bg-[var(--bg-table-head)] border border-[var(--border-color)] font-mono flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">UNALLOCATED EXCESS:</span>
            <span className="text-sm font-extrabold text-[var(--pill-paid-text)]">K {Math.round(totalUnallocatedSum).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Filter Control Box */}
      <div className="filter-box p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center flex-wrap gap-2 flex-1">
          <Filter size={13} className="text-[var(--accent-gold)]" />
          <span className="font-extrabold text-[var(--text-secondary)] uppercase">FILTERS:</span>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="select-field text-xs h-7 py-0 px-2 font-bold"
          >
            <option value="ALL">All Fee Excesses</option>
            <option value="PENDING">Pending / Uncompleted</option>
            <option value="DONE">Completed / Dispatched</option>
            <option value="UNALLOCATED">Unallocated Only</option>
            <option value="TRANSFERRED_TO_POCKET_MONEY">Transferred to Pocket Money</option>
            <option value="RETURN_TO_PARENT">Returned to Parent</option>
            <option value="RETURN_TO_SPONSOR">Returned to Sponsor</option>
            <option value="COMPLETED">Closed / Completed</option>
          </select>

          {/* Quick Search */}
          <div className="relative flex-1 min-w-[180px] max-w-[240px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none z-10 opacity-70" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search PayID, Student Name..."
              style={{ paddingLeft: '38px' }}
              className="w-full bg-[var(--bg-page)] border border-[var(--border-color)] rounded pr-2.5 py-1 text-xs text-[var(--text-primary)] font-bold focus:outline-none"
            />
          </div>

          {/* Class Filter */}
          <select
            value={classFilter}
            onChange={(e) => {
              setClassFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="select-field text-xs h-7 py-0 px-2 font-bold"
          >
            <option value="">All Classes (Form 1 - 12)</option>
            <option value="Form 1">Form 1</option>
            <option value="Form 2">Form 2</option>
            <option value="Form 3">Form 3</option>
            <option value="11">11</option>
            <option value="12">12</option>
          </select>
        </div>
      </div>

      {/* EXCESSES TABLE (RECORD COUNTER ON TOP) */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg overflow-hidden shadow-sm w-full">
        
        {/* TOP RECORD COUNTER BAR */}
        <div className="px-3.5 py-2 bg-[var(--bg-table-head)] border-b border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-xs">
          <span className="text-[var(--text-secondary)] font-semibold">
            Showing <strong className="text-[var(--text-primary)]">{filtered.length > 0 ? startIndex + 1 : 0}</strong> to <strong className="text-[var(--text-primary)]">{Math.min(startIndex + pageSize, filtered.length)}</strong> of <strong className="text-[var(--text-primary)]">{filtered.length}</strong> excess records (Page {currentPage} of {totalPages})
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="px-2.5 py-0.5 rounded bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-color)] font-bold disabled:opacity-40 transition flex items-center gap-1 cursor-pointer text-xs"
            >
              <ChevronLeft size={13} />
              <span>Prev</span>
            </button>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="px-2.5 py-0.5 rounded bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-color)] font-bold disabled:opacity-40 transition flex items-center gap-1 cursor-pointer text-xs"
            >
              <span>Next</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-[var(--text-primary)] ledger-table text-xs">
            <thead className="bg-[var(--bg-table-head)] text-[var(--text-primary)] font-extrabold uppercase tracking-wider border-b border-[var(--border-color)]">
              <tr>
                <th className="py-2 px-3 font-mono font-bold border-r border-[var(--border-color)]" style={{ width: '13%' }}>PAY ID</th>
                <th className="py-2 px-3 font-extrabold border-r border-[var(--border-color)]" style={{ width: '23%' }}>STUDENT NAME</th>
                <th className="py-2 px-2 text-center font-bold border-r border-[var(--border-color)]" style={{ width: '7%' }}>CLASS</th>
                <th className="py-2 px-2 text-center font-bold border-r border-[var(--border-color)]" style={{ width: '5%' }}>SEC</th>
                <th className="py-2 px-3 font-mono font-bold border-r border-[var(--border-color)]" style={{ width: '13%' }}>PAYMENT REF</th>
                <th className="py-2 px-3 text-right font-bold border-r border-[var(--border-color)]" style={{ width: '11%' }}>RECEIVED</th>
                <th className="py-2 px-3 text-right font-bold border-r border-[var(--border-color)]" style={{ width: '11%' }}>ALLOCATED</th>
                <th className="py-2 px-3 text-right font-extrabold border-r border-[var(--border-color)]" style={{ width: '11%' }}>EXCESS</th>
                <th className="py-2 px-2 text-center font-bold border-r border-[var(--border-color)]" style={{ width: '10%' }}>STATUS</th>
                <th className="py-2 px-2 text-center font-bold" style={{ width: '8%' }}>ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)] font-medium text-xs">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-[var(--text-secondary)] font-bold">
                    Loading fee excess records...
                  </td>
                </tr>
              ) : pageData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-[var(--text-secondary)] font-bold">
                    No fee excesses found matching selected criteria.
                  </td>
                </tr>
              ) : (
                pageData.map((e) => (
                  <tr key={e.id} className="hover:bg-[var(--bg-hover)] transition">
                    <td className="py-2 px-3 font-mono font-bold text-[var(--text-secondary)] border-r border-[var(--border-color)]">
                      {e.pay_id}
                    </td>
                    <td className="py-2 px-3 border-r border-[var(--border-color)]">
                      <div className="font-extrabold text-[var(--text-primary)]">{e.student_name}</div>
                      {e.is_sponsored && (
                        <div className="text-[10px] text-green-800 font-bold">
                          {e.sponsor_name || 'Sponsored'}
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-2 text-center font-extrabold border-r border-[var(--border-color)] text-[var(--text-primary)]">
                      {e.class_name}
                    </td>
                    <td className="py-2 px-2 text-center font-bold border-r border-[var(--border-color)] text-[var(--text-primary)]">
                      {e.section || '—'}
                    </td>
                    <td className="py-2 px-3 font-mono font-bold border-r border-[var(--border-color)] text-[var(--text-secondary)]">
                      {e.payment_no}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold border-r border-[var(--border-color)] text-[var(--text-secondary)]">
                      K {Math.round(e.amount_received).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold border-r border-[var(--border-color)] text-[var(--pill-paid-text)]">
                      K {Math.round(e.fees_allocated).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-extrabold border-r border-[var(--border-color)] text-[var(--pill-paid-text)]">
                      K {Math.round(e.excess_amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2 px-2 text-center border-r border-[var(--border-color)]">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-extrabold uppercase border ${
                        e.status === 'EXCESS' || e.status === 'TAGGED_AS_EXCESS' || e.status === 'UNALLOCATED'
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : e.status === 'RETURN_TO_PARENT'
                          ? 'bg-purple-100 text-purple-900 border-purple-300'
                          : e.status === 'RETURN_TO_SPONSOR'
                          ? 'bg-amber-100 text-amber-950 border-amber-400'
                          : e.status === 'TRANSFERRED_TO_POCKET_MONEY' || e.status === 'APPROVED_FOR_POCKET_MONEY'
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : 'bg-green-100 text-green-800 border-green-300'
                      }`}>
                        {e.status === 'RETURN_TO_SPONSOR'
                          ? 'RETURN TO SPONSOR'
                          : e.status === 'RETURN_TO_PARENT'
                          ? 'RETURN TO PARENT'
                          : e.status === 'TRANSFERRED_TO_POCKET_MONEY' || e.status === 'APPROVED_FOR_POCKET_MONEY'
                          ? 'POCKET MONEY'
                          : e.status === 'EXCESS' || e.status === 'TAGGED_AS_EXCESS'
                          ? 'EXCESS'
                          : e.status}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <button
                        onClick={() => {
                          setSelectedExcess(e);
                          setChosenDecision(e.decision || (e.status === 'RETURN_TO_SPONSOR' ? 'RETURN_TO_SPONSOR' : 'EXCESS'));
                          setDecisionRemarks(e.remarks || '');
                        }}
                        className={`px-2 py-1 rounded font-extrabold text-[10px] transition cursor-pointer ${
                          e.status === 'UNALLOCATED' || e.status === 'PENDING_VERIFICATION' || e.status === 'EXCESS'
                            ? 'bg-[var(--accent-gold)] text-white hover:brightness-105 shadow-xs'
                            : 'bg-[var(--bg-table-head)] text-[var(--text-primary)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)]'
                        }`}
                      >
                        {e.status === 'UNALLOCATED' || e.status === 'PENDING_VERIFICATION' ? 'Decide' : 'Edit Decision'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EXPLICIT ALLOCATION DECISION MODAL */}
      {selectedExcess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 max-w-md w-full space-y-4 text-xs font-sans shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
              <h3 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2">
                <ShieldCheck size={16} className="text-[var(--accent-gold)]" />
                EXCESS ALLOCATION DECISION
              </h3>
              <button onClick={() => setSelectedExcess(null)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <X size={16} />
              </button>
            </div>

            <div className="p-3 rounded bg-[var(--bg-page)] border border-[var(--border-color)] space-y-1 font-mono text-xs">
              <div>Student: <strong>{selectedExcess.student_name} ({selectedExcess.pay_id})</strong></div>
              <div>Payment Ref: <strong>{selectedExcess.payment_no}</strong></div>
              <div>Fees Allocated: <strong>K {Math.round(selectedExcess.fees_allocated).toLocaleString('en-IN')}</strong></div>
              <div className="text-[var(--pill-paid-text)] font-extrabold text-sm border-t border-[var(--border-color)] pt-1 mt-1">
                Fee Excess Amount: K {Math.round(selectedExcess.excess_amount).toLocaleString('en-IN')}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase mb-1">
                Select Explicit Allocation Decision *
              </label>
              <select
                value={chosenDecision}
                onChange={(e) => setChosenDecision(e.target.value)}
                className="select-field w-full text-xs py-1.5 px-3 font-bold"
              >
                <option value="EXCESS">Tag as Excess (Remain in Fee Excess ledger)</option>
                <option value="TRANSFER_TO_POCKET_MONEY">Transfer to Student Pocket Money</option>
                <option value="RETURN_TO_SPONSOR">Return Excess to Sponsor (Refund to Sponsor)</option>
                <option value="RETURN_TO_PARENT">Return Excess to Parent</option>
                <option value="APPLY_TO_FUTURE_FEES">Use for Next Term (Apply to Future Fees)</option>
                <option value="COMPLETED">Completed / Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase mb-1">
                Administrator Name *
              </label>
              <input
                type="text"
                value={approvedBy}
                onChange={(e) => setApprovedBy(e.target.value)}
                className="input-field w-full text-xs py-1.5 px-3 font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase mb-1">
                Decision Remarks / Approval Reason
              </label>
              <textarea
                value={decisionRemarks}
                onChange={(e) => setDecisionRemarks(e.target.value)}
                placeholder="Enter approval details or sponsor communication notes..."
                className="input-field w-full text-xs py-1.5 px-3 font-medium h-16"
              />
            </div>

            {decisionSuccess && (
              <div className="p-2 rounded bg-green-100 border border-green-300 text-green-900 text-xs font-bold">
                {decisionSuccess}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-color)]">
              <button
                onClick={() => setSelectedExcess(null)}
                disabled={submittingDecision}
                className="px-3.5 py-1.5 rounded-lg bg-[var(--bg-page)] text-[var(--text-primary)] border border-[var(--border-color)] font-bold text-xs hover:bg-[var(--bg-hover)] cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleExecuteDecision}
                disabled={submittingDecision}
                className="px-4 py-1.5 rounded-lg bg-[var(--accent-gold)] text-white font-extrabold text-xs hover:brightness-105 cursor-pointer flex items-center gap-1.5"
              >
                {submittingDecision ? 'Executing...' : 'Confirm Decision & Dispatch'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

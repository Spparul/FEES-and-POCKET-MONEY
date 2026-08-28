import React, { useState } from 'react';
import type { PocketTransaction } from '../api';
import { printDataset } from '../utils/printHelper';
import { formatStandard } from '../utils/formatters';
import { Search, Printer, RotateCcw, Clock, ChevronLeft, ChevronRight, History } from 'lucide-react';

interface TransactionLedgerViewProps {
  transactions: PocketTransaction[];
  loading: boolean;
  totalHostellers: number;
  currentlyHeldBalance: number;
  onDeleteTransaction?: (id: number) => void;
}

export const TransactionLedgerView: React.FC<TransactionLedgerViewProps> = ({
  transactions,
  loading,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10; // strictly 10 records per page

  const filtered = transactions.filter((tx) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (tx.pay_id && tx.pay_id.toLowerCase().includes(q)) ||
      (tx.student_name && tx.student_name.toLowerCase().includes(q)) ||
      (tx.receipt_ref && tx.receipt_ref.toLowerCase().includes(q)) ||
      (tx.remarks && tx.remarks.toLowerCase().includes(q));

    const matchesType = !typeFilter || tx.transaction_type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const pageData = filtered.slice(startIndex, startIndex + pageSize);

  const handlePrintAuditReport = () => {
    printDataset({
      title: 'CANISIUS SECONDARY SCHOOL — MASTER POCKET MONEY TRANSACTION RECORDS',
      subtitle: `Complete Pocket Money Transaction Audit Ledger (${filtered.length} entries)`,
      academicYear: '2026–2027',
      columns: [
        { header: 'Date & Time Timestamp', accessor: (tx: PocketTransaction) => tx.created_at || tx.transaction_date, width: '18%' },
        { header: 'Receipt Ref', accessor: (tx: PocketTransaction) => tx.receipt_ref || '-', width: '14%' },
        { header: 'PayID', accessor: (tx: PocketTransaction) => tx.pay_id || '-', width: '12%' },
        { header: 'Hosteller Name', accessor: (tx: PocketTransaction) => tx.student_name || 'Unknown', width: '22%' },
        { header: 'Class & Sec', accessor: (tx: PocketTransaction) => `${formatStandard(tx.standard)} - ${tx.section}`, align: 'center', width: '12%' },
        { header: 'Transaction Type', accessor: (tx: PocketTransaction) => tx.transaction_type.replace(/_/g, ' '), width: '16%' },
        { header: 'Amount (K)', accessor: (tx: PocketTransaction) => `K ${Math.round(tx.amount).toLocaleString('en-IN')}`, align: 'right', width: '14%' },
      ],
      data: filtered,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Header & Prominent Top Count Pill */}
      <div className="card" style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={18} style={{ color: 'var(--accent-gold)' }} />
              MASTER POCKET MONEY TRANSACTION LEDGER
            </h2>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '4px 0 0 0', fontWeight: 600 }}>
              Audit-ready log of all parent deposits, disbursements, and refunds.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* PROMINENT TOP COUNT PILL */}
            <div style={{ backgroundColor: 'var(--bg-table-head)', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: 'var(--text-secondary)' }}>
                FILTERED TRANSACTIONS:
              </span>
              <span style={{ fontSize: '14px', fontWeight: 800, fontFamily: 'monospace', color: 'var(--accent-gold)' }}>
                {filtered.length} RECORDS
              </span>
            </div>

            <button
              onClick={handlePrintAuditReport}
              disabled={loading || filtered.length === 0}
              className="btn btn-primary"
              style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Printer size={13} />
              <span>Print Audit Log</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="filter-box" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', fontSize: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', flex: 1 }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px', maxWidth: '300px' }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none', zIndex: 10, opacity: 0.7 }} />
            <input
              type="text"
              className="input-field"
              placeholder="Search PayID, Student Name, Receipt Ref..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              style={{ paddingLeft: '34px', fontSize: '12px', height: '28px' }}
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="select-field"
            style={{ fontSize: '12px', height: '28px', padding: '0 8px' }}
          >
            <option value="">All Transaction Types</option>
            <option value="RECEIVED_FROM_PARENT">Top Up (Parent Deposit)</option>
            <option value="GIVEN_TO_STUDENT">Given to Student</option>
            <option value="RETURNED_TO_PARENT">Refund to Parent</option>
          </select>

          {(searchQuery || typeFilter) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setTypeFilter('');
                setCurrentPage(1);
              }}
              className="btn btn-secondary"
              style={{ fontSize: '11px', height: '28px', padding: '0 8px' }}
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Master Transactions History Table with Pagination */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="ledger-table" style={{ width: '100%', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr>
                <th style={{ width: '18%', padding: '10px 12px' }}>DATE & TIMESTAMP</th>
                <th style={{ width: '14%', padding: '10px 12px' }}>RECEIPT REF</th>
                <th style={{ width: '12%', padding: '10px 12px', fontFamily: 'monospace' }}>PAYID</th>
                <th style={{ width: '22%', padding: '10px 12px' }}>HOSTELLER NAME</th>
                <th style={{ width: '16%', padding: '10px 12px', textAlign: 'center' }}>TYPE</th>
                <th style={{ width: '18%', padding: '10px 12px', textAlign: 'right' }}>AMOUNT (K)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                    Loading Transaction Records...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                    No transaction records found matching your search.
                  </td>
                </tr>
              ) : (
                pageData.map((tx) => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={12} color="var(--text-secondary)" />
                        <span>{tx.created_at || tx.transaction_date}</span>
                      </div>
                    </td>

                    <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-primary)', fontWeight: 700, padding: '10px 12px' }}>
                      {tx.receipt_ref || '-'}
                    </td>

                    <td style={{ fontFamily: 'monospace', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '12px', padding: '10px 12px' }}>
                      {tx.pay_id || '-'}
                    </td>

                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '12px' }}>{tx.student_name}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                        {formatStandard(tx.standard)} - {tx.section}
                      </div>
                    </td>

                    <td style={{ textAlign: 'center', padding: '10px 12px' }}>
                      <span className={`badge ${
                        tx.transaction_type === 'RECEIVED_FROM_PARENT'
                          ? 'badge-green'
                          : tx.transaction_type === 'FEE_EXCESS_TRANSFER'
                          ? 'badge-amber'
                          : tx.transaction_type === 'GIVEN_TO_STUDENT'
                          ? 'badge-blue'
                          : 'badge-purple'
                      }`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                        {tx.transaction_type.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, fontSize: '13px', color: 'var(--pill-paid-text)', padding: '10px 12px' }}>
                      K {Math.round(tx.amount).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* STRICT 10-RECORD PAGINATION BAR */}
        {filtered.length > 0 && (
          <div style={{ padding: '10px 14px', backgroundColor: 'var(--bg-table-head)', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', fontSize: '12px', fontFamily: 'monospace' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              Showing <strong>{startIndex + 1}</strong> to <strong>{Math.min(startIndex + pageSize, filtered.length)}</strong> of <strong>{filtered.length}</strong> transactions
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="btn btn-secondary"
                style={{ fontSize: '11px', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <ChevronLeft size={13} />
                <span>Prev</span>
              </button>

              <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Page {currentPage} of {totalPages}</span>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="btn btn-secondary"
                style={{ fontSize: '11px', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <span>Next</span>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

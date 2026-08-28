import React, { useEffect, useState } from 'react';
import { getFeeSummaryReport, getPocketMoneyReport } from '../api';
import { X, FileText, Printer, CreditCard, Wallet } from 'lucide-react';

interface ReportsModalProps {
  onClose: () => void;
}

export const ReportsModal: React.FC<ReportsModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'fees' | 'pocket'>('fees');
  const [feeReport, setFeeReport] = useState<any>(null);
  const [pocketReport, setPocketReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([getFeeSummaryReport(), getPocketMoneyReport()])
      .then(([feeRes, pocketRes]) => {
        setFeeReport(feeRes);
        setPocketReport(pocketRes);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto font-sans">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-900">
        
        {/* Header */}
        <div className="px-6 py-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">School Office Financial & Student Reports</h3>
              <p className="text-xs text-slate-600 font-medium">Academic Year: {feeReport?.academic_year || '2026-2027'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-1.5 rounded-xl text-xs font-bold border border-slate-300 transition"
            >
              <Printer className="w-4 h-4 text-indigo-700" />
              <span>Print Report</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="px-6 py-3 bg-slate-100/60 border-b border-slate-200 flex items-center gap-3">
          <button
            onClick={() => setActiveTab('fees')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition border ${
              activeTab === 'fees'
                ? 'bg-indigo-700 text-white border-indigo-700 shadow-sm'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>School Fee Collection & Defaulter Report</span>
          </button>

          <button
            onClick={() => setActiveTab('pocket')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition border ${
              activeTab === 'pocket'
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Boarder Pocket Money Office Ledger</span>
          </button>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="py-24 text-center text-slate-600">
            <div className="w-8 h-8 border-3 border-indigo-700 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <span className="font-semibold">Aggregating office reports...</span>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
            
            {/* REPORT 1: FEE COLLECTION & DEFAULTERS */}
            {activeTab === 'fees' && feeReport && (
              <div className="space-y-6">
                
                {/* Financial Totals Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <span className="text-slate-500 block mb-1 uppercase font-bold text-[11px]">Total Expected Revenue</span>
                    <span className="text-2xl font-extrabold font-mono text-slate-900">₹{feeReport.totals.total_expected.toLocaleString()}</span>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 text-emerald-900">
                    <span className="text-emerald-800 block mb-1 uppercase font-bold text-[11px]">Total Collected Fees</span>
                    <span className="text-2xl font-extrabold font-mono">₹{feeReport.totals.total_collected.toLocaleString()}</span>
                  </div>
                  <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 text-rose-900">
                    <span className="text-rose-800 block mb-1 uppercase font-bold text-[11px]">Total Outstanding Due</span>
                    <span className="text-2xl font-extrabold font-mono">₹{feeReport.totals.total_outstanding.toLocaleString()}</span>
                  </div>
                </div>

                {/* Status Breakdown Pills */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-slate-800 font-bold uppercase tracking-wider block mb-3">
                    Fee Status Breakdown (Total Active Boys: {feeReport.totals.total_students})
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(feeReport.status_counts).map(([k, v]) => (
                      <div key={k} className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
                        <span className="text-slate-700 text-xs font-semibold">{k}</span>
                        <span className="font-extrabold text-slate-900 font-mono text-sm">{v as any}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Class-wise Collection Breakdown Table */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
                    Class-wise Fee Collection & Defaulter Breakdown (17 Classes)
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left text-slate-800">
                      <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px] border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-4">Class</th>
                          <th className="py-2.5 px-4 text-center">Students</th>
                          <th className="py-2.5 px-4 text-right">Expected (₹)</th>
                          <th className="py-2.5 px-4 text-right">Collected (₹)</th>
                          <th className="py-2.5 px-4 text-right">Due (₹)</th>
                          <th className="py-2.5 px-4 text-center">Collection %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {Object.entries(feeReport.class_collections).map(([cls, val]: [string, any]) => {
                          const pct = val.expected > 0 ? ((val.paid / val.expected) * 100).toFixed(1) : '0';
                          return (
                            <tr key={cls} className="hover:bg-slate-50">
                              <td className="py-3 px-4 font-bold text-indigo-900">{cls}</td>
                              <td className="py-3 px-4 text-center font-mono font-semibold">{val.count}</td>
                              <td className="py-3 px-4 text-right font-mono font-semibold">₹{val.expected.toLocaleString()}</td>
                              <td className="py-3 px-4 text-right font-mono text-emerald-800 font-bold">₹{val.paid.toLocaleString()}</td>
                              <td className="py-3 px-4 text-right font-mono text-rose-800 font-bold">₹{val.due.toLocaleString()}</td>
                              <td className="py-3 px-4 text-center">
                                <span className="px-2 py-0.5 rounded font-mono font-bold bg-indigo-50 text-indigo-900 border border-indigo-200">
                                  {pct}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* REPORT 2: POCKET MONEY LEDGER */}
            {activeTab === 'pocket' && pocketReport && (
              <div className="space-y-6">
                
                {/* Pocket Money Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 text-emerald-900">
                    <span className="text-emerald-800 block mb-1 uppercase font-bold text-[11px]">Total Pocket Money Held</span>
                    <span className="text-2xl font-extrabold font-mono">₹{pocketReport.totals.current_balance_held.toLocaleString()}</span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-slate-900">
                    <span className="text-slate-500 block mb-1 uppercase font-bold text-[11px]">Total Received Parents</span>
                    <span className="text-xl font-bold font-mono">₹{pocketReport.totals.total_received.toLocaleString()}</span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-slate-900">
                    <span className="text-slate-500 block mb-1 uppercase font-bold text-[11px]">Total Handed Students</span>
                    <span className="text-xl font-bold font-mono">₹{pocketReport.totals.total_given.toLocaleString()}</span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-slate-900">
                    <span className="text-slate-500 block mb-1 uppercase font-bold text-[11px]">Total Boarders</span>
                    <span className="text-xl font-bold font-mono">{pocketReport.totals.total_hostellers} boys</span>
                  </div>
                </div>

                {/* Class-wise Pocket Money Summary Table */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
                    Class-wise Hosteller Pocket Money Summary
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left text-slate-800">
                      <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px] border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-4">Class</th>
                          <th className="py-2.5 px-4 text-center">Boarders</th>
                          <th className="py-2.5 px-4 text-right">Received (₹)</th>
                          <th className="py-2.5 px-4 text-right">Given (₹)</th>
                          <th className="py-2.5 px-4 text-right">Returned (₹)</th>
                          <th className="py-2.5 px-4 text-right">Held Balance (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {Object.entries(pocketReport.class_summary).map(([cls, val]: [string, any]) => (
                          <tr key={cls} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-bold text-emerald-900">{cls}</td>
                            <td className="py-3 px-4 text-center font-mono font-semibold">{val.count}</td>
                            <td className="py-3 px-4 text-right font-mono font-semibold">₹{val.received.toLocaleString()}</td>
                            <td className="py-3 px-4 text-right font-mono font-semibold text-slate-700">₹{val.given.toLocaleString()}</td>
                            <td className="py-3 px-4 text-right font-mono font-semibold text-slate-600">₹{val.returned.toLocaleString()}</td>
                            <td className="py-3 px-4 text-right font-mono font-extrabold text-emerald-800">₹{val.balance.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};

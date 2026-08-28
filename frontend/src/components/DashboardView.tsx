import React from 'react';
import { School, Users, CreditCard, ArrowRight, CheckCircle2, Clock, XCircle, ShieldCheck } from 'lucide-react';
import type { StudentFilterParams, SystemOverview } from '../api';

interface DashboardViewProps {
  overview: SystemOverview | null;
  onNavigateToRegister: (filters?: Partial<StudentFilterParams>) => void;
  onNavigateToReports: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  overview,
  onNavigateToRegister,
  onNavigateToReports,
}) => {
  const standards = [
    { name: "VIII", sections: ["E", "EE", "G", "GG"], count: 180, desc: "Standard VIII (4 Sections)" },
    { name: "IX", sections: ["E", "EE", "G", "GG"], count: 180, desc: "Standard IX (4 Sections)" },
    { name: "X", sections: ["A", "B", "S"], count: 129, desc: "Standard X (3 Sections)" },
    { name: "XI", sections: ["A", "B", "S"], count: 129, desc: "Standard XI (3 Sections)" },
    { name: "XII", sections: ["A", "B", "S"], count: 132, desc: "Standard XII (3 Sections)" },
  ];

  const categories = [
    { label: "Day Scholars", value: "DAY_SCHOLAR", rate: "₹1,500 / term", color: "bg-blue-50/80 border-blue-200 text-blue-900" },
    { label: "Ordinary Hostellers", value: "HOSTEL_ORDINARY", rate: "₹2,800 / term", color: "bg-indigo-50/80 border-indigo-200 text-indigo-900" },
    { label: "Special Scheme", value: "HOSTEL_SPECIAL", rate: "₹4,400 / term", color: "bg-purple-50/80 border-purple-200 text-purple-900" },
  ];

  const feeStatuses = [
    { label: "Fully Paid", value: "Fully Paid", subtitle: "All 3 terms paid", icon: CheckCircle2, color: "bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100/70" },
    { label: "2 Terms Paid", value: "Two Terms Paid", subtitle: "1 term remaining due", icon: Clock, color: "bg-indigo-50 text-indigo-900 border-indigo-200 hover:bg-indigo-100/70" },
    { label: "1 Term Paid", value: "One Term Paid", subtitle: "2 terms remaining due", icon: Clock, color: "bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100/70" },
    { label: "No Fees Paid", value: "No Fees Paid", subtitle: "All 3 terms outstanding", icon: XCircle, color: "bg-rose-50 text-rose-900 border-rose-200 hover:bg-rose-100/70" },
    { label: "1 Term Due", value: "One Term Due", subtitle: "Defaulter check: 1 due", icon: Clock, color: "bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100/70" },
    { label: "2 Terms Due", value: "Two Terms Due", subtitle: "Defaulter check: 2 due", icon: Clock, color: "bg-orange-50 text-orange-900 border-orange-200 hover:bg-orange-100/70" },
    { label: "3 Terms Due", value: "Three Terms Due", subtitle: "Defaulter check: 3 due", icon: XCircle, color: "bg-rose-50 text-rose-900 border-rose-200 hover:bg-rose-100/70" },
  ];

  return (
    <div className="space-y-8 animate-fadeIn font-sans">
      
      {/* Welcome Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Academic Year {overview?.active_academic_year || '2026-2027'}
            </span>
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">School Master Portal</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">School Office Dashboard</h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Centralized management system for {overview?.total_students ?? 740} boys across 17 sections. Easily locate student records, track 3-term fee payments, and manage boarder pocket money.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateToRegister()}
            className="flex items-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition"
          >
            <Users className="w-4 h-4" />
            <span>Open Student Register</span>
          </button>
          <button
            onClick={onNavigateToReports}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-300 transition"
          >
            <CreditCard className="w-4 h-4 text-emerald-700" />
            <span>Office Reports</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Active Boys</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-extrabold text-slate-900 font-mono">{overview?.total_students ?? 740}</span>
          <span className="text-xs text-slate-500 block mt-1">Across 17 total classes & sections</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Classes</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <School className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-extrabold text-emerald-700 font-mono">17</span>
          <span className="text-xs text-slate-500 block mt-1">VIII (4), IX (4), X (3), XI (3), XII (3)</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fee Categories</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-extrabold text-purple-800 font-mono">3</span>
          <span className="text-xs text-slate-500 block mt-1">Day Scholar, Ordinary, Special Scheme</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Register Security</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <span className={`text-2xl font-extrabold font-mono ${overview?.is_register_locked ? 'text-amber-700' : 'text-emerald-700'}`}>
            {overview?.is_register_locked ? 'LOCKED' : 'UNLOCKED'}
          </span>
          <span className="text-xs text-slate-500 block mt-1">Administrator protection enabled</span>
        </div>

      </div>

      {/* SECTION 1: STANDARDS (VIII - XII) CARDS */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">School Standards & Classes</h3>
            <p className="text-xs text-slate-600">Click any standard card to view its complete student register</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {standards.map((std) => (
            <button
              key={std.name}
              onClick={() => onNavigateToRegister({ standard: std.name })}
              className="bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-indigo-400 p-5 rounded-2xl text-left transition group shadow-sm hover:shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
                    Standard {std.name}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-700 group-hover:translate-x-1 transition" />
                </div>
                <span className="text-3xl font-extrabold text-slate-900 font-mono block mt-1">
                  ~{std.count} <span className="text-xs font-semibold text-slate-500">boys</span>
                </span>
                <p className="text-xs text-slate-500 mt-1.5 font-medium">{std.desc}</p>
              </div>

              {/* Section Badges */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-slate-500 font-bold uppercase">Sections:</span>
                {std.sections.map((sec) => (
                  <span key={sec} className="text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-800 rounded border border-slate-200">
                    {sec}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 2: BOARDING CATEGORIES */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Boarding Categories & Fee Structure</h3>
            <p className="text-xs text-slate-600">Filter student register by boarding category</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => onNavigateToRegister({ boarding_category: cat.value })}
              className={`p-6 rounded-2xl border transition group shadow-sm hover:shadow-md text-left flex items-center justify-between ${cat.color}`}
            >
              <div>
                <span className="text-xs font-bold uppercase tracking-wider block mb-1 opacity-80">
                  Category
                </span>
                <h4 className="text-lg font-bold text-slate-900">{cat.label}</h4>
                <span className="text-base font-extrabold font-mono text-emerald-800 block mt-1">{cat.rate}</span>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-slate-900 group-hover:translate-x-1 transition" />
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 3: FEE STATUS QUICK ENTRY POINTS */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Fee Status Entry Points</h3>
            <p className="text-xs text-slate-600">Locate students directly by payment or defaulter status</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {feeStatuses.map((fs) => {
            const Icon = fs.icon;
            return (
              <button
                key={fs.value}
                onClick={() => onNavigateToRegister({ fee_status: fs.value })}
                className={`p-4 rounded-2xl border text-left transition flex items-center justify-between ${fs.color} shadow-sm hover:shadow group`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-bold">{fs.label}</span>
                  </div>
                  <span className="text-xs text-slate-600 block font-medium">{fs.subtitle}</span>
                </div>
                <ArrowRight className="w-4 h-4 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition" />
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};

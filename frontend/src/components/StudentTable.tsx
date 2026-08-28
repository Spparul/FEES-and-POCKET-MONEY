import React from 'react';
import type { Student } from '../api';
import { CheckCircle2, Clock, Eye, CreditCard, Wallet, Search } from 'lucide-react';

interface StudentTableProps {
  students: Student[];
  loading: boolean;
  onSelectStudent: (student: Student) => void;
  onPayFee: (student: Student) => void;
  onPocketMoney: (student: Student) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const StudentTable: React.FC<StudentTableProps> = ({
  students,
  loading,
  onSelectStudent,
  onPayFee,
  onPocketMoney,
  searchQuery,
  onSearchChange,
}) => {
  const formatCategory = (cat: string) => {
    switch (cat) {
      case 'DAY_SCHOLAR':
        return { label: 'Day Scholar', color: 'bg-slate-100 text-slate-800 border-slate-300' };
      case 'HOSTEL_ORDINARY':
        return { label: 'Hostel — Ordinary', color: 'bg-indigo-50 text-indigo-900 border-indigo-200' };
      case 'HOSTEL_SPECIAL':
        return { label: 'Hostel — Special', color: 'bg-purple-50 text-purple-900 border-purple-200' };
      default:
        return { label: cat, color: 'bg-slate-100 text-slate-800 border-slate-300' };
    }
  };

  const formatTermPill = (summary?: any) => {
    if (!summary) return null;
    const isPaid = summary.status === 'Paid';
    return (
      <span
        title={isPaid ? `Paid on ${summary.payment_date || 'recorded date'}` : `Due: ₹${summary.due_amount}`}
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold border ${
          isPaid
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}
      >
        {isPaid ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> : <Clock className="w-3.5 h-3.5 text-rose-700" />}
        {isPaid ? 'Paid' : 'Due'}
      </span>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      
      {/* Table Top Controls & Search Bar */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Student Register Directory
          </h3>
          <span className="text-xs bg-slate-200 text-slate-800 px-2.5 py-0.5 rounded-full font-bold border border-slate-300">
            {students.length} record{students.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* Live Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search student name or admission no..."
            className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 font-medium transition"
          />
        </div>

      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-800">
          <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
            <tr>
              <th className="py-3.5 px-4">Admission No</th>
              <th className="py-3.5 px-4">Student Name</th>
              <th className="py-3.5 px-4">Class / Sec</th>
              <th className="py-3.5 px-4">Adm Year</th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-3 text-center">Term 1</th>
              <th className="py-3.5 px-3 text-center">Term 2</th>
              <th className="py-3.5 px-3 text-center">Term 3</th>
              <th className="py-3.5 px-4 text-center">Fee Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-600 font-medium">
                  <div className="inline-flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading student records...</span>
                  </div>
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-500 font-medium">
                  No students found matching the selected criteria.
                </td>
              </tr>
            ) : (
              students.map((student) => {
                const categoryInfo = formatCategory(student.boarding_category);
                const feeOverview = student.fee_overview;
                const pocketSummary = student.pocket_money;

                const t1 = feeOverview?.term_details[0];
                const t2 = feeOverview?.term_details[1];
                const t3 = feeOverview?.term_details[2];

                return (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-50 transition group"
                  >
                    {/* Admission Number */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                      {student.admission_no}
                    </td>

                    {/* Student Name */}
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => onSelectStudent(student)}
                        className="font-bold text-slate-900 group-hover:text-indigo-700 transition text-left text-sm"
                      >
                        {student.name}
                      </button>
                      <div className="text-[11px] text-slate-500 font-medium">
                        Father: {student.father_name}
                      </div>
                    </td>

                    {/* Standard & Section */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-extrabold bg-indigo-50 text-indigo-900 border border-indigo-200">
                        {student.current_standard}-{student.current_section}
                      </span>
                    </td>

                    {/* Admission Year */}
                    <td className="py-3.5 px-4 font-semibold text-slate-600">
                      {student.admission_year}
                    </td>

                    {/* Boarding Category */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-semibold border ${categoryInfo.color}`}>
                        {categoryInfo.label}
                      </span>
                    </td>

                    {/* Term 1 */}
                    <td className="py-3.5 px-3 text-center">
                      {formatTermPill(t1)}
                    </td>

                    {/* Term 2 */}
                    <td className="py-3.5 px-3 text-center">
                      {formatTermPill(t2)}
                    </td>

                    {/* Term 3 */}
                    <td className="py-3.5 px-3 text-center">
                      {formatTermPill(t3)}
                    </td>

                    {/* Fee Overall Status */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                        feeOverview?.overall_status === 'Fully Paid'
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                          : feeOverview?.overall_status === 'Two Terms Paid'
                          ? 'bg-indigo-50 text-indigo-900 border-indigo-200'
                          : feeOverview?.overall_status === 'One Term Paid'
                          ? 'bg-blue-50 text-blue-900 border-blue-200'
                          : 'bg-rose-50 text-rose-900 border-rose-200'
                      }`}>
                        {feeOverview?.overall_status || 'Unpaid'}
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        
                        {/* View Profile */}
                        <button
                          onClick={() => onSelectStudent(student)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition"
                          title="View Complete Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Pay Fees */}
                        <button
                          onClick={() => onPayFee(student)}
                          className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 transition"
                          title="Record Fee Payment"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>

                        {/* Pocket Money (Only if Boarder) */}
                        {student.boarding_category !== 'DAY_SCHOLAR' && (
                          <button
                            onClick={() => onPocketMoney(student)}
                            className="px-2 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 transition flex items-center gap-1 text-xs font-bold"
                            title="Manage Pocket Money"
                          >
                            <Wallet className="w-3.5 h-3.5 text-emerald-700" />
                            {pocketSummary && pocketSummary.current_balance > 0 && (
                              <span>₹{pocketSummary.current_balance}</span>
                            )}
                          </button>
                        )}

                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

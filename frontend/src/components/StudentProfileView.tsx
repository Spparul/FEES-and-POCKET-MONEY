import React, { useEffect, useState } from 'react';
import type { StudentProfileData } from '../api';
import { getStudentProfile, updateStudent } from '../api';
import { formatStandard } from '../utils/formatters';
import { printDataset } from '../utils/printHelper';
import { CreditCard, Wallet, ArrowLeft, Save, Edit3 } from 'lucide-react';

interface StudentProfileViewProps {
  studentId: number;
  onBack: () => void;
  onPayFee: (student: any) => void;
  onPocketMoney: (student: any) => void;
}

export const StudentProfileView: React.FC<StudentProfileViewProps> = ({
  studentId,
  onBack,
  onPayFee,
  onPocketMoney,
}) => {
  const [profileData, setProfileData] = useState<StudentProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'basic' | 'academic' | 'fees' | 'history' | 'pocket'>('overview');

  // Edit Basic Details State
  const [isEditingBasic, setIsEditingBasic] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editFatherName, setEditFatherName] = useState('');
  const [editMotherName, setEditMotherName] = useState('');
  const [editContactNo, setEditContactNo] = useState('');
  const [editAltContact, setEditAltContact] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editPincode, setEditPincode] = useState('');
  const [editStatus, setEditStatus] = useState<any>('ACTIVE');
  const [savingBasic, setSavingBasic] = useState(false);

  const fetchProfile = () => {
    setLoading(true);
    getStudentProfile(studentId)
      .then((data) => {
        setProfileData(data);
        const s = data.student;
        setEditName(s.name);
        setEditDob(s.dob);
        setEditFatherName(s.father_name);
        setEditMotherName(s.mother_name || '');
        setEditContactNo(s.contact_no);
        setEditAltContact(s.additional_contact || '');
        setEditAddress(s.address || '');
        setEditCity(s.city || '');
        setEditState(s.state || '');
        setEditPincode(s.pincode || '');
        setEditStatus(s.status);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProfile();
  }, [studentId]);

  const handleSaveBasicDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBasic(true);
    try {
      await updateStudent(studentId, {
        name: editName,
        dob: editDob,
        father_name: editFatherName,
        mother_name: editMotherName || undefined,
        contact_no: editContactNo,
        additional_contact: editAltContact || undefined,
        address: editAddress || undefined,
        city: editCity || undefined,
        state: editState || undefined,
        pincode: editPincode || undefined,
        status: editStatus,
      });
      setIsEditingBasic(false);
      fetchProfile();
    } catch (err: any) {
      alert(err.message || 'Failed to update student basic details in database.');
    } finally {
      setSavingBasic(false);
    }
  };

  if (loading || !profileData) {
    return (
      <div className="py-24 text-center text-[var(--text-secondary)] font-sans">
        <div className="w-6 h-6 border-2 border-[var(--accent-gold)] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <span className="font-semibold text-sm">Loading complete student profile record...</span>
      </div>
    );
  }

  const student = profileData.student;
  const feeOverview = student.fee_overview;
  const pocketSummary = student.pocket_money;
  const isHosteller = student.boarding_category !== 'DAY_SCHOLAR';

  return (
    <div className="space-y-6 font-sans animate-fadeIn w-full text-base">

      {/* Back Button & Student Header */}
      <div className="bg-[var(--bg-card)] p-6 sm:p-8 rounded-2xl border-2 border-[var(--border-color)] shadow-sm space-y-4 w-full">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--bg-page)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border-2 border-[var(--border-color)] font-bold transition cursor-pointer"
            style={{ fontSize: '20px' }}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Previous View</span>
          </button>

          <span className="font-mono font-bold text-[var(--text-secondary)]" style={{ fontSize: '18px' }}>
            Admission No: {student.admission_no}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-[var(--text-primary)]" style={{ fontSize: '32px' }}>
                {student.name}
              </h1>
              <span className="px-3.5 py-1 rounded-lg text-lg font-extrabold bg-[var(--accent-gold)] text-slate-950 font-mono">
                Grade {formatStandard(student.current_standard)} — {student.current_section}
              </span>
              <span className={`px-3.5 py-1 rounded-lg text-lg font-extrabold font-mono uppercase border ${student.status === 'ACTIVE'
                  ? 'bg-[var(--pill-paid-bg)] text-[var(--pill-paid-text)] border-[var(--pill-paid-border)]'
                  : 'bg-amber-500/20 text-amber-900 border-amber-500/40'
                }`}>
                {student.status}
              </span>
            </div>

            <div className="flex items-center flex-wrap gap-4 text-sm text-[var(--text-secondary)] mt-2 font-bold" style={{ fontSize: '18px' }}>
              <span>Admission Year: <strong className="text-[var(--text-primary)] font-mono">{student.admission_year}</strong></span>
              <span>•</span>
              <span>Father: <strong className="text-[var(--text-primary)]">{student.father_name}</strong></span>
              <span>•</span>
              <span>Category: <strong className="text-[var(--text-primary)]">{student.boarding_category.replace('HOSTEL_', '')}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {student.status !== 'TRANSFERRED' ? (
              <button
                onClick={() => onPayFee(student)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-gold)] text-slate-950 font-extrabold text-xs shadow-sm hover:brightness-110 transition cursor-pointer"
              >
                <CreditCard size={14} />
                <span>Record Fee Payment</span>
              </button>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-xs">
                <span>Transferred (Payment Disabled)</span>
              </span>
            )}

            {isHosteller && student.status !== 'TRANSFERRED' && (
              <button
                onClick={() => onPocketMoney(student)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--pill-paid-bg)] text-[var(--pill-paid-text)] border border-[var(--pill-paid-border)] font-extrabold text-xs transition hover:brightness-105 cursor-pointer"
              >
                <Wallet size={14} />
                <span>Pocket Money Tx</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MULTI-TAB NAVIGATION BAR */}
      <div className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] p-3 rounded-2xl flex items-center flex-wrap gap-2 w-full">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-5 py-2.5 rounded-xl font-extrabold transition cursor-pointer ${activeTab === 'overview'
              ? 'bg-[var(--accent-primary)] text-white shadow-sm'
              : 'hover:bg-[var(--bg-hover)] text-[var(--text-primary)]'
            }`}
          style={{ fontSize: '20px' }}
        >
          Overview
        </button>

        <button
          onClick={() => setActiveTab('basic')}
          className={`px-5 py-2.5 rounded-xl font-extrabold transition cursor-pointer ${activeTab === 'basic'
              ? 'bg-[var(--accent-primary)] text-white shadow-sm'
              : 'hover:bg-[var(--bg-hover)] text-[var(--text-primary)]'
            }`}
          style={{ fontSize: '20px' }}
        >
          Basic Details
        </button>

        <button
          onClick={() => setActiveTab('academic')}
          className={`px-5 py-2.5 rounded-xl font-extrabold transition cursor-pointer ${activeTab === 'academic'
              ? 'bg-[var(--accent-primary)] text-white shadow-sm'
              : 'hover:bg-[var(--bg-hover)] text-[var(--text-primary)]'
            }`}
          style={{ fontSize: '20px' }}
        >
          Academic History
        </button>

        <button
          onClick={() => setActiveTab('fees')}
          className={`px-5 py-2.5 rounded-xl font-extrabold transition cursor-pointer ${activeTab === 'fees'
              ? 'bg-[var(--accent-primary)] text-white shadow-sm'
              : 'hover:bg-[var(--bg-hover)] text-[var(--text-primary)]'
            }`}
          style={{ fontSize: '20px' }}
        >
          Fee Ledger
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-5 py-2.5 rounded-xl font-extrabold transition cursor-pointer ${activeTab === 'history'
              ? 'bg-[var(--accent-primary)] text-white shadow-sm'
              : 'hover:bg-[var(--bg-hover)] text-[var(--text-primary)]'
            }`}
          style={{ fontSize: '20px' }}
        >
          Payment History
        </button>

        {isHosteller && (
          <button
            onClick={() => setActiveTab('pocket')}
            className={`px-5 py-2.5 rounded-xl font-extrabold transition cursor-pointer ${activeTab === 'pocket'
                ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                : 'hover:bg-[var(--bg-hover)] text-[var(--text-primary)]'
              }`}
            style={{ fontSize: '20px' }}
          >
            Pocket Money
          </button>
        )}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">

          {/* Fee Overview Card */}
          <div className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-extrabold font-heading text-[var(--text-primary)] uppercase tracking-wider border-b-2 border-[var(--border-color)] pb-3" style={{ fontSize: '22px' }}>
              Fee Collection Status ({student.academic_year || '2026-2027'})
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[var(--bg-page)] p-4 rounded-xl border border-[var(--border-color)]">
                <span className="text-[var(--text-secondary)] font-bold block mb-1 text-xs" style={{ fontSize: '14px' }}>Terms Paid</span>
                <span className="font-mono font-extrabold text-2xl text-[var(--pill-paid-text)]" style={{ fontSize: '28px' }}>{feeOverview?.terms_paid_count} / 3</span>
              </div>
              <div className="bg-[var(--bg-page)] p-4 rounded-xl border border-[var(--border-color)]">
                <span className="text-[var(--text-secondary)] font-bold block mb-1 text-xs">Total Expected</span>
                <span className="font-mono font-extrabold text-lg text-[var(--text-primary)]">K {feeOverview?.total_expected.toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-2">
              <span className="font-bold text-[var(--text-secondary)] block mb-2 text-xs">Term Progress:</span>
              <div className="grid grid-cols-3 gap-3 font-bold text-center text-xs">
                {feeOverview?.term_details.map((t) => (
                  <div key={t.term_name} className={`p-2.5 rounded-xl border ${t.status === 'Paid'
                      ? 'bg-[var(--pill-paid-bg)] text-[var(--pill-paid-text)] border-[var(--pill-paid-border)]'
                      : 'bg-[var(--pill-due-bg)] text-[var(--pill-due-text)] border-[var(--pill-due-border)]'
                    }`}>
                    <span className="block text-xs uppercase">{t.term_name}</span>
                    <span className="font-mono font-extrabold text-xs">{t.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pocket Money Overview Card */}
          {isHosteller ? (
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-xl shadow-sm space-y-3">
              <h3 className="font-extrabold font-heading text-[var(--text-primary)] uppercase tracking-wider border-b border-[var(--border-color)] pb-2 text-xs">
                Boarder Pocket Money Summary
              </h3>

              <div className="bg-[var(--pill-paid-bg)] border border-[var(--pill-paid-border)] p-3 rounded-lg text-[var(--pill-paid-text)] text-center">
                <span className="font-extrabold uppercase text-[10px] block mb-0.5">Currently Held Balance</span>
                <span className="font-mono font-extrabold text-lg">K {(pocketSummary?.current_balance || 0).toLocaleString()}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 font-mono font-bold text-center text-xs">
                <div className="bg-[var(--bg-page)] p-2 rounded-lg border border-[var(--border-color)]">
                  <span className="text-[var(--text-secondary)] block text-[10px]">Deposited</span>
                  <span>K {(pocketSummary?.total_received || 0).toLocaleString()}</span>
                </div>
                <div className="bg-[var(--bg-page)] p-2 rounded-lg border border-[var(--border-color)]">
                  <span className="text-[var(--text-secondary)] block text-[10px]">Given</span>
                  <span>K {(pocketSummary?.total_given || 0).toLocaleString()}</span>
                </div>
                <div className="bg-[var(--bg-page)] p-2 rounded-lg border border-[var(--border-color)]">
                  <span className="text-[var(--text-secondary)] block text-[10px]">Returned</span>
                  <span>K {(pocketSummary?.total_returned || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] p-6 rounded-2xl shadow-sm flex items-center justify-center text-[var(--text-secondary)] font-bold" style={{ fontSize: '20px' }}>
              Day Scholars do not hold pocket money accounts.
            </div>
          )}

        </div>
      )}

      {/* TAB 2: BASIC DETAILS & INLINE EDITING */}
      {activeTab === 'basic' && (
        <div className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] p-6 sm:p-8 rounded-2xl shadow-sm space-y-6 w-full">
          <div className="flex items-center justify-between border-b-2 border-[var(--border-color)] pb-4">
            <h3 className="font-extrabold font-heading text-[var(--text-primary)] uppercase tracking-wider" style={{ fontSize: '24px' }}>
              Student Basic & Parent Contact Information
            </h3>

            {!isEditingBasic ? (
              <button
                onClick={() => setIsEditingBasic(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent-gold)] text-slate-950 font-extrabold shadow-sm hover:brightness-110 transition cursor-pointer"
                style={{ fontSize: '18px' }}
              >
                <Edit3 className="w-5 h-5" />
                <span>Edit Basic Details</span>
              </button>
            ) : (
              <span className="font-extrabold text-[var(--accent-gold)]" style={{ fontSize: '18px' }}>
                Editing Record in Progress...
              </span>
            )}
          </div>

          {isEditingBasic ? (
            <form onSubmit={handleSaveBasicDetails} className="space-y-6 w-full">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block font-bold text-[var(--text-primary)] mb-2" style={{ fontSize: '18px' }}>Student Name</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required className="w-full bg-[var(--bg-page)] border-2 border-[var(--border-color)] rounded-xl px-4 py-2.5 font-bold" style={{ fontSize: '18px' }} />
                </div>
                <div>
                  <label className="block font-bold text-[var(--text-primary)] mb-2" style={{ fontSize: '18px' }}>Father Name</label>
                  <input type="text" value={editFatherName} onChange={(e) => setEditFatherName(e.target.value)} required className="w-full bg-[var(--bg-page)] border-2 border-[var(--border-color)] rounded-xl px-4 py-2.5 font-bold" style={{ fontSize: '18px' }} />
                </div>
                <div>
                  <label className="block font-bold text-[var(--text-primary)] mb-2" style={{ fontSize: '18px' }}>Mother Name</label>
                  <input type="text" value={editMotherName} onChange={(e) => setEditMotherName(e.target.value)} placeholder="Mother Name (Optional)" className="w-full bg-[var(--bg-page)] border-2 border-[var(--border-color)] rounded-xl px-4 py-2.5 font-bold" style={{ fontSize: '18px' }} />
                </div>
                <div>
                  <label className="block font-bold text-[var(--text-primary)] mb-2" style={{ fontSize: '18px' }}>Primary Contact Phone</label>
                  <input type="text" value={editContactNo} onChange={(e) => setEditContactNo(e.target.value)} required className="w-full bg-[var(--bg-page)] border-2 border-[var(--border-color)] rounded-xl px-4 py-2.5 font-mono font-bold" style={{ fontSize: '18px' }} />
                </div>
                <div>
                  <label className="block font-bold text-[var(--text-primary)] mb-2" style={{ fontSize: '18px' }}>Alt Emergency Phone</label>
                  <input type="text" value={editAltContact} onChange={(e) => setEditAltContact(e.target.value)} className="w-full bg-[var(--bg-page)] border-2 border-[var(--border-color)] rounded-xl px-4 py-2.5 font-mono font-bold" style={{ fontSize: '18px' }} />
                </div>
                <div>
                  <label className="block font-bold text-[var(--text-primary)] mb-2" style={{ fontSize: '18px' }}>Student Status</label>
                  <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="w-full bg-[var(--bg-page)] border-2 border-[var(--border-color)] rounded-xl px-4 py-2.5 font-bold cursor-pointer" style={{ fontSize: '18px' }}>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="TRANSFERRED">TRANSFERRED</option>
                    <option value="FINISHED">FINISHED / GRADUATED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-[var(--border-color)]">
                <div className="md:col-span-3">
                  <label className="block font-bold text-[var(--text-primary)] mb-2" style={{ fontSize: '18px' }}>Residential Address</label>
                  <textarea rows={2} value={editAddress} onChange={(e) => setEditAddress(e.target.value)} className="w-full bg-[var(--bg-page)] border-2 border-[var(--border-color)] rounded-xl p-3 font-bold" style={{ fontSize: '18px' }} />
                </div>
                <div>
                  <label className="block font-bold text-[var(--text-primary)] mb-2" style={{ fontSize: '18px' }}>City / Town</label>
                  <input type="text" value={editCity} onChange={(e) => setEditCity(e.target.value)} className="w-full bg-[var(--bg-page)] border-2 border-[var(--border-color)] rounded-xl px-4 py-2.5 font-bold" style={{ fontSize: '18px' }} />
                </div>
                <div>
                  <label className="block font-bold text-[var(--text-primary)] mb-2" style={{ fontSize: '18px' }}>State</label>
                  <input type="text" value={editState} onChange={(e) => setEditState(e.target.value)} className="w-full bg-[var(--bg-page)] border-2 border-[var(--border-color)] rounded-xl px-4 py-2.5 font-bold" style={{ fontSize: '18px' }} />
                </div>
                <div>
                  <label className="block font-bold text-[var(--text-primary)] mb-2" style={{ fontSize: '18px' }}>Postal Code / Pincode</label>
                  <input type="text" value={editPincode} onChange={(e) => setEditPincode(e.target.value)} className="w-full bg-[var(--bg-page)] border-2 border-[var(--border-color)] rounded-xl px-4 py-2.5 font-mono font-bold" style={{ fontSize: '18px' }} />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
                <button type="button" onClick={() => setIsEditingBasic(false)} className="px-5 py-2.5 rounded-xl bg-[var(--bg-page)] text-[var(--text-primary)] border border-[var(--border-color)] font-bold cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={savingBasic} className="px-6 py-2.5 rounded-xl bg-[var(--accent-gold)] text-slate-950 font-extrabold shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-2">
                  <Save className="w-5 h-5" />
                  <span>{savingBasic ? 'Saving Changes...' : 'Save Database Record'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-medium text-[var(--text-primary)]" style={{ fontSize: '20px' }}>
              <div><span className="text-[var(--text-secondary)] block text-sm font-extrabold uppercase">Full Name</span><strong>{student.name}</strong></div>
              <div><span className="text-[var(--text-secondary)] block text-sm font-extrabold uppercase">Admission Number</span><strong className="font-mono">{student.admission_no}</strong></div>
              <div><span className="text-[var(--text-secondary)] block text-sm font-extrabold uppercase">Student Status</span><strong className="font-mono uppercase">{student.status}</strong></div>
              <div><span className="text-[var(--text-secondary)] block text-sm font-extrabold uppercase">Father / Guardian</span><strong>{student.father_name}</strong></div>
              <div><span className="text-[var(--text-secondary)] block text-sm font-extrabold uppercase">Mother / Guardian</span><strong>{student.mother_name || '—'}</strong></div>
              <div><span className="text-[var(--text-secondary)] block text-sm font-extrabold uppercase">Primary Phone</span><strong className="font-mono">{student.contact_no}</strong></div>
              <div><span className="text-[var(--text-secondary)] block text-sm font-extrabold uppercase">Date of Birth</span><strong className="font-mono">{student.dob}</strong></div>
              <div><span className="text-[var(--text-secondary)] block text-sm font-extrabold uppercase">Date of Admission</span><strong className="font-mono">{student.date_of_admission}</strong></div>
              <div><span className="text-[var(--text-secondary)] block text-sm font-extrabold uppercase">Boarding Category</span><strong>{student.boarding_category.replace('HOSTEL_', '')}</strong></div>

              <div className="md:col-span-3 pt-4 border-t border-[var(--border-color)]">
                <span className="text-[var(--text-secondary)] block text-sm font-extrabold uppercase">Full Residential Address</span>
                <p className="font-bold mt-1">{student.address || 'No residential address recorded.'}</p>
                <div className="flex items-center gap-6 mt-2 text-sm text-[var(--text-secondary)] font-bold">
                  <span>City: <strong className="text-[var(--text-primary)]">{student.city || '—'}</strong></span>
                  <span>State: <strong className="text-[var(--text-primary)]">{student.state || '—'}</strong></span>
                  <span>Pincode: <strong className="text-[var(--text-primary)] font-mono">{student.pincode || '—'}</strong></span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ACADEMIC HISTORY */}
      {activeTab === 'academic' && (
        <div className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] p-6 rounded-2xl shadow-sm space-y-4 w-full">
          <h3 className="font-extrabold font-heading text-[var(--text-primary)] uppercase tracking-wider border-b-2 border-[var(--border-color)] pb-3" style={{ fontSize: '22px' }}>
            Academic History Log
          </h3>

          <table className="w-full text-left border-2 border-[var(--border-color)] rounded-xl ledger-table" style={{ fontSize: '20px' }}>
            <thead className="bg-[var(--bg-table-head)] font-extrabold uppercase border-b-2 border-[var(--border-color)]">
              <tr>
                <th className="py-4 px-5 border-r border-[var(--border-color)]">Academic Year</th>
                <th className="py-4 px-5 border-r border-[var(--border-color)]">Standard</th>
                <th className="py-4 px-5 border-r border-[var(--border-color)]">Section</th>
                <th className="py-4 px-5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-[var(--border-color)] font-mono font-bold">
              {student.enrollment_history.map((hist: any) => (
                <tr key={hist.id}>
                  <td className="py-4 px-5 border-r border-[var(--border-color)]">{hist.academic_year}</td>
                  <td className="py-4 px-5 border-r border-[var(--border-color)]">Standard {hist.standard}</td>
                  <td className="py-4 px-5 border-r border-[var(--border-color)]">Section {hist.section}</td>
                  <td className="py-4 px-5 text-center">
                    {hist.is_current ? (
                      <span className="px-3 py-1 rounded bg-[var(--pill-paid-bg)] text-[var(--pill-paid-text)] border border-[var(--pill-paid-border)] text-xs font-sans font-extrabold">Current</span>
                    ) : (
                      <span className="text-[var(--text-secondary)] text-xs font-sans">Historical</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: FEE LEDGER */}
      {activeTab === 'fees' && (
        <div className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] p-6 rounded-2xl shadow-sm space-y-4 w-full">
          <h3 className="font-extrabold font-heading text-[var(--text-primary)] uppercase tracking-wider border-b-2 border-[var(--border-color)] pb-3" style={{ fontSize: '22px' }}>
            Fee Term Schedule & Allocations ({student.academic_year || '2026-2027'})
          </h3>

          <table className="w-full text-left border-2 border-[var(--border-color)] rounded-xl ledger-table" style={{ fontSize: '20px' }}>
            <thead className="bg-[var(--bg-table-head)] font-extrabold uppercase border-b-2 border-[var(--border-color)]">
              <tr>
                <th className="py-4 px-5 border-r border-[var(--border-color)]">Term</th>
                <th className="py-4 px-5 text-right border-r border-[var(--border-color)]">Expected (₹)</th>
                <th className="py-4 px-5 text-right border-r border-[var(--border-color)]">Paid (₹)</th>
                <th className="py-4 px-5 text-right border-r border-[var(--border-color)]">Due (₹)</th>
                <th className="py-4 px-5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-[var(--border-color)] font-mono font-bold">
              {feeOverview?.term_details.map((t) => (
                <tr key={t.term_name}>
                  <td className="py-4 px-5 font-sans font-extrabold border-r border-[var(--border-color)]">{t.term_name}</td>
                  <td className="py-4 px-5 text-right border-r border-[var(--border-color)]">₹{t.expected_amount.toLocaleString()}</td>
                  <td className="py-4 px-5 text-right text-[var(--pill-paid-text)] border-r border-[var(--border-color)]">₹{t.paid_amount.toLocaleString()}</td>
                  <td className="py-4 px-5 text-right text-[var(--pill-due-text)] border-r border-[var(--border-color)]">₹{t.due_amount.toLocaleString()}</td>
                  <td className="py-4 px-5 text-center font-sans">
                    <span className={`px-3 py-1 rounded text-xs font-extrabold uppercase border ${t.status === 'Paid'
                        ? 'bg-[var(--pill-paid-bg)] text-[var(--pill-paid-text)] border-[var(--pill-paid-border)]'
                        : 'bg-[var(--pill-due-bg)] text-[var(--pill-due-text)] border-[var(--pill-due-border)]'
                      }`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 5: PAYMENT HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] p-6 rounded-2xl shadow-sm space-y-4 w-full">
          <h3 className="font-extrabold font-heading text-[var(--text-primary)] uppercase tracking-wider border-b-2 border-[var(--border-color)] pb-3" style={{ fontSize: '22px' }}>
            Fee Payment History Receipts
          </h3>

          {profileData.payment_history.length === 0 ? (
            <p className="text-[var(--text-secondary)] font-bold text-center py-8" style={{ fontSize: '20px' }}>No fee payment receipts recorded yet.</p>
          ) : (
            <table className="w-full text-left border-2 border-[var(--border-color)] rounded-xl ledger-table" style={{ fontSize: '20px' }}>
              <thead className="bg-[var(--bg-table-head)] font-extrabold uppercase border-b-2 border-[var(--border-color)]">
                <tr>
                  <th className="py-4 px-5 border-r border-[var(--border-color)]">Receipt No</th>
                  <th className="py-4 px-5 border-r border-[var(--border-color)]">Payment Date</th>
                  <th className="py-4 px-5 text-right border-r border-[var(--border-color)]">Amount (₹)</th>
                  <th className="py-4 px-5 border-r border-[var(--border-color)]">Method</th>
                  <th className="py-4 px-5 border-r border-[var(--border-color)]">Terms Covered</th>
                  <th className="py-4 px-5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-[var(--border-color)] font-mono font-bold">
                {profileData.payment_history.map((pm) => (
                  <tr key={pm.id}>
                    <td className="py-4 px-5 font-extrabold text-indigo-600 border-r border-[var(--border-color)]">{pm.receipt_no}</td>
                    <td className="py-4 px-5 border-r border-[var(--border-color)]">{pm.payment_date}</td>
                    <td className="py-4 px-5 text-right text-emerald-700 font-extrabold text-xl border-r border-[var(--border-color)]">₹{pm.total_amount.toLocaleString('en-IN')}</td>
                    <td className="py-4 px-5 font-sans border-r border-[var(--border-color)]">
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200 text-xs font-mono font-bold uppercase">
                        {pm.payment_method}
                      </span>
                    </td>
                    <td className="py-4 px-5 font-sans border-r border-[var(--border-color)]">{(pm.terms_covered || []).join(', ')}</td>
                    <td className="py-4 px-5 text-center font-sans">
                      <button
                        onClick={() => {
                          printDataset({
                            title: "CANISIUS SECONDARY SCHOOL — OFFICIAL FEE RECEIPT",
                            subtitle: `Receipt No: ${pm.receipt_no} • Payment Ref No: ${pm.payment_no}`,
                            academicYear: pm.academic_year || '2026–2027',
                            columns: [
                              { header: 'Payment Field', accessor: (r: any) => r.label, width: '40%' },
                              { header: 'Information', accessor: (r: any) => r.value, width: '60%' },
                            ],
                            data: [
                              { label: 'Student PayID', value: student.pay_id },
                              { label: 'Student Name', value: student.name },
                              { label: 'Class & Section', value: `Standard ${student.current_standard}-${student.current_section}` },
                              { label: 'Payment Date', value: pm.payment_date },
                              { label: 'Payment Method', value: pm.payment_method },
                              { label: 'Terms Paid', value: (pm.terms_covered || []).join(', ') },
                              { label: 'Amount Paid', value: `₹${pm.total_amount.toLocaleString('en-IN')}` },
                              { label: 'Receipt Reference', value: pm.receipt_no },
                              { label: 'Remarks', value: pm.remarks || 'None' },
                            ],
                          });
                        }}
                        className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl font-extrabold text-sm border border-amber-300 transition cursor-pointer"
                      >
                        Print Slip
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB 6: POCKET MONEY */}
      {activeTab === 'pocket' && isHosteller && (
        <div className="bg-[var(--bg-card)] border-2 border-[var(--border-color)] p-6 rounded-2xl shadow-sm space-y-4 w-full">
          <h3 className="font-extrabold font-heading text-[var(--text-primary)] uppercase tracking-wider border-b-2 border-[var(--border-color)] pb-3" style={{ fontSize: '22px' }}>
            Boarder Pocket Money Ledger Log
          </h3>

          <table className="w-full text-left border-2 border-[var(--border-color)] rounded-xl ledger-table" style={{ fontSize: '20px' }}>
            <thead className="bg-[var(--bg-table-head)] font-extrabold uppercase border-b-2 border-[var(--border-color)]">
              <tr>
                <th className="py-4 px-5 border-r border-[var(--border-color)]">Date</th>
                <th className="py-4 px-5 border-r border-[var(--border-color)]">Transaction Type</th>
                <th className="py-4 px-5 text-right border-r border-[var(--border-color)]">Amount (₹)</th>
                <th className="py-4 px-5">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-[var(--border-color)] font-mono font-bold">
              {profileData.pocket_transactions.map((tx: any) => (
                <tr key={tx.id}>
                  <td className="py-4 px-5 border-r border-[var(--border-color)]">{tx.transaction_date}</td>
                  <td className="py-4 px-5 font-sans font-extrabold border-r border-[var(--border-color)]">{tx.transaction_type.replace('_', ' ')}</td>
                  <td className="py-4 px-5 text-right text-[var(--pill-paid-text)] border-r border-[var(--border-color)]">₹{tx.amount.toLocaleString()}</td>
                  <td className="py-4 px-5 font-sans text-sm">{tx.remarks || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};

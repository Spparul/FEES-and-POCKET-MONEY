import React, { useState } from 'react';
import { createStudent } from '../api';
import { X, UserPlus, Lock, AlertCircle } from 'lucide-react';

interface AddStudentModalProps {
  isLocked: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isLocked,
  onClose,
  onSuccess,
}) => {
  const currentYear = 2026;
  const [admissionNo, setAdmissionNo] = useState(`ADM-${currentYear}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [name, setName] = useState('');
  const [dob, setDob] = useState('2010-05-15');
  const [admissionYear, setAdmissionYear] = useState(currentYear);
  const [standard, setStandard] = useState('XI');
  const [section, setSection] = useState('B');
  const [boardingCategory, setBoardingCategory] = useState<'DAY_SCHOLAR' | 'HOSTEL_ORDINARY' | 'HOSTEL_SPECIAL'>('DAY_SCHOLAR');
  const [fatherName, setFatherName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [additionalContact, setAdditionalContact] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSectionOptions = (std: string) => {
    if (std === 'VIII' || std === 'IX') {
      return ['E', 'EE', 'G', 'GG'];
    }
    return ['A', 'B', 'S'];
  };

  const handleStandardChange = (newStd: string) => {
    setStandard(newStd);
    const validSections = getSectionOptions(newStd);
    if (!validSections.includes(section)) {
      setSection(validSections[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !fatherName.trim() || !contactNo.trim()) {
      setError("Please fill in all required fields (Student Name, Father Name, Contact No).");
      return;
    }

    if (isLocked && !adminPassword) {
      setError("Student Register is locked. Administrator password is required.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await createStudent(
        {
          admission_no: admissionNo,
          name: name.trim(),
          dob,
          admission_year: admissionYear,
          father_name: fatherName.trim(),
          contact_no: contactNo.trim(),
          additional_contact: additionalContact.trim() || undefined,
          boarding_category: boardingCategory,
          standard,
          section,
          date_of_admission: new Date().toISOString().split('T')[0],
        },
        isLocked ? adminPassword : undefined
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to register student");
    } finally {
      setSubmitting(false);
    }
  };

  const availableSections = getSectionOptions(standard);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm font-sans">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl text-slate-900">
        
        {/* Header */}
        <div className="px-6 py-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Register New Student</h3>
              <p className="text-xs text-slate-600 font-medium">Student Master Entry Form</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-700 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isLocked && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-semibold flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-700 flex-shrink-0" />
              <span>Register is LOCKED. Administrator password required to confirm entry.</span>
            </div>
          )}

          {/* Identification Section */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 mb-1 font-bold">Admission No</label>
              <input
                type="text"
                value={admissionNo}
                onChange={(e) => setAdmissionNo(e.target.value)}
                required
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-slate-700 mb-1 font-bold">Student Full Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Arun Kumar"
                required
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          {/* DOB & Admission Year */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 mb-1 font-bold">Date of Birth</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                required
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1 font-bold">Admission Year</label>
              <input
                type="number"
                value={admissionYear}
                onChange={(e) => setAdmissionYear(parseInt(e.target.value))}
                required
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          {/* Standard & Dynamic Section Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 mb-1 font-bold">Standard</label>
              <select
                value={standard}
                onChange={(e) => handleStandardChange(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-indigo-600"
              >
                <option value="VIII">Grade 8</option>
                <option value="IX">Grade 9</option>
                <option value="X">Grade 10</option>
                <option value="XI">Grade 11</option>
                <option value="XII">Grade 12</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 mb-1 font-bold">Section (Allowed for {standard})</label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-indigo-600"
              >
                {availableSections.map((sec) => (
                  <option key={sec} value={sec}>Section {sec}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Boarding Category */}
          <div>
            <label className="block text-slate-700 mb-1 font-bold">Boarding Category</label>
            <select
              value={boardingCategory}
              onChange={(e) => setBoardingCategory(e.target.value as any)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-indigo-600"
            >
              <option value="DAY_SCHOLAR">Day Scholar (₹1,500 / term)</option>
              <option value="HOSTEL_ORDINARY">Hosteller — Ordinary (₹2,800 / term)</option>
              <option value="HOSTEL_SPECIAL">Hosteller — Special Scheme (₹4,400 / term)</option>
            </select>
          </div>

          {/* Parent Details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 mb-1 font-bold">Father / Guardian Name *</label>
              <input
                type="text"
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                required
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block text-slate-700 mb-1 font-bold">Contact Number *</label>
              <input
                type="text"
                value={contactNo}
                onChange={(e) => setContactNo(e.target.value)}
                required
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          {/* Additional Contact */}
          <div>
            <label className="block text-slate-700 mb-1 font-bold">Additional Contact / Address (Optional)</label>
            <input
              type="text"
              value={additionalContact}
              onChange={(e) => setAdditionalContact(e.target.value)}
              placeholder="Alternative phone or notes"
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-indigo-600"
            />
          </div>

          {/* Lock Admin Authorization */}
          {isLocked && (
            <div>
              <label className="block text-amber-800 font-extrabold mb-1">
                Administrator Password Required *
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter admin password (e.g. admin123)"
                required
                className="w-full bg-amber-50 border border-amber-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-amber-600"
              />
            </div>
          )}

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
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold shadow-sm transition disabled:opacity-50"
            >
              {submitting ? 'Registering...' : 'Register Student'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

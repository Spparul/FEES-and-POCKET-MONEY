import React, { useState } from 'react';
import { createStudent } from '../api';
import { UserPlus, ArrowLeft, ShieldAlert } from 'lucide-react';

type BoardingCategoryType = 'DAY_SCHOLAR' | 'HOSTEL_ORDINARY' | 'HOSTEL_SPECIAL';
type StandardType = 'VIII' | 'IX' | 'X' | 'XI' | 'XII';
type SectionType = 'E' | 'EE' | 'G' | 'GG' | 'A' | 'B' | 'S';

interface AddStudentViewProps {
  isLocked: boolean;
  onBack: () => void;
  onSuccess: () => void;
}

export const AddStudentView: React.FC<AddStudentViewProps> = ({
  isLocked,
  onBack,
  onSuccess,
}) => {
  const [admissionNo, setAdmissionNo] = useState(`ADM-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [name, setName] = useState('');
  const [dob, setDob] = useState('2012-05-15');
  const [admissionYear, setAdmissionYear] = useState(2026);
  const [fatherName, setFatherName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [additionalContact, setAdditionalContact] = useState('');
  const [address, setAddress] = useState('');
  const [boardingCategory, setBoardingCategory] = useState<BoardingCategoryType>('DAY_SCHOLAR');
  const [standard, setStandard] = useState<StandardType>('VIII');
  const [section, setSection] = useState<SectionType>('E');
  const [adminPassword, setAdminPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStandardChange = (std: StandardType) => {
    setStandard(std);
    if (std === 'VIII' || std === 'IX') {
      setSection('E');
    } else {
      setSection('A');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !admissionNo || !fatherName || !contactNo) {
      setError('Please fill in all required fields (Name, Admission No, Father Name, Contact No).');
      return;
    }
    if (isLocked && !adminPassword) {
      setError('Student Register is locked. Administrator password is required to enroll a new student.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createStudent({
        admission_no: admissionNo,
        name,
        dob,
        admission_year: Number(admissionYear),
        father_name: fatherName,
        contact_no: contactNo,
        additional_contact: additionalContact || undefined,
        address: address || undefined,
        boarding_category: boardingCategory,
        standard,
        section,
      }, isLocked ? adminPassword : undefined);

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to enroll new student record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 font-sans animate-fadeIn w-full">
      
      {/* Back Button & Header */}
      <div className="bg-[var(--bg-card)] p-6 sm:p-8 rounded-2xl border-2 border-[var(--border-color)] shadow-sm space-y-4 w-full">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--bg-page)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border-2 border-[var(--border-color)] font-bold transition cursor-pointer"
            style={{ fontSize: '20px' }}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Student Register</span>
          </button>

          <span className="font-mono font-bold text-[var(--text-secondary)]" style={{ fontSize: '18px' }}>
            New Student Master Registration Form
          </span>
        </div>

        <div className="flex items-center gap-4 pt-2">
          <div className="w-12 h-12 rounded-xl bg-[var(--accent-gold)] text-slate-950 flex items-center justify-center font-bold">
            <UserPlus className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-[var(--text-primary)]" style={{ fontSize: '32px' }}>
              Enroll New Student Record
            </h1>
            <p className="text-[var(--text-secondary)] font-bold mt-1" style={{ fontSize: '20px' }}>
              Fill in student academic, boarding category, contact, and residential address details.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-5 rounded-2xl bg-red-500/10 border-2 border-red-500/30 text-red-700 flex items-center gap-3 w-full" style={{ fontSize: '20px' }}>
          <ShieldAlert className="w-6 h-6 text-red-600 flex-shrink-0" />
          <span className="font-bold">{error}</span>
        </div>
      )}

      {/* FULL PAGE FORM CONTAINER */}
      <form onSubmit={handleSubmit} className="space-y-8 w-full">
        
        {/* SECTION 1: ACADEMIC & ENROLLMENT INFORMATION */}
        <div className="bg-[var(--bg-card)] p-6 sm:p-8 rounded-2xl border-2 border-[var(--border-color)] shadow-sm space-y-6 w-full">
          <h3 className="font-extrabold font-heading text-[var(--text-primary)] uppercase tracking-wider border-b-2 border-[var(--border-color)] pb-3" style={{ fontSize: '24px' }}>
            1. Academic & Enrollment Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            
            {/* Student Full Name */}
            <div>
              <label className="block font-bold text-[var(--text-primary)] mb-2" style={{ fontSize: '20px' }}>
                Student Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sanjay Deshmukh"
                className="w-full bg-[var(--bg-page)] border-2 border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-primary)] font-bold focus:outline-none focus:border-[var(--accent-gold)]"
                style={{ fontSize: '20px' }}
              />
            </div>

            {/* Admission Number */}
            <div>
              <label className="block font-bold text-[var(--text-primary)] mb-2" style={{ fontSize: '20px' }}>
                Admission Number *
              </label>
              <input
                type="text"
                required
                value={admissionNo}
                onChange={(e) => setAdmissionNo(e.target.value)}
                className="w-full bg-[var(--bg-page)] border-2 border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-primary)] font-mono font-bold focus:outline-none focus:border-[var(--accent-gold)]"
                style={{ fontSize: '20px' }}
              />
            </div>

            {/* Boarding Category */}
            <div>
              <label className="block font-bold text-[var(--text-primary)] mb-2" style={{ fontSize: '20px' }}>
                Boarding Fee Category *
              </label>
              <select
                value={boardingCategory}
                onChange={(e) => setBoardingCategory(e.target.value as BoardingCategoryType)}
                className="w-full bg-[var(--bg-page)] border-2 border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-primary)] font-bold focus:outline-none focus:border-[var(--accent-gold)] cursor-pointer"
                style={{ fontSize: '20px' }}
              >
                <option value="DAY_SCHOLAR">Day Scholar (₹1,500/term)</option>
                <option value="HOSTEL_ORDINARY">Hostel — Ordinary (₹2,800/term)</option>
                <option value="HOSTEL_SPECIAL">Hostel — Special Scheme (₹4,400/term)</option>
              </select>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-[var(--border-color)] w-full">
            
            {/* Standard */}
            <div>
              <label className="block font-bold text-[var(--text-primary)] mb-2" style={{ fontSize: '20px' }}>
                Standard (Class) *
              </label>
              <select
                value={standard}
                onChange={(e) => handleStandardChange(e.target.value as StandardType)}
                className="w-full bg-[var(--bg-page)] border-2 border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-primary)] font-bold focus:outline-none focus:border-[var(--accent-gold)] cursor-pointer"
                style={{ fontSize: '20px' }}
              >
                <option value="VIII">Grade 8</option>
                <option value="IX">Grade 9</option>
                <option value="X">Grade 10</option>
                <option value="XI">Grade 11</option>
                <option value="XII">Grade 12</option>
              </select>
            </div>

            {/* Section */}
            <div>
              <label className="block font-bold text-[var(--text-primary)] mb-2" style={{ fontSize: '20px' }}>
                Section *
              </label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value as SectionType)}
                className="w-full bg-[var(--bg-page)] border-2 border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-primary)] font-bold focus:outline-none focus:border-[var(--accent-gold)] cursor-pointer"
                style={{ fontSize: '20px' }}
              >
                {standard === 'VIII' || standard === 'IX' ? (
                  <>
                    <option value="E">Section E</option>
                    <option value="EE">Section EE</option>
                    <option value="G">Section G</option>
                    <option value="GG">Section GG</option>
                  </>
                ) : (
                  <>
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="S">Section S</option>
                  </>
                )}
              </select>
            </div>

            {/* Admission Year */}
            <div>
              <label className="block font-bold text-[var(--text-primary)] mb-2" style={{ fontSize: '20px' }}>
                Admission Year *
              </label>
              <input
                type="number"
                required
                value={admissionYear}
                onChange={(e) => setAdmissionYear(Number(e.target.value))}
                className="w-full bg-[var(--bg-page)] border-2 border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-primary)] font-mono font-bold focus:outline-none focus:border-[var(--accent-gold)]"
                style={{ fontSize: '20px' }}
              />
            </div>

          </div>
        </div>

        {/* SECTION 2: PERSONAL & CONTACT INFORMATION WITH RESIDENTIAL ADDRESS */}
        <div className="bg-[var(--bg-card)] p-6 sm:p-8 rounded-2xl border-2 border-[var(--border-color)] shadow-sm space-y-6 w-full">
          <h3 className="font-extrabold font-heading text-[var(--text-primary)] uppercase tracking-wider border-b-2 border-[var(--border-color)] pb-3" style={{ fontSize: '24px' }}>
            2. Personal, Contact & Residential Address
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            
            {/* Father / Guardian Name */}
            <div>
              <label className="block font-bold text-[var(--text-primary)] mb-2" style={{ fontSize: '20px' }}>
                Father / Guardian Name *
              </label>
              <input
                type="text"
                required
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                placeholder="e.g. Rajesh Deshmukh"
                className="w-full bg-[var(--bg-page)] border-2 border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-primary)] font-bold focus:outline-none focus:border-[var(--accent-gold)]"
                style={{ fontSize: '20px' }}
              />
            </div>

            {/* Contact Phone Number */}
            <div>
              <label className="block font-bold text-[var(--text-primary)] mb-2" style={{ fontSize: '20px' }}>
                Contact Phone Number *
              </label>
              <input
                type="text"
                required
                value={contactNo}
                onChange={(e) => setContactNo(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full bg-[var(--bg-page)] border-2 border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-primary)] font-mono font-bold focus:outline-none focus:border-[var(--accent-gold)]"
                style={{ fontSize: '20px' }}
              />
            </div>

            {/* Additional Contact Number */}
            <div>
              <label className="block font-bold text-[var(--text-primary)] mb-2" style={{ fontSize: '20px' }}>
                Alt / Emergency Contact Number
              </label>
              <input
                type="text"
                value={additionalContact}
                onChange={(e) => setAdditionalContact(e.target.value)}
                placeholder="e.g. 9876543211 (Optional)"
                className="w-full bg-[var(--bg-page)] border-2 border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-primary)] font-mono font-bold focus:outline-none focus:border-[var(--accent-gold)]"
                style={{ fontSize: '20px' }}
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block font-bold text-[var(--text-primary)] mb-2" style={{ fontSize: '20px' }}>
                Date of Birth *
              </label>
              <input
                type="date"
                required
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full bg-[var(--bg-page)] border-2 border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-primary)] font-mono font-bold focus:outline-none focus:border-[var(--accent-gold)]"
                style={{ fontSize: '20px' }}
              />
            </div>

          </div>

          {/* FULL RESIDENTIAL ADDRESS TEXTAREA */}
          <div className="pt-4 border-t border-[var(--border-color)] w-full">
            <label className="block font-bold text-[var(--text-primary)] mb-2" style={{ fontSize: '20px' }}>
              Full Residential Address
            </label>
            <textarea
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Door No / House Name, Street Name, Locality / Town, City, State, Pincode..."
              className="w-full bg-[var(--bg-page)] border-2 border-[var(--border-color)] rounded-xl p-4 text-[var(--text-primary)] font-bold focus:outline-none focus:border-[var(--accent-gold)]"
              style={{ fontSize: '20px' }}
            />
          </div>
        </div>

        {/* SECTION 3: ADMIN SECURITY AUTHORIZATION */}
        {isLocked && (
          <div className="bg-amber-500/10 border-2 border-amber-500/30 p-6 rounded-2xl space-y-3 w-full">
            <label className="block font-extrabold text-amber-900 mb-1" style={{ fontSize: '20px' }}>
              🔒 Register Security Authorization Required
            </label>
            <p className="text-amber-800 font-semibold" style={{ fontSize: '18px' }}>
              Student Register is currently locked. Enter administrator password to commit this new record.
            </p>
            <input
              type="password"
              required
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Enter administrator password..."
              className="w-full bg-white border-2 border-amber-500/50 rounded-xl px-4 py-3 text-slate-900 font-bold focus:outline-none focus:border-amber-600"
              style={{ fontSize: '20px' }}
            />
          </div>
        )}

        {/* FORM ACTIONS */}
        <div className="flex items-center justify-end gap-4 pt-4 w-full">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-3.5 rounded-xl bg-[var(--bg-page)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border-2 border-[var(--border-color)] font-bold transition cursor-pointer"
            style={{ fontSize: '20px' }}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3.5 rounded-xl bg-[var(--accent-gold)] text-slate-950 font-extrabold shadow-md hover:brightness-110 transition cursor-pointer disabled:opacity-50"
            style={{ fontSize: '22px' }}
          >
            {loading ? 'Enrolling Record...' : 'Save New Student Master Record'}
          </button>
        </div>

      </form>

    </div>
  );
};

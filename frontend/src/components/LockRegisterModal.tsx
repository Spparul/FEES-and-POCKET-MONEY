import React, { useState } from 'react';
import { toggleRegisterLock } from '../api';
import { X, Lock, Unlock, AlertCircle } from 'lucide-react';

interface LockRegisterModalProps {
  isCurrentlyLocked: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const LockRegisterModal: React.FC<LockRegisterModalProps> = ({
  isCurrentlyLocked,
  onClose,
  onSuccess,
}) => {
  const [adminPassword, setAdminPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async (lock: boolean) => {
    if (!adminPassword) {
      setError("Administrator password is required.");
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      await toggleRegisterLock(adminPassword, lock);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to toggle register lock");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm font-sans">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl text-slate-900">
        
        {/* Header */}
        <div className="px-6 py-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border font-bold ${
              isCurrentlyLocked
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {isCurrentlyLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Student Register Lock</h3>
              <p className="text-xs text-slate-600 font-medium">Administrator Security Control</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-800 space-y-2">
            <p className="font-bold text-slate-900 text-sm">
              Current Lock Status: <span className={isCurrentlyLocked ? 'text-amber-800 font-extrabold' : 'text-emerald-800 font-extrabold'}>
                {isCurrentlyLocked ? 'LOCKED' : 'UNLOCKED'}
              </span>
            </p>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              When locked, office staff users cannot add, remove, or deactivate student records without administrator authentication.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-700 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-slate-800 font-bold mb-1">
              Administrator Password *
            </label>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Enter admin password (admin123)"
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200">
            {isCurrentlyLocked ? (
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleToggle(false)}
                className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-sm transition flex items-center justify-center gap-2"
              >
                <Unlock className="w-4 h-4" />
                <span>UNLOCK STUDENT REGISTER</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleToggle(true)}
                className="w-full py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold shadow-sm transition flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>LOCK STUDENT REGISTER</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

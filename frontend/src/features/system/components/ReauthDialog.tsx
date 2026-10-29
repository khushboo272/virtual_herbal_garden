import React, { useState } from 'react';
import { Shield, KeyRound, Smartphone, AlertCircle, Loader2 } from 'lucide-react';

import { systemApi } from '../api/system.api';

interface ReauthDialogProps {
  isOpen: boolean;
  onClose?: () => void;
  onCancel?: () => void;
  onSubmit?: (password?: string, totpCode?: string) => Promise<any>;
  onSuccess?: (reauthToken: string) => void;
  isLoading?: boolean;
  errorMessage?: string | null;
  actionTitle?: string;
  actionDescription?: string;
}

export const ReauthDialog: React.FC<ReauthDialogProps> = ({
  isOpen,
  onClose,
  onCancel,
  onSubmit,
  onSuccess,
  isLoading = false,
  errorMessage = null,
  actionTitle = 'Security Re-Authentication Required',
  actionDescription = 'This action requires recent authorization. Please verify your identity with your password or authenticator code.',
}) => {
  const [method, setMethod] = useState<'password' | 'totp'>('password');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleDismiss = () => {
    if (onClose) onClose();
    else if (onCancel) onCancel();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const pwd = method === 'password' ? password.trim() : undefined;
    const totp = method === 'totp' ? totpCode.trim() : undefined;

    if (method === 'password' && !pwd) {
      setLocalError('Please enter your account password.');
      return;
    }
    if (method === 'totp' && !totp) {
      setLocalError('Please enter your 6-digit 2FA code or backup code.');
      return;
    }

    try {
      setSubmitting(true);
      if (onSubmit) {
        await onSubmit(pwd, totp);
      } else if (onSuccess) {
        const res = await systemApi.reauth(pwd, totp);
        onSuccess(res.reauthToken);
      }
      setPassword('');
      setTotpCode('');
    } catch (err: any) {
      setLocalError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const displayError = localError || errorMessage;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border-2 border-emerald-200 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="bg-emerald-800 text-white p-6 relative">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-700/60 rounded-xl border border-emerald-600/40">
              <Shield className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{actionTitle}</h3>
              <p className="text-xs text-emerald-200 mt-0.5">5-Minute Step-Up Authorization</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <p className="text-sm text-gray-600 leading-relaxed">{actionDescription}</p>

          {/* Mode Selector */}
          <div className="flex p-1 bg-emerald-50 rounded-xl border border-emerald-100">
            <button
              type="button"
              onClick={() => { setMethod('password'); setLocalError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-colors ${
                method === 'password'
                  ? 'bg-white text-emerald-800 shadow-sm border border-emerald-200'
                  : 'text-gray-600 hover:text-emerald-800'
              }`}
            >
              <KeyRound className="w-4 h-4 text-emerald-600" />
              Password
            </button>
            <button
              type="button"
              onClick={() => { setMethod('totp'); setLocalError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-colors ${
                method === 'totp'
                  ? 'bg-white text-emerald-800 shadow-sm border border-emerald-200'
                  : 'text-gray-600 hover:text-emerald-800'
              }`}
            >
              <Smartphone className="w-4 h-4 text-emerald-600" />
              2FA / Backup Code
            </button>
          </div>

          {/* Error Banner */}
          {displayError && (
            <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{displayError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {method === 'password' ? (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Account Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your current password"
                  autoComplete="current-password"
                  autoFocus
                  disabled={isLoading}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  6-Digit TOTP Code or Backup Code
                </label>
                <input
                  type="text"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  placeholder="e.g. 123456 or XXXX-XXXX"
                  autoFocus
                  disabled={isLoading}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={handleDismiss}
                disabled={isLoading || submitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || submitting}
                className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50"
              >
                {(isLoading || submitting) && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm & Proceed
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

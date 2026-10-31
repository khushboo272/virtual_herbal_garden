import React, { useState } from 'react';
import { AlertTriangle, Lock } from 'lucide-react';

interface ConfirmDangerDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmKeyword: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmDangerDialog: React.FC<ConfirmDangerDialogProps> = ({
  isOpen,
  title,
  message,
  confirmKeyword,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  const [typedKeyword, setTypedKeyword] = useState('');

  if (!isOpen) return null;

  const isMatched = typedKeyword.trim().toLowerCase() === confirmKeyword.trim().toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-200 dark:border-red-900/40 space-y-4">
        <div className="flex items-center space-x-3 text-red-600 dark:text-red-400">
          <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/60">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
            <p className="text-xs text-red-600 dark:text-red-400">Destructive Administrative Action</p>
          </div>
        </div>

        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
          {message}
        </p>

        <div className="space-y-1.5 pt-2">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
            To proceed, type <span className="font-mono font-bold text-red-600 dark:text-red-400 select-all">{confirmKeyword}</span> below:
          </label>
          <input
            type="text"
            value={typedKeyword}
            onChange={(e) => setTypedKeyword(e.target.value)}
            disabled={isLoading}
            placeholder={confirmKeyword}
            className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-gray-300 dark:border-gray-750 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
          />
        </div>

        <div className="flex justify-end space-x-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!isMatched || isLoading}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Processing...' : 'Confirm & Execute'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};


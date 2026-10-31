import React, { useState, useEffect } from 'react';
import { Check, Copy, AlertCircle, Sparkles } from 'lucide-react';

interface JsonEditorProps {
  value: string;
  onChange: (val: string) => void;
  readOnly?: boolean;
  minHeight?: string;
  className?: string;
}

export const JsonEditor: React.FC<JsonEditorProps> = ({
  value,
  onChange,
  readOnly = false,
  minHeight = '320px',
  className = '',
}) => {
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!value.trim()) {
      setJsonError(null);
      return;
    }
    try {
      JSON.parse(value);
      setJsonError(null);
    } catch (err: any) {
      setJsonError(err.message);
    }
  }, [value]);

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(value);
      onChange(JSON.stringify(parsed, null, 2));
      setJsonError(null);
    } catch (err: any) {
      setJsonError(`Cannot format invalid JSON: ${err.message}`);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Compute line count
  const lineCount = value.split('\n').length;
  const lineNumbers = Array.from({ length: Math.max(lineCount, 1) }, (_, i) => i + 1);

  return (
    <div className={`relative flex flex-col rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-900 text-gray-100 font-mono text-xs overflow-hidden shadow-inner ${className}`}>
      {/* Editor toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-950 border-b border-gray-800 text-gray-400">
        <div className="flex items-center space-x-2">
          <span className="h-3 w-3 rounded-full bg-red-500/80 inline-block" />
          <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block" />
          <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block" />
          <span className="text-gray-400 text-xs ml-2 font-sans font-medium">JSON Document</span>
        </div>

        <div className="flex items-center space-x-2 font-sans">
          {!readOnly && (
            <button
              type="button"
              onClick={handleFormat}
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-emerald-400 transition"
              title="Format & Beautify JSON"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Format</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex flex-1 overflow-auto" style={{ minHeight }}>
        {/* Line numbers gutter */}
        <div className="select-none py-3 px-3 bg-gray-950/60 text-gray-600 text-right font-mono text-xs border-r border-gray-800 w-12">
          {lineNumbers.map((n) => (
            <div key={n} className="leading-5">{n}</div>
          ))}
        </div>

        {/* Text Area */}
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly}
          spellCheck={false}
          className="flex-1 bg-transparent py-3 px-4 text-emerald-300 placeholder-gray-600 font-mono text-xs leading-5 resize-none focus:outline-none"
          placeholder="Paste or edit JSON here..."
        />
      </div>

      {/* Error alert pill */}
      {jsonError && (
        <div className="flex items-center space-x-2 px-4 py-2 bg-red-950/80 border-t border-red-800/80 text-red-300 font-sans text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
          <span className="truncate">Syntax Error: {jsonError}</span>
        </div>
      )}
    </div>
  );
};


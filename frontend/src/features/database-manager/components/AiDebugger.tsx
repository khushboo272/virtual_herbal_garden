import React, { useState } from 'react';
import { Sparkles, Bot, Loader2, Copy, Check, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { databaseApi } from '../api/databaseApi';

interface AiDebuggerProps {
  errorMessage: string | null;
  context?: {
    collection?: string;
    operation?: string;
    mode?: string;
    payloadSnippet?: string;
  };
  className?: string;
}

export const AiDebugger: React.FC<AiDebuggerProps> = ({
  errorMessage,
  context,
  className = '',
}) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [modelName, setModelName] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  if (!errorMessage) {
    return null;
  }

  const handleDebug = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      setIsOpen(true);
      const res = await databaseApi.debugError({
        errorMessage,
        context,
      });
      setAnalysis(res.analysis);
      setModelName(res.model);
    } catch (err: any) {
      setFetchError(err.message || 'AI diagnosis request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!analysis) return;
    try {
      await navigator.clipboard.writeText(analysis);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Trigger Button */}
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={handleDebug}
          disabled={loading}
          aria-label="AI Debugger"
          className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-sm transition disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
          )}
          <span>{loading ? 'Analyzing with Gemini...' : 'AI Debugger'}</span>
        </button>

        {isOpen && analysis && (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 inline-flex items-center space-x-1"
          >
            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{isOpen ? 'Collapse AI Analysis' : 'Expand AI Analysis'}</span>
          </button>
        )}
      </div>

      {/* Expandable Diagnosis Card */}
      {isOpen && (
        <div className="p-4 rounded-2xl bg-white dark:bg-gray-850 border border-purple-200 dark:border-purple-900/60 shadow-md space-y-3 transition">
          {/* Card Header */}
          <div className="flex items-center justify-between border-b pb-2 dark:border-gray-800">
            <div className="flex items-center space-x-2">
              <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                Gemini AI Root Cause Diagnosis
              </span>
              {modelName && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-purple-50 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  {modelName}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {analysis && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy Fix'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Loading / Error / Content */}
          {loading ? (
            <div className="py-6 flex flex-col items-center justify-center space-y-2 text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
              <p className="text-xs font-medium">Consulting Gemini taxonomist and diagnostic model...</p>
            </div>
          ) : fetchError ? (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-xl flex items-center space-x-2 text-red-700 dark:text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{fetchError}</span>
            </div>
          ) : analysis ? (
            <div className="prose prose-xs dark:prose-invert max-w-none text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed font-sans">
              {analysis}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};


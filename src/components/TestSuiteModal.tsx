import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import {
  Sparkles,
  X,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  ShieldCheck,
} from 'lucide-react';

interface TestSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TestSuiteModal: React.FC<TestSuiteModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [suiteData, setSuiteData] = useState<{
    total: number;
    passed: number;
    failed: number;
    durationMs: number;
    results: { name: string; passed: boolean; message?: string }[];
  } | null>(null);

  const runTests = async () => {
    setLoading(true);
    try {
      const res = await api.runSystemTests();
      setSuiteData(res);
    } catch (err: any) {
      alert(err.message || 'Failed to run test suite');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !suiteData) {
      runTests();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 p-6 animate-in zoom-in-95 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Subhu Automated Test & Verification Engine
              </h3>
              <p className="text-[11px] text-slate-400">
                Executable regression, authorization matrix, concurrency, and privacy verification
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metrics Row */}
        {suiteData && (
          <div className="grid grid-cols-4 gap-3 mt-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Total Tests
              </span>
              <span className="text-lg font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
                {suiteData.total}
              </span>
            </div>

            <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 text-center">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider block">
                Passed
              </span>
              <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                {suiteData.passed}
              </span>
            </div>

            <div className="p-3 bg-rose-50/50 dark:bg-rose-950/30 rounded-2xl border border-rose-100 dark:border-rose-900/40 text-center">
              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider block">
                Failed
              </span>
              <span className="text-lg font-extrabold text-rose-600 dark:text-rose-400 font-mono tabular-nums">
                {suiteData.failed}
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Execution
              </span>
              <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 font-mono tabular-nums">
                {suiteData.durationMs}ms
              </span>
            </div>
          </div>
        )}

        {/* Itemized Test Results List */}
        <div className="mt-5 space-y-2 max-h-80 overflow-y-auto pr-1">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
              <span>Executing test suite against database...</span>
            </div>
          ) : suiteData ? (
            suiteData.results.map((res, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 flex items-start justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-2.5">
                  {res.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h5 className="font-semibold text-slate-900 dark:text-white leading-tight">
                      {res.name}
                    </h5>
                    {res.message && (
                      <p className="text-[11px] text-rose-500 font-mono mt-0.5">{res.message}</p>
                    )}
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 font-mono ${
                    res.passed
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}
                >
                  {res.passed ? 'PASSED' : 'FAILED'}
                </span>
              </div>
            ))
          ) : null}
        </div>

        {/* Action Toolbar */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Server-side verified invariants & policies</span>
          </div>

          <button
            onClick={runTests}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Re-run Test Suite</span>
          </button>
        </div>
      </div>
    </div>
  );
};

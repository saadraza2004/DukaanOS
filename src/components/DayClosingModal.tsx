'use client';

import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Calculator,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';
import { DayClosingSummary } from '../types';
import { ApiClient } from '../lib/api';

interface DayClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DayClosingModal: React.FC<DayClosingModalProps> = ({ isOpen, onClose }) => {
  const [summary, setSummary] = useState<DayClosingSummary | null>(null);
  const [openingCash, setOpeningCash] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Pakistani Currency denomination counts
  const [denominations, setDenominations] = useState<{ [key: number]: number }>({
    5000: 0,
    1000: 0,
    500: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0,
  });

  const [looseCash, setLooseCash] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      loadSummary(openingCash);
    }
  }, [isOpen, openingCash]);

  const loadSummary = async (open: number) => {
    try {
      const data = await ApiClient.getDayClosingSummary(open);
      setSummary(data);
    } catch (e) {
      console.error(e);
    }
  };

  const countedDenominationsTotal = Object.entries(denominations).reduce(
    (acc, [val, count]) => acc + parseInt(val) * (count || 0),
    0
  );

  const actualCashCounted = countedDenominationsTotal + (looseCash || 0);
  const expectedCash = summary ? summary.expectedCash : 0;
  const variance = actualCashCounted - expectedCash;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await ApiClient.submitDayClosing({
        openingCash,
        actualCashCounted,
        notes,
      });
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 2000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error submitting closing');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-5 text-slate-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <CalendarCheck className="w-6 h-6 text-amber-400" />
            <div>
              <h2 className="text-lg font-black text-white">Daily Day Closing (روزانہ حساب کتاب / دن کا اختتام)</h2>
              <p className="text-xs text-slate-400">Reconcile physical register cash with system sales</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {summary ? (
          <div className="space-y-4 text-xs">
            {/* Sales Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Total Sales:</span>
                <span className="text-base font-black text-white mt-1 block">
                  Rs. {summary.totalSales.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-500">{summary.transactionCount} bills</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Cash Sales:</span>
                <span className="text-base font-black text-emerald-400 mt-1 block">
                  Rs. {summary.cashSales.toFixed(2)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Digital Sales:</span>
                <span className="text-base font-black text-blue-400 mt-1 block">
                  Rs. {summary.digitalSales.toFixed(2)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Credit (Udhaar):</span>
                <span className="text-base font-black text-amber-400 mt-1 block">
                  Rs. {summary.creditSales.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Opening Cash Input */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-300">Opening Register Cash (صبح کی نقدی):</span>
                <p className="text-[11px] text-slate-500">Initial float cash present in drawer at opening</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Rs.</span>
                <input
                  type="number"
                  value={openingCash || ''}
                  onChange={(e) => setOpeningCash(parseFloat(e.target.value) || 0)}
                  className="w-28 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-right text-xs font-bold text-white"
                />
              </div>
            </div>

            {/* Note Denomination Counter */}
            <div className="space-y-2">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-emerald-400" />
                Cash Count Helper (نوٹ گنتی کی تفصیل):
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                {[5000, 1000, 500, 100, 50, 20, 10].map((denom) => (
                  <div key={denom} className="flex items-center justify-between gap-1 bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <span className="font-bold text-slate-300 text-[11px]">Rs. {denom} ×</span>
                    <input
                      type="number"
                      min="0"
                      value={denominations[denom] || ''}
                      onChange={(e) =>
                        setDenominations({
                          ...denominations,
                          [denom]: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-14 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-center font-bold text-white text-xs"
                      placeholder="0"
                    />
                  </div>
                ))}

                <div className="flex items-center justify-between gap-1 bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <span className="font-bold text-slate-300 text-[11px]">Coins / Khulla:</span>
                  <input
                    type="number"
                    min="0"
                    value={looseCash || ''}
                    onChange={(e) => setLooseCash(parseFloat(e.target.value) || 0)}
                    className="w-16 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-center font-bold text-white text-xs"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Reconciliation Comparison: Expected vs Actual */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">
                  Expected Drawer Cash (Opening + Cash Sales + Recoveries):
                </span>
                <span className="font-bold text-white">Rs. {expectedCash.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Actual Cash Counted (گنتی کی گئی نقدی):</span>
                <span className="text-base font-black text-emerald-400">
                  Rs. {actualCashCounted.toFixed(2)}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                <span className="font-bold text-slate-200">
                  Variance / Difference (فرق / کمی بیشی):
                </span>
                <div className="text-right">
                  {variance === 0 ? (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                      ✓ Exact Match (پورا ہے)
                    </span>
                  ) : variance < 0 ? (
                    <span className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 font-bold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Shortage: Rs. {Math.abs(variance).toFixed(2)} (کمی)
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold">
                      Excess: + Rs. {variance.toFixed(2)} (اضافہ)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-slate-400">Closing Remarks / Notes (اختیاری نوٹ):</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Tariq was on counter from 9am to 10pm. Cash tally verified."
                rows={2}
                className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>

            {savedSuccess ? (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-center font-bold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Day Closing Successfully Saved! (دن کا اختتام محفوظ ہو گیا)
              </div>
            ) : (
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSubmit}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-white font-bold shadow-lg shadow-amber-600/30"
                >
                  {submitting ? 'Saving Closing...' : 'Submit & Save Day Closing (دن کا اختتام محفوظ کریں)'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-500">Calculating closing totals...</div>
        )}
      </div>
    </div>
  );
};

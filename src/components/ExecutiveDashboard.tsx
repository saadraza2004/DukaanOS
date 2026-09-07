'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  CreditCard,
  AlertCircle,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { DashboardStats, DashboardCharts } from '../types';
import { ApiClient } from '../lib/api';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

export const ExecutiveDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [charts, setCharts] = useState<DashboardCharts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async () => {
    try {
      const [s, c] = await Promise.all([
        ApiClient.getDashboardStats(),
        ApiClient.getDashboardCharts(),
      ]);
      setStats(s);
      setCharts(c);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats || !charts) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950 text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin text-emerald-400 mr-2" /> Loading Store Analytics...
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-950 p-4 sm:p-6 overflow-y-auto text-slate-100">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-emerald-400" />
              Executive Store Dashboard (کاروباری جائزہ)
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Live sales revenue, FIFO calculated profit, cash/digital breakdown, and inventory health
            </p>
          </div>

          <button
            onClick={loadDashboard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {/* Top 4 Primary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Today's Total Sales (آج کی فروخت)</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white mt-2">
              Rs. {stats.todaySales.toFixed(2)}
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold mt-1 block">
              {stats.todayTransactions} Transactions completed
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Today's Gross Profit (خالص منافع)</span>
              <TrendingUp className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-2xl font-black text-teal-400 mt-2">
              Rs. {stats.todayProfit.toFixed(2)}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Based on FIFO batch cost
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Average Basket Size (اوسط بل)</span>
              <ShoppingCart className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-white mt-2">
              Rs. {stats.averageBasket.toFixed(2)}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Per customer bill average
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Total Udhaar Owed (کل ادھار)</span>
              <CreditCard className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400 mt-2">
              Rs. {stats.totalOutstandingUdhaar.toFixed(2)}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Across all customer accounts
            </span>
          </div>
        </div>

        {/* Payment Channels Split */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center">
            <div>
              <span className="text-xs text-slate-400">Cash Sales (نقد فروخت)</span>
              <div className="text-lg font-bold text-white mt-0.5">Rs. {stats.cashSales.toFixed(2)}</div>
            </div>
            <span className="text-xs font-bold px-2 py-1 rounded bg-emerald-500/20 text-emerald-400">
              Cash Drawer
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center">
            <div>
              <span className="text-xs text-slate-400">Digital (Easypaisa / JazzCash / Card)</span>
              <div className="text-lg font-bold text-white mt-0.5">Rs. {stats.digitalSales.toFixed(2)}</div>
            </div>
            <span className="text-xs font-bold px-2 py-1 rounded bg-blue-500/20 text-blue-400">
              Online
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center">
            <div>
              <span className="text-xs text-slate-400">Today's Credit (آج کا ادھار)</span>
              <div className="text-lg font-bold text-amber-400 mt-0.5">Rs. {stats.creditSales.toFixed(2)}</div>
            </div>
            <span className="text-xs font-bold px-2 py-1 rounded bg-amber-500/20 text-amber-400">
              Khata Debit
            </span>
          </div>
        </div>

        {/* Interactive Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue & Profit Trend Chart */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col">
            <h3 className="text-sm font-bold text-white mb-4">7-Day Sales & Profit Trend (آمدنی اور منافع)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.dailyTrend}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Area type="monotone" dataKey="revenue" name="Revenue (Rs.)" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                  <Area type="monotone" dataKey="profit" name="Profit (Rs.)" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Selling Products */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col">
            <h3 className="text-sm font-bold text-white mb-4">Top 5 Selling Items (زیادہ فروخت اشیاء)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.topSellingProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis type="number" stroke="#64748b" fontSize={11} />
                  <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={120} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  />
                  <Bar dataKey="revenue" name="Revenue (Rs.)" fill="#10b981" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts Table */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              Low Stock Warnings (کم اسٹاک کی وارننگ)
            </h3>
            <span className="text-xs text-slate-400 font-semibold">
              {charts.lowStockAlerts.length} items need restock
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3">Current Remaining</th>
                  <th className="py-2.5 px-3">Minimum Alert Threshold</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {charts.lowStockAlerts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-slate-500">
                      Mashallah, all items are above stock threshold!
                    </td>
                  </tr>
                ) : (
                  charts.lowStockAlerts.map((item) => (
                    <tr key={item.productId} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-bold text-white">
                        {item.name} <span className="text-[11px] text-slate-400 font-urdu">({item.urduName})</span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-red-400">
                        {item.currentStockMajorUnit.toFixed(1)} {item.unit}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {item.minStockThreshold} {item.unit}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                          Reorder Soon
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

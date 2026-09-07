'use client';

import React, { useState } from 'react';
import { Store, ShieldCheck, UserCheck, Lock, User as UserIcon } from 'lucide-react';
import { User } from '../types';
import { ApiClient } from '../lib/api';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (u = username, p = password) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await ApiClient.login(u, p);
      onLoginSuccess(res.user);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 text-slate-100">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
            <Store className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">DukaanOS</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              دکان او ایس • ریٹیل سسٹم
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Production-grade POS & Retail Management for Pakistani General Stores
          </p>
        </div>

        {/* Quick 1-Click Demo Logins */}
        <div className="space-y-2 pt-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block text-center">
            Quick 1-Click Login (فوری لاگ ان):
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleLogin('owner', 'admin123')}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-left transition group active:scale-[0.98]"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-white group-hover:text-emerald-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Store Owner
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">Malik Usman</span>
              <span className="text-[10px] text-emerald-400/80 font-mono mt-0.5 block">Full Access</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleLogin('cashier', 'cashier123')}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 text-left transition group active:scale-[0.98]"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-white group-hover:text-blue-400">
                <UserCheck className="w-4 h-4 text-blue-400" />
                Cashier
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">Tariq Mahmood</span>
              <span className="text-[10px] text-blue-400/80 font-mono mt-0.5 block">POS Counter</span>
            </button>
          </div>
        </div>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink mx-3 text-slate-500 text-[11px]">or enter credentials</span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        {/* Manual Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
          className="space-y-4 text-xs"
        >
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 font-semibold text-center">
              {errorMessage}
            </div>
          )}

          <div>
            <label className="text-slate-400 font-semibold">Username:</label>
            <div className="relative mt-1">
              <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                required
                placeholder="owner / cashier"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 font-semibold">Password:</label>
            <div className="relative mt-1">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Sign In (لاگ ان کریں)'}
          </button>
        </form>
      </div>
    </div>
  );
};

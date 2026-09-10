'use client';

import React, { useState } from 'react';
import { Store, ShieldCheck, UserCheck, Lock, User as UserIcon, ArrowRight } from 'lucide-react';
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
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-7 shadow-2xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-emerald-400 shadow-sm">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">DukaanOS</h1>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 whitespace-nowrap">
                دکان او ایس
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Retail Point of Sale & Khata System
            </p>
          </div>
        </div>

        {/* 1-Click Store Selection */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5 px-0.5">
              <span className="text-[11px] font-medium text-slate-400">Madina Kiryana & General Store</span>
              <span className="text-[10px] text-slate-500 font-mono">Store 1</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleLogin('owner', 'admin123')}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 hover:bg-slate-950 text-left transition active:scale-[0.99] group"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-white group-hover:text-emerald-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Owner</span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5 truncate">Malik Usman</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleLogin('cashier', 'cashier123')}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 hover:bg-slate-950 text-left transition active:scale-[0.99] group"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-white group-hover:text-emerald-300">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400" />
                  <span>Cashier</span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5 truncate">Tariq Mahmood</span>
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5 px-0.5">
              <span className="text-[11px] font-medium text-slate-400">Bismillah Super Store</span>
              <span className="text-[10px] text-slate-500 font-mono">Store 2</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleLogin('bismillah_owner', 'admin123')}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 hover:bg-slate-950 text-left transition active:scale-[0.99] group"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-white group-hover:text-emerald-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Owner</span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5 truncate">Chaudhry Riaz</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleLogin('bismillah_cashier', 'cashier123')}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 hover:bg-slate-950 text-left transition active:scale-[0.99] group"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-white group-hover:text-emerald-300">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400" />
                  <span>Cashier</span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5 truncate">Hamza Riaz</span>
              </button>
            </div>
          </div>
        </div>

        <div className="relative flex items-center py-1">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink mx-3 text-slate-500 text-[11px]">or login with username</span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        {/* Manual Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
          className="space-y-3.5 text-xs"
        >
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium text-center">
              {errorMessage}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-slate-400 font-medium">Username</label>
            <div className="relative">
              <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                required
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:border-slate-700 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 font-medium">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:border-slate-700 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </form>
      </div>
    </div>
  );
};

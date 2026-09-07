'use client';

import React, { useEffect, useState } from 'react';
import {
  ShoppingCart,
  Package,
  BookOpen,
  LayoutDashboard,
  CalendarCheck,
  Bot,
  Wifi,
  WifiOff,
  RefreshCw,
  LogOut,
  Store
} from 'lucide-react';
import { User, SyncState } from '../types';
import { syncManager } from '../lib/sync';
import { ApiClient } from '../lib/api';

interface NavbarProps {
  user: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  onOpenAi: () => void;
  onOpenClosing: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onLogout,
  onOpenAi,
  onOpenClosing,
}) => {
  const [syncState, setSyncState] = useState<SyncState>(syncManager.getState());
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    const unsub = syncManager.subscribe((state, count) => {
      setSyncState(state);
      setPendingCount(count);
    });
    return () => unsub();
  }, []);

  const getSyncBadge = () => {
    switch (syncState) {
      case 'ONLINE':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
            <Wifi className="w-3.5 h-3.5 text-emerald-600" />
            ONLINE
          </span>
        );
      case 'OFFLINE':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
            <WifiOff className="w-3.5 h-3.5 text-amber-600" />
            OFFLINE {pendingCount > 0 && `(${pendingCount} pending)`}
          </span>
        );
      case 'SYNCING':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-300">
            <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
            SYNCING ({pendingCount})
          </span>
        );
      case 'SYNC COMPLETE':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-300">
            ✓ SYNC COMPLETE
          </span>
        );
      case 'SYNC ERROR':
        return (
          <button
            onClick={() => syncManager.triggerSync()}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 border border-red-300 hover:bg-red-200"
          >
            ⚠️ SYNC ERROR (Retry)
          </button>
        );
    }
  };

  return (
    <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white">DukaanOS</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  دکان او ایس
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">General Store & Ration POS</p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('pos')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === 'pos'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              POS (Counter)
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === 'inventory'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Package className="w-4 h-4" />
              Inventory & Batches
            </button>

            <button
              onClick={() => setActiveTab('udhaar')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === 'udhaar'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Udhaar Khata (ادھار)
            </button>

            {user.role === 'OWNER' && (
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition ${
                  activeTab === 'dashboard'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>
            )}

            {user.role === 'OWNER' && (
              <button
                onClick={onOpenClosing}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-amber-300 hover:bg-amber-950/40 hover:text-amber-200 transition border border-amber-500/30"
              >
                <CalendarCheck className="w-4 h-4 text-amber-400" />
                Day Closing
              </button>
            )}

            {user.role === 'OWNER' && (
              <button
                onClick={onOpenAi}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 transition shadow-sm"
              >
                <Bot className="w-4 h-4" />
                Dukaan Dost (AI)
              </button>
            )}
          </nav>

          {/* Right Status & User Menu */}
          <div className="flex items-center gap-3">
            {getSyncBadge()}

            <div className="hidden lg:flex flex-col items-end text-xs">
              <span className="font-semibold text-slate-200">{user.fullName}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-emerald-400 uppercase tracking-wider">
                {user.role}
              </span>
            </div>

            <button
              onClick={onLogout}
              title="Logout"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

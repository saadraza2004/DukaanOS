'use client';

import React, { useEffect, useState } from 'react';
import {
  ShoppingCart,
  Package,
  BookOpen,
  LayoutDashboard,
  CalendarCheck,
  Sparkles,
  RefreshCw,
  LogOut,
  Store,
  WifiOff
} from 'lucide-react';
import { User, SyncState } from '../types';
import { syncManager } from '../lib/sync';

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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join('');
  };

  const renderSyncStatus = () => {
    switch (syncState) {
      case 'ONLINE':
        return (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-medium text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="hidden sm:inline">Online</span>
          </div>
        );
      case 'OFFLINE':
        return (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] font-medium text-amber-300 animate-pulse">
            <WifiOff className="w-3 h-3 text-amber-400" />
            <span>Offline {pendingCount > 0 ? `(${pendingCount})` : ''}</span>
          </div>
        );
      case 'SYNCING':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-[11px] font-medium text-sky-300">
            <RefreshCw className="w-3 h-3 text-sky-400 animate-spin" />
            <span>Syncing ({pendingCount})</span>
          </div>
        );
      case 'SYNC COMPLETE':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-medium text-emerald-400">
            <span>✓ Synced</span>
          </div>
        );
      case 'SYNC ERROR':
        return (
          <button
            onClick={() => syncManager.triggerSync()}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-[11px] font-medium text-rose-300 hover:bg-rose-500/20 transition"
          >
            <span>⚠️ Retry Sync</span>
          </button>
        );
    }
  };

  const navItems = [
    { id: 'pos', label: 'POS Counter', icon: ShoppingCart },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'udhaar', label: 'Udhaar Khata', icon: BookOpen },
    ...(user.role === 'OWNER' ? [{ id: 'dashboard', label: 'Hisab & Reports', icon: LayoutDashboard }] : []),
  ];

  return (
    <>
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-40 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-15">
            {/* Left: Brand & Store Indicator */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-800/90 border border-slate-700/60 flex items-center justify-center text-emerald-400 shadow-sm">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold tracking-tight text-white">DukaanOS</span>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700/80 text-slate-300 whitespace-nowrap">
                    دکان او ایس
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-normal truncate max-w-[180px] sm:max-w-xs leading-none mt-0.5">
                  {user.storeName || 'Retail POS'}
                </p>
              </div>
            </div>

            {/* Center: Segmented Navigation Pill Control */}
            <nav className="hidden md:flex items-center bg-slate-950/70 p-1 rounded-xl border border-slate-800/80 shadow-inner">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-slate-800 text-white shadow-sm border border-slate-700/60'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Right: Quick Actions & User Profile */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              {/* Day Closing Button */}
              {user.role === 'OWNER' && (
                <button
                  onClick={onOpenClosing}
                  title="Daily Register Closing"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition shadow-sm"
                >
                  <CalendarCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Closing</span>
                </button>
              )}

              {/* AI Assistant Button */}
              {user.role === 'OWNER' && (
                <button
                  onClick={onOpenAi}
                  title="Dukaan Dost AI Assistant"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-200 hover:text-white bg-slate-800/60 hover:bg-indigo-950/40 border border-indigo-500/30 hover:border-indigo-500/60 transition shadow-sm group"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
                  <span>Dost</span>
                  <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300">
                    AI
                  </span>
                </button>
              )}

              {/* Live Sync Status */}
              {renderSyncStatus()}

              <div className="h-5 w-px bg-slate-800 hidden sm:block"></div>

              {/* User Profile Info */}
              <div className="flex items-center gap-2 pl-0.5">
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-200 shadow-sm">
                  {getInitials(user.fullName || 'User')}
                </div>
                <div className="hidden lg:flex flex-col text-left leading-tight">
                  <span className="text-xs font-semibold text-slate-200 truncate max-w-[120px]">
                    {user.fullName}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {user.role === 'OWNER' ? 'Store Owner' : 'Cashier'}
                  </span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                title="Logout"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 transition border border-transparent hover:border-rose-500/20 ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Dock */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/90 px-3 py-1.5 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => setActiveTab('pos')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-medium transition ${
            activeTab === 'pos' ? 'text-emerald-400 font-bold bg-slate-800/60' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShoppingCart className={`w-4.5 h-4.5 mb-0.5 ${activeTab === 'pos' ? 'text-emerald-400' : 'text-slate-400'}`} />
          <span>POS</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-medium transition ${
            activeTab === 'inventory' ? 'text-emerald-400 font-bold bg-slate-800/60' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Package className={`w-4.5 h-4.5 mb-0.5 ${activeTab === 'inventory' ? 'text-emerald-400' : 'text-slate-400'}`} />
          <span>Stock</span>
        </button>

        <button
          onClick={() => setActiveTab('udhaar')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-medium transition ${
            activeTab === 'udhaar' ? 'text-emerald-400 font-bold bg-slate-800/60' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className={`w-4.5 h-4.5 mb-0.5 ${activeTab === 'udhaar' ? 'text-emerald-400' : 'text-slate-400'}`} />
          <span>Khata</span>
        </button>

        {user.role === 'OWNER' && (
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-medium transition ${
              activeTab === 'dashboard' ? 'text-emerald-400 font-bold bg-slate-800/60' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className={`w-4.5 h-4.5 mb-0.5 ${activeTab === 'dashboard' ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span>Reports</span>
          </button>
        )}

        {user.role === 'OWNER' && (
          <button
            onClick={onOpenClosing}
            className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-medium text-amber-400/90 hover:text-amber-300"
          >
            <CalendarCheck className="w-4.5 h-4.5 mb-0.5" />
            <span>Closing</span>
          </button>
        )}

        {user.role === 'OWNER' && (
          <button
            onClick={onOpenAi}
            className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-medium text-indigo-400/90 hover:text-indigo-300"
          >
            <Sparkles className="w-4.5 h-4.5 mb-0.5" />
            <span>Dost</span>
          </button>
        )}
      </nav>
    </>
  );
};

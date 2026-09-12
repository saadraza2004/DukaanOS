'use client';

import React, { useState } from 'react';
import { Store, Lock, User as UserIcon, ArrowRight, Phone, MapPin, Sparkles, Building2, ShieldCheck } from 'lucide-react';
import { User } from '../types';
import { ApiClient } from '../lib/api';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration form state
  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage('Barah-e-karam username aur password darj karein.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await ApiClient.login(username.trim(), password);
      onLoginSuccess(res.user);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Login failed. Check your username & password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) {
      setErrorMessage('Dukaan ka naam likhna lazmi hai.');
      return;
    }
    if (!ownerName.trim()) {
      setErrorMessage('Malik ka naam likhna lazmi hai.');
      return;
    }
    if (!regUsername.trim() || !regPassword) {
      setErrorMessage('Username aur password lazmi hain.');
      return;
    }
    if (regPassword.length < 4) {
      setErrorMessage('Password kam az kam 4 huroof ka hona chahiye.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await ApiClient.registerStore({
        storeName: storeName.trim(),
        ownerFullName: ownerName.trim(),
        phone: phone.trim() || undefined,
        city: city.trim() || undefined,
        username: regUsername.trim(),
        password: regPassword,
      });

      const registeredUser = regUsername.trim();
      setSuccessMessage('Mubarak! Nayi dukaan register ho gayi hai. Ab apne credentials se login karein.');
      setUsername(registeredUser);
      setPassword('');
      // Clear register form
      setStoreName('');
      setOwnerName('');
      setPhone('');
      setCity('');
      setRegUsername('');
      setRegPassword('');
      // Redirect to Login tab
      setActiveTab('login');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Registration failed. Try a different username.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 text-slate-100 selection:bg-emerald-500 selection:text-black">
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-7 shadow-2xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-emerald-400 shadow-sm">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">DukaanOS</h1>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 whitespace-nowrap">
                دکان او ایس
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Retail Point of Sale & Smart Khata System
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800/90 text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMessage('');
            }}
            className={`py-2 rounded-lg transition text-center ${
              activeTab === 'login'
                ? 'bg-slate-800 text-white font-semibold shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In (لاگ اِن)
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setErrorMessage('');
            }}
            className={`py-2 rounded-lg transition text-center ${
              activeTab === 'register'
                ? 'bg-slate-800 text-white font-semibold shadow-sm border border-slate-700/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Nayi Dukaan (رجسٹر)
          </button>
        </div>

        {/* Status Alerts */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium text-center leading-relaxed">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium text-center flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium">Username (صارف کا نام)</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. owner ya aapka username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:border-slate-700 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium">Password (پاس ورڈ)</label>
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
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs border border-emerald-500/50 shadow-md shadow-emerald-950/40 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-3"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In (لاگ اِن کریں)'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </button>

            <p className="text-[11px] text-slate-500 text-center pt-1">
              Har dukaan ka data mukammal tor par mehfooz aur alag hai.
            </p>
          </form>
        )}

        {/* REGISTER DUKAAN FORM */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
            <div className="space-y-1">
              <label className="text-slate-400 font-medium">Dukaan Ka Naam (دکان کا نام)</label>
              <div className="relative">
                <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Al-Madina Kiryana Store"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:border-slate-700 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 font-medium">Malik Ka Naam (مالک کا نام)</label>
              <div className="relative">
                <ShieldCheck className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Malik Muhammad Usman"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:border-slate-700 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Phone (فون نمبر)</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="tel"
                    placeholder="0300-1234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:border-slate-700 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">City (شہر)</label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Rawalpindi / Lahore"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:border-slate-700 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
              <div className="space-y-1">
                <label className="text-slate-400 font-medium">New Username</label>
                <div className="relative">
                  <UserIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. usman_shop"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:border-slate-700 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">New Password</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:border-slate-700 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition text-xs"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs border border-emerald-500/50 shadow-md shadow-emerald-950/40 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-3"
            >
              <span>{loading ? 'Registering Dukaan...' : 'Dukaan Register Karein (دکان شروع کریں)'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

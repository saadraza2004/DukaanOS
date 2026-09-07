'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  UserPlus,
  ArrowDownLeft,
  ArrowUpRight,
  Phone,
  MapPin,
  X
} from 'lucide-react';
import { Customer, CustomerLedger } from '../types';
import { ApiClient } from '../lib/api';

export const UdhaarKhata: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [topDebtors, setTopDebtors] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<CustomerLedger[]>([]);

  // Modals
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    phone: '',
    address: '',
    maxCreditLimit: 25000,
    notes: '',
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    paymentMethod: 'Cash',
    referenceNumber: '',
    notes: '',
  });

  useEffect(() => {
    loadCustomers();
    loadTopDebtors();
  }, []);

  const loadCustomers = async () => {
    try {
      const list = await ApiClient.getCustomers(searchQuery);
      setCustomers(list);
      if (list.length > 0 && !selectedCustomer) {
        handleSelectCustomer(list[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadTopDebtors = async () => {
    try {
      const top = await ApiClient.getTopDebtors(5);
      setTopDebtors(top);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectCustomer = async (cust: Customer) => {
    setSelectedCustomer(cust);
    try {
      const ledger = await ApiClient.getCustomerLedger(cust.id);
      setLedgerEntries(ledger);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerForm.name.trim()) return;

    try {
      const created = await ApiClient.createCustomer(newCustomerForm);
      setShowNewCustomerModal(false);
      setNewCustomerForm({ name: '', phone: '', address: '', maxCreditLimit: 25000, notes: '' });
      await loadCustomers();
      handleSelectCustomer(created);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error creating customer');
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || paymentForm.amount <= 0) return;

    try {
      const updated = await ApiClient.recordCustomerPayment(selectedCustomer.id, paymentForm);
      setShowPaymentModal(false);
      setPaymentForm({ amount: 0, paymentMethod: 'Cash', referenceNumber: '', notes: '' });
      setSelectedCustomer(updated);
      handleSelectCustomer(updated);
      loadCustomers();
      loadTopDebtors();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error recording payment');
    }
  };

  const totalStoreDebt = customers.reduce((sum, c) => sum + c.currentBalance, 0);

  return (
    <div className="flex-1 bg-slate-950 p-4 sm:p-6 overflow-y-auto text-slate-100 flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-amber-400" />
              Udhaar Khata & Ledger (ادھار کھاتہ)
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Customer credit accounts, debit/credit transactions, and payment recoveries (وصولیاں)
            </p>
          </div>

          <button
            onClick={() => setShowNewCustomerModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20"
          >
            <UserPlus className="w-4 h-4" />
            Add Customer (نیا کھاتہ)
          </button>
        </div>

        {/* Top Debtors Quick Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {topDebtors.map((deb) => (
            <button
              key={deb.id}
              onClick={() => handleSelectCustomer(deb)}
              className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-left transition"
            >
              <span className="text-[11px] text-slate-400 block truncate">{deb.name}</span>
              <span className="text-base font-black text-amber-400 mt-1 block">
                Rs. {deb.currentBalance.toFixed(0)}
              </span>
            </button>
          ))}
        </div>

        {/* Main Two-Column Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[500px]">
          {/* Left: Customer Directory List (5 cols) */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
            {/* Search */}
            <div className="p-3 border-b border-slate-800">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search customer by name or phone..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    ApiClient.getCustomers(e.target.value).then(setCustomers);
                  }}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800">
              {customers.map((c) => {
                const isSelected = selectedCustomer?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => handleSelectCustomer(c)}
                    className={`w-full p-3 text-left transition flex items-center justify-between ${
                      isSelected ? 'bg-slate-800 border-l-4 border-amber-500' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <h4 className="text-xs font-bold text-white truncate">{c.name}</h4>
                      {c.phone && <p className="text-[11px] text-slate-400 mt-0.5">{c.phone}</p>}
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-xs font-black ${
                          c.currentBalance > 0 ? 'text-amber-400' : 'text-slate-400'
                        }`}
                      >
                        Rs. {c.currentBalance.toFixed(0)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Detailed Customer Ledger Statement (8 cols) */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
            {selectedCustomer ? (
              <>
                {/* Customer Banner */}
                <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-black text-white">{selectedCustomer.name}</h2>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      {selectedCustomer.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {selectedCustomer.phone}
                        </span>
                      )}
                      {selectedCustomer.address && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {selectedCustomer.address}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block">Total Outstanding Balance:</span>
                      <span className="text-xl font-black text-amber-400">
                        Rs. {selectedCustomer.currentBalance.toFixed(2)}
                      </span>
                    </div>

                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20"
                    >
                      Receive Payment (وصولی درج کریں)
                    </button>
                  </div>
                </div>

                {/* Ledger Transactions Table */}
                <div className="flex-1 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold sticky top-0">
                      <tr>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Debit (+ Udhaar)</th>
                        <th className="py-3 px-4">Credit (- Paid)</th>
                        <th className="py-3 px-4">Running Balance</th>
                        <th className="py-3 px-4">Reference / Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {ledgerEntries.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-slate-500">
                            No ledger transactions recorded yet.
                          </td>
                        </tr>
                      ) : (
                        ledgerEntries.map((l) => {
                          const isDebit = l.transactionType.includes('Debit');
                          return (
                            <tr key={l.id} className="hover:bg-slate-800/50 transition">
                              <td className="py-3 px-4 text-slate-400">
                                {new Date(l.createdAt).toLocaleDateString('en-GB')}
                              </td>
                              <td className="py-3 px-4 font-semibold">
                                {isDebit ? (
                                  <span className="text-amber-400 flex items-center gap-1">
                                    <ArrowUpRight className="w-3.5 h-3.5" /> Purchase
                                  </span>
                                ) : (
                                  <span className="text-emerald-400 flex items-center gap-1">
                                    <ArrowDownLeft className="w-3.5 h-3.5" /> Recovery
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 font-bold text-amber-400">
                                {isDebit ? `Rs. ${l.amount.toFixed(2)}` : '—'}
                              </td>
                              <td className="py-3 px-4 font-bold text-emerald-400">
                                {!isDebit ? `Rs. ${l.amount.toFixed(2)}` : '—'}
                              </td>
                              <td className="py-3 px-4 font-black text-white">
                                Rs. {l.balanceAfter.toFixed(2)}
                              </td>
                              <td className="py-3 px-4 text-slate-400">
                                {l.notes || l.referenceId || 'N/A'}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500">
                Select a customer from the list to view their ledger
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Customer Modal */}
      {showNewCustomerModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white">Register New Customer (نیا گاہک درج کریں)</h3>
              <button onClick={() => setShowNewCustomerModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400">Full Name (نام):</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Haji Abdul Rehman"
                  value={newCustomerForm.name}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400">Mobile Phone (موبائل نمبر):</label>
                <input
                  type="text"
                  placeholder="e.g. 0300-1234567"
                  value={newCustomerForm.phone}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400">Address / Mohalla (پتہ):</label>
                <input
                  type="text"
                  placeholder="e.g. Mohalla Eidgah, Main Bazaar"
                  value={newCustomerForm.address}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400">Max Credit Limit (ادھار کی حد):</label>
                <input
                  type="number"
                  value={newCustomerForm.maxCreditLimit}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, maxCreditLimit: parseFloat(e.target.value) || 0 })}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewCustomerModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold"
                >
                  Create Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receive Payment Modal */}
      {showPaymentModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-white">Receive Payment (وصولی درج کریں)</h3>
                <p className="text-xs text-slate-400">{selectedCustomer.name}</p>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400">Current Outstanding Udhaar:</span>
              <span className="text-base font-black text-amber-400">
                Rs. {selectedCustomer.currentBalance.toFixed(2)}
              </span>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400">Amount Paid (وصول شدہ رقم):</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="e.g. 1000"
                  value={paymentForm.amount || ''}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-bold text-base focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400">Payment Channel:</label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold"
                >
                  <option value="Cash">Cash (نقد)</option>
                  <option value="Easypaisa">Easypaisa</option>
                  <option value="JazzCash">JazzCash</option>
                  <option value="BankTransfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400">Reference / TID (Optional):</label>
                <input
                  type="text"
                  placeholder="e.g. TID-9823412"
                  value={paymentForm.referenceNumber}
                  onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold"
                >
                  Save Recovery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

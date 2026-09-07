'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Receipt,
  UserCheck,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
  Printer,
  Scale,
  X,
  PackageCheck
} from 'lucide-react';
import { Product, Customer, CartItem, CreateSalePayload, Sale } from '../types';
import { ApiClient } from '../lib/api';
import { syncManager } from '../lib/sync';

interface POSWorkspaceProps {
  onSaleCompleted?: () => void;
}

export const POSWorkspace: React.FC<POSWorkspaceProps> = ({ onSaleCompleted }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [paymentReference, setPaymentReference] = useState<string>('');

  // Loose weight modal state
  const [selectedLooseProduct, setSelectedLooseProduct] = useState<Product | null>(null);
  const [looseQuantity, setLooseQuantity] = useState<number>(500);
  const [looseUnit, setLooseUnit] = useState<string>('GRAM');

  // Checkout & Receipt Modal
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    try {
      const [prods, cats, custs] = await Promise.all([
        ApiClient.getProducts(),
        ApiClient.getCategories(),
        ApiClient.getCustomers(),
      ]);
      setProducts(prods);
      setCategories(cats);
      setCustomers(custs);
      syncManager.cacheCatalogLocally(prods, custs);
    } catch {
      const cachedProds = await syncManager.getCachedProducts();
      const cachedCusts = await syncManager.getCachedCustomers();
      setProducts(cachedProds);
      setCustomers(cachedCusts);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory ? p.categoryId === selectedCategory : true;
    const term = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !term ||
      p.name.toLowerCase().includes(term) ||
      p.urduName.includes(term) ||
      (p.romanUrduName && p.romanUrduName.toLowerCase().includes(term)) ||
      p.barcode?.includes(term) ||
      p.sku?.toLowerCase().includes(term);
    return matchesCat && matchesSearch;
  });

  const handleProductClick = (product: Product) => {
    if (product.unitType === 'KG' || product.unitType === 'LITRE') {
      setSelectedLooseProduct(product);
      setLooseQuantity(product.unitType === 'KG' ? 500 : 1000);
      setLooseUnit(product.unitType === 'KG' ? 'GRAM' : 'ML');
      return;
    }
    addItemToCart(product, 1, product.unitType);
  };

  const addItemToCart = (product: Product, quantityEntered: number, unitEntered: string) => {
    const isGramOrMl = unitEntered === 'GRAM' || unitEntered === 'ML';
    const quantityInBaseUnit = isGramOrMl ? quantityEntered : quantityEntered * (product.baseUnitRatio || 1);
    const majorUnits = quantityInBaseUnit / (product.baseUnitRatio || 1);
    const lineTotal = Math.round(majorUnits * product.currentSellingPrice * 100) / 100;

    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.product.id === product.id && item.unitEntered === unitEntered
      );
      if (existingIdx > -1) {
        const updated = [...prev];
        const newQty = updated[existingIdx].quantityEntered + quantityEntered;
        const newBase = isGramOrMl ? newQty : newQty * (product.baseUnitRatio || 1);
        const newMajor = newBase / (product.baseUnitRatio || 1);
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantityEntered: newQty,
          quantityInBaseUnit: newBase,
          lineTotal: Math.round(newMajor * product.currentSellingPrice * 100) / 100,
        };
        return updated;
      }
      return [
        ...prev,
        {
          product,
          quantityEntered,
          unitEntered,
          quantityInBaseUnit,
          sellingPricePerMajorUnit: product.currentSellingPrice,
          lineTotal,
        },
      ];
    });
  };

  const handleLooseWeightConfirm = () => {
    if (!selectedLooseProduct || looseQuantity <= 0) return;
    addItemToCart(selectedLooseProduct, looseQuantity, looseUnit);
    setSelectedLooseProduct(null);
  };

  const updateCartItemQuantity = (index: number, delta: number) => {
    setCart((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const newQty = item.quantityEntered + delta;
      if (newQty <= 0) {
        return updated.filter((_, i) => i !== index);
      }
      const isGramOrMl = item.unitEntered === 'GRAM' || item.unitEntered === 'ML';
      const newBase = isGramOrMl ? newQty : newQty * (item.product.baseUnitRatio || 1);
      const newMajor = newBase / (item.product.baseUnitRatio || 1);
      updated[index] = {
        ...item,
        quantityEntered: newQty,
        quantityInBaseUnit: newBase,
        lineTotal: Math.round(newMajor * item.sellingPricePerMajorUnit * 100) / 100,
      };
      return updated;
    });
  };

  const removeCartItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);
  const grandTotal = Math.max(0, subtotal - (discountAmount || 0));
  const numericPaid = parseFloat(amountPaid) || 0;
  const changeReturned = Math.max(0, numericPaid - grandTotal);
  const udhaarAmount = paymentMethod === 'UdhaarCredit' ? grandTotal : Math.max(0, grandTotal - numericPaid);

  const handleCompleteSale = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'UdhaarCredit' && !selectedCustomer) {
      alert('ادھار کی فروخت کے لیے گاہک (Customer) منتخب کرنا ضروری ہے۔');
      return;
    }

    setIsProcessing(true);
    const clientSaleId = crypto.randomUUID();

    const payload: CreateSalePayload = {
      clientSaleId,
      customerId: selectedCustomer ? selectedCustomer.id : null,
      items: cart.map((i) => ({
        productId: i.product.id,
        quantityEntered: i.quantityEntered,
        unitEntered: i.unitEntered,
      })),
      discountAmount: discountAmount || 0,
      paymentMethod: paymentMethod,
      amountPaid: paymentMethod === 'UdhaarCredit' ? 0 : numericPaid || grandTotal,
      paymentReference,
    };

    try {
      let saleResult: Sale;
      if (navigator.onLine) {
        saleResult = await ApiClient.createSale(payload);
      } else {
        await syncManager.queueOfflineSale(payload);
        saleResult = {
          id: clientSaleId,
          invoiceNumber: `OFFLINE-${Date.now().toString().slice(-6)}`,
          customerId: selectedCustomer?.id,
          customerName: selectedCustomer?.name,
          subtotal,
          discountAmount: discountAmount || 0,
          grandTotal,
          paymentMethod,
          paymentStatus: paymentMethod === 'UdhaarCredit' ? 'Pending' : 'Success',
          amountPaid: numericPaid || grandTotal,
          changeReturned,
          udhaarAmount,
          totalCostAmount: 0,
          profitAmount: 0,
          cashierName: 'Counter Cashier (Offline)',
          createdAt: new Date().toISOString(),
          items: cart.map((item, idx) => ({
            id: idx + 1,
            productId: item.product.id,
            productName: item.product.name,
            quantityEntered: item.quantityEntered,
            unitEntered: item.unitEntered,
            quantityInBaseUnit: item.quantityInBaseUnit,
            sellingPricePerMajorUnit: item.sellingPricePerMajorUnit,
            lineTotal: item.lineTotal,
            allocatedCostTotal: 0,
          })),
        };
      }

      setCompletedSale(saleResult);
      setCart([]);
      setDiscountAmount(0);
      setAmountPaid('');
      setPaymentReference('');
      setSelectedCustomer(null);
      loadCatalog();
      if (onSaleCompleted) onSaleCompleted();
    } catch (err: unknown) {
      alert(`Sale Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-4rem)] bg-slate-950 overflow-hidden">
      {/* Left: Clean, High-Speed Product Catalog */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-slate-800/80">
        {/* Search & Category Pills */}
        <div className="p-5 bg-slate-900/60 backdrop-blur-md border-b border-slate-800 flex flex-col gap-3.5">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search in English or Roman Urdu (sarson ka tel, chawal, cheeni, atta, daal, sabun...) or press F2"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-700/80 rounded-2xl text-white placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg"
              >
                Clear
              </button>
            )}
          </div>

          {/* Clean Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition shadow-sm ${
                selectedCategory === null
                  ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                  : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              All Items (سب اشیاء)
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-600 text-white shadow-emerald-600/30 font-bold'
                    : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Clean, Legible Product Cards (Easy on the eyes while standing) */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5 content-start">
          {filteredProducts.map((p) => {
            const isLoose = p.unitType === 'KG' || p.unitType === 'LITRE';
            const isLowStock = p.currentStockMajorUnit <= p.minStockThreshold;

            return (
              <button
                key={p.id}
                onClick={() => handleProductClick(p)}
                className="flex flex-col text-left p-4 rounded-2xl bg-slate-900 border border-slate-800/80 hover:border-emerald-500/50 hover:bg-slate-800/60 active:scale-[0.98] transition group shadow-sm relative overflow-hidden"
              >
                {isLoose && (
                  <span className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Scale className="w-3 h-3" /> Loose
                  </span>
                )}

                <div className="flex-1 pr-6">
                  <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition leading-snug">
                    {p.name}
                  </h3>
                  {p.romanUrduName && (
                    <span className="text-[11px] font-semibold text-emerald-400/90 block mt-0.5">
                      {p.romanUrduName.split(' ').slice(0, 4).join(' ')}
                    </span>
                  )}
                  <p className="text-xs text-slate-400 font-urdu mt-0.5">{p.urduName}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/70 flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-slate-400">Rs.</span>
                    <span className="text-lg font-black text-emerald-400 ml-1 tracking-tight">
                      {p.currentSellingPrice.toFixed(0)}
                    </span>
                    <span className="text-[11px] text-slate-400">/{p.unitType}</span>
                  </div>

                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                      isLowStock
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {p.currentStockMajorUnit.toFixed(1)} {p.unitType}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: Uncluttered Cart & Counter Payment Sidebar */}
      <div className="w-full lg:w-[440px] flex flex-col bg-slate-900/90 border-t lg:border-t-0 border-slate-800 shadow-2xl">
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Receipt className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-bold text-white text-sm">Active Counter Bill (رسید)</h2>
              <p className="text-[11px] text-slate-400">{cart.length} line items added</p>
            </div>
          </div>

          {cart.length > 0 && (
            <button
              onClick={() => setCart([])}
              className="text-xs font-semibold text-red-400 hover:text-red-300 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-950/30 transition"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear Cart
            </button>
          )}
        </div>

        {/* Customer / Udhaar Khata Selector */}
        <div className="px-4 py-3 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 whitespace-nowrap">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            Customer:
          </span>
          <select
            value={selectedCustomer ? selectedCustomer.id : ''}
            onChange={(e) => {
              const val = e.target.value;
              if (!val) {
                setSelectedCustomer(null);
              } else {
                const cust = customers.find((c) => c.id === parseInt(val));
                setSelectedCustomer(cust || null);
              }
            }}
            className="w-full bg-slate-900 border border-slate-700/80 text-xs rounded-xl px-3 py-2 text-white focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">Walk-in Customer (عام خریدار)</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.currentBalance > 0 ? `(Udhaar: Rs. ${c.currentBalance})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-8">
              <PackageCheck className="w-12 h-12 stroke-1 text-slate-600 mb-3" />
              <p className="text-sm font-semibold text-slate-300">Ready for Next Customer</p>
              <p className="text-xs text-slate-500 mt-1">Tap items on the left to add to bill</p>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div
                key={`${item.product.id}-${item.unitEntered}-${idx}`}
                className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between gap-3 shadow-sm"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">{item.product.name}</h4>
                  <p className="text-[11px] text-emerald-400 mt-0.5">
                    {item.quantityEntered} {item.unitEntered} × Rs. {item.sellingPricePerMajorUnit}
                  </p>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-2 py-1">
                  <button
                    onClick={() => updateCartItemQuantity(idx, -1)}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-bold text-white px-1">
                    {item.quantityEntered}
                  </span>
                  <button
                    onClick={() => updateCartItemQuantity(idx, 1)}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Line Total */}
                <div className="text-right min-w-[75px]">
                  <span className="text-xs font-black text-white">Rs. {item.lineTotal.toFixed(2)}</span>
                </div>

                <button
                  onClick={() => removeCartItem(idx)}
                  className="p-1.5 text-slate-500 hover:text-red-400 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Bill Financial Summary */}
        <div className="p-5 bg-slate-950 border-t border-slate-800 space-y-3.5">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Subtotal:</span>
            <span className="font-semibold text-white">Rs. {subtotal.toFixed(2)}</span>
          </div>

          {/* Arbitrary Rupee Discount */}
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-slate-400 font-medium">Manual Discount (رعایت):</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-bold">Rs.</span>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={discountAmount || ''}
                onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                className="w-24 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-right text-xs font-bold text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Big, Unmistakable Grand Total */}
          <div className="pt-2.5 border-t border-slate-800 flex justify-between items-baseline">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Grand Total (صافی رقم)</span>
              <p className="text-[10px] text-slate-500 font-urdu">کل قابل ادا رقم</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-emerald-400 tracking-tight">
                Rs. {grandTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              onClick={() => setPaymentMethod('Cash')}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold border transition ${
                paymentMethod === 'Cash'
                  ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Banknote className="w-4 h-4" /> Cash
            </button>

            <button
              onClick={() => setPaymentMethod('Easypaisa')}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold border transition ${
                paymentMethod === 'Easypaisa'
                  ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4" /> Easypaisa
            </button>

            <button
              onClick={() => setPaymentMethod('JazzCash')}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold border transition ${
                paymentMethod === 'JazzCash'
                  ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4" /> JazzCash
            </button>

            <button
              onClick={() => setPaymentMethod('Card')}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold border transition ${
                paymentMethod === 'Card'
                  ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4" /> Card
            </button>

            <button
              onClick={() => setPaymentMethod('UdhaarCredit')}
              className={`col-span-2 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold border transition ${
                paymentMethod === 'UdhaarCredit'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-amber-400'
              }`}
            >
              <Receipt className="w-4 h-4" /> Khata / Udhaar (ادھار)
            </button>
          </div>

          {/* Cash Tendered Presets */}
          {paymentMethod === 'Cash' && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Cash Received (وصول):</span>
                <input
                  type="number"
                  placeholder={grandTotal.toString()}
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="w-28 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-right text-xs font-bold text-white focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-1.5">
                {[100, 500, 1000, 5000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmountPaid(amt.toString())}
                    className="flex-1 py-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800"
                  >
                    Rs.{amt}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setAmountPaid(grandTotal.toString())}
                  className="flex-1 py-1.5 text-xs font-bold bg-emerald-950 text-emerald-400 rounded-xl border border-emerald-800/60"
                >
                  Exact
                </button>
              </div>

              {changeReturned > 0 && (
                <div className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300">
                  <span className="font-semibold">Return Change (بقایا دیں):</span>
                  <span className="text-base font-black">Rs. {changeReturned.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {/* Complete Sale Button */}
          <button
            disabled={cart.length === 0 || isProcessing}
            onClick={handleCompleteSale}
            className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-sm shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition active:scale-[0.99]"
          >
            {isProcessing ? (
              <span>Saving Sale...</span>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Complete Sale (مکمل فروخت)</span>
                <span className="text-xs font-normal opacity-75">• Enter</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Loose Weight & Fractional Calculator Modal */}
      {selectedLooseProduct && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Loose Weight Calculator (تول کا حساب)
                </span>
                <h3 className="text-lg font-bold text-white mt-2">{selectedLooseProduct.name}</h3>
                <p className="text-xs text-slate-400 font-urdu">{selectedLooseProduct.urduName}</p>
              </div>
              <button
                onClick={() => setSelectedLooseProduct(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400">Current Selling Rate:</span>
              <span className="font-bold text-emerald-400 text-sm">
                Rs. {selectedLooseProduct.currentSellingPrice} per {selectedLooseProduct.unitType}
              </span>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Quick Weight Presets (تیز وزن):</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: '100g', qty: 100, unit: 'GRAM' },
                  { label: '250g (پاؤ)', qty: 250, unit: 'GRAM' },
                  { label: '500g (آدھا کلو)', qty: 500, unit: 'GRAM' },
                  { label: '750g', qty: 750, unit: 'GRAM' },
                  { label: '1 KG', qty: 1, unit: 'KG' },
                  { label: '1.25 KG', qty: 1.25, unit: 'KG' },
                  { label: '2 KG', qty: 2, unit: 'KG' },
                  { label: '5 KG', qty: 5, unit: 'KG' },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setLooseQuantity(preset.qty);
                      setLooseUnit(preset.unit);
                    }}
                    className={`py-2.5 px-1 text-xs font-bold rounded-xl border transition ${
                      looseQuantity === preset.qty && looseUnit === preset.unit
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                        : 'bg-slate-800/90 text-slate-300 border-slate-700/60 hover:bg-slate-700'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Exact Input */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="text-xs text-slate-400 font-semibold">Custom Weight / Quantity:</label>
                <input
                  type="number"
                  step="any"
                  value={looseQuantity}
                  onChange={(e) => setLooseQuantity(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-bold text-base focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-semibold">Unit:</label>
                <select
                  value={looseUnit}
                  onChange={(e) => setLooseUnit(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-semibold text-xs"
                >
                  <option value="GRAM">Grams (گرام)</option>
                  <option value="KG">KG (کلو)</option>
                  <option value="ML">ML (ملی لٹر)</option>
                  <option value="LITRE">Litre (لٹر)</option>
                </select>
              </div>
            </div>

            {/* Live Calculation Display as required by user prompt */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30">
              <span className="text-[11px] text-slate-400 block mb-1 font-mono">
                Formula: {looseQuantity} {looseUnit}{' '}
                {looseUnit === 'GRAM' || looseUnit === 'ML'
                  ? `/ 1000 × Rs. ${selectedLooseProduct.currentSellingPrice}`
                  : `× Rs. ${selectedLooseProduct.currentSellingPrice}`}
              </span>
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-semibold text-slate-300">Total Price:</span>
                <span className="text-3xl font-black text-emerald-400">
                  Rs.{' '}
                  {(
                    ((looseUnit === 'GRAM' || looseUnit === 'ML' ? looseQuantity / 1000 : looseQuantity) *
                      selectedLooseProduct.currentSellingPrice) || 0
                  ).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setSelectedLooseProduct(null)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLooseWeightConfirm}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sale Receipt Modal */}
      {completedSale && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="text-center pb-3 border-b border-slate-800">
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2 border border-emerald-500/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white">Sale Completed Successfully!</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">Invoice: {completedSale.invoiceNumber}</p>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
              {completedSale.items.map((it) => (
                <div key={it.id} className="flex justify-between py-1 border-b border-slate-800/60">
                  <div>
                    <span className="font-semibold text-white">{it.productName}</span>
                    <span className="block text-[11px] text-slate-400">
                      {it.quantityEntered} {it.unitEntered} @ Rs. {it.sellingPricePerMajorUnit}
                    </span>
                  </div>
                  <span className="font-bold text-slate-200">Rs. {it.lineTotal.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal:</span>
                <span>Rs. {completedSale.subtotal.toFixed(2)}</span>
              </div>
              {completedSale.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount:</span>
                  <span>- Rs. {completedSale.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-white pt-1">
                <span>Total Paid:</span>
                <span className="text-emerald-400">Rs. {completedSale.grandTotal.toFixed(2)}</span>
              </div>
              {completedSale.changeReturned > 0 && (
                <div className="flex justify-between text-slate-300">
                  <span>Change Given:</span>
                  <span>Rs. {completedSale.changeReturned.toFixed(2)}</span>
                </div>
              )}
              {completedSale.udhaarAmount > 0 && (
                <div className="flex justify-between text-amber-400 font-semibold">
                  <span>Added to Customer Udhaar:</span>
                  <span>Rs. {completedSale.udhaarAmount.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700"
              >
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
              <button
                onClick={() => setCompletedSale(null)}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
              >
                Next Customer (اگلا گاہک)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

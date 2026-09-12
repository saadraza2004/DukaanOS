'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  PlusCircle,
  AlertTriangle,
  History,
  TrendingUp,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  X,
  Tag,
  ShieldAlert,
  Plus,
  Sparkles,
  Search
} from 'lucide-react';
import { Product, InventoryBatch, InventoryMovement, PriceHistory, User, UnitType } from '../types';
import { ApiClient } from '../lib/api';
import { KIRYANA_PRESETS, autoGenerateUrdu, KiryanaPreset } from '../lib/kiryanaCatalog';

interface InventoryManagementProps {
  currentUser: User;
}

export const InventoryManagement: React.FC<InventoryManagementProps> = ({ currentUser }) => {
  const isOwner = currentUser.role === 'OWNER';
  const [activeSubTab, setActiveSubTab] = useState<'products' | 'batches' | 'movements'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [batches, setBatches] = useState<InventoryBatch[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [productSearchQuery, setProductSearchQuery] = useState('');

  // Modals
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showAddBatchModal, setShowAddBatchModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Forms
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    urduName: '',
    romanUrduName: '',
    categoryId: 1,
    unitType: 'KG' as UnitType,
    baseUnitRatio: 1000,
    currentSellingPrice: 0,
    minStockThreshold: 10,
    initialStockMajorUnit: 0,
    initialCostPricePerMajorUnit: 0,
  });

  const [newBatchForm, setNewBatchForm] = useState({
    productId: 0,
    batchNumber: '',
    quantityMajorUnit: 0,
    costPricePerMajorUnit: 0,
    notes: '',
  });

  const [adjustmentForm, setAdjustmentForm] = useState({
    productId: 0,
    quantityMajorUnit: 0,
    reason: 'Damaged',
    notes: '',
  });

  const [newPrice, setNewPrice] = useState<number>(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, bts, movs, cats] = await Promise.all([
        ApiClient.getProducts(),
        ApiClient.getBatches(),
        ApiClient.getMovements(),
        ApiClient.getCategories(),
      ]);
      setProducts(prods);
      setBatches(bts);
      setMovements(movs);
      setCategories(cats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const [suggestions, setSuggestions] = useState<KiryanaPreset[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [customUrduEdit, setCustomUrduEdit] = useState(false);

  const handleItemNameChange = (val: string) => {
    const autoUrdu = autoGenerateUrdu(val);
    setNewProductForm((prev) => ({
      ...prev,
      romanUrduName: val,
      name: val,
      urduName: customUrduEdit ? prev.urduName : autoUrdu,
    }));

    if (val.trim().length >= 2) {
      const q = val.toLowerCase();
      const filtered = KIRYANA_PRESETS.filter(
        (p) => p.romanName.toLowerCase().includes(q) || p.urduName.includes(val)
      ).slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectPreset = (preset: KiryanaPreset) => {
    let catId = newProductForm.categoryId;
    const matchedCategory = categories.find((c) =>
      c.name.toLowerCase().includes(preset.categoryName.toLowerCase())
    );
    if (matchedCategory) {
      catId = matchedCategory.id;
    } else if (categories.length > 0) {
      catId = categories[0].id;
    }

    setNewProductForm((prev) => ({
      ...prev,
      romanUrduName: preset.romanName,
      name: preset.romanName,
      urduName: preset.urduName,
      categoryId: catId,
      unitType: preset.unitType,
      baseUnitRatio: preset.unitType === 'KG' || preset.unitType === 'LITRE' ? 1000 : 1,
      currentSellingPrice: preset.suggestedPrice,
    }));
    setShowSuggestions(false);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const itemName = newProductForm.romanUrduName.trim() || newProductForm.name.trim();
    if (!itemName) {
      alert('Barah-e-karam item ka naam likhein.');
      return;
    }
    if (newProductForm.currentSellingPrice <= 0) {
      alert('Barah-e-karam selling price darj karein.');
      return;
    }

    const finalUrdu = newProductForm.urduName.trim() || autoGenerateUrdu(itemName) || itemName;

    try {
      await ApiClient.createProduct({
        ...newProductForm,
        name: itemName,
        romanUrduName: itemName,
        urduName: finalUrdu,
        baseUnitRatio:
          newProductForm.unitType === 'KG' || newProductForm.unitType === 'LITRE' ? 1000 : 1,
      });
      setShowAddProductModal(false);
      setNewProductForm({
        name: '',
        urduName: '',
        romanUrduName: '',
        categoryId: categories.length > 0 ? categories[0].id : 1,
        unitType: 'KG',
        baseUnitRatio: 1000,
        currentSellingPrice: 0,
        minStockThreshold: 10,
        initialStockMajorUnit: 0,
        initialCostPricePerMajorUnit: 0,
      });
      setSuggestions([]);
      setShowSuggestions(false);
      setCustomUrduEdit(false);
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error creating product');
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchForm.productId || newBatchForm.quantityMajorUnit <= 0) return;

    try {
      await ApiClient.createBatch({
        ...newBatchForm,
        batchNumber: newBatchForm.batchNumber || `BATCH-${Date.now().toString().slice(-6)}`,
      });
      setShowAddBatchModal(false);
      setNewBatchForm({ productId: 0, batchNumber: '', quantityMajorUnit: 0, costPricePerMajorUnit: 0, notes: '' });
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error creating batch');
    }
  };

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustmentForm.productId || adjustmentForm.quantityMajorUnit === 0) return;

    try {
      await ApiClient.adjustStock({
        productId: adjustmentForm.productId,
        quantityMajorUnit: -Math.abs(adjustmentForm.quantityMajorUnit),
        reason: adjustmentForm.reason,
        notes: adjustmentForm.notes,
      });
      setShowAdjustmentModal(false);
      setAdjustmentForm({ productId: 0, quantityMajorUnit: 0, reason: 'Damaged', notes: '' });
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error recording adjustment');
    }
  };

  const handleUpdatePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || newPrice <= 0) return;

    try {
      await ApiClient.updatePrice(selectedProduct.id, newPrice);
      setShowPriceModal(false);
      setSelectedProduct(null);
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error updating price');
    }
  };

  const handleViewPriceHistory = async (prod: Product) => {
    setSelectedProduct(prod);
    try {
      const history = await ApiClient.getPriceHistory(prod.id);
      setPriceHistory(history);
      setShowHistoryModal(true);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error fetching price history');
    }
  };

  return (
    <div className="flex-1 bg-slate-950 p-4 sm:p-6 overflow-y-auto text-slate-100">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Security Role Badge */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <Package className="w-6 h-6 text-emerald-400" />
              Inventory & Products (اسٹاک اور نرخ مینجمنٹ)
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage selling prices, incoming wholesale batches, FIFO costs, and adjustments
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isOwner ? (
              <>
                <button
                  onClick={() => setShowAddProductModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20"
                >
                  <Plus className="w-4 h-4" />
                  Add New Product (نئی پراڈکٹ)
                </button>

                <button
                  onClick={() => setShowAddBatchModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20"
                >
                  <PlusCircle className="w-4 h-4" />
                  Receive Stock Batch (نیا اسٹاک)
                </button>

                <button
                  onClick={() => setShowAdjustmentModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-bold"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Damage / Adjustment (نقصان / کمی)
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Cashier Mode: Price & Cost edits locked for audit security</span>
              </div>
            )}
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveSubTab('products')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'products'
                ? 'bg-slate-900 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tag className="w-4 h-4" />
            Products & Selling Rates ({products.length})
          </button>

          <button
            onClick={() => setActiveSubTab('batches')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'batches'
                ? 'bg-slate-900 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            Wholesale Batches ({batches.length})
          </button>

          <button
            onClick={() => setActiveSubTab('movements')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'movements'
                ? 'bg-slate-900 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            Stock Movement Audit Trail
          </button>
        </div>

        {/* Products & Selling Rates Table */}
        {activeSubTab === 'products' && (() => {
          const filteredProducts = products.filter((p) => {
            if (!productSearchQuery.trim()) return true;
            const q = productSearchQuery.toLowerCase().trim();
            return (
              p.name.toLowerCase().includes(q) ||
              (p.romanUrduName && p.romanUrduName.toLowerCase().includes(q)) ||
              (p.urduName && p.urduName.includes(productSearchQuery.trim())) ||
              (p.categoryName && p.categoryName.toLowerCase().includes(q))
            );
          });

          return (
            <div className="space-y-3">
              {/* Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-3 shadow-sm">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search stock by item name (e.g. kisan ghee, basmati, tapal, سرف)..."
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-10 pr-9 py-2 text-xs text-white placeholder-slate-500 transition"
                  />
                  {productSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setProductSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 px-1 text-xs text-slate-400 self-center sm:self-auto">
                  <span>Showing:</span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 font-bold text-emerald-400">
                    {filteredProducts.length} of {products.length}
                  </span>
                  <span>items</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="py-4 px-5">Product Name</th>
                        <th className="py-4 px-5">Category</th>
                        <th className="py-4 px-5">Unit</th>
                        <th className="py-4 px-5">Current Selling Price</th>
                        <th className="py-4 px-5">Available Stock</th>
                        <th className="py-4 px-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {filteredProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-800/50 transition">
                          <td className="py-3.5 px-5">
                            <div className="font-bold text-white text-sm">{p.name}</div>
                            {p.romanUrduName && (
                              <div className="text-[11px] font-semibold text-emerald-400/90 mt-0.5">
                                {p.romanUrduName}
                              </div>
                            )}
                            <div className="text-xs text-slate-400 font-urdu mt-0.5">{p.urduName}</div>
                          </td>
                          <td className="py-3.5 px-5 text-slate-400">{p.categoryName}</td>
                          <td className="py-3.5 px-5 font-semibold text-emerald-400">{p.unitType}</td>
                          <td className="py-3.5 px-5">
                            <span className="text-sm font-black text-white">
                              Rs. {p.currentSellingPrice.toFixed(2)}
                            </span>
                            <span className="text-slate-400 text-[11px] ml-1">/ {p.unitType}</span>
                          </td>
                          <td className="py-3.5 px-5 font-bold">
                            <span className={p.currentStockMajorUnit <= p.minStockThreshold ? 'text-red-400' : 'text-slate-200'}>
                              {p.currentStockMajorUnit.toFixed(1)} {p.unitType}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-right space-x-2">
                            {isOwner && (
                              <button
                                onClick={() => {
                                  setSelectedProduct(p);
                                  setNewPrice(p.currentSellingPrice);
                                  setShowPriceModal(true);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-bold text-xs border border-emerald-500/30 transition"
                              >
                                Update Sticker Price (نیا ریٹ)
                              </button>
                            )}
                            <button
                              onClick={() => handleViewPriceHistory(p)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700"
                            >
                              Price Log
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredProducts.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-10 text-slate-400">
                            Koi item nahi mila &quot;{productSearchQuery}&quot;
                            <button
                              type="button"
                              onClick={() => setProductSearchQuery('')}
                              className="block mx-auto mt-2 text-xs text-emerald-400 hover:underline font-semibold"
                            >
                              Clear Search Filter (فلٹر ختم کریں)
                            </button>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Batches Table */}
        {activeSubTab === 'batches' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-4 px-5">Batch Number</th>
                    <th className="py-4 px-5">Product Name</th>
                    <th className="py-4 px-5">Wholesale Cost Price</th>
                    <th className="py-4 px-5">Remaining Stock</th>
                    <th className="py-4 px-5">Received Date</th>
                    <th className="py-4 px-5">FIFO Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {batches.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-800/50 transition">
                      <td className="py-3.5 px-5 font-mono font-bold text-emerald-400">{b.batchNumber}</td>
                      <td className="py-3.5 px-5 font-bold text-white">{b.productName}</td>
                      <td className="py-3.5 px-5 font-bold text-white">
                        {isOwner ? `Rs. ${b.costPricePerMajorUnit.toFixed(2)}` : '•••• (Hidden)'}
                      </td>
                      <td className="py-3.5 px-5 font-bold text-slate-200">
                        {b.remainingQuantityMajorUnit.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-5 text-slate-400">
                        {new Date(b.receivedDate).toLocaleDateString('en-GB')}
                      </td>
                      <td className="py-3.5 px-5">
                        {b.isExhausted ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-500">
                            Depleted
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Active Batch
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Movements Table */}
        {activeSubTab === 'movements' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-4 px-5">Timestamp</th>
                    <th className="py-4 px-5">Product</th>
                    <th className="py-4 px-5">Movement Type</th>
                    <th className="py-4 px-5">Quantity</th>
                    <th className="py-4 px-5">Reference / Notes</th>
                    <th className="py-4 px-5">Operator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {movements.map((m) => {
                    const isPositive = m.quantityBaseUnit > 0;
                    return (
                      <tr key={m.id} className="hover:bg-slate-800/50 transition">
                        <td className="py-3.5 px-5 text-slate-400">
                          {new Date(m.createdAt).toLocaleString('en-GB')}
                        </td>
                        <td className="py-3.5 px-5 font-bold text-white">{m.productName}</td>
                        <td className="py-3.5 px-5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                            {m.movementType}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 font-bold flex items-center gap-1">
                          {isPositive ? (
                            <span className="text-emerald-400 flex items-center">
                              <ArrowUpRight className="w-3.5 h-3.5" /> +{m.quantityMajorUnit.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-red-400 flex items-center">
                              <ArrowDownRight className="w-3.5 h-3.5" /> {m.quantityMajorUnit.toFixed(2)}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-5 text-slate-400">
                          {m.referenceId} {m.reason ? `(${m.reason})` : ''}
                        </td>
                        <td className="py-3.5 px-5 text-slate-300">{m.userFullName}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add New Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-white">Add New Product (نئی پراڈکٹ شامل کریں)</h3>
                <p className="text-[11px] text-slate-400">Add any ration, grocery, or household item to store catalog</p>
              </div>
              <button onClick={() => setShowAddProductModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3.5">
              {/* Single Roman Urdu Item Input with Autocomplete */}
              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Item Ka Naam (آئٹم کا نام - Roman Urdu):</span>
                  </label>
                  <span className="text-[10px] text-slate-400">English ki zaroorat nahi</span>
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. kisan ghee, basmati chawal, tapal chai, surf excel..."
                  value={newProductForm.romanUrduName}
                  onChange={(e) => handleItemNameChange(e.target.value)}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3.5 py-2.5 text-white font-medium text-xs placeholder-slate-500 transition"
                />

                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-slate-950/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl z-20 max-h-48 overflow-y-auto divide-y divide-slate-800">
                    <div className="p-1.5 text-[10px] text-slate-400 font-medium bg-slate-900/60 px-3">
                      ⚡ Quick Suggestions (1-tap pe sab details auto-fill):
                    </div>
                    {suggestions.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className="w-full px-3 py-2 text-left hover:bg-slate-800/80 transition flex items-center justify-between group"
                      >
                        <div>
                          <div className="text-white text-xs font-semibold group-hover:text-emerald-300">
                            {preset.romanName}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {preset.categoryName} • Unit: {preset.unitType}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-emerald-400 font-urdu">{preset.urduName}</div>
                          <div className="text-[10px] text-slate-400">Rs. {preset.suggestedPrice}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Live Auto-Urdu Badge */}
                <div className="mt-2 flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">اردو نام (Auto-generated):</span>
                    {customUrduEdit ? (
                      <input
                        type="text"
                        value={newProductForm.urduName}
                        onChange={(e) => setNewProductForm({ ...newProductForm, urduName: e.target.value })}
                        className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-emerald-400 font-urdu text-right"
                      />
                    ) : (
                      <span className="text-xs font-semibold text-emerald-400 font-urdu px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                        {newProductForm.urduName || 'خودکار اردو نام یہاں آئے گا'}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setCustomUrduEdit(!customUrduEdit)}
                    className="text-[10px] text-slate-400 hover:text-slate-200 underline"
                  >
                    {customUrduEdit ? 'Save Urdu' : 'Urdu Tabdeel Karein'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold">Category:</label>
                  <select
                    value={newProductForm.categoryId}
                    onChange={(e) => setNewProductForm({ ...newProductForm, categoryId: parseInt(e.target.value) })}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-semibold">Unit Type (یونٹ):</label>
                  <select
                    value={newProductForm.unitType}
                    onChange={(e) => setNewProductForm({ ...newProductForm, unitType: e.target.value as UnitType })}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                  >
                    <option value="KG">KG (کلو - وزن)</option>
                    <option value="GRAM">GRAM (گرام)</option>
                    <option value="LITRE">LITRE (لٹر - تیل وغیرہ)</option>
                    <option value="PACK">PACK (پیکٹ)</option>
                    <option value="PIECE">PIECE (عدد / بوتل / صابن)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold">Selling Price (فروخت ریٹ):</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 350"
                    value={newProductForm.currentSellingPrice || ''}
                    onChange={(e) => setNewProductForm({ ...newProductForm, currentSellingPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-semibold">Opening Stock (موجودہ اسٹاک):</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 50"
                    value={newProductForm.initialStockMajorUnit || ''}
                    onChange={(e) => setNewProductForm({ ...newProductForm, initialStockMajorUnit: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-semibold">Wholesale Cost Price per unit (خریداری قیمت):</label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 300"
                  value={newProductForm.initialCostPricePerMajorUnit || ''}
                  onChange={(e) => setNewProductForm({ ...newProductForm, initialCostPricePerMajorUnit: parseFloat(e.target.value) || 0 })}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/30"
                >
                  Save Product (محفوظ کریں)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Selling / Sticker Price Modal */}
      {showPriceModal && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4 text-xs">
            <div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Sticker Rate Update (نیا پرچی ریٹ)
              </span>
              <h3 className="text-base font-bold text-white mt-2">{selectedProduct.name}</h3>
              <p className="text-xs text-slate-400 font-urdu">{selectedProduct.urduName}</p>
            </div>

            <form onSubmit={handleUpdatePrice} className="space-y-4">
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <span className="text-slate-400">Current Selling Rate:</span>
                <div className="text-xl font-black text-slate-300 mt-0.5">
                  Rs. {selectedProduct.currentSellingPrice.toFixed(2)} / {selectedProduct.unitType}
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-semibold">New Sticker / Selling Price (Rs.):</label>
                <input
                  type="number"
                  step="any"
                  required
                  autoFocus
                  placeholder="e.g. 375"
                  value={newPrice || ''}
                  onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-white font-black text-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowPriceModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/30"
                >
                  Apply Rate (ریٹ لاگو کریں)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Batch Modal */}
      {showAddBatchModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white">Receive Stock Batch (نیا اسٹاک درج کریں)</h3>
              <button onClick={() => setShowAddBatchModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-3">
              <div>
                <label className="text-slate-400">Product:</label>
                <select
                  value={newBatchForm.productId}
                  onChange={(e) => setNewBatchForm({ ...newBatchForm, productId: parseInt(e.target.value) })}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  required
                >
                  <option value="0">Select Product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.unitType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400">Batch Identifier (Optional):</label>
                <input
                  type="text"
                  placeholder="e.g. BATCH-2026-SEP-01"
                  value={newBatchForm.batchNumber}
                  onChange={(e) => setNewBatchForm({ ...newBatchForm, batchNumber: e.target.value })}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400">Quantity (Major Units):</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newBatchForm.quantityMajorUnit || ''}
                    onChange={(e) => setNewBatchForm({ ...newBatchForm, quantityMajorUnit: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-400">Cost Price per unit:</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newBatchForm.costPricePerMajorUnit || ''}
                    onChange={(e) => setNewBatchForm({ ...newBatchForm, costPricePerMajorUnit: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400">Notes:</label>
                <textarea
                  value={newBatchForm.notes}
                  onChange={(e) => setNewBatchForm({ ...newBatchForm, notes: e.target.value })}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  rows={2}
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddBatchModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-600/30"
                >
                  Save Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white">Record Damage / Adjustment (نقصان کا اندراج)</h3>
              <button onClick={() => setShowAdjustmentModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStockAdjustment} className="space-y-3">
              <div>
                <label className="text-slate-400">Product:</label>
                <select
                  value={adjustmentForm.productId}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, productId: parseInt(e.target.value) })}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  required
                >
                  <option value="0">Select Product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.unitType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400">Reason (وجہ):</label>
                <select
                  value={adjustmentForm.reason}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                >
                  <option value="Damaged">Damaged (خراب مال)</option>
                  <option value="Expired">Expired (مدت ختم)</option>
                  <option value="SupplierReturn">Supplier Return (واپسی سپلائر)</option>
                  <option value="Lost">Lost (گم شدہ / چوری)</option>
                  <option value="CountingError">Counting Error (گنتی کی غلطی)</option>
                  <option value="Other">Other (دیگر)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400">Quantity to Deduct (Major Units):</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="e.g. 2.5"
                  value={adjustmentForm.quantityMajorUnit || ''}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, quantityMajorUnit: parseFloat(e.target.value) || 0 })}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="text-slate-400">Notes / Reason Details:</label>
                <textarea
                  value={adjustmentForm.notes}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, notes: e.target.value })}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  rows={2}
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustmentModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-amber-600 text-white font-bold shadow-lg shadow-amber-600/30"
                >
                  Confirm Deduction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Price History Modal */}
      {showHistoryModal && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-white">Price History (ریٹ کی تاریخ)</h3>
                <p className="text-xs text-slate-400">{selectedProduct.name}</p>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {priceHistory.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No past rate adjustments recorded yet.</p>
              ) : (
                priceHistory.map((h) => (
                  <div key={h.id} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="line-through text-slate-500 font-bold">Rs. {h.oldPrice}</span>
                        <span className="text-emerald-400 font-bold text-sm">➔ Rs. {h.newPrice}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Updated by: {h.changedBy}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(h.changedAt).toLocaleDateString('en-GB')}
                    </span>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowHistoryModal(false)}
              className="w-full py-3 rounded-xl bg-slate-800 text-slate-300 font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

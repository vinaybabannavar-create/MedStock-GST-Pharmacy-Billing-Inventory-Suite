import React, { useState } from 'react';
import { Search, Plus, Receipt, X, UserPlus, Pill, ChevronDown, ChevronUp } from 'lucide-react';

export default function Billing({
  customers,
  medicines,
  selectedCustomerId,
  setSelectedCustomerId,
  walkInName,
  setWalkInName,
  walkInPhone,
  setWalkInPhone,
  walkInStateCode,
  setWalkInStateCode,
  medSearchQuery,
  setMedSearchQuery,
  filteredMedicines,
  cart,
  discount,
  setDiscount,
  paymentMode,
  setPaymentMode,
  totals,
  handleAddToCart,
  updateCartQty,
  updateCartPrice,
  removeFromCart,
  handleCheckout,
  getCustomerStateCode,
  isLocalCustomer,
  // Quick-add handlers passed from App.jsx
  handleQuickAddCustomer,
  handleQuickAddMedicine,
}) {
  // Inline add-customer panel state
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCust, setNewCust] = useState({ name: '', phone: '', address: '', state_code: '29' });
  const [custLoading, setCustLoading] = useState(false);

  // Inline add-medicine panel state
  const [showAddMedicine, setShowAddMedicine] = useState(false);
  const [newMed, setNewMed] = useState({
    name: '', generic_name: '', manufacturer: '', hsn_code: '',
    gst_rate: '12.00', unit: 'Strip', category: 'Tablet'
  });
  const [medLoading, setMedLoading] = useState(false);

  const submitNewCustomer = async (e) => {
    e.preventDefault();
    setCustLoading(true);
    const ok = await handleQuickAddCustomer(newCust);
    if (ok) {
      setNewCust({ name: '', phone: '', address: '', state_code: '29' });
      setShowAddCustomer(false);
    }
    setCustLoading(false);
  };

  const submitNewMedicine = async (e) => {
    e.preventDefault();
    setMedLoading(true);
    const ok = await handleQuickAddMedicine(newMed);
    if (ok) {
      setNewMed({ name: '', generic_name: '', manufacturer: '', hsn_code: '', gst_rate: '12.00', unit: 'Strip', category: 'Tablet' });
      setShowAddMedicine(false);
    }
    setMedLoading(false);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Billing Counter</h2>
        <p className="text-sm text-slate-500 mt-1">Create GST-compliant invoices with FEFO batch selection</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Customer and Medicine Select */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* ── Customer Selection ── */}
          <div className="bg-white border border-slate-200/50 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Customer Details</h3>
              <button
                type="button"
                onClick={() => setShowAddCustomer(v => !v)}
                className={`flex items-center gap-1.5 text-xs font-bold py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
                  showAddCustomer
                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                }`}
              >
                {showAddCustomer ? <X size={13} /> : <UserPlus size={13} />}
                {showAddCustomer ? 'Cancel' : 'Add New'}
              </button>
            </div>

            {/* Inline add-customer form */}
            {showAddCustomer && (
              <form onSubmit={submitNewCustomer} className="mb-4 p-4 bg-indigo-50/40 border border-indigo-100/50 rounded-2xl space-y-3 animate-slide-in">
                <p className="text-[10px] font-black text-indigo-700 uppercase tracking-wider">New Customer</p>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Full Name *</label>
                  <input
                    type="text" required
                    value={newCust.name}
                    onChange={e => setNewCust({ ...newCust, name: e.target.value })}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Phone *</label>
                    <input
                      type="text" required
                      value={newCust.phone}
                      onChange={e => setNewCust({ ...newCust, phone: e.target.value })}
                      placeholder="9876543210"
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">State Code</label>
                    <input
                      type="text"
                      value={newCust.state_code}
                      onChange={e => setNewCust({ ...newCust, state_code: e.target.value })}
                      placeholder="29"
                      maxLength="2"
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-mono focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Address (Optional)</label>
                  <input
                    type="text"
                    value={newCust.address}
                    onChange={e => setNewCust({ ...newCust, address: e.target.value })}
                    placeholder="Bengaluru, Karnataka"
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={custLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold py-2 rounded-xl text-xs transition-all cursor-pointer"
                >
                  {custLoading ? 'Saving...' : 'Save & Select Customer'}
                </button>
              </form>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Select Registered Customer
                  <span className="ml-2 text-slate-400 font-normal">({customers.length} registered)</span>
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={e => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Walk-in / Unsaved Customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                  ))}
                </select>
              </div>

              {!selectedCustomerId && (
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                  <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Walk-in Info</span>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Name</label>
                    <input
                      type="text"
                      value={walkInName}
                      onChange={e => setWalkInName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Phone</label>
                      <input
                        type="text"
                        value={walkInPhone}
                        onChange={e => setWalkInPhone(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">GST State Code</label>
                      <input
                        type="text"
                        value={walkInStateCode}
                        onChange={e => setWalkInStateCode(e.target.value)}
                        placeholder="29"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Medicine Search & Click to Add ── */}
          <div className="bg-white border border-slate-200/50 rounded-3xl p-6 shadow-sm flex flex-col" style={{ minHeight: '440px', maxHeight: '580px' }}>
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Add Medicine</h3>
              <button
                type="button"
                onClick={() => setShowAddMedicine(v => !v)}
                className={`flex items-center gap-1.5 text-xs font-bold py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
                  showAddMedicine
                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                {showAddMedicine ? <X size={13} /> : <Pill size={13} />}
                {showAddMedicine ? 'Cancel' : 'Add New'}
              </button>
            </div>

            {/* Inline add-medicine form */}
            {showAddMedicine && (
              <form onSubmit={submitNewMedicine} className="mb-4 p-4 bg-emerald-50/40 border border-emerald-100/50 rounded-2xl space-y-3 overflow-y-auto max-h-[380px] animate-slide-in">
                <p className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">New Medicine Catalog Entry</p>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Medicine Name *</label>
                  <input
                    type="text" required
                    value={newMed.name}
                    onChange={e => setNewMed({ ...newMed, name: e.target.value })}
                    placeholder="e.g. Paracetamol 500mg"
                    className="w-full bg-white border border-emerald-200 rounded-xl p-2 text-xs focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Generic Name</label>
                    <input
                      type="text"
                      value={newMed.generic_name}
                      onChange={e => setNewMed({ ...newMed, generic_name: e.target.value })}
                      placeholder="e.g. Paracetamol"
                      className="w-full bg-white border border-emerald-200 rounded-xl p-2 text-xs focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">HSN Code *</label>
                    <input
                      type="text" required
                      value={newMed.hsn_code}
                      onChange={e => setNewMed({ ...newMed, hsn_code: e.target.value })}
                      placeholder="30049099"
                      className="w-full bg-white border border-emerald-200 rounded-xl p-2 text-xs font-mono focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">GST Rate (%) *</label>
                    <select
                      value={newMed.gst_rate}
                      onChange={e => setNewMed({ ...newMed, gst_rate: e.target.value })}
                      className="w-full bg-white border border-emerald-200 rounded-xl p-2 text-xs focus:outline-none"
                    >
                      <option value="0.00">0%</option>
                      <option value="5.00">5%</option>
                      <option value="12.00">12%</option>
                      <option value="18.00">18%</option>
                      <option value="28.00">28%</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Unit *</label>
                    <input
                      type="text" required
                      value={newMed.unit}
                      onChange={e => setNewMed({ ...newMed, unit: e.target.value })}
                      placeholder="Strip"
                      className="w-full bg-white border border-emerald-200 rounded-xl p-2 text-xs focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Category *</label>
                    <input
                      type="text" required
                      value={newMed.category}
                      onChange={e => setNewMed({ ...newMed, category: e.target.value })}
                      placeholder="Tablet"
                      className="w-full bg-white border border-emerald-200 rounded-xl p-2 text-xs focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Manufacturer *</label>
                    <input
                      type="text"
                      value={newMed.manufacturer}
                      onChange={e => setNewMed({ ...newMed, manufacturer: e.target.value })}
                      placeholder="Cipla Ltd."
                      className="w-full bg-white border border-emerald-200 rounded-xl p-2 text-xs focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={medLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold py-2 rounded-xl text-xs transition-all cursor-pointer"
                >
                  {medLoading ? 'Saving...' : 'Save Medicine to Catalog'}
                </button>
              </form>
            )}

            {/* Search box */}
            {!showAddMedicine && (
              <>
                <div className="relative mb-3">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                    <Search size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder={`Search ${medicines.length} medicines...`}
                    value={medSearchQuery}
                    onChange={e => setMedSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-550"
                  />
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-1">
                  {filteredMedicines.map(med => (
                    <div
                      key={med.id}
                      onClick={() => handleAddToCart(med)}
                      className="py-3 flex justify-between items-center cursor-pointer hover:bg-slate-50 px-2 rounded-xl transition-all smooth-hover"
                    >
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">{med.name}</h4>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {med.generic_name && <span className="mr-2 text-slate-500 font-semibold">{med.generic_name}</span>}
                          HSN: {med.hsn_code} | GST: {med.gst_rate}%
                        </span>
                      </div>
                      <button className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 p-1.5 rounded-full transition-all shrink-0 cursor-pointer">
                        <Plus size={16} />
                      </button>
                    </div>
                  ))}
                  {filteredMedicines.length === 0 && (
                    <div className="py-8 text-center">
                      <p className="text-xs text-slate-400">No matching medicines found.</p>
                      <button
                        type="button"
                        onClick={() => setShowAddMedicine(true)}
                        className="mt-2 text-xs text-emerald-600 font-bold hover:underline cursor-pointer"
                      >
                        + Add this medicine to catalog
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Column: Billing Cart & Totals */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleCheckout} className="bg-white border border-slate-200/50 rounded-3xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Invoice Cart Items</h3>
              <span className="text-xs bg-indigo-50 text-indigo-650 py-1 px-2.5 rounded-full font-bold">
                {cart.length} items
              </span>
            </div>

            {/* Cart Table */}
            <div className="overflow-x-auto min-h-[240px]">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    <th className="py-3 px-5">Medicine & Batch</th>
                    <th className="py-3 px-5 text-right w-24">Qty</th>
                    <th className="py-3 px-5 text-right w-28">Sale Price (₹)</th>
                    <th className="py-3 px-5 text-right w-24">GST</th>
                    <th className="py-3 px-5 text-right">Line Total</th>
                    <th className="py-3 px-5 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {cart.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-16 text-center text-slate-455 font-medium">
                        Cart is empty. Search and add medicines on the left.
                      </td>
                    </tr>
                  ) : (
                    cart.map((item, idx) => {
                      const sub = (parseFloat(item.sale_price) || 0) * item.quantity;
                      return (
                        <tr key={item.batch_id} className="hover:bg-slate-50/50 transition-all">
                          <td className="py-3.5 px-5">
                            <div className="font-extrabold text-slate-900 leading-snug">{item.name}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5 flex gap-2">
                              <span className="bg-slate-100 py-0.5 px-1.5 rounded-md font-mono font-bold text-slate-600">Batch: {item.batch_no}</span>
                              <span className="flex items-center">Exp: {item.expiry_date}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <input
                              type="number"
                              min="1"
                              max={item.max_quantity}
                              value={item.quantity}
                              onChange={e => updateCartQty(idx, e.target.value)}
                              className="w-16 bg-slate-50 border border-slate-200 rounded-lg p-1 text-center font-bold text-sm focus:outline-none"
                            />
                            <span className="block text-[8px] text-slate-400 mt-1 uppercase font-bold">Max: {item.max_quantity}</span>
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <input
                              type="text"
                              value={item.sale_price}
                              onChange={e => updateCartPrice(idx, e.target.value)}
                              className="w-24 bg-slate-50 border border-slate-200 rounded-lg p-1 text-right font-mono focus:outline-none"
                            />
                          </td>
                          <td className="py-3.5 px-5 text-right font-bold text-slate-500">
                            {item.gst_rate}%
                          </td>
                          <td className="py-3.5 px-5 text-right font-mono font-bold text-slate-900">
                            ₹{sub.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-5 text-center">
                            <button
                              type="button"
                              onClick={() => removeFromCart(idx)}
                              className="text-xs font-bold text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 py-1 px-2.5 rounded-lg transition-all cursor-pointer"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Summary & Checkout Footer */}
            <div className="bg-slate-50/50 border-t border-slate-100 p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Billing options */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Discount (₹)</label>
                    <input
                      type="text"
                      value={discount}
                      onChange={e => setDiscount(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-sm font-mono focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Payment Mode</label>
                    <select
                      value={paymentMode}
                      onChange={e => setPaymentMode(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                      <option value="UPI">UPI / QR Code</option>
                    </select>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 mt-2 bg-white border border-slate-200/60 p-3.5 rounded-2xl leading-relaxed">
                  <span className="font-bold text-slate-700 block mb-1">GST Tax Allocation Rules:</span>
                  Customer State: <span className="font-bold">{getCustomerStateCode()}</span>.{' '}
                  Tax Split: <span className="font-bold text-indigo-650">{isLocalCustomer() ? 'Local CGST (6%) + SGST (6%)' : 'Interstate IGST (12%)'}</span>
                </div>
              </div>

              {/* Final checkout totals */}
              <div className="space-y-4 bg-white border border-slate-200/80 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
                <div className="space-y-2 text-xs text-slate-600 font-mono">
                  <div className="flex justify-between"><span>Base Subtotal:</span><span>₹{totals.subtotal}</span></div>
                  
                  {isLocalCustomer() ? (
                    <>
                      <div className="flex justify-between"><span>CGST:</span><span>₹{totals.cgst}</span></div>
                      <div className="flex justify-between"><span>SGST:</span><span>₹{totals.sgst}</span></div>
                    </>
                  ) : (
                    <div className="flex justify-between"><span>IGST:</span><span>₹{totals.igst}</span></div>
                  )}

                  {parseFloat(discount) > 0 && (
                    <div className="flex justify-between text-rose-600"><span>Discount:</span><span>-₹{parseFloat(discount).toFixed(2)}</span></div>
                  )}
                  
                  <div className="flex justify-between text-lg font-black text-slate-900 border-t border-dashed border-slate-200 pt-2.5">
                    <span>Grand Total:</span>
                    <span className="text-xl">₹{totals.total}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={cart.length === 0}
                  className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Receipt size={18} />
                  <span>Finalize Invoice & Checkout</span>
                </button>
              </div>

            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Search, Plus, Receipt } from 'lucide-react';

export default function Billing({
  customers,
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
  isLocalCustomer
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Billing Counter</h2>
        <p className="text-sm text-slate-500 mt-0.5">Create GST-compliant invoices with FEFO batch selection</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Customer and Medicine Select */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Customer selection */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Customer Details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Select Registered Customer</label>
                <select
                  value={selectedCustomerId}
                  onChange={e => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Walk-in / Unsaved Customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                  ))}
                </select>
              </div>

              {!selectedCustomerId && (
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Walk-in Info</span>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Name</label>
                    <input 
                      type="text" 
                      value={walkInName}
                      onChange={e => setWalkInName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Phone</label>
                      <input 
                      type="text" 
                      value={walkInPhone}
                      onChange={e => setWalkInPhone(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs"
                    />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">GST State Code</label>
                      <input 
                        type="text" 
                        value={walkInStateCode}
                        onChange={e => setWalkInStateCode(e.target.value)}
                        placeholder="29"
                        className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Medicine Search & Click to Add */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col h-[400px]">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">Add Medicine</h3>
            
            <div className="relative mb-4">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <Search size={16} />
              </span>
              <input 
                type="text"
                placeholder="Search catalog..."
                value={medSearchQuery}
                onChange={e => setMedSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-1">
              {filteredMedicines.map(med => (
                <div 
                  key={med.id} 
                  onClick={() => handleAddToCart(med)}
                  className="py-3 flex justify-between items-center cursor-pointer hover:bg-slate-50/80 px-2 rounded-lg transition-all"
                >
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{med.name}</h4>
                    <span className="text-[10px] text-slate-400 block mt-0.5">HSN: {med.hsn_code} | GST: {med.gst_rate}%</span>
                  </div>
                  <button className="bg-blue-50 text-blue-600 hover:bg-blue-100 p-1.5 rounded-full transition-all">
                    <Plus size={16} />
                  </button>
                </div>
              ))}
              {filteredMedicines.length === 0 && (
                <p className="text-xs text-center text-slate-400 py-8">No matching medicines found.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Billing Cart & Totals */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleCheckout} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Invoice Cart Items</h3>
              <span className="text-xs bg-blue-50 text-blue-600 py-1 px-2.5 rounded-full font-bold">
                {cart.length} unique items
              </span>
            </div>

            {/* Cart Table */}
            <div className="overflow-x-auto min-h-[220px]">
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
                      <td colSpan="6" className="py-16 text-center text-slate-400 font-medium">
                        Cart is empty. Search and add medicines on the left.
                      </td>
                    </tr>
                  ) : (
                    cart.map((item, idx) => {
                      const sub = (parseFloat(item.sale_price) || 0) * item.quantity;
                      return (
                        <tr key={item.batch_id} className="hover:bg-slate-50/50 transition-all">
                          <td className="py-3.5 px-5">
                            <div className="font-bold text-slate-900">{item.name}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5 flex gap-2">
                              <span className="bg-slate-100 py-0.5 px-1 rounded font-mono font-bold text-slate-600">Batch: {item.batch_no}</span>
                              <span>Exp: {item.expiry_date}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <input 
                              type="number"
                              min="1"
                              max={item.max_quantity}
                              value={item.quantity}
                              onChange={e => updateCartQty(idx, e.target.value)}
                              className="w-16 bg-slate-50 border border-slate-200 rounded p-1 text-center font-bold text-sm"
                            />
                            <span className="block text-[8px] text-slate-400 mt-1 uppercase">Max: {item.max_quantity}</span>
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <input 
                              type="text"
                              value={item.sale_price}
                              onChange={e => updateCartPrice(idx, e.target.value)}
                              className="w-24 bg-slate-50 border border-slate-200 rounded p-1 text-right font-mono"
                            />
                          </td>
                          <td className="py-3.5 px-5 text-right font-semibold text-slate-500">
                            {item.gst_rate}%
                          </td>
                          <td className="py-3.5 px-5 text-right font-mono font-bold text-slate-900">
                            ₹{sub.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-5 text-center">
                            <button 
                              type="button"
                              onClick={() => removeFromCart(idx)}
                              className="text-rose-500 hover:text-rose-600 font-bold"
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
            <div className="bg-slate-50 border-t border-slate-100 p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Billing options */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Discount (₹)</label>
                    <input 
                      type="text" 
                      value={discount}
                      onChange={e => setDiscount(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm font-mono focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Payment Mode</label>
                    <select
                      value={paymentMode}
                      onChange={e => setPaymentMode(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm focus:outline-none"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                      <option value="UPI">UPI / QR Code</option>
                    </select>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 mt-2 bg-white border border-slate-200/60 p-3 rounded-lg leading-relaxed">
                  <span className="font-bold text-slate-700 block mb-1">GST Tax Allocation Rules:</span>
                  Customer State: <span className="font-bold">{getCustomerStateCode()}</span>. 
                  Tax Split: <span className="font-bold text-indigo-600">{isLocalCustomer() ? 'Local CGST (6%) + SGST (6%)' : 'Interstate IGST (12%)'}</span>
                </div>
              </div>

              {/* Final checkout totals */}
              <div className="space-y-3 bg-white border border-slate-200 p-4 rounded-xl flex flex-col justify-between shadow-sm">
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
                  
                  <div className="flex justify-between text-lg font-black text-slate-900 border-t border-dashed border-slate-200 pt-2">
                    <span>Grand Total:</span>
                    <span>₹{totals.total}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={cart.length === 0}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
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

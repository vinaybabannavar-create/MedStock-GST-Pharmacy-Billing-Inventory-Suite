import React from 'react';
import { Plus } from 'lucide-react';

export default function Suppliers({
  newSupplier,
  setNewSupplier,
  handleAddSupplier,
  suppliers
}) {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Suppliers</h2>
        <p className="text-sm text-slate-500 mt-1">Manage medicine vendors and GST details</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form */}
        <div className="bg-white border border-slate-200/50 rounded-3xl p-6 shadow-sm h-fit relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2 uppercase tracking-widest">
            <Plus size={18} className="text-indigo-500" />
            <span>Register Supplier</span>
          </h3>
          
          <form onSubmit={handleAddSupplier} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Supplier Name</label>
              <input 
                type="text" 
                value={newSupplier.name} 
                onChange={e => setNewSupplier({...newSupplier, name: e.target.value})}
                required
                placeholder="e.g. Karnataka Meds Distributor"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">GSTIN</label>
                <input 
                  type="text" 
                  value={newSupplier.gstin} 
                  onChange={e => setNewSupplier({...newSupplier, gstin: e.target.value.toUpperCase()})}
                  required
                  maxLength="20"
                  placeholder="e.g. 29AAAAA1234A1Z1"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">State Code</label>
                <input 
                  type="text" 
                  value={newSupplier.state_code} 
                  onChange={e => setNewSupplier({...newSupplier, state_code: e.target.value})}
                  required
                  maxLength="3"
                  placeholder="29"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Phone Number</label>
              <input 
                type="text" 
                value={newSupplier.phone} 
                onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})}
                required
                placeholder="9876543210"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Full Address</label>
              <textarea 
                value={newSupplier.address} 
                onChange={e => setNewSupplier({...newSupplier, address: e.target.value})}
                required
                placeholder="No. 12, MG Road, Bengaluru"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none h-20 resize-none"
              />
            </div>

            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-650 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
            >
              Save Supplier
            </button>
          </form>
        </div>

        {/* Right Column: Listing */}
        <div className="lg:col-span-2 bg-white border border-slate-200/50 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Suppliers Directory</h3>
            <span className="text-[10px] bg-slate-100 text-slate-655 py-1 px-2.5 rounded-full font-bold">{suppliers.length} vendors</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="py-3.5 px-5">ID</th>
                  <th className="py-3.5 px-5">Name</th>
                  <th className="py-3.5 px-5">GSTIN / State</th>
                  <th className="py-3.5 px-5">Phone</th>
                  <th className="py-3.5 px-5">Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {suppliers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-400 font-medium">No suppliers registered. Add one using the form.</td>
                  </tr>
                ) : (
                  suppliers.map(sup => (
                    <tr key={sup.id} className="hover:bg-slate-50/50 transition-all smooth-hover">
                      <td className="py-3.5 px-5 font-mono text-xs text-slate-400">#{sup.id}</td>
                      <td className="py-3.5 px-5 font-extrabold text-slate-900 leading-snug">{sup.name}</td>
                      <td className="py-3.5 px-5">
                        <span className="font-mono text-xs font-bold text-indigo-650 bg-indigo-50/80 py-0.5 px-2 rounded-lg">{sup.gstin}</span>
                        <span className="text-xs text-slate-400 ml-1.5 font-bold">State: {sup.state_code}</span>
                      </td>
                      <td className="py-3.5 px-5 font-medium text-slate-500">{sup.phone}</td>
                      <td className="py-3.5 px-5 max-w-xs truncate text-xs text-slate-500 font-medium">{sup.address}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Plus } from 'lucide-react';

export default function Customers({
  newCustomer,
  setNewCustomer,
  handleAddCustomer,
  customers
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Customers</h2>
        <p className="text-sm text-slate-500 mt-0.5">Manage customer directory and local/interstate markers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm h-fit">
          <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
            <Plus size={18} className="text-blue-500" />
            <span>Register Customer</span>
          </h3>
          
          <form onSubmit={handleAddCustomer} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Customer Name</label>
              <input 
                type="text" 
                value={newCustomer.name} 
                onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
                required
                placeholder="e.g. Ramesh Kumar"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Phone Number</label>
                <input 
                  type="text" 
                  value={newCustomer.phone} 
                  onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}
                  required
                  placeholder="9876543210"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">State Code (Optional)</label>
                <input 
                  type="text" 
                  value={newCustomer.state_code} 
                  onChange={e => setNewCustomer({...newCustomer, state_code: e.target.value})}
                  maxLength="2"
                  placeholder="29"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Full Address (Optional)</label>
              <textarea 
                value={newCustomer.address} 
                onChange={e => setNewCustomer({...newCustomer, address: e.target.value})}
                placeholder="No. 45, 2nd Main Road, Bengaluru"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none h-20 resize-none"
              />
            </div>

            <button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg text-sm transition-all"
            >
              Save Customer
            </button>
          </form>
        </div>

        {/* Right Column: Listing */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800">Customers Directory</h3>
            <span className="text-xs bg-slate-100 text-slate-600 py-1 px-2.5 rounded-full font-bold">{customers.length} registered</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="py-3 px-5">ID</th>
                  <th className="py-3 px-5">Name</th>
                  <th className="py-3 px-5">Phone</th>
                  <th className="py-3 px-5 text-center">State Code</th>
                  <th className="py-3 px-5">Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400 font-medium">No customers registered. Add one using the form.</td>
                  </tr>
                ) : (
                  customers.map(cust => (
                    <tr key={cust.id} className="hover:bg-slate-50/50 transition-all">
                      <td className="py-3.5 px-5 font-mono text-xs">{cust.id}</td>
                      <td className="py-3.5 px-5 font-bold text-slate-900">{cust.name}</td>
                      <td className="py-3.5 px-5">{cust.phone}</td>
                      <td className="py-3.5 px-5 text-center">
                        {cust.state_code ? (
                          <span className="font-mono font-bold text-xs bg-blue-50 text-blue-600 py-0.5 px-2 rounded">
                            {cust.state_code}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">29 (Local Walk-in)</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 max-w-xs truncate text-xs text-slate-500">{cust.address || '-'}</td>
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

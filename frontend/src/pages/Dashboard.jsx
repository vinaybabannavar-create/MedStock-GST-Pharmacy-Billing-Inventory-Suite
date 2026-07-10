import React from 'react';
import { Package, FolderOpen, Truck, Users, AlertTriangle } from 'lucide-react';

export default function Dashboard({
  salesSummary,
  medicines,
  batches,
  suppliers,
  customers,
  alerts
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900">System Dashboard</h2>
        <p className="text-sm text-slate-500 mt-1">Live overview and real-time operations alerts</p>
      </div>

      {/* Sales performance summaries */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200/80 p-6 rounded-xl shadow-sm">
          <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Today's Revenue</span>
          <div className="flex justify-between items-center mt-2">
            <h3 className="text-3xl font-black text-slate-800">
              ₹{salesSummary?.today?.revenue?.toFixed(2) || '0.00'}
            </h3>
            <span className="bg-emerald-50 text-emerald-600 text-xs font-bold py-1 px-2.5 rounded-full">
              {salesSummary?.today?.invoices || 0} Invoices
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-6 rounded-xl shadow-sm">
          <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">This Month's Revenue</span>
          <div className="flex justify-between items-center mt-2">
            <h3 className="text-3xl font-black text-slate-800">
              ₹{salesSummary?.this_month?.revenue?.toFixed(2) || '0.00'}
            </h3>
            <span className="bg-blue-50 text-blue-600 text-xs font-bold py-1 px-2.5 rounded-full">
              {salesSummary?.this_month?.invoices || 0} Invoices
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-6 rounded-xl shadow-sm">
          <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">All-Time Revenue</span>
          <div className="flex justify-between items-center mt-2">
            <h3 className="text-3xl font-black text-slate-800">
              ₹{salesSummary?.all_time?.revenue?.toFixed(2) || '0.00'}
            </h3>
            <span className="bg-indigo-50 text-indigo-600 text-xs font-bold py-1 px-2.5 rounded-full">
              {salesSummary?.all_time?.invoices || 0} Total
            </span>
          </div>
        </div>
      </div>

      {/* Core directories count banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-100/60 border border-slate-200/60 p-4 rounded-lg flex items-center justify-between text-xs text-slate-600">
          <span>Medicines: <b>{medicines.length}</b></span>
          <Package size={14} className="text-slate-400" />
        </div>
        <div className="bg-slate-100/60 border border-slate-200/60 p-4 rounded-lg flex items-center justify-between text-xs text-slate-600">
          <span>Total Batches: <b>{batches.length}</b></span>
          <FolderOpen size={14} className="text-slate-400" />
        </div>
        <div className="bg-slate-100/60 border border-slate-200/60 p-4 rounded-lg flex items-center justify-between text-xs text-slate-600">
          <span>Suppliers: <b>{suppliers.length}</b></span>
          <Truck size={14} className="text-slate-400" />
        </div>
        <div className="bg-slate-100/60 border border-slate-200/60 p-4 rounded-lg flex items-center justify-between text-xs text-slate-600">
          <span>Customers: <b>{customers.length}</b></span>
          <Users size={14} className="text-slate-400" />
        </div>
      </div>

      {/* Expiry alerts and Low stock panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Expiration warnings */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            <span>Batch Expiry Warnings</span>
          </h3>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {/* Already Expired */}
            {alerts?.expired_with_stock?.map(b => (
              <div key={b.batch_id} className="p-3 bg-rose-50 border border-rose-100 rounded-lg flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-rose-700 block">{b.medicine_name}</span>
                  <span className="text-slate-500 font-mono">Batch: {b.batch_no} | Expired: {b.expiry_date}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-rose-600 block">{b.quantity} in stock</span>
                  <span className="text-[10px] text-rose-500 uppercase font-black">{b.days_overdue} days overdue</span>
                </div>
              </div>
            ))}

            {/* 7d Expiry */}
            {alerts?.expiring_critical_7d?.map(b => (
              <div key={b.batch_id} className="p-3 bg-orange-50 border border-orange-100 rounded-lg flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-orange-700 block">{b.medicine_name}</span>
                  <span className="text-slate-500 font-mono">Batch: {b.batch_no} | Expires: {b.expiry_date}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-orange-600 block">{b.quantity} units</span>
                  <span className="text-[10px] text-orange-500 uppercase font-bold">{b.days_remaining}d remaining</span>
                </div>
              </div>
            ))}

            {/* 30d Expiry */}
            {alerts?.expiring_soon_30d?.map(b => (
              <div key={b.batch_id} className="p-3 bg-amber-50 border border-amber-100 rounded-lg flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-amber-700 block">{b.medicine_name}</span>
                  <span className="text-slate-500 font-mono">Batch: {b.batch_no} | Expiry: {b.expiry_date}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-amber-600 block">{b.quantity} units</span>
                  <span className="text-[10px] text-amber-500 font-medium">{b.days_remaining} days left</span>
                </div>
              </div>
            ))}

            {alerts?.summary?.expired_with_stock === 0 && 
             alerts?.summary?.expiring_critical_7d === 0 && 
             alerts?.summary?.expiring_soon_30d === 0 && (
              <p className="text-xs text-slate-400 text-center py-8">No expiring or overdue batches found. ✅</p>
            )}
          </div>
        </div>

        {/* Low stock alerts */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-rose-500" />
            <span>Low Stock Warnings (≤ 10)</span>
          </h3>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {alerts?.low_stock?.map(b => (
              <div key={b.batch_id} className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-slate-800 block">{b.medicine_name}</span>
                  <span className="text-slate-500 font-mono">Batch: {b.batch_no} | Exp: {b.expiry_date}</span>
                </div>
                <span className={`font-bold py-1 px-2.5 rounded text-[11px] ${
                  b.quantity === 0 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {b.quantity === 0 ? 'OUT OF STOCK' : `${b.quantity} Left`}
                </span>
              </div>
            ))}

            {alerts?.summary?.low_stock_batches === 0 && (
              <p className="text-xs text-slate-400 text-center py-8">All batches are well-stocked. ✅</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

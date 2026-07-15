import React from 'react';
import { Package, FolderOpen, Truck, Users, AlertTriangle, TrendingUp, Calendar, Inbox } from 'lucide-react';

export default function Dashboard({
  salesSummary,
  medicines,
  batches,
  suppliers,
  customers,
  alerts
}) {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">System Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">Live overview and real-time operations alerts</p>
        </div>
      </div>

      {/* Sales performance summaries */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200/50 p-6 rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors pointer-events-none"></div>
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Today's Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900 font-mono tracking-tight">
              ₹{salesSummary?.today?.revenue?.toFixed(2) || '0.00'}
            </h3>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold py-0.5 px-2 rounded-full">
                {salesSummary?.today?.invoices || 0} Invoices
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">Today</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/50 p-6 rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors pointer-events-none"></div>
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">This Month</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calendar size={16} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900 font-mono tracking-tight">
              ₹{salesSummary?.this_month?.revenue?.toFixed(2) || '0.00'}
            </h3>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="bg-indigo-50 text-indigo-700 text-[10px] font-extrabold py-0.5 px-2 rounded-full">
                {salesSummary?.this_month?.invoices || 0} Invoices
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">This Month</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/50 p-6 rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors pointer-events-none"></div>
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">All-Time Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Inbox size={16} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900 font-mono tracking-tight">
              ₹{salesSummary?.all_time?.revenue?.toFixed(2) || '0.00'}
            </h3>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="bg-purple-50 text-purple-700 text-[10px] font-extrabold py-0.5 px-2 rounded-full">
                {salesSummary?.all_time?.invoices || 0} Invoices
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">Accumulated</span>
            </div>
          </div>
        </div>
      </div>

      {/* Core directories count banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Medicines', count: medicines.length, icon: Package, color: 'text-indigo-500 bg-indigo-50/50 border-indigo-100/50' },
          { label: 'Total Batches', count: batches.length, icon: FolderOpen, color: 'text-violet-500 bg-violet-50/50 border-violet-100/50' },
          { label: 'Suppliers', count: suppliers.length, icon: Truck, color: 'text-amber-500 bg-amber-50/50 border-amber-100/50' },
          { label: 'Customers', count: customers.length, icon: Users, color: 'text-sky-500 bg-sky-50/50 border-sky-100/50' },
        ].map((dir, i) => {
          const Icon = dir.icon;
          return (
            <div key={i} className={`border p-4 rounded-2xl flex items-center justify-between text-xs font-semibold ${dir.color}`}>
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">{dir.label}</span>
                <span className="text-lg font-black text-slate-800">{dir.count}</span>
              </div>
              <Icon size={20} className="opacity-80" />
            </div>
          );
        })}
      </div>

      {/* Expiry alerts and Low stock panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Expiration warnings */}
        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-55 pb-3">
            <AlertTriangle size={16} className="text-amber-500" />
            <span>Batch Expiry Warnings</span>
          </h3>

          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {/* Already Expired */}
            {alerts?.expired_with_stock?.map(b => (
              <div key={b.batch_id} className="p-3.5 bg-rose-50/60 border border-rose-100/80 rounded-2xl flex justify-between items-center text-xs smooth-hover hover:border-rose-300">
                <div className="space-y-0.5">
                  <span className="font-extrabold text-rose-700 block">{b.medicine_name}</span>
                  <span className="text-slate-500 font-mono text-[10px]">Batch: {b.batch_no} | Expired: {b.expiry_date}</span>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-rose-600 block">{b.quantity} in stock</span>
                  <span className="text-[9px] bg-rose-100 text-rose-600 py-0.5 px-1.5 rounded-full font-black uppercase tracking-wider block mt-1">{b.days_overdue}d overdue</span>
                </div>
              </div>
            ))}

            {/* 7d Expiry */}
            {alerts?.expiring_critical_7d?.map(b => (
              <div key={b.batch_id} className="p-3.5 bg-orange-50/60 border border-orange-100/80 rounded-2xl flex justify-between items-center text-xs smooth-hover hover:border-orange-300">
                <div className="space-y-0.5">
                  <span className="font-extrabold text-orange-700 block">{b.medicine_name}</span>
                  <span className="text-slate-500 font-mono text-[10px]">Batch: {b.batch_no} | Expires: {b.expiry_date}</span>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-orange-600 block">{b.quantity} units</span>
                  <span className="text-[9px] bg-orange-100 text-orange-600 py-0.5 px-1.5 rounded-full font-black uppercase tracking-wider block mt-1">{b.days_remaining}d left</span>
                </div>
              </div>
            ))}

            {/* 30d Expiry */}
            {alerts?.expiring_soon_30d?.map(b => (
              <div key={b.batch_id} className="p-3.5 bg-amber-50/40 border border-amber-100/60 rounded-2xl flex justify-between items-center text-xs smooth-hover hover:border-amber-200">
                <div className="space-y-0.5">
                  <span className="font-extrabold text-amber-700 block">{b.medicine_name}</span>
                  <span className="text-slate-500 font-mono text-[10px]">Batch: {b.batch_no} | Expiry: {b.expiry_date}</span>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-amber-600 block">{b.quantity} units</span>
                  <span className="text-[9px] bg-amber-100 text-amber-700 py-0.5 px-1.5 rounded-full font-semibold block mt-1">{b.days_remaining} days left</span>
                </div>
              </div>
            ))}

            {alerts?.summary?.expired_with_stock === 0 && 
             alerts?.summary?.expiring_critical_7d === 0 && 
             alerts?.summary?.expiring_soon_30d === 0 && (
              <div className="text-center py-12 text-slate-400">
                <span className="text-2xl">🎉</span>
                <p className="text-xs font-semibold mt-2">No expiring or overdue stock warnings.</p>
              </div>
            )}
          </div>
        </div>

        {/* Low stock alerts */}
        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-55 pb-3">
            <AlertTriangle size={16} className="text-rose-500" />
            <span>Low Stock Warnings (≤ 10)</span>
          </h3>

          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {alerts?.low_stock?.map(b => (
              <div key={b.batch_id} className="p-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl flex justify-between items-center text-xs smooth-hover hover:border-slate-200">
                <div className="space-y-0.5">
                  <span className="font-extrabold text-slate-800 block">{b.medicine_name}</span>
                  <span className="text-slate-500 font-mono text-[10px]">Batch: {b.batch_no} | Exp: {b.expiry_date}</span>
                </div>
                <span className={`font-black py-1 px-3 rounded-full text-[10px] tracking-tight uppercase ${
                  b.quantity === 0 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {b.quantity === 0 ? 'OUT OF STOCK' : `${b.quantity} Left`}
                </span>
              </div>
            ))}

            {alerts?.summary?.low_stock_batches === 0 && (
              <div className="text-center py-12 text-slate-400">
                <span className="text-2xl">📦</span>
                <p className="text-xs font-semibold mt-2">All medicine batches are well-stocked.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

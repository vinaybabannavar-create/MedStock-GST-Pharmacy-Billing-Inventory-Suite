import React from 'react';
import { AlertTriangle, ShieldCheck, Mail, User } from 'lucide-react';

export default function LoginPage({
  username,
  setUsername,
  password,
  setPassword,
  loginError,
  loginLoading,
  handleLogin
}) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Blurs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-violet-600/20 blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/20 blur-[150px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10 space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white shadow-xl shadow-indigo-500/20 mb-4 ring-4 ring-indigo-500/10">
            <ShieldCheck size={32} className="animate-pulse" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white">
            Medi<span className="text-indigo-400">Ledger</span>
          </h1>
          <p className="text-slate-400 mt-2 font-medium text-sm">Pharmacy Billing & Inventory Suite</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/80 rounded-3xl shadow-2xl p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
          
          <h2 className="text-xl font-bold text-white mb-6">Staff Portal Access</h2>

          {loginError && (
            <div className="bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs rounded-xl p-3.5 mb-5 flex items-center gap-2.5">
              <AlertTriangle size={18} className="shrink-0 text-rose-400" />
              <span className="font-medium">{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Email ID</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Mail size={16} />
                </span>
                <input 
                  type="email" 
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                  placeholder="e.g. admin@mediledger.com"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <User size={16} />
                </span>
                <input 
                  type="text" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                  placeholder="e.g. Ramesh Kumar"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loginLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"
            >
              {loginLoading ? 'Entering System...' : 'Enter System / Register'}
            </button>
            <p className="text-center text-[10px] font-semibold text-slate-500 mt-4 leading-normal">
              First time? Enter any Email ID + Name to auto-register as administrator.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

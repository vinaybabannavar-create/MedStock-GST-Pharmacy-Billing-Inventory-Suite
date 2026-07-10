import React from 'react';
import { AlertTriangle } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute top-10 text-center">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300 tracking-wider">
          MediLedger
        </h1>
        <p className="text-slate-400 mt-2 font-medium">Pharmacy Billing & Inventory Management Suite</p>
      </div>

      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8">
        <h2 className="text-2xl font-bold text-white text-center mb-6">Staff Log In</h2>

        {loginError && (
          <div className="bg-rose-500/20 border border-rose-500/30 text-rose-300 text-sm rounded-lg p-3 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} />
            <span>{loginError}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              className="w-full bg-slate-950/40 border border-slate-700/50 rounded-lg py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="e.g. admin"
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full bg-slate-950/40 border border-slate-700/50 rounded-lg py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loginLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {loginLoading ? 'Logging in...' : 'Enter System'}
          </button>
        </form>
      </div>
    </div>
  );
}

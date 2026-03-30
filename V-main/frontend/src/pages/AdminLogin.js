import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Shield, Mail, Lock, Eye, EyeOff, BarChart3 } from 'lucide-react';

export default function AdminLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authAPI.adminLogin(form);
      login(data.token, { name: data.name, role: data.role, id: data.id });
      toast.success('Welcome back, ' + data.name);
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row overflow-hidden" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Left Panel: Admin Insights & Control */}
      <div className="hidden lg:flex flex-1 bg-slate-900 relative items-center justify-center p-12 overflow-hidden border-r border-white/5">
        {/* Animated Background Gradients (Admin Green/Blue tint) */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.05)_0%,transparent_50%)]" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(37,99,235,0.1)_0%,transparent_50%)]" />
        
        {/* Decorative Circuit Board SVG pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="relative z-10 max-w-lg w-full space-y-12 animate-in fade-in slide-in-from-left-8 duration-1000">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-blue-500 shadow-2xl border border-white/10">
              <Shield size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight uppercase">Admin <span className="text-blue-500">Node</span></h2>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Governance Module v2.0</p>
            </div>
          </div>

          <div className="space-y-6">
            <h1 className="text-6xl font-black text-white leading-[1.1] tracking-tighter">
              Centralized <br />
              <span className="text-blue-500">Governance.</span>
            </h1>
            <p className="text-slate-400 text-lg font-medium leading-relaxed">
              Manage scale, security, and integrity from a single point of truth. Your administrative hub for high-stakes evaluation.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'System Health', status: 'Optimal' },
              { label: 'Security Layer', status: 'Hardened' },
              { label: 'Audit Logging', status: 'Enabled' },
              { label: 'Data Encryption', status: 'AES-256' },
            ].map((pill, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between group hover:bg-white/10 transition-colors">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{pill.label}</span>
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full">{pill.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel: Admin Auth Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-12 bg-white relative">
        <div className="max-w-md w-full space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <div className="text-center lg:text-left space-y-2">
            <div className="inline-flex lg:hidden w-12 h-12 bg-slate-900 rounded-xl items-center justify-center text-blue-500 mb-6">
              <Shield size={24} />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Admin Console.</h1>
            <p className="text-slate-500 text-sm font-medium">Sign in to manage your secure infrastructure</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Admin Email</label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                     <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="admin@proctoring.com"
                    className="w-full h-16 pl-14 pr-6 rounded-2xl bg-slate-50 border-2 border-slate-50 focus:border-blue-600 focus:bg-white transition-all text-slate-900 font-bold outline-none placeholder:text-slate-300"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Key</label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full h-16 pl-14 pr-16 rounded-2xl bg-slate-50 border-2 border-slate-50 focus:border-blue-600 focus:bg-white transition-all text-slate-900 font-bold outline-none placeholder:text-slate-300"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-600 transition-colors"
                    onClick={() => setShowPass(!showPass)}
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full h-16 bg-slate-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] transition-all shadow-2xl shadow-slate-200 active:scale-[0.98]">
              {loading ? 'Authenticating...' : 'Enter Dashboard →'}
            </button>
          </form>

          <div className="p-6 bg-slate-50 rounded-2xl flex items-start gap-4 border border-slate-100">
            <div className="p-2 bg-blue-600/10 text-blue-600 text-[10px] font-black rounded-lg uppercase tracking-widest">Demo</div>
            <p className="text-xs font-bold text-slate-500 mt-1">admin@proctoring.com <span className="text-slate-200 mx-2">/</span> admin123</p>
          </div>

          <div className="flex flex-col items-center lg:items-start gap-4 pt-4">
            <button
              onClick={() => navigate('/hr/login')}
              className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors flex items-center gap-2"
            >
              <BarChart3 size={14} />
              Switch to Recruiter Portal
            </button>
            <button
              onClick={() => navigate('/')}
              className="text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-slate-500 transition-colors"
            >
              ← Back to Landing Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
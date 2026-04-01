import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { BarChart3, Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowLeft } from 'lucide-react';

export default function HRLogin() {
    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data } = await authAPI.hrLogin(form);
            login(data.token, { name: data.name, role: data.role, id: data.id });
            toast.success('Access Granted. Welcome to the HR Portal.');
            navigate('/hrdashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invalid HR credentials');
        } finally {
            setLoading(false);
        }
    };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row overflow-hidden" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Left Panel: Talent Insights & Recruiter Hub */}
      <div className="hidden lg:flex flex-1 bg-slate-900 relative items-center justify-center p-12 overflow-hidden border-r border-white/5">
        {/* Animated Background Gradients (HR Purple/Blue tint) */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.08)_0%,transparent_50%)]" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(37,99,235,0.05)_0%,transparent_50%)]" />
        
        {/* Decorative Data Plot SVG pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

        <div className="relative z-10 max-w-lg w-full space-y-12 animate-in fade-in slide-in-from-left-8 duration-1000">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-500/20 border border-white/10">
              <BarChart3 size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight uppercase">Talent <span className="text-indigo-400">Hub</span></h2>
              <p className="text-indigo-400/60 text-[10px] font-black uppercase tracking-[0.3em]">Insights Engine v3.1</p>
            </div>
          </div>

          <div className="space-y-6">
            <h1 className="text-6xl font-black text-white leading-[1.1] tracking-tighter">
              Evaluation <br />
              <span className="text-indigo-400">Intelligence.</span>
            </h1>
            <p className="text-slate-400 text-lg font-medium leading-relaxed">
              Identify top-tier talent with confidence. Use our AI-powered insights to make data-driven hiring decisions.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Integrity Score', status: 'Real-time' },
              { label: 'Code Analysis', status: 'Enabled' },
              { label: 'Talent Mapping', status: 'Active' },
              { label: 'Cloud Storage', status: 'Synced' },
            ].map((pill, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between group hover:bg-white/10 transition-colors">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{pill.label}</span>
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded-full">{pill.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel: HR Auth Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-12 bg-white relative">
        <div className="max-w-md w-full space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <div className="text-center lg:text-left space-y-2">
            <div className="inline-flex lg:hidden w-12 h-12 bg-indigo-600 rounded-xl items-center justify-center text-white mb-6">
              <BarChart3 size={24} />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Recruiter Hub.</h1>
            <p className="text-slate-500 text-sm font-medium">Verify your partner credentials to enter</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Work Email</label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                     <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="hr@proctoring.com"
                    className="w-full h-16 pl-14 pr-6 rounded-2xl bg-slate-50 border-2 border-slate-50 focus:border-indigo-600 focus:bg-white transition-all text-slate-900 font-bold outline-none placeholder:text-slate-300"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Key</label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full h-16 pl-14 pr-16 rounded-2xl bg-slate-50 border-2 border-slate-50 focus:border-indigo-600 focus:bg-white transition-all text-slate-900 font-bold outline-none placeholder:text-slate-300"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-600 transition-colors"
                    onClick={() => setShowPass(!showPass)}
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full h-16 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] transition-all shadow-2xl shadow-indigo-500/20 active:scale-[0.98]">
              {loading ? 'Verifying...' : 'Enter Portal →'}
            </button>
          </form>

          <footer className="pt-8 text-center lg:text-left">
             <div className="inline-flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                    <ShieldCheck size={18} />
                </div>
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Demo Vault</p>
                    <p className="text-xs font-bold text-slate-600">hr@proctoring.com <span className="text-slate-300 mx-1">/</span> hr123</p>
                </div>
             </div>
          </footer>

          <div className="pt-4 text-center lg:text-left">
            <button
               onClick={() => navigate('/')}
               className="text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-indigo-600 transition-colors inline-flex items-center gap-2"
            >
               <ArrowLeft size={14} />
               Back to Landing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

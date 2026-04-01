import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Shield, User, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CandidateLogin() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!username || !password) return toast.error('Please enter all credentials');

        setLoading(true);
        try {
            const { data } = await authAPI.candidateLogin({ username, password });
            toast.success(`Welcome, ${data.candidateName}`);

            // Store relevant data for the session
            sessionStorage.setItem('candidateName', data.candidateName);
            sessionStorage.setItem('assessmentTitle', data.assessmentTitle);

            // Move to the mandatory system check module
            navigate(`/exam/check/${data.token}`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row overflow-hidden" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Left Panel: Branding & Visuals (Hidden on mobile) */}
      <div className="hidden lg:flex flex-1 bg-slate-900 relative items-center justify-center p-12 overflow-hidden border-r border-white/5">
        {/* Animated Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(37,99,235,0.15)_0%,transparent_50%)]" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(29,78,216,0.1)_0%,transparent_50%)]" />
        
        {/* Decorative Grid/Nodes (SVG pattern) */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        <div className="relative z-10 max-w-lg w-full space-y-12 animate-in fade-in slide-in-from-left-8 duration-1000">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-blue-500/20 border border-white/10">
              <Shield size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight uppercase">Virtusa <span className="text-blue-500">AI</span></h2>
              <p className="text-blue-500/60 text-[10px] font-black uppercase tracking-[0.3em]">Integrity Protocol v4.2</p>
            </div>
          </div>

          <div className="space-y-6">
            <h1 className="text-6xl font-black text-white leading-[1.1] tracking-tighter">
              Precision <br />
              <span className="text-blue-500">Proctoring.</span>
            </h1>
            <p className="text-slate-400 text-lg font-medium leading-relaxed">
              Experience a seamless, AI-driven assessment environment. Your journey towards excellence starts with a secure foundation.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'AI Surveillance', status: 'Active' },
              { label: 'Encrypted Link', status: 'Secure' },
              { label: 'Session Lock', status: 'Ready' },
              { label: 'Identity Sync', status: 'Verified' },
            ].map((pill, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between group hover:bg-white/10 transition-colors">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{pill.label}</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{pill.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel: Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12 bg-white relative">
        {/* Mobile Branding (Visible only on mobile) */}
        <div className="absolute top-12 left-0 w-full lg:hidden flex flex-col items-center">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white mb-4">
            <Shield size={24} />
          </div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">Virtusa AI</h2>
        </div>

        <div className="max-w-md w-full space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <div className="text-center lg:text-left space-y-2">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Welcome Back.</h1>
            <p className="text-slate-500 text-sm font-medium">Please enter your secure access credentials</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Candidate ID</label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. CA2601"
                    className="w-full h-16 pl-14 pr-6 rounded-2xl bg-slate-50 border-2 border-slate-50 focus:border-blue-600 focus:bg-white transition-all text-slate-900 font-bold outline-none placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Key</label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-16 pl-14 pr-6 rounded-2xl bg-slate-50 border-2 border-slate-50 focus:border-blue-600 focus:bg-white transition-all text-slate-900 font-bold outline-none placeholder:text-slate-300"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-blue-50 border border-blue-100 flex gap-4">
              <AlertCircle size={20} className="text-blue-600 shrink-0 mt-0.5" />
              <p className="text-[10px] text-blue-900/60 leading-relaxed font-black uppercase tracking-tight">
                Authentication monitored by AI. Stay within the browser tab to maintain session integrity.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] transition-all shadow-2xl shadow-blue-500/20 active:scale-[0.98] flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <>Verify Identity <ArrowRight size={18} /></>}
            </button>
          </form>

          <footer className="pt-8 text-center lg:text-left">
            <p className="text-[9px] text-slate-300 font-black uppercase tracking-[0.4em] leading-loose">
              Powered by Virtusa Forge &copy; 2026 <br />
              Secure Assessment Node: SG-719
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}

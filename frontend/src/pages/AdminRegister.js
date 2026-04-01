import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Shield, Mail, Lock, User, Cpu } from 'lucide-react';

export default function AdminRegister() {
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await authAPI.adminRegister(form);
            toast.success('Registration successful! Please login.');
            navigate('/login');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
            <div className="w-full max-w-md fade-in-up" style={{ position: 'relative', zIndex: 1 }}>
                <div className="bg-white rounded-xl shadow-sm border border-blue-200 overflow-hidden">
                    <div style={{ background: '#1e3a8a', padding: '2rem', textAlign: 'center', position: 'relative' }}>
                        <div style={{
                            position: 'absolute', inset: 0, opacity: 0.1,
                            backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
                            backgroundSize: '24px 24px'
                        }} />
                        <h1 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 700, margin: 0, position: 'relative' }}>Create Admin Account</h1>
                        <p style={{ color: '#bfdbfe', marginTop: '0.25rem', fontSize: '0.9rem', position: 'relative' }}>Join the AI Proctoring Platform</p>
                    </div>

                    <div style={{ padding: '2rem' }}>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                            <div>
                                <label className="label">Full Name</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={17} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                    <input
                                        className="input-field"
                                        style={{ paddingLeft: '42px' }}
                                        placeholder="John Doe"
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="label">Email Address</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={17} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                    <input
                                        type="email"
                                        className="input-field"
                                        style={{ paddingLeft: '42px' }}
                                        placeholder="admin@example.com"
                                        value={form.email}
                                        onChange={e => setForm({ ...form, email: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="label">Password</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={17} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                    <input
                                        type="password"
                                        className="input-field"
                                        style={{ paddingLeft: '42px' }}
                                        placeholder="••••••••"
                                        value={form.password}
                                        onChange={e => setForm({ ...form, password: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: '0.5rem', fontSize: '1rem' }}>
                                {loading ? 'Creating account...' : 'Create Account →'}
                            </button>
                        </form>

                        <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: '#64748b' }}>
                            Already have an account?{' '}
                            <button
                                onClick={() => navigate('/login')}
                                style={{ color: '#1e3a8a', border: 'none', background: 'none', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                            >
                                Sign in
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

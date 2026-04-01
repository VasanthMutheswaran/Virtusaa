import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CheckCircle, Mail, Clock, BarChart3, Shield } from 'lucide-react';

const STEPS = [
    { icon: CheckCircle, label: 'Responses Recorded', desc: 'All your answers have been saved securely.', color: '#2563eb' },
    { icon: BarChart3, label: 'AI Evaluation In Progress', desc: 'Your code and quiz answers are being evaluated.', color: '#3b82f6' },
    { icon: Shield, label: 'Proctoring Review', desc: 'AI proctoring logs are being reviewed by admins.', color: '#60a5fa' },
    { icon: Mail, label: 'Results via Email', desc: 'You\'ll receive your results within 24–48 hours.', color: '#93c5fd' },
];

export default function ExamComplete() {
    const location = useLocation();
    const autoSubmit = location.state?.autoSubmit;
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Slight delay so animation is noticeable
        const t = setTimeout(() => setVisible(true), 80);
        return () => clearTimeout(t);
    }, []);

    return (
        <div
            className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
            <div
                style={{
                    maxWidth: '500px', width: '100%', position: 'relative', zIndex: 1,
                    opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(28px)',
                    transition: 'opacity 0.55s ease, transform 0.55s ease'
                }}
            >
                <div className="bg-white rounded-[2.5rem] shadow-[0_30px_100px_rgba(30,58,138,0.15)] border border-blue-100 overflow-hidden">
                    {/* Hero section */}
                    <div style={{
                        background: '#f8faff',
                        padding: '3.5rem 2rem', textAlign: 'center', position: 'relative'
                    }}>
                        <div style={{ position: 'relative' }}>
                            {/* Animated check */}
                            <div style={{
                                width: '100px', height: '100px', borderRadius: '50%',
                                background: 'rgba(255,255,255,0.05)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 2rem',
                                border: '2px solid rgba(255,255,255,0.1)',
                                boxShadow: '0 0 30px rgba(0,0,0,0.2)'
                            }}>
                                <CheckCircle
                                    size={48}
                                    color="#1e3a8a"
                                    className="check-pop"
                                />
                            </div>
                            <h1 style={{ color: '#172554', fontSize: '1.8rem', fontWeight: 900, margin: 0, letterSpacing: '-0.04em', textTransform: 'uppercase' }}>
                                {autoSubmit ? 'Time Up — Submitted' : 'Exam Completed'}
                            </h1>
                            <p style={{ color: '#3b82f6', marginTop: '0.75rem', fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {autoSubmit
                                    ? 'Your answers were saved when time expired.'
                                    : 'Your responses have been securely recorded.'}
                            </p>
                        </div>
                    </div>

                    {/* What happens next */}
                    <div style={{ padding: '1.75rem' }}>
                        <h2 style={{ margin: '0 0 1.5rem', fontSize: '0.75rem', fontWeight: 900, color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                            Next Phases
                        </h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                            {STEPS.map((step, i) => {
                                const Icon = step.icon;
                                const isLast = i === STEPS.length - 1;
                                return (
                                    <div
                                        key={step.label}
                                        style={{
                                            display: 'flex', gap: '1rem', alignItems: 'flex-start',
                                            opacity: visible ? 1 : 0,
                                            transform: visible ? 'translateX(0)' : 'translateX(-12px)',
                                            transition: `opacity 0.4s ${0.15 + i * 0.1}s ease, transform 0.4s ${0.15 + i * 0.1}s ease`
                                        }}
                                    >
                                        {/* Timeline */}
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                                            <div style={{
                                                width: '40px', height: '40px', borderRadius: '12px',
                                                background: `${step.color}10`,
                                                border: `1.5px solid ${step.color}25`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                <Icon size={18} color={step.color} />
                                            </div>
                                            {!isLast && <div style={{ width: '2px', height: '32px', background: '#eff6ff', margin: '4px 0' }} />}
                                        </div>

                                        {/* Text */}
                                        <div style={{ paddingBottom: isLast ? 0 : '0.75rem', paddingTop: '8px' }}>
                                            <p style={{ margin: 0, fontWeight: 800, color: '#1e3a8a', fontSize: '0.95rem' }}>{step.label}</p>
                                            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>{step.desc}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer note */}
                        <div style={{
                            marginTop: '2.5rem',
                            background: '#eff6ff',
                            border: '1px solid #dbeafe',
                            borderRadius: '1.25rem', padding: '1.5rem',
                            display: 'flex', alignItems: 'flex-start', gap: '16px',
                            boxShadow: 'inset 0 2px 4px rgba(30,58,138,0.02)'
                        }}>
                            <Clock size={22} color="#1e40af" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#1e40af', lineHeight: 1.6, fontWeight: 700 }}>
                                Results will be shared to your registered email within <strong>24–48 hours</strong>. You may now close this window safely.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

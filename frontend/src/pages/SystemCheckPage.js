import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DeviceCheck from '../components/Candidate/DeviceCheck';
import CandidateProgress from '../components/Candidate/CandidateProgress';
import { ShieldCheck, ArrowRight, ShieldAlert } from 'lucide-react';

export default function SystemCheckPage() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [passed, setPassed] = useState(false);

    const handleComplete = () => {
        setPassed(true);
        // Store passing status in session storage
        sessionStorage.setItem(`systemCheck_${token}`, 'passed');
    };

    const handleProceed = () => {
        navigate(`/exam/register/${token}`);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 lg:p-12">
            <div className="max-w-5xl mx-auto py-8">
                <CandidateProgress currentStep="check" />
                
                {/* Module Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary-light rounded-2xl flex items-center justify-center border border-primary/10 shadow-sm">
                                <ShieldCheck className="text-primary" size={24} />
                            </div>
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">System Integrity</h1>
                        </div>
                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest ml-1">Calibration: Hardware & Connectivity</p>
                    </div>

                    {passed ? (
                        <button
                            onClick={handleProceed}
                            className="btn-primary !bg-emerald-500 !hover:bg-emerald-600 !px-8 !py-4 !rounded-2xl !text-xs !shadow-lg !shadow-emerald-500/20 active:scale-[0.98] animate-pulse"
                        >
                            Continue to Profile <ArrowRight size={18} className="ml-2" />
                        </button>
                    ) : (
                        <div className="flex items-center gap-3 bg-primary-light/50 border border-primary-light px-6 py-3 rounded-2xl">
                            <ShieldAlert className="text-primary/70" size={18} />
                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Calibration Required</span>
                        </div>
                    )}
                </div>

                {/* Device Check Component Container */}
                <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                    <DeviceCheck onComplete={handleComplete} />
                </div>

                <div className="mt-16 text-center">
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.4em]">
                        Secure Verification Protocol • Virtusa AI
                    </p>
                </div>
            </div>
        </div>
    );
}

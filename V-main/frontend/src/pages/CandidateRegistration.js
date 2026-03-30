import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Phone, CheckCircle, ArrowRight, Upload, Loader2 } from 'lucide-react';
import { authAPI } from '../services/api';
import CandidateProgress from '../components/Candidate/CandidateProgress';
import toast from 'react-hot-toast';

export default function CandidateRegistration() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        countryCode: '+91',
        phone: ''
    });
    const [resume, setResume] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!resume) {
            toast.error('Please upload your resume');
            return;
        }

        setLoading(true);
        try {
            await authAPI.updateCandidateProfile(token, formData, resume);
            toast.success('Registration complete!');
            navigate(`/exam/${token}`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 lg:p-12">
            <div className="max-w-2xl w-full py-8">
                <CandidateProgress currentStep="register" />
                
                {/* Branding Header */}
                <div className="flex flex-col items-center mb-10 text-center">
                    <div className="w-16 h-16 bg-primary-light rounded-[24px] flex items-center justify-center text-primary mb-6 shadow-sm border border-primary/10">
                        <User size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight uppercase">Profile Enrollment</h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mt-2">Candidate Onboarding</p>
                </div>

                {/* Registration Card */}
                <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200 p-10 lg:p-12 border border-slate-100 relative overflow-hidden group">
                    {/* Background Accent */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary-light/50 rounded-full blur-3xl group-hover:bg-primary-light transition-colors duration-700 pointer-events-none" />

                    <div className="relative z-10">
                        <div className="mb-10">
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-3">Complete Your Profile</h1>
                            <p className="text-slate-500 text-sm font-medium">This information is required for assessment eligibility</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Personal Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="label">First Name</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="John"
                                        className="input-field"
                                        value={formData.firstName}
                                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="label">Last Name</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Doe"
                                        className="input-field"
                                        value={formData.lastName}
                                        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="label">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="john.doe@example.com"
                                    className="input-field"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="label">Contact Number</label>
                                <div className="flex gap-4">
                                    <input
                                        type="text"
                                        required
                                        placeholder="+91"
                                        className="!w-20 input-field text-center font-bold !text-primary !px-2 shadow-sm"
                                        value={formData.countryCode}
                                        onChange={e => setFormData({ ...formData, countryCode: e.target.value })}
                                    />
                                    <input
                                        type="tel"
                                        required
                                        placeholder="Mobile Number"
                                        className="flex-1 input-field"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Resume Upload */}
                            <div className="space-y-2">
                                <label className="label">Resume / CV Document</label>
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={e => setResume(e.target.files[0])}
                                    className="hidden"
                                    id="resume-upload"
                                />
                                <label
                                    htmlFor="resume-upload"
                                    className={`w-full flex items-center gap-5 px-6 py-5 border-2 border-dashed rounded-3xl cursor-pointer transition-all duration-300 ${resume ? 'border-primary bg-primary-light/30 shadow-sm' : 'border-slate-200 bg-slate-50/50 hover:border-primary/50 hover:bg-white'}`}
                                >
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors shadow-sm ${resume ? 'bg-primary text-white' : 'bg-white text-slate-400 border border-slate-100'}`}>
                                        {resume ? <CheckCircle size={28} /> : <Upload size={28} />}
                                    </div>
                                    <div className="flex-1 overflow-hidden text-left">
                                        <p className={`text-sm font-bold truncate ${resume ? 'text-primary' : 'text-slate-500'}`}>
                                            {resume ? resume.name : 'Choose file to upload'}
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-1">PDF or DOCX (Max 5MB)</p>
                                    </div>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary w-full !py-5 !rounded-2xl !text-[11px] flex items-center justify-center gap-3 !shadow-lg !shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] mt-4"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" size={18} />
                                ) : (
                                    <>
                                        Complete Enrollment <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="mt-12 text-center opacity-40">
                    <p className="text-[10px] text-slate-900 font-bold uppercase tracking-[0.4em]">
                        Virtusa AI • Secure Proctoring Network
                    </p>
                </div>
            </div>
        </div>
    );
}

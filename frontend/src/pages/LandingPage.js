import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col font-sans bg-slate-50 text-slate-900">
            <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 sm:px-6 lg:px-8 z-10">

                {/* Main Titles */}
                <div className="text-center mb-20 space-y-6">
                    <div className="inline-block px-4 py-1.5 rounded-full border border-primary-light bg-primary-light/30 text-primary text-[10px] font-bold uppercase tracking-widest shadow-sm mb-4">
                        Next Generation Talent Evaluation
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tight leading-[1.1]">
                        Virtusa AI Proctoring <br /><span className="text-primary">& Assessment Platform</span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
                        Secure, intelligent, and seamless evaluation environment <br className="hidden md:block" /> built for the future of global talent acquisition.
                    </p>
                </div>

                {/* Cards Container */}
                <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-4">

                    {/* Admin Portal Card */}
                    <div
                        onClick={() => navigate('/login')}
                        className="card !p-10 cursor-pointer group hover:border-primary transition-all duration-300"
                    >
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-8 text-slate-400 group-hover:bg-primary group-hover:text-white group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-300">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">Admin Console</h2>
                        <p className="text-slate-500 text-sm leading-relaxed font-medium">
                            Create advanced assessments, manage evaluation flows, and configure specialized algorithms.
                        </p>
                    </div>

                    {/* HR Dashboard Card */}
                    <div
                        onClick={() => navigate('/hr/login')}
                        className="card !p-10 cursor-pointer group hover:border-primary transition-all duration-300"
                    >
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-8 text-slate-400 group-hover:bg-primary group-hover:text-white group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-300">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">Recruiter Hub</h2>
                        <p className="text-slate-500 text-sm leading-relaxed font-medium">
                            Monitor live sessions, analyze candidate integrity, and review automated AI evaluation reports.
                        </p>
                    </div>

                    {/* Candidate Portal Card */}
                    <div 
                        onClick={() => navigate('/candidate/login')}
                        className="card !p-10 flex flex-col group cursor-pointer hover:border-primary transition-all duration-300"
                    >
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-8 text-slate-400 group-hover:text-primary transition-colors duration-300">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">Candidate Portal</h2>
                        <p className="text-slate-500 text-sm mb-6 leading-relaxed font-medium">
                            Access secure assessment environments with built-in AI assistance and real-time support.
                        </p>
                        <div className="bg-primary-light/50 border border-primary-light rounded-2xl p-5 mt-auto group-hover:bg-primary group-hover:border-primary transition-all duration-300">
                            <span className="text-primary font-bold block mb-2 text-[10px] uppercase tracking-widest flex items-center gap-2 group-hover:text-white transition-colors duration-300">
                                <CheckCircle size={14} /> Login to Proceed
                            </span>
                            <p className="text-slate-600 text-[11px] font-medium leading-relaxed group-hover:text-primary-light transition-colors duration-300">
                                Complete your profile and verify your environment before beginning your professional journey.
                            </p>
                        </div>
                    </div>

                </div>
            </div>

            {/* Footer */}
            <footer className="mt-auto py-8 text-center text-sm font-medium text-slate-500 border-t border-slate-200 bg-white">
                &copy; {new Date().getFullYear()} Virtusa AI Proctoring Platform. All rights reserved.
            </footer>
        </div>
    );
}

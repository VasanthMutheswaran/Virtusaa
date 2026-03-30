import React, { useState, useEffect } from 'react';
import {
    X, Shield, AlertTriangle, CheckCircle, Clock,
    TrendingUp, User, Mail, Phone, Award, FileText,
    Brain, Activity, ArrowRight, UserCheck, UserX,
    Layout, History, BarChart3
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, Cell, PieChart, Pie
} from 'recharts';

export default function CandidateReport({ candidate, onClose, onAction }) {
    const [logs, setLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(true);
    const [activeTab, setActiveTab] = useState('summary');

    useEffect(() => {
        if (candidate?.sessionId) {
            adminAPI.getProctoringLogs(candidate.sessionId)
                .then(res => setLogs(res.data))
                .catch(err => console.error("Error fetching logs:", err))
                .finally(() => setLoadingLogs(false));
        }
    }, [candidate]);

    if (!candidate) return null;

    // AI Verdict Logic
    const getAIVerdict = () => {
        const score = candidate.finalScore || 0;
        const integrity = candidate.integrityScore || 0;
        const violations = candidate.violationCount || 0;

        if (score > 80 && integrity > 90) return {
            status: 'Strongly Recommended',
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            border: 'border-emerald-100',
            icon: UserCheck,
            reason: 'Outstanding technical performance coupled with perfect integrity markers. Low behavioral risk.'
        };
        if (integrity < 60 || violations > 10) return {
            status: 'Critical Alert: Potential Risk',
            color: 'text-rose-600',
            bg: 'bg-rose-50',
            border: 'border-rose-100',
            icon: AlertTriangle,
            reason: 'High violation density detected. Integrity markers below safety threshold. Manual review required.'
        };
        if (score > 60 && integrity > 70) return {
            status: 'Recommended for Review',
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            border: 'border-blue-100',
            icon: Activity,
            reason: 'Competent technical results. Minor behavioral flags observed but within acceptable deviation.'
        };
        return {
            status: 'Not Recommended',
            color: 'text-slate-600',
            bg: 'bg-slate-50',
            border: 'border-slate-100',
            icon: UserX,
            reason: 'Technical performance does not meet benchmark requirements. Integrity markers are stable.'
        };
    };

    const verdict = getAIVerdict();
    const VerdictIcon = verdict.icon;

    const violationStats = logs.reduce((acc, log) => {
        acc[log.violationType] = (acc[log.violationType] || 0) + 1;
        return acc;
    }, {});

    const chartData = Object.entries(violationStats).map(([name, count]) => ({
        name: name.replace('_', ' '),
        count
    }));

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose}></div>

            <div className="relative w-full max-w-6xl max-h-[92vh] bg-white/95 backdrop-blur-2xl rounded-[3rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] border border-white/40 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">

                {/* Header Section */}
                <div className="flex items-center justify-between px-10 py-8 border-b border-slate-100/50 bg-white/30">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-500 rounded-3xl flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-indigo-200">
                            {candidate.candidateName?.charAt(0) || 'C'}
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">{candidate.candidateName}</h2>
                            <div className="flex items-center gap-4 mt-1">
                                <span className="flex items-center gap-1.5 text-slate-400 font-bold text-xs uppercase tracking-widest"><Mail size={14} /> {candidate.candidateEmail}</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                                <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">ID: {candidate.sessionId?.toString().slice(-6)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => onAction('SHORTLIST')}
                            className="px-8 py-3.5 bg-blue-50 text-white rounded-2xl font-black text-xs uppercase tracking-[0.15em] hover:bg-blue-500 transition-all shadow-xl shadow-blue-50 flex items-center gap-2 group"
                        >
                            Shortlist <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-4 bg-slate-100 text-slate-400 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex px-10 border-b border-slate-100">
                    {[
                        { id: 'summary', icon: Layout, label: 'Analytics Summary' },
                        { id: 'timeline', icon: History, label: 'Violation Log' },
                        { id: 'evidence', icon: BarChart3, label: 'Technical Output' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-8 py-5 border-b-2 transition-all font-black text-[10px] uppercase tracking-widest ${activeTab === tab.id
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            <tab.icon size={16} /> {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                    {activeTab === 'summary' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                            {/* AI Verdict Card */}
                            <div className="lg:col-span-2 space-y-8">
                                <div className={`${verdict.bg} ${verdict.border} border-2 rounded-[2.5rem] p-8 relative overflow-hidden group`}>
                                    <div className="absolute -right-8 -bottom-8 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                                        <Brain size={200} />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-white rounded-xl shadow-sm">
                                                <Brain className="text-blue-600" size={20} />
                                            </div>
                                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Decision Support AI</span>
                                        </div>
                                        <h3 className={`text-2xl font-black mb-3 ${verdict.color}`}>{verdict.status}</h3>
                                        <p className="text-slate-600 font-medium leading-relaxed max-w-xl">
                                            {verdict.reason}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-slate-50/50 rounded-3xl p-8 border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Integrity Confidence</p>
                                        <div className="flex items-end gap-3">
                                            <span className="text-4xl font-black text-slate-900">{candidate.integrityScore}%</span>
                                            <span className={`text-xs font-bold mb-1.5 ${candidate.integrityScore > 80 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {candidate.integrityScore > 80 ? 'High Trust' : 'Moderate Risk'}
                                            </span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-200 rounded-full mt-4 overflow-hidden">
                                            <div className={`h-full transition-all duration-1000 ${candidate.integrityScore > 80 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${candidate.integrityScore}%` }}></div>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50/50 rounded-3xl p-8 border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Technical Performance</p>
                                        <div className="flex items-end gap-3">
                                            <span className="text-4xl font-black text-slate-900">{candidate.totalScore}%</span>
                                            <span className="text-xs font-bold mb-1.5 text-blue-500">Above Average</span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-200 rounded-full mt-4 overflow-hidden">
                                            <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${candidate.totalScore}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar Analytics */}
                            <div className="space-y-6">
                                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6">Violation Breakdown</h4>
                                    {chartData.length > 0 ? (
                                        <div className="space-y-4">
                                            {chartData.map((d, i) => (
                                                <div key={d.name} className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-slate-500 capitalize">{d.name}</span>
                                                    <span className="text-xs font-black text-slate-900 bg-slate-50 px-2 py-1 rounded-md">{d.count}</span>
                                                </div>
                                            ))}
                                            <div className="h-40 mt-6">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={chartData}>
                                                        <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 4, 4]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="py-10 text-center">
                                            <Shield className="mx-auto text-emerald-400 mb-2" size={32} />
                                            <p className="text-xs font-bold text-slate-400">Perfect Integrity</p>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform">
                                        <Award size={64} />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Verdict Recommendation</p>
                                    <h4 className="text-xl font-bold mb-4">{verdict.status.split(':')[0]}</h4>
                                    <button className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                                        Download PDF Report
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'timeline' && (
                        <div className="max-w-4xl mx-auto">
                            {loadingLogs ? (
                                <div className="flex flex-col items-center py-20">
                                    <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
                                    <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Syncing logs...</p>
                                </div>
                            ) : logs.length === 0 ? (
                                <div className="text-center py-24 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                                    <Shield size={64} className="mx-auto text-emerald-100 mb-6" />
                                    <h3 className="text-2xl font-black text-slate-900 mb-2">Crystal Clear Protocol</h3>
                                    <p className="text-slate-400 text-sm font-medium">Candidate followed all security guidelines perfectly.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {logs.map((log, idx) => (
                                        <div key={log.id} className="group flex items-start gap-6 p-6 bg-white border border-slate-100 rounded-[2rem] hover:shadow-xl hover:shadow-blue-600/5 transition-all animate-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                                            <div className={`p-4 rounded-2xl ${log.severity === 'HIGH' ? 'bg-rose-50 text-rose-500' :
                                                    log.severity === 'MEDIUM' ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500'
                                                }`}>
                                                <AlertTriangle size={24} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="font-black text-slate-900 uppercase tracking-tight text-sm">{log.violationType.replace('_', ' ')}</h4>
                                                    <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                        <Clock size={12} /> {new Date(log.occurredAt).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                                    {log.description}
                                                </p>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] self-start mt-1 ${log.severity === 'HIGH' ? 'bg-rose-100 text-rose-600' :
                                                    log.severity === 'MEDIUM' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                                                }`}>
                                                {log.severity}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'evidence' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-slate-50/50 rounded-3xl p-8 border border-slate-100">
                                <h4 className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-widest mb-6 border-b border-slate-200 pb-4">
                                    <FileText size={16} className="text-blue-500" /> Assessment Feedback
                                </h4>
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm">
                                        <div>
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Quiz Score</p>
                                            <p className="text-lg font-black text-slate-900">{candidate.quizScore} / {candidate.quizTotal}</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-full border-4 border-blue-50 flex items-center justify-center font-black text-xs text-blue-600">
                                            {Math.round((candidate.quizScore / candidate.quizTotal) * 100)}%
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm">
                                        <div>
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Coding Score</p>
                                            <p className="text-lg font-black text-slate-900">{candidate.codingScore} / {candidate.codingTotal}</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-full border-4 border-blue-50 flex items-center justify-center font-black text-xs text-blue-600">
                                            {Math.round((candidate.codingScore / candidate.codingTotal) * 100)}%
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative flex flex-col items-center justify-center text-center overflow-hidden">
                                <div className="absolute inset-0 bg-blue-50/5 opacity-30 pointer-events-none"></div>
                                <Shield size={80} className="mb-6 opacity-20" />
                                <h4 className="text-2xl font-black mb-2">Evidence Archive</h4>
                                <p className="text-slate-400 text-sm font-medium mb-8 max-w-[280px]">Screen captures and behavioral data are encrypted and stored for 30 days.</p>
                                <button className="px-10 py-4 bg-blue-50 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition shadow-2xl">
                                    Request Full Evidence
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="px-10 py-8 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Activity size={16} className="text-emerald-500" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Analysis finalized by hiring engine</span>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => onAction('REJECT')}
                            className="px-8 py-3.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-100 transition-all font-bold"
                        >
                            Reject Candidate
                        </button>
                        <button
                            onClick={() => onAction('SHORTLIST')}
                            className="px-10 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                        >
                            Confirm Selection
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </div>
    );
}

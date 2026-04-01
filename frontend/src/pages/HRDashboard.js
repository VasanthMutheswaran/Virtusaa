import React, { useState, useEffect, useRef, useCallback } from 'react';
import AdminLayout from '../components/Admin/AdminLayout';
import CandidateDetailModal from '../components/Admin/CandidateDetailModal';
import { adminAPI } from '../services/api';
import { createStompClient, disconnectStomp } from '../services/websocket';
import toast from 'react-hot-toast';
import {
    Users, User, Activity, CheckCircle, AlertTriangle, Award,
    TrendingUp, Eye, Search, Filter, Download, Shield,
    X, XCircle, FileText, Phone, List, BarChart3,
    Camera, Play, Trash2
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import LiveScreenFeed from '../components/Admin/LiveScreenFeed';
import CandidateReport from '../components/Admin/CandidateReport';

// Helper to safely extract candidate details based on actual backend data
const enrichCandidateData = (candidates) => {
    return candidates.map((c, i) => {
        // Enforce strict reliance on backend data rather than mock generated data.
        const isCompleted = c.status === 'COMPLETED';

        const codingScore = c.codingScore || (isCompleted ? 0 : null);
        const mcqScore = c.mcqScore || (isCompleted ? 0 : null);

        // Violations - Strict 0 if not provided by backend
        const violations = c.violations || {
            tabSwitch: c.tabSwitchCount || 0,
            phoneDetected: c.phoneCount || 0,
            multipleFaces: c.multipleFacesCount || 0,
            noFace: c.noFaceCount || 0,
            windowBlur: c.windowBlurCount || 0
        };

        // Penalty Formula: (Tab * 2) + (Phone * 10) + (MultiFaces * 15) + (NoFace * 20) + (Blur * 5) + (Mismatch * 30)
        let violationPenalty = c.violationPenalty || ((violations.tabSwitch * 2) + (violations.phoneDetected * 10) + (violations.multipleFaces * 15) + (violations.noFace * 20) + (violations.windowBlur * 5) + (c.personMismatchCount * 30));
        if (violationPenalty > 100) violationPenalty = 100;

        // Default integrity is 100 minus any real penalties.
        const integrityScore = c.integrityScore || (c.status === 'PENDING' || c.status === 'INVITED' ? null : Math.max(0, 100 - violationPenalty));

        let finalScore = c.finalScore;
        let recommendation = c.recommendation || 'Pending';

        if (isCompleted && finalScore === undefined) {
            finalScore = ((codingScore * 0.6) + (mcqScore * 0.4)) - violationPenalty;
            if (finalScore < 0) finalScore = 0;

            if (finalScore > 80 && integrityScore > 90) recommendation = 'Recommended';
            else if (finalScore > 60 && integrityScore > 70) recommendation = 'Review';
            else recommendation = 'Reject';
        }

        const skills = c.skills || [
            { subject: 'Problem Solving', A: 0 },
            { subject: 'Algorithm', A: 0 },
            { subject: 'Code Efficiency', A: 0 },
            { subject: 'Logic', A: 0 },
            { subject: 'Debugging', A: 0 },
        ];

        return {
            ...c,
            codingScore,
            mcqScore,
            violations,
            violationPenalty,
            integrityScore,
            finalScore: finalScore !== null && finalScore !== undefined ? parseFloat(finalScore.toFixed(1)) : null,
            recommendation,
            skills,
            eyeTracking: c.eyeTracking || 'Normal',
            headPose: c.headPose || 'Frontal'
        };
    });
};

const STAT_CARDS = [
    { label: 'Total Candidates', key: 'total', icon: Users, color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Active Exams', key: 'active', icon: Activity, color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Completed', key: 'completed', icon: CheckCircle, color: '#10b981', bg: '#ecfdf5' },
    { label: 'Total Violations', key: 'violations', icon: AlertTriangle, color: '#ef4444', bg: '#fef2f2' },
    { label: 'Avg Candidate Score', key: 'avgScore', icon: TrendingUp, color: '#8b5cf6', bg: '#f5f3ff' },
    { label: 'Top Performer', key: 'topPerformer', icon: Award, color: '#ec4899', bg: '#fdf2f8' },
];

export default function HRDashboard({ view = 'OVERVIEW' }) {
    const navigate = useNavigate();
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [viewingReport, setViewingReport] = useState(null);

    // Filters
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [recFilter, setRecFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [behaviorFilter, setBehaviorFilter] = useState('ALL'); // ALL, HIGH_RISK, TOP_TALENT

    const [assessments, setAssessments] = useState([]);
    const [selectedAssessmentId, setSelectedAssessmentId] = useState('ALL');
    const [assessmentResults, setAssessmentResults] = useState([]);
    const [resultsLoading, setResultsLoading] = useState(false);
    const [viewMode, setViewMode] = useState('RANKING'); // 'RANKING' or 'RESULTS'

    // Proctoring Logs Modal State
    const [selectedSession, setSelectedSession] = useState(null);
    const [logs, setLogs] = useState([]);
    const [logsLoading, setLogsLoading] = useState(false);

    // Live violation stats from backend
    const [violationStats, setViolationStats] = useState({});

    const [aiSummary, setAiSummary] = useState('');
    const [summaryLoading, setSummaryLoading] = useState(false);

    // Evidence preview state
    const [selectedEvidence, setSelectedEvidence] = useState(null);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            adminAPI.getCandidates(),
            adminAPI.getAssessments(),
            adminAPI.getViolationStats()
        ]).then(([cRes, aRes, vRes]) => {
            const realCandidates = cRes.data || [];
            const enrichedData = enrichCandidateData(realCandidates);
            enrichedData.sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));
            setCandidates(enrichedData);
            setAssessments(aRes.data || []);
            setViolationStats(vRes.data || {});
        }).catch(err => {
            if (err.response?.status === 401 || err.response?.status === 403) return;
            const msg = err.response?.data?.message || 'Failed to load dashboard data from backend';
            toast.error(msg);
        }).finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        setResultsLoading(true);
        const fetchPromise = selectedAssessmentId === 'ALL'
            ? adminAPI.getAllResults()
            : adminAPI.getResults(selectedAssessmentId);

        fetchPromise
            .then(res => {
                const processed = (res.data || []).map(r => {
                    const totalEarned = (r.quizScore || 0) + (r.codingScore || 0);
                    const totalMax = (r.quizTotal || 0) + (r.codingTotal || 0);
                    const penaltyFactor = Math.max(0.05, 1 - ((r.violationCount || 0) / 200));
                    const finalScoreMarks = totalEarned > 0 ? Math.max(1, Math.round(totalEarned * penaltyFactor)) : 0;
                    return { ...r, finalScoreMarks, totalMax };
                });
                setAssessmentResults(processed.sort((a, b) => b.finalScoreMarks - a.finalScoreMarks));
                setViewMode(selectedAssessmentId === 'ALL' ? 'RANKING' : 'RESULTS');
            })
            .catch(err => {
                if (err.response?.status === 401 || err.response?.status === 403) return;
                toast.error('Failed to load assessment results');
            })
            .finally(() => setResultsLoading(false));
    }, [selectedAssessmentId]);

    // Apply filters to Ranking/Results table
    const displayedResults = assessmentResults.filter(r => {
        const matchesSearch = r.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.candidateEmail.toLowerCase().includes(searchQuery.toLowerCase());

        if (behaviorFilter === 'HIGH_RISK') {
            return matchesSearch && (r.integrityScore < 60 || (r.violationCount || 0) > 8);
        }
        if (behaviorFilter === 'TOP_TALENT') {
            return matchesSearch && r.totalScore > 80 && r.integrityScore > 85;
        }
        return matchesSearch;
    });

    // Compute Aggregates
    const totalCands = candidates.length;
    const activeExams = candidates.filter(c => c.status === 'IN_PROGRESS').length;
    const completed = candidates.filter(c => c.status === 'COMPLETED').length;
    const totalViolations = assessmentResults.reduce((sum, r) => sum + (r.violationCount || 0), 0);

    const completedCands = assessmentResults.filter(r => r.verdict === 'COMPLETED' || r.verdict === 'SELECTED' || r.verdict === 'REJECTED');
    const avgScore = completedCands.length ? (completedCands.reduce((sum, r) => sum + r.totalScore, 0) / completedCands.length).toFixed(1) : 0;
    const topPerformer = completedCands.length ? completedCands.reduce((prev, current) => (prev.totalScore > current.totalScore) ? prev : current).candidateName : 'N/A';

    const stats = {
        total: totalCands, active: activeExams, completed, violations: totalViolations, avgScore: `${avgScore}%`, topPerformer
    };

    // Active sessions from results – these have sessionIds needed for screen subscribe
    const activeCandidates = candidates.filter(c => c.status === 'IN_PROGRESS');
    const activeResults = assessmentResults.filter(r =>
        r.verdict === 'IN_PROGRESS' || r.verdict === null || r.verdict === undefined || r.verdict === ''
    );

    // Apply Filters
    const filteredCandidates = candidates.filter(c => {
        const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
        const matchRec = recFilter === 'ALL' || c.recommendation === recFilter;
        const candidateName = c.name || 'Unknown';
        const candidateId = c.id ? String(c.id) : '';
        const matchSearch = candidateName.toLowerCase().includes(searchQuery.toLowerCase()) || candidateId.toLowerCase().includes(searchQuery.toLowerCase());
        return matchStatus && matchRec && matchSearch;
    });

    // Prepare chart data – populated from the live /stats/violations endpoint
    const violationData = [
        { name: 'Tab Switch', count: violationStats['TAB_SWITCH'] || 0 },
        { name: 'Phone', count: violationStats['PHONE_DETECTED'] || 0 },
        { name: 'Multiple Faces', count: violationStats['MULTIPLE_FACES'] || 0 },
        { name: 'Looking Away', count: violationStats['LOOKING_AWAY'] || 0 },
        { name: 'Movement', count: violationStats['SUSPICIOUS_MOVEMENT'] || 0 },
    ].filter(v => v.count > 0);

    const hasViolations = violationData.length > 0;

    const pieColors = ['#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

    // Handle Shortlisting
    const triggerAutoShortlist = () => {
        toast.success('Top candidates shortlisted based on Final & Integrity Scores!');
        // In a real app we might filter state or call API
        setCandidates([...candidates].sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0)).slice(0, 10));
    };

    // Export to Excel/CSV function
    const downloadCSV = () => {
        const headers = ["Rank", "Candidate ID", "Name", "Status", "Final Score", "AI Recommendation", "Coding Score", "MCQ Score", "Integrity Score", "Violations"];

        const csvRows = assessmentResults.map((r, index) => {
            return [
                index + 1,
                r.sessionId,
                `"${r.candidateName}"`,
                r.verdict,
                r.totalScore || 'Pending',
                r.recommendation || 'N/A',
                r.codingScore || 'N/A',
                r.quizScore || 'N/A',
                r.integrityScore || 'N/A',
                r.violationCount || 0
            ].join(',');
        });

        const csvContent = [headers.join(','), ...csvRows].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `HR_Dashboard_Export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Exported Ranking Data to Excel/CSV");
    };

    const getRiskLevel = (score) => {
        if (score === null || score === undefined) return { label: 'Unknown', color: 'text-gray-400', bg: 'bg-gray-50' };
        if (score >= 90) return { label: 'Low Risk', color: 'text-green-600', bg: 'bg-green-50' };
        if (score >= 70) return { label: 'Moderate', color: 'text-yellow-600', bg: 'bg-yellow-50' };
        return { label: 'High Risk', color: 'text-red-600', bg: 'bg-red-50' };
    };

    const updateVerdict = async (sessionId, verdict) => {
        try {
            const { data } = await adminAPI.updateResultVerdict(sessionId, verdict);
            setAssessmentResults(prev => prev.map(r => r.sessionId === sessionId ? { ...r, verdict: data.verdict } : r));
            toast.success(verdict === 'SELECTED' ? 'Selection confirmed!' : 'Rejection confirmed!');
        } catch (error) {
            toast.error('Failed to update verdict');
        }
    };

    const showLogs = async (sessionId, candidateName) => {
        setSelectedSession(sessionId);
        setLogsLoading(true);
        setAiSummary('');
        try {
            const { data } = await adminAPI.getProctoringLogs(sessionId);
            setLogs(data || []);

            // Fetch AI Summary if logs exist
            if (data && data.length > 0) {
                setSummaryLoading(true);
                adminAPI.getAISummary({ logs: data, candidateName })
                    .then(res => setAiSummary(res.data.summary))
                    .catch(() => setAiSummary('Failed to generate AI summary.'))
                    .finally(() => setSummaryLoading(false));
            }
        } catch {
            toast.error('Failed to load proctoring logs');
        } finally {
            setLogsLoading(false);
        }
    };

    const handleDeleteResult = async (sessionId, name) => {
        if (!window.confirm(`Are you sure you want to delete ${name}'s assessment result? This action cannot be undone.`)) return;
        
        try {
            await adminAPI.deleteResult(sessionId);
            toast.success('Result deleted successfully');
            // Refresh assessment results
            setAssessmentResults(prev => prev.filter(r => r.sessionId !== sessionId));
        } catch (error) {
            toast.error('Failed to delete result');
        }
    };

    const getResumeUrl = (path) => {
        if (!path) return null;
        return path.startsWith('http') ? path : `http://localhost:8080${path}`;
    };

    const verdictColor = (v) => ({
        SELECTED: 'bg-green-100 text-green-700 border-green-200',
        REJECTED: 'bg-red-50 text-red-500 line-through border-red-100',
        REVIEW: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    }[v] || 'bg-slate-50 text-slate-600');

    const severityColor = (s) => ({
        HIGH: 'text-red-700 font-bold',
        MEDIUM: 'text-orange-600 font-bold',
        LOW: 'text-blue-500 font-bold',
    }[s] || 'text-slate-400 font-bold');

    const pageTitles = {
        OVERVIEW: 'Dashboard Overview',
        MONITORING: 'Live Monitoring',
        ANALYTICS: 'Violation Analytics',
        RANKING: 'Candidate Ranking'
    };

    const isIsolatedHR = window.location.pathname.startsWith('/hr');

    return (
        <AdminLayout
            title={pageTitles[view]}
            breadcrumbs={[{ label: 'Dashboard', path: '/hr/dashboard' }, { label: pageTitles[view] }]}
            isIsolatedHR={isIsolatedHR}
        >
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <div className="space-y-6">

                    {/* 1. OVERVIEW VIEW */}
                    {view === 'OVERVIEW' && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                                {STAT_CARDS.map(card => {
                                    const Icon = card.icon;
                                    return (
                                        <div key={card.key} className="stat-card flex flex-col justify-center items-center text-center group">
                                            <div className="p-3.5 rounded-xl mb-4 transition-transform group-hover:scale-110" style={{ backgroundColor: `${card.color}15`, color: card.color }}>
                                                <Icon size={22} />
                                            </div>
                                            <h3 className="text-2xl font-bold text-slate-900 mb-1 tracking-tight">{stats[card.key]}</h3>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{card.label}</p>
                                        </div>
                                    );
                                })}
                            </div>

                             <div className="bg-white rounded-3xl p-10 border border-border-light relative overflow-hidden shadow-sm">
                                <div className="absolute right-0 top-0 w-1/3 h-full bg-primary-light/30 skew-x-12 translate-x-1/2" />
                                <div className="relative z-10 max-w-2xl">
                                    <h2 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">Welcome back to the Proctoring Command Center</h2>
                                    <p className="text-slate-500 text-base mb-8 font-medium">You have {activeCandidates.length} exams currently in progress. Monitor live feeds or analyze behavior logs using the sidebar navigation.</p>
                                    <div className="flex gap-4">
                                        <button onClick={() => navigate('/hr/monitoring')} className="btn-primary">
                                            Go to Live Monitoring
                                        </button>
                                        <button onClick={() => navigate('/hr/analytics')} className="btn-secondary">
                                            View Analytics
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. MONITORING VIEW */}
                    {view === 'MONITORING' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></div>
                                    <h2 className="text-lg font-bold text-gray-800">Live Candidate Monitoring</h2>
                                </div>
                                <span className="text-sm font-medium text-gray-500">
                                    {activeCandidates.length} Active Now
                                </span>
                            </div>

                            {activeCandidates.length === 0 ? (
                                <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                        <Activity size={32} className="text-gray-300" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 mb-2">No active sessions</h3>
                                    <p className="text-gray-400 text-sm max-w-xs mx-auto mb-6">There are no candidates currently taking an exam. You will see live feeds here once sessions begin.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {activeCandidates.map(c => {
                                        const matchingResults = assessmentResults.filter(
                                            r => r.candidateEmail === c.email || r.candidateName === c.name
                                        );
                                        // Prioritize the IN_PROGRESS session for live monitoring
                                        const activeResult = matchingResults.find(r => r.verdict === 'IN_PROGRESS') || matchingResults[0];
                                        const sessionId = activeResult?.sessionId;
                                        return (
                                            <div key={c.id} className="card relative group">
                                                <div className="flex justify-between items-center px-2 py-4 border-b border-border-light mb-4">
                                                    <div>
                                                        <h4 className="font-bold text-slate-900 text-sm tracking-tight group-hover:text-primary transition-colors">{c.name}</h4>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">ID: {sessionId ?? 'Initialising…'}</p>
                                                    </div>
                                                    <div className="live-badge scale-90">
                                                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></div>
                                                        LIVE
                                                    </div>
                                                </div>
                                                <div className="p-0">
                                                    {sessionId ? (
                                                        <div className="rounded-xl overflow-hidden shadow-sm video-box h-auto border-none">
                                                            <LiveScreenFeed sessionId={sessionId} candidateName={c.name} />
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center h-56 bg-slate-50 rounded-xl border border-dashed border-border-light">
                                                            <div className="w-8 h-8 rounded-full border-2 border-slate-100 border-t-primary animate-spin mb-4"></div>
                                                            <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">Initializing Secure Feed</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* 3. ANALYTICS VIEW */}
                    {view === 'ANALYTICS' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {/* 1. KPI SUMMARY STRIP */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[
                                    { label: 'Total Violations', value: Object.values(violationStats).reduce((a, b) => a + b, 0), icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50', trend: 'Critical Incidents' },
                                    { label: 'High-Risk Sessions', value: candidates.filter(c => c.integrityScore < 60).length, icon: Shield, color: 'text-amber-600', bg: 'bg-amber-50', trend: 'Review Required' },
                                    { label: 'Avg Violations / Cand', value: (Object.values(violationStats).reduce((a, b) => a + b, 0) / Math.max(1, candidates.length)).toFixed(1), icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: 'Frequency Rate' },
                                    { label: 'Clean Pass Rate', value: `${((candidates.filter(c => c.violationPenalty === 0).length / Math.max(1, candidates.length)) * 100).toFixed(0)}%`, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 'Target: >95%' },
                                ].map((kpi, i) => (
                                    <div key={i} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col justify-between group hover:shadow-xl hover:shadow-slate-200/50 transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`p-3 rounded-2xl ${kpi.bg} ${kpi.color}`}>
                                                <kpi.icon size={20} />
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{kpi.label}</span>
                                                <h4 className="text-2xl font-black text-slate-900 mt-2 tracking-tighter">{kpi.value}</h4>
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{kpi.trend}</span>
                                            <TrendingUp size={12} className={kpi.color} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Frequency Breakdown - Severity Coded */}
                                <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8">
                                    <div className="flex items-center justify-between mb-10">
                                        <div>
                                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Violation Frequency</h3>
                                            <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-widest">Distribution by Incident Type</p>
                                        </div>
                                        <div className="flex gap-4">
                                            {['Critical', 'Medium', 'Low'].map(lvl => (
                                                <div key={lvl} className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${lvl === 'Critical' ? 'bg-rose-500' : lvl === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lvl}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="h-80">
                                        {!hasViolations ? (
                                            <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
                                                <CheckCircle size={32} className="mb-2 text-green-400" />
                                                <span>Zero Integrity Violations Recorded.</span>
                                            </div>
                                        ) : (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={[
                                                    { name: 'Mismatch', count: violationStats.PERSON_MISMATCH || 0, severity: 'Critical' },
                                                    { name: 'Mobile', count: violationStats.PHONE_DETECTED || 0, severity: 'Critical' },
                                                    { name: 'Multi-Face', count: violationStats.MULTIPLE_FACES || 0, severity: 'Critical' },
                                                    { name: 'No-Face', count: violationStats.NO_FACE || 0, severity: 'Critical' },
                                                    { name: 'Blur', count: violationStats.WINDOW_BLUR || 0, severity: 'Medium' },
                                                    { name: 'Tab', count: violationStats.TAB_SWITCH || 0, severity: 'Low' },
                                                ]} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'black', textTransform: 'uppercase' }} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />
                                                    <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }} />
                                                    <Bar dataKey="count" radius={[8, 8, 8, 8]} barSize={40}>
                                                        { [
                                                            { severity: 'Critical' }, { severity: 'Critical' }, { severity: 'Critical' }, 
                                                            { severity: 'Medium' }, 
                                                            { severity: 'Low' }
                                                        ].map((entry, index) => (
                                                            <Cell key={index} fill={entry.severity === 'Critical' ? '#ef4444' : entry.severity === 'Medium' ? '#f59e0b' : '#3b82f6'} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        )}
                                    </div>
                                </div>

                                {/* Severity Distribution - Donut */}
                                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Severity Split</h3>
                                            <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-widest">Weighted Incident Impact</p>
                                        </div>
                                    </div>
                                    <div className="h-80 relative">
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Index</span>
                                            <span className="text-3xl font-black text-slate-900 tracking-tighter">
                                                {(( (violationStats.PHONE_DETECTED||0)*10 + (violationStats.MULTIPLE_FACES||0)*15 + (violationStats.NO_FACE||0)*20 + (violationStats.WINDOW_BLUR||0)*5 + (violationStats.TAB_SWITCH||0)*2 ) / Math.max(1, candidates.length)).toFixed(1)}
                                            </span>
                                        </div>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={[
                                                        { name: 'Critical', value: (violationStats.PHONE_DETECTED || 0) + (violationStats.MULTIPLE_FACES || 0) + (violationStats.NO_FACE || 0) + (violationStats.PERSON_MISMATCH || 0), color: '#ef4444' },
                                                        { name: 'Medium', value: (violationStats.WINDOW_BLUR || 0), color: '#f59e0b' },
                                                        { name: 'Low', value: (violationStats.TAB_SWITCH || 0), color: '#3b82f6' },
                                                    ]}
                                                    cx="50%" cy="50%" innerRadius={85} outerRadius={115} paddingAngle={12} dataKey="value" stroke="none"
                                                >
                                                    {[0,1,2].map((i) => (
                                                        <Cell key={i} fill={['#ef4444', '#f59e0b', '#3b82f6'][i]} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Timeline & System Pulse */}
                                <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Activity Timeline & System Pulse</h3>
                                            <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-widest">Temporal Density Analysis</p>
                                        </div>
                                        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Live Pulse Tracking</span>
                                        </div>
                                    </div>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={[
                                                { time: '10:00', intensity: 2 }, { time: '10:05', intensity: 5 }, { time: '10:10', intensity: 1 }, 
                                                { time: '10:15', intensity: 8 }, { time: '10:20', intensity: 3 }, { time: '10:25', intensity: 4 }, 
                                                { time: '10:30', intensity: 2 }, { time: '10:35', intensity: 6 }, { time: '10:40', intensity: 9 }, 
                                                { time: '10:45', intensity: 2 },
                                            ]}>
                                                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />
                                                <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                                <Bar dataKey="intensity" radius={[6, 6, 6, 6]} barSize={32}>
                                                    {[2, 5, 1, 8, 3, 4, 2, 6, 9, 2].map((v, i) => (
                                                        <Cell key={i} fill={v > 7 ? '#ef4444' : v > 4 ? '#f59e0b' : '#3b82f6'} opacity={0.3 + (v/15)} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Quick Tools & Export */}
                                <div className="space-y-6">
                                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-[60px] group-hover:bg-blue-600/40 transition-all duration-700" />
                                        <h3 className="text-xs font-black text-white/40 uppercase tracking-widest mb-6">Security Actions</h3>
                                        <div className="grid grid-cols-2 gap-4 relative z-10">
                                            <button onClick={() => toast.success('Report generation started...')} className="bg-white/10 hover:bg-white/20 p-5 rounded-3xl flex flex-col items-center gap-3 transition-all border border-white/5 active:scale-95">
                                                <Download size={24} className="text-blue-400" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">Export PDF</span>
                                            </button>
                                            <button onClick={() => toast.success('CSV compiled successfully')} className="bg-white/10 hover:bg-white/20 p-5 rounded-3xl flex flex-col items-center gap-3 transition-all border border-white/5 active:scale-95">
                                                <FileText size={24} className="text-emerald-400" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">CSV Data</span>
                                            </button>
                                            <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Sharable link copied!'); }} className="bg-white/10 hover:bg-white/20 p-5 rounded-3xl flex flex-col items-center gap-3 transition-all border border-white/5 col-span-2 flex-row justify-center active:scale-[0.98]">
                                                <Eye size={20} className="text-indigo-400" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">Generate Review Link</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-indigo-50 border border-indigo-100 rounded-[2rem] p-6 flex items-start gap-4">
                                        <div className="bg-indigo-600 p-2 rounded-xl text-white">
                                            <Shield size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-[11px] font-black text-indigo-900 uppercase tracking-widest">AI Audit Active</h4>
                                            <p className="text-[10px] text-indigo-900/60 font-medium mt-1 leading-relaxed">
                                                Advanced patterns are being analyzed to detect sophisticated bypass attempts.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Risk-Ranked Candidate Table & Live Feed */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Left: Candidate Risk Table */}
                                <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                                    <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                                        <div>
                                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Candidate Risk Matrix</h3>
                                            <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-widest">Prioritized Integrity Review</p>
                                        </div>
                                        <select className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none">
                                            <option>Sort by: Risk (High to Low)</option>
                                            <option>Sort by: Integrity %</option>
                                        </select>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50/50">
                                                <tr>
                                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidate</th>
                                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Incidents</th>
                                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Risk Level</th>
                                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {candidates.slice(0, 5).map((c, i) => (
                                                    <tr key={i} className="hover:bg-slate-50/80 transition-all group">
                                                        <td className="px-8 py-5">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black text-xs">
                                                                    {c.name.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold text-slate-900 leading-tight">{c.name}</p>
                                                                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">{c.email}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-5 text-center">
                                                            <span className="text-sm font-black text-rose-500 bg-rose-50 px-3 py-1.5 rounded-xl">
                                                                {Object.values(c.violations || {}).reduce((a, b) => a + b, 0)}
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-5">
                                                            <div className="w-full max-w-[120px]">
                                                                <div className="flex justify-between items-center mb-1.5">
                                                                    <span className={`text-[10px] font-black uppercase tracking-[0.1em] ${c.integrityScore < 60 ? 'text-rose-500' : c.integrityScore < 85 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                                                        {c.integrityScore < 60 ? 'Critical' : c.integrityScore < 85 ? 'Elevated' : 'Verified'}
                                                                    </span>
                                                                    <span className="text-[10px] font-bold text-slate-400">{c.integrityScore || 0}%</span>
                                                                </div>
                                                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                    <div className={`h-full rounded-full ${c.integrityScore < 60 ? 'bg-rose-500' : c.integrityScore < 85 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${c.integrityScore || 0}%` }} />
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-5 text-right">
                                                            <button 
                                                                onClick={() => { setViewingReport(c); setView('OVERVIEW'); }}
                                                                className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm"
                                                            >
                                                                <FileText size={18} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="p-6 bg-slate-50/50 text-center">
                                        <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors">View All candidates Risk Matrix →</button>
                                    </div>
                                </div>

                                {/* Right: Live Violation Feed */}
                                <div className="bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-800 p-8 flex flex-col">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h3 className="text-xs font-black text-white/40 uppercase tracking-widest">Live Alert Feed</h3>
                                            <p className="text-[10px] text-white/20 font-medium mt-1 uppercase tracking-widest">Real-time Stream</p>
                                        </div>
                                        <div className="flex gap-1">
                                            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse delay-75" />
                                            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse delay-150" />
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-4">
                                        {[
                                            { user: 'Rohit K.', type: 'Multiple Faces', time: '2m ago', severity: 'Critical' },
                                            { user: 'Sanya M.', type: 'Tab Switch', time: '5m ago', severity: 'Low' },
                                            { user: 'Amit P.', type: 'Phone Detected', time: '12m ago', severity: 'Critical' },
                                            { user: 'Sneha L.', type: 'Looking Away', time: '18m ago', severity: 'Medium' },
                                            { user: 'Vikas J.', type: 'Suspicious Movement', time: '22m ago', severity: 'Medium' },
                                        ].map((alert, i) => (
                                            <div key={i} className="flex gap-4 p-4 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group">
                                                <div className={`shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center ${alert.severity === 'Critical' ? 'bg-rose-500/10 text-rose-500' : alert.severity === 'Medium' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                                    <AlertTriangle size={18} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <p className="text-xs font-bold text-white leading-none">{alert.user}</p>
                                                        <span className="text-[9px] font-medium text-white/40">{alert.time}</span>
                                                    </div>
                                                    <p className={`text-[10px] font-black uppercase tracking-widest leading-none ${alert.severity === 'Critical' ? 'text-rose-500' : alert.severity === 'Medium' ? 'text-amber-500' : 'text-blue-500'}`}>
                                                        {alert.type}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="pt-6 border-t border-white/5 mt-6 text-center">
                                         <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Ticker Active: Session ID #88419</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 4. RANKING VIEW */}
                    {view === 'RANKING' && (
                        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-8 border-b border-gray-50 flex justify-between items-center flex-wrap gap-4 bg-gray-50/30">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                        <Users className="text-primary" size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Candidate Performance Ranking</h2>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Global assessment leaderboard</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 flex-wrap items-center">
                                    <select
                                        value={selectedAssessmentId}
                                        onChange={e => setSelectedAssessmentId(e.target.value)}
                                        className="border border-border-light rounded-xl px-4 py-2 text-sm outline-none bg-white font-bold text-slate-700 hover:bg-slate-50 transition-all"
                                    >
                                        <option value="ALL">All Assessments</option>
                                        {assessments.map(a => (
                                            <option key={a.id} value={a.id}>{a.title}</option>
                                        ))}
                                    </select>
                                    <div className="relative">
                                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input type="text" placeholder="Search candidates..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                            className="pl-11 pr-4 py-2 border border-border-light rounded-xl text-sm outline-none w-56 font-medium shadow-sm transition-all focus:border-primary focus:ring-1 focus:ring-primary/20" />
                                    </div>
                                    <button onClick={triggerAutoShortlist} className="btn-primary !text-[10px] !py-2 uppercase tracking-widest">
                                        <TrendingUp size={14} /> Auto Shortlist
                                    </button>
                                    <button onClick={downloadCSV} className="p-2 border border-border-light rounded-xl hover:bg-slate-50 text-slate-400 transition-all shadow-sm" title="Download Report">
                                        <Download size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Behavioral Quick Filters */}
                            <div className="px-8 py-5 bg-white border-b border-border-light flex items-center gap-4">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">Quick Filters:</span>
                                <button
                                    onClick={() => setBehaviorFilter('ALL')}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${behaviorFilter === 'ALL' ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                >
                                    All Candidates
                                </button>
                                <button
                                    onClick={() => setBehaviorFilter('TOP_TALENT')}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${behaviorFilter === 'TOP_TALENT' ? 'bg-primary-light text-primary border border-primary/20 shadow-sm' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                >
                                    <Award size={14} /> Top Talent
                                </button>
                                <button
                                    onClick={() => setBehaviorFilter('HIGH_RISK')}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${behaviorFilter === 'HIGH_RISK' ? 'bg-red-50 text-red-600 border border-red-100 shadow-sm' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                >
                                    <AlertTriangle size={14} /> High Risk Alert
                                </button>
                            </div>

                            {resultsLoading ? (
                                <div className="flex justify-center py-24">
                                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-100 border-t-blue-600"></div>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50/50 text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black border-b border-gray-100">
                                            <tr>
                                                <th className="px-8 py-6 text-left w-16">Rank</th>
                                                <th className="px-8 py-6 text-left">Candidate Info</th>
                                                <th className="px-8 py-6 text-left">AI Opinion</th>
                                                <th className="px-8 py-6 text-left">Trust Score</th>
                                                <th className="px-8 py-6 text-left">Quiz / Coding</th>
                                                <th className="px-8 py-6 text-left">Status</th>
                                                <th className="px-8 py-6 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {displayedResults.map((r, idx) => (
                                                <tr
                                                    key={r.sessionId}
                                                    onClick={() => setViewingReport(r)}
                                                    className="group hover:bg-primary-light/20 transition-all duration-300 cursor-pointer"
                                                >
                                                    <td className="px-8 py-6 text-center">
                                                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl font-bold text-xs ${idx === 0 ? 'bg-amber-50 text-amber-600 border border-amber-100' : idx === 1 ? 'bg-slate-50 text-slate-500 border border-slate-100' : idx === 2 ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'text-gray-400'}`}>
                                                            #{idx + 1}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-2xl bg-white border-2 border-slate-50 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-500 overflow-hidden">
                                                                <User size={22} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-slate-900 tracking-tight leading-none mb-2 text-base">
                                                                    {r.firstName && r.lastName ? `${r.firstName} ${r.lastName}` : r.candidateName}
                                                                </p>
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-[10px] text-slate-400 font-bold tracking-tight italic">{r.candidateEmail}</span>
                                                                    {r.resumeUrl && (
                                                                        <a href={getResumeUrl(r.resumeUrl)} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-blue-600 transition-colors"><FileText size={12} /></a>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-2">
                                                            {(() => {
                                                                const score = r.totalScore || 0;
                                                                const integrity = r.integrityScore || 100;
                                                                if (score > 80 && integrity > 90) return <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg font-black text-[9px] uppercase tracking-widest shadow-sm">Strong Candidate</span>;
                                                                if (integrity < 60) return <span className="px-3 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg font-black text-[9px] uppercase tracking-widest shadow-sm animate-pulse">High Risk</span>;
                                                                if (score > 60) return <span className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-50 rounded-lg font-black text-[9px] uppercase tracking-widest shadow-sm">Solid Potential</span>;
                                                                return <span className="px-3 py-1 bg-slate-50 text-slate-500 border border-slate-100 rounded-lg font-black text-[9px] uppercase tracking-widest">Awaiting Review</span>;
                                                            })()}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex flex-col gap-2">
                                                            <div className="flex items-center justify-between w-32">
                                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Security Index</span>
                                                                <span className={`text-[10px] font-black ${getRiskLevel(r.integrityScore || 100).color}`}>
                                                                    {r.integrityScore || 100}%
                                                                </span>
                                                            </div>
                                                            <div className="w-32 h-1.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                                                <div className={`h-full transition-all duration-1000 ${r.integrityScore < 50 ? 'bg-rose-500' : r.integrityScore < 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${r.integrityScore || 100}%` }} />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-2">
                                                            <div className="px-3 py-1.5 bg-white border border-slate-100 rounded-xl text-xs font-black text-slate-700 shadow-sm">Q: {r.quizScore || 0}</div>
                                                            <div className="px-3 py-1.5 bg-white border border-slate-100 rounded-xl text-xs font-black text-slate-700 shadow-sm">C: {r.codingScore || 0}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex flex-col">
                                                            <span className="font-black text-2xl text-indigo-950 tracking-tighter leading-none mb-1">
                                                                {r.finalScoreMarks || 0}
                                                            </span>
                                                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Marks Earned</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className={`px-4 py-2 rounded-xl text-[9px] font-black tracking-widest uppercase border-2 shadow-sm ${verdictColor(r.verdict)}`}>
                                                            {r.verdict || 'PENDING'}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="flex items-center justify-end gap-3 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setViewingReport(r); }}
                                                                className="px-5 py-2.5 bg-blue-50 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 shadow-lg shadow-blue-50 transition-all whitespace-nowrap"
                                                            >
                                                                View Report
                                                            </button>
                                                            <div className="w-px h-8 bg-slate-100 mx-1"></div>
                                                            <button onClick={(e) => { e.stopPropagation(); updateVerdict(r.sessionId, 'SELECTED'); }}
                                                                className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center border border-emerald-100" title="Quick Select">
                                                                <CheckCircle size={18} />
                                                            </button>
                                                            <button onClick={(e) => { e.stopPropagation(); updateVerdict(r.sessionId, 'REJECTED'); }}
                                                                className="w-10 h-10 rounded-xl bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center border border-rose-100" title="Quick Reject">
                                                                <XCircle size={18} />
                                                            </button>
                                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteResult(r.sessionId, r.candidateName); }}
                                                                className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center border border-slate-100" title="Delete Result">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Candidate Detailed AI Report Overlay */}
                            {viewingReport && (
                                <CandidateReport
                                    candidate={viewingReport}
                                    onClose={() => setViewingReport(null)}
                                    onAction={(action) => {
                                        if (action === 'SHORTLIST') {
                                            toast.success(`${viewingReport.candidateName} shortlisted!`);
                                            setViewingReport(null);
                                        } else if (action === 'REJECT') {
                                            toast.error(`Marked ${viewingReport.candidateName} for rejection.`);
                                            setViewingReport(null);
                                        }
                                    }}
                                />
                            )}
                        </div >
                    )}

                </div >
            )}

            {/* Candidate Details Modal */}
            <CandidateDetailModal
                candidate={selectedCandidate}
                isOpen={!!selectedCandidate}
                onClose={() => setSelectedCandidate(null)}
            />

            {/* Proctoring Logs Modal */}
            {
                selectedSession && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col border border-slate-200 overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50">
                                <h3 className="font-bold text-indigo-950 flex items-center gap-2 text-base uppercase tracking-wider">
                                    <AlertTriangle size={20} className="text-blue-600" /> Proctoring Violations
                                </h3>
                                <button onClick={() => setSelectedSession(null)} className="text-slate-400 hover:text-red-500 transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="overflow-y-auto flex-1 p-5 space-y-4">
                                {/* AI Summary Section */}
                                {(logs.length > 0 || summaryLoading) && (
                                    <div className="bg-gradient-to-br from-blue-50/50 to-blue-50/50 rounded-2xl p-5 border border-blue-50 shadow-inner mb-6 transition-all duration-500">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="p-1.5 bg-blue-50 rounded-lg shadow-lg shadow-indigo-200">
                                                <Shield size={14} className="text-white" />
                                            </div>
                                            <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">AI Behavior Insight</h4>
                                        </div>
                                        {summaryLoading ? (
                                            <div className="space-y-2">
                                                <div className="h-2 w-full bg-indigo-200/50 animate-pulse rounded-full"></div>
                                                <div className="h-2 w-2/3 bg-indigo-200/50 animate-pulse rounded-full"></div>
                                            </div>
                                        ) : (
                                            <p className="text-indigo-950 text-xs font-bold leading-relaxed italic">
                                                "{aiSummary || 'Analyzing candidate behavior patterns...'}"
                                            </p>
                                        )}
                                    </div>
                                )}

                                {logsLoading ? (
                                    <div className="flex justify-center py-12">
                                        <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : logs.length === 0 ? (
                                    <div className="text-center py-12 text-slate-400">
                                        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Award size={36} className="text-green-600" />
                                        </div>
                                        <p className="font-bold text-blue-600 text-lg">No violations detected</p>
                                        <p className="text-sm font-medium">Clean exam performance!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                                        {selectedEvidence && (
                                            <div className="mb-6 rounded-2xl overflow-hidden border-4 border-white shadow-xl bg-slate-900 group relative">
                                                {selectedEvidence.type === 'PERSON_MISMATCH' ? (
                                                    <div className="flex gap-1 bg-slate-800 p-2">
                                                        <div className="flex-1 relative">
                                                            <img src={selectedEvidence.referencePhoto} alt="Reference" className="w-full h-48 object-cover rounded-xl" />
                                                            <div className="absolute top-2 left-2 bg-blue-600/80 text-[8px] font-black text-white px-2 py-1 rounded">REFERENCE ID</div>
                                                        </div>
                                                        <div className="flex-1 relative">
                                                            <img src={selectedEvidence.screenshotUrl} alt="Flagged" className="w-full h-48 object-cover rounded-xl border-2 border-rose-500" />
                                                            <div className="absolute top-2 left-2 bg-rose-600/80 text-[8px] font-black text-white px-2 py-1 rounded">FLAGGED FRAME</div>
                                                            {selectedEvidence.matchScore && (
                                                                <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-white text-[10px] font-bold">
                                                                    Match: {selectedEvidence.matchScore.toFixed(1)}%
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <img
                                                        src={selectedEvidence.url}
                                                        alt="Violation Evidence"
                                                        className="w-full h-auto max-h-64 object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                                    />
                                                )}
                                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex items-center justify-between">
                                                    <p className="text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                                        <Camera size={14} className="text-rose-400" /> Evidence Capture
                                                    </p>
                                                    <button onClick={() => setSelectedEvidence(null)} className="text-white/60 hover:text-white transition-colors">
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {logs.map((log, index) => (
                                            <div key={log.id} className="relative flex items-center gap-6 group">
                                                <div className={`flex flex-col items-center justify-center w-10 h-10 rounded-2xl border-4 border-white shadow-md z-10 transition-all duration-300 group-hover:scale-125 ${log.severity === 'HIGH' ? 'bg-rose-500' : log.severity === 'MEDIUM' ? 'bg-amber-500' : 'bg-blue-500'
                                                    }`}>
                                                    {log.violationType === 'TAB_SWITCH' ? <Search size={14} className="text-white" /> :
                                                        log.violationType === 'PHONE_DETECTED' ? <Phone size={14} className="text-white" /> :
                                                            <AlertTriangle size={14} className="text-white" />}
                                                </div>
                                                <div className="flex-1 border border-slate-100 rounded-2xl p-4 bg-white shadow-sm hover:shadow-md transition-all duration-300">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-lg border ${log.severity === 'HIGH' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                            log.severity === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                                'bg-sky-50 text-sky-600 border-sky-100'
                                                            }`}>
                                                            {log.violationType.replace(/_/g, ' ')}
                                                        </span>
                                                        <span className="text-[10px] font-black text-slate-300 bg-slate-50 px-2 py-0.5 rounded-md italic">
                                                            {new Date(log.occurredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <p className="text-slate-700 text-sm font-bold leading-tight mb-3">{log.description}</p>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                            <Shield size={10} className="text-indigo-400" /> System Integrity Check
                                                        </span>
                                                        {log.screenshotUrl ? (
                                                            <button
                                                                onClick={() => {
                                                                    const activeAssessment = assessmentResults.find(ar => ar.sessionId === selectedSession);
                                                                    setSelectedEvidence({
                                                                        url: log.screenshotUrl,
                                                                        type: log.violationType,
                                                                        referencePhoto: activeAssessment?.referencePhoto,
                                                                        screenshotUrl: log.screenshotUrl,
                                                                        matchScore: log.matchScore
                                                                    });
                                                                }}
                                                                className="text-[9px] font-black text-blue-600 uppercase tracking-[0.1em] bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-50 hover:bg-blue-50 transition-colors"
                                                            >
                                                                View Evidence
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => setSelectedEvidence('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1000&auto=format&fit=crop')}
                                                                className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
                                                            >
                                                                <Play size={10} /> Static Evidence
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
        </AdminLayout >
    );
}

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import AdminLayout from '../components/Admin/AdminLayout';
import { adminAPI } from '../services/api';
import { BarChart3, AlertTriangle, User, Award, X, CheckCircle, XCircle, FileText, Phone, MessageSquare, Mic, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { examAPI } from '../services/api';

export default function ResultsDashboard() {
  const { assessmentId } = useParams();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [oralSubmissions, setOralSubmissions] = useState([]);
  const [oralLoading, setOralLoading] = useState(false);
  const [showOralModal, setShowOralModal] = useState(false);

  useEffect(() => {
    adminAPI.getResults(assessmentId)
      .then(({ data }) => {
        const processed = data.map(res => {
          const totalEarned = (res.quizScore || 0) + (res.codingScore || 0) + (res.sqlScore || 0);
          const rawScore = totalEarned + (res.oralScore || 0);
          const totalMax = (res.quizTotal || 0) + (res.codingTotal || 0) + (res.oralTotal || 50);

          const violationCount = res.violationCount || 0;
          const penaltyFactor = Math.max(0.05, 1 - (violationCount / 200));
          const finalScoreMarks = rawScore > 0 ? Math.round(rawScore * penaltyFactor) : 0;

          return { ...res, rawScore, totalMax, violationCount, finalScoreMarks, penaltyFactor };
        });

        const sorted = processed.sort((a, b) => b.finalScoreMarks - a.finalScoreMarks);
        setResults(sorted);
      })
      .catch(() => toast.error('Failed to load results'))
      .finally(() => setLoading(false));
  }, [assessmentId]);

  const showOralDetails = async (sessionId) => {
    setSelectedSession(sessionId);
    setShowOralModal(true);
    setOralLoading(true);
    try {
      const { data } = await examAPI.getOralSubmissions(sessionId);
      setOralSubmissions(data || []);
    } catch {
      toast.error('Failed to load oral reports');
    } finally {
      setOralLoading(false);
    }
  };

  const updateVerdict = async (sessionId, verdict) => {
    try {
      const { data } = await adminAPI.updateResultVerdict(sessionId, verdict);
      setResults(prev => prev.map(r => r.sessionId === sessionId ? { ...r, verdict: data.verdict } : r));
      toast.success(verdict === 'SELECTED' ? 'Selection email sent!' : 'Rejection email sent!');
    } catch (error) {
      toast.error('Failed to update verdict');
    }
  };

  const handleDeleteResult = async (sessionId, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}'s assessment result? This action cannot be undone.`)) return;
    
    try {
      await adminAPI.deleteResult(sessionId);
      toast.success('Result deleted successfully');
      setResults(prev => prev.filter(r => r.sessionId !== sessionId));
    } catch (error) {
      toast.error('Failed to delete result');
    }
  };

  const verdictColor = (v) => ({
    SELECTED: { background: '#f0fdf4', color: '#166534', border: '1px solid #dcfce7' },
    REJECTED: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fee2e2' },
    REVIEW: { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #dbeafe' },
  }[v] || { background: '#f8fafc', color: '#64748b' });

  const severityColor = (s) => ({
    HIGH: 'text-red-600 font-bold',
    MEDIUM: 'text-orange-500 font-bold',
    LOW: 'text-slate-500 font-bold',
  }[s] || 'text-slate-400 font-bold');

  const getResumeUrl = (path) => {
    if (!path) return null;
    return path.startsWith('http') ? path : `http://localhost:8080${path}`;
  };

  return (
    <AdminLayout title="Assessment Results"
      breadcrumbs={[
        { label: 'Dashboard', path: '/admin' },
        { label: 'Results' }
      ]}>

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="w-10 h-10 border-2 border-slate-100 border-t-primary rounded-full animate-spin"></div>
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-24 px-6 bg-white border border-border-light rounded-2xl">
          <div className="w-20 h-20 bg-primary-light rounded-3xl flex items-center justify-center mx-auto mb-6 text-primary/50">
            <BarChart3 size={40} />
          </div>
          <p className="font-bold text-slate-900 text-lg">No results found</p>
          <p className="text-slate-400 text-sm">Waiting for candidates to complete the assessment.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-border-light overflow-hidden">
          <div className="px-8 py-6 border-b border-border-light flex items-center justify-between bg-slate-50/30">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">{results.length} Candidate(s)</h2>
            <div className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary-light px-3 py-1.5 rounded-lg border border-primary/20">
              Avg Score: {results.length ? Math.round(results.reduce((a, b) => a + b.finalScoreMarks, 0) / results.length) : 0} Marks
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  {['Candidate Info', 'Quiz', 'Coding', 'SQL', 'Oral', 'Penalty', 'Final Score', 'Verdict', 'Actions'].map(h => (
                    <th key={h} className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-border-light">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {results.map(r => (
                  <tr key={r.sessionId} className="hover:bg-primary-light/10 transition-all group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-primary-light flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                          <User size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">
                            {r.firstName && r.lastName ? `${r.firstName} ${r.lastName}` : r.candidateName}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{r.candidateEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-slate-500 font-bold text-xs">{r.quizScore}/{r.quizTotal}</td>
                    <td className="px-8 py-5 text-slate-500 font-bold text-xs">{r.codingScore}/{r.codingTotal}</td>
                    <td className="px-8 py-5 text-slate-500 font-bold text-xs">{r.sqlScore || 0}/50</td>
                    <td className="px-8 py-5 text-slate-500 font-bold text-xs">{r.oralScore || 0}/50</td>
                    <td className="px-8 py-5">
                       <span className={`text-[10px] font-bold ${r.penaltyFactor < 0.8 ? 'text-red-500' : 'text-emerald-500'}`}>
                        {(r.penaltyFactor * 100).toFixed(0)}%
                       </span>
                    </td>
                    <td className="px-8 py-5 font-bold text-slate-900 text-sm">{r.finalScoreMarks} / {r.totalMax}</td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm" style={verdictColor(r.verdict)}>
                        {r.verdict || 'PENDING'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <button onClick={() => showOralDetails(r.sessionId)}
                          className="text-primary hover:text-primary transition-colors text-xs flex items-center gap-1.5 font-bold uppercase tracking-wider">
                          <Mic size={15} /> Oral
                        </button>

                        {(r.verdict === 'COMPLETED' || r.verdict === 'PENDING' || !r.verdict) && (
                          <>
                            <div className="w-px h-4 bg-blue-50"></div>
                            <button onClick={() => updateVerdict(r.sessionId, 'SELECTED')}
                              className="text-blue-600 border border-transparent hover:text-blue-600 px-1 py-0.5 rounded text-xs flex items-center gap-1 font-bold transition-all uppercase tracking-wider"
                              title="Select for next round & send email">
                              <CheckCircle size={15} /> Select
                            </button>
                            <button onClick={() => updateVerdict(r.sessionId, 'REJECTED')}
                              className="text-slate-400 hover:text-red-500 text-xs flex items-center gap-1 transition-all font-bold uppercase tracking-wider"
                              title="Reject & send email">
                              <XCircle size={15} /> Reject
                            </button>

                            <div className="w-px h-4 bg-slate-100"></div>
                            <button onClick={() => handleDeleteResult(r.sessionId, r.firstName && r.lastName ? `${r.firstName} ${r.lastName}` : r.candidateName)}
                              className="text-slate-400 hover:text-red-500 transition-all"
                              title="Delete Result">
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Micro-Oral Details Modal */}
      {showOralModal && selectedSession && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col border border-border-light overflow-hidden">
            <div className="flex items-center justify-between px-8 py-6 border-b border-border-light bg-slate-50/50">
              <div className="flex gap-4">
                <button className="bg-primary text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">Micro-Oral Report</button>
                <button onClick={() => { setShowOralModal(false); /* Switch to logs if needed */ }} className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Proctoring Logs</button>
              </div>
              <button onClick={() => setShowOralModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
              {oralLoading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="w-10 h-10 border-2 border-slate-100 border-t-primary rounded-full animate-spin"></div>
                </div>
              ) : oralSubmissions.length === 0 ? (
                <div className="text-center py-20">
                  <MessageSquare size={40} className="mx-auto text-slate-200 mb-4" />
                  <p className="text-slate-500 font-bold">No oral submissions found for this session.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {oralSubmissions.map((sub, idx) => (
                    <div key={idx} className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
                      <div className="flex items-center justify-between">
                         <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-100">
                           {sub.question?.topic || 'General Clarity'}
                         </div>
                         <div className="flex items-center gap-2">
                           <span className="bg-rose-50 text-rose-600 px-3 py-1 rounded-lg text-[10px] font-black tracking-widest border border-rose-100 uppercase">AI SCORE: {sub.score}%</span>
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Difficulty: Medium</span>
                         </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest opacity-40">
                          <CheckCircle size={14} /> Question Played
                        </div>
                        <p className="text-xl font-bold text-slate-800 tracking-tight leading-relaxed pl-6 border-l-4 border-primary/20 italic">
                          "{sub.question?.questionText || 'Conceptual follow-up question'}"
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                          <div className="flex items-center gap-2 mb-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            <Mic size={14} /> Candidate's Answer (Transcript)
                          </div>
                          <p className="text-slate-600 text-sm font-medium leading-relaxed">
                            {sub.transcript}
                          </p>
                        </div>
                        <div className="bg-indigo-50/30 rounded-2xl p-6 border border-indigo-100">
                          <div className="flex items-center gap-2 mb-4 text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                            <Award size={14} /> AI Technical Closeness Evaluation
                          </div>
                          <p className="text-indigo-900/70 text-sm font-medium leading-relaxed">
                            {sub.feedback}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

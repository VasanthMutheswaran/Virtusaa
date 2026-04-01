import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminLayout from '../components/Admin/AdminLayout';
import { adminAPI } from '../services/api';
import { FileText, Users, CheckCircle, Clock, Plus, BarChart3, Eye, TrendingUp, Trash2, Activity, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

const STAT_CONFIGS = [
  { label: 'Total Assessments', key: 'total', icon: FileText, gradient: '#1e3a8a', shadow: 'rgba(30,58,138,0.1)', delay: 'fade-in-up-1' },
  { label: 'Active Now', key: 'active', icon: Zap, gradient: '#2563eb', shadow: 'rgba(37,99,235,0.1)', delay: 'fade-in-up-2' },
  { label: 'Live Candidates', key: 'live', icon: Activity, gradient: '#3b82f6', shadow: 'rgba(59,130,246,0.1)', delay: 'fade-in-up-3' },
  { label: 'Total Candidates', key: 'cands', icon: Users, gradient: '#60a5fa', shadow: 'rgba(96,165,250,0.1)', delay: 'fade-in-up-4' },
];

function StatCard({ config, value }) {
  const Icon = config.icon;
  return (
    <div className={`stat-card flex items-center gap-4 ${config.delay}`}>
      <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: `${config.gradient}15`, color: config.gradient }}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{config.label}</p>
        <p className="text-2xl font-bold text-slate-900 leading-none mt-1">{value}</p>
      </div>
    </div>
  );
}

const statusStyles = {
  ACTIVE: { background: '#f0fdf4', color: '#166534', border: '1px solid #dcfce7' },
  DRAFT: { background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' },
  CLOSED: { background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' },
};

export default function AdminDashboard() {
  const [assessments, setAssessments] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboardData = () => {
    setLoading(true);
    Promise.all([adminAPI.getAssessments(), adminAPI.getCandidates()])
      .then(([aRes, cRes]) => {
        setAssessments(aRes.data || []);
        setCandidates(cRes.data || []);
      })
      .catch(err => {
        const msg = err.response?.data?.message || 'Failed to load dashboard';
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDelete = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      try {
        await adminAPI.deleteAssessment(id);
        toast.success('Assessment deleted');
        fetchDashboardData();
      } catch (err) {
        toast.error('Failed to delete assessment');
      }
    }
  };

  const activeAssessments = assessments.filter(a => a.status === 'ACTIVE').length;
  const activeCandidates = candidates.filter(c => c.status === 'IN_PROGRESS').length;

  const statValues = {
    total: assessments.length,
    active: activeAssessments,
    live: activeCandidates,
    cands: candidates.length,
  };
  return (
    <AdminLayout title="Dashboard" breadcrumbs={[{ label: 'Dashboard' }]}>
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-2 border-slate-100 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Stat Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {STAT_CONFIGS.map(cfg => (
              <StatCard key={cfg.key} config={cfg} value={statValues[cfg.key]} />
            ))}
          </div>

          {/* Quick Actions */}
          <div className="flex gap-4 mb-8 flex-wrap">
            <button
              onClick={() => navigate('/admin/assessments/create')}
              className="btn-primary"
            >
              <Plus size={16} /> Create Assessment
            </button>
            <Link
              to="/admin/candidates"
              className="btn-secondary no-underline font-bold"
            >
              <Users size={16} /> Manage Candidates
            </Link>
          </div>

          {/* Live Activity */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Live Candidate Activity</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {candidates.filter(c => c.status === 'IN_PROGRESS').length === 0 ? (
                <div className="p-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100 text-slate-400 text-xs text-center col-span-full">
                  No candidates currently in a test.
                </div>
              ) : (
                candidates.filter(c => c.status === 'IN_PROGRESS').map(c => (
                  <div key={c.id} className="card !p-4 flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <Activity size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{c.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Live Now</p>
                    </div>
                    <div className="live-badge !bg-green-50 !text-green-600 border border-green-100 scale-75">LIVE</div>
                  </div>
                ))
              )}
            </div>
          </div>
          <style>{`@keyframes pulse{0%{opacity:1}50%{opacity:0.4}100%{opacity:1}}`}</style>

          {/* Assessments Table */}
          <div className="bg-white rounded-2xl border border-border-light overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b border-border-light flex items-center justify-between bg-slate-50/30">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">All Assessments</h2>
              <button
                onClick={() => navigate('/admin/assessments/create')}
                className="text-primary hover:text-primary/80 transition-colors text-xs font-bold flex items-center gap-1.5"
              >
                <Plus size={14} /> Create New
              </button>
            </div>

            {assessments.length === 0 ? (
              <div className="text-center py-24 px-6">
                <div className="w-16 h-16 bg-primary-light rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary">
                  <FileText size={28} />
                </div>
                <p className="text-slate-500 mb-8 font-medium">No assessments yet. Create your first one!</p>
                <button onClick={() => navigate('/admin/assessments/create')} className="btn-primary">
                  Create Assessment
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      {['Title', 'Duration', 'Questions', 'Status', 'Actions'].map(h => (
                        <th key={h} className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-border-light">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light">
                    {assessments.map((a) => (
                      <tr
                        key={a.id}
                        className="hover:bg-primary-light/10 transition-colors group"
                      >
                        <td className="px-6 py-5 font-bold text-slate-900 text-sm">{a.title}</td>
                        <td className="px-6 py-5 text-slate-500 text-sm">
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-primary" /> {a.durationMinutes} min
                          </div>
                        </td>
                        <td className="px-6 py-5 text-slate-500 text-sm">
                          {(a.totalCodingQuestions || 0) + (a.totalQuizQuestions || 0)} total
                        </td>
                        <td className="px-6 py-5">
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                            style={statusStyles[a.status] || statusStyles.CLOSED}
                          >
                            {a.status}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-6">
                            <Link to={`/admin/assessments/${a.id}`} className="text-primary hover:text-primary/80 flex items-center gap-1.5 text-xs font-bold no-underline" >
                              <Eye size={14} /> View
                            </Link>
                            <Link to={`/admin/results/${a.id}`} className="text-primary hover:text-primary/80 flex items-center gap-1.5 text-xs font-bold no-underline" >
                              <BarChart3 size={14} /> Results
                            </Link>
                            <button
                              onClick={() => handleDelete(a.id, a.title)}
                              className="text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1.5 text-xs font-bold bg-none border-none p-0"
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  );
}

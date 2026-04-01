import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../components/Admin/AdminLayout';
import { adminAPI } from '../services/api';
import { Code, HelpCircle, Users, Send, BarChart3, Play, CheckCircle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AssessmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);

  const fetchDetails = () => {
    setLoading(true);
    Promise.all([adminAPI.getAssessment(id), adminAPI.getCandidates()])
      .then(([aRes, cRes]) => {
        setAssessment(aRes.data);
        setCandidates(cRes.data || []);
      })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleInvite = async () => {
    if (selectedCandidates.length === 0) return toast.error('Select at least one candidate');
    setInviting(true);
    try {
      await adminAPI.inviteCandidates(parseInt(id), selectedCandidates);
      toast.success(`Invitations sent to ${selectedCandidates.length} candidate(s)!`);
      setSelectedCandidates([]);
      fetchDetails(); // Refresh to show ACTIVE status
    } catch {
      toast.error('Failed to send invitations');
    } finally {
      setInviting(false);
    }
  };

  const handleActivate = async () => {
    try {
      await adminAPI.updateAssessment(id, { ...assessment, status: 'ACTIVE' });
      toast.success('Assessment activated!');
      fetchDetails();
    } catch {
      toast.error('Failed to activate assessment');
    }
  };

  const toggleCandidate = (cid) => {
    setSelectedCandidates(prev =>
      prev.includes(cid) ? prev.filter(x => x !== cid) : [...prev, cid]
    );
  };

  const handleDeleteCandidate = async (e, cid, name) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to remove candidate "${name}"? This will delete all their data.`)) return;
    
    try {
      await adminAPI.removeCandidate(cid);
      toast.success('Candidate removed successfully');
      fetchDetails();
    } catch (err) {
      toast.error('Failed to remove candidate');
    }
  };

  if (loading) return (
    <AdminLayout title="">
      <div className="flex justify-center items-center py-20">
        <div className="w-10 h-10 border-2 border-slate-100 border-t-primary rounded-full animate-spin"></div>
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout
      title={assessment?.title}
      breadcrumbs={[
        { label: 'Dashboard', path: '/admin' },
        { label: assessment?.title || 'Assessment' }
      ]}>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card !p-6 flex flex-col items-center text-center group">
              <div className="w-12 h-12 bg-primary-light rounded-2xl flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                <Code size={22} />
              </div>
              <p className="text-3xl font-bold text-slate-900 leading-none">{assessment?.totalCodingQuestions || 0}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3">Coding Assessment</p>
            </div>
            <div className="card !p-6 flex flex-col items-center text-center group">
              <div className="w-12 h-12 bg-primary-light rounded-2xl flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                <HelpCircle size={22} />
              </div>
              <p className="text-3xl font-bold text-slate-900 leading-none">{assessment?.totalQuizQuestions || 0}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3">MCQ Questions</p>
            </div>
            <div className="card !p-6 flex flex-col items-center text-center group">
              <div className="w-12 h-12 bg-primary-light rounded-2xl flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                <Play size={22} />
              </div>
              <p className="text-3xl font-bold text-slate-900 leading-none">{assessment?.durationMinutes}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3">Time Limit (Min)</p>
            </div>
          </div>

          {/* Description */}
          {assessment?.description && (
            <div className="card !p-8">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Description</h2>
              <p className="text-slate-600 leading-relaxed text-sm">{assessment.description}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={() => navigate(`/admin/results/${id}`)}
              className="btn-secondary flex items-center gap-2">
              <BarChart3 size={16} /> View Results
            </button>
            {assessment?.status === 'DRAFT' && (
              <button onClick={handleActivate}
                className="btn-primary flex items-center gap-2">
                <CheckCircle size={16} /> Activate Assessment
              </button>
            )}
          </div>
        </div>

        <div className="card !p-8 h-fit">
          <h2 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2 uppercase tracking-widest">
            <div className="p-1.5 bg-primary-light rounded-lg text-primary"><Users size={18} /></div> Invite Candidates
          </h2>

          <div className="space-y-2 max-h-80 overflow-y-auto mb-8 pr-1">
            {candidates.length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-10 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">No candidates found</p>
            ) : candidates.map(c => (
              <label key={c.id}
                className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer border transition-all duration-200 ${selectedCandidates.includes(c.id) ? 'border-primary bg-primary-light/30 shadow-sm' : 'border-border-light hover:bg-slate-50'
                  }`}>
                <input type="checkbox"
                  checked={selectedCandidates.includes(c.id)}
                  onChange={() => toggleCandidate(c.id)}
                  className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{c.name}</p>
                  <p className="text-[10px] text-slate-400 truncate font-bold uppercase tracking-widest">{c.email}</p>
                </div>
                {c.status === 'INVITED' && (
                  <div className="flex items-center gap-1 bg-green-50 text-green-600 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-green-100">
                    <CheckCircle size={10} /> Sent
                  </div>
                )}
                <button 
                  onClick={(e) => handleDeleteCandidate(e, c.id, c.name)}
                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="Remove Candidate"
                >
                  <Trash2 size={14} />
                </button>
              </label>
            ))}
          </div>

          <button onClick={handleInvite} disabled={inviting || selectedCandidates.length === 0}
            className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50">
            <Send size={16} />
            {inviting ? 'Sending...' : `Send Invitations (${selectedCandidates.length})`}
          </button>

          <p className="text-xs text-gray-400 mt-2 text-center">
            Candidates will receive secure exam links via email
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}

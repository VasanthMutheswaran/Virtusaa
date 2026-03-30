import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/Admin/AdminLayout';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Search, UserCheck, Mail, Trash2 } from 'lucide-react';

export default function CandidateManagement() {
  const [candidates, setCandidates] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    adminAPI.getCandidates()
      .then(r => setCandidates(r.data || []))
      .catch(() => toast.error('Failed to load candidates'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = candidates.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) return toast.error('Name and email are required');
    setAddLoading(true);
    try {
      const { data } = await adminAPI.addCandidate(form);
      setCandidates([...candidates, data]);
      setForm({ name: '', email: '', phone: '' });
      setShowAdd(false);
      toast.success('Candidate added!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add candidate (email may already exist)';
      toast.error(msg);
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemove = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove candidate ${name}?`)) return;
    try {
      await adminAPI.removeCandidate(id);
      setCandidates(candidates.filter(c => c.id !== id));
      toast.success('Candidate removed successfully');
    } catch (err) {
      toast.error('Failed to remove candidate');
    }
  };

  const statusColor = (s) => ({
    PENDING: { background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' },
    INVITED: { background: '#f0fdf4', color: '#166534', border: '1px solid #dcfce7' },
    IN_PROGRESS: { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #dbeafe' },
    COMPLETED: { background: '#f0f9ff', color: '#0369a1', border: '1px solid #e0f2fe' },
    REJECTED: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fee2e2' },
  }[s] || { background: '#f8fafc', color: '#64748b' });

  return (
    <AdminLayout title="Candidate Management"
      breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'Candidates' }]}>

      <div className="bg-white rounded-2xl shadow-sm border border-border-light overflow-hidden">
        {/* Header */}
        <div className="px-6 py-6 border-b border-border-light flex flex-wrap items-center justify-between gap-6 bg-slate-50/30">
          <div className="relative flex-1 max-w-sm group">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" />
            <input className="input-field !pl-11 !py-2.5 !text-xs !rounded-2xl" placeholder="Search by name or email..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button onClick={() => setShowAdd(!showAdd)}
            className="btn-primary !py-2.5 !px-6 !text-xs">
            <Plus size={14} /> Add Candidate
          </button>
        </div>

        {/* Add Form */}
        {showAdd && (
          <div className="px-8 py-8 bg-primary-light/10 border-b border-primary-light animate-fade-in-down">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-6">Create New Candidate</h3>
            <form onSubmit={handleAdd} className="flex gap-4 flex-wrap items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="label">Full Name</label>
                <input className="input-field !rounded-2xl !bg-white" placeholder="John Doe"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="label">Email Address</label>
                <input className="input-field !rounded-2xl !bg-white" type="email" placeholder="john@example.com"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="label">Phone (Optional)</label>
                <input className="input-field !rounded-2xl !bg-white" placeholder="+1234567890"
                  value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={addLoading}
                  className="btn-primary !px-8 !py-2.5 !text-xs">
                  {addLoading ? 'Adding...' : 'Save Candidate'}
                </button>
                <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary !border-slate-200 !text-slate-500 !py-2.5 !px-5 !text-xs font-bold">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="w-10 h-10 border-2 border-slate-100 border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 px-6 bg-white">
            <div className="w-20 h-20 bg-primary-light rounded-3xl flex items-center justify-center mx-auto mb-6 text-primary/50 group">
               <UserCheck size={40} className="group-hover:scale-110 transition-transform" />
            </div>
            <p className="font-bold text-slate-900 tracking-tight text-lg mb-1">{search ? 'No matching candidates' : 'Your candidate pool is empty'}</p>
            <p className="text-slate-400 text-sm">Add candidates manually or import them via CSV.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  {['Name', 'Email Contact', 'Phone Number', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-border-light">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-primary-light/10 transition-all group">
                    <td className="px-8 py-5 font-bold text-slate-900 text-sm">{c.name}</td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                        <Mail size={14} className="text-primary" />{c.email}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-slate-500 text-sm font-medium">{c.phone || '—'}</td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm" style={statusColor(c.status)}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <button 
                        onClick={() => handleRemove(c.id, c.name)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        title="Remove Candidate"
                      >
                         <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-8 py-5 bg-slate-50/50 border-t border-border-light text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Showing {filtered.length} of {candidates.length} candidates
        </div>
      </div>
    </AdminLayout>
  );
}

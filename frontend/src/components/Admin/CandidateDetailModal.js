import React from 'react';
import { X, User, Mail, Phone, Award, Shield, AlertTriangle } from 'lucide-react';

export default function CandidateDetailModal({ candidate, onClose }) {
  if (!candidate) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <User className="text-blue-600" size={24} /> Candidate Profile
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-24 h-24 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-500 font-bold text-3xl shrink-0">
              {candidate.name?.charAt(0) || 'U'}
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">{candidate.name}</h2>
              <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                <span className="flex items-center gap-1.5"><Mail size={16} /> {candidate.email}</span>
                {candidate.phone && <span className="flex items-center gap-1.5"><Phone size={16} /> {candidate.phone}</span>}
              </div>
              <div className="flex gap-2 pt-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${candidate.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                    candidate.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-500' : 'bg-slate-100 text-slate-600'
                  }`}>
                  {candidate.status}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${candidate.recommendation === 'Recommended' ? 'bg-blue-50 text-white' :
                    candidate.recommendation === 'Review' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                  }`}>
                  {candidate.recommendation}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Final Score</p>
              <p className="text-2xl font-black text-slate-900">{candidate.finalScore}%</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Integrity Score</p>
              <p className="text-2xl font-black text-slate-900">{candidate.integrityScore}%</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Violations</p>
              <p className="text-2xl font-black text-red-600">
                {candidate.violations ? (candidate.violations.tabSwitch + candidate.violations.phoneDetected + candidate.violations.multipleFaces + candidate.violations.noFace + candidate.violations.windowBlur) : 0}
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <Shield className="text-blue-500" size={18} /> Detailed Assessment
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white border rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Coding Logic</p>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-50 h-full" style={{ width: `${candidate.codingScore}%` }}></div>
                </div>
              </div>
              <div className="p-3 bg-white border rounded-lg">
                <p className="text-xs text-slate-500 mb-1">MCQ Efficiency</p>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-50 h-full" style={{ width: `${candidate.mcqScore}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors">
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
}

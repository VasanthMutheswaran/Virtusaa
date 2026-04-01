import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { examAPI } from '../services/api';
import { Shield, Clock, Code, HelpCircle, Camera, CheckCircle, AlertCircle, ChevronRight, Cpu, Settings2 } from 'lucide-react';
import toast from 'react-hot-toast';
import DeviceCheck from '../components/Candidate/DeviceCheck';
import ConnectivityStatus from '../components/Common/ConnectivityStatus';
import CandidateProgress from '../components/Candidate/CandidateProgress';

export function ExamLanding() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [compatibilityPassed, setCompatibilityPassed] = useState(false);
  const [showFaceCapture, setShowFaceCapture] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [registering, setRegistering] = useState(false);
  const videoRef = React.useRef(null);

  useEffect(() => {
    // Check if system check was passed for this token
    const isPassed = sessionStorage.getItem(`systemCheck_${token}`) === 'passed' || 
                    new URLSearchParams(window.location.search).get('skipcheck') === 'true';
    setCompatibilityPassed(isPassed);

    examAPI.startExam(token)
      .then(({ data }) => {
        setExam(data);
        if (data.referencePhoto) {
          setCapturedPhoto(data.referencePhoto);
        }
      })
      .catch((err) => {
        const msg = err.response?.data?.message || 'Invalid or expired test link';
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      toast.error("Camera access denied. Identity verification is required.");
    }
  };

  const capturePhoto = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);
    const base64 = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedPhoto(base64);
    
    // Stop camera stream
    const stream = videoRef.current.srcObject;
    stream.getTracks().forEach(track => track.stop());
    setShowFaceCapture(false);
  };

  const handleSaveReference = async () => {
    setRegistering(true);
    try {
      await examAPI.saveReferencePhoto(exam.sessionId, capturedPhoto);
      toast.success("Identity Registration Complete");
      // Update local exam object
      setExam(prev => ({ ...prev, referencePhoto: capturedPhoto }));
    } catch (err) {
      toast.error("Failed to save identity photo.");
    } finally {
      setRegistering(false);
    }
  };

  const handleStart = async () => {
    if (!compatibilityPassed) {
      toast.error('System check required!');
      return navigate(`/exam/check/${token}`);
    }
    if (!exam.referencePhoto && !capturedPhoto) {
      return setShowFaceCapture(true);
    }
    if (!exam.referencePhoto && capturedPhoto) {
        await handleSaveReference();
    }
    if (!agreed) return toast.error('Please agree to the terms');
    setStarting(true);

    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }

    sessionStorage.setItem('examData', JSON.stringify(exam));
    navigate(`/exam/room/${exam.sessionId}`);
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div style={{ textAlign: 'center', color: '#1e3a8a' }}>
        <div style={{ width: '52px', height: '52px', border: '3px solid rgba(59,130,246,0.1)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.85s linear infinite', margin: '0 auto 1.5rem', boxShadow: '0 0 40px rgba(59,130,246,0.1)' }} />
        <p style={{ color: '#1e3a8a', fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Initializing Secure Session…</p>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!exam) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white border border-blue-100 rounded-[2rem] shadow-2xl" style={{ maxWidth: '420px', width: '100%', padding: '3rem', textAlign: 'center' }}>
        <div style={{ width: '80px', height: '80px', background: '#fdf2f2', border: '1px solid #fee2e2', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyCenter: 'center', margin: '0 auto 1.5rem' }}>
          <AlertCircle size={40} color="#ef4444" />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1e3a8a', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Session Expired</h2>
        <p style={{ color: '#64748b', fontSize: '0.95rem', fontWeight: 500 }}>This assessment link is no longer valid or authentication failed.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#1e3a8a 2px, transparent 2px)', backgroundSize: '32px 32px' }} />
      <div className="w-full max-w-4xl" style={{ position: 'relative', zIndex: 1 }}>
        <div className="w-full max-w-2xl mx-auto py-8">
          <CandidateProgress currentStep="landing" />
          
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white rounded-[2.5rem] shadow-[0_40px_100px_rgba(30,58,138,0.05)] border border-blue-100 overflow-hidden">
            {/* Header */}
            <div style={{ background: '#f8faff', padding: '3.5rem 2rem', textAlign: 'center', position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.4) 1px,transparent 1px)', backgroundSize: '30px 30px' }} />
              <div style={{ width: '64px', height: '64px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', border: '1.5px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                <Shield size={32} color="#1e3a8a" />
              </div>
              <h1 style={{ color: '#172554', fontSize: '1.75rem', fontWeight: 900, margin: 0, letterSpacing: '-0.04em', textTransform: 'uppercase' }}>{exam.assessmentTitle}</h1>
              <p style={{ color: '#3b82f6', marginTop: '0.75rem', fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Cpu size={14} /> Candidate: {exam.candidateName}
              </p>
              <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
                <ConnectivityStatus minimal />
              </div>
            </div>

            <div style={{ padding: '2rem' }}>
              {/* Info cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '2rem' }}>
                {[
                  { icon: Clock, label: 'DURATION', value: `${exam.durationMinutes}m` },
                  { icon: Code, label: 'CODING', value: exam.codingQuestions?.length || 0 },
                  { icon: HelpCircle, label: 'QUIZ', value: exam.quizQuestions?.length || 0 },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} style={{ background: '#f8faff', borderRadius: '1.25rem', padding: '1.25rem 0.5rem', textAlign: 'center', border: '1.5px solid #eff6ff' }}>
                    <Icon size={20} color="#1e40af" style={{ display: 'block', margin: '0 auto 0.6rem' }} />
                    <p style={{ margin: 0, fontWeight: 900, color: '#1e3a8a', fontSize: '1.25rem' }}>{value}</p>
                    <p style={{ margin: 0, fontSize: '0.65rem', color: '#60a5fa', fontWeight: 900, marginTop: '2px', letterSpacing: '1.5px' }}>{label}</p>
                  </div>
                ))}
              </div>

              {/* Status Section */}
              <div style={{
                border: '2px solid',
                borderColor: compatibilityPassed ? '#dcfce7' : '#fee2e2',
                borderRadius: '1.5rem',
                padding: '1.5rem',
                marginBottom: '1.5rem',
                background: compatibilityPassed ? '#f0fdf4' : '#fef2f2',
                transition: 'all 0.3s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{
                      width: '48px', height: '48px',
                      borderRadius: '14px',
                      background: compatibilityPassed ? '#16a34a' : '#ef4444',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.05)'
                    }}>
                      {compatibilityPassed ? <CheckCircle size={22} /> : <Settings2 size={22} />}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontWeight: 900, color: compatibilityPassed ? '#166534' : '#991b1b', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        System Calibration
                      </h3>
                      <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: compatibilityPassed ? '#15803d' : '#b91c1c', fontWeight: 700 }}>
                        {compatibilityPassed ? 'INTEGRITY VERIFIED' : 'CALIBRATION REQUIRED'}
                      </p>
                    </div>
                  </div>
                  {!compatibilityPassed && (
                    <button
                      onClick={() => navigate(`/exam/check/${token}`)}
                      className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition shadow-lg active:scale-95"
                    >
                      Run Check
                    </button>
                  )}
                </div>
              </div>

              {/* Identity Verification Step */}
              <div style={{
                border: '2px solid',
                borderColor: (exam.referencePhoto || capturedPhoto) ? '#dcfce7' : '#eff6ff',
                borderRadius: '1.5rem',
                padding: '1.5rem',
                marginBottom: '1.5rem',
                background: (exam.referencePhoto || capturedPhoto) ? '#f0fdf4' : '#f8faff',
                transition: 'all 0.3s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{
                      width: '48px', height: '48px',
                      borderRadius: '14px',
                      background: (exam.referencePhoto || capturedPhoto) ? '#16a34a' : '#1e3a8a',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.05)'
                    }}>
                      {(exam.referencePhoto || capturedPhoto) ? <CheckCircle size={22} /> : <Camera size={22} />}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontWeight: 900, color: (exam.referencePhoto || capturedPhoto) ? '#166534' : '#1e3a8a', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Identity Verification
                      </h3>
                      <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: (exam.referencePhoto || capturedPhoto) ? '#15803d' : '#3b82f6', fontWeight: 700 }}>
                        {(exam.referencePhoto || capturedPhoto) ? 'ID REGISTERED' : 'REGISTRATION PENDING'}
                      </p>
                    </div>
                  </div>
                  {!exam.referencePhoto && !capturedPhoto && compatibilityPassed && (
                    <button
                      onClick={() => { setShowFaceCapture(true); startCamera(); }}
                      className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition shadow-lg active:scale-95"
                    >
                      Capture ID
                    </button>
                  )}
                  {capturedPhoto && !exam.referencePhoto && (
                    <div className="flex items-center gap-3">
                        <img src={capturedPhoto} className="w-12 h-12 rounded-lg object-cover border-2 border-green-500" alt="Ref" />
                        <button
                          onClick={() => { setShowFaceCapture(true); startCamera(); }}
                          className="text-blue-600 text-[10px] font-black uppercase tracking-widest"
                        >
                          Retake
                        </button>
                    </div>
                  )}
                  {exam.referencePhoto && (
                     <img src={exam.referencePhoto} className="w-12 h-12 rounded-lg object-cover border-2 border-green-200" alt="Ref" />
                  )}
                </div>
              </div>

              {/* Face Capture Overlay */}
              {showFaceCapture && (
                <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6">
                  <div className="bg-white rounded-[3rem] p-10 max-w-xl w-full text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-blue-600 animate-pulse" />
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">Identity Registration</h2>
                    <p className="text-slate-500 text-sm font-bold mb-8 uppercase tracking-widest">Center your face in the frame and look directly at the camera</p>
                    
                    <div className="relative rounded-3xl overflow-hidden aspect-video bg-slate-100 border-4 border-slate-50 shadow-2xl mb-8">
                       <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                       <div className="absolute inset-0 border-[40px] border-slate-900/10 pointer-events-none">
                          <div className="w-full h-full border-2 border-dashed border-white/80 rounded-full opacity-50" />
                       </div>
                    </div>

                    <div className="flex gap-4">
                      <button 
                        onClick={() => {
                          const stream = videoRef.current.srcObject;
                          if (stream) stream.getTracks().forEach(track => track.stop());
                          setShowFaceCapture(false);
                        }}
                        className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-500 font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={capturePhoto}
                        className="flex-2 py-4 px-10 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition active:scale-95"
                      >
                        Capture Ground Truth
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Rules */}
              <div style={{ background: '#f8faff', border: '1px solid #eff6ff', borderRadius: '1.5rem', padding: '1.5rem', marginBottom: '1.5rem', borderLeft: '5px solid #2563eb' }}>
                <h3 style={{ margin: '0 0 1rem', fontWeight: 900, color: '#1e3a8a', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Proctoring Protocol</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    'Live facial/audio stream analyzed by AI',
                    'Multi-face detection flags violation',
                    'Browser locking mechanism active',
                    'Zero tolerance for resource switching',
                  ].map(rule => (
                    <li key={rule} style={{ fontSize: '0.75rem', color: '#1e3a8a', fontWeight: 700, display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <span style={{ marginTop: '2px', flexShrink: 0, color: '#93c5fd' }}>■</span> {rule}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Agreement */}
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', marginBottom: '1.8rem' }}>
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                  style={{ marginTop: '3px', width: '18px', height: '18px', accentColor: '#172554', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5, fontWeight: 700, textTransform: 'uppercase' }}>
                  I consent to continuous proctoring monitoring for integrity review.
                </span>
              </label>

              <button
                onClick={handleStart}
                disabled={starting || !agreed || !compatibilityPassed}
                className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-3 shadow-2xl ${compatibilityPassed && agreed
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/10 active:scale-[0.98]'
                  : 'bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed'
                  }`}
              >
                {starting ? 'Initiating Session…' : compatibilityPassed ? <>Enter Exam Room <ChevronRight size={18} /></> : <>Locked: Complete System Check</>}
              </button>

              {/* Dev Bypass Link */}
              {!compatibilityPassed && (
                <button 
                  onClick={() => {
                    sessionStorage.setItem(`systemCheck_${token}`, 'passed');
                    setCompatibilityPassed(true);
                  }}
                  className="w-full mt-4 text-[9px] font-bold text-slate-300 hover:text-primary transition uppercase tracking-[0.3em]"
                >
                  Skip Protocol (Testing Only)
                </button>
              )}
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExamLanding;

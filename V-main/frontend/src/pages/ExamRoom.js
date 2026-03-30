import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examAPI } from '../services/api';
import { createStompClient, disconnectStomp } from '../services/websocket';
import CodeEditor from '../components/Candidate/CodeEditor';
import ProctoringMonitor from '../components/Common/ProctoringMonitor';
import { Clock, Code, HelpCircle, ChevronLeft, ChevronRight, AlertTriangle, Send, WifiOff, ShieldCheck, CheckCircle, Flag, Info, RefreshCw, Volume2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useConnectivity } from '../hooks/useConnectivity';
import ConnectivityStatus from '../components/Common/ConnectivityStatus';
import MicroOralLayer from '../components/Candidate/MicroOralLayer';
import { aiService } from '../services/api';

export default function ExamRoom() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [activeTab, setActiveTab] = useState('coding');
  const [activeCodingIdx, setActiveCodingIdx] = useState(0);
  const [activeQuizIdx, setActiveQuizIdx] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [flaggedQuestions, setFlaggedQuestions] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [violations, setViolations] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [activeAudio, setActiveAudio] = useState(null);
  const [welcomeAudioPlayed, setWelcomeAudioPlayed] = useState(false);
  const [audioPlayed, setAudioPlayed] = useState({});
  const allQuizAnswered = exam?.quizQuestions?.every(q => quizAnswers[q.id]) ?? true;
  const timerRef = useRef(null);

  // Clarity Check (Oral) State
  const [mcqClarityQuestions, setMcqClarityQuestions] = useState([]);
  const [activeMcqClarityIdx, setActiveMcqClarityIdx] = useState(-1);
  const [isGeneratingClarity, setIsGeneratingClarity] = useState(false);
  const { isOnline, status: netStatus } = useConnectivity();
  const [showConnOverlay, setShowConnOverlay] = useState(false);
  const connTimerRef = useRef(null);

  // Screen share refs
  const screenStreamRef = useRef(null);
  const screenCanvasRef = useRef(document.createElement('canvas'));
  const stompClientRef = useRef(null);
  const screenIntervalRef = useRef(null);
  const hasAttemptedScreenShareRef = useRef(false);
  const [screenShareStatus, setScreenShareStatus] = useState('idle'); // idle, requesting, active, denied


  useEffect(() => {
    // Load exam from session storage (passed from ExamLanding)
    const examData = sessionStorage.getItem('examData');
    if (examData) {
      const data = JSON.parse(examData);
      console.log("Exam Data Loaded:", data);
      setExam(data);
      setTimeLeft(data.durationMinutes * 60);

      // Initialize active tab dynamically: Quiz sections first, then Coding
      const quizSections = Object.keys(data.quizQuestions?.reduce((acc, q) => {
        const section = q.sectionName || 'General';
        acc[section] = true;
        return acc;
      }, {}) || {});

      if (quizSections.length > 0) {
        setActiveTab(quizSections[0]);
      } else if (data.codingQuestions?.length > 0) {
        setActiveTab('coding');
      }
    } else {
      toast.error('Session expired');
      navigate('/');
    }

    return () => stopScreenShare();
  }, []);

  const startScreenShare = async () => {
    if (screenShareStatus === 'active') return;

    // Check for focus - don't pop if tab is backgrounded
    if (document.hidden) return;

    hasAttemptedScreenShareRef.current = true;
    setScreenShareStatus('requesting');

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 1, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      screenStreamRef.current = stream;
      setScreenShareStatus('active');

      // Connect STOMP and start sending frames
      const client = createStompClient((connectedClient) => {
        stompClientRef.current = connectedClient;
        startSendingFrames(stream, connectedClient);
      });

      // Handle candidate stopping screen share from browser UI
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        stopScreenShare();
        setScreenShareStatus('denied');
      });
    } catch (err) {
      setScreenShareStatus('denied');
      console.warn('Screen share declined or unavailable:', err);
    }
  };

  const startSendingFrames = (stream, client) => {
    const video = document.createElement('video');
    video.srcObject = stream;
    video.play();
    const canvas = screenCanvasRef.current;

    screenIntervalRef.current = setInterval(() => {
      if (!client.active || !stream.active) return;
      // Optimize resolution for bandwidth vs quality
      canvas.width = 640;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Use 0.4 quality to keep Base64 size well under 1MB limit
      const frame = canvas.toDataURL('image/jpeg', 0.4);

      try {
        client.publish({
          destination: `/app/screen/${sessionId}`,
          body: frame,
        });
      } catch (e) { /* ignore transient publish errors */ }
    }, 2000); // every 2 seconds
  };

  const stopScreenShare = () => {
    clearInterval(screenIntervalRef.current);
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }
    disconnectStomp(stompClientRef.current);
  };

  // Timer
  useEffect(() => {
    if (!isStarted || timeLeft === null) return;

    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(interval);
          handleFinalSubmit(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isStarted]);

  // Fullscreen enforcement
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      if (!isStarted) return; // Don't log violations before start
      if (!isFull && !submitting) {
        // Only trigger overlay if not currently requesting screen share
        // Screen share popups can cause temporary focus loss
        if (screenShareStatus !== 'requesting') {
          setIsFullscreen(false);
          toast.error('FULLSCREEN EXIT DETECTED!');
          examAPI.logViolation({
            sessionId: parseInt(sessionId),
            violationType: 'FULLSCREEN_EXIT',
            severity: 'HIGH',
            description: 'Candidate exited full-screen mode'
          }).catch(err => console.error('Failed to log fullscreen violation:', err));
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [sessionId, submitting]);

  // Sync activeTab with activeQuizIdx
  useEffect(() => {
    // Only auto-sync if we are NOT on the coding tab, to avoid forcefully switching away from coding
    if (activeTab !== 'coding' && exam?.quizQuestions?.[activeQuizIdx]) {
      const q = exam.quizQuestions[activeQuizIdx];
      const section = q.sectionName || 'General';
      if (activeTab !== section) {
        setActiveTab(section);
      }
    }
  }, [activeQuizIdx, exam]);

  // Connectivity monitoring
  useEffect(() => {
    if (!isOnline || netStatus === 'Poor') {
      if (!connTimerRef.current) {
        connTimerRef.current = setTimeout(() => {
          setShowConnOverlay(true);
        }, 15000); // Show overlay after 15 seconds of poor/offline status
      }
    } else {
      if (connTimerRef.current) {
        clearTimeout(connTimerRef.current);
        connTimerRef.current = null;
      }
      setShowConnOverlay(false);
    }
    return () => {
      if (connTimerRef.current) clearTimeout(connTimerRef.current);
    };
  }, [isOnline, netStatus]);

  const enterFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch (err) {
      toast.error('Failed to enter full-screen. Please try again.');
    }
  };

  const handleStartSecureSession = async () => {
    setSubmitting(true); // Temporary loading state for the button
    try {
      // 1. Fullscreen
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      }

      // 2. Screen Share
      await startScreenShare();

      setIsStarted(true);
      toast.success('Secure session initialized. You may begin.');

      // Play welcome audio once
      if (!welcomeAudioPlayed) {
        const welcomeText = "Welcome to your proctored assessment. Please ensure you stay in full-screen mode and follow all instructions. Good luck!";
        try {
          const response = await fetch(`${process.env.REACT_APP_AI_URL || 'http://localhost:5000'}/generate-audio`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: welcomeText })
          });
          if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            setActiveAudio(audio);
            audio.play();
            setWelcomeAudioPlayed(true);
          }
        } catch (e) {
          console.warn('Welcome audio failed:', e);
        }
      }
    } catch (err) {
      console.error('Setup failed:', err);
      toast.error('Initialization failed. Please grant all permissions.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleQuizAnswer = async (questionId, option) => {
    setQuizAnswers(prev => ({ ...prev, [questionId]: option }));
    try {
      await examAPI.submitQuizAnswer({ sessionId: parseInt(sessionId), questionId, selectedOption: option });
    } catch {
      toast.error('Failed to save answer');
    }
  };

  const handleFinalSubmit = async (autoSubmit = false) => {
    if (!autoSubmit && !window.confirm('Are you sure you want to submit the exam?')) return;
    setSubmitting(true);
    stopScreenShare(); // Stop streaming on submit
    try {
      await examAPI.finalSubmit(parseInt(sessionId));
      sessionStorage.removeItem('examData');
      navigate('/exam/complete', { state: { autoSubmit } });
    } catch {
      toast.error('Submission failed. Trying again...');
      setSubmitting(false);
    }
  };

  const handleViolation = useCallback((v) => {
    const violationWithTime = {
      ...v,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setViolations(prev => [...prev.slice(-9), violationWithTime]);
  }, []);

  const toggleFlag = (questionId) => {
    setFlaggedQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const startAudioPlayback = (q) => {
    if (activeAudio) activeAudio.pause();
    const audio = new Audio(q.audioBase64);
    setActiveAudio(audio);
    audio.play();
    audio.onended = () => {
      setAudioPlayed(prev => ({ ...prev, [q.id]: true }));
      setActiveAudio(null);
    };
  };

  const speakText = (text) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  if (!exam) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
    </div>
  );

  const handleTriggerMcqClarity = async () => {
    if (!exam?.quizQuestions || exam.quizQuestions.length === 0) return;

    setIsGeneratingClarity(true);
    try {
      // Helper to get correct answer text
      const getCorrectOptionText = (q) => {
        switch (q.correctOption?.toUpperCase()) {
          case 'A': return q.optionA;
          case 'B': return q.optionB;
          case 'C': return q.optionC;
          case 'D': return q.optionD;
          default: return '';
        }
      };

      // Pick 3 random quiz questions
      const shuffled = [...exam.quizQuestions].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, Math.min(3, shuffled.length));

      const oralQuestions = await Promise.all(selected.map(async (q, i) => {
        try {
          const correctText = getCorrectOptionText(q);
          const res = await aiService.generateClarity({ 
            context: q.question, 
            correctAnswer: correctText,
            type: 'mcq' 
          });
          
          return {
            id: 500 + i,
            questionText: res.data.question,
            topic: res.data.keywords ? res.data.keywords.join(', ') : (q.topic || 'General'),
            type: 'mcq'
          };
        } catch (err) {
          console.error("Failed to generate MCQ clarity", err);
          return {
            id: 500 + i,
            questionText: `Explain the concept of "${q.topic || 'this question'}" in your own words.`,
            topic: q.topic || 'General',
            type: 'mcq'
          };
        }
      }));

      setMcqClarityQuestions(oralQuestions);
      setActiveMcqClarityIdx(0);
    } finally {
      setIsGeneratingClarity(false);
    }
  };

  const timerWarning = timeLeft < 300; // < 5 minutes
  const timerDanger = timeLeft < 60;

  const getQuizSections = () => {
    if (!exam?.quizQuestions) return {};
    return exam.quizQuestions.reduce((acc, q) => {
      const section = q.sectionName || 'General';
      if (!acc[section]) acc[section] = [];
      acc[section].push(q);
      return acc;
    }, {});
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden select-none text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Pre-Start Setup Overlay */}
      {!isStarted && (
        <div className="fixed inset-0 z-[11000] bg-white flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-xl w-full space-y-12 animate-in fade-in zoom-in duration-700">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-blue-500/30">
                <ShieldCheck size={40} />
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Integrity Setup</h1>
              <p className="text-slate-500 text-lg font-medium leading-relaxed">
                To ensure a fair testing environment, this assessment requires <span className="text-blue-600 font-bold">Full-Screen Mode</span> and <span className="text-blue-600 font-bold">Active Screen Sharing</span>.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              {[
                { icon: ShieldCheck, title: "Secure Browser", desc: "Locks navigation and prevents tab switching." },
                { icon: Send, title: "Live Streaming", desc: "Safe, encrypted proctoring of your screen." },
              ].map((item, i) => (
                <div key={i} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-blue-600 mb-2">
                    <item.icon size={18} />
                  </div>
                  <h3 className="font-black text-xs uppercase tracking-widest text-slate-800">{item.title}</h3>
                  <p className="text-[11px] text-slate-500 font-bold leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="pt-6">
              <button
                onClick={handleStartSecureSession}
                disabled={submitting}
                className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-white text-xl font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-2xl shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-4 group"
              >
                {submitting ? 'Initializing...' : <>Start Secure Session <ChevronRight className="group-hover:translate-x-1 transition-transform" /></>}
              </button>
              <p className="mt-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                System: Ready • Latency: {netStatus}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top bar - Refined 3-zone layout */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between z-10">
        {/* Zone 1: Branding */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <ShieldCheck size={18} />
          </div>
          <span className="font-black text-lg tracking-tight text-slate-800">Proctor<span className="text-blue-600">AI</span></span>
        </div>

        {/* Zone 2: Navigation & Timer */}
        <div className="flex items-center gap-2">
          {/* Screen Share Status Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 mr-2">
            <div className={`w-1.5 h-1.5 rounded-full ${screenShareStatus === 'active' ? 'bg-emerald-500 animate-pulse' : screenShareStatus === 'denied' ? 'bg-rose-500' : 'bg-amber-400'}`} />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
              Screen: {screenShareStatus}
            </span>
            {screenShareStatus === 'denied' && (
              <button
                onClick={() => { hasAttemptedScreenShareRef.current = false; startScreenShare(); }}
                className="ml-1 text-blue-600 hover:text-blue-800 transition-colors"
                title="Retry Screen Share"
              >
                <RefreshCw size={10} />
              </button>
            )}
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl items-center gap-1 border border-slate-200">
            {exam.codingQuestions?.length > 0 && (
              <button
                onClick={() => allQuizAnswered ? setActiveTab('coding') : toast.error('Complete quiz first')}
                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'coding' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Coding ({exam.codingQuestions.length})
              </button>
            )}
            {Object.entries(getQuizSections()).map(([sectionName, questions]) => (
              <button
                key={sectionName}
                onClick={() => {
                  setActiveTab(sectionName);
                  const firstIdx = exam.quizQuestions.indexOf(questions[0]);
                  if (firstIdx !== -1) setActiveQuizIdx(firstIdx);
                }}
                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === sectionName ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {sectionName} ({questions.length})
              </button>
            ))}
          </div>

          <div className={`flex items-center gap-4 px-5 py-2.5 rounded-xl border-2 transition-all ${timerDanger ? 'bg-red-50 border-red-200 animate-pulse' : 'bg-slate-50 border-slate-200'}`}>
            <div className={`flex items-center gap-2 font-mono font-bold text-sm ${timerDanger ? 'text-red-600' : 'text-slate-700'}`}>
              <Clock size={16} />
              <span className="tabular-nums">{formatTime(timeLeft)}</span>
            </div>
            <div className="w-px h-4 bg-slate-300" />
            <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-lg border border-green-100">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Excellent — 183ms avg</span>
            </div>
          </div>
        </div>

        {/* Zone 3: Submit Action */}
        <button
          onClick={() => handleFinalSubmit(false)}
          disabled={submitting}
          className="bg-slate-900 hover:bg-black text-white px-8 py-3 rounded-xl font-black text-[11px] uppercase tracking-[0.15em] transition-all active:scale-95 shadow-xl shadow-slate-900/10 flex items-center gap-2"
        >
          {submitting ? 'Submitting...' : <>Submit Assessment <CheckCircle size={14} /></>}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: QUESTION MAP */}
        {activeTab !== 'coding' && (
          <div className="w-[320px] bg-[#222222] border-r border-white/5 flex flex-col p-6 text-white/90">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-6">Question Map</h3>

            <div className="grid grid-cols-5 gap-2 mb-8">
              {(getQuizSections()[activeTab] || []).map((sq, i) => {
                const globalIdx = exam.quizQuestions.indexOf(sq);
                const isCurrent = globalIdx === activeQuizIdx;
                const isAnswered = !!quizAnswers[sq.id];
                const isFlagged = flaggedQuestions[sq.id];

                return (
                  <button
                    key={globalIdx}
                    onClick={() => setActiveQuizIdx(globalIdx)}
                    className={`aspect-square rounded-lg text-xs font-black transition-all flex items-center justify-center border-2 
                      ${isCurrent ? 'bg-blue-600 border-blue-400 text-white' :
                        isFlagged ? 'bg-amber-500 border-amber-300 text-white' :
                          isAnswered ? 'bg-emerald-600 border-emerald-400 text-white' :
                            'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>

            <div className="space-y-3 mb-10 pt-6 border-t border-white/5">
              {[
                { color: 'bg-blue-600', label: 'Current' },
                { color: 'bg-emerald-600', label: 'Answered' },
                { color: 'bg-amber-500', label: 'Flagged for review' },
                { color: 'bg-white/10', label: 'Not attempted', border: 'border-white/10' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-md ${item.color} ${item.border || ''}`} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">{item.label}</span>
                </div>
              ))}
            </div>

            <div className="mt-auto space-y-1">
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Section progress</span>
                <span className="text-[10px] font-black text-white/80">
                  {`${(getQuizSections()[activeTab] || []).filter(q => quizAnswers[q.id]).length} / ${(getQuizSections()[activeTab] || []).length}`}
                </span>
              </div>
              {[
                { label: 'Mark value', value: `+${exam.quizQuestions[activeQuizIdx]?.marks || 0} per correct` },
                { label: 'Time goal', value: '45s per Q' },
                { label: 'Flagged', value: Object.values(flaggedQuestions).filter(Boolean).length },
                { label: 'Remaining', value: `${(getQuizSections()[activeTab] || []).length - (getQuizSections()[activeTab] || []).filter(q => quizAnswers[q.id]).length} questions` },
              ].map(stat => (
                <div key={stat.label} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">{stat.label}</span>
                  <span className="text-[10px] font-black text-white/80">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === 'coding' && exam.codingQuestions?.length > 0 ? (
          <div className="flex-1 flex overflow-hidden">
            {/* Left: Coding Question & Nav */}
            <div className="w-1/3 bg-white border-r border-border-light flex flex-col overflow-hidden">
              <div className="px-6 py-6 border-b border-border-light flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Coding Tasks</h3>
                  <div className="flex gap-1.5">
                    <button onClick={() => setActiveCodingIdx(Math.max(0, activeCodingIdx - 1))}
                      disabled={activeCodingIdx === 0}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-500 hover:text-slate-900 border border-border-light transition-all"><ChevronLeft size={16} /></button>
                    <button onClick={() => setActiveCodingIdx(Math.min(exam.codingQuestions.length - 1, activeCodingIdx + 1))}
                      disabled={activeCodingIdx === exam.codingQuestions.length - 1}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-500 hover:text-slate-900 border border-border-light transition-all"><ChevronRight size={16} /></button>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {exam.codingQuestions.map((_, i) => (
                    <button key={i} onClick={() => setActiveCodingIdx(i)}
                      className={`w-10 h-10 rounded-xl text-xs font-bold transition-all border ${i === activeCodingIdx ? 'bg-primary text-white shadow-md border-primary' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border-border-light'}`}>
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-slate-900 font-bold text-2xl tracking-tight">
                      Q{activeCodingIdx + 1}. {exam.codingQuestions[activeCodingIdx].title}
                    </h2>
                    <button
                      onClick={() => speakText(`${exam.codingQuestions[activeCodingIdx].title}. ${exam.codingQuestions[activeCodingIdx].description}`)}
                      className="p-2 bg-primary/5 text-primary hover:bg-primary/10 rounded-xl transition-all border border-primary/20"
                      title="Listen to Question"
                    >
                      <Volume2 size={18} />
                    </button>
                  </div>
                  <p className="text-slate-600 leading-relaxed font-medium">
                    {exam.codingQuestions[activeCodingIdx].description}
                  </p>
                </div>

                {exam.codingQuestions[activeCodingIdx].sampleInput && (
                  <div className="space-y-3">
                    <h3 className="text-blue-400 font-black text-[10px] uppercase tracking-widest">Sample Input</h3>
                    <pre className="bg-slate-50 border border-border-light rounded-xl p-5 font-mono text-xs text-slate-600">
                      {exam.codingQuestions[activeCodingIdx].sampleInput}
                    </pre>
                  </div>
                )}

                <div className="pt-6 border-t border-border-light text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-4">
                  <span>Marks: {exam.codingQuestions[activeCodingIdx].marks}</span>
                  <span>Limit: {exam.codingQuestions[activeCodingIdx].timeLimitSeconds}s</span>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col min-w-0">
              <CodeEditor
                question={exam.codingQuestions[activeCodingIdx]}
                sessionId={parseInt(sessionId)}
                clarityCheckEnabled={exam.clarityCheckEnabled}
                exam={exam}
              />
            </div>
          </div>
        ) : activeTab !== 'coding' && exam.quizQuestions?.length > 0 ? (
          <div className="flex-1 bg-white overflow-hidden flex flex-col">
            {exam.quizQuestions?.[activeQuizIdx] && (() => {
              const q = exam.quizQuestions[activeQuizIdx];
              const selected = quizAnswers[q.id];
              const isFlagged = flaggedQuestions[q.id];
              const sectionQuestions = getQuizSections()[q.sectionName || 'General'] || [];
              const localIdx = sectionQuestions.indexOf(q);

              const isAudioRequired = false; // Disabled per user request
              const hasAudioPlayed = true; // Always unlocked
              const isOptionsDisabled = false; // Never disabled

              return (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Header Area */}
                  <div className="px-10 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                      <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100">{q.sectionName || 'General'}</span>
                      <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Question {localIdx + 1} of {sectionQuestions.length}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Info size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Mark: +{q.marks}</span>
                      </div>
                    </div>
                  </div>

                  {/* Question Content */}
                  <div className="flex-1 overflow-y-auto p-10 lg:p-16">
                    <div className="max-w-3xl mx-auto space-y-12">
                      <div className="flex items-start gap-4 mb-4">
                        <h2 className="text-slate-900 text-3xl font-bold leading-tight tracking-tight flex-1 transition-all duration-300">
                          {q.question}
                        </h2>
                      </div>

                      <div className="space-y-4">
                        {['A', 'B', 'C', 'D'].map(opt => (
                          <button
                            key={opt}
                            disabled={isOptionsDisabled}
                            onClick={() => handleQuizAnswer(q.id, opt)}
                            className={`w-full group flex items-center gap-6 p-5 rounded-2xl border-2 transition-all duration-300 ${isOptionsDisabled ? 'opacity-40 cursor-not-allowed bg-slate-50' : selected === opt ? 'bg-blue-50 border-blue-600 shadow-lg shadow-blue-500/5' : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50'}`}
                          >
                            <span className={`flex items-center justify-center w-10 h-10 rounded-xl font-bold text-base transition-all duration-300 ${isOptionsDisabled ? 'bg-slate-200 text-slate-400' : selected === opt ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                              {opt}
                            </span>
                            <span className={`font-bold tracking-tight text-lg ${selected === opt ? 'text-blue-900' : 'text-slate-700'}`}>
                              {q[`option${opt}`]}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Navigation Footer */}
                  <div className="px-10 py-6 border-t border-slate-100 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setActiveQuizIdx(Math.max(0, activeQuizIdx - 1))}
                        disabled={activeQuizIdx === 0}
                        className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 transition-all flex items-center gap-2"
                      >
                        <ChevronLeft size={16} /> Previous
                      </button>
                      <button
                        onClick={() => toggleFlag(q.id)}
                        className={`px-6 py-3 rounded-xl border transition-all text-[11px] font-black uppercase tracking-widest flex items-center gap-2 ${isFlagged ? 'bg-amber-50 border-amber-200 text-amber-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                      >
                        <Flag size={14} fill={isFlagged ? 'currentColor' : 'none'} /> {isFlagged ? 'Flagged' : 'Flag for review'}
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        const isLastInSection = localIdx === sectionQuestions.length - 1;
                        if (isLastInSection) {
                          const sections = Object.keys(getQuizSections());
                          const currentSectionIdx = sections.indexOf(q.sectionName || 'General');
                          if (currentSectionIdx < sections.length - 1) {
                            const nextSectionName = sections[currentSectionIdx + 1];
                            setActiveTab(nextSectionName);
                            const nextSectionQuestions = getQuizSections()[nextSectionName];
                            const globalIdx = exam.quizQuestions.indexOf(nextSectionQuestions[0]);
                            setActiveQuizIdx(globalIdx);
                            toast.success(`Section ${q.sectionName || 'General'} completed!`);
                          } else {
                            if (exam.clarityCheckEnabled) {
                              handleTriggerMcqClarity();
                            } else if (exam.codingQuestions?.length > 0) {
                              setActiveTab('coding');
                            } else {
                              handleFinalSubmit();
                            }
                            toast.success(`Section ${q.sectionName || 'General'} completed!`);
                          }
                        } else {
                          setActiveQuizIdx(activeQuizIdx + 1);
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-blue-500/10 flex items-center gap-2 active:scale-95 transition-all"
                    >
                      {localIdx === sectionQuestions.length - 1 ? (
                        (Object.keys(getQuizSections()).indexOf(q.sectionName || 'General') < Object.keys(getQuizSections()).length - 1) ?
                          <>Next Section <ChevronRight size={16} /></> :
                          <>Finish Quiz <CheckCircle size={16} /></>
                      ) : (
                        <>Save & Next <ChevronRight size={16} /></>
                      )}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : activeTab === 'coding' && (!exam.codingQuestions || exam.codingQuestions.length === 0) ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-white text-blue-500">
            <AlertTriangle size={64} className="mx-auto mb-4 opacity-10" />
            <p className="font-black uppercase tracking-widest text-sm">No coding questions available.</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-white text-blue-500">
            <HelpCircle size={64} className="mx-auto mb-4 opacity-10" />
            <p className="font-black uppercase tracking-widest text-sm">Select a question from the navigation panel.</p>
          </div>
        )}

        {/* RIGHT PANEL: SECURITY & SIDEBAR */}
        <div className="w-[360px] bg-white border-l border-slate-200 flex flex-col overflow-y-auto">
          {/* Section 1: Camera Feed */}
          <div className="p-6 border-b border-slate-100">
            {isStarted && (
              <ProctoringMonitor 
                sessionId={parseInt(sessionId)} 
                onViolation={handleViolation} 
                submitting={submitting}
              />
            )}
            {!isStarted && (
              <div className="aspect-video bg-slate-900 rounded-2xl flex flex-col items-center justify-center border border-white/5 gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-700" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Camera Standby</span>
              </div>
            )}
          </div>

          {/* Section 2: Monitoring Status */}
          <div className="p-6 border-b border-slate-100 space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Monitoring Status</h3>
            <div className="space-y-3">
              {[
                { label: 'Face detection', status: 'Active', color: 'bg-emerald-500' },
                { label: 'Tab switch monitoring', status: 'Active', color: 'bg-emerald-500' },
                { label: 'Browser focus', status: isFullscreen ? 'Active' : 'Lost focus', color: isFullscreen ? 'bg-emerald-500' : 'bg-rose-500' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between text-[11px] font-bold">
                  <div className="flex items-center gap-2 text-slate-600">
                    <CheckCircle size={14} className={item.color.replace('bg-', 'text-')} />
                    {item.label}
                  </div>
                  <span className={`${item.color} text-white px-2 py-0.5 rounded text-[9px] uppercase font-black`}>{item.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Violations Log */}
          <div className="p-6 border-b border-slate-100 flex-1 min-h-0 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Violations</h3>
              <span className="bg-rose-50 text-rose-600 px-2 py-0.5 rounded text-[9px] font-black border border-rose-100">{violations.length} detected</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {violations.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30 text-slate-400">
                  <ShieldCheck size={32} />
                  <p className="text-[9px] font-bold uppercase tracking-widest mt-2">No violations recorded</p>
                </div>
              ) : (
                violations.map((v, i) => (
                  <div key={i} className="flex gap-3 py-3 border-b border-slate-50 last:border-0 group animate-in slide-in-from-right-4 duration-300">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-rose-50 group-hover:text-rose-500 transition-colors">
                      <AlertTriangle size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-0.5">
                        <p className="text-[11px] font-bold text-slate-800 leading-none">{v.type.replace(/_/g, ' ')}</p>
                        <span className="text-[9px] font-medium text-slate-400">{v.time}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate">{v.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section 4: Progress */}
          <div className="p-6 bg-slate-50/50">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Overall Progress</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] font-bold text-slate-700">Quiz units</span>
                  <span className="text-[11px] font-black text-slate-900 tabular-nums">{Object.keys(quizAnswers).length} / {exam.quizQuestions?.length || 0}</span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full transition-all duration-1000" style={{ width: `${(Object.keys(quizAnswers).length / (exam.quizQuestions?.length || 1)) * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] font-bold text-slate-700">Code units</span>
                  <span className="text-[11px] font-black text-slate-900 tabular-nums">{exam.codingQuestions?.length > 0 ? '1 Active' : 'None'}</span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
            </div>
          </div>
          {/* Section 5: Finish Action */}
          <div className="p-6 border-t border-slate-100">
            <button
              onClick={() => {
                if (exam.clarityCheckEnabled && mcqClarityQuestions.length === 0 && exam.quizQuestions?.length > 0) {
                  console.log("Triggering MCQ Clarity Check...");
                  handleTriggerMcqClarity();
                } else {
                  handleFinalSubmit();
                }
              }}
              disabled={submitting}
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {submitting ? (
                <>Submitting... <RefreshCw size={16} className="animate-spin" /></>
              ) : (
                <>Finish Examination <CheckCircle size={16} /></>
              )}
            </button>
            <p className="text-[9px] font-bold text-slate-400 mt-4 text-center leading-relaxed">
              Ensure all attempts are saved before final submission.
              Review your progress bars above.
            </p>
          </div>
        </div>
      </div>

      {/* MCQ Clarity Check Layer */}
      {activeMcqClarityIdx !== -1 && mcqClarityQuestions[activeMcqClarityIdx] && (
        <MicroOralLayer
          question={mcqClarityQuestions[activeMcqClarityIdx]}
          onSubmission={async (transcript) => {
            console.log("ExamRoom onSubmission triggered with transcript:", transcript);
            try {
              const payload = {
                sessionId: parseInt(sessionId),
                questionText: mcqClarityQuestions[activeMcqClarityIdx].questionText,
                topic: mcqClarityQuestions[activeMcqClarityIdx].topic,
                transcript,
              };
              console.log("Submitting MCQ Oral Answer payload:", payload);
              await examAPI.submitOralAnswer(payload);
              console.log("MCQ Oral Answer submitted successfully");

              if (activeMcqClarityIdx < mcqClarityQuestions.length - 1) {
                setActiveMcqClarityIdx(prev => prev + 1);
              } else {
                setActiveMcqClarityIdx(-1);
                toast.success("MCQ Clarity Check completed!");
                if (exam.codingQuestions?.length > 0 && allQuizAnswered) {
                  setActiveTab('coding');
                }
              }
            } catch (err) {
              toast.error("Failed to submit oral answer");
            }
          }}
          onClose={() => {
            setActiveMcqClarityIdx(-1);
            if (exam.codingQuestions?.length > 0 && allQuizAnswered) {
              setActiveTab('coding');
            }
          }}
        />
      )}

      {isGeneratingClarity && (
        <div className="fixed inset-0 z-[13000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4">
            <RefreshCw size={40} className="text-primary animate-spin" />
            <p className="text-slate-900 font-bold italic">AI is preparing your Clarity Check questions...</p>
          </div>
        </div>
      )}

      {/* Fullscreen Warning Overlay */}
      {!isFullscreen && (
        <div className="fixed inset-0 z-[9999] bg-white/95 backdrop-blur-xl flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-red-950/50 rounded-full flex items-center justify-center mx-auto border-4 border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
              <AlertTriangle size={48} className="text-red-500 animate-bounce" />
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Security Alert</h2>
              <p className="text-blue-600 text-sm leading-relaxed font-bold">
                Exiting full-screen is a serious proctoring violation.
                Your activity has been flagged. Return to full-screen mode immediately to prevent automatic disqualification.
              </p>
            </div>

            <button
              onClick={enterFullscreen}
              className="w-full py-5 bg-white hover:bg-blue-50 text-blue-950 text-lg font-black uppercase tracking-widest rounded-2xl transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3"
            >
              Resume Examination
            </button>

            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">
              Log Ref: {sessionId} • Violation strictly recorded
            </p>
          </div>
        </div>
      )}

      {/* Connectivity Warning Overlay */}
      {showConnOverlay && (
        <div className="fixed inset-0 z-[10000] bg-white/95 backdrop-blur-2xl flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-amber-950/50 rounded-[2rem] flex items-center justify-center mx-auto border-4 border-amber-500/30 shadow-[0_0_60px_rgba(245,158,11,0.2)]">
              <WifiOff size={48} className="text-amber-500 animate-pulse" />
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Connection Lost</h2>
              <p className="text-blue-600 text-sm leading-relaxed font-bold">
                Your internet connection has become unstable.
                Exam activity is paused to prevent data loss.
                Please stabilize your connection to resume the session.
              </p>
            </div>

            <div className="bg-blue-50/50 border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center justify-center gap-4">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                <span className="text-xs font-black text-white uppercase tracking-[0.2em]">Retrying secure link...</span>
              </div>
            </div>

            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">
              System will auto-resume upon reconnection
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

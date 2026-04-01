import React, { useState, useEffect, useRef } from 'react';
import { Camera, Mic, Volume2, CheckCircle, AlertCircle, Play, Settings, ShieldCheck, ChevronRight, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useConnectivity } from '../../hooks/useConnectivity';

const DeviceCheck = ({ onComplete }) => {
    const { isOnline, status: netStatus, latency } = useConnectivity();
    const [step, setStep] = useState(1);
    const [mediaStream, setMediaStream] = useState(null);
    const [cameraStatus, setCameraStatus] = useState('idle'); // idle, checking, success, error, liveness_check
    const [micStatus, setMicStatus] = useState('idle');
    const [speakerStatus, setSpeakerStatus] = useState('idle');
    const [audioLevel, setAudioLevel] = useState(0);
    const videoRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const animationFrameRef = useRef(null);
    const canvasRef = useRef(null);

    const steps = [
        { id: 1, title: 'Introduction', icon: ShieldCheck },
        { id: 2, title: 'Camera', icon: Camera },
        { id: 3, title: 'Microphone', icon: Mic },
        { id: 4, title: 'Speaker', icon: Volume2 },
        { id: 5, title: 'Network', icon: Wifi },
        { id: 6, title: 'Ready', icon: CheckCircle },
    ];

    useEffect(() => {
        if (cameraStatus === 'liveness_check') {
            const timer = setTimeout(async () => {
                if (videoRef.current && canvasRef.current) {
                    try {
                        const video = videoRef.current;
                        const canvas = canvasRef.current;
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                        const base64Image = canvas.toDataURL('image/jpeg', 0.8);

                        const response = await fetch('http://127.0.0.1:5000/analyze', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ image: base64Image, sessionId: 'device-check' })
                        });

                        if (!response.ok) {
                            throw new Error(`AI Backend responded with status: ${response.status}`);
                        }

                        const result = await response.json();
                        if (result.face_count === 1) {
                            setCameraStatus('success');
                        } else {
                            setCameraStatus('error');
                        }
                    } catch (err) {
                        setCameraStatus('error');
                    }
                }
            }, 2500);

            return () => clearTimeout(timer);
        }
    }, [cameraStatus]);

    useEffect(() => {
        return () => {
            stopMedia();
        };
    }, []);

    const stopMedia = () => {
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
        }
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
    };

    const startCamera = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setCameraStatus('error');
            return;
        }
        setCameraStatus('checking');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720, facingMode: 'user' }
            });
            setMediaStream(stream);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setCameraStatus('liveness_check');
        } catch (err) {
            setCameraStatus('error');
        }
    };

    const startMic = async () => {
        setMicStatus('checking');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setMediaStream(stream);

            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            analyserRef.current = audioContextRef.current.createMediaStreamSource(stream);
            const analyser = audioContextRef.current.createAnalyser();
            analyser.fftSize = 256;
            analyserRef.current.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const updateLevel = () => {
                analyser.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
                setAudioLevel(average * 2);
                animationFrameRef.current = requestAnimationFrame(updateLevel);
                if (average > 5) setMicStatus('success');
            };
            updateLevel();
        } catch (err) {
            setMicStatus('error');
        }
    };

    const testSpeaker = () => {
        setSpeakerStatus('checking');
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(err => {
            setSpeakerStatus('error');
        });
    };

    const handleNext = () => {
        if (step === 2 && cameraStatus !== 'success') return;
        if (step === 3 && micStatus !== 'success') return;
        if (step === 4 && speakerStatus !== 'success') return;
        if (step === 5 && (!isOnline || netStatus === 'Poor')) return;

        if (step < 6) {
            stopMedia();
            setStep(step + 1);
        } else {
            onComplete();
        }
    };

    const renderProgress = () => (
        <div className="flex items-center justify-between mb-12 px-2">
            {steps.map((s, i) => (
                <div key={s.id} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center relative">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${step >= s.id ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110' : 'bg-primary-light text-primary/40'}`}>
                            <s.icon size={20} strokeWidth={step >= s.id ? 2.5 : 2} />
                        </div>
                        <span className={`absolute -bottom-8 text-[9px] font-bold uppercase tracking-widest whitespace-nowrap ${step >= s.id ? 'text-slate-900 font-black' : 'text-slate-300'}`}>
                            {s.title}
                        </span>
                    </div>
                    {i < steps.length - 1 && (
                        <div className={`h-1 flex-1 mx-3 rounded-full transition-all duration-700 ${step > s.id ? 'bg-primary/20' : 'bg-slate-100'}`} />
                    )}
                </div>
            ))}
        </div>
    );

    return (
        <div className="w-full max-w-2xl mx-auto overflow-hidden animate-in fade-in zoom-in-95 duration-500 bg-white border border-slate-100 shadow-2xl shadow-slate-200/50 rounded-[40px]">
            <div className="p-10">
                <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-light rounded-2xl flex items-center justify-center text-primary shadow-sm">
                        <Settings size={28} />
                    </div>
                    Calibration
                </h2>
                <p className="text-slate-500 font-medium mb-12 text-sm tracking-wide">Optimization of hardware for secure evaluation.</p>

                {renderProgress()}

                <div className="min-h-[360px] flex flex-col items-center justify-center p-8 bg-slate-50/50 rounded-[32px] border border-slate-100 mb-10 relative overflow-hidden group">
                    {step === 1 && (
                        <div className="text-center max-w-sm fade-in">
                            <div className="w-24 h-24 bg-white rounded-[32px] shadow-xl shadow-slate-200/50 flex items-center justify-center mx-auto mb-10 text-primary border border-slate-50 group-hover:scale-105 transition-transform duration-500">
                                <ShieldCheck size={48} />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">Security Check</h3>
                            <p className="text-slate-500 text-sm leading-relaxed mb-10">
                                To ensure fairness and integrity, we will verify your camera, microphone and connectivity.
                            </p>
                            <button onClick={() => setStep(2)} className="btn-primary !px-10 !py-4 !rounded-2xl !text-[11px] flex items-center gap-3 mx-auto !shadow-lg !shadow-primary/20">
                                Start Calibration <ChevronRight size={18} />
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="w-full text-center fade-in">
                            <div className="relative w-full aspect-video bg-slate-200 rounded-[24px] overflow-hidden shadow-2xl mb-8 border-4 border-white">
                                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                                <canvas ref={canvasRef} className="hidden" />

                                {cameraStatus !== 'success' && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 text-white z-30 backdrop-blur-sm">
                                        {cameraStatus === 'idle' && (
                                            <div className="flex flex-col items-center gap-6 px-8 text-center">
                                                <div className="w-20 h-20 bg-white/10 rounded-[32px] flex items-center justify-center text-white/50 border border-white/10">
                                                    <Camera size={40} />
                                                </div>
                                                <p className="text-[10px] font-bold text-white uppercase tracking-widest leading-relaxed">Awaiting camera permission feedback.</p>
                                                <button onClick={startCamera} className="bg-white text-slate-900 px-8 py-3 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-slate-100 transition-all active:scale-95">
                                                    Grant Access
                                                </button>
                                            </div>
                                        )}
                                        {cameraStatus === 'checking' && (
                                            <div className="flex flex-col items-center gap-4">
                                                <RefreshCw className="animate-spin text-primary-light" size={40} />
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-white">Initializing...</span>
                                            </div>
                                        )}
                                        {cameraStatus === 'liveness_check' && (
                                            <div className="flex flex-col items-center gap-4 text-center">
                                                <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center text-white shadow-2xl animate-pulse">
                                                    <ShieldCheck size={32} />
                                                </div>
                                                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white">Analyzing Feed...</span>
                                            </div>
                                        )}
                                        {cameraStatus === 'error' && (
                                            <div className="flex flex-col items-center gap-6 px-8 text-center">
                                                <div className="w-20 h-20 bg-rose-500/20 rounded-[32px] flex items-center justify-center text-rose-500 border border-rose-500/20">
                                                    <AlertCircle size={40} />
                                                </div>
                                                <p className="text-[10px] font-bold text-rose-500 max-w-[200px] leading-relaxed uppercase tracking-widest">Feed access blocked or AI Offline.</p>
                                                <button onClick={startCamera} className="bg-white text-rose-500 px-8 py-3 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-rose-50 transition-all active:scale-95">
                                                    Retry Access
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {cameraStatus === 'success' && (
                                    <div className="absolute top-6 right-6 bg-slate-900/40 backdrop-blur-md text-white px-4 py-2 rounded-xl text-[10px] font-bold tracking-widest flex items-center gap-2 border border-white/10">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> FEED SECURED
                                    </div>
                                )}
                            </div>
                            {cameraStatus === 'success' && (
                                <div className="bg-emerald-50 text-emerald-700 p-5 rounded-2xl border border-emerald-100 flex items-center gap-4 justify-center mb-8 animate-in slide-in-from-bottom-2">
                                    <CheckCircle size={20} className="text-emerald-500" />
                                    <span className="font-bold text-[11px] uppercase tracking-widest">Biometric confirmation successful</span>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="w-full text-center fade-in">
                            <div className="w-28 h-28 bg-white rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-50 flex items-center justify-center mx-auto mb-10 text-primary relative group-hover:scale-105 transition-transform duration-500">
                                <Mic size={48} />
                                {micStatus === 'success' && (
                                    <div className="absolute -bottom-3 -right-3 bg-emerald-500 text-white p-3 rounded-2xl border-4 border-white shadow-lg animate-in zoom-in">
                                        <CheckCircle size={20} />
                                    </div>
                                )}
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">Audio Analysis</h3>
                            <p className="text-slate-500 text-sm mb-12 font-medium">Please speak clearly to calibrate your microphone.</p>

                            <div className="w-full max-w-sm mx-auto h-3 bg-slate-100 rounded-full overflow-hidden mb-12 border border-slate-200 relative">
                                <div
                                    className={`h-full transition-all duration-75 ${audioLevel > 10 ? 'bg-primary shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-primary-light'}`}
                                    style={{ width: `${Math.min(audioLevel, 100)}%` }}
                                />
                            </div>

                            {micStatus === 'idle' && (
                                <button onClick={startMic} className="btn-primary !px-10 !py-4 !rounded-2xl !text-[11px]">Initiate Mic Check</button>
                            )}
                            {micStatus === 'success' && (
                                <p className="text-emerald-600 font-bold flex items-center justify-center gap-3 text-xs uppercase tracking-widest">
                                    <CheckCircle size={18} /> Sensitivity Optimized
                                </p>
                            )}
                        </div>
                    )}

                    {step === 4 && (
                        <div className="w-full text-center fade-in">
                            <div className="w-28 h-28 bg-white rounded-[32px] shadow-xl shadow-slate-200/50 flex items-center justify-center mx-auto mb-10 text-primary border border-slate-50 group-hover:rotate-3 transition-transform duration-500">
                                <Volume2 size={48} />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">Speaker Test</h3>
                            <p className="text-slate-500 text-sm mb-12 font-medium">Verify you can hear critical proctoring alerts.</p>

                            <button
                                onClick={testSpeaker}
                                className={`flex items-center gap-4 px-10 py-5 rounded-2xl font-bold uppercase tracking-widest mx-auto transition-all text-[11px] shadow-xl ${speakerStatus === 'checking' ? 'bg-primary text-white' : 'bg-white border border-slate-200 text-slate-700 hover:border-primary hover:text-primary'}`}
                            >
                                <Play size={20} fill={speakerStatus === 'checking' ? 'white' : 'currentColor'} />
                                Play Test Signal
                            </button>

                            {speakerStatus === 'checking' && (
                                <div className="mt-12 flex flex-col items-center gap-6 animate-in slide-in-from-top-2">
                                    <p className="text-slate-600 font-bold text-xs uppercase tracking-widest">Did you hear the signal?</p>
                                    <div className="flex gap-4">
                                        <button onClick={() => setSpeakerStatus('success')} className="btn-primary !px-8 !py-3 !rounded-2xl !bg-emerald-500 !hover:bg-emerald-600 !text-[10px]">Yes, Heard It</button>
                                        <button onClick={() => setSpeakerStatus('error')} className="bg-white border border-slate-200 text-slate-500 px-8 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:border-rose-500 hover:text-rose-500 transition-colors">No Feed</button>
                                    </div>
                                </div>
                            )}
                            {speakerStatus === 'success' && (
                                <p className="mt-12 text-emerald-600 font-bold flex items-center justify-center gap-3 text-xs uppercase tracking-widest">
                                    <CheckCircle size={18} /> Output Verified
                                </p>
                            )}
                        </div>
                    )}

                    {step === 5 && (
                        <div className="w-full text-center fade-in">
                            <div className="w-28 h-28 bg-white rounded-[32px] shadow-xl shadow-slate-200/50 flex items-center justify-center mx-auto mb-10 text-primary border border-slate-50">
                                {isOnline ? <Wifi size={48} /> : <WifiOff size={48} />}
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">Connectivity</h3>
                            <p className="text-slate-500 text-sm mb-12 font-medium">Analyzing bandwidth for live monitoring stability.</p>

                            <div className="max-w-xs mx-auto space-y-4">
                                <div className={`p-6 rounded-[24px] border ${isOnline ? (netStatus === 'Poor' ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100') : 'bg-rose-50 border-rose-100'} transition-colors duration-500`}>
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Environment</span>
                                        <span className={`text-[9px] font-bold uppercase tracking-widest ${isOnline ? (netStatus === 'Poor' ? 'text-amber-600' : 'text-emerald-600') : 'text-rose-600'}`}>
                                            {isOnline ? netStatus : 'OFFLINE'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-3 h-3 rounded-full ${isOnline ? (netStatus === 'Poor' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500') : 'bg-rose-500'}`} />
                                        <span className="text-2xl font-bold text-slate-900 tabular-nums">{isOnline ? `${latency}ms` : '--'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 6 && (
                        <div className="text-center fade-in">
                            <div className="w-28 h-28 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-8 text-primary border border-primary/10">
                                <CheckCircle size={64} strokeWidth={1} />
                            </div>
                            <h3 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Hardware Ready</h3>
                            <p className="text-slate-500 text-sm mb-12 font-medium">Environment successfully optimized for assessment.</p>

                            <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                                {['Camera Feed', 'Audio Input', 'Audio Output', 'Network'].map(item => (
                                    <div key={item} className="p-4 bg-white rounded-2xl border border-slate-100 text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between">
                    <button
                        disabled={step === 1}
                        onClick={() => setStep(step - 1)}
                        className="text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-primary disabled:opacity-0 transition-colors px-6"
                    >
                        ← Back
                    </button>

                    {step > 1 && (
                        <button
                            onClick={handleNext}
                            disabled={
                                (step === 2 && cameraStatus !== 'success') ||
                                (step === 3 && micStatus !== 'success') ||
                                (step === 4 && speakerStatus !== 'success') ||
                                (step === 5 && (!isOnline || netStatus === 'Poor'))
                            }
                            className={`btn-primary !px-12 !py-4 !rounded-2xl !text-[10px] flex items-center gap-3 !shadow-lg !shadow-primary/20 ${((step === 2 && cameraStatus === 'success') ||
                                (step === 3 && micStatus === 'success') ||
                                (step === 4 && speakerStatus === 'success') ||
                                (step === 5 && isOnline && netStatus !== 'Poor') ||
                                step === 6)
                                ? ''
                                : '!bg-slate-100 !text-slate-400 !cursor-not-allowed !border-slate-200 !shadow-none'
                                }`}
                        >
                            {step === 6 ? 'Finalize' : 'Continue'}
                            <ChevronRight size={18} />
                        </button>
                    )}
                </div>
            </div>

            <style>{`
                .fade-in {
                    animation: fadeIn 0.4s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default DeviceCheck;

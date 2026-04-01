import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { examAPI } from '../../services/api';
import faceVerificationService from '../../services/faceVerification';
import { AlertTriangle, Camera, CameraOff, Smartphone, RefreshCw, ShieldCheck, UserCheck, UserX } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProctoringMonitor({ sessionId, onViolation, submitting }) {
  const webcamRef = useRef(null);
  const intervalRef = useRef(null);
  const faceCheckIntervalRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [lastViolation, setLastViolation] = useState(null);
  const [isFaceModelsLoaded, setIsFaceModelsLoaded] = useState(false);
  const [lastVerificationScore, setLastVerificationScore] = useState(null);
  const violationCountRef = useRef(0);

  // Tab switch detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        logViolation('TAB_SWITCH', 'HIGH', 'Candidate switched browser tab or minimized window');
      }
    };

    const handleBlur = () => {
      logViolation('WINDOW_BLUR', 'MEDIUM', 'Browser window lost focus');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [sessionId]);

  // Right-click prevention
  useEffect(() => {
    const prevent = (e) => e.preventDefault();
    document.addEventListener('contextmenu', prevent);
    return () => document.removeEventListener('contextmenu', prevent);
  }, []);

  // Keyboard shortcut prevention
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Block common copy/paste shortcuts and dev tools
      if ((e.ctrlKey && ['c', 'v', 'x', 'u', 'p'].includes(e.key.toLowerCase())) ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['i', 'j'].includes(e.key.toLowerCase()))) {
        e.preventDefault();
        logViolation('SHORTCUT_ATTEMPT', 'LOW', `Blocked keyboard shortcut: ${e.key}`);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sessionId]);

  const logViolation = useCallback(async (type, severity, description) => {
    violationCountRef.current++;
    setLastViolation({ type, severity, description, time: new Date() });

    if (onViolation) onViolation({ type, severity, description });

    if (type === 'PHONE_DETECTED') {
      toast.error(
        (t) => (
          <div className="flex items-center gap-3">
            <Smartphone className="text-red-500 w-8 h-8 animate-bounce" />
            <div>
              <p className="font-bold text-red-600 text-lg">PHONE DETECTED</p>
              <p className="text-sm">Mobile device detected in camera. Please put it away immediately!</p>
            </div>
          </div>
        ),
        {
          duration: 6000,
          style: {
            border: '2px solid #ef4444',
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            minWidth: '400px',
          },
        }
      );
    }

    try {
      // Capture screenshot if camera is active
      let screenshot = null;
      if (webcamRef.current) {
        screenshot = webcamRef.current.getScreenshot();
      }

      await examAPI.logViolation({
        sessionId,
        violationType: type,
        severity,
        description,
        screenshotBase64: screenshot,
        matchScore: extra.matchScore
      });
    } catch (err) {
      console.error('Failed to log violation:', err);
    }
  }, [sessionId, onViolation]);

  // Periodic frame analysis (simulated AI detection)
  useEffect(() => {
    const analyzeFrame = () => {
      if (!webcamRef.current) return;

      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) return;

      // Send to AI monitor backend
      fetch('http://127.0.0.1:5000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageSrc, sessionId })
      })
        .then(r => r.json())
        .then(result => {
          if (result.violations && result.violations.length > 0) {
            result.violations.forEach(v => {
              logViolation(v.type, v.severity, v.description);
            });
          }
        })
        .catch(() => {
          // AI monitor might not be running - that's OK in dev
        });
    };

    intervalRef.current = setInterval(analyzeFrame, 5000); // Every 5 seconds
    return () => clearInterval(intervalRef.current);
  }, [sessionId, logViolation]);

  const refreshCamera = () => {
    setCameraActive(false);
    // Force re-render of Webcam by toggling a key if needed, 
    // but react-webcam usually handles stream changes well if we just wait.
    toast.loading('Restarting camera...', { duration: 1000 });
  };

  // Continuous Face Verification Loop
  useEffect(() => {
    const examData = JSON.parse(sessionStorage.getItem('examData'));
    const refPhoto = examData?.referencePhoto;

    if (!refPhoto) {
       console.warn('No reference photo found for continuous verification.');
       return;
    }

    const initFaceAPI = async () => {
      try {
        await faceVerificationService.loadModels();
        await faceVerificationService.setReferencePhoto(refPhoto);
        setIsFaceModelsLoaded(true);
        
        // Start periodic check every 30 seconds
        faceCheckIntervalRef.current = setInterval(async () => {
          if (submitting) return; // Pause during submission to free up main thread
          
          if (webcamRef.current) {
            const screenshot = webcamRef.current.getScreenshot();
            if (screenshot) {
              const result = await faceVerificationService.verifyFace(screenshot);
              setLastVerificationScore(result.distance);

              if (result.error === 'NO_FACE') {
                 // Already handled by Multi-Face/No-Face detection in Python possibly, 
                 // but let's log it as a specific verification failure
                 logViolation('NO_FACE', 'HIGH', 'Verification failed: No face detected in frame');
              } else if (!result.match) {
                 logViolation('PERSON_MISMATCH', 'HIGH', `Identity mismatch detected: Confidence ${result.distance.toFixed(1)}%`, { matchScore: result.distance });
              }
            }
          }
        }, 60000); // Every minute instead of 30s to reduce CPU load
      } catch (err) {
        console.error('Failed to initialize face verification:', err);
      }
    };

    initFaceAPI();

    return () => {
      if (faceCheckIntervalRef.current) clearInterval(faceCheckIntervalRef.current);
    };
  }, [sessionId, logViolation]);

  return (
    <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl shadow-blue-900/20 group relative">
      {/* Webcam feed */}
      <div className="relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          screenshotQuality={0.7}
          width={1280}
          height={720}
          videoConstraints={{ width: 1280, height: 720, facingMode: 'user' }}
          onUserMedia={() => setCameraActive(true)}
          onUserMediaError={() => setCameraActive(false)}
          className={`w-full h-full object-cover transition-opacity duration-1000 ${cameraActive ? 'opacity-40' : 'opacity-0'}`}
        />

        {/* Circular Overlay Scanner */}
        {cameraActive && (
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-48 h-48 rounded-full border-2 border-white/20 flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full border-2 border-blue-500/50 animate-ping opacity-20" />
                <div className="w-40 h-40 rounded-full overflow-hidden border border-white/10">
                   <Webcam
                      audio={false}
                      screenshotFormat="image/jpeg"
                      width={640}
                      height={480}
                      videoConstraints={{ facingMode: 'user' }}
                      className="w-full h-full object-cover scale-150"
                   />
                </div>
                <div className="absolute -bottom-2 bg-blue-600 text-[8px] font-black px-2 py-0.5 rounded text-white uppercase tracking-[0.2em] shadow-lg">Focus Active</div>
             </div>
          </div>
        )}

        {!cameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
               <CameraOff size={24} className="text-blue-400 opacity-50" />
            </div>
            <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em] mb-4">Feed Suspended</p>
            <button
              onClick={refreshCamera}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-blue-600/20"
            >
              <RefreshCw size={10} /> Restart
            </button>
          </div>
        )}

        {cameraActive && (
          <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
            <div className="flex items-center gap-2 bg-rose-600 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse shadow-lg shadow-rose-600/30">
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
              Live
            </div>
            
            {/* Identity Status Badge */}
            <div className="transition-all duration-500">
               {isFaceModelsLoaded ? (
                  lastVerificationScore !== null ? (
                    lastVerificationScore < 0.6 ? (
                       <div className="flex items-center gap-1.5 bg-emerald-500/90 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-lg border border-emerald-400/20">
                          <UserCheck size={10} /> Identity Verified
                       </div>
                    ) : (
                       <div className="flex items-center gap-1.5 bg-rose-600 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-lg animate-bounce border border-rose-400/20">
                          <UserX size={10} /> ID Mismatch Alert
                       </div>
                    )
                  ) : (
                     <div className="flex items-center gap-1.5 bg-indigo-600/80 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-lg">
                        <RefreshCw size={10} className="animate-spin" /> Analyzing Identity...
                     </div>
                  )
               ) : (
                  <div className="flex items-center gap-1.5 bg-slate-800/80 backdrop-blur-md text-white/60 px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest">
                     <ShieldCheck size={10} /> Securing Feed...
                  </div>
               )}
            </div>
          </div>
        )}

        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/60 text-[8px] font-black uppercase tracking-widest">
              <ShieldCheck size={12} className="text-blue-500" />
              <span>AI Vigilance Active</span>
            </div>
        </div>
      </div>
    </div>
  );
}

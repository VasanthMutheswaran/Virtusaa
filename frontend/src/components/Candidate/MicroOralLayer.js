import React, { useState, useEffect, useRef } from 'react';
import { Mic, CheckCircle, Volume2, AlertCircle, RefreshCw, X, Play, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { examAPI, aiService } from '../../services/api';

/**
 * MicroOralLayer Component
 * Handles voice-to-text assessment for both MCQ and Coding Clarity checks.
 */
export default function MicroOralLayer({ question, onSubmission, onClose }) {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [liveTranscript, setLiveTranscript] = useState("");
    const [timeLeft, setTimeLeft] = useState(question.type === 'mcq' ? 10 : 20);
    const [playCount, setPlayCount] = useState(0);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [error, setError] = useState(null);
    const [hasStarted, setHasStarted] = useState(false);

    const recognitionRef = useRef(null);
    const isActuallyRunningRef = useRef(false);
    const isRecordingRef = useRef(false);
    const transcriptRef = useRef("");
    const timerRef = useRef(null);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setError("Your browser does not support Speech Recognition. Please use Chrome.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            let interim = '';
            let final = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    final += event.results[i][0].transcript;
                } else {
                    interim += event.results[i][0].transcript;
                }
            }
            setLiveTranscript(interim);
            if (final) {
                console.log("Speech Final segment captured:", final);
                setTranscript(prev => {
                    const next = (prev + ' ' + final).trim();
                    transcriptRef.current = next;
                    return next;
                });
            } else {
                console.log("Speech Interim segment:", interim);
            }
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            if (event.error === 'not-allowed') {
                setError("Microphone access denied. Please allow microphone access.");
            }
        };

        recognition.onstart = () => {
            isActuallyRunningRef.current = true;
        };

        recognition.onend = () => {
            isActuallyRunningRef.current = false;
            if (isRecordingRef.current) {
                try {
                    recognition.start(); 
                } catch (e) {
                    console.log("Recognition auto-restart suppressed:", e);
                }
            }
        };

        return () => {
            isRecordingRef.current = false;
            try {
                recognition.stop();
            } catch (e) {}
            if (timerRef.current) clearInterval(timerRef.current);
            window.speechSynthesis.cancel();
        };
    }, []);

    useEffect(() => {
        if (isRecording && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (isRecording && timeLeft === 0) {
            stopRecording();
            handleSubmit();
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isRecording, timeLeft]);

    const speakQuestion = () => {
        if (playCount >= 2) {
            toast.error("Playback limit reached (2/2)");
            return;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(question.questionText);
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
        setPlayCount(prev => prev + 1);
    };

    const startRecording = () => {
        if (recognitionRef.current && !isRecording) {
            setError(null);
            setIsRecording(true);
            isRecordingRef.current = true;
            setTimeLeft(question.type === 'mcq' ? 10 : 20);
            if (!isActuallyRunningRef.current) {
                try {
                    recognitionRef.current.start();
                    toast.success("Listening...");
                } catch (e) {
                    console.error("Manual start failed:", e);
                }
            }
        }
    };

    const stopRecording = () => {
        if (recognitionRef.current && isRecording) {
            setIsRecording(false);
            isRecordingRef.current = false;
            if (isActuallyRunningRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (e) {
                    console.error("Manual stop failed:", e);
                }
            }
        }
    };

    const handleSubmit = () => {
        console.log("handleSubmit triggered in MicroOralLayer");
        stopRecording();
        // Use ref to get most recent value instantly
        const finalTranscript = (transcriptRef.current + ' ' + liveTranscript).trim();
        console.log("Submitting Final Transcript:", finalTranscript);
        if (!finalTranscript) {
            console.warn("Submit blocked: Empty transcript");
            return toast.error("Please provide an answer.");
        }
        onSubmission(finalTranscript);
        // Clear for next question (if any)
        transcriptRef.current = "";
        setTranscript("");
    };

    if (error) {
        return (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6 z-[60]">
                <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-4">
                    <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
                        <AlertCircle size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Speech Error</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{error}</p>
                    <button onClick={onClose} className="btn-primary w-full">Close</button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-lg flex items-center justify-center p-6 z-[60] animate-fade-in">
            <div className="bg-white rounded-[40px] shadow-2xl max-w-xl w-full p-12 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-emerald-500 to-indigo-600" />
                
                <div className="space-y-8 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100/50">
                        <MessageSquare size={14} /> AI Micro-Oral Assessment
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Post-Submission Analysis</h2>
                        <p className="text-slate-400 font-bold text-sm">Listen carefully and speak your answer clearly.</p>
                    </div>

                    <div className="flex justify-center py-6">
                        <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${
                            isRecording ? 'bg-emerald-500 shadow-pulse scale-110' : 'bg-slate-50 border-4 border-slate-100'
                        }`}>
                            <Mic size={48} className={isRecording ? 'text-white' : 'text-slate-200'} />
                        </div>
                    </div>

                    <div className="min-h-[120px] bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col items-center justify-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 px-3 py-1 bg-white border-b border-r border-slate-100 text-[8px] font-black uppercase tracking-widest text-slate-400 rounded-br-lg">
                            Live Transcript
                        </div>

                        <p className="text-slate-700 font-bold text-lg leading-relaxed">
                            {isSpeaking ? (
                                <span className="text-blue-600 animate-pulse italic">AI is speaking the question...</span>
                            ) : isRecording ? (
                                transcript || liveTranscript ? (
                                    <>
                                        <span className="text-slate-800">{transcript}</span>
                                        <span className="text-emerald-500 animate-pulse">{liveTranscript}</span>
                                    </>
                                ) : (
                                    <span className="text-slate-400 italic">Waiting for your voice...</span>
                                )
                            ) : (
                                <span className="text-slate-300 italic">{transcript || "Oral phase ready"}</span>
                            )}
                        </p>
                    </div>

                    <div className="pt-6 border-t border-slate-50 flex flex-col items-center gap-6">
                        {!hasStarted ? (
                            <button
                                onClick={() => {
                                    setHasStarted(true);
                                    speakQuestion();
                                }}
                                className="px-12 py-5 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-blue-700 transition-all active:scale-95 shadow-xl shadow-blue-500/20"
                            >
                                <Volume2 size={20} /> Listen to Question
                            </button>
                        ) : isRecording ? (
                            <div className="flex flex-col items-center gap-4">
                                <div className="flex items-center gap-3 px-6 py-3 bg-rose-50 text-rose-600 rounded-xl font-black text-sm tabular-nums border border-rose-100">
                                    <AlertCircle size={18} /> {timeLeft}s Remaining
                                </div>
                                <button
                                    onClick={handleSubmit}
                                    className="px-12 py-5 bg-emerald-600 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-emerald-700 transition-all active:scale-95 shadow-xl shadow-emerald-500/20"
                                >
                                    <CheckCircle size={20} /> Finish & Submit
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-6">
                                <div className="flex gap-4">
                                    <button
                                        onClick={speakQuestion}
                                        disabled={playCount >= 2 || isSpeaking}
                                        className={`px-6 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all ${
                                            playCount >= 2 
                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                                            : 'bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        <Volume2 size={14} /> Listen Again ({2 - playCount} left)
                                    </button>
                                    <button
                                        onClick={startRecording}
                                        disabled={isSpeaking}
                                        className="px-12 py-5 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-blue-700 transition-all active:scale-95 shadow-xl shadow-blue-500/20"
                                    >
                                        <Mic size={20} /> {transcript ? "Speak Again" : "Speak Now"}
                                    </button>
                                </div>
                                
                                {transcript && (
                                    <button
                                        onClick={handleSubmit}
                                        className="w-full px-12 py-5 bg-emerald-600 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all active:scale-95 shadow-xl shadow-emerald-500/20 shadow-pulse"
                                    >
                                        <CheckCircle size={20} /> Submit My Answer
                                    </button>
                                )}
                            </div>
                        )}

                        <button
                            onClick={() => onClose()}
                            className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors"
                        >
                            Skip for now
                        </button>
                    </div>
                </div>

                <style>{`
            .shadow-pulse {
              animation: pulse 2s infinite;
            }
            @keyframes pulse {
              0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
              70% { box-shadow: 0 0 0 20px rgba(16, 185, 129, 0); }
              100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
            }
          `}</style>
            </div>
        </div>
    );
}

import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Volume2, Loader2, MessageSquare, ChevronRight, CheckCircle } from 'lucide-react';
import { aiService } from '../../services/api';
import toast from 'react-hot-toast';

export default function FollowUpVoice({ problemContext, solutionCode, onComplete }) {
    const [status, setStatus] = useState('idle'); // idle, speaking, listening, processing, finished
    const [history, setHistory] = useState([]);
    const [currentText, setCurrentText] = useState('');
    const [isInitial, setIsInitial] = useState(true);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const audioRef = useRef(new Audio());

    // Function to start the interview or ask follow-up
    const fetchNextQuestion = async (userAudioBlob = null) => {
        setStatus('processing');
        try {
            const formData = new FormData();
            formData.append('problemContext', problemContext);
            formData.append('solutionCode', solutionCode);
            formData.append('chatHistory', JSON.stringify(history));
            if (userAudioBlob) {
                formData.append('audio', userAudioBlob);
            }

            const { data } = await aiService.followUpVoice(formData);

            if (data.error) throw new Error(data.error);

            setCurrentText(data.text);
            setHistory(prev => [...prev, { role: 'assistant', content: data.text }]);

            // Play AI Audio
            const audioBlob = b64toBlob(data.audio, 'audio/mpeg');
            const audioUrl = URL.createObjectURL(audioBlob);
            audioRef.current.src = audioUrl;

            setStatus('speaking');
            audioRef.current.play();

            audioRef.current.onended = () => {
                setStatus('listening');
                startRecording();
            };

        } catch (err) {
            console.error(err);
            toast.error('AI Interviewer encountered an error');
            setStatus('idle');
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                fetchNextQuestion(audioBlob);
                stream.getTracks().forEach(t => t.stop());
            };

            mediaRecorderRef.current.start();
            setStatus('listening');
        } catch (err) {
            toast.error('Microphone access denied');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
    };

    const b64toBlob = (b64Data, contentType = '', sliceSize = 512) => {
        const byteCharacters = atob(b64Data);
        const byteArrays = [];
        for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            const slice = byteCharacters.slice(offset, offset + sliceSize);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }
        return new Blob(byteArrays, { type: contentType });
    };

    // Start interview automatically
    useEffect(() => {
        if (isInitial) {
            setIsInitial(false);
            fetchNextQuestion();
        }
    }, [isInitial]);

    return (
        <div className="fixed inset-0 z-[12000] bg-slate-900/90 flex flex-col items-center justify-center p-6 backdrop-blur-xl animate-in fade-in duration-500">
            <div className="max-w-2xl w-full bg-white rounded-[2.5rem] shadow-2xl p-12 text-center space-y-10 relative overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500" />

                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
                        <MessageSquare size={14} /> AI Follow-up Interview
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Post-Submission Analysis</h2>
                    <p className="text-slate-500 font-medium">Please answer the follow-up questions to complete your submission.</p>
                </div>

                {/* Central Visualization */}
                <div className="relative flex items-center justify-center py-10">
                    <div className={`w-40 h-40 rounded-full flex items-center justify-center transition-all duration-700 ${status === 'speaking' ? 'bg-blue-600 shadow-[0_0_50px_rgba(37,99,235,0.4)]' :
                            status === 'listening' ? 'bg-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.4)]' :
                                status === 'processing' ? 'bg-amber-400' : 'bg-slate-100'
                        }`}>
                        {status === 'speaking' && <Volume2 size={64} className="text-white animate-pulse" />}
                        {status === 'listening' && <Mic size={64} className="text-white animate-bounce" />}
                        {status === 'processing' && <Loader2 size={64} className="text-white animate-spin" />}
                        {status === 'idle' && <Mic size={64} className="text-slate-300" />}

                        {/* Pulsing rings for listening/speaking */}
                        {(status === 'speaking' || status === 'listening') && (
                            <>
                                <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${status === 'speaking' ? 'bg-blue-600' : 'bg-emerald-500'}`} />
                                <div className={`absolute inset-0 rounded-full animate-ping opacity-10 animation-delay-500 ${status === 'speaking' ? 'bg-blue-600' : 'bg-emerald-500'}`} />
                            </>
                        )}
                    </div>
                </div>

                {/* Transcript Area (Optional/Subtle) */}
                <div className="min-h-[80px] flex items-center justify-center px-8">
                    {status === 'speaking' && (
                        <p className="text-lg font-bold text-slate-800 leading-relaxed italic animate-in slide-in-from-bottom-2">
                            "{currentText}"
                        </p>
                    )}
                    {status === 'listening' && (
                        <p className="text-lg font-black text-emerald-600 uppercase tracking-widest animate-pulse">
                            Listening to your response...
                        </p>
                    )}
                    {status === 'processing' && (
                        <div className="flex items-center gap-3 text-slate-400">
                            <Loader2 className="animate-spin" size={20} />
                            <span className="text-sm font-bold uppercase tracking-widest">AI is thinking...</span>
                        </div>
                    )}
                </div>

                {/* UI Actions */}
                <div className="pt-6 border-t border-slate-50 flex flex-col items-center gap-6">
                    {status === 'listening' && (
                        <button
                            onClick={stopRecording}
                            className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-black transition-all active:scale-95 group shadow-xl shadow-slate-900/10"
                        >
                            <Square size={16} fill="white" /> Stop & Submit Answer
                        </button>
                    )}

                    <button
                        onClick={() => onComplete()}
                        className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors flex items-center gap-2"
                    >
                        Skip Interview (Manual Review Required) <ChevronRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}

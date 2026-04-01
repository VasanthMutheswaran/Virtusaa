import React from 'react';
import { ShieldCheck, User, PlayCircle, ChevronRight } from 'lucide-react';

const steps = [
  { id: 'check', label: 'System Check', icon: ShieldCheck },
  { id: 'register', label: 'Profile Info', icon: User },
  { id: 'landing', label: 'Start Exam', icon: PlayCircle }
];

export default function CandidateProgress({ currentStep }) {
  const currentIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="w-full max-w-2xl mx-auto mb-12 hidden md:block">
      <div className="flex items-center justify-between relative">
        {/* Connection Lines */}
        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-100 -translate-y-1/2 z-0" />
        <div 
          className="absolute top-1/2 left-0 h-[2px] bg-primary -translate-y-1/2 z-0 transition-all duration-700" 
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              <div 
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border-2 ${
                  isActive 
                    ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-110' 
                    : isCompleted 
                      ? 'bg-white border-primary text-primary' 
                      : 'bg-white border-slate-100 text-slate-300'
                }`}
              >
                <Icon size={20} />
              </div>
              <span 
                className={`absolute -bottom-7 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest transition-colors duration-500 ${
                  isActive ? 'text-slate-900' : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

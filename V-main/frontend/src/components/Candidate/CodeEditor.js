import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { examAPI } from '../../services/api';
import { Play, Send, ChevronDown, Terminal, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { aiService } from '../../services/api';
import MicroOralLayer from './MicroOralLayer';

const LANGUAGES = [
  { value: 'java', label: 'Java', defaultCode: `import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Your code here\n    }\n}` },
  { value: 'python', label: 'Python', defaultCode: `import sys\ninput = sys.stdin.readline\n\n# Your code here\n` },
  { value: 'javascript', label: 'JavaScript', defaultCode: `const readline = require('readline');\nconst rl = readline.createInterface({ input: process.stdin });\n\n// Your code here\n` },
];

export default function CodeEditor({ question, sessionId, clarityCheckEnabled }) {
  const [language, setLanguage] = useState('java');
  const [code, setCode] = useState(LANGUAGES[0].defaultCode);
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [verdict, setVerdict] = useState(null);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [oralQuestion, setOralQuestion] = useState(null);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    const l = LANGUAGES.find(x => x.value === lang);
    setCode(l?.defaultCode || '');
    setVerdict(null);
    setOutput('');
  };

  const handleRun = async () => {
    setRunning(true);
    setOutput('Running...');
    try {
      const { data } = await examAPI.submitCode({
        sessionId, questionId: question.id,
        language, sourceCode: code
      });
      setOutput(data.output || data.error || 'No output');
      setVerdict(data.verdict);
    } catch {
      setOutput('Failed to run code. Check your connection.');
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!code.trim()) return toast.error('Please write some code first');
    setSubmitting(true);
    try {
      const { data } = await examAPI.submitCode({
        sessionId, questionId: question.id,
        language, sourceCode: code
      });
      setVerdict(data.verdict);
      setOutput(data.output || '');
      console.log("Solution verdict:", data.verdict, "Clarity Enabled:", clarityCheckEnabled);
      
      if (data.verdict === 'ACCEPTED') {
        toast.success(`✅ Accepted! ${data.passedTestCases}/${data.totalTestCases} test cases passed`);
      } else {
        toast.error(`❌ ${data.verdict}: ${data.passedTestCases}/${data.totalTestCases} test cases passed`);
      }

      // Generate a smart follow-up question regardless of verdict
      if (clarityCheckEnabled) {
          console.log("Triggering Coding Clarity Check...");
          const toastId = toast.loading("AI is generating a follow-up question...");
          try {
            const res = await aiService.generateClarity({ code, context: question.description, type: 'coding' });
            console.log("AI Response:", res.data);
            toast.dismiss(toastId);
            setOralQuestion({ 
              id: 999, 
              questionText: res.data.question, 
              topic: res.data.keywords ? res.data.keywords.join(', ') : (question.title || 'Coding'),
              type: 'coding' 
            }); 
            setShowFollowUp(true);
          } catch (err) {
            toast.dismiss(toastId);
            toast.error("Failed to generate AI follow-up question.");
            console.error("Failed to generate oral question", err);
          }
      }
    } catch {
      toast.error('Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-white">
      {/* Toolbar */}
      <div className="flex items-center gap-4 px-6 py-4 bg-white border-b border-slate-100 z-10">
        <div className="relative">
          <select
            value={language}
            onChange={e => handleLanguageChange(e.target.value)}
            className="appearance-none bg-slate-50 text-slate-900 text-[11px] font-bold uppercase tracking-widest px-5 py-2.5 pr-10 rounded-xl border border-slate-200 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all cursor-pointer"
          >
            {LANGUAGES.map(l => <option key={l.value} value={l.value} className="bg-white">{l.label}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        <div className="flex-1" />

        {verdict && (
          <span className={`text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl border-2 ${verdict === 'ACCEPTED' ? 'text-green-600 border-green-50 bg-green-50/50' : 'text-rose-600 border-rose-50 bg-rose-50/50'}`}>
            {verdict}
          </span>
        )}

        <button
          onClick={handleRun}
          disabled={running}
          className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[11px] font-bold uppercase tracking-widest px-6 py-2.5 rounded-xl transition-all disabled:opacity-50 active:scale-95 border border-slate-200"
        >
          <Play size={14} className={running ? 'animate-spin' : ''} />
          {running ? 'Running...' : 'Run Code'}
        </button>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="btn-primary !px-6 !py-2.5 !text-[11px] !rounded-xl flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Send size={14} />
          {submitting ? 'Submitting...' : 'Submit Code'}
        </button>
      </div>

      {/* Editor Container */}
      <div className="flex-1 min-h-0 relative border-b border-slate-100">
        <Editor
          height="100%"
          language={language === 'cpp' ? 'cpp' : language}
          value={code}
          onChange={v => setCode(v || '')}
          theme="vs-dark"
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 20, bottom: 20 },
            fontFamily: "'JetBrains Mono', monospace",
            renderLineHighlight: 'all',
            lineNumbers: 'on',
            scrollbar: {
              vertical: 'hidden',
              horizontal: 'hidden'
            }
          }}
        />
      </div>

      {/* Console Output */}
      <div className="h-48 bg-slate-50 overflow-auto">
        <div className="flex items-center px-6 py-3 bg-white border-b border-slate-100 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-2 text-primary font-bold">
            <Terminal size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Execution Console</span>
          </div>
        </div>
        <div className="p-6">
          <pre className="text-sm font-mono text-slate-700 whitespace-pre-wrap leading-relaxed">
            {output || <span className="text-slate-300 font-medium italic select-none">Waiting for code execution output...</span>}
          </pre>
        </div>
      </div>

      {showFollowUp && oralQuestion && (
        <MicroOralLayer
          question={oralQuestion}
          onSubmission={async (transcript) => {
            console.log("CodeEditor onSubmission triggered with transcript:", transcript);
            try {
              const payload = {
                sessionId,
                questionText: oralQuestion.questionText,
                topic: oralQuestion.topic,
                transcript,
              };
              console.log("Submitting Coding Oral Answer payload:", payload);
              await examAPI.submitOralAnswer(payload);
              console.log("Coding Oral Answer submitted successfully");
              toast.success("Oral assessment submitted!");
              setShowFollowUp(false);
            } catch (err) {
              console.error("Failed to submit oral answer", err);
              toast.error("Failed to submit oral answer");
            }
          }}
          onClose={() => setShowFollowUp(false)}
        />
      )}
    </div>
  );
}

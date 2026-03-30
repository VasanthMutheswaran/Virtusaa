import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/Admin/AdminLayout';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, Code, HelpCircle, Cpu, Wand2, X, RefreshCw, Check } from 'lucide-react';

const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'];
const LANGUAGES = ['Java', 'Python', 'C++', 'JavaScript'];

export default function AssessmentCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', durationMinutes: 60, clarityCheckEnabled: true,
  });
  const [codingQuestions, setCodingQuestions] = useState([]);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [numQuestions, setNumQuestions] = useState(5);
  const [sections, setSections] = useState(['General']);
  const [newSectionName, setNewSectionName] = useState('');
  const [targetSection, setTargetSection] = useState('General');
  const [generateTarget, setGenerateTarget] = useState('both');
  const [selectedDifficulty, setSelectedDifficulty] = useState('MEDIUM');
  const [suggestionTopic, setSuggestionTopic] = useState('');
  const [suggestedQuestions, setSuggestedQuestions] = useState({ quizQuestions: [], codingQuestions: [] });
  const [fetchingSuggestions, setFetchingSuggestions] = useState(false);

  // New suggestion modal state
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [activeSuggestionType, setActiveSuggestionType] = useState('quiz'); // 'quiz' or 'coding' or 'sql'
  const [suggestConfig, setSuggestConfig] = useState({ count: 5, topic: '', difficulty: 'MEDIUM' });
  const [sqlQuestions, setSqlQuestions] = useState([]);

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const addSection = () => {
    if (!newSectionName.trim()) return;
    const trimmed = newSectionName.trim();
    if (sections.includes(trimmed)) return toast.error('Section already exists');
    setSections([...sections, trimmed]);
    setNewSectionName('');
    toast.success('Section added');
  };

  const removeSection = (name) => {
    if (name === 'General') return toast.error('Cannot remove General section');
    setSections(sections.filter(s => s !== name));
    // Re-assign questions from this section to General
    setQuizQuestions(quizQuestions.map(q => q.sectionName === name ? { ...q, sectionName: 'General' } : q));
    if (targetSection === name) setTargetSection('General');
  };

  const handleGenerateFromPdf = async () => {
    if (!selectedFile) return toast.error('Please select a PDF file first');

    const toastId = toast.loading(`AI is generating questions into "${targetSection}"...`);
    setGenerating(true);
    try {
      const { data } = await adminAPI.generateFromPdf(selectedFile, numQuestions, selectedDifficulty, generateTarget);

      if (data.quizQuestions && ['quiz', 'both'].includes(generateTarget)) {
        const mappedQuiz = data.quizQuestions.map(q => ({
          ...q,
          sectionName: targetSection
        }));
        setQuizQuestions(prev => [...prev, ...mappedQuiz]);
      }
      if (data.codingQuestions && ['coding', 'both'].includes(generateTarget)) {
        const mappedCoding = data.codingQuestions.map(q => ({
          ...q,
          timeLimitSeconds: 2,
          memoryLimitMb: 256,
          testCases: [{ input: '', expectedOutput: '', isHidden: false }]
        }));
        setCodingQuestions(prev => [...prev, ...mappedCoding]);
      }

      toast.success('AI generation complete! Review questions below.', { id: toastId });
      setSelectedFile(null);
    } catch (err) {
      console.error('Generation error:', err);
      toast.error(err.response?.data?.message || 'Failed to generate questions. Is the AI service running?', { id: toastId });
    } finally {
      setGenerating(false);
    }
  };

  const openSuggestModal = (type) => {
    setActiveSuggestionType(type);
    setShowSuggestModal(true);
    // Reset suggestions when switching types
    setSuggestedQuestions({ quizQuestions: [], codingQuestions: [] });
    // Default config based on type
    setSuggestConfig({
      count: type === 'quiz' ? 5 : 3,
      topic: '',
      difficulty: 'MEDIUM'
    });
  };

  const handleFetchSuggestions = async () => {
    setFetchingSuggestions(true);
    const toastId = toast.loading('AI is brainstorming suggestions...');
    try {
      const response = await adminAPI.suggestQuestions({
        difficulty: suggestConfig.difficulty,
        type: activeSuggestionType,
        count: suggestConfig.count,
        topic: suggestConfig.topic || 'general computer science'
      });

      const data = response.data;
      console.log("Suggestions received:", data);

      if (data) {
        console.log("Suggestions content (raw):", JSON.stringify(data));
        setSuggestedQuestions(data);
        const qCount = data.quizQuestions?.length || 0;
        const cCount = data.codingQuestions?.length || 0;
        const countRecovered = qCount + cCount;

        if (data.error) {
          console.warn("AI service returned an error field:", data.error);
        }

        if (countRecovered > 0) {
          toast.success(`Retrieved ${countRecovered} AI suggestions!`, { id: toastId });
        } else {
          console.error("No questions found in data:", data);
          toast.error(data.error || 'AI returned empty results. (Check console)', { id: toastId });
        }
      } else {
        toast.error('No data received from AI service.', { id: toastId });
      }
    } catch (err) {
      console.error('Suggestion fetch error:', err);
      toast.error('Failed to get suggestions. Check browser console.', { id: toastId });
    } finally {
      setFetchingSuggestions(false);
    }
  };

  const addSuggestedQuestion = (type, q) => {
    if (type === 'quiz') {
      const targetSec = targetSection || 'General';
      setQuizQuestions(prev => [...prev, {
        ...q,
        sectionName: targetSec,
        marks: q.marks || 1,
        id: Date.now() + Math.random()
      }]);
      toast.success('MCQ added to ' + targetSec);
    } else if (type === 'coding') {
      setCodingQuestions(prev => [...prev, {
        ...q,
        timeLimitSeconds: 2,
        memoryLimitMb: 256,
        marks: q.marks || 10,
        testCases: q.testCases && q.testCases.length > 0
          ? q.testCases.map(tc => ({ ...tc, isHidden: tc.hidden || tc.isHidden || false }))
          : [{ input: '', expectedOutput: '', isHidden: false }],
        id: Date.now() + Math.random()
      }]);
      toast.success('Coding question added');
    }
  };

  const addCodingQuestion = () => {
    setCodingQuestions([...codingQuestions, {
      title: '', description: '', difficulty: 'MEDIUM', marks: 10,
      timeLimitSeconds: 2, memoryLimitMb: 256,
      sampleInput: '', sampleOutput: '',
      testCases: [{ input: '', expectedOutput: '', isHidden: false }]
    }]);
  };

  const addQuizQuestion = (sectionName) => {
    setQuizQuestions([...quizQuestions, {
      question: '', optionA: '', optionB: '', optionC: '', optionD: '',
      correctOption: 'A', marks: 1, topic: '',
      sectionName: sectionName || (sections[0] || 'General')
    }]);
  };

  const handleSubmit = async () => {
    const toastId = toast.loading('Creating assessment and questions...');
    setLoading(true);
    try {
      const { data: assessment } = await adminAPI.createAssessment(form);

      // Add coding questions
      for (const q of codingQuestions) {
        await adminAPI.addCodingQuestion(assessment.id, q);
      }

      // Process all audio generations and DB insertions concurrently!
      await Promise.all(quizQuestions.map(async (q) => {
        let audioBase64 = null;
        if (q.question) {
          try {
            const res = await adminAPI.generateAudio({ text: q.question });
            audioBase64 = await blobToBase64(res.data);
          } catch (err) {
            console.error("Audio generation failed for a question", err);
          }
        }

        await adminAPI.addQuizQuestion(assessment.id, {
          ...q,
          sectionName: q.sectionName || 'General',
          audioBase64
        });
      }));

      toast.success('Assessment created successfully!', { id: toastId });
      navigate(`/admin/assessments/${assessment.id}`);
    } catch (err) {
      console.error('Creation error:', err);
      const msg = err.response?.data?.message || 'Failed to create assessment or questions. Please check the console.';
      toast.error(msg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };


  return (
    <AdminLayout title="Create Assessment"
      breadcrumbs={[
        { label: 'Dashboard', path: '/admin' },
        { label: 'Create Assessment' }
      ]}>
      <div className="max-w-4xl space-y-6">
        {/* AI Generation Quick Start */}
        <div className="card !p-8 border-primary-light bg-primary-light/10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <Cpu size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">AI Question Generator</h2>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Generate questions instantly from any PDF document</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4 p-5 bg-white rounded-2xl border border-primary-light shadow-sm">
              <div className="flex-1 min-w-[240px]">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="block w-full text-xs text-slate-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-xl file:border-0
                    file:text-xs file:font-bold
                    file:bg-primary-light file:text-primary
                    hover:file:bg-primary-light/80 transition-all"
                />
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-border-light">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Target:</label>
                <select
                  value={generateTarget}
                  onChange={(e) => setGenerateTarget(e.target.value)}
                  className="bg-transparent text-xs font-bold text-primary focus:outline-none cursor-pointer"
                >
                  <option value="both">Both Sections</option>
                  <option value="quiz">Quiz Only</option>
                  <option value="coding">Coding Only</option>
                </select>
              </div>
              {['quiz', 'both'].includes(generateTarget) && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-border-light">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">To Section:</label>
                  <select
                    value={targetSection}
                    onChange={(e) => setTargetSection(e.target.value)}
                    className="bg-transparent text-xs font-bold text-primary focus:outline-none cursor-pointer"
                  >
                    {sections.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-border-light">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Count:</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(parseInt(e.target.value) || 1)}
                  className="w-10 bg-transparent text-xs font-bold text-primary focus:outline-none"
                />
              </div>
              <button
                onClick={handleGenerateFromPdf}
                disabled={generating || !selectedFile}
                className={`btn-primary !px-6 !py-2.5 !text-xs ${generating || !selectedFile ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
              >
                {generating ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Cpu size={14} />
                    Generate
                  </>
                )}
              </button>
            </div>

            {/* Difficulty and Topic Selection for AI Suggestion */}
            <div className="flex flex-col gap-3 p-4 bg-white/50 rounded-xl border border-primary-light/30">
              <div className="flex items-center gap-3">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-2">AI Suggestion Complexity:</label>
                <div className="flex gap-1">
                  {DIFFICULTIES.map(d => (
                    <button
                      key={d}
                      onClick={() => setSelectedDifficulty(d)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${selectedDifficulty === d
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-2">Topic (Optional):</label>
                <input
                  type="text"
                  placeholder="e.g. Java Collections, React Hooks"
                  value={suggestionTopic}
                  onChange={e => setSuggestionTopic(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <SuggestionModal
          show={showSuggestModal}
          onClose={() => setShowSuggestModal(false)}
          type={activeSuggestionType}
          config={suggestConfig}
          setConfig={setSuggestConfig}
          fetching={fetchingSuggestions}
          onFetch={handleFetchSuggestions}
          quizList={suggestedQuestions.quizQuestions}
          codingList={suggestedQuestions.codingQuestions}
          onAdd={addSuggestedQuestion}
        />

        {/* SQL Questions (UI-only for now as per design) */}
        <div className="card !p-8 opacity-70">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-3 tracking-tight">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Cpu size={20} /></div>
              SQL Questions <span className="text-slate-400 font-medium text-sm ml-1">(0)</span>
            </h2>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 h-10">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mr-2">Count:</span>
                <input type="number" value="3" disabled className="w-8 bg-transparent text-xs font-bold text-slate-400 focus:outline-none" />
              </div>
              <div className="h-10 border-l border-slate-200 mx-1" />
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 h-10">
                <select disabled className="bg-transparent text-xs font-bold text-slate-400 focus:outline-none cursor-pointer">
                  <option>MEDIUM</option>
                </select>
              </div>
              <button disabled className="btn-secondary !h-10 !py-0 !px-4 !text-xs border-slate-200 text-slate-400 cursor-not-allowed flex items-center gap-2">
                <Wand2 size={14} /> Suggest
              </button>
              <button disabled className="btn-secondary !h-10 !py-0 !px-4 !text-xs whitespace-nowrap bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed">
                <Plus size={14} /> Add SQL Question
              </button>
            </div>
          </div>
          <div className="text-center py-10 text-slate-300 border-2 border-dashed border-slate-100 rounded-lg">
            <p className="text-xs font-medium italic">SQL Question type is currently coming soon...</p>
          </div>
        </div>
        <div className="card !p-8">
          <h2 className="text-lg font-bold text-slate-900 mb-6 tracking-tight">Assessment Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Title *</label>
              <input className="input-field" placeholder="e.g., Java Developer Assessment 2024"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="label">Description</label>
              <textarea className="input-field" rows={3} placeholder="Assessment description..."
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="label">Clarity Check (AI Voice)</label>
              <div className="flex items-center gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, clarityCheckEnabled: !form.clarityCheckEnabled })}
                  className={`w-12 h-6 rounded-full transition-all relative ${form.clarityCheckEnabled ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form.clarityCheckEnabled ? 'right-1' : 'left-1'}`} />
                </button>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${form.clarityCheckEnabled ? 'text-primary' : 'text-slate-400'}`}>
                  {form.clarityCheckEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="card !p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-3 tracking-tight">
              <div className="p-2 bg-primary-light rounded-lg text-primary"><Code size={20} /></div>
              Coding Questions <span className="text-slate-400 font-medium text-sm ml-1">({codingQuestions.length})</span>
            </h2>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 h-10">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mr-2">Count:</span>
                <input
                  type="number" min="1" max="10" value={suggestConfig.count}
                  onChange={e => setSuggestConfig({ ...suggestConfig, count: parseInt(e.target.value) || 1 })}
                  className="w-8 bg-transparent text-xs font-bold text-primary focus:outline-none"
                />
              </div>
              <div className="h-10 border-l border-slate-200 mx-1" />
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 h-10">
                <select
                  value={suggestConfig.difficulty}
                  onChange={e => setSuggestConfig({ ...suggestConfig, difficulty: e.target.value })}
                  className="bg-transparent text-xs font-bold text-slate-600 focus:outline-none cursor-pointer"
                >
                  {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <button
                onClick={() => openSuggestModal('coding')}
                className="btn-secondary !h-10 !py-0 !px-4 !text-xs border-primary/20 text-primary hover:bg-primary/5 flex items-center gap-2"
              >
                <Wand2 size={14} /> Suggest
              </button>
              <button onClick={addCodingQuestion} className="btn-primary !h-10 !py-0 !px-4 !text-xs whitespace-nowrap">
                <Plus size={14} /> Add Question
              </button>
            </div>
          </div>

          {codingQuestions.map((q, i) => (
            <div key={i} className="border border-blue-100 rounded-lg p-5 mb-4 bg-white hover:border-blue-200 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-primary uppercase tracking-widest">Coding Question {i + 1}</h3>
                <button onClick={() => setCodingQuestions(codingQuestions.filter((_, j) => j !== i))}
                  className="text-slate-300 hover:text-red-500 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="label">Title</label>
                  <input className="input-field" placeholder="e.g., Reverse a String"
                    value={q.title}
                    onChange={e => { const nq = [...codingQuestions]; nq[i].title = e.target.value; setCodingQuestions(nq); }} />
                </div>
                <div className="col-span-2">
                  <label className="label">Problem Description</label>
                  <textarea className="input-field" rows={4}
                    placeholder="Describe the problem, constraints, examples..."
                    value={q.description}
                    onChange={e => { const nq = [...codingQuestions]; nq[i].description = e.target.value; setCodingQuestions(nq); }} />
                </div>
                <div>
                  <label className="label">Difficulty</label>
                  <select className="input-field" value={q.difficulty}
                    onChange={e => { const nq = [...codingQuestions]; nq[i].difficulty = e.target.value; setCodingQuestions(nq); }}>
                    {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Marks</label>
                  <input className="input-field" type="number" min={1}
                    value={q.marks}
                    onChange={e => { const nq = [...codingQuestions]; nq[i].marks = parseInt(e.target.value); setCodingQuestions(nq); }} />
                </div>
                <div>
                  <label className="label">Sample Input</label>
                  <textarea className="input-field font-mono text-sm" rows={2}
                    value={q.sampleInput}
                    onChange={e => { const nq = [...codingQuestions]; nq[i].sampleInput = e.target.value; setCodingQuestions(nq); }} />
                </div>
                <div>
                  <label className="label">Sample Output</label>
                  <textarea className="input-field font-mono text-sm" rows={2}
                    value={q.sampleOutput}
                    onChange={e => { const nq = [...codingQuestions]; nq[i].sampleOutput = e.target.value; setCodingQuestions(nq); }} />
                </div>
              </div>

              {/* Test Cases */}
              <div className="mt-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Test Cases</label>
                  <button onClick={() => {
                    const nq = [...codingQuestions];
                    nq[i].testCases.push({ input: '', expectedOutput: '', isHidden: true });
                    setCodingQuestions(nq);
                  }} className="text-xs font-bold text-gray-700 hover:text-black hover:underline flex items-center gap-1">
                    <Plus size={12} /> Add Test Case
                  </button>
                </div>
                {q.testCases.map((tc, j) => (
                  <div key={j} className="bg-gray-50 rounded p-3 mb-2 grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500">Input</label>
                      <textarea className="input-field font-mono text-xs mt-1" rows={2}
                        value={tc.input}
                        onChange={e => { const nq = [...codingQuestions]; nq[i].testCases[j].input = e.target.value; setCodingQuestions(nq); }} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Expected Output</label>
                      <textarea className="input-field font-mono text-xs mt-1" rows={2}
                        value={tc.expectedOutput}
                        onChange={e => { const nq = [...codingQuestions]; nq[i].testCases[j].expectedOutput = e.target.value; setCodingQuestions(nq); }} />
                    </div>
                    <div className="col-span-2 flex items-center gap-2">
                      <input type="checkbox" id={`hidden-${i}-${j}`}
                        checked={tc.isHidden}
                        onChange={e => { const nq = [...codingQuestions]; nq[i].testCases[j].isHidden = e.target.checked; setCodingQuestions(nq); }} />
                      <label htmlFor={`hidden-${i}-${j}`} className="text-xs text-gray-500">Hidden test case</label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {codingQuestions.length === 0 && (
            <div className="text-center py-12 text-slate-400 border-2 border-dashed border-blue-50 rounded-lg bg-slate-50/50">
              <Code size={32} className="mx-auto mb-2 text-blue-600" />
              <p className="text-sm font-medium">No coding questions added yet</p>
            </div>
          )}
        </div>

        <div className="card !p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-3 tracking-tight">
              <div className="p-2 bg-primary-light rounded-lg text-primary"><HelpCircle size={20} /></div>
              MCQ Questions <span className="text-slate-400 font-medium text-sm ml-1">({quizQuestions.length})</span>
            </h2>

            <div className="flex items-center gap-3">
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 h-10">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mr-2">Count:</span>
                <input
                  type="number" min="1" max="10" value={suggestConfig.count}
                  onChange={e => setSuggestConfig({ ...suggestConfig, count: parseInt(e.target.value) || 1 })}
                  className="w-8 bg-transparent text-xs font-bold text-primary focus:outline-none"
                />
              </div>
              <div className="h-10 border-l border-slate-200 mx-1" />
              <button
                onClick={() => openSuggestModal('quiz')}
                className="btn-secondary !h-10 !py-0 !px-4 !text-xs border-primary/20 text-primary hover:bg-primary/5 flex items-center gap-2"
              >
                <Wand2 size={14} /> Suggest
              </button>
              <div className="flex gap-2 ml-2">
                <input
                  className="input-field !h-10 !py-0 !px-4 !text-xs w-48 !bg-slate-50"
                  placeholder="New section name..."
                  value={newSectionName}
                  onChange={e => setNewSectionName(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && addSection()}
                />
                <button onClick={addSection} className="btn-secondary !h-10 !py-0 !px-4 !text-xs border-border-light text-slate-600 bg-white">
                  Add Section
                </button>
              </div>
            </div>
          </div>

          {sections.map((section, sIdx) => (
            <div key={sIdx} className="mb-10 border-l-2 border-primary-light pl-6">
              <div className="flex justify-between items-center mb-6 bg-slate-50/50 px-6 py-4 rounded-2xl border border-border-light">
                <div className="flex items-center gap-4">
                  <input
                    className="font-bold text-base text-slate-900 bg-transparent border-b border-dashed border-slate-200 focus:border-primary focus:outline-none transition-colors"
                    value={section}
                    onChange={(e) => {
                      const newName = e.target.value;
                      const oldName = section;
                      const ns = [...sections];
                      ns[sIdx] = newName;
                      setSections(ns);
                      setQuizQuestions(quizQuestions.map(q => q.sectionName === oldName ? { ...q, sectionName: newName } : q));
                      if (targetSection === oldName) setTargetSection(newName);
                    }}
                  />
                  {section !== 'General' && (
                    <button onClick={() => removeSection(section)} className="text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <button onClick={() => addQuizQuestion(section)} className="btn-primary !py-2 !px-4 !text-xs">
                  <Plus size={14} /> Add Question
                </button>
              </div>

              {quizQuestions.map((q, i) => {
                if (q.sectionName !== section) return null;
                return (
                  <div key={i} className="card !p-6 mb-4 relative hover:border-primary-light transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[10px] font-bold text-primary uppercase tracking-widest">Question</h3>
                      <button onClick={() => setQuizQuestions(quizQuestions.filter((_, j) => j !== i))}
                        className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="label">Question Text</label>
                        <textarea className="input-field" rows={2}
                          placeholder="Enter your question..."
                          value={q.question}
                          onChange={e => { const nq = [...quizQuestions]; nq[i].question = e.target.value; setQuizQuestions(nq); }} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {['A', 'B', 'C', 'D'].map(opt => (
                          <div key={opt}>
                            <label className="label">Option {opt}</label>
                            <input className="input-field"
                              value={q[`option${opt}`]}
                              onChange={e => { const nq = [...quizQuestions]; nq[i][`option${opt}`] = e.target.value; setQuizQuestions(nq); }} />
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="label">Correct Option</label>
                          <select className="input-field" value={q.correctOption}
                            onChange={e => { const nq = [...quizQuestions]; nq[i].correctOption = e.target.value; setQuizQuestions(nq); }}>
                            {['A', 'B', 'C', 'D'].map(o => <option key={o}>{o}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="label">Marks</label>
                          <input className="input-field" type="number" min={1}
                            value={q.marks}
                            onChange={e => { const nq = [...quizQuestions]; nq[i].marks = parseInt(e.target.value) || 0; setQuizQuestions(nq); }} />
                        </div>
                        <div>
                          <label className="label">Topic (Sub-label)</label>
                          <input className="input-field" placeholder="e.g., Logic, Grammar"
                            value={q.topic}
                            onChange={e => { const nq = [...quizQuestions]; nq[i].topic = e.target.value; setQuizQuestions(nq); }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {quizQuestions.filter(q => q.sectionName === section).length === 0 && (
                <div className="text-center py-8 text-slate-400 border-2 border-dashed border-blue-50 rounded-lg bg-slate-50/50">
                  <p className="text-sm font-medium">No questions in this section yet</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="flex gap-4 pt-4">
          <button onClick={handleSubmit} disabled={loading}
            className="btn-primary !px-10">
            {loading ? 'Creating...' : 'Create Assessment'}
          </button>
          <button onClick={() => navigate('/admin')} className="btn-secondary border-border-light text-slate-600 hover:text-slate-900">Cancel</button>
        </div>
      </div>
    </AdminLayout>
  );
}
const SuggestionModal = ({ show, onClose, type, config, setConfig, fetching, onFetch, quizList, codingList, onAdd }) => {
  if (!show) return null;

  const list = type === 'quiz' ? quizList : codingList;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200 animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary border border-primary/20 shadow-sm">
              <Wand2 size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                AI {type === 'quiz' ? 'MCQ' : type === 'coding' ? 'Coding' : 'SQL'} Suggestions
              </h3>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Brainstorm unique questions for your assessment</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 bg-white border-b border-slate-100 flex flex-wrap gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Topic / Keywords</label>
            <input
              type="text"
              placeholder="e.g. Recursion, Java Collections"
              value={config.topic}
              onChange={e => setConfig({ ...config, topic: e.target.value })}
              autoFocus
              className="w-64 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Count</label>
            <input
              type="number"
              min="1" max="10"
              value={config.count}
              onChange={e => setConfig({ ...config, count: parseInt(e.target.value) || 1 })}
              className="w-20 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-primary focus:outline-none transition-all"
            />
          </div>
          {type === 'coding' && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Difficulty</label>
              <select
                value={config.difficulty}
                onChange={e => setConfig({ ...config, difficulty: e.target.value })}
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-primary focus:outline-none transition-all"
              >
                {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          )}
          <button
            onClick={onFetch}
            disabled={fetching}
            className="btn-primary !py-2.5 !px-6 !text-xs mb-0.5 ml-auto flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            {fetching ? <RefreshCw size={14} className="animate-spin" /> : <Wand2 size={14} />}
            {fetching ? 'Brainstorming...' : 'Get Suggestions'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
          {list.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {list.map((q, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-primary/40 transition-all group relative">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[9px] font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-lg uppercase tracking-wider">
                      {type}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-800 leading-tight mb-3 pr-8">
                    {type === 'quiz' ? q.question : q.title}
                  </p>
                  {type === 'coding' && (
                    <>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mb-3 leading-relaxed italic border-l-2 border-slate-100 pl-3">
                        {q.description}
                      </p>
                      {q.testCases && q.testCases.length > 0 && (
                        <div className="flex items-center gap-1.5 mb-4 px-2.5 py-1.5 bg-emerald-50/60 rounded-xl border border-emerald-100/50 w-fit">
                          <div className="p-0.5 bg-emerald-500 rounded-full text-white">
                            <Check size={10} />
                          </div>
                          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest leading-none">
                            {q.testCases.length} Test Cases Incl.
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  <button
                    onClick={() => onAdd(type, q)}
                    className="w-full py-2.5 bg-slate-50 hover:bg-primary hover:text-white text-slate-600 text-xs font-bold rounded-xl border border-slate-200 hover:border-primary transition-all flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-primary/10"
                  >
                    <Plus size={14} /> Add to Assessment
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20 bg-white/50 rounded-3xl border-2 border-dashed border-slate-100">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <Wand2 size={32} className="text-slate-200" />
              </div>
              <h4 className="text-slate-600 font-bold text-sm mb-1">Ready for Suggestions</h4>
              <p className="text-xs font-medium max-w-[280px] text-center mb-6 leading-relaxed">Choose your parameters above and let the AI build high-quality questions for you.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

# Segment 6: Frontend - Admin Portal & Assessment Creation

This segment covers the administrative dashboard where examiners create tests and leverage the AI generation features.

## 1. Assessment Creation Component (frontend/src/pages/AssessmentCreate.js)
This component is the entry point for test creation. It features a complex state-driven form that handles drag-and-drop question editing and AI-integrated suggestions.

```javascript
import React, { useState } from 'react';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Cpu, Wand2 } from 'lucide-react';

export default function AssessmentCreate() {
  const [form, setForm] = useState({ title: '', description: '', durationMinutes: 60 });
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [codingQuestions, setCodingQuestions] = useState([]);
  const [generating, setGenerating] = useState(false);

  // TRIGGER: AI Generate from PDF (Integrates with Segment 5)
  const handleGenerateFromPdf = async (file) => {
    setGenerating(true);
    try {
      const { data } = await adminAPI.generateFromPdf(file, 5, 'MEDIUM', 'both');
      setQuizQuestions(data.quizQuestions);
      setCodingQuestions(data.codingQuestions);
      toast.success('AI generation complete!');
    } catch (err) {
      toast.error('AI Service unreachable');
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async () => {
    const { data: assessment } = await adminAPI.createAssessment(form);
    // Concurrent bulk-save of all generated questions
    await Promise.all([
      ...codingQuestions.map(q => adminAPI.addCodingQuestion(assessment.id, q)),
      ...quizQuestions.map(q => adminAPI.addQuizQuestion(assessment.id, q))
    ]);
    toast.success('Assessment Launched!');
  };

  return (
    <div className="card">
      <h2>AI Question Generator</h2>
      <input type="file" onChange={(e) => handleGenerateFromPdf(e.target.files[0])} />
      <button onClick={handleSubmit}>Create Assessment</button>
    </div>
  );
}
```

## 2. Dynamic Suggestion Modal
The suggestion modal (integrated within `AssessmentCreate.js`) allows admins to preview AI-brainstormed questions before they are committed to the database. It uses a "One-Click Add" pattern that immediately injects the question into the active form state.

---
**Team**: ILLUSION  
**Institution**: Rajalakshmi Engineering College  
**Event**: Virtusa Jatayu Season 5

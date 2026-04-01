import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    // Global 401 handler
    if (error.response?.status === 401) {
      // Don't force redirect if the error is from a login endpoint
      const url = error.config?.url || '';
      if (url.includes('/auth/admin/login') || url.includes('/auth/candidate/login') || url.includes('/auth/hr/login')) {
        return Promise.reject(error);
      }

      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  adminLogin: (data) => api.post('/auth/admin/login', data),
  hrLogin: (data) => api.post('/auth/hr/login', data),
  adminRegister: (data) => api.post('/auth/admin/register', data),
  candidateLogin: (data) => api.post('/auth/candidate/login', data),
  verifyToken: (token) => api.post(`/auth/candidate/verify?token=${token}`),
  updateCandidateProfile: (token, profileData, resumeFile) => {
    const formData = new FormData();
    formData.append('token', token);
    formData.append('data', JSON.stringify(profileData));
    if (resumeFile) {
      formData.append('resume', resumeFile);
    }
    return api.post('/auth/candidate/profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};

// Admin APIs
export const adminAPI = {
  getAssessments: () => api.get('/admin/assessments'),
  createAssessment: (data) => api.post('/admin/assessments', data),
  updateAssessment: (id, data) => api.put(`/admin/assessments/${id}`, data),
  deleteAssessment: (id) => api.delete(`/admin/assessments/${id}`),
  getAssessment: (id) => api.get(`/admin/assessments/${id}`),

  addCodingQuestion: (assessmentId, data) => api.post(`/admin/assessments/${assessmentId}/coding-questions`, data),
  addQuizQuestion: (assessmentId, data) => api.post(`/admin/assessments/${assessmentId}/quiz-questions`, data),
  generateFromPdf: (file, count = 5, difficulty = 'MEDIUM', type = 'both') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('count', count);
    formData.append('difficulty', difficulty);
    formData.append('type', type);
    return api.post('/admin/generate-from-pdf', formData);
  },
  suggestQuestions: (params) => {
    const { difficulty, type, count, topic } = params;
    return api.post('/admin/suggest-questions', null, {
      params: { difficulty, type, count, topic }
    });
  },

  getCandidates: () => api.get('/admin/candidates'),
  addCandidate: (data) => api.post('/admin/candidates', data),
  removeCandidate: (id) => api.delete(`/admin/candidates/${id}`),
  inviteCandidates: (assessmentId, candidateIds) => api.post(`/admin/assessments/${assessmentId}/invite`, candidateIds),

  getResults: (assessmentId) => api.get(`/admin/assessments/${assessmentId}/results`),
  getAllResults: () => api.get('/admin/results'),
  getViolationStats: () => api.get('/admin/stats/violations'),
  getProctoringLogs: (sessionId) => api.get(`/admin/sessions/${sessionId}/proctoring-logs`),
  updateResultVerdict: (sessionId, verdict) => api.post(`/admin/results/${sessionId}/verdict`, { verdict }),
  deleteResult: (sessionId) => api.delete(`/admin/results/${sessionId}`),

  // AI Monitor Service Calls
  getAISummary: (data) => axios.post('http://127.0.0.1:5000/summarize', data),
  generateAudio: (data) => axios.post('http://127.0.0.1:5000/generate-audio', data, { responseType: 'blob' }),
};

// Exam APIs
export const examAPI = {
  startExam: (token) => api.get(`/candidate/exam/start/${token}`),
  submitCode: (data) => api.post('/candidate/exam/submit/coding', data),
  submitQuizAnswer: (data) => api.post('/candidate/exam/submit/quiz', data),
  finalSubmit: (sessionId) => api.post(`/candidate/exam/submit/final/${sessionId}`),
  logViolation: (data) => api.post('/candidate/exam/proctoring/log', data),
  saveReferencePhoto: (sessionId, photoBase64) => api.post(`/candidate/exam/save-reference/${sessionId}`, photoBase64, {
    headers: { 'Content-Type': 'text/plain' }
  }),
  submitOralAnswer: (data) => api.post('/oral/submit', data),
  getOralSubmissions: (sessionId) => api.get(`/oral/admin/submissions/${sessionId}`),
};

export const aiService = {
  followUpVoice: (formData) => axios.post('http://127.0.0.1:5000/follow-up-voice', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  generateClarity: (data) => axios.post('http://127.0.0.1:5000/generate-clarity', data),
};

export default api;

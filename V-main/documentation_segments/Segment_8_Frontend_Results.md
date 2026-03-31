# Segment 8: Frontend - HR Analytics & Results Management

This segment contains the administrative interface for reviewing candidate performance and AI-generated integrity reports.

## 1. Results Dashboard (frontend/src/pages/ResultsDashboard.js)
The `ResultsDashboard` is where HR teams analyze assessment data. It features a sophisticated "Micro-Oral" modal to review AI-transcribed interview responses.

```javascript
import React, { useState, useEffect } from 'react';
import { adminAPI, examAPI } from '../services/api';
import AdminLayout from '../components/Admin/AdminLayout';
import toast from 'react-hot-toast';
import { BarChart3, User, Mic } from 'lucide-react';

export default function ResultsDashboard() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getResults().then(({ data }) => {
      // Logic for score normalization and penalty factor application
      const processed = data.map(res => {
        const penaltyFactor = Math.max(0.05, 1 - (res.violationCount / 200));
        return { ...res, finalScoreShift: Math.round(res.totalScore * penaltyFactor) };
      });
      setResults(processed);
      setLoading(false);
    });
  }, []);

  const updateVerdict = async (sessionId, verdict) => {
    await adminAPI.updateResultVerdict(sessionId, verdict);
    toast.success(`Candidate status: ${verdict}`);
  };

  return (
    <AdminLayout title="Results Center">
      <table className="results-table">
        <thead>
          <tr>
            <th>Candidate</th>
            <th>Final Score</th>
            <th>Violations</th>
            <th>Verdict</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {results.map(r => (
            <tr key={r.sessionId}>
              <td>{r.candidateName}</td>
              <td className="font-bold">{r.totalScore}</td>
              <td className="text-red-500">{r.violationCount}</td>
              <td><span className={`pill ${r.verdict}`}>{r.verdict}</span></td>
              <td>
                <button onClick={() => updateVerdict(r.sessionId, 'SELECTED')}>Select</button>
                <button className="secondary" onClick={() => showOralDetails(r.sessionId)}>View AI Report</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminLayout>
  );
}
```

## 2. Decision Logic: Penalty Factors
The system implements an automated "Trustworthiness Score" calculation. If a candidate has a high number of `LOOKING_AWAY` or `PHONE_DETECTED` events, the `ResultService` (Segment 3) reduces the base score. This incentivizes integrity while still allowing for minor human distractions.

---
**Team**: ILLUSION  
**Institution**: Rajalakshmi Engineering College  
**Event**: Virtusa Jatayu Season 5

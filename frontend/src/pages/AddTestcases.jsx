import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const AddTestcases = () => {
  const [problems, setProblems] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [loadingProblem, setLoadingProblem] = useState(false);
  const [search, setSearch] = useState('');
  const [newTcText, setNewTcText] = useState('{"input": "4\\n2 7 11 15\\n9", "expectedOutput": "0 1"}');
  const [pendingTcs, setPendingTcs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'problem_setter' && role !== 'admin') {
      alert('Unauthorized! Only problem setters and admins can manage test cases.');
      navigate(-1);
      return;
    }
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/problems?limit=200`);
      setProblems(res.data.data?.problems || []);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load problems.' });
    }
  };

  const handleSelectProblem = async (id) => {
    setSelectedId(id);
    setSelectedProblem(null);
    setPendingTcs([]);
    if (!id) return;
    setLoadingProblem(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/problems/${id}`);
      setSelectedProblem(res.data.data?.problem || null);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load problem details.' });
    } finally {
      setLoadingProblem(false);
    }
  };

  const addPendingTc = () => {
    try {
      const item = JSON.parse(newTcText);
      if (item.input === undefined || item.expectedOutput === undefined) {
        setMessage({ type: 'error', text: 'Test case must have "input" and "expectedOutput" fields.' });
        return;
      }
      setPendingTcs(prev => [...prev, { input: String(item.input), expectedOutput: String(item.expectedOutput), isHidden: item.isHidden ?? false }]);
      setNewTcText('{"input": "", "expectedOutput": ""}');
      setMessage({ type: '', text: '' });
    } catch {
      setMessage({ type: 'error', text: 'Invalid JSON format. Check your test case syntax.' });
    }
  };

  const removePending = (idx) => {
    setPendingTcs(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!selectedProblem) {
      setMessage({ type: 'error', text: 'Please select a problem first.' });
      return;
    }
    if (pendingTcs.length === 0) {
      setMessage({ type: 'error', text: 'Add at least one test case before saving.' });
      return;
    }
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const token = localStorage.getItem('token');
      const existingTcs = selectedProblem.testCases || [];
      const mergedTcs = [...existingTcs, ...pendingTcs];

      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/problems/${selectedId}`,
        { testCases: mergedTcs },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Reload problem to reflect updated test cases
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/problems/${selectedId}`);
      setSelectedProblem(res.data.data?.problem || null);
      setPendingTcs([]);
      setMessage({ type: 'success', text: `${pendingTcs.length} test case(s) added successfully!` });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error saving test cases.' });
    } finally {
      setSaving(false);
    }
  };

  const removeExisting = async (idx) => {
    if (!confirm('Remove this existing test case?')) return;
    const updated = (selectedProblem.testCases || []).filter((_, i) => i !== idx);
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/problems/${selectedId}`,
        { testCases: updated },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedProblem(prev => ({ ...prev, testCases: updated }));
      setMessage({ type: 'success', text: 'Test case removed.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error removing test case.' });
    } finally {
      setSaving(false);
    }
  };

  const filtered = problems.filter(p =>
    p.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-grow p-4 md:p-8 max-w-4xl mx-auto w-full">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Manage Test Cases</h2>
          <p className="text-sm text-gray-500 mt-1">Select a problem, then add or remove test cases.</p>
        </div>

        {message.text && (
          <div className={`mb-5 p-3 rounded-lg text-sm font-medium ${
            message.type === 'error'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Step 1: Select Problem */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Step 1 — Select Problem</h3>
          <input
            type="text"
            placeholder="Search problems..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
          />
          <select
            value={selectedId}
            onChange={e => handleSelectProblem(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors bg-white"
            size={Math.min(filtered.length + 1, 7)}
          >
            <option value="">-- Select a problem --</option>
            {filtered.map(p => (
              <option key={p._id} value={p._id}>
                {p.title} ({p.difficulty}) — {(p.testCases || []).length} test case(s)
              </option>
            ))}
          </select>
        </div>

        {loadingProblem && (
          <div className="flex justify-center py-6">
            <svg className="animate-spin h-7 w-7 text-indigo-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}

        {selectedProblem && !loadingProblem && (
          <>
            {/* Existing test cases */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Existing Test Cases ({(selectedProblem.testCases || []).length})
                </h3>
                <span className="text-xs text-indigo-600 font-medium">{selectedProblem.title}</span>
              </div>

              {(selectedProblem.testCases || []).length === 0 ? (
                <p className="text-sm text-gray-400 italic">No test cases yet.</p>
              ) : (
                <ul className="space-y-2">
                  {(selectedProblem.testCases || []).map((tc, idx) => (
                    <li key={idx} className="flex items-start justify-between bg-gray-50 rounded-lg p-3 border border-gray-200 group hover:border-indigo-200 transition-colors">
                      <div className="text-xs font-mono text-gray-700 leading-relaxed">
                        <span className="text-gray-400">in:</span> {String(tc.input).substring(0, 80)}{String(tc.input).length > 80 ? '…' : ''}
                        <br />
                        <span className="text-gray-400">out:</span> {String(tc.expectedOutput).substring(0, 80)}{String(tc.expectedOutput).length > 80 ? '…' : ''}
                        {tc.isHidden && <span className="ml-2 px-1 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">hidden</span>}
                      </div>
                      <button
                        onClick={() => removeExisting(idx)}
                        disabled={saving}
                        className="ml-3 text-red-400 hover:text-red-600 transition-colors text-sm flex-shrink-0 disabled:opacity-40"
                        title="Remove"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Step 2: Add new test cases */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Step 2 — Add New Test Cases</h3>

              <label className="block text-xs font-medium text-gray-600 mb-1">
                Test Case JSON <span className="text-gray-400 font-normal">(input and expectedOutput are required; isHidden optional)</span>
              </label>
              <textarea
                value={newTcText}
                onChange={e => setNewTcText(e.target.value)}
                placeholder='{"input": "4\n2 7 11 15\n9", "expectedOutput": "0 1", "isHidden": false}'
                rows={3}
                className="w-full p-3 font-mono text-sm border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors resize-y"
              />
              <button
                onClick={addPendingTc}
                className="mt-2 px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
              >
                + Stage Test Case
              </button>

              {pendingTcs.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Staged ({pendingTcs.length}) — not saved yet
                  </p>
                  <ul className="space-y-2">
                    {pendingTcs.map((tc, idx) => (
                      <li key={idx} className="flex items-start justify-between bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                        <div className="text-xs font-mono text-gray-700 leading-relaxed">
                          <span className="text-gray-400">in:</span> {String(tc.input).substring(0, 80)}<br />
                          <span className="text-gray-400">out:</span> {String(tc.expectedOutput).substring(0, 80)}
                          {tc.isHidden && <span className="ml-2 px-1 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">hidden</span>}
                        </div>
                        <button onClick={() => removePending(idx)} className="ml-3 text-red-400 hover:text-red-600 text-sm flex-shrink-0">✕</button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving || pendingTcs.length === 0}
                className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm"
              >
                {saving ? 'Saving...' : `Save ${pendingTcs.length} Test Case(s)`}
              </button>
              <button
                onClick={() => navigate('/admin')}
                className="px-6 py-2.5 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
              >
                Back to Admin
              </button>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default AddTestcases;

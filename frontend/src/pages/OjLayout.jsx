import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import CodeMirror from '@uiw/react-codemirror';
import ReactMarkdown from 'react-markdown';
import { cpp } from '@codemirror/lang-cpp';
import { python } from '@codemirror/lang-python';

const OjLayout = () => {
  const { id } = useParams();
  const [problem, setProblem] = useState(null);
  const [activeTab, setActiveTab] = useState('code');
  const [leftWidth, setLeftWidth] = useState('50%');
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  const [code, setCode] = useState('');
  const [inp, setInp] = useState('');
  const [output, setOutput] = useState('');
  const [verdict, setVerdict] = useState(null);
  const [aiReview, setAireview] = useState('');
  const [language, setLanguage] = useState('cpp');
  const [submitting, setSubmitting] = useState(false);
  const [running, setRunning] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const [debugging, setDebugging] = useState(false);
  const [debugError, setDebugError] = useState('');
  const [debugSuggestion, setDebugSuggestion] = useState('');

  const getLanguageExtension = (lang) => {
    switch (lang) {
      case 'cpp': return cpp();
      case 'python': return python();
      case 'c': return cpp(); // C uses same syntax highlighting as C++
      default: return cpp();
    }
  };

  // Fetch problem details
  useEffect(() => {
    const loadProblem = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/problems/${id}`);
        const prob = response.data.data?.problem;
        setProblem(prob);
        if (prob?.boilerplateCode?.[language]) {
          setCode(prob.boilerplateCode[language]);
        }
      } catch (err) {
        console.error("Error loading problem", err);
      }
    };
    if (id) loadProblem();
  }, [id]);

  useEffect(() => {
    if (problem?.boilerplateCode?.[language]) {
      setCode(problem.boilerplateCode[language]);
    }
  }, [language]);

  // Draggable splitter handlers
  const handleMouseDown = () => {
    setIsDragging(true);
    document.body.style.cursor = 'col-resize';
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      if (newLeftWidth > 20 && newLeftWidth < 80) {
        setLeftWidth(`${newLeftWidth}%`);
      }
    };
    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
    };
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Submit code to execution service
  const handleSubmit = async () => {
    setSubmitting(true);
    setOutput('Submitting...');
    setVerdict(null);
    try {
      const userId = localStorage.getItem('userId');
      const username = localStorage.getItem('username') || '';
      const response = await axios.post(`${import.meta.env.VITE_EXEC_URL}/api/submissions`, {
        userId,
        problemId: id,
        language,
        sourceCode: code,
        testCases: problem?.testCases || [],
        username,
        problemTitle: problem?.title || '',
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      const submission = response.data.data?.submission;
      if (submission) {
        setVerdict(submission);
        setOutput(
          `Status: ${submission.status}\n` +
          `Execution Time: ${submission.executionTime || 0}ms\n` +
          `Memory Used: ${submission.memoryUsed || 0}KB`
        );
        // Auto-switch to verdict tab to show details
        setActiveTab('verdict');
      } else {
        setOutput(response.data.message || 'Submitted successfully');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Error submitting code';
      const errDetail = err.response?.data?.errors ? `\n${err.response.data.errors.join('\n')}` : '';
      setOutput(`Error: ${errMsg}${errDetail}`);
      setVerdict({ status: 'Runtime Error', error: errMsg, totalTestCases: 0 });
      setActiveTab('verdict');
    } finally {
      setSubmitting(false);
    }
  };

  // Run code (first test case only)
  const handleRun = async () => {
    setRunning(true);
    setOutput('Running...');
    setVerdict(null);
    try {
      const userId = localStorage.getItem('userId');
      const username = localStorage.getItem('username') || '';
      const response = await axios.post(`${import.meta.env.VITE_EXEC_URL}/api/submissions`, {
        userId,
        problemId: id,
        language,
        sourceCode: code,
        testCases: problem?.testCases?.slice(0, 1) || [],
        username,
        problemTitle: problem?.title || '',
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      const submission = response.data.data?.submission;
      if (submission) {
        setVerdict(submission);
        setOutput(`Status: ${submission.status}\nExecution Time: ${submission.executionTime || 0}ms`);
        setActiveTab('verdict');
      } else {
        setOutput(response.data.message || 'Run complete');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Error running code';
      setOutput(`Error: ${errMsg}`);
      setVerdict({ status: 'Runtime Error', error: errMsg, totalTestCases: 0 });
      setActiveTab('verdict');
    } finally {
      setRunning(false);
    }
  };

  // AI Explain
  const handleExplain = async () => {
    setExplaining(true);
    setAireview('Generating explanation...');
    try {
      const response = await axios.post(`${import.meta.env.VITE_EXEC_URL}/api/submissions/explain`, {
        sourceCode: code,
        language
      });
      setAireview(response.data.data?.explanation || response.data.message || 'No explanation generated');
    } catch (err) {
      setAireview(err.response?.data?.message || 'Error generating explanation');
    } finally {
      setExplaining(false);
    }
  };

  // AI Debug
  const handleDebug = async () => {
    setDebugging(true);
    setDebugSuggestion('Analyzing code...');
    try {
      const response = await axios.post(`${import.meta.env.VITE_EXEC_URL}/api/submissions/debug`, {
        sourceCode: code,
        language,
        error: debugError || 'Code produces unexpected output'
      });
      setDebugSuggestion(response.data.data?.suggestion || response.data.message || 'No suggestion generated');
    } catch (err) {
      setDebugSuggestion(err.response?.data?.message || 'Error generating debug suggestion');
    } finally {
      setDebugging(false);
    }
  };

  // Verdict status styling
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Accepted': return 'bg-green-100 text-green-800 border-green-300';
      case 'Wrong Answer': return 'bg-red-100 text-red-800 border-red-300';
      case 'Time Limit Exceeded': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Runtime Error': return 'bg-red-100 text-red-800 border-red-300';
      case 'Compilation Error': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Pending': return 'bg-gray-100 text-gray-600 border-gray-300';
      default: return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Accepted': return '✅';
      case 'Wrong Answer': return '❌';
      case 'Time Limit Exceeded': return '⏱️';
      case 'Runtime Error': return '💥';
      case 'Compilation Error': return '🔧';
      default: return '⏳';
    }
  };

  if (!problem) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-indigo-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-gray-500">Loading problem...</span>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex h-[calc(100vh-64px)] w-full overflow-hidden relative">
      {/* Problem Panel (Left) */}
      <div className="h-full overflow-auto p-6 bg-white" style={{ width: leftWidth }}>
        <h1 className="text-2xl font-bold mb-2 text-gray-900">{problem.title || "Untitled Problem"}</h1>

        <div className="flex items-center gap-3 mb-4">
          <span className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full ${
            problem.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
            problem.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {problem.difficulty || "N/A"}
          </span>
          {(problem.tags || []).map((tag, i) => (
            <span key={i} className="px-2 py-0.5 text-xs bg-indigo-50 text-indigo-700 rounded-md">
              {tag}
            </span>
          ))}
        </div>

        <div className="prose max-w-none">
          <div className="mb-4 text-gray-700 leading-relaxed whitespace-pre-wrap">
            {problem.description || "No description available."}
          </div>

          {problem.constraints && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2 text-gray-800">Constraints</h3>
              <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-700 font-mono">
                {problem.constraints}
              </div>
            </div>
          )}

          <h3 className="text-lg font-semibold mt-6 mb-2 text-gray-800">Examples</h3>
          {problem.testCases && problem.testCases.length > 0 ? (
            problem.testCases.filter(tc => !tc.isHidden).map((tc, idx) => (
              <div key={idx} className="bg-gray-50 p-4 rounded-md my-2 border border-gray-200">
                <p className="font-medium text-gray-800 mb-3">Example {idx + 1}:</p>
                <div className="mb-2">
                  <span className="text-sm font-medium text-gray-700">Input:</span>
                  <pre className="bg-gray-100 px-3 py-2 rounded text-sm font-mono mt-1 whitespace-pre-wrap">{tc.input}</pre>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Output:</span>
                  <pre className="bg-gray-100 px-3 py-2 rounded text-sm font-mono mt-1 whitespace-pre-wrap">{tc.expectedOutput}</pre>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No examples provided.</p>
          )}
        </div>
      </div>

      {/* Resizable Splitter */}
      <div
        className="w-1.5 bg-gray-200 hover:bg-indigo-400 cursor-col-resize transition-colors flex-shrink-0"
        onMouseDown={handleMouseDown}
      />

      {/* Code/Verdict Panel (Right) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-white">
          <button
            className={`px-4 py-2.5 font-medium text-sm transition-colors ${activeTab === 'code' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('code')}
          >
            Code
          </button>
          <button
            className={`px-4 py-2.5 font-medium text-sm transition-colors ${activeTab === 'verdict' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('verdict')}
          >
            Run & Test
          </button>
          <button
            className={`px-4 py-2.5 font-medium text-sm transition-colors ${activeTab === 'ai' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('ai')}
          >
            AI Assist
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'code' && (
            <div className="h-full flex flex-col">
              <div className="p-2 border-b border-gray-200 bg-gray-50 flex items-center gap-2 flex-wrap">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                >
                  <option value="cpp">C++</option>
                  <option value="python">Python</option>
                  <option value="c">C</option>
                </select>

                <button
                  onClick={handleRun}
                  disabled={running}
                  className="px-4 py-1.5 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  {running ? '⏳ Running...' : '▶ Run'}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  {submitting ? '⏳ Submitting...' : '🚀 Submit'}
                </button>
              </div>

              <div className="flex-1 overflow-auto rounded-md border min-h-0">
                <CodeMirror
                  value={code}
                  height="100%"
                  extensions={[getLanguageExtension(language)]}
                  onChange={setCode}
                  placeholder={`Write your ${language.toUpperCase()} code here...`}
                />
              </div>
            </div>
          )}

          {activeTab === 'verdict' && (
            <div className="h-full p-4 overflow-auto bg-gray-50 font-mono text-sm space-y-4">
              <h3 className="text-base font-semibold text-gray-700 font-sans">Code Execution</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleRun}
                  disabled={running}
                  className="px-4 py-1.5 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {running ? '⏳ Running...' : '▶ Run'}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? '⏳ Submitting...' : '🚀 Submit'}
                </button>
              </div>

              {/* Verdict Banner */}
              {verdict && (
                <div className={`rounded-lg border p-4 ${getStatusStyle(verdict.status)}`}>
                  <div className="flex items-center gap-2 font-sans">
                    <span className="text-xl">{getStatusIcon(verdict.status)}</span>
                    <span className="text-lg font-bold">{verdict.status}</span>
                  </div>
                  <div className="mt-2 text-sm font-sans space-y-1">
                    {verdict.totalTestCases > 0 && (
                      <p>
                        Test Cases: {verdict.failedTestCase !== null && verdict.failedTestCase !== undefined
                          ? `${verdict.failedTestCase - 1}/${verdict.totalTestCases} passed`
                          : `${verdict.totalTestCases}/${verdict.totalTestCases} passed`}
                      </p>
                    )}
                    {verdict.executionTime > 0 && <p>Execution Time: {verdict.executionTime}ms</p>}
                    {verdict.memoryUsed > 0 && <p>Memory Used: {verdict.memoryUsed}KB</p>}
                  </div>
                </div>
              )}

              {/* Test Case Progress Indicators */}
              {verdict && verdict.totalTestCases > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-600 font-sans">Test Case Results</h4>
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: verdict.totalTestCases }, (_, i) => {
                      const tcNum = i + 1;
                      const passed = verdict.status === 'Accepted' ||
                        (verdict.failedTestCase !== null && verdict.failedTestCase !== undefined && tcNum < verdict.failedTestCase);
                      const failed = verdict.failedTestCase === tcNum;
                      const notReached = verdict.failedTestCase !== null && verdict.failedTestCase !== undefined && tcNum > verdict.failedTestCase;

                      let bg = 'bg-gray-200 text-gray-500';
                      let icon = '—';
                      if (passed) { bg = 'bg-green-100 text-green-700 border border-green-300'; icon = '✓'; }
                      if (failed) { bg = 'bg-red-100 text-red-700 border border-red-300'; icon = '✗'; }
                      if (notReached) { bg = 'bg-gray-100 text-gray-400 border border-gray-200'; icon = '—'; }

                      return (
                        <div key={i} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold font-sans ${bg}`}>
                          <span>{icon}</span>
                          <span>TC {tcNum}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Compilation Error */}
              {verdict && verdict.status === 'Compilation Error' && verdict.error && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-yellow-700 font-sans">🔧 Compile Error</h4>
                  <pre className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-900 overflow-auto max-h-48 whitespace-pre-wrap">
                    {verdict.error}
                  </pre>
                </div>
              )}

              {/* Runtime Error */}
              {verdict && verdict.status === 'Runtime Error' && verdict.error && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-red-700 font-sans">💥 Runtime Error</h4>
                  <pre className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-900 overflow-auto max-h-48 whitespace-pre-wrap">
                    {verdict.error}
                  </pre>
                </div>
              )}

              {/* Wrong Answer: Actual vs Expected */}
              {verdict && verdict.status === 'Wrong Answer' && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-red-700 font-sans">
                    ❌ Wrong Answer on Test Case {verdict.failedTestCase}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 font-sans mb-1">Your Output</p>
                      <pre className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs overflow-auto max-h-40 whitespace-pre-wrap">
                        {verdict.output || '(empty)'}
                      </pre>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 font-sans mb-1">Expected Output</p>
                      <pre className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs overflow-auto max-h-40 whitespace-pre-wrap">
                        {verdict.expectedOutput || '(empty)'}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* TLE details */}
              {verdict && verdict.status === 'Time Limit Exceeded' && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-orange-700 font-sans">
                    ⏱️ Time Limit Exceeded on Test Case {verdict.failedTestCase}
                  </h4>
                  <p className="text-xs text-orange-600 font-sans">
                    Your code took too long to execute. Try optimizing your solution.
                  </p>
                </div>
              )}

              {/* Input Section */}
              <div className="space-y-2">
                <label htmlFor="inputArea" className="text-gray-600 font-medium font-sans">Custom Input</label>
                <textarea
                  id="inputArea"
                  value={inp}
                  onChange={(e) => setInp(e.target.value)}
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors"
                  placeholder="Enter custom input..."
                />
              </div>

              {/* Raw Output Section */}
              {!verdict && (
                <div className="space-y-2">
                  <label className="text-gray-600 font-medium font-sans">Output</label>
                  <div className="w-full min-h-[100px] max-h-48 overflow-auto bg-white border border-gray-300 rounded-lg p-3 whitespace-pre-wrap">
                    {output ? output : "Run your code to see the output"}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="h-full p-4 overflow-auto bg-gray-50 space-y-5">
              {/* AI Explain */}
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-gray-700">AI Code Explain</h3>
                <button
                  onClick={handleExplain}
                  disabled={explaining}
                  className="px-4 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {explaining ? '⏳ Explaining...' : '💡 Explain Code'}
                </button>
                <div className="w-full min-h-[80px] max-h-48 overflow-auto bg-white border border-gray-300 rounded-lg p-3">
                  {aiReview ? <ReactMarkdown>{aiReview}</ReactMarkdown> : <span className="text-gray-400 text-sm">Click &quot;Explain Code&quot; to get an AI explanation</span>}
                </div>
              </div>

              {/* AI Debug */}
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-gray-700">AI Debug</h3>
                <div className="space-y-2">
                  <textarea
                    value={debugError}
                    onChange={(e) => setDebugError(e.target.value)}
                    className="w-full h-20 p-3 border border-gray-300 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                    placeholder="Describe the error or unexpected behavior..."
                  />
                  <button
                    onClick={handleDebug}
                    disabled={debugging}
                    className="px-4 py-1.5 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                  >
                    {debugging ? '⏳ Debugging...' : '🐛 Debug Code'}
                  </button>
                </div>
                <div className="w-full min-h-[80px] max-h-48 overflow-auto bg-white border border-gray-300 rounded-lg p-3">
                  {debugSuggestion ? <ReactMarkdown>{debugSuggestion}</ReactMarkdown> : <span className="text-gray-400 text-sm">Describe an error and click &quot;Debug Code&quot; to get suggestions</span>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OjLayout;

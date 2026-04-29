import { useState } from 'react';
import axios from 'axios';
import CodeMirror from '@uiw/react-codemirror';
import ReactMarkdown from 'react-markdown';
import { cpp } from '@codemirror/lang-cpp';
import { python } from '@codemirror/lang-python';
import Header from './Header';
import Footer from './Footer';

const AITools = () => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [errorText, setErrorText] = useState('');
  const [explanation, setExplanation] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [explaining, setExplaining] = useState(false);
  const [debugging, setDebugging] = useState(false);
  const [activeTab, setActiveTab] = useState('explain');

  const getLanguageExtension = (lang) => {
    switch (lang) {
      case 'cpp': return cpp();
      case 'python': return python();
      case 'java': return cpp();
      default: return python();
    }
  };

  const handleExplain = async () => {
    if (!code.trim()) return;
    setExplaining(true);
    setExplanation('Generating explanation...');
    try {
      const response = await axios.post(`${import.meta.env.VITE_EXEC_URL}/api/submissions/explain`, {
        sourceCode: code,
        language: language
      });
      setExplanation(response.data.data?.explanation || response.data.message || 'No explanation generated');
    } catch (err) {
      setExplanation(err.response?.data?.message || 'Error generating explanation');
    } finally {
      setExplaining(false);
    }
  };

  const handleDebug = async () => {
    if (!code.trim()) return;
    setDebugging(true);
    setSuggestion('Analyzing code...');
    try {
      const response = await axios.post(`${import.meta.env.VITE_EXEC_URL}/api/submissions/debug`, {
        sourceCode: code,
        language: language,
        error: errorText || 'Code produces unexpected output'
      });
      setSuggestion(response.data.data?.suggestion || response.data.message || 'No suggestion generated');
    } catch (err) {
      setSuggestion(err.response?.data?.message || 'Error generating suggestion');
    } finally {
      setDebugging(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow p-4 md:p-8 max-w-5xl mx-auto w-full">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">AI Tools</h2>

        {/* Language Selector + Code Editor */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="p-3 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
            <label className="text-sm font-medium text-gray-600">Language:</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            >
              <option value="cpp">C++</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
            </select>
          </div>
          <div className="h-64">
            <CodeMirror
              value={code}
              height="100%"
              extensions={[getLanguageExtension(language)]}
              onChange={setCode}
              placeholder={`Paste your ${language} code here...`}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-4">
          <button
            className={`px-5 py-2.5 font-medium text-sm transition-colors ${activeTab === 'explain' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('explain')}
          >
            💡 Explain Code
          </button>
          <button
            className={`px-5 py-2.5 font-medium text-sm transition-colors ${activeTab === 'debug' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('debug')}
          >
            🐛 Debug Code
          </button>
        </div>

        {/* Explain Tab */}
        {activeTab === 'explain' && (
          <div className="space-y-4">
            <button
              onClick={handleExplain}
              disabled={explaining || !code.trim()}
              className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {explaining ? '⏳ Explaining...' : '💡 Explain Code'}
            </button>
            <div className="bg-white rounded-lg shadow p-5 min-h-[120px]">
              {explanation ? (
                <div className="prose max-w-none text-sm">
                  <ReactMarkdown>{explanation}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-gray-400 text-sm">Paste some code above and click &quot;Explain Code&quot; to get an AI-powered explanation.</p>
              )}
            </div>
          </div>
        )}

        {/* Debug Tab */}
        {activeTab === 'debug' && (
          <div className="space-y-4">
            <div>
              <label className="block mb-1.5 text-sm font-medium text-gray-700">Error Description</label>
              <textarea
                value={errorText}
                onChange={(e) => setErrorText(e.target.value)}
                className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                placeholder="Describe the error or unexpected behavior, e.g. 'Function returns wrong result for add(2,3), expected 5 got -1'"
              />
            </div>
            <button
              onClick={handleDebug}
              disabled={debugging || !code.trim()}
              className="px-5 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {debugging ? '⏳ Debugging...' : '🐛 Debug Code'}
            </button>
            <div className="bg-white rounded-lg shadow p-5 min-h-[120px]">
              {suggestion ? (
                <div className="prose max-w-none text-sm">
                  <ReactMarkdown>{suggestion}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-gray-400 text-sm">Paste code and describe the error to get AI-powered debug suggestions.</p>
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default AITools;

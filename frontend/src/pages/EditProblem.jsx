import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import Footer from './Footer';

const EditProblem = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [difficulty, setDifficulty] = useState('Easy');
    const [tags, setTags] = useState('');
    const [constraints, setConstraints] = useState('');
    const [testCases, setTestCases] = useState([]);
    const [newTestCaseText, setNewTestCaseText] = useState('{"input": "", "expectedOutput": ""}');
    const [boilerplateCpp, setBoilerplateCpp] = useState('');
    const [boilerplatePython, setBoilerplatePython] = useState('');
    const [boilerplateJava, setBoilerplateJava] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        const role = localStorage.getItem('role');
        if (role !== 'problem_setter' && role !== 'admin') {
            alert('Unauthorized! Only problem setters and admins can edit problems.');
            navigate(-1);
            return;
        }
        fetchProblem();
    }, [id]);

    const fetchProblem = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/problems/${id}`);
            const p = res.data.data?.problem;
            setTitle(p.title || '');
            setDescription(p.description || '');
            setDifficulty(p.difficulty || 'Easy');
            setTags((p.tags || []).join(', '));
            setConstraints(p.constraints || '');
            setTestCases(p.testCases || []);
            setBoilerplateCpp(p.boilerplateCode?.cpp || '');
            setBoilerplatePython(p.boilerplateCode?.python || '');
            setBoilerplateJava(p.boilerplateCode?.java || '');
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to load problem.' });
        } finally {
            setLoading(false);
        }
    };

    const addTestCase = () => {
        try {
            const newItem = JSON.parse(newTestCaseText);
            if (!newItem.input === undefined || !newItem.expectedOutput === undefined) {
                alert('Test case must have "input" and "expectedOutput" fields');
                return;
            }
            setTestCases(prev => [...prev, newItem]);
            setNewTestCaseText('{"input": "", "expectedOutput": ""}');
        } catch {
            alert('Invalid JSON format');
        }
    };

    const removeTestCase = (idx) => {
        setTestCases(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSave = async () => {
        if (!title || !description || !difficulty) {
            setMessage({ type: 'error', text: 'Title, description, and difficulty are required.' });
            return;
        }
        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            const token = localStorage.getItem('token');
            const tagsArray = tags.split(',').map(t => t.trim()).filter(t => t);
            await axios.put(
                `${import.meta.env.VITE_API_URL}/api/problems/${id}`,
                {
                    title,
                    description,
                    difficulty,
                    tags: tagsArray,
                    constraints,
                    testCases,
                    boilerplateCode: { cpp: boilerplateCpp, python: boilerplatePython, java: boilerplateJava },
                },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            setMessage({ type: 'success', text: 'Problem updated successfully!' });
            setTimeout(() => navigate(`/problem/${id}`), 1500);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Error updating problem' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-grow flex items-center justify-center">
                    <svg className="animate-spin h-8 w-8 text-indigo-600" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />
            <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full">
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Edit Problem</h2>
                        <p className="text-xs text-gray-400 mt-0.5">ID: {id}</p>
                    </div>
                </div>

                {message.text && (
                    <div className={`mb-5 p-3 rounded-lg text-sm font-medium ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                        {message.text}
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
                    {/* Title */}
                    <div>
                        <label className="block mb-1.5 font-semibold text-gray-700 text-sm">
                            Problem Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
                            placeholder="e.g. Two Sum"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block mb-1.5 font-semibold text-gray-700 text-sm">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full p-4 text-sm border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors resize-y"
                            placeholder="Markdown supported..."
                            rows={7}
                        />
                    </div>

                    {/* Difficulty & Tags */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block mb-1.5 font-semibold text-gray-700 text-sm">
                                Difficulty <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value)}
                                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
                            >
                                <option value="Easy">Easy</option>
                                <option value="Medium">Medium</option>
                                <option value="Hard">Hard</option>
                            </select>
                        </div>
                        <div>
                            <label className="block mb-1.5 font-semibold text-gray-700 text-sm">Tags (comma-separated)</label>
                            <input
                                type="text"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
                                placeholder="e.g. array, hash-map"
                            />
                        </div>
                    </div>

                    {/* Constraints */}
                    <div>
                        <label className="block mb-1.5 font-semibold text-gray-700 text-sm">Constraints</label>
                        <textarea
                            value={constraints}
                            onChange={(e) => setConstraints(e.target.value)}
                            className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors resize-y"
                            placeholder="e.g. 1 <= n <= 10^5"
                            rows={3}
                        />
                    </div>

                    {/* Test Cases */}
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="font-semibold text-gray-700 text-sm mb-3">Test Cases ({testCases.length})</p>
                        {testCases.length > 0 && (
                            <ul className="space-y-2 mb-4">
                                {testCases.map((tc, idx) => (
                                    <li key={idx} className="flex items-start justify-between bg-white p-3 rounded-lg border border-gray-200 hover:border-indigo-200 transition-colors">
                                        <div className="text-xs font-mono text-gray-700">
                                            <span className="text-gray-400">in:</span> {String(tc.input).substring(0, 60)}{String(tc.input).length > 60 ? '…' : ''}<br />
                                            <span className="text-gray-400">out:</span> {String(tc.expectedOutput).substring(0, 60)}{String(tc.expectedOutput).length > 60 ? '…' : ''}
                                        </div>
                                        <button
                                            onClick={() => removeTestCase(idx)}
                                            className="ml-3 text-red-400 hover:text-red-600 transition-colors text-sm flex-shrink-0"
                                        >
                                            ✕
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <label className="block mb-1 text-xs font-medium text-gray-600">Add Test Case (JSON)</label>
                        <textarea
                            value={newTestCaseText}
                            onChange={(e) => setNewTestCaseText(e.target.value)}
                            placeholder='{"input": "4\n2 7 11 15\n9", "expectedOutput": "0 1"}'
                            rows={3}
                            className="w-full p-3 font-mono text-xs border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors resize-y"
                        />
                        <button
                            onClick={addTestCase}
                            className="mt-2 px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                            + Add Test Case
                        </button>
                    </div>

                    {/* Boilerplate Code */}
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="font-semibold text-gray-700 text-sm mb-3">Boilerplate Code (optional)</p>
                        <div className="space-y-4">
                            {[['C++', boilerplateCpp, setBoilerplateCpp, '#include<iostream>\nusing namespace std;\nint main(){}'],
                              ['Python', boilerplatePython, setBoilerplatePython, 'def solve():\n    pass'],
                              ['Java', boilerplateJava, setBoilerplateJava, 'class Solution { }']].map(([lang, val, setter, ph]) => (
                                <div key={lang}>
                                    <label className="block mb-1 text-xs font-medium text-gray-600">{lang}</label>
                                    <textarea
                                        value={val}
                                        onChange={(e) => setter(e.target.value)}
                                        className="w-full p-3 font-mono text-sm border border-gray-300 rounded-lg resize-y focus:ring-2 focus:ring-indigo-400 transition-colors"
                                        placeholder={ph}
                                        rows={3}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-5 flex gap-3">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-6 py-2.5 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        Cancel
                    </button>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default EditProblem;

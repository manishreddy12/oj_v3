import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import Footer from './Footer';

const CreateProblem = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [difficulty, setDifficulty] = useState('Easy');
    const [tags, setTags] = useState('');
    const [constraints, setConstraints] = useState('');
    const [newTestCaseText, setNewTestCaseText] = useState('{"input": "4\\n2 7 11 15\\n9", "expectedOutput": "0 1"}');
    const [testCases, setTestCases] = useState([]);
    const [boilerplateCpp, setBoilerplateCpp] = useState('');
    const [boilerplatePython, setBoilerplatePython] = useState('');
    const [boilerplateJava, setBoilerplateJava] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const navigate = useNavigate();

    useEffect(() => {
        const role = localStorage.getItem('role');
        if (role !== 'problem_setter' && role !== 'admin') {
            alert('You are unauthorized! Only problem setters and admins can create problems.');
            navigate(-1);
        }
    }, []);

    const addTestCase = () => {
        try {
            const newItem = JSON.parse(newTestCaseText);
            if (!newItem.input || !newItem.expectedOutput) {
                alert('Test case must have "input" and "expectedOutput" fields');
                return;
            }
            setTestCases(prev => [...prev, newItem]);
            setNewTestCaseText('');
        } catch (error) {
            alert("Invalid JSON format");
        }
    };

    const removeTestCase = (idx) => {
        setTestCases(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = async () => {
        if (!title || !description || !difficulty || testCases.length === 0) {
            setMessage({ type: 'error', text: 'Title, description, difficulty, and at least one test case are required.' });
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const tagsArray = tags.split(',').map(t => t.trim()).filter(t => t);

            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/problems`,
                {
                    title,
                    description,
                    difficulty,
                    tags: tagsArray,
                    constraints,
                    testCases,
                    boilerplateCode: {
                        cpp: boilerplateCpp,
                        python: boilerplatePython,
                        java: boilerplateJava
                    }
                },
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
            setMessage({ type: 'success', text: response.data.message || 'Problem created successfully!' });
            // Reset form
            setTitle(''); setDescription(''); setDifficulty('Easy'); setTags('');
            setConstraints(''); setTestCases([]); setBoilerplateCpp('');
            setBoilerplatePython(''); setBoilerplateJava('');
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Error creating problem' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className='flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full'>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Create New Problem</h2>

                {message.text && (
                    <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                        {message.text}
                    </div>
                )}

                {/* Title */}
                <div className="mb-5">
                    <label className="block mb-1.5 font-semibold text-gray-700" htmlFor="title-input">
                        Problem Title <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="title-input"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
                        placeholder="e.g. Two Sum"
                    />
                </div>

                {/* Description */}
                <div className="mb-5">
                    <label className="block mb-1.5 font-semibold text-gray-700" htmlFor="description-textarea">
                        Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="description-textarea"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-4 text-sm border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors resize-y"
                        placeholder="Describe the problem in detail..."
                        rows={6}
                    />
                </div>

                {/* Difficulty & Tags */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                    <div>
                        <label className="block mb-1.5 font-semibold text-gray-700" htmlFor="difficulty-select">
                            Difficulty <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="difficulty-select"
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
                        <label className="block mb-1.5 font-semibold text-gray-700" htmlFor="tags-input">
                            Tags (comma-separated)
                        </label>
                        <input
                            id="tags-input"
                            type="text"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
                            placeholder="e.g. array, hash-map, two-pointer"
                        />
                    </div>
                </div>

                {/* Constraints */}
                <div className="mb-5">
                    <label className="block mb-1.5 font-semibold text-gray-700" htmlFor="constraints-input">
                        Constraints
                    </label>
                    <textarea
                        id="constraints-input"
                        value={constraints}
                        onChange={(e) => setConstraints(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors resize-y"
                        placeholder="e.g. 2 <= nums.length <= 10^4"
                        rows={3}
                    />
                </div>

                {/* Test Cases */}
                <div className="mb-5 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <label htmlFor="testcase-textarea" className="block mb-1.5 font-semibold text-gray-700">
                        Add Test Case (JSON) <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="testcase-textarea"
                        value={newTestCaseText}
                        onChange={(e) => setNewTestCaseText(e.target.value)}
                        placeholder='{"input": "1 2", "expectedOutput": "3"}'
                        rows={3}
                        className="w-full p-3 font-mono text-sm border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors resize-y"
                    />
                    <button onClick={addTestCase} className="mt-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors">
                        + Add Test Case
                    </button>

                    <div className="mt-4">
                        <p className="font-semibold text-gray-700 mb-2">Test Cases ({testCases.length})</p>
                        {testCases.length === 0 ? (
                            <p className="text-sm text-gray-500">No test cases added yet.</p>
                        ) : (
                            <ul className="space-y-2">
                                {testCases.map((tc, idx) => (
                                    <li key={idx} className="flex items-start justify-between bg-white p-3 rounded-md border border-gray-200">
                                        <div className="text-sm font-mono">
                                            <span className="text-gray-500">Input:</span> <code>{tc.input}</code>
                                            <br />
                                            <span className="text-gray-500">Expected:</span> <code>{tc.expectedOutput}</code>
                                        </div>
                                        <button onClick={() => removeTestCase(idx)} className="text-red-500 hover:text-red-700 text-sm ml-3">
                                            ✕
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Boilerplate Code */}
                <div className="mb-5 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="font-semibold text-gray-700 mb-3">Boilerplate Code (optional)</p>
                    <div className="space-y-4">
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-600">C++</label>
                            <textarea
                                value={boilerplateCpp}
                                onChange={(e) => setBoilerplateCpp(e.target.value)}
                                className="w-full p-3 font-mono text-sm border border-gray-300 rounded-lg resize-y focus:ring-2 focus:ring-indigo-400 transition-colors"
                                placeholder="#include<iostream>\nusing namespace std;\nint main(){}"
                                rows={3}
                            />
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-600">Python</label>
                            <textarea
                                value={boilerplatePython}
                                onChange={(e) => setBoilerplatePython(e.target.value)}
                                className="w-full p-3 font-mono text-sm border border-gray-300 rounded-lg resize-y focus:ring-2 focus:ring-indigo-400 transition-colors"
                                placeholder="def solve():\n    pass"
                                rows={3}
                            />
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium text-gray-600">Java</label>
                            <textarea
                                value={boilerplateJava}
                                onChange={(e) => setBoilerplateJava(e.target.value)}
                                className="w-full p-3 font-mono text-sm border border-gray-300 rounded-lg resize-y focus:ring-2 focus:ring-indigo-400 transition-colors"
                                placeholder="class Solution { }"
                                rows={3}
                            />
                        </div>
                    </div>
                </div>

                {/* Submit */}
                <div className="mt-6">
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Creating...' : 'Create Problem'}
                    </button>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default CreateProblem;
import React, { useState, useEffect } from 'react'
import axios from 'axios';
import Header from './Header';
import Footer from './Footer';
import { useNavigate, Link } from 'react-router-dom';

export const Admin = () => {
    const [users, setUsers] = useState([]);
    const [problems, setProblems] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [loadingProblems, setLoadingProblems] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [editingUser, setEditingUser] = useState(null);
    const [newRole, setNewRole] = useState('student');
    const [problemSearch, setProblemSearch] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        const role = localStorage.getItem('role');
        if (role !== 'admin') {
            alert('Admin access only!');
            navigate(-1);
            return;
        }
        fetchUsers();
        fetchProblems();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoadingUsers(true);
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setUsers(res.data.data?.users || []);
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoadingUsers(false);
        }
    };

    const fetchProblems = async () => {
        try {
            setLoadingProblems(true);
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/problems?limit=200`);
            setProblems(res.data.data?.problems || []);
        } catch (err) {
            console.error('Error fetching problems:', err);
        } finally {
            setLoadingProblems(false);
        }
    };

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    };

    const handleDeleteProblem = async (id, title) => {
        if (!confirm(`Delete "${title}"? This action cannot be undone.`)) return;
        setDeletingId(id);
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/problems/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setProblems(prev => prev.filter(p => p._id !== id));
            showMessage('success', `"${title}" deleted successfully.`);
        } catch (err) {
            showMessage('error', err.response?.data?.message || 'Error deleting problem');
        } finally {
            setDeletingId(null);
        }
    };

    const handleUpdateRole = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${import.meta.env.VITE_API_URL}/api/users/${userId}`, {
                role: newRole
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            showMessage('success', 'User role updated successfully!');
            setEditingUser(null);
            fetchUsers();
        } catch (err) {
            showMessage('error', err.response?.data?.message || 'Error updating user');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/users/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            showMessage('success', 'User deleted successfully!');
            fetchUsers();
        } catch (err) {
            showMessage('error', err.response?.data?.message || 'Error deleting user');
        }
    };

    const roleColor = (role) => {
        switch (role) {
            case 'admin': return 'bg-red-100 text-red-800';
            case 'problem_setter': return 'bg-purple-100 text-purple-800';
            case 'student': return 'bg-blue-100 text-blue-800';
            case 'guest': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const filteredProblems = problems.filter(p =>
        p.title?.toLowerCase().includes(problemSearch.toLowerCase())
    );

    const difficultyBadge = (d) => {
        if (d === 'Easy') return 'bg-green-100 text-green-800';
        if (d === 'Medium') return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />
            <main className="flex-grow p-4 md:p-8 max-w-6xl mx-auto w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Admin Panel</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Manage problems and users</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            to="/createproblem"
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create Problem
                        </Link>
                        <Link
                            to="/addtestcases"
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Manage Test Cases
                        </Link>
                    </div>
                </div>

                {message.text && (
                    <div className={`mb-5 p-3 rounded-lg text-sm font-medium shadow-sm ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                        {message.text}
                    </div>
                )}

                {/* Problem Management Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                    <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center gap-3">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-700">Problem Management</h3>
                            <p className="text-xs text-gray-400 mt-0.5">{problems.length} problems total</p>
                        </div>
                        <input
                            type="text"
                            placeholder="Search problems..."
                            value={problemSearch}
                            onChange={(e) => setProblemSearch(e.target.value)}
                            className="sm:ml-auto px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors w-full sm:w-56"
                        />
                    </div>

                    {loadingProblems ? (
                        <div className="flex justify-center py-10">
                            <svg className="animate-spin h-7 w-7 text-indigo-600" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Difficulty</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Tags</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {filteredProblems.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-10 text-center text-gray-400 text-sm">
                                                {problemSearch ? 'No problems match your search.' : 'No problems found.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredProblems.map((prob) => (
                                            <tr key={prob._id} className="hover:bg-indigo-50 transition-colors group">
                                                <td className="px-6 py-3 text-sm font-medium text-gray-900">
                                                    <Link to={`/problem/${prob._id}`} className="hover:text-indigo-600 transition-colors">
                                                        {prob.title}
                                                    </Link>
                                                </td>
                                                <td className="px-6 py-3 whitespace-nowrap">
                                                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${difficultyBadge(prob.difficulty)}`}>
                                                        {prob.difficulty}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 hidden md:table-cell">
                                                    <div className="flex flex-wrap gap-1">
                                                        {(prob.tags || []).slice(0, 3).map((t, i) => (
                                                            <span key={i} className="px-1.5 py-0.5 text-xs bg-indigo-50 text-indigo-700 rounded">
                                                                {t}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <Link
                                                            to={`/problems/${prob._id}/edit`}
                                                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors"
                                                        >
                                                            Edit
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDeleteProblem(prob._id, prob.title)}
                                                            disabled={deletingId === prob._id}
                                                            className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors disabled:opacity-50"
                                                        >
                                                            {deletingId === prob._id ? 'Deleting...' : 'Delete'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* User Management Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-5 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-700">User Management</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{users.length} users registered</p>
                    </div>

                    {loadingUsers ? (
                        <div className="flex justify-center py-10">
                            <svg className="animate-spin h-7 w-7 text-indigo-600" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {users.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-gray-400 text-sm">No users found.</td>
                                        </tr>
                                    ) : (
                                        users.map((user) => (
                                            <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold flex-shrink-0">
                                                            {user.username?.charAt(0).toUpperCase() || '?'}
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-900">{user.username}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {editingUser === user._id ? (
                                                        <div className="flex items-center gap-2">
                                                            <select
                                                                value={newRole}
                                                                onChange={(e) => setNewRole(e.target.value)}
                                                                className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-400"
                                                            >
                                                                <option value="student">student</option>
                                                                <option value="problem_setter">problem_setter</option>
                                                                <option value="admin">admin</option>
                                                                <option value="guest">guest</option>
                                                            </select>
                                                            <button onClick={() => handleUpdateRole(user._id)} className="text-green-600 hover:text-green-800 text-xs font-semibold transition-colors">Save</button>
                                                            <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600 text-xs transition-colors">Cancel</button>
                                                        </div>
                                                    ) : (
                                                        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${roleColor(user.role)}`}>
                                                            {user.role}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                                                    <button
                                                        onClick={() => { setEditingUser(user._id); setNewRole(user.role); }}
                                                        className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                                                    >
                                                        Edit Role
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(user._id)}
                                                        className="text-red-500 hover:text-red-700 font-medium transition-colors"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    )
}

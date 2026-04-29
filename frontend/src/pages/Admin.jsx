import React, { useState, useEffect } from 'react'
import axios from 'axios';
import Header from './Header';
import Footer from './Footer';
import { useNavigate } from 'react-router-dom';

export const Admin = () => {
    const [users, setUsers] = useState([]);
    const [problemId, setProblemId] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [editingUser, setEditingUser] = useState(null);
    const [newRole, setNewRole] = useState('student');

    const navigate = useNavigate();

    useEffect(() => {
        const role = localStorage.getItem('role');
        if (role !== 'admin') {
            alert('Admin access only!');
            navigate(-1);
            return;
        }
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setUsers(res.data.data?.users || []);
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProblem = async () => {
        if (!problemId) {
            setMessage({ type: 'error', text: 'Please enter a problem ID' });
            return;
        }
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/problems/${problemId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setMessage({ type: 'success', text: `Problem deleted successfully!` });
            setProblemId('');
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Error deleting problem' });
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
            setMessage({ type: 'success', text: 'User role updated successfully!' });
            setEditingUser(null);
            fetchUsers(); // Refresh user list
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Error updating user' });
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/users/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setMessage({ type: 'success', text: 'User deleted successfully!' });
            fetchUsers();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Error deleting user' });
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

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow p-4 md:p-8 max-w-6xl mx-auto w-full">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Admin Panel</h2>

                {message.text && (
                    <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                        {message.text}
                    </div>
                )}

                {/* Delete Problem Section */}
                <div className="bg-white rounded-lg shadow p-5 mb-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-3">Delete Problem</h3>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <input
                            type="text"
                            placeholder="Enter problem ID"
                            value={problemId}
                            onChange={(e) => setProblemId(e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                        <button
                            onClick={handleDeleteProblem}
                            className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                        >
                            Delete Problem
                        </button>
                    </div>
                </div>

                {/* User Management Section */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-5 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-700">User Management</h3>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-8">
                            <svg className="animate-spin h-8 w-8 text-indigo-600" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {users.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No users found.</td>
                                        </tr>
                                    ) : (
                                        users.map((user) => (
                                            <tr key={user._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.username}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {editingUser === user._id ? (
                                                        <div className="flex items-center gap-2">
                                                            <select
                                                                value={newRole}
                                                                onChange={(e) => setNewRole(e.target.value)}
                                                                className="border border-gray-300 rounded px-2 py-1 text-xs"
                                                            >
                                                                <option value="student">student</option>
                                                                <option value="problem_setter">problem_setter</option>
                                                                <option value="admin">admin</option>
                                                                <option value="guest">guest</option>
                                                            </select>
                                                            <button onClick={() => handleUpdateRole(user._id)} className="text-green-600 hover:text-green-800 text-xs font-medium">Save</button>
                                                            <button onClick={() => setEditingUser(null)} className="text-gray-500 hover:text-gray-700 text-xs">Cancel</button>
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
                                                        className="text-indigo-600 hover:text-indigo-800 font-medium"
                                                    >
                                                        Edit Role
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(user._id)}
                                                        className="text-red-600 hover:text-red-800 font-medium"
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

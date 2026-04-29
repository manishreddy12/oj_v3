import React from 'react'
import { useState } from 'react';
import axios from 'axios';

export const Changeroles = () => {
    const [username, setUsername] = useState('');
    const [newrole, setRole] = useState('user');

    const handleSubmit = async (e) => {
        e.preventDefault();
        // onSubmit({ username, role });
        try {
            const token = localStorage.getItem('token');
            const responseRun = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/changeroles`,
                { username,newrole },
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
            console.log("response is", responseRun.data.message);
            alert(responseRun.data.message);
        } catch (err) {
            console.log("Error", err);
        }
    };

    return (
        <div>
            <form onSubmit={handleSubmit} className="flex items-center space-x-4">
                <h2 className="text-lg font-semibold mr-4 whitespace-nowrap">Change user roles</h2>

                <div className="flex flex-col">
                    <label htmlFor="username" className="mb-1 font-medium whitespace-nowrap">Username</label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter username"
                        className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 w-48"
                        required
                    />
                </div>

                <div className="flex flex-col">
                    <label htmlFor="role" className="mb-1 font-medium whitespace-nowrap">Role</label>
                    <select
                        id="role"
                        value={newrole}
                        onChange={(e) => setRole(e.target.value)}
                        className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 w-40"
                    >
                        <option value="user">user</option>
                        <option value="manager">manager</option>
                        <option value="admin">admin</option>
                    </select>
                </div>

                <div className="flex flex-col justify-end">
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Submit
                    </button>
                </div>
            </form>



        </div>
    )
}

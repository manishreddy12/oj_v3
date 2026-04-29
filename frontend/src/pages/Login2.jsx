import React from 'react';
import { useNavigate } from "react-router-dom";
import codeview from '../assets/codeview.png'
import axios from 'axios';
import { Link } from "react-router-dom";
import { useState, useEffect } from 'react';

const Login2 = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [err, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }

    const navigate = useNavigate();

    useEffect(() => {
        if (success) {
            navigate('/home');
        }
    }, [success, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/auth/login`,
                {
                    email: formData.email,
                    password: formData.password
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            const token = response?.data?.data?.token;
            if (!token) throw new Error("No token in response");

            localStorage.setItem('token', token);

            // Fetch user profile to get role and userId
            try {
                const profileRes = await axios.get(
                    `${import.meta.env.VITE_API_URL}/api/users/profile`,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
                const user = profileRes?.data?.data?.user;
                if (user) {
                    localStorage.setItem('role', user.role);
                    localStorage.setItem('userId', user._id);
                    localStorage.setItem('username', user.username);
                    if (user.userimage) {
                      localStorage.setItem('userimage', user.userimage);
                    }
                }
            } catch (profileErr) {
                console.log("Could not fetch profile:", profileErr);
            }

            setSuccess("Login successful!");
            setError('');
        }
        catch (err) {
            setError(err.response?.data?.message || "Something went wrong");
            setSuccess('');
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="h-screen w-screen flex">
            {/* Left Side - Login Form */}
            <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-8 bg-gray-50">
                <div className="w-full max-w-md">
                    <div className="text-center">
                        <img
                            className="mx-auto h-10 w-auto"
                            src={codeview}
                            alt="CodeView Logo"
                        />
                        <h2 className="mt-10 text-2xl font-bold text-gray-900">
                            Sign in to your account
                        </h2>
                    </div>

                    <div className="mt-10">
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-900">
                                    Email address
                                </label>
                                <div className="mt-2">
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder='you@example.com'
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        autoComplete="email"
                                        className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between">
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-900">
                                        Password
                                    </label>
                                    <div className="text-sm">
                                        <a href="#" className="font-semibold text-indigo-600 hover:text-indigo-500">
                                            Forgot password?
                                        </a>
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        autoComplete="current-password"
                                        className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                    />
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Signing in...
                                        </span>
                                    ) : 'Sign in'}
                                </button>
                            </div>
                        </form>

                        <p className="mt-10 text-center text-sm text-gray-500">
                            Not a member?{' '}
                            <Link to={'/signup'} className="font-semibold text-indigo-600 hover:text-indigo-500">
                                Sign Up
                            </Link>
                        </p>
                        <div className="mt-4 text-center text-sm">
                            {err && <p className="text-red-600 bg-red-50 rounded-md py-2 px-3">{err}</p>}
                            {success && <p className="text-green-600 bg-green-50 rounded-md py-2 px-3">{success}</p>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Image */}
            <div className="hidden lg:block lg:w-1/2">
                <img
                    className="h-full w-full object-cover"
                    src="https://images.unsplash.com/photo-1496917756835-20cb06e75b4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1908&q=80"
                    alt="Decorative background"
                />
            </div>
        </section>
    );
};

export default Login2;
import React, { useState } from 'react';
import { LogInIcon, ArrowLeftIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { APIError } from '../api/client';
import { GoogleLogin } from '@react-oauth/google';

interface LoginProps {
    onSwitchToSignup: () => void;
    onBackToHome: () => void;
}

export function Login({ onSwitchToSignup, onBackToHome }: LoginProps) {
    const { login, googleLogin } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
        } catch (err) {
            if (err instanceof APIError) {
                setError(err.message);
            } else {
                setError('An unexpected error occurred');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
            <div className="w-full max-w-md">
                {/* Back button */}
                <button
                    onClick={onBackToHome}
                    className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeftIcon className="w-4 h-4" />
                    <span>Back to Home</span>
                </button>

                {/* Login Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                        <h1 className="text-xl font-bold text-gray-900">Welcome Back</h1>
                    </div>
                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={8}
                                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter your password"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                                    Logging in...
                                </>
                            ) : (
                                <>
                                    <LogInIcon className="w-5 h-5" />
                                    Log In
                                </>
                            )}
                        </button>

                        <div className="text-center text-sm text-gray-600">
                            Don't have an account?{' '}
                            <button
                                type="button"
                                onClick={onSwitchToSignup}
                                className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Sign up
                            </button>
                        </div>
                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">Or continue with</span>
                            </div>
                        </div>

                        <div className="flex justify-center">
                            <GoogleLogin
                                onSuccess={async (credentialResponse) => {
                                    if (credentialResponse.credential) {
                                        try {
                                            setLoading(true);
                                            await googleLogin(credentialResponse.credential);
                                        } catch (err) {
                                            if (err instanceof APIError) {
                                                setError(err.message);
                                            } else {
                                                setError('Google login failed');
                                            }
                                        } finally {
                                            setLoading(false);
                                        }
                                    }
                                }}
                                onError={() => {
                                    setError('Google login failed');
                                }}
                            />
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

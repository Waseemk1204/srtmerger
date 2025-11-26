import React from 'react';
import { useAuth } from '../contexts/AuthContext';

type Page = 'home' | 'how-it-works' | 'blog' | 'privacy' | 'login' | 'dashboard';

interface NavbarProps {
    onNavigate: (page: Page) => void;
}

export function Navbar({ onNavigate }: NavbarProps) {
    const { isAuthenticated } = useAuth();

    return (
        <nav className="w-full bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <a
                        href="/"
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={(e) => { e.preventDefault(); onNavigate('home'); }}
                    >
                        <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center shadow-lg shadow-gray-900/20 overflow-hidden">
                            <img src="/favicon.svg" alt="Logo" className="w-5 h-5" />
                        </div>
                        <span className="font-mono font-bold text-lg tracking-tight text-gray-900">
                            SRT Merger
                        </span>
                    </a>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center gap-8">
                        <a
                            href="/?view=how-it-works"
                            onClick={(e) => { e.preventDefault(); onNavigate('how-it-works'); }}
                            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            How it works
                        </a>
                        <span
                            className="text-sm font-medium text-gray-600 cursor-not-allowed opacity-50"
                        >
                            Pricing
                        </span>
                        <a
                            href="/?view=blog"
                            onClick={(e) => { e.preventDefault(); onNavigate('blog'); }}
                            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            Blog
                        </a>
                    </div>

                    {/* Right side - Login/Dashboard */}
                    <div className="flex items-center gap-4">
                        {!isAuthenticated ? (
                            <a
                                href="/?view=login"
                                onClick={(e) => { e.preventDefault(); onNavigate('login'); }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                                Log In
                            </a>
                        ) : (
                            <a
                                href="/?view=dashboard"
                                onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                                Dashboard
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}

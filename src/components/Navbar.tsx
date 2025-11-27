import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MenuIcon, XIcon } from 'lucide-react';

type Page = 'home' | 'how-it-works' | 'blog' | 'privacy' | 'login' | 'dashboard';

interface NavbarProps {
    onNavigate: (page: Page) => void;
}

export function Navbar({ onNavigate }: NavbarProps) {
    const { isAuthenticated } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleNavigate = (page: Page) => {
        onNavigate(page);
        setIsMenuOpen(false);
    };

    return (
        <nav className="w-full bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <a
                        href="/"
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={(e) => { e.preventDefault(); handleNavigate('home'); }}
                    >
                        <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center shadow-lg shadow-gray-900/20 overflow-hidden">
                            <img src="/favicon.svg" alt="Logo" className="w-5 h-5" />
                        </div>
                        <span className="font-mono font-bold text-lg tracking-tight text-gray-900">
                            SRT Merger
                        </span>
                    </a>

                    {/* Desktop Navigation Links */}
                    <div className="hidden md:flex items-center gap-8">
                        <a
                            href="/?view=how-it-works"
                            onClick={(e) => { e.preventDefault(); handleNavigate('how-it-works'); }}
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
                            onClick={(e) => { e.preventDefault(); handleNavigate('blog'); }}
                            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            Blog
                        </a>
                    </div>

                    {/* Right side - Login/Dashboard (Desktop) */}
                    <div className="hidden md:flex items-center gap-4">
                        {!isAuthenticated ? (
                            <a
                                href="/?view=login"
                                onClick={(e) => { e.preventDefault(); handleNavigate('login'); }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                                Log In
                            </a>
                        ) : (
                            <a
                                href="/?view=dashboard"
                                onClick={(e) => { e.preventDefault(); handleNavigate('dashboard'); }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                                Dashboard
                            </a>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-gray-600 hover:text-gray-900 p-2"
                        >
                            {isMenuOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div className="md:hidden bg-white border-t border-gray-200 absolute w-full left-0 shadow-lg animate-fade-in">
                    <div className="px-4 pt-2 pb-6 space-y-2">
                        <a
                            href="/?view=how-it-works"
                            onClick={(e) => { e.preventDefault(); handleNavigate('how-it-works'); }}
                            className="block px-3 py-3 rounded-lg text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                        >
                            How it works
                        </a>
                        <span
                            className="block px-3 py-3 rounded-lg text-base font-medium text-gray-400 cursor-not-allowed"
                        >
                            Pricing
                        </span>
                        <a
                            href="/?view=blog"
                            onClick={(e) => { e.preventDefault(); handleNavigate('blog'); }}
                            className="block px-3 py-3 rounded-lg text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                        >
                            Blog
                        </a>
                        <div className="pt-4 border-t border-gray-100 mt-2">
                            {!isAuthenticated ? (
                                <a
                                    href="/?view=login"
                                    onClick={(e) => { e.preventDefault(); handleNavigate('login'); }}
                                    className="block w-full text-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-base font-medium"
                                >
                                    Log In
                                </a>
                            ) : (
                                <a
                                    href="/?view=dashboard"
                                    onClick={(e) => { e.preventDefault(); handleNavigate('dashboard'); }}
                                    className="block w-full text-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-base font-medium"
                                >
                                    Dashboard
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}

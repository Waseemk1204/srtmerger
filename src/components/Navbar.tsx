import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MenuIcon, XIcon, UserIcon, CreditCardIcon, LogOutIcon, ChevronDownIcon } from 'lucide-react';

type Page = 'home' | 'how-it-works' | 'blog' | 'privacy' | 'login' | 'dashboard' | 'subscription';

interface NavbarProps {
    onNavigate: (page: Page) => void;
}

export function Navbar({ onNavigate }: NavbarProps) {
    const { isAuthenticated, user, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    const handleNavigate = (page: Page) => {
        onNavigate(page);
        setIsMenuOpen(false);
        setIsProfileOpen(false);
    };

    // Close profile dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
                        <button
                            onClick={() => {
                                const pricingSection = document.getElementById('pricing');
                                if (pricingSection) {
                                    pricingSection.scrollIntoView({ behavior: 'smooth' });
                                }
                            }}
                            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                        >
                            Pricing
                        </button>
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
                            <div className="relative" ref={profileRef}>
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
                                >
                                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-medium text-sm">
                                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate">
                                        {user?.name?.split(' ')[0]}
                                    </span>
                                    <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Profile Dropdown */}
                                {isProfileOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 animate-fade-in-up origin-top-right">
                                        <div className="px-4 py-2 border-b border-gray-50 mb-1">
                                            <div className="text-sm font-medium text-gray-900 truncate">{user?.name}</div>
                                            <div className="text-xs text-gray-500 truncate">{user?.email}</div>
                                        </div>

                                        <button
                                            onClick={() => handleNavigate('dashboard')}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                        >
                                            <UserIcon className="w-4 h-4 text-gray-400" />
                                            Dashboard
                                        </button>

                                        <button
                                            onClick={() => handleNavigate('subscription')}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                        >
                                            <CreditCardIcon className="w-4 h-4 text-gray-400" />
                                            My Subscription
                                        </button>

                                        <div className="border-t border-gray-50 my-1"></div>

                                        <button
                                            onClick={() => {
                                                logout();
                                                setIsProfileOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                        >
                                            <LogOutIcon className="w-4 h-4" />
                                            Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
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
                <div className="md:hidden bg-white border-t border-gray-200 absolute w-full left-0 shadow-lg animate-fade-in h-[calc(100vh-64px)] overflow-y-auto">
                    <div className="px-4 pt-2 pb-6 space-y-2">
                        {isAuthenticated && (
                            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900">{user?.name}</div>
                                        <div className="text-xs text-gray-500">{user?.email}</div>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <button
                                        onClick={() => handleNavigate('dashboard')}
                                        className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-white hover:shadow-sm"
                                    >
                                        Dashboard
                                    </button>
                                    <button
                                        onClick={() => handleNavigate('subscription')}
                                        className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-white hover:shadow-sm"
                                    >
                                        My Subscription
                                    </button>
                                </div>
                            </div>
                        )}

                        <a
                            href="/?view=how-it-works"
                            onClick={(e) => { e.preventDefault(); handleNavigate('how-it-works'); }}
                            className="block px-3 py-3 rounded-lg text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                        >
                            How it works
                        </a>
                        <button
                            onClick={() => {
                                const pricingSection = document.getElementById('pricing');
                                if (pricingSection) {
                                    pricingSection.scrollIntoView({ behavior: 'smooth' });
                                }
                                setIsMenuOpen(false);
                            }}
                            className="block w-full text-left px-3 py-3 rounded-lg text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 cursor-pointer"
                        >
                            Pricing
                        </button>
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
                                <button
                                    onClick={() => {
                                        logout();
                                        setIsMenuOpen(false);
                                    }}
                                    className="block w-full text-center px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-base font-medium"
                                >
                                    Sign Out
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}

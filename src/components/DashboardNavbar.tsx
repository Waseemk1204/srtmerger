import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserIcon, CreditCardIcon, LogOutIcon, ChevronDownIcon } from 'lucide-react';

interface DashboardNavbarProps {
    onNavigate?: (page: string) => void;
}

export function DashboardNavbar({ onNavigate }: DashboardNavbarProps) {
    const { user, logout } = useAuth();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

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

    const handleNavigate = (page: string) => {
        if (onNavigate) {
            onNavigate(page);
        } else {
            // Fallback if no navigation handler provided (e.g. direct window location)
            window.location.href = `/?view=${page}`;
        }
        setIsProfileOpen(false);
    };

    return (
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo & Dashboard Label */}
                    <div className="flex items-center gap-4">
                        <a href="/?view=dashboard" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center shadow-lg shadow-gray-900/20 overflow-hidden">
                                <img src="/favicon.svg" alt="Logo" className="w-5 h-5" />
                            </div>
                            <span className="font-mono font-bold text-lg tracking-tight text-gray-900">
                                SRT Merger
                            </span>
                        </a>
                        <span className="text-sm text-gray-400 hidden xs:inline">|</span>
                        <span className="text-sm font-medium text-gray-600 hidden xs:inline">Dashboard</span>
                    </div>

                    {/* Profile Dropdown */}
                    <div className="relative" ref={profileRef}>
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
                        >
                            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-medium text-sm">
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate hidden sm:block">
                                {user?.name?.split(' ')[0]}
                            </span>
                            <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Menu */}
                        {isProfileOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 animate-fade-in-up origin-top-right z-50">
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
                                        // Redirect to home after logout
                                        window.location.href = '/';
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                    <LogOutIcon className="w-4 h-4" />
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}

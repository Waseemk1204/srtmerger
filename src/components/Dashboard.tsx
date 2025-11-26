import { useState } from 'react';
import { LogOutIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { SavedFilesSection } from './SavedFilesSection';
import { MergerTool } from './MergerTool';

export function Dashboard() {
    const { user, logout } = useAuth();
    const [refreshKey, setRefreshKey] = useState(0);

    const loadFiles = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div className="min-h-screen bg-zinc-50 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
            {/* Dashboard Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo & Dashboard Label */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center shadow-lg shadow-gray-900/20 overflow-hidden">
                                    <img src="/favicon.svg" alt="Logo" className="w-5 h-5" />
                                </div>
                                <span className="font-mono font-bold text-lg tracking-tight text-gray-900">
                                    SRT Merger
                                </span>
                            </div>
                            <span className="text-sm text-gray-400">|</span>
                            <span className="text-sm font-medium text-gray-600">Dashboard</span>
                        </div>

                        {/* User Info & Sign Out */}
                        <div className="flex items-center gap-4">
                            <div className="text-sm text-gray-600 hidden sm:block">
                                {user?.name}
                            </div>
                            <button
                                onClick={logout}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <LogOutIcon className="w-4 h-4" />
                                <span className="hidden sm:inline">Sign Out</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Merger Tool */}
            <div className="pt-8">
                <MergerTool onFileSaved={loadFiles} />
            </div>

            {/* Saved Files Section */}
            <section className="px-4 pb-20 pt-8">
                <div className="max-w-5xl mx-auto">
                    <SavedFilesSection key={refreshKey} />
                </div>
            </section>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { LogOutIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { SavedFilesSection } from './SavedFilesSection';
import { MergerTool } from './MergerTool';

export function Dashboard() {
    const { user, logout, refreshUser } = useAuth();
    const [refreshKey, setRefreshKey] = useState(0);
    const [timeUntilReset, setTimeUntilReset] = useState<string>('');

    // Calculate time until reset
    useEffect(() => {
        const calculateTimeRemaining = () => {
            const firstMergeTime = user?.usage?.firstMergeTime;

            if (!firstMergeTime) {
                setTimeUntilReset('No usage yet');
                return;
            }

            const resetTime = new Date(firstMergeTime).getTime() + (24 * 60 * 60 * 1000); // +24 hours
            const now = Date.now();
            const msRemaining = resetTime - now;

            if (msRemaining <= 0) {
                setTimeUntilReset('Ready to reset');
                return;
            }

            const hours = Math.floor(msRemaining / (1000 * 60 * 60));
            const minutes = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));

            setTimeUntilReset(`${hours}h ${minutes}m`);
        };

        calculateTimeRemaining();
        const interval = setInterval(calculateTimeRemaining, 60000); // Update every minute

        return () => clearInterval(interval);
    }, [user?.usage?.firstMergeTime]);

    const loadFiles = async () => {
        setRefreshKey(prev => prev + 1);
        // Refresh user data to get updated usage stats
        if (refreshUser) {
            await refreshUser();
        }
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
                            <span className="text-sm text-gray-400 hidden xs:inline">|</span>
                            <span className="text-sm font-medium text-gray-600 hidden xs:inline">Dashboard</span>
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

            {/* Plan & Usage */}
            <section className="px-4 pt-8">
                <div className="max-w-5xl mx-auto">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Plan & Usage</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div>
                                <div className="text-sm text-gray-500 mb-1">Current Plan</div>
                                <div className="font-medium text-gray-900 capitalize flex items-center gap-2">
                                    {user?.subscription?.plan || 'free'}
                                    {(user?.subscription?.plan === 'free' || !user?.subscription?.plan) && (
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Basic</span>
                                    )}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 mb-1">Daily Uploads</div>
                                <div className="font-medium text-gray-900">
                                    {user?.usage?.uploadCount || 0} / {
                                        (user?.subscription?.plan === 'tier3' ? '∞' :
                                            (user?.subscription?.plan === 'tier2' ? 100 :
                                                (user?.subscription?.plan === 'tier1' ? 20 : 4)))
                                    }
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2 max-w-[200px]">
                                    <div
                                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                                        style={{
                                            width: `${Math.min(100, ((user?.usage?.uploadCount || 0) / (user?.subscription?.plan === 'tier3' ? 1000 : (user?.subscription?.plan === 'tier2' ? 100 : (user?.subscription?.plan === 'tier1' ? 20 : 4)))) * 100)}%`
                                        }}
                                    ></div>
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 mb-1">Resets In</div>
                                <div className="font-medium text-gray-900">{timeUntilReset}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

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

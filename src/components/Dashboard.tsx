import { useState, useEffect } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { SavedFilesSection } from './SavedFilesSection';
import { MergerTool } from './MergerTool';
import { UpgradeModal } from './Pricing/UpgradeModal';
import { DashboardNavbar } from './DashboardNavbar';

export function Dashboard() {
    const { user, refreshUser } = useAuth();
    const [refreshKey, setRefreshKey] = useState(0);
    const [timeUntilReset, setTimeUntilReset] = useState<string>('');
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    const handleShowToast = (message: string) => {
        setToastMessage(message);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    // Calculate time until reset and effective count
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

    // Calculate effective count (0 if expired)
    const firstMergeTime = user?.usage?.firstMergeTime;
    const isExpired = firstMergeTime &&
        (Date.now() - new Date(firstMergeTime).getTime()) >= 24 * 60 * 60 * 1000;
    const effectiveCount = isExpired || !firstMergeTime ? 0 : (user?.usage?.uploadCount || 0);
    const limit = user?.subscription?.plan === 'tier3' ? 1000 :
        user?.subscription?.plan === 'tier2' ? 100 :
            user?.subscription?.plan === 'tier1' ? 20 : 4;

    return (
        <div className="min-h-screen bg-zinc-50 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
            <DashboardNavbar onNavigate={(page) => window.location.href = `/?view=${page}`} />

            {/* Plan & Usage */}


            {/* Plan & Usage */}
            <section className="px-4 pt-8 relative z-10">
                <div className="max-w-5xl mx-auto">
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Plan & Usage</h2>
                        {user?.subscription?.plan === 'tier3' ? (
                            /* Premium Unlimited UI (Static Container) */
                            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-6 text-white shadow-lg border border-blue-500/30">
                                {/* Background Glow Effect (Static) */}
                                <div className="absolute inset-0 bg-blue-500/10 blur-3xl"></div>

                                <div className="relative z-10 flex items-center justify-between">
                                    <div>
                                        <div className="text-sm text-blue-200 mb-1 font-medium tracking-wide uppercase">Current Plan</div>
                                        <div className="text-2xl font-bold text-white flex items-center gap-2">
                                            UNLIMITED
                                            <span className="text-xs bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold px-2 py-0.5 rounded shadow-sm">PRO</span>
                                        </div>
                                        <div className="mt-2 text-sm text-blue-300/80">
                                            No limits. No boundaries.
                                        </div>

                                    </div>

                                    {/* Infinity Animation (Kept as requested) */}
                                    <div className="w-32 h-16 flex items-center justify-center">
                                        <svg viewBox="0 0 100 50" className="w-full h-full drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]">
                                            <defs>
                                                <linearGradient id="infinityGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                    <stop offset="0%" stopColor="#3b82f6" />
                                                    <stop offset="50%" stopColor="#60a5fa" />
                                                    <stop offset="100%" stopColor="#3b82f6" />
                                                </linearGradient>
                                            </defs>
                                            {/* Background Path (dimmed) */}
                                            <path
                                                d="M25,25 C25,35 15,35 10,25 C5,15 15,15 25,25 C35,35 65,35 75,25 C85,15 95,15 90,25 C85,35 75,35 65,25 C55,15 35,15 25,25 Z"
                                                fill="none"
                                                stroke="#1e3a8a"
                                                strokeWidth="4"
                                                opacity="0.3"
                                            />
                                            {/* Animated Foreground Path */}
                                            <path
                                                d="M25,25 C25,35 15,35 10,25 C5,15 15,15 25,25 C35,35 65,35 75,25 C85,15 95,15 90,25 C85,35 75,35 65,25 C55,15 35,15 25,25 Z"
                                                fill="none"
                                                stroke="url(#infinityGradient)"
                                                strokeWidth="3"
                                                strokeLinecap="round"
                                                className="infinity-path animate-dash"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        ) : (
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
                                        {effectiveCount} / {
                                            (user?.subscription?.plan === 'tier3' ? '∞' :
                                                (user?.subscription?.plan === 'tier2' ? 100 :
                                                    (user?.subscription?.plan === 'tier1' ? 20 : 4)))
                                        }
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2 max-w-[200px]">
                                        <div
                                            className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                                            style={{
                                                width: `${Math.min(100, (effectiveCount / limit) * 100)}%`
                                            }}
                                        ></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500 mb-1">Resets In</div>
                                    <div className="font-medium text-gray-900">{timeUntilReset}</div>
                                </div>
                            </div>
                        )}

                        {/* Upgrade Button for Free/Tier1/Tier2 */}
                        {user?.subscription?.plan !== 'tier3' && (
                            <div className="mt-6 pt-6 border-t border-gray-100 flex justify-end gap-3">

                                <button
                                    onClick={() => setShowUpgradeModal(true)}
                                    className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-lg shadow-gray-900/20"
                                >
                                    Upgrade Plan
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                reason="feature"
                featureName="Premium Features"
            />

            {/* Merger Tool */}
            <div className="pt-8 relative z-10">
                <MergerTool onFileSaved={loadFiles} on ShowToast={handleShowToast} showDownloadButton={false} />
            </div>

            {/* Saved Files Section */}
            <section className="px-4 pb-20 pt-8 relative z-10">
                <div className="max-w-5xl mx-auto">
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200">
                        <SavedFilesSection refreshTrigger={refreshKey} />
                    </div>
                </div>
            </section>

            {/* Toast Notification */}
            {
                showToast && (
                    <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm animate-fade-in z-[10000] font-medium flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                        {toastMessage}
                    </div>
                )
            }
        </div >
    );
}

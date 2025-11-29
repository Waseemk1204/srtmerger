import { useState, useEffect } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { anonymousUsage } from '../utils/anonymousUsage';

export function UsageCard() {
    const { user } = useAuth();
    const [isExpanded, setIsExpanded] = useState(true);
    const [timeUntilReset, setTimeUntilReset] = useState<string>('');
    const [anonUsage, setAnonUsage] = useState<{ uploadCount: number; firstMergeTime?: string } | null>(null);

    // Load anonymous usage on mount and set up polling
    useEffect(() => {
        if (!user) {
            const loadAnonUsage = () => {
                const usage = anonymousUsage.get();
                setAnonUsage(usage);
            };

            loadAnonUsage();
            const interval = setInterval(loadAnonUsage, 1000); // Poll every second

            return () => clearInterval(interval);
        }
    }, [user]);

    // Calculate time until reset
    useEffect(() => {
        const firstMergeTime = user?.usage?.firstMergeTime || anonUsage?.firstMergeTime;

        if (!firstMergeTime) {
            setTimeUntilReset('No usage yet');
            return;
        }

        const calculateTimeRemaining = () => {
            const resetTime = new Date(firstMergeTime).getTime() + (24 * 60 * 60 * 1000);
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
        const interval = setInterval(calculateTimeRemaining, 60000);

        return () => clearInterval(interval);
    }, [user?.usage?.firstMergeTime, anonUsage?.firstMergeTime]);

    // Calculate effective count
    const firstMergeTime = user?.usage?.firstMergeTime || anonUsage?.firstMergeTime;
    const currentCount = user?.usage?.uploadCount || anonUsage?.uploadCount || 0;
    const isExpired = firstMergeTime &&
        (Date.now() - new Date(firstMergeTime).getTime()) >= 24 * 60 * 60 * 1000;
    const effectiveCount = isExpired || !firstMergeTime ? 0 : currentCount;
    const plan = user?.subscription?.plan || 'free';
    const limit = plan === 'tier3' ? 1000 :
        plan === 'tier2' ? 100 :
            plan === 'tier1' ? 20 : 4;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header - Always visible */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
                <h3 className="text-lg font-semibold text-gray-900">Usage & Limits</h3>
                {isExpanded ? (
                    <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                ) : (
                    <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                )}
            </button>

            {/* Expandable Content */}
            {isExpanded && (
                <div className="px-6 pb-6 border-t border-gray-100">
                    {/* Usage stats (shown for all users) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
                        <div>
                            <div className="text-sm text-gray-500 mb-1">Current Plan</div>
                            <div className="font-medium text-gray-900 capitalize flex items-center gap-2">
                                {plan}
                                {plan === 'free' && (
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Basic</span>
                                )}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-500 mb-1">Daily Uploads</div>
                            <div className="font-medium text-gray-900">
                                {effectiveCount} / {plan === 'tier3' ? '∞' : limit}
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

                    {/* Message for anonymous users */}
                    {!user && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-sm text-gray-600 mb-3 text-center">
                                📊 Sign in to track your progress and access saved files
                            </p>
                            <div className="flex gap-3 justify-center">
                                <a
                                    href="?view=login"
                                    className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                    Sign In
                                </a>
                                <a
                                    href="?view=signup"
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                                >
                                    Create Account
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export function UsageCard() {
    const { user } = useAuth();
    const [isExpanded, setIsExpanded] = useState(true);
    const [timeUntilReset, setTimeUntilReset] = useState<string>('');

    // Calculate time until reset
    useEffect(() => {
        if (!user || !user.usage || !user.usage.firstMergeTime) {
            setTimeUntilReset('No usage yet');
            return;
        }

        const calculateTimeRemaining = () => {
            const firstMergeTime = user.usage?.firstMergeTime;
            if (!firstMergeTime) {
                setTimeUntilReset('No usage yet');
                return;
            }

            const resetTime = new Date(firstMergeTime).getTime() + (24 * 60 * 60 * 1000);
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
        const interval = setInterval(calculateTimeRemaining, 60000);

        return () => clearInterval(interval);
    }, [user, user?.usage?.firstMergeTime]);

    // Calculate effective count
    const firstMergeTime = user?.usage?.firstMergeTime;
    const isExpired = firstMergeTime &&
        (Date.now() - new Date(firstMergeTime).getTime()) >= 24 * 60 * 60 * 1000;
    const effectiveCount = isExpired || !firstMergeTime ? 0 : (user?.usage?.uploadCount || 0);
    const limit = user?.subscription?.plan === 'tier3' ? 1000 :
        user?.subscription?.plan === 'tier2' ? 100 :
            user?.subscription?.plan === 'tier1' ? 20 : 4;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header - Always visible */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
                <h3 className="text-lg font-semibold text-gray-900">Usage & Limits</h3>
                {isExpanded ? (
                    <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                ) : (
                    <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                )}
            </button>

            {/* Expandable Content */}
            {isExpanded && (
                <div className="px-6 pb-6 border-t border-gray-100">
                    {user ? (
                        /* Logged-in user stats */
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
                            <div>
                                <div className="text-sm text-gray-500 mb-1">Current Plan</div>
                                <div className="font-medium text-gray-900 capitalize flex items-center gap-2">
                                    {user.subscription?.plan || 'free'}
                                    {(user.subscription?.plan === 'free' || !user.subscription?.plan) && (
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Basic</span>
                                    )}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 mb-1">Daily Uploads</div>
                                <div className="font-medium text-gray-900">
                                    {effectiveCount} / {
                                        (user.subscription?.plan === 'tier3' ? '∞' :
                                            (user.subscription?.plan === 'tier2' ? 100 :
                                                (user.subscription?.plan === 'tier1' ? 20 : 4)))
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
                    ) : (
                        /* Anonymous user message */
                        <div className="py-4 text-center">
                            <p className="text-sm text-gray-600 mb-3">
                                Sign in to track your usage and save your merged files
                            </p>
                            <div className="flex gap-3 justify-center">
                                <a
                                    href="?view=login"
                                    className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                    Sign In
                                </a>
                                <a
                                    href="?view=signup"
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                                >
                                    Create Account
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

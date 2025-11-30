import { useState } from 'react';
import { CheckCircleIcon, AlertTriangleIcon, CreditCardIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/client';
import { UpgradeModal } from './Pricing/UpgradeModal';
import { DashboardNavbar } from './DashboardNavbar';

export function SubscriptionPage() {
    const { user, refreshUser } = useAuth();
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleCancelSubscription = async () => {
        if (!confirm('Are you sure you want to cancel your subscription? You will lose premium features immediately.')) {
            return;
        }

        setIsCancelling(true);
        try {
            await api.cancelSubscription();
            setMessage({ type: 'success', text: 'Subscription canceled successfully' });
            if (refreshUser) await refreshUser();
        } catch (error) {
            console.error('Failed to cancel subscription:', error);
            setMessage({ type: 'error', text: 'Failed to cancel subscription. Please try again.' });
        } finally {
            setIsCancelling(false);
        }
    };

    const planName = user?.subscription?.plan || 'free';
    const isPremium = planName !== 'free';
    const expiryDate = user?.subscription?.expiryDate ? new Date(user.subscription.expiryDate).toLocaleDateString() : null;

    return (
        <div className="min-h-screen bg-zinc-50 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
            <DashboardNavbar onNavigate={(page) => window.location.href = `/?view=${page}`} />

            <div className="pt-12 pb-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-8 border-b border-gray-100">
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">Subscription Management</h1>
                            <p className="text-gray-600">Manage your plan, billing, and account settings.</p>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* Current Plan Section */}
                            <section>
                                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <CreditCardIcon className="w-5 h-5 text-gray-500" />
                                    Current Plan
                                </h2>
                                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="text-xl font-bold text-gray-900 capitalize mb-1">
                                                {planName === 'tier3' ? 'Unlimited Pro' :
                                                    planName === 'tier2' ? 'Pro Plan' :
                                                        planName === 'tier1' ? 'Basic Plan' : 'Free Plan'}
                                            </div>
                                            <div className="text-gray-600 text-sm">
                                                {isPremium ? (
                                                    <span className="flex items-center gap-2 text-green-600">
                                                        <CheckCircleIcon className="w-4 h-4" />
                                                        Active Subscription
                                                    </span>
                                                ) : (
                                                    'Basic features with daily limits'
                                                )}
                                            </div>
                                        </div>
                                        {isPremium ? (
                                            <div className="text-right">
                                                <div className="text-sm text-gray-500 mb-1">Renews on</div>
                                                <div className="font-medium text-gray-900">{expiryDate}</div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setShowUpgradeModal(true)}
                                                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                                            >
                                                Upgrade Now
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </section>

                            {/* Plan Features Summary */}
                            <section>
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Plan Features</h2>
                                <ul className="space-y-3">
                                    <li className="flex items-center text-gray-700">
                                        <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3" />
                                        {planName === 'tier3' ? 'Unlimited daily uploads' :
                                            planName === 'tier2' ? '100 daily uploads' :
                                                planName === 'tier1' ? '20 daily uploads' : '4 daily uploads'}
                                    </li>
                                    <li className="flex items-center text-gray-700">
                                        <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3" />
                                        {planName === 'free' ? 'Basic merge tools' : 'Advanced merge tools'}
                                    </li>
                                    <li className="flex items-center text-gray-700">
                                        <CheckCircleIcon className={`w-5 h-5 mr-3 ${isPremium ? 'text-green-500' : 'text-gray-300'}`} />
                                        {isPremium ? 'Priority support' : 'Standard support'}
                                    </li>
                                    <li className="flex items-center text-gray-700">
                                        <CheckCircleIcon className={`w-5 h-5 mr-3 ${['tier2', 'tier3'].includes(planName) ? 'text-green-500' : 'text-gray-300'}`} />
                                        Advanced editing features
                                    </li>
                                </ul>
                            </section>

                            {/* Danger Zone - Cancellation */}
                            {isPremium && (
                                <section className="pt-8 border-t border-gray-100">
                                    <h2 className="text-lg font-semibold text-red-600 mb-4 flex items-center gap-2">
                                        <AlertTriangleIcon className="w-5 h-5" />
                                        Danger Zone
                                    </h2>
                                    <div className="bg-red-50 rounded-xl p-6 border border-red-100">
                                        <div className="flex items-center justify-between flex-wrap gap-4">
                                            <div>
                                                <h3 className="font-medium text-red-900">Cancel Subscription</h3>
                                                <p className="text-sm text-red-700 mt-1">
                                                    Once you cancel, you will lose access to premium features immediately.
                                                </p>
                                            </div>
                                            <button
                                                onClick={handleCancelSubscription}
                                                disabled={isCancelling}
                                                className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-50"
                                            >
                                                {isCancelling ? 'Cancelling...' : 'Cancel Subscription'}
                                            </button>
                                        </div>
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>

                    {message && (
                        <div className={`mt-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {message.text}
                        </div>
                    )}
                </div>

                <UpgradeModal
                    isOpen={showUpgradeModal}
                    onClose={() => setShowUpgradeModal(false)}
                    reason="limit"
                    limit={0}
                />
            </div>
        </div>
    );
}

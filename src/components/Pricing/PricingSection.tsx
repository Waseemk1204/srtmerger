import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PricingCard } from './PricingCard';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api/client';
import { PlanType } from '../../types';

declare global {
    interface Window {
        Razorpay: any;
    }
}

export function PricingSection({ compact = false, hideHeader = false }: { compact?: boolean; hideHeader?: boolean }) {
    const { user } = useAuth();
    const [billingPeriod, setBillingPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
    const [loading, setLoading] = useState<string | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Success Modal Component
    const SuccessModal = () => createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-scale-in relative overflow-hidden">
                {/* Confetti/Success Decoration */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-emerald-500"></div>

                <div className="text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-small">
                        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Subscription Activated!</h3>
                    <p className="text-gray-600 mb-8">
                        Thank you for upgrading. Your account has been successfully updated with premium features.
                    </p>

                    <button
                        onClick={() => window.location.reload()}
                        className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-500/30 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Continue to Dashboard
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );



    useEffect(() => {
        // Load Razorpay script
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        };
    }, []);

    // Auto-trigger subscription if returning from login
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const autoPlan = params.get('auto_plan');
        const autoPeriod = params.get('auto_period');

        if (user && autoPlan && autoPeriod) {
            // Set correct billing period first
            if (autoPeriod !== billingPeriod) {
                setBillingPeriod(autoPeriod as any);
            }

            // Clear params to avoid loop, but keep view
            const newParams = new URLSearchParams(window.location.search);
            newParams.delete('auto_plan');
            newParams.delete('auto_period');
            newParams.delete('redirect');
            window.history.replaceState({}, '', `?${newParams.toString()}`);

            // Trigger subscription
            // We need a small timeout to allow state update and component mount
            setTimeout(() => {
                handleSubscribe(autoPlan as PlanType);
            }, 500);
        }
    }, [user]); // Run when user becomes available

    const handleSubscribe = async (planType: PlanType) => {
        if (!user) {
            // Redirect to login with return URL and plan details
            const params = new URLSearchParams(window.location.search);
            params.set('view', 'login');
            params.set('redirect', 'pricing');
            params.set('auto_plan', planType);
            params.set('auto_period', billingPeriod);
            window.history.pushState({}, '', `?${params.toString()}`);

            // Force a re-render/navigation in App.tsx by dispatching popstate
            window.dispatchEvent(new PopStateEvent('popstate'));
            return;
        }

        // Skip if free tier
        if (planType === 'free') {
            return;
        }

        // Construct plan ID with billing period (e.g., 'tier1-monthly')
        const planId = `${planType}-${billingPeriod}`;

        setLoading(planType);
        try {
            const subscription = await api.createSubscription(planId) as any;

            console.log('Subscription created:', subscription.id);

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                subscription_id: subscription.id,
                name: "SRT Merger",
                description: `${planType.toUpperCase()} Plan - ${billingPeriod} (Auto-renewing)`,
                handler: async function (response: any) {
                    try {
                        await api.verifySubscription({
                            razorpay_subscription_id: response.razorpay_subscription_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            planId: planId
                        });
                        setShowSuccessModal(true);
                    } catch (error) {
                        console.error('Subscription verification failed:', error);
                        alert('Payment verification failed. Please contact support.');
                    }
                },
                prefill: {
                    name: user.name,
                    email: user.email,
                },
                theme: {
                    color: "#2563eb"
                },
                notes: {
                    note_key_1: `${planType} plan subscription`,
                    note_key_2: `Billing: ${billingPeriod}`
                },
                modal: {
                    confirm_close: true,
                    ondismiss: function () {
                        console.log('Checkout cancelled by user');
                        setLoading(null);
                    }
                }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();
        } catch (error) {
            console.error('Payment error:', error);
            alert('Failed to initiate payment');
        } finally {
            setLoading(null);
        }
    };

    // INR pricing only
    const prices = {
        weekly: { tier1: '₹99', tier2: '₹199', tier3: '₹399' },
        monthly: { tier1: '₹299', tier2: '₹599', tier3: '₹999' },
        yearly: { tier1: '₹2,999', tier2: '₹5,999', tier3: '₹9,999' },
    };

    return (
        <section className={compact ? "" : "py-8 sm:py-16 px-4 sm:px-6 lg:px-8 bg-gray-50"} id={compact ? undefined : "pricing"}>
            <div className="max-w-7xl mx-auto">
                {!hideHeader && (
                    <div className="text-center mb-12">
                        <h2 className={`font-bold text-gray-900 mb-4 ${compact ? 'text-2xl' : 'text-2xl sm:text-3xl sm:text-4xl'}`}>
                            Simple Pricing for SRT Merging
                        </h2>
                        <p className={`text-gray-600 mb-8 ${compact ? 'text-base' : 'text-lg'}`}>
                            Choose the plan that fits your workflow.
                        </p>

                        {/* Billing Period Toggle */}
                        <div className="inline-flex bg-white rounded-xl p-1 shadow-sm border border-gray-200">
                            {(['weekly', 'monthly', 'yearly'] as const).map((period) => (
                                <button
                                    key={period}
                                    onClick={() => setBillingPeriod(period)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${billingPeriod === period
                                        ? 'bg-gray-900 text-white shadow-md'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    {period.charAt(0).toUpperCase() + period.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {hideHeader && (
                    /* Billing Period Toggle (standalone when header is hidden) */
                    <div className="flex justify-center mb-8">
                        <div className="inline-flex bg-white rounded-xl p-1 shadow-sm border border-gray-200">
                            {(['weekly', 'monthly', 'yearly'] as const).map((period) => (
                                <button
                                    key={period}
                                    onClick={() => setBillingPeriod(period)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${billingPeriod === period
                                        ? 'bg-gray-900 text-white shadow-md'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    {period.charAt(0).toUpperCase() + period.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                    <PricingCard
                        title="Free"
                        price="Free"
                        period="forever"
                        planType="free"
                        currentPlan={user?.subscription?.plan}
                        onSelect={handleSubscribe}
                        features={[
                            '4 uploads per day',
                            'Basic merging',
                            'no-Renaming',
                            'no-Timeline Alignment',
                            'no-Merge Preview',
                        ]}
                    />
                    <PricingCard
                        title="Basic"
                        price={prices[billingPeriod].tier1}
                        period={billingPeriod.slice(0, -2)} // week/month/year
                        planType="tier1"
                        currentPlan={user?.subscription?.plan}
                        onSelect={handleSubscribe}
                        loading={loading === 'tier1'}
                        features={[
                            '20 uploads per day',
                            'Basic merging',
                            'Renaming',
                            'Timeline Alignment',
                            'no-Merge Preview',
                        ]}
                    />
                    <PricingCard
                        title="Pro"
                        price={prices[billingPeriod].tier2}
                        period={billingPeriod.slice(0, -2)}
                        planType="tier2"
                        currentPlan={user?.subscription?.plan}
                        onSelect={handleSubscribe}
                        isPopular
                        loading={loading === 'tier2'}
                        features={[
                            '100 uploads per day',
                            'Basic merging',
                            'Renaming',
                            'Timeline Alignment',
                            'Merge Preview',
                        ]}
                    />
                    <PricingCard
                        title="Unlimited"
                        price={prices[billingPeriod].tier3}
                        period={billingPeriod.slice(0, -2)}
                        planType="tier3"
                        currentPlan={user?.subscription?.plan}
                        onSelect={handleSubscribe}
                        loading={loading === 'tier3'}
                        features={[
                            'Unlimited uploads',
                            'Priority Support',
                            'Renaming',
                            'Timeline Alignment',
                            'Merge Preview',
                            'Text editing',
                        ]}
                    />
                </div>
            </div>
            {showSuccessModal && <SuccessModal />}
        </section>
    );
}

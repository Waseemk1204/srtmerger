import { useState, useEffect } from 'react';
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
    const SuccessModal = () => (
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
        </div>
    );

    useEffect(() => {
        // Detect user's location
        // Try to get timezone first, then fallback to navigator language
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const language = navigator.language;

        // Check if user is likely from India
        const isIndia = timezone?.includes('Asia/Kolkata') ||
            timezone?.includes('Asia/Calcutta') ||
            language?.startsWith('hi') ||
            language?.startsWith('en-IN');

        setIsIndianUser(isIndia);
    }, []);

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

    const handleSubscribe = async (planType: PlanType) => {
        if (!user) {
            // Redirect to login or show modal
            window.location.href = '/?view=login';
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
            const order = await api.createOrder(planId) as any; // Cast to any to avoid unknown type error

            console.log('Frontend Razorpay Key:', import.meta.env.VITE_RAZORPAY_KEY_ID);

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: "SRT Merger",
                description: `${planType.toUpperCase()} Subscription - ${billingPeriod}`,
                order_id: order.id,
                handler: async function (response: any) {
                    try {
                        await api.verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            planId: planId // Required for server-side verification logic
                        });
                        setShowSuccessModal(true);
                        // alert('Payment successful! Subscription activated.');
                        // window.location.reload();
                    } catch (error) {
                        alert('Payment verification failed');
                    }
                },
                prefill: {
                    name: user.name,
                    email: user.email,
                },
                theme: {
                    color: "#2563eb"
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

    // Dual currency pricing
    const prices = {
        usd: {
            weekly: { tier1: '$1.99', tier2: '$3.99', tier3: '$6.99' },
            monthly: { tier1: '$4.99', tier2: '$9.99', tier3: '$14.99' },
            yearly: { tier1: '$39', tier2: '$79', tier3: '$129' },
        },
        inr: {
            weekly: { tier1: '₹99', tier2: '₹199', tier3: '₹399' },
            monthly: { tier1: '₹299', tier2: '₹599', tier3: '₹999' },
            yearly: { tier1: '₹2,999', tier2: '₹5,999', tier3: '₹9,999' },
        }
    };

    const currencyKey = isIndianUser ? 'inr' : 'usd';

    return (
        <section className={compact ? "" : "py-8 sm:py-16 px-4 sm:px-6 lg:px-8 bg-gray-50"} id={compact ? undefined : "pricing"}>
            <div className="max-w-7xl mx-auto">
                {!hideHeader && (
                    <div className="text-center mb-12">
                        <h2 className={`font-bold text-gray-900 mb-4 ${compact ? 'text-2xl' : 'text-2xl sm:text-3xl sm:text-4xl'}`}>
                            Simple, Transparent Pricing
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
                        price={prices[currencyKey][billingPeriod].tier1}
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
                        price={prices[currencyKey][billingPeriod].tier2}
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
                        price={prices[currencyKey][billingPeriod].tier3}
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

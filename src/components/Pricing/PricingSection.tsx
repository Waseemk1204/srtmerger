import React, { useState, useEffect } from 'react';
import { PricingCard } from './PricingCard';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api/client';
import { PlanType } from '../../types';

declare global {
    interface Window {
        Razorpay: any;
    }
}

export function PricingSection() {
    const { user } = useAuth();
    const [billingPeriod, setBillingPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
    const [loading, setLoading] = useState<string | null>(null);

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

    const handleSubscribe = async (planId: string) => {
        if (!user) {
            // Redirect to login or show modal
            window.location.href = '/?view=login';
            return;
        }

        setLoading(planId);
        try {
            const order = await api.createOrder(planId) as any; // Cast to any to avoid unknown type error

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: "SRT Merger",
                description: `${planId.toUpperCase()} Subscription`,
                order_id: order.id,
                handler: async function (response: any) {
                    try {
                        await api.verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });
                        alert('Payment successful! Subscription activated.');
                        window.location.reload();
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

    const prices = {
        weekly: { tier1: '₹99', tier2: '₹199', tier3: '₹399' },
        monthly: { tier1: '₹299', tier2: '₹599', tier3: '₹999' },
        yearly: { tier1: '₹2999', tier2: '₹5999', tier3: '₹9999' },
    };

    return (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50" id="pricing">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
                        Simple, Transparent Pricing
                    </h2>
                    <p className="text-lg text-gray-600 mb-8">
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
                        ]}
                    />
                </div>
            </div>
        </section>
    );
}

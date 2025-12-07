import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/client';

export type PlanType = 'free' | 'tier1' | 'tier2' | 'tier3';
export type BillingPeriod = 'weekly' | 'monthly' | 'yearly';

interface UseSubscriptionProps {
    onSuccess?: () => void;
    onError?: (error: any) => void;
}

export function useSubscription({ onSuccess, onError }: UseSubscriptionProps = {}) {
    const { user } = useAuth();
    const [loading, setLoading] = useState<string | null>(null);

    // Load Razorpay script
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

    const subscribe = async (planType: PlanType, billingPeriod: BillingPeriod) => {
        if (!user) return;

        // Skip if free tier
        if (planType === 'free') return;

        const planId = `${planType}-${billingPeriod}`;
        setLoading(planType);

        try {
            const subscription = await api.createSubscription(planId) as any;
            // console.log('Subscription created:', subscription.id); // Removed as per instruction

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
                        if (onSuccess) onSuccess();
                    } catch (error) {
                        console.error('Subscription verification failed:', error);
                        if (onError) onError(error);
                        else alert('Payment verification failed. Please contact support.');
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
                    ondismiss: function () {
                        setLoading(null);
                    }
                }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.on('payment.failed', function (response: any) {
                console.error('Payment failed:', response.error);
                if (onError) onError(response.error);
                else alert(`Payment failed: ${response.error.description}`);
                setLoading(null);
            });

            rzp.open();
        } catch (error) {
            console.error('Payment error:', error);
            if (onError) onError(error);
            else alert('Failed to initiate payment');
            setLoading(null);
        }
    };

    return { subscribe, loading };
}

import { CheckIcon, XIcon, ZapIcon } from 'lucide-react';
import { PlanType } from '../../types';

interface PricingCardProps {
    title: string;
    price: string;
    period: string;
    features: string[];
    isPopular?: boolean;
    planType: PlanType;
    currentPlan?: PlanType;
    onSelect: (plan: PlanType) => void;
    loading?: boolean;
}

export function PricingCard({
    title,
    price,
    period,
    features,
    isPopular,
    planType,
    currentPlan,
    onSelect,
    loading
}: PricingCardProps) {
    const isCurrent = currentPlan === planType;
    const isFree = planType === 'free';

    return (
        <div className={`relative rounded-2xl p-6 sm:p-8 transition-all duration-300 ${isPopular
            ? 'bg-white border-2 border-blue-500 shadow-xl scale-105 z-10'
            : 'bg-white border border-gray-200 shadow-sm hover:shadow-md'
            }`}>
            {isPopular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    <ZapIcon className="w-3 h-3" />
                    Most Popular
                </div>
            )}

            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-gray-900">{price}</span>
                    {price !== 'Free' && <span className="text-gray-500">/{period}</span>}
                </div>
            </div>

            <ul className="space-y-4 mb-8">
                {features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm">
                        {feature.startsWith('no-') ? (
                            <XIcon className="w-5 h-5 text-gray-400 shrink-0" />
                        ) : (
                            <CheckIcon className="w-5 h-5 text-green-500 shrink-0" />
                        )}
                        <span className={feature.startsWith('no-') ? 'text-gray-400' : 'text-gray-600'}>
                            {feature.replace('no-', '')}
                        </span>
                    </li>
                ))}
            </ul>

            <button
                onClick={() => onSelect(planType)}
                disabled={isCurrent || loading}
                className={`w-full py-3 px-4 rounded-xl font-medium transition-colors ${isCurrent
                    ? 'bg-gray-100 text-gray-500 cursor-default'
                    : isPopular
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200'
                        : 'bg-gray-900 hover:bg-gray-800 text-white'
                    }`}
            >
                {loading ? 'Processing...' : isCurrent ? 'Current Plan' : isFree ? 'Get Started' : 'Upgrade'}
            </button>
        </div>
    );
}

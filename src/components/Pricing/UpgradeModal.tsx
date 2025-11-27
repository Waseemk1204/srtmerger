import React from 'react';
import { XIcon, LockIcon, UploadCloudIcon } from 'lucide-react';
import { PricingSection } from './PricingSection';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    reason: 'limit' | 'feature';
    featureName?: string;
    limit?: number;
}

export function UpgradeModal({ isOpen, onClose, reason, featureName, limit }: UpgradeModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl my-8 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors z-10"
                >
                    <XIcon className="w-6 h-6" />
                </button>

                <div className="p-8 text-center border-b border-gray-100">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        {reason === 'limit' ? (
                            <UploadCloudIcon className="w-8 h-8 text-blue-600" />
                        ) : (
                            <LockIcon className="w-8 h-8 text-blue-600" />
                        )}
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {reason === 'limit'
                            ? `You've reached your daily limit of ${limit} uploads`
                            : `Unlock ${featureName}`}
                    </h2>
                    <p className="text-gray-600 max-w-md mx-auto">
                        {reason === 'limit'
                            ? "Upgrade your plan to upload more files and unlock premium features."
                            : `The ${featureName} feature is available on our premium plans. Upgrade now to access it.`}
                    </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-b-2xl">
                    <PricingSection />
                </div>
            </div>
        </div>
    );
}

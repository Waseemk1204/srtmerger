import React from 'react';
import { ZapIcon, ClockIcon, ShieldIcon, LayersIcon, FileTextIcon, MoveIcon } from 'lucide-react';

export function FeaturesSection() {
    const features = [
        {
            icon: <ClockIcon className="w-6 h-6 text-blue-600" />,
            title: "Smart Timeline Shifting",
            description: "Automatically adjusts timestamps of merged files so they play sequentially without overlap."
        },
        {
            icon: <ZapIcon className="w-6 h-6 text-amber-500" />,
            title: "Instant Preview",
            description: "See your merged subtitles in real-time before downloading. Verify timing and content instantly."
        },
        {
            icon: <ShieldIcon className="w-6 h-6 text-green-600" />,
            title: "100% Private & Secure",
            description: "All processing happens in your browser. Your files never leave your device."
        },
        {
            icon: <LayersIcon className="w-6 h-6 text-purple-600" />,
            title: "Bulk Merging",
            description: "Merge unlimited SRT files at once. Perfect for combining episodic content or multi-part videos."
        },
        {
            icon: <FileTextIcon className="w-6 h-6 text-indigo-600" />,
            title: "Multi-Format Support",
            description: "Compatible with SRT, VTT, and TXT formats. Seamlessly handle various subtitle types."
        },
        {
            icon: <MoveIcon className="w-6 h-6 text-rose-600" />,
            title: "Drag & Drop Reordering",
            description: "Easily organize your files. Drag to reorder and the timeline updates automatically."
        }
    ];

    return (
        <section className="mt-16 sm:mt-24 border-t border-gray-200 pt-12 sm:pt-16">
            <div className="text-center mb-12">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                    Why use SRT Merger?
                </h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                    The most advanced online tool to combine subtitle files. Fast, free, and runs entirely in your browser.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {features.map((feature, index) => (
                    <div
                        key={index}
                        className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="bg-gray-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                            {feature.icon}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {feature.title}
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            {feature.description}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}

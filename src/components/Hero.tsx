import React from 'react';
import { ArrowDownIcon } from 'lucide-react';

interface HeroProps {
    onNavigate?: (page: 'home' | 'privacy' | 'how-it-works') => void;
}

export function Hero({ onNavigate }: HeroProps) {
    const scrollToTool = () => {
        const toolElement = document.getElementById('merger-tool');
        toolElement?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <section className="pt-32 pb-16 sm:pt-40 sm:pb-24 px-4 text-center">
            <div className="max-w-4xl mx-auto">
                <h1 className="font-mono text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight leading-tight">
                    SRT Merger: Merge Subtitles.
                    <br />
                    <span className="text-blue-600 inline-block overflow-hidden whitespace-nowrap border-r-4 border-blue-600 animate-typewriter-cursor w-0">
                        Perfectly Timed.
                    </span>
                </h1>

                <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                    The professional tool for combining SRT files.
                    <span className="font-semibold text-gray-900"> Private</span>,
                    <span className="font-semibold text-gray-900"> fast</span>, and
                    <span className="font-semibold text-gray-900"> free</span>.
                    Run entirely in your browser.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <a
                        href="#merger-tool"
                        onClick={(e) => { e.preventDefault(); scrollToTool(); }}
                        className="w-full sm:w-auto px-8 py-4 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                    >
                        Start Merging
                        <ArrowDownIcon className="w-4 h-4" />
                    </a>
                    <a
                        href="/?view=how-it-works"
                        onClick={(e) => { e.preventDefault(); onNavigate?.('how-it-works'); }}
                        className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                    >
                        View Demo
                    </a>
                </div>

                <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-400 font-mono">
                    <span>// NO UPLOAD LIMIT</span>
                    <span>// 100% SECURE</span>
                    <span>// AUTO-SHIFT</span>
                </div>
            </div>
        </section>
    );
}

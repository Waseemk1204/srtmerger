
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowDownIcon } from 'lucide-react';

interface HeroProps {
    onNavigate?: (page: string) => void; // Optional for compatibility
}

import { SEO } from './SEO';

export function Hero() {
    const navigate = useNavigate();
    const location = useLocation();

    const scrollToTool = () => {
        if (location.pathname !== '/') {
            navigate('/');
            setTimeout(() => {
                const toolElement = document.getElementById('merger-tool');
                toolElement?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } else {
            const toolElement = document.getElementById('merger-tool');
            toolElement?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <section className="pt-20 pb-8 sm:pt-28 sm:pb-12 px-4 text-center">
            <SEO
                title="SRT Merger - Merge SRT Files Online Free (No Sign-up)"
                description="Free online SRT merger. Combine multiple subtitle files (SRT, VTT) into one. Automatic time shifting, drag-and-drop, and 100% private client-side processing."
            />
            <div className="max-w-4xl mx-auto">
                <h1 className="font-mono text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-4 tracking-tight leading-tight">
                    SRT Merger: Merge Subtitles.
                    <br />
                    <span className="text-blue-600 inline-block overflow-hidden whitespace-nowrap border-r-4 border-blue-600 animate-typewriter-cursor w-0">
                        Perfectly Timed.
                    </span>
                </h1>

                <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                    The professional tool for combining SRT files.
                    <span className="font-semibold text-gray-900"> Private</span>,
                    <span className="font-semibold text-gray-900"> fast</span>, and
                    <span className="font-semibold text-gray-900"> easy</span>.
                    Processed in your browser.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                        onClick={scrollToTool}
                        className="w-full sm:w-auto px-8 py-4 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
                    >
                        Start Merging
                        <ArrowDownIcon className="w-4 h-4" />
                    </button>
                    <Link
                        to="/signup"
                        className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                    >
                        Sign Up
                    </Link>
                </div>

                <div className="mt-8 flex items-center justify-center gap-8 text-sm text-gray-400 font-mono">
                    <span>// EASY TO USE</span>
                    <span>// SECURE</span>
                    <span>// AUTO-SHIFT</span>
                </div>
            </div>
        </section>
    );
}

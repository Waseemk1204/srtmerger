
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, CalendarIcon, ClockIcon, ArrowRightIcon } from 'lucide-react';
import { blogPosts, BlogPost } from '../data/blogPosts';

import { SEO } from './SEO';

interface BlogProps {
    onReadPost?: (post: BlogPost) => void; // Optional for compatibility
    onBack?: () => void;
}

export function Blog({ }: BlogProps) {
    return (
        <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
            <SEO
                title="Subtitle Editing Tips & Guides - SRT Merger Blog"
                description="Learn how to merge SRT files, fix sync issues, and optimize subtitles for video content."
            />
            <div className="max-w-3xl mx-auto px-4 py-12 sm:py-20">
                {/* Header */}
                <div className="mb-16">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-sm font-mono text-gray-500 hover:text-gray-900 mb-8 transition-colors"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                        Back to Merger
                    </Link>
                    <h1 className="font-mono text-4xl sm:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
                        Blog
                    </h1>
                    <p className="text-lg text-gray-600">
                        Thoughts on subtitling, development, and building tools for creators.
                    </p>
                </div>

                {/* Blog List */}
                <div className="space-y-12">
                    {blogPosts.map((post) => (
                        <article key={post.id} className="group">
                            <Link to={`/blog/${post.id}`} className="block">
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 transition-all hover:shadow-md hover:border-gray-300">
                                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4 font-mono">
                                        <span className="flex items-center gap-1">
                                            <CalendarIcon className="w-3 h-3" />
                                            {post.date}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <ClockIcon className="w-3 h-3" />
                                            {post.readTime}
                                        </span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                                        {post.title}
                                    </h2>
                                    <p className="text-gray-600 leading-relaxed mb-6">
                                        {post.excerpt}
                                    </p>
                                    <div className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 group-hover:gap-3 transition-all">
                                        Read Article
                                        <ArrowRightIcon className="w-4 h-4" />
                                    </div>
                                </div>
                            </Link>
                        </article>
                    ))}
                </div>
            </div>
        </div>
    );
}

import React from 'react';
import { ArrowLeftIcon, CalendarIcon, ClockIcon } from 'lucide-react';
import { BlogPost as BlogPostType } from '../data/blogPosts';

interface BlogPostProps {
    post: BlogPostType;
    onBack: () => void;
}

export function BlogPost({ post, onBack }: BlogPostProps) {
    return (
        <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
            <div className="max-w-3xl mx-auto px-4 py-12 sm:py-20">
                <button
                    onClick={onBack}
                    className="inline-flex items-center gap-2 text-sm font-mono text-gray-500 hover:text-gray-900 mb-8 transition-colors"
                >
                    <ArrowLeftIcon className="w-4 h-4" />
                    Back to Blog
                </button>

                <article className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 sm:p-12">
                    <header className="mb-10">
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-6 font-mono">
                            <span className="flex items-center gap-1">
                                <CalendarIcon className="w-3 h-3" />
                                {post.date}
                            </span>
                            <span className="flex items-center gap-1">
                                <ClockIcon className="w-3 h-3" />
                                {post.readTime}
                            </span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight leading-tight">
                            {post.title}
                        </h1>
                    </header>

                    <div
                        className="prose prose-zinc max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-blue-600 hover:prose-a:text-blue-700"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                    />
                </article>
            </div>
        </div>
    );
}

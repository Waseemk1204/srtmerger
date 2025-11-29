import React from 'react';
import { ArrowLeftIcon, UploadCloudIcon, FileTextIcon, ArrowRightIcon, DownloadIcon } from 'lucide-react';

interface HowItWorksProps {
    onBack: () => void;
    onStartMerging?: () => void;
}

export function HowItWorks({ onBack, onStartMerging }: HowItWorksProps) {
    return (
        <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
            <div className="max-w-4xl mx-auto px-4 py-12 sm:py-20">
                {/* Header */}
                <div className="mb-16 text-center">
                    <button
                        onClick={onBack}
                        className="inline-flex items-center gap-2 text-sm font-mono text-gray-500 hover:text-gray-900 mb-8 transition-colors"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                        Back to Merger
                    </button>
                    <h1 className="font-mono text-4xl sm:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
                        How it works
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Five simple steps to combine your subtitles. No technical skills required.
                    </p>
                </div>

                <div className="space-y-24">
                    {/* Step 1: Upload */}
                    <div className="flex flex-col md:flex-row items-center gap-12">
                        <div className="flex-1 text-center md:text-left">
                            <div className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-mono text-xs font-bold mb-4">
                                STEP 01
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Upload your files</h2>
                            <p className="text-gray-600 leading-relaxed">
                                Drag and drop your SRT files (and text-based formats) directly into the browser.
                                We support bulk uploading, so feel free to add multiple files.
                            </p>
                        </div>
                        <div className="flex-1 w-full max-w-sm bg-white rounded-2xl shadow-lg border border-gray-200 p-8 aspect-square flex items-center justify-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gray-50/50"></div>
                            {/* Animation Container */}
                            <div className="relative z-10 w-full h-full flex items-center justify-center">
                                <div className="w-32 h-32 border-2 border-dashed border-blue-300 rounded-xl flex items-center justify-center bg-blue-50">
                                    <UploadCloudIcon className="w-10 h-10 text-blue-400" />
                                </div>
                                {/* Falling Files */}
                                <div className="absolute top-10 animate-drop-in" style={{ animationDelay: '0s' }}>
                                    <div className="bg-white p-2 rounded shadow-md border border-gray-200">
                                        <FileTextIcon className="w-6 h-6 text-gray-400" />
                                    </div>
                                </div>
                                <div className="absolute top-6 right-16 animate-drop-in" style={{ animationDelay: '0.5s' }}>
                                    <div className="bg-white p-2 rounded shadow-md border border-gray-200">
                                        <FileTextIcon className="w-6 h-6 text-gray-400" />
                                    </div>
                                </div>
                                <div className="absolute top-12 left-16 animate-drop-in" style={{ animationDelay: '1s' }}>
                                    <div className="bg-white p-2 rounded shadow-md border border-gray-200">
                                        <FileTextIcon className="w-6 h-6 text-gray-400" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Reorder */}
                    <div className="flex flex-col md:flex-row-reverse items-center gap-12">
                        <div className="flex-1 text-center md:text-left">
                            <div className="inline-block px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-mono text-xs font-bold mb-4">
                                STEP 02
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Arrange in order</h2>
                            <p className="text-gray-600 leading-relaxed">
                                Need to change the sequence? Simply drag and drop the files to reorder them.
                                The timeline automatically adjusts to match your new order.
                            </p>
                        </div>
                        <div className="flex-1 w-full max-w-sm bg-white rounded-2xl shadow-lg border border-gray-200 p-8 aspect-square flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gray-50/50"></div>
                            {/* Animation Container */}
                            <div className="relative z-10 w-full max-w-[200px] space-y-3">
                                <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex items-center gap-3 animate-swap-right">
                                    <div className="w-6 h-6 bg-purple-100 rounded flex items-center justify-center text-xs font-mono text-purple-600">1</div>
                                    <div className="h-2 w-20 bg-gray-100 rounded"></div>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex items-center gap-3 animate-swap-left">
                                    <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center text-xs font-mono text-blue-600">2</div>
                                    <div className="h-2 w-24 bg-gray-100 rounded"></div>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex items-center gap-3">
                                    <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-xs font-mono text-gray-500">3</div>
                                    <div className="h-2 w-16 bg-gray-100 rounded"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step 3: Timeline Adjustment */}
                    <div className="flex flex-col md:flex-row items-center gap-12">
                        <div className="flex-1 text-center md:text-left">
                            <div className="inline-block px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 font-mono text-xs font-bold mb-4">
                                STEP 03
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Timeline Adjustment</h2>
                            <p className="text-gray-600 leading-relaxed">
                                We automatically shift timestamps so files play sequentially.
                                You can also customize the offset or choose to keep original timestamps.
                            </p>
                        </div>
                        <div className="flex-1 w-full max-w-sm bg-white rounded-2xl shadow-lg border border-gray-200 p-8 aspect-square flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gray-50/50"></div>
                            {/* Animation Container */}
                            <div className="relative z-10 w-full max-w-[240px] flex items-center justify-center gap-2">
                                <div className="w-24 h-16 bg-white border border-gray-200 rounded shadow-sm flex items-center justify-center text-xs font-mono text-gray-400">
                                    File 1
                                </div>
                                <div className="w-24 h-16 bg-blue-50 border border-blue-200 rounded shadow-sm flex items-center justify-center text-xs font-mono text-blue-600 animate-timeline-shift">
                                    File 2
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step 4: Merge Preview */}
                    <div className="flex flex-col md:flex-row-reverse items-center gap-12">
                        <div className="flex-1 text-center md:text-left">
                            <div className="inline-block px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 font-mono text-xs font-bold mb-4">
                                STEP 04
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Instant Preview</h2>
                            <p className="text-gray-600 leading-relaxed">
                                See exactly how your merged subtitles will look.
                                Check the timing and content in real-time before downloading.
                            </p>
                        </div>
                        <div className="flex-1 w-full max-w-sm bg-white rounded-2xl shadow-lg border border-gray-200 p-8 aspect-square flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gray-50/50"></div>
                            {/* Animation Container */}
                            <div className="relative z-10 w-48 h-32 bg-gray-900 rounded-lg border border-gray-800 overflow-hidden p-3">
                                <div className="space-y-2 animate-preview-scroll">
                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                        <div key={i} className="space-y-1">
                                            <div className="w-4 h-1 bg-gray-700 rounded"></div>
                                            <div className="w-12 h-1 bg-blue-500/50 rounded"></div>
                                            <div className="w-full h-1 bg-gray-600 rounded"></div>
                                        </div>
                                    ))}
                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                        <div key={i} className="space-y-1">
                                            <div className="w-4 h-1 bg-gray-700 rounded"></div>
                                            <div className="w-12 h-1 bg-blue-500/50 rounded"></div>
                                            <div className="w-full h-1 bg-gray-600 rounded"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step 5: Merge */}
                    <div className="flex flex-col md:flex-row items-center gap-12">
                        <div className="flex-1 text-center md:text-left">
                            <div className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 font-mono text-xs font-bold mb-4">
                                STEP 05
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Merge & Download</h2>
                            <p className="text-gray-600 leading-relaxed">
                                Click the merge button and we'll combine everything into a single, perfectly timed file.
                                Download it instantly and you're done!
                            </p>
                        </div>
                        <div className="flex-1 w-full max-w-sm bg-white rounded-2xl shadow-lg border border-gray-200 p-8 aspect-square flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gray-50/50"></div>
                            {/* Animation Container */}
                            <div className="relative z-10 flex items-center gap-2">
                                <div className="w-20 h-24 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col items-center justify-center gap-2 animate-merge-slide">
                                    <div className="w-8 h-1 bg-gray-200 rounded"></div>
                                    <div className="w-12 h-1 bg-gray-200 rounded"></div>
                                    <div className="w-6 h-1 bg-gray-200 rounded"></div>
                                </div>
                                <ArrowRightIcon className="w-6 h-6 text-gray-300" />
                                <div className="w-24 h-32 bg-gray-900 rounded-lg shadow-xl flex flex-col items-center justify-center gap-3 text-white">
                                    <FileTextIcon className="w-8 h-8" />
                                    <div className="text-[10px] font-mono opacity-60">MERGED.SRT</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="mt-24 text-center">
                    <button
                        onClick={onStartMerging || onBack}
                        className="px-8 py-4 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 inline-flex items-center gap-2"
                    >
                        Start Merging Now
                        <ArrowRightIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

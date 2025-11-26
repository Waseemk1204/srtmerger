import React from 'react';
import { ArrowLeftIcon, ShieldIcon, LockIcon, EyeOffIcon, ServerIcon } from 'lucide-react';

interface PrivacyPolicyProps {
    onBack: () => void;
}

export function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
    return (
        <div className="min-h-screen bg-gray-50 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-8 transition-colors font-medium"
                >
                    <ArrowLeftIcon className="w-4 h-4" />
                    Back to Merger
                </button>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-blue-600 px-6 py-8 sm:px-10 sm:py-12 text-white">
                        <div className="flex items-center gap-3 mb-4">
                            <ShieldIcon className="w-8 h-8 opacity-90" />
                            <h1 className="text-2xl sm:text-3xl font-bold">Privacy Policy</h1>
                        </div>
                        <p className="text-blue-100 text-lg">
                            Your privacy is our top priority. We believe your data belongs to you.
                        </p>
                    </div>

                    <div className="p-6 sm:p-10 space-y-8 text-gray-700 leading-relaxed">
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <LockIcon className="w-5 h-5 text-blue-600" />
                                1. Client-Side Processing
                            </h2>
                            <p>
                                SRT Merger operates <strong>entirely in your web browser</strong>. When you upload files, they are processed locally on your device using JavaScript.
                                <strong> No files are ever uploaded to any server.</strong> Your transcripts, subtitles, and metadata never leave your computer.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <EyeOffIcon className="w-5 h-5 text-blue-600" />
                                2. No Data Collection
                            </h2>
                            <p>
                                We do not collect, store, or share any personal information. We do not use cookies for tracking purposes.
                                Since we don't have a backend database, we literally cannot store your data even if we wanted to.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <ServerIcon className="w-5 h-5 text-blue-600" />
                                3. Hosting & Analytics
                            </h2>
                            <p>
                                This website is hosted on a static file server. We may use basic, privacy-focused analytics (like simple page view counters)
                                that do not track individual users or collect personally identifiable information (PII).
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">4. Contact Us</h2>
                            <p>
                                If you have any questions about this Privacy Policy or technical issues with the site, please contact us at:
                                <br />
                                <a href="mailto:waseemk1204@gmail.com" className="text-blue-600 hover:underline font-medium mt-2 inline-block">
                                    waseemk1204@gmail.com
                                </a>
                            </p>
                        </section>

                        <div className="border-t border-gray-100 pt-6 text-sm text-gray-500">
                            Last updated: {new Date().toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

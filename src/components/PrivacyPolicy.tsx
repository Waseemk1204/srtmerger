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
                            We are transparent about how we handle your data.
                        </p>
                    </div>

                    <div className="p-6 sm:p-10 space-y-8 text-gray-700 leading-relaxed">
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <ServerIcon className="w-5 h-5 text-blue-600" />
                                1. Information We Collect
                            </h2>
                            <p className="mb-4">
                                To provide our services, we collect the following types of information:
                            </p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong>Account Information:</strong> When you sign up, we collect your name, email address, and a hashed version of your password.</li>
                                <li><strong>User Content:</strong> If you use our "Save to History" feature, we store your merged SRT files and their metadata (filename, size, creation date) in our secure database so you can access them later.</li>
                                <li><strong>Usage Data:</strong> We use privacy-focused analytics to understand website traffic and performance. This data is aggregated and does not identify individual users.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <LockIcon className="w-5 h-5 text-blue-600" />
                                2. How We Use Your Data
                            </h2>
                            <p className="mb-4">
                                We use your information solely for the purpose of providing and improving the SRT Merger service:
                            </p>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>To create and manage your user account.</li>
                                <li>To store and retrieve your saved files upon your request.</li>
                                <li>To ensure the security and performance of our platform.</li>
                            </ul>
                            <p className="mt-4">
                                <strong>We do not sell, rent, or share your personal data with third parties for marketing purposes.</strong>
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <ShieldIcon className="w-5 h-5 text-blue-600" />
                                3. Data Security
                            </h2>
                            <p>
                                We implement industry-standard security measures to protect your data:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 mt-2">
                                <li><strong>Encryption:</strong> All data transmission occurs over secure HTTPS connections. Passwords are hashed using strong cryptographic algorithms (bcrypt) before storage.</li>
                                <li><strong>Access Control:</strong> Your saved files are private and accessible only by you through your authenticated account.</li>
                                <li><strong>Database Security:</strong> We use a secure, managed MongoDB database with strict access controls.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <EyeOffIcon className="w-5 h-5 text-blue-600" />
                                4. Your Rights
                            </h2>
                            <p>
                                You have full control over your data. You can:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 mt-2">
                                <li><strong>Access:</strong> View your saved files and account details at any time via the Dashboard.</li>
                                <li><strong>Delete:</strong> You can delete individual files from your history. You may also request the complete deletion of your account and all associated data by contacting us.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">5. Contact Us</h2>
                            <p>
                                If you have any questions about this Privacy Policy or wish to exercise your data rights, please contact us at:
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

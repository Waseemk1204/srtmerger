import { Link } from 'react-router-dom';
import { ZapIcon, ShieldCheckIcon, ClockIcon, ArrowRightIcon } from 'lucide-react';

export function Features() {
    return (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white border-b border-gray-100">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {/* Feature 1 */}
                    <div className="flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                            <ZapIcon className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">
                            Easy SRT Merging
                        </h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            Combine multiple subtitle files in seconds. Our intuitive drag-and-drop interface makes merging SRT files simple and efficient for everyone.
                        </p>
                        <Link to="/how-it-works" className="text-blue-600 font-medium hover:underline inline-flex items-center gap-1">
                            See how it works <ArrowRightIcon className="w-4 h-4" />
                        </Link>
                    </div>

                    {/* Feature 2 */}
                    <div className="flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-6">
                            <ShieldCheckIcon className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">
                            Secure Subtitle Processing
                        </h2>
                        <p className="text-gray-600 leading-relaxed">
                            Your files never leave your browser. We process everything locally on your device, ensuring 100% privacy and security for your content.
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                            <ClockIcon className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">
                            Automatic Time Shifting
                        </h2>
                        <p className="text-gray-600 leading-relaxed">
                            Don't worry about syncing. Our tool automatically adjusts timestamps so your subtitles play sequentially without overlap.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}

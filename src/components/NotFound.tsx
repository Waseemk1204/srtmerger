import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
            <div className="text-center max-w-2xl">
                {/* 404 Text */}
                <div className="mb-8">
                    <h1 className="text-9xl font-bold text-gray-300">
                        404
                    </h1>
                </div>

                {/* Message */}
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Page Not Found
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                    The page you're looking for doesn't exist or has been moved.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Go Back
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        <Home className="w-5 h-5" />
                        Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
}

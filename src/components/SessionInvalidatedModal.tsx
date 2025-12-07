import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';

interface SessionInvalidatedModalProps {
    onClose: () => void;
}

export function SessionInvalidatedModal({ onClose }: SessionInvalidatedModalProps) {
    const navigate = useNavigate();

    const handleLogin = () => {
        onClose();
        navigate('/?view=login');
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-fade-in-up">
                <div className="text-center">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <LogOut className="w-8 h-8 text-orange-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Session Expired</h3>
                    <p className="text-gray-600 mb-6">
                        Your account was accessed from another device. Please log in again to continue.
                    </p>
                    <button
                        onClick={handleLogin}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        Log In Again
                    </button>
                </div>
            </div>
        </div>
    );
}

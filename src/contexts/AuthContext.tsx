import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../api/client';
import { User } from '../types';
import { getBrowserFingerprint } from '../utils/fingerprint';

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string, name: string) => Promise<void>;
    googleLogin: (credential: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in on mount
        const initAuth = async () => {
            const storedToken = localStorage.getItem('token');
            if (storedToken) {
                try {
                    const response: any = await api.getMe();
                    setUser(response.user);
                    setToken(storedToken);
                } catch (error) {
                    // Token invalid, clear it
                    localStorage.removeItem('token');
                    setToken(null);
                    setUser(null);
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const fingerprint = await getBrowserFingerprint();
            const response: any = await api.login(email, password, fingerprint);
            setUser(response.user);
            setToken(response.token);
            localStorage.setItem('token', response.token);
        } catch (error) {
            throw error;
        }
    };

    const signup = async (email: string, password: string, name: string) => {
        try {
            const fingerprint = await getBrowserFingerprint();
            const response: any = await api.signup(email, password, name, fingerprint);
            setUser(response.user);
            setToken(response.token);
            localStorage.setItem('token', response.token);
        } catch (error) {
            throw error;
        }
    };

    const googleLogin = async (credential: string) => {
        try {
            const fingerprint = await getBrowserFingerprint();
            const response: any = await api.googleLogin(credential, fingerprint);
            setUser(response.user);
            setToken(response.token);
            localStorage.setItem('token', response.token);
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        api.logout().catch(() => { }); // Fire and forget
    };

    const refreshUser = async () => {
        if (token) {
            try {
                const response: any = await api.getMe();
                setUser(response.user);
            } catch (error) {
                console.error('Failed to refresh user data:', error);
            }
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                loading,
                login,
                signup,
                googleLogin,
                logout,
                refreshUser,
                isAuthenticated: !!user,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

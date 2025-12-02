/**
 * API client for backend communication
 */

// File size limit for uploads (500KB)
export const MAX_FILE_SIZE = 500 * 1024; // 500KB in bytes

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class APIError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
        this.name = 'APIError';
    }
}

async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = localStorage.getItem('token');

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('API Error Details:', data);
        throw new APIError(data.error || data.message || 'Something went wrong', response.status);
    }

    return data;
}

export const api = {
    // Auth
    signup: (email: string, password: string, name: string, fingerprint?: string) =>
        request('/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ email, password, name, fingerprint }),
        }),

    login: (email: string, password: string, fingerprint?: string) =>
        request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password, fingerprint }),
        }),

    googleLogin: (credential: string, fingerprint?: string) =>
        request('/auth/google', {
            method: 'POST',
            body: JSON.stringify({ credential, fingerprint }),
        }),

    logout: () =>
        request('/auth/logout', {
            method: 'POST',
        }),

    getMe: () =>
        request('/auth/me'),

    // Files
    saveFile: (filename: string, content: string, filesize: number) => {
        const payload = { filename, content, filesize };
        return request('/files', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },

    listFiles: () =>
        request<{ files: any[] }>('/files'),

    getFile: (id: string) =>
        request(`/files/${id}`),

    renameFile: (id: string, filename: string) =>
        request(`/files/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ filename }),
        }),

    deleteFile: (id: string) =>
        request(`/files/${id}`, {
            method: 'DELETE',
        }),

    // Payment
    createSubscription: (planId: string) =>
        request('/payment/create-subscription', {
            method: 'POST',
            body: JSON.stringify({ planId }),
        }),

    verifySubscription: (data: any) =>
        request('/payment/verify-subscription', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    getSubscriptionStatus: () =>
        request('/payment/subscription-status'),

    cancelSubscription: () =>
        request('/payment/cancel-subscription', {
            method: 'POST',
        }),

    // Usage tracking
    trackMerge: (fileCount: number) =>
        request('/usage/merge', {
            method: 'POST',
            body: JSON.stringify({ fileCount }),
        }),

    // Anonymous usage tracking
    checkAnonymousUsage: (fingerprint: string) =>
        request('/usage/check-anonymous', {
            method: 'POST',
            body: JSON.stringify({ fingerprint }),
        }),

    trackAnonymousMerge: (fingerprint: string, fileCount: number) =>
        request('/usage/merge-anonymous', {
            method: 'POST',
            body: JSON.stringify({ fingerprint, fileCount }),
        }),
};

export { APIError };

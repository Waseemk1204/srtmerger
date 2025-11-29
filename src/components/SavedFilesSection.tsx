import React, { useState, useEffect } from 'react';
import { FileHistory } from './FileHistory';
import { api } from '../api/client';

interface SavedFilesSectionProps {
    key?: number;
}

export function SavedFilesSection({ key }: SavedFilesSectionProps) {
    const [savedFiles, setSavedFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFiles();
    }, [key]); // Reload when key changes

    const loadFiles = async () => {
        setLoading(true);
        try {
            const response = await api.listFiles();
            setSavedFiles(response.files);
        } catch (err) {
            console.error('Failed to load saved files');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-3">Loading saved files...</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8 lg:p-10">
            <FileHistory
                files={savedFiles}
                onFileDeleted={(id) => setSavedFiles(prev => prev.filter(f => f._id !== id))}
                onFileRenamed={(id, name) => setSavedFiles(prev => prev.map(f => f._id === id ? { ...f, filename: name } : f))}
            />
        </div>
    );
}

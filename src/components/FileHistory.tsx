import { useState } from 'react';
import { FileTextIcon, DownloadIcon, Trash2Icon, Edit2Icon, CheckIcon, XIcon, FileJsonIcon } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { UpgradeModal } from './Pricing/UpgradeModal';

interface SavedFile {
    _id: string;
    filename: string;
    filesize: number;
    createdAt: string;
}

interface FileHistoryProps {
    files: SavedFile[];
    onFileDeleted: (id: string) => void;
    onFileRenamed: (id: string, newName: string) => void;
    title?: string;
}

export function FileHistory({ files, onFileDeleted, onFileRenamed, title = "Merged Files" }: FileHistoryProps) {
    const { user } = useAuth();
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
    const [isSavingRename, setIsSavingRename] = useState(false);

    // Upgrade Modal State
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    // Feature Access
    const currentPlan = user?.subscription?.plan || 'free';
    const canRename = ['tier1', 'tier2', 'tier3'].includes(currentPlan);

    const handleDownload = async (file: SavedFile) => {
        setDownloadingId(file._id);
        try {
            const response: any = await api.getFile(file._id);
            const content = response.file.content;
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.filename;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Download failed:', err);
            alert('Failed to download file');
        } finally {
            setDownloadingId(null);
        }
    };

    const handleDelete = async (fileId: string) => {
        try {
            await api.deleteFile(fileId);
            onFileDeleted(fileId);
            setConfirmingDeleteId(null);
        } catch (err: any) {
            // If file not found, it may have been already deleted (e.g., after auto-clear)
            if (err?.message?.includes('not found') || err?.message?.includes('404')) {
                // Silently remove from UI
                onFileDeleted(fileId);
                setConfirmingDeleteId(null);
            } else {
                console.error('Failed to delete file:', err);
                alert('Failed to delete file. Please try again.');
            }
        }
    };


    const startEditing = (file: SavedFile) => {
        setEditingId(file._id);
        setEditName(file.filename);
    };

    const saveRename = async () => {
        if (!editingId || !editName.trim() || isSavingRename) return;

        // Check feature access before saving
        if (!canRename) {
            setShowUpgradeModal(true);
            return;
        }

        setIsSavingRename(true);
        try {
            await api.renameFile(editingId, editName);
            onFileRenamed(editingId, editName);
            setEditingId(null);
        } catch (err) {
            console.error('Failed to rename file');
            alert('Failed to rename file. Please try again.');
        } finally {
            setIsSavingRename(false);
        }
    };

    if (files.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 border-dashed">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FileTextIcon className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900">No saved files</h3>
                <p className="text-xs text-gray-500 mt-1">Merged files will appear here</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileTextIcon className="w-5 h-5 text-blue-600" />
                {title}
            </h2>
            <div className="grid gap-3">
                {files.map((file) => (
                    <div key={file._id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    <FileTextIcon className="w-5 h-5" />
                                </div>
                                {editingId === file._id ? (
                                    <div className="flex items-center gap-2 flex-1">
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    saveRename();
                                                } else if (e.key === 'Escape') {
                                                    setEditingId(null);
                                                }
                                            }}
                                            className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={saveRename}
                                            disabled={isSavingRename}
                                            className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Save"
                                        >
                                            <CheckIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEditingId(null)}
                                            disabled={isSavingRename}
                                            className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                                            title="Cancel"
                                        >
                                            <XIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-medium text-gray-900 truncate" title={file.filename}>
                                            {file.filename}
                                        </h3>
                                        <p className="text-xs text-gray-500">
                                            {(file.filesize / 1024).toFixed(1)} KB • {new Date(file.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                                {editingId !== file._id && (
                                    <>
                                        <button
                                            onClick={() => startEditing(file)}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Rename"
                                        >
                                            <Edit2Icon className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDownload(file)}
                                            disabled={downloadingId === file._id}
                                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                            title="Download SRT"
                                        >
                                            {downloadingId === file._id ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600" />
                                            ) : (
                                                <DownloadIcon className="w-4 h-4" />
                                            )}
                                        </button>
                                        {confirmingDeleteId === file._id ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-red-600">Delete?</span>
                                                <button
                                                    onClick={() => handleDelete(file._id)}
                                                    className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                                                >
                                                    Yes
                                                </button>
                                                <button
                                                    onClick={() => setConfirmingDeleteId(null)}
                                                    className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                                >
                                                    No
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setConfirmingDeleteId(file._id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2Icon className="w-4 h-4" />
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Upgrade Modal */}
            {showUpgradeModal && (
                <UpgradeModal
                    isOpen={showUpgradeModal}
                    onClose={() => setShowUpgradeModal(false)}
                    reason="feature"
                    featureName="File Renaming"
                />
            )}
        </div>
    );
}

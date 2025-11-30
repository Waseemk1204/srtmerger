import { useState, useMemo, useEffect } from 'react';
import { SparklesIcon, LockIcon } from 'lucide-react';
import { UploadArea } from './UploadArea';
import { FileList } from './FileList';
import { TimelineAlignmentCard, SecondaryFile, ComputedOffset } from './TimelineAlignmentCard';
import { MergePreview } from './MergePreview';
import { TranscriptFile } from '../types';
import { mergeSrtFiles, MergeResult } from '../utils/srt-merge';
import { parseTimestampToMs, formatMsToTimestamp } from '../utils/timestampUtils';
import { permissiveParseSrt } from '../utils/srt-merge';
import { shiftTimestampLine } from '../utils/timestamp-arith';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { UpgradeModal } from './Pricing/UpgradeModal';

interface FileWithContent extends TranscriptFile {
    fileContent: string;
}

interface MergerToolProps {
    onFileSaved?: () => void;
    showDiagnostics?: boolean;
    initialFiles?: any[];
    onShowToast?: (message: string) => void;
}

export function MergerTool({ onFileSaved, showDiagnostics = true, initialFiles = [], onShowToast }: MergerToolProps) {
    const { user, refreshUser } = useAuth();
    const [files, setFiles] = useState<FileWithContent[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [mergeResult, setMergeResult] = useState<MergeResult | null>(null);
    const [computedOffsets, setComputedOffsets] = useState<ComputedOffset[]>([]);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [edits, setEdits] = useState<Record<string, { text?: string; start?: string; end?: string }>>({}); // Key: fileId-blockIndex


    const handleShowToast = (message: string) => {
        if (onShowToast) {
            onShowToast(message);
        } else {
            setToastMessage(message);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        }
    };
    // Prefetch fingerprint on mount to speed up subsequent checks
    useEffect(() => {
        const prefetchFingerprint = async () => {
            try {
                const { getBrowserFingerprint } = await import('../utils/fingerprint');
                await getBrowserFingerprint();
            } catch (e) {
                console.error('Failed to prefetch fingerprint:', e);
            }
        };
        prefetchFingerprint();
    }, []);
    const [isSaving, setIsSaving] = useState(false);

    // Upgrade Modal State
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [upgradeReason, setUpgradeReason] = useState<'limit' | 'feature' | 'general'>('limit');
    const [upgradeFeature, setUpgradeFeature] = useState<string>('');
    const [upgradeLimit, setUpgradeLimit] = useState<number>(0);
    const [showLoginRequiredModal, setShowLoginRequiredModal] = useState(false);

    // Feature Access Helpers
    const currentPlan = user?.subscription?.plan || 'free';
    const canRename = ['tier1', 'tier2', 'tier3'].includes(currentPlan);
    const canAlign = ['tier1', 'tier2', 'tier3'].includes(currentPlan);
    const canPreview = ['tier2', 'tier3'].includes(currentPlan);
    const canEdit = currentPlan === 'tier3';

    const PLAN_LIMITS = {
        free: 4,
        tier1: 20,
        tier2: 100,
        tier3: Infinity
    };

    useEffect(() => {
        if (initialFiles.length > 0) {
            const mappedFiles: FileWithContent[] = initialFiles.map(f => ({
                id: f._id,
                name: f.filename,
                type: '.' + f.filename.split('.').pop()?.toLowerCase() || '.txt',
                size: f.filesize || 0,
                duration: null, // Content not loaded initially for history items
                isPrimary: false, // Will be set by the component logic
                offset: '00:00:00,000',
                content: [],
                errors: [],
                fileContent: ''
            }));
            setFiles(mappedFiles.map((f, idx) => ({ ...f, isPrimary: idx === 0 })));
        }
    }, [initialFiles]);

    // Save dashboard state to localStorage
    useEffect(() => {
        // Only save if we have files (don't save empty state on initial mount)
        if (files.length > 0) {
            const state = {
                files,
                computedOffsets,
                edits,
                timestamp: Date.now()
            };
            try {
                localStorage.setItem('dashboard-merger-state', JSON.stringify(state));
            } catch (e) {
                console.error('Failed to save dashboard state:', e);
            }
        }
    }, [files, computedOffsets, edits]);

    // Restore dashboard state from localStorage on mount
    useEffect(() => {
        // Only restore if we don't have initial files and not already loaded
        if (initialFiles.length === 0 && files.length === 0) {
            try {
                const savedState = localStorage.getItem('dashboard-merger-state');
                if (savedState) {
                    const state = JSON.parse(savedState);
                    // Check if state is not too old (6 hours for better performance)
                    const age = Date.now() - (state.timestamp || 0);
                    const SIX_HOURS = 6 * 60 * 60 * 1000; // 21600000 ms
                    if (age < SIX_HOURS) {
                        setFiles(state.files || []);
                        setComputedOffsets(state.computedOffsets || []);
                        setEdits(state.edits || {});
                    } else {
                        // Clear old state
                        localStorage.removeItem('dashboard-merger-state');
                    }
                }
            } catch (e) {
                console.error('Failed to restore dashboard state:', e);
                localStorage.removeItem('dashboard-merger-state');
            }
        }
    }, []); // Only run on mount

    const handleFilesSelected = async (selectedFiles: File[]) => {
        setIsProcessing(true);
        try {
            // Check Upload Limit with rolling 24h window
            const currentPlan = user?.subscription?.plan || 'free';
            const limit = PLAN_LIMITS[currentPlan];

            let currentCount = 0;
            let firstMergeTime: string | undefined;
            let isExpired = false;

            if (user) {
                // Logged-in user: use server data
                currentCount = user.usage?.uploadCount || 0;
                firstMergeTime = user.usage?.firstMergeTime;
            } else {
                // Anonymous user: check server-side fingerprint limit
                try {
                    const { getBrowserFingerprint } = await import('../utils/fingerprint');
                    const fingerprint = await getBrowserFingerprint();
                    const serverCheck: any = await api.checkAnonymousUsage(fingerprint);

                    if (!serverCheck.allowed) {
                        if (serverCheck.requiresLogin) {
                            // This device has been used with an account before - show modal
                            setIsProcessing(false);
                            setShowLoginRequiredModal(true);
                            return;
                        }
                        // Regular limit exceeded
                        setUpgradeReason('limit');
                        setUpgradeLimit(serverCheck.limit);
                        setShowUpgradeModal(true);
                        setIsProcessing(false);
                        return;
                    }

                    currentCount = serverCheck.current;
                    // Also sync with localStorage for UI display
                    const { anonymousUsage } = await import('../utils/anonymousUsage');
                    const anonUsage = anonymousUsage.get();
                    if (anonUsage) {
                        currentCount = Math.max(currentCount, anonUsage.uploadCount || 0);
                    }
                } catch (error) {
                    console.error('Failed to check server usage, falling back to localStorage:', error);
                    // Fallback to localStorage if server check fails
                    const { anonymousUsage } = await import('../utils/anonymousUsage');
                    const anonUsage = anonymousUsage.get();
                    currentCount = anonUsage?.uploadCount || 0;
                    firstMergeTime = anonUsage?.firstMergeTime;
                }
            }

            // Check if 24h window has passed since first upload
            isExpired = firstMergeTime ?
                (Date.now() - new Date(firstMergeTime).getTime()) >= 24 * 60 * 60 * 1000 : false;

            // If expired or no timestamp, count is effectively 0
            const effectiveCount = isExpired || !firstMergeTime ? 0 : currentCount;

            console.log('Upload Limit Check (24h window):', {
                userType: user ? 'authenticated' : 'anonymous',
                firstMergeTime,
                isExpired,
                currentCount,
                effectiveCount,
                limit,
                remainingUploads: limit - effectiveCount,
                willBlock: effectiveCount >= limit
            });

            // Check if user has exceeded upload limit (each upload action counts, not file count)
            if (effectiveCount >= limit) {
                setUpgradeReason('limit');
                setUpgradeLimit(limit);
                setShowUpgradeModal(true);
                setIsProcessing(false);
                return;
            }

            // Validate file sizes (500KB limit per file)
            const MAX_UPLOAD_SIZE = 500 * 1024; // 500KB in bytes
            const oversizedFiles = selectedFiles.filter(f => f.size > MAX_UPLOAD_SIZE);

            if (oversizedFiles.length > 0) {
                setIsProcessing(false);
                if (selectedFiles.length === 1) {
                    alert(`File size exceeds the limit. Maximum allowed: 500KB\nYour file: ${(oversizedFiles[0].size / 1024).toFixed(1)}KB`);
                } else {
                    alert(`One or more files exceed the 500KB size limit.\n\nOversized files:\n${oversizedFiles.map(f => `• ${f.name} (${(f.size / 1024).toFixed(1)}KB)`).join('\n')}\n\nPlease select smaller files.`);
                }
                return;
            }

            const newFiles: FileWithContent[] = [];
            for (const file of selectedFiles) {
                try {
                    const content = await file.text();
                    let duration: string | null = null;
                    try {
                        const blocks = permissiveParseSrt(content);
                        if (blocks.length > 0) {
                            const lastBlock = blocks[blocks.length - 1];
                            const shifted = shiftTimestampLine(lastBlock.tsRaw, 0);
                            if (shifted) {
                                const endToken = shifted.split('-->')[1]?.trim();
                                if (endToken) duration = endToken;
                            }
                        }
                    } catch (e) { }
                    const hasPrimary = files.some(f => f.isPrimary) || newFiles.some(f => f.isPrimary);
                    newFiles.push({
                        id: `file-${Date.now()}-${Math.random()}`,
                        name: file.name,
                        type: '.' + file.name.split('.').pop()?.toLowerCase() || '.txt',
                        size: file.size,
                        duration,
                        isPrimary: !hasPrimary && files.length === 0 && newFiles.length === 0,
                        offset: '00:00:00,000',
                        content: [],
                        errors: [],
                        fileContent: content
                    });
                } catch (error) {
                    const hasPrimary = files.some(f => f.isPrimary);
                    newFiles.push({
                        id: `file-${Date.now()}-${Math.random()}`,
                        name: file.name,
                        type: '.' + file.name.split('.').pop()?.toLowerCase() || '.txt',
                        size: file.size,
                        duration: null,
                        isPrimary: !hasPrimary && files.length === 0 && newFiles.length === 0,
                        offset: '00:00:00,000',
                        content: [],
                        errors: [`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`],
                        fileContent: ''
                    });
                }
            }
            setFiles(prev => [...prev, ...newFiles]);
        } finally {
            setIsProcessing(false);
        }
    };


    const handleSetPrimary = (id: string) => {
        setFiles(prev => prev.map(f => ({ ...f, isPrimary: f.id === id })));
        setMergeResult(null);
        setComputedOffsets([]);
    };

    const handleReorder = (fromIndex: number, toIndex: number) => {
        setFiles(prev => {
            const newFiles = [...prev];
            const [movedFile] = newFiles.splice(fromIndex, 1);
            newFiles.splice(toIndex, 0, movedFile);
            return newFiles.map((f, idx) => ({ ...f, isPrimary: idx === 0 }));
        });
        setMergeResult(null);
        setComputedOffsets([]);
    };

    const handleRemove = (id: string) => {
        setFiles(prev => {
            const newFiles = prev.filter(f => f.id !== id);
            return newFiles.map((f, idx) => ({ ...f, isPrimary: idx === 0 }));
        });
        setMergeResult(null);
        setComputedOffsets([]);
    };

    const handleClearFiles = () => {
        setFiles([]);
        setMergeResult(null);
        setComputedOffsets([]);
        setEdits({});
        // Clear saved state from localStorage
        localStorage.removeItem('dashboard-merger-state');
    };



    const primaryFile = useMemo(() => files.find(f => f.isPrimary), [files]);

    const primaryEnd = useMemo(() => {
        if (!primaryFile) return '00:00:00,000';
        if (primaryFile.duration) return primaryFile.duration;
        let lastEndMs = 0;
        const lines = primaryFile.fileContent.split('\n');
        for (const line of lines) {
            if (line.includes('-->')) {
                const parts = line.split('-->');
                if (parts.length === 2) {
                    const endMs = parseTimestampToMs(parts[1].trim());
                    if (endMs !== null && endMs > lastEndMs) lastEndMs = endMs;
                }
            }
        }
        return formatMsToTimestamp(lastEndMs);
    }, [primaryFile]);

    const secondaryFiles: SecondaryFile[] = useMemo(() => {
        return files.filter(f => !f.isPrimary).map(file => ({
            id: file.id,
            name: file.name,
            currentOffsetMs: parseTimestampToMs(file.offset) ?? 0,
            fileContent: file.fileContent
        }));
    }, [files]);

    const handleTimelineAlignmentChange = (payload: {
        mode: 'auto' | 'none' | 'custom';
        customOffset?: string;
        computedOffsets: ComputedOffset[];
    }) => {
        setComputedOffsets(payload.computedOffsets);
    };

    const handleEdit = (fileId: string, blockIndex: number, field: 'text' | 'start' | 'end', value: string) => {
        setEdits(prev => {
            const key = `${fileId}-${blockIndex}`;
            const current = prev[key] || {};
            return {
                ...prev,
                [key]: { ...current, [field]: value }
            };
        });
    };

    const handleMerge = async () => {
        if (files.length === 0) return;

        // Check if user has exceeded daily merge limit (rolling 24h window)
        const currentPlan = user?.subscription?.plan || 'free';
        const limit = PLAN_LIMITS[currentPlan];

        let currentCount = 0;
        let firstMergeTime: string | undefined;
        let isExpired = false;

        if (user) {
            // Logged-in user
            currentCount = user.usage?.uploadCount || 0;
            firstMergeTime = user.usage?.firstMergeTime;
        } else {
            // Anonymous user
            const { anonymousUsage } = await import('../utils/anonymousUsage');
            const anonUsage = anonymousUsage.get();
            currentCount = anonUsage?.uploadCount || 0;
            firstMergeTime = anonUsage?.firstMergeTime;
        }

        // Check if 24h window has passed
        isExpired = firstMergeTime ?
            (Date.now() - new Date(firstMergeTime).getTime()) >= 24 * 60 * 60 * 1000 : false;

        const effectiveCount = isExpired || !firstMergeTime ? 0 : currentCount;

        console.log('Merge check (24h window):', {
            userType: user ? 'authenticated' : 'anonymous',
            firstMergeTime,
            isExpired,
            currentCount,
            effectiveCount,
            limit,
            willBlock: effectiveCount >= limit
        });

        if (effectiveCount >= limit) {
            setUpgradeReason('limit');
            setUpgradeLimit(limit);
            setShowUpgradeModal(true);
            return;
        }

        setIsProcessing(true);
        setMergeResult(null);
        try {
            let result: MergeResult;
            if (computedOffsets.length > 0 && files.length > 1 && primaryFile) {
                const primaryBlocks = permissiveParseSrt(primaryFile.fileContent);
                const allBlocks: Array<{ index: number; timestamp: string; texts: string[] }> = [];
                let globalIndex = 1;
                for (const block of primaryBlocks) {
                    const shifted = shiftTimestampLine(block.tsRaw, 0);
                    if (shifted) {
                        const edit = edits[`${primaryFile.id}-${block.index}`];
                        allBlocks.push({
                            index: globalIndex++,
                            timestamp: (edit?.start && edit?.end)
                                ? `${edit.start} --> ${edit.end}`
                                : (edit?.start ? `${edit.start} --> ${shifted.split('-->')[1].trim()}`
                                    : (edit?.end ? `${shifted.split('-->')[0].trim()} --> ${edit.end}` : shifted)),
                            texts: edit?.text ? [edit.text] : (block.texts.length > 0 ? block.texts : ['[No text]'])
                        });
                    }
                }
                const secondaryFilesList = files.filter(f => !f.isPrimary);
                for (const file of secondaryFilesList) {
                    const offset = computedOffsets.find(o => o.id === file.id);
                    const offsetMs = offset?.offsetMs ?? 0;
                    const blocks = permissiveParseSrt(file.fileContent);
                    for (const block of blocks) {
                        const shifted = shiftTimestampLine(block.tsRaw, offsetMs);
                        if (shifted) {
                            const edit = edits[`${file.id}-${block.index}`];
                            allBlocks.push({
                                index: globalIndex++,
                                timestamp: (edit?.start && edit?.end)
                                    ? `${edit.start} --> ${edit.end}`
                                    : (edit?.start ? `${edit.start} --> ${shifted.split('-->')[1].trim()}`
                                        : (edit?.end ? `${shifted.split('-->')[0].trim()} --> ${edit.end}` : shifted)),
                                texts: edit?.text ? [edit.text] : (block.texts.length > 0 ? block.texts : ['[No text]'])
                            });
                        }
                    }
                }
                const mergedSrt = allBlocks.map(block => {
                    return `${block.index}\n${block.timestamp}\n${block.texts.join('\n')}\n`;
                }).join('\n');
                result = {
                    mergedSrt,
                    diagnostics: [],
                    stats: {
                        totalInputCues: files.reduce((sum, f) => sum + permissiveParseSrt(f.fileContent).length, 0),
                        totalOutputCues: allBlocks.length,
                        parseIssuesCount: 0,
                        filesProcessed: files.length
                    }
                };
            } else {
                const filesToMerge = files.map(file => ({ name: file.name, content: file.fileContent }));
                result = mergeSrtFiles(filesToMerge);
            }

            setMergeResult(result);
            setToastMessage('Merge completed successfully!');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);

            // Track merge operation
            if (user) {
                try {
                    await api.trackMerge(files.length);
                    // Refresh user data to update usage count
                    await refreshUser();
                } catch (error) {
                    console.error('Failed to track merge:', error);
                }

                // Auto-save the file (only if authenticated)
                await saveFile(result);
            } else {
                // Anonymous user: track with fingerprint on server
                try {
                    const { getBrowserFingerprint } = await import('../utils/fingerprint');
                    const fingerprint = await getBrowserFingerprint();
                    await api.trackAnonymousMerge(fingerprint, files.length);
                } catch (error) {
                    console.error('Failed to track anonymous merge:', error);
                }

                // Also update localStorage as visual feedback
                const { anonymousUsage } = await import('../utils/anonymousUsage');
                anonymousUsage.increment(files.length);
            }

            // Auto-clear files after successful merge to allow fresh start
            handleClearFiles();
        } catch (error) {
            handleShowToast(`Merge failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const saveFile = async (result: MergeResult) => {
        setIsSaving(true);
        try {
            const timestamp = new Date().toISOString().slice(0, 16).replace('T', '_').replace(/:/g, '-');
            const filename = `merged_${timestamp}.srt`;
            const filesize = new Blob([result.mergedSrt]).size;

            // Validate merged file size (25MB limit to prevent DB exhaustion)
            const MAX_MERGED_SIZE = 25 * 1024 * 1024; // 25MB
            if (filesize > MAX_MERGED_SIZE) {
                throw new Error(`Merged file too large (${(filesize / 1024 / 1024).toFixed(1)}MB). Maximum: 25MB. Please split your files into smaller merges.`);
            }

            // Save file as plain text
            const saveResult = await api.saveFile(
                filename,
                result.mergedSrt,
                filesize
            );

            handleShowToast('File saved successfully!');

            // Refresh saved files list
            if (onFileSaved) {
                await onFileSaved();
            }
        } catch (error) {
            console.error('Save file error:', error);
            handleShowToast(`Failed to save file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsSaving(false);
        }
    };

    const downloadFile = (content: string, filename: string, mimeType: string = 'text/plain') => {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();

        // Cleanup after a short delay to ensure download starts
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    };

    const canMerge = files.length >= 1;

    return (
        <section id="merger-tool" className="px-4 pb-8">
            <div className="max-w-5xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                    <h2 className="sr-only">Merge SRT Files</h2>
                    <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-400"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                            <div className="w-3 h-3 rounded-full bg-green-400"></div>
                        </div>
                        <div className="text-xs font-mono text-gray-400">srt_merger_v2.exe</div>
                        <div className="w-16"></div>
                    </div>
                    <div className="p-4 sm:p-8 lg:p-10">
                        {/* File Upload Area */}
                        <div className="mb-8">
                            {isProcessing ? (
                                <div className="border-2 border-dashed border-blue-300 rounded-xl p-12 text-center bg-blue-50 flex flex-col items-center justify-center h-64 animate-pulse">
                                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                    <p className="text-lg font-medium text-blue-700">Processing files...</p>
                                    <p className="text-sm text-blue-500 mt-2">Checking limits and parsing content</p>
                                </div>
                            ) : (
                                <UploadArea onFilesSelected={handleFilesSelected} />
                            )}
                        </div>
                        {files.length > 0 && (
                            <div className="mb-10 animate-fade-in">
                                <FileList
                                    files={files}
                                    onSetPrimary={handleSetPrimary}
                                    onRemove={handleRemove}
                                    onReorder={handleReorder}
                                    onClear={handleClearFiles}
                                />
                            </div>
                        )}
                        {files.length > 0 && (
                            <div className="flex flex-col gap-8 mb-10 animate-fade-in">
                                {/* Timeline Alignment - Locked for Free Tier */}
                                {files.length >= 2 && (
                                    <div className="relative">
                                        <TimelineAlignmentCard
                                            primaryEnd={primaryEnd}
                                            secondaryFiles={secondaryFiles}
                                            onChange={handleTimelineAlignmentChange}
                                        />
                                        {!canAlign && (
                                            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-xl border border-gray-200">
                                                <div className="text-center p-6 bg-white rounded-xl shadow-lg border border-gray-100">
                                                    <LockIcon className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Timeline Alignment Locked</h3>
                                                    <p className="text-gray-500 text-sm mb-4">Upgrade to Basic plan to align subtitles.</p>
                                                    <button
                                                        onClick={() => {
                                                            setUpgradeReason('feature');
                                                            setUpgradeFeature('Timeline Alignment');
                                                            setShowUpgradeModal(true);
                                                        }}
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                                                    >
                                                        Unlock Feature
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Merge Preview - Locked for Free/Basic Tier */}
                                <div className="relative">
                                    <MergePreview
                                        files={files}
                                        computedOffsets={computedOffsets}
                                        edits={edits}
                                        onEdit={handleEdit}
                                        canEdit={canEdit}
                                    />
                                    {!canPreview && (
                                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-[60] rounded-xl border border-gray-200">
                                            <div className="text-center p-6 bg-white rounded-xl shadow-lg border border-gray-100">
                                                <LockIcon className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                                                <h3 className="text-lg font-semibold text-gray-900 mb-1">Preview Locked</h3>
                                                <p className="text-gray-500 text-sm mb-4">Upgrade to Pro plan to preview merges.</p>
                                                <button
                                                    onClick={() => {
                                                        setUpgradeReason('feature');
                                                        setUpgradeFeature('Merge Preview');
                                                        setShowUpgradeModal(true);
                                                    }}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                                                >
                                                    Unlock Feature
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
                            <button
                                onClick={handleMerge}
                                disabled={!canMerge || isProcessing || isSaving}
                                className={`flex items-center justify-center px-6 py-3 text-base sm:px-8 sm:py-4 sm:text-lg font-bold text-white shadow-lg transition-all ${!canMerge || isProcessing || isSaving ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'}`}
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                                        Processing...
                                    </>
                                ) : isSaving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                                        Saving...
                                    </>
                                ) : (
                                    <>Merge</>
                                )}
                            </button>
                            {showDiagnostics && mergeResult && mergeResult.diagnostics && mergeResult.diagnostics.length > 0 && (
                                <button
                                    onClick={() => downloadFile(JSON.stringify(mergeResult.diagnostics, null, 2), 'merge_diagnostics.json', 'application/json')}
                                    className="flex-1 px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-2 font-medium"
                                >
                                    <span>📊</span>
                                    <span className="truncate">Download Diagnostics</span>
                                </button>
                            )}
                        </div>
                        {mergeResult && (
                            <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-6 sm:p-8 animate-fade-in">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                                        <SparklesIcon className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900">Merge Complete</h3>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                                        <div className="text-xs font-mono text-gray-500 mb-1">FILES</div>
                                        <div className="text-2xl font-bold text-gray-900">{mergeResult.stats.filesProcessed}</div>
                                    </div>
                                    <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                                        <div className="text-xs font-mono text-gray-500 mb-1">INPUT CUES</div>
                                        <div className="text-2xl font-bold text-gray-900">{mergeResult.stats.totalInputCues}</div>
                                    </div>
                                    <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                                        <div className="text-xs font-mono text-gray-500 mb-1">OUTPUT CUES</div>
                                        <div className="text-2xl font-bold text-gray-900">{mergeResult.stats.totalOutputCues}</div>
                                    </div>
                                    <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                                        <div className="text-xs font-mono text-gray-500 mb-1">ISSUES</div>
                                        <div className="text-2xl font-bold text-gray-900">{mergeResult.stats.parseIssuesCount}</div>
                                    </div>
                                </div>

                                {/* Download Button */}
                                <div className="mt-6 flex justify-center">
                                    <button
                                        onClick={() => {
                                            const timestamp = new Date().toISOString().slice(0, 16).replace('T', '_').replace(/:/g, '-');
                                            const filename = `merged_${timestamp}.srt`;
                                            downloadFile(mergeResult.mergedSrt, filename, 'text/plain');
                                        }}
                                        className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-lg transition-all flex items-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Download SRT
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {
                (!onShowToast && showToast) && (
                    <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm animate-fade-in z-[10000] font-medium flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                        {toastMessage}
                    </div>
                )
            }

            {/* Login Required Modal */}
            {showLoginRequiredModal && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-fade-in-up">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">Sign In Required</h3>
                            <p className="text-gray-600 mb-6">
                                This device has been previously used with an account. Please sign in to continue using SRT Merger.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowLoginRequiredModal(false)}
                                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => window.location.href = '/?view=login'}
                                    className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-blue-200"
                                >
                                    Sign In
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                reason={upgradeReason}
                featureName={upgradeFeature}
                limit={upgradeLimit}
            />
        </section >
    );
}

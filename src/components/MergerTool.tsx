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
}

export function MergerTool({ onFileSaved, showDiagnostics = true, initialFiles = [] }: MergerToolProps) {
    const { user } = useAuth();
    const [files, setFiles] = useState<FileWithContent[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [mergeResult, setMergeResult] = useState<MergeResult | null>(null);
    const [computedOffsets, setComputedOffsets] = useState<ComputedOffset[]>([]);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Upgrade Modal State
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [upgradeReason, setUpgradeReason] = useState<'limit' | 'feature'>('feature');
    const [upgradeFeature, setUpgradeFeature] = useState('');
    const [upgradeLimit, setUpgradeLimit] = useState(0);

    // Feature Access Helpers
    const canRename = user?.subscription?.plan !== 'free';
    const canAlign = user?.subscription?.plan !== 'free';
    const canPreview = ['tier2', 'tier3'].includes(user?.subscription?.plan || 'free');

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

    const handleFilesSelected = async (selectedFiles: File[]) => {
        // Check Upload Limit
        const currentPlan = user?.subscription?.plan || 'free';
        const limit = PLAN_LIMITS[currentPlan];
        const currentUsage = user?.usage?.uploadCount || 0;
        const remainingLimit = limit - currentUsage;

        // Check if user can upload this many files
        if (selectedFiles.length > remainingLimit) {
            setUpgradeReason('limit');
            setUpgradeLimit(limit);
            setShowUpgradeModal(true);
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
    };

    const handleRename = async (id: string, newName: string) => {
        if (!canRename) {
            setUpgradeReason('feature');
            setUpgradeFeature('File Renaming');
            setShowUpgradeModal(true);
            return;
        }

        setFiles(prev => prev.map(f =>
            f.id === id ? { ...f, name: newName } : f
        ));
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

    const handleMerge = async () => {
        if (files.length === 0) return;
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
                        allBlocks.push({
                            index: globalIndex++,
                            timestamp: shifted,
                            texts: block.texts.length > 0 ? block.texts : ['[No text]']
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
                            allBlocks.push({
                                index: globalIndex++,
                                timestamp: shifted,
                                texts: block.texts.length > 0 ? block.texts : ['[No text]']
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

            // Track merge operation (increment usage count)
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/usage/merge`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (response.ok) {
                    console.log('Merge tracked successfully');
                    // Refresh user data to update usage count
                    if (onFileSaved) {
                        await onFileSaved();
                    }
                } else {
                    console.error('Failed to track merge:', await response.text());
                }
            } catch (error) {
                console.error('Failed to track merge:', error);
            }

            // Auto-save the file immediately with the result
            await saveFile(result);
        } catch (error) {
            setToastMessage(`Merge failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
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

            console.log('Saving file:', { filename, filesize, contentLength: result.mergedSrt.length });
            console.log('Content preview:', result.mergedSrt.substring(0, 100));

            // Save file as plain text
            const saveResult = await api.saveFile(
                filename,
                result.mergedSrt,
                filesize
            );
            console.log('Save result:', saveResult);

            setToastMessage('File saved successfully!');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
            // setMergeResult(null); // Kept result visible after auto-save
            if (onFileSaved) onFileSaved();
        } catch (error) {
            console.error('Save file error:', error);
            setToastMessage(`Failed to save file: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 5000);
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
        a.click();
        URL.revokeObjectURL(url);
    };

    const canMerge = files.length >= 1;

    return (
        <section id="merger-tool" className="px-4 pb-8">
            <div className="max-w-5xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-400"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                            <div className="w-3 h-3 rounded-full bg-green-400"></div>
                        </div>
                        <div className="text-xs font-mono text-gray-400">srt_merger_v2.exe</div>
                        <div className="w-16"></div>
                    </div>
                    <div className="p-6 sm:p-8 lg:p-10">
                        <div className="mb-10">
                            <UploadArea onFilesSelected={handleFilesSelected} />
                        </div>
                        {files.length > 0 && (
                            <div className="mb-10 animate-fade-in">
                                <FileList
                                    files={files.map((f, idx) => ({ ...f, isPrimary: idx === 0 }))}
                                    onSetPrimary={handleSetPrimary}
                                    onRemove={handleRemove}
                                    onReorder={handleReorder}
                                    onClear={handleClearFiles}
                                    onRename={handleRename}
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
                                    <MergePreview files={files} computedOffsets={computedOffsets} />
                                    {!canPreview && (
                                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-xl border border-gray-200">
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
                                className={`flex items-center justify-center px-8 py-4 rounded-xl text-lg font-bold text-white shadow-lg transition-all ${!canMerge || isProcessing || isSaving ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'}`}
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
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {showToast && (
                <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm animate-fade-in z-50 font-medium flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    {toastMessage}
                </div>
            )}

            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                reason={upgradeReason}
                featureName={upgradeFeature}
                limit={upgradeLimit}
            />
        </section>
    );
}

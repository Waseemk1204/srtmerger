import React, { useState, useMemo } from 'react';
import { ChevronDownIcon, ChevronUpIcon, EyeIcon, FileTextIcon, LockIcon, XIcon, PlusIcon } from 'lucide-react';
import { permissiveParseSrt } from '../utils/srt-merge';
import { shiftTimestampLine } from '../utils/timestamp-arith';
import { parseTimestampToMs, formatMsToTimestamp } from '../utils/timestampUtils';

interface PreviewEntry {
  index: number;
  start: string;
  end: string;
  text: string;
  sourceFile: string;
  fileId: string;
  blockIndex: number;
}

interface AddedCue {
  id: string;
  start: string;
  end: string;
  text: string;
}

interface MergePreviewProps {
  files: Array<{ id: string; name: string; fileContent: string; isPrimary?: boolean }>;
  computedOffsets?: Array<{ id: string; offsetMs: number }>;
  edits?: Record<string, { text?: string; start?: string; end?: string }>;
  onEdit?: (fileId: string, blockIndex: number, field: 'text' | 'start' | 'end', value: string) => void;
  onDelete?: (fileId: string, blockIndex: number) => void;
  onAdd?: (cue: AddedCue) => void;
  deletedCues?: Set<string>;
  addedCues?: AddedCue[];
  canEdit?: boolean;
}

export function MergePreview({
  files,
  computedOffsets = [],
  edits = {},
  onEdit,
  onDelete,
  onAdd,
  deletedCues = new Set(),
  addedCues = [],
  canEdit = false
}: MergePreviewProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [visibleCount, setVisibleCount] = useState(500);

  // Generate ALL preview entries (no limit)
  const previewEntries = useMemo(() => {
    if (files.length === 0) return [];

    const entries: PreviewEntry[] = [];
    let globalIndex = 1;

    // Find primary file (marked with isPrimary or first file as fallback)
    const primaryFile = files.find(f => f.isPrimary) || files[0];
    const secondaryFiles = files.filter(f => f.id !== primaryFile.id);

    // Process primary file (no offset)
    const primaryBlocks = permissiveParseSrt(primaryFile.fileContent);
    for (const block of primaryBlocks) {
      const shifted = shiftTimestampLine(block.tsRaw, 0);
      if (shifted) {
        const [start, end] = shifted.split('-->').map(t => t.trim());
        entries.push({
          index: globalIndex++,
          start,
          end,
          text: block.texts.join(' ') || '[No text]',
          sourceFile: primaryFile.name,
          fileId: primaryFile.id,
          blockIndex: block.index
        });
      }
    }

    // Process secondary files with offsets
    for (const file of secondaryFiles) {
      const offset = computedOffsets.find(o => o.id === file.id);
      const offsetMs = offset?.offsetMs ?? 0;

      const blocks = permissiveParseSrt(file.fileContent);
      for (const block of blocks) {
        const shifted = shiftTimestampLine(block.tsRaw, offsetMs);
        if (shifted) {
          const [start, end] = shifted.split('-->').map(t => t.trim());
          entries.push({
            index: globalIndex++,
            start,
            end,
            text: block.texts.join(' ') || '[No text]',
            sourceFile: file.name,
            fileId: file.id,
            blockIndex: block.index
          });
        }
      }
    }

    return entries;
  }, [files, computedOffsets]);

  // Calculate stats (optimized for performance)
  const stats = useMemo(() => {
    const totalCues = files.reduce((sum, f) => sum + permissiveParseSrt(f.fileContent).length, 0);

    // Calculate total duration efficiently using computedOffsets
    let totalDurationMs = 0;

    if (files.length > 0) {
      const primaryFile = files.find(f => f.isPrimary) || files[0];
      const secondaryFiles = files.filter(f => f.id !== primaryFile.id);

      // If we have computed offsets for all secondary files, use them
      if (computedOffsets.length === secondaryFiles.length && computedOffsets.length > 0) {
        // Get the last file's offset
        const lastOffset = computedOffsets[computedOffsets.length - 1];
        const lastFile = secondaryFiles.find(f => f.id === lastOffset.id);

        if (lastFile) {
          // Calculate last file's duration
          const lastFileBlocks = permissiveParseSrt(lastFile.fileContent);
          let lastFileEndMs = 0;
          for (const block of lastFileBlocks) {
            const shifted = shiftTimestampLine(block.tsRaw, 0);
            if (shifted) {
              const endToken = shifted.split('-->')[1]?.trim();
              if (endToken) {
                const endMs = parseTimestampToMs(endToken);
                if (endMs !== null && endMs > lastFileEndMs) {
                  lastFileEndMs = endMs;
                }
              }
            }
          }
          totalDurationMs = lastOffset.offsetMs + lastFileEndMs;
        }
      } else {
        // Fallback: calculate from primary file only
        const primaryBlocks = permissiveParseSrt(primaryFile.fileContent);
        for (const block of primaryBlocks) {
          const shifted = shiftTimestampLine(block.tsRaw, 0);
          if (shifted) {
            const endToken = shifted.split('-->')[1]?.trim();
            if (endToken) {
              const endMs = parseTimestampToMs(endToken);
              if (endMs !== null && endMs > totalDurationMs) {
                totalDurationMs = endMs;
              }
            }
          }
        }
      }
    }

    return {
      totalCues,
      totalFiles: files.length,
      totalDuration: formatMsToTimestamp(totalDurationMs),
      previewCues: previewEntries.length
    };
  }, [files, previewEntries, computedOffsets]);

  if (files.length === 0) {
    return null;
  }

  // Filter out deleted cues and merge in added cues, then renumber
  const filteredAndMergedEntries = useMemo(() => {
    // Filter out deleted entries
    const filtered = previewEntries.filter(entry => {
      const editKey = `${entry.fileId}-${entry.blockIndex}`;
      return !deletedCues.has(editKey);
    });

    // Add the added cues
    const added: PreviewEntry[] = addedCues.map((cue) => ({
      index: 0, // Will be renumbered below
      start: cue.start,
      end: cue.end,
      text: cue.text,
      sourceFile: '[Added]',
      fileId: cue.id,
      blockIndex: -1 // Indicator for added cues
    }));

    // Merge and sort by timestamp
    const merged = [...filtered, ...added].sort((a, b) => {
      const aMs = parseTimestampToMs(a.start) || 0;
      const bMs = parseTimestampToMs(b.start) || 0;
      return aMs - bMs;
    });

    // Renumber sequentially
    return merged.map((entry, idx) => ({
      ...entry,
      index: idx + 1
    }));
  }, [previewEntries, deletedCues, addedCues]);

  // Display only up to visibleCount entries for performance
  const displayEntries = filteredAndMergedEntries.slice(0, visibleCount);
  const hasMore = filteredAndMergedEntries.length > visibleCount;
  const showingAll = visibleCount >= filteredAndMergedEntries.length;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 transition-colors"
        aria-expanded={isExpanded}
        aria-label={isExpanded ? 'Collapse merge preview' : 'Expand merge preview'}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <EyeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" aria-hidden="true" />
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate">Merge Preview</h2>
          <span className="text-xs sm:text-sm text-gray-500 hidden sm:inline whitespace-nowrap">
            ({stats.previewCues} cues from {stats.totalFiles} {stats.totalFiles === 1 ? 'file' : 'files'})
          </span>
        </div>
        {isExpanded ? (
          <ChevronUpIcon className="w-5 h-5 text-gray-400" aria-hidden="true" />
        ) : (
          <ChevronDownIcon className="w-5 h-5 text-gray-400" aria-hidden="true" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          {/* Stats Bar */}
          <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
              <div>
                <div className="text-gray-600 mb-1">Total Cues</div>
                <div className="font-semibold text-gray-900 text-sm sm:text-base">{stats.totalCues}</div>
              </div>
              <div>
                <div className="text-gray-600 mb-1">Files</div>
                <div className="font-semibold text-gray-900 text-sm sm:text-base">{stats.totalFiles}</div>
              </div>
              <div>
                <div className="text-gray-600 mb-1">Total Duration</div>
                <div className="font-semibold text-gray-900 font-mono text-xs break-all">{stats.totalDuration}</div>
              </div>
              <div>
                <div className="text-gray-600 mb-1">Preview Entries</div>
                <div className="font-semibold text-gray-900 text-sm sm:text-base">{stats.previewCues}</div>
              </div>
            </div>
          </div>

          {/* Preview Entries */}
          {previewEntries.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FileTextIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No subtitle entries found in uploaded files</p>
            </div>
          ) : (
            <>
              <div className="max-h-96 overflow-y-auto p-3 sm:p-4">
                <div className="space-y-3">
                  {displayEntries.map((entry) => {
                    const editKey = `${entry.fileId}-${entry.blockIndex}`;
                    const edit = edits[editKey];
                    const currentText = edit?.text ?? entry.text;
                    const currentStart = edit?.start ?? entry.start;
                    const currentEnd = edit?.end ?? entry.end;

                    return (
                      <div
                        key={`${entry.fileId}-${entry.blockIndex}-${entry.index}`}
                        className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs sm:text-sm border-b border-gray-100 pb-3 last:border-0 select-none group"
                      >
                        <div className="flex items-start gap-2 sm:gap-4 flex-shrink-0">
                          <div className="flex-shrink-0 flex items-center gap-1">
                            <div className="font-mono text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                              #{entry.index}
                            </div>
                            {canEdit && onDelete && entry.blockIndex !== -1 && (
                              <button
                                onClick={() => onDelete(entry.fileId, entry.blockIndex)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded text-red-600 hover:text-red-700"
                                title="Delete cue"
                              >
                                <XIcon className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <div className="flex-shrink-0 font-mono text-xs text-gray-500 pt-1 min-w-[120px] sm:min-w-[140px] break-all flex flex-col gap-1">
                            {canEdit && onEdit ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={currentStart}
                                  onChange={(e) => onEdit(entry.fileId, entry.blockIndex, 'start', e.target.value)}
                                  className="w-20 bg-transparent border-b border-dashed border-gray-300 focus:border-blue-500 focus:outline-none text-gray-700"
                                />
                                <span>→</span>
                                <input
                                  type="text"
                                  value={currentEnd}
                                  onChange={(e) => onEdit(entry.fileId, entry.blockIndex, 'end', e.target.value)}
                                  className="w-20 bg-transparent border-b border-dashed border-gray-300 focus:border-blue-500 focus:outline-none text-gray-700"
                                />
                              </div>
                            ) : (
                              <span>{entry.start} → {entry.end}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex-1 text-gray-900 min-w-0 relative">
                          {canEdit && onEdit ? (
                            <textarea
                              value={currentText}
                              onChange={(e) => {
                                if (entry.blockIndex === -1) {
                                  // For added cues, update via onEdit with a special fileId pattern
                                  onEdit(entry.fileId, entry.blockIndex, 'text', e.target.value);
                                } else {
                                  onEdit(entry.fileId, entry.blockIndex, 'text', e.target.value);
                                }
                              }}
                              className="w-full bg-transparent border border-transparent hover:border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 rounded p-1 -ml-1 resize-y min-h-[1.5em]"
                              rows={Math.max(1, currentText.split('\n').length)}
                            />
                          ) : (
                            <div className="break-words group-hover:bg-gray-50/50 rounded p-1 -ml-1 transition-colors">
                              {entry.text}
                              {!canEdit && (
                                <LockIcon className="w-3 h-3 text-gray-300 absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                            </div>
                          )}
                          <div className="text-xs text-gray-400 mt-1 break-all px-1">{entry.sourceFile}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add Cue Button */}
                {canEdit && onAdd && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => {
                        const newCue: AddedCue = {
                          id: `added-${Date.now()}`,
                          start: '00:00:00,000',
                          end: '00:00:01,000',
                          text: '[New cue]'
                        };
                        onAdd(newCue);
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Add Cue
                    </button>
                  </div>
                )}
              </div>

              {/* Load More / Show Less */}
              {(hasMore || !showingAll) && (
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row gap-2 items-center justify-between">
                  <div className="text-xs sm:text-sm text-gray-600">
                    Showing {displayEntries.length} of {previewEntries.length} entries
                  </div>
                  <div className="flex gap-2">
                    {hasMore && (
                      <button
                        onClick={() => setVisibleCount(prev => Math.min(prev + 500, previewEntries.length))}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium px-3 py-1 rounded hover:bg-blue-50 transition-colors"
                      >
                        Load 500 more
                      </button>
                    )}
                    {visibleCount > 500 && (
                      <button
                        onClick={() => setVisibleCount(500)}
                        className="text-sm text-gray-600 hover:text-gray-700 font-medium px-3 py-1 rounded hover:bg-gray-100 transition-colors"
                      >
                        Show less
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Footer Summary */}
              <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 border-t border-gray-200 text-xs sm:text-sm text-gray-600">
                <span className="block sm:inline">Preview shows merged subtitles in chronological order.</span>
                {computedOffsets.length > 0 && (
                  <span className="block sm:inline sm:ml-2 text-blue-600">
                    Offsets applied from Timeline Alignment.
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}


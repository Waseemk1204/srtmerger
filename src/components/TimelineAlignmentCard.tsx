import React, { useState, useEffect, useCallback } from 'react';
import { ClockIcon, InfoIcon } from 'lucide-react';
import { parseTimestampToMs, formatMsToTimestamp } from '../utils/timestampUtils';
import { permissiveParseSrt } from '../utils/srt-merge';
import { shiftTimestampLine } from '../utils/timestamp-arith';

export type ShiftMode = 'auto' | 'none' | 'custom';

export interface SecondaryFile {
  id: string;
  name: string;
  currentOffsetMs?: number;
  fileContent: string; // SRT file content for duration calculation
}

export interface ComputedOffset {
  id: string;
  offsetMs: number;
  offsetDisplay: string;
}

export interface TimelineAlignmentCardProps {
  primaryEnd: string;
  secondaryFiles: SecondaryFile[];
  defaultMode?: ShiftMode;
  defaultCustomOffset?: string;
  onChange?: (payload: {
    mode: ShiftMode;
    customOffset?: string;
    computedOffsets: ComputedOffset[];
  }) => void;
}

export function TimelineAlignmentCard({
  primaryEnd,
  secondaryFiles,
  defaultMode = 'auto',
  defaultCustomOffset = '00:00:00,000',
  onChange
}: TimelineAlignmentCardProps) {
  const [mode, setMode] = useState<ShiftMode>(defaultMode);
  const [customOffset, setCustomOffset] = useState<string>(defaultCustomOffset);
  const [customOffsetError, setCustomOffsetError] = useState<string>('');

  // Parse primary end time
  const primaryEndMs = parseTimestampToMs(primaryEnd) ?? 0;

  // Helper function to calculate file duration from SRT content
  const calculateFileDuration = useCallback((fileContent: string): number => {
    const blocks = permissiveParseSrt(fileContent);
    let lastEndMs = 0;

    for (const block of blocks) {
      const shifted = shiftTimestampLine(block.tsRaw, 0);
      if (shifted) {
        const endToken = shifted.split('-->')[1]?.trim();
        if (endToken) {
          const endMs = parseTimestampToMs(endToken);
          if (endMs !== null && endMs > lastEndMs) {
            lastEndMs = endMs;
          }
        }
      }
    }

    return lastEndMs;
  }, []);

  // Compute offsets based on current mode
  const computeOffsets = useCallback((): ComputedOffset[] => {
    const offsets: ComputedOffset[] = [];
    let cumulativeMs = primaryEndMs; // Start with primary file's end time

    for (let i = 0; i < secondaryFiles.length; i++) {
      const file = secondaryFiles[i];
      let offsetMs = 0;

      if (mode === 'auto') {
        // For cumulative mode: each file starts where the previous one ended
        offsetMs = cumulativeMs;

        // Calculate this file's duration and add to cumulative
        const fileDuration = calculateFileDuration(file.fileContent);
        cumulativeMs += fileDuration;
      } else if (mode === 'none') {
        // No shift: keep original timestamps (zero offset)
        offsetMs = 0;
      } else if (mode === 'custom') {
        const parsed = parseTimestampToMs(customOffset);
        offsetMs = parsed ?? 0;
      }

      offsets.push({
        id: file.id,
        offsetMs,
        offsetDisplay: formatMsToTimestamp(offsetMs)
      });
    }

    return offsets;
  }, [mode, customOffset, primaryEndMs, secondaryFiles, calculateFileDuration]);

  const [computedOffsets, setComputedOffsets] = useState<ComputedOffset[]>(computeOffsets());

  // Update computed offsets when mode, files, or primary end time changes
  useEffect(() => {
    const newOffsets = computeOffsets();
    setComputedOffsets(newOffsets);

    // Call onChange automatically whenever offsets change
    if (onChange) {
      onChange({
        mode,
        customOffset: mode === 'custom' ? customOffset : undefined,
        computedOffsets: newOffsets
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, customOffset, primaryEndMs, secondaryFiles]);

  // Validate custom offset input
  const handleCustomOffsetChange = (value: string) => {
    setCustomOffset(value);
    const normalized = value.replace(/\./g, ',');
    const parsed = parseTimestampToMs(normalized);

    if (value.trim() === '') {
      setCustomOffsetError('');
    } else if (parsed === null) {
      setCustomOffsetError('Invalid timestamp format. Use HH:MM:SS,mmm');
    } else {
      setCustomOffsetError('');
    }
  };

  // Handle Apply button click
  const handleApply = () => {
    const offsets = computeOffsets();
    if (onChange) {
      onChange({
        mode,
        customOffset: mode === 'custom' ? customOffset : undefined,
        computedOffsets: offsets
      });
    }
  };

  // Handle Reset button click
  const handleReset = () => {
    setMode(defaultMode);
    setCustomOffset(defaultCustomOffset);
    setCustomOffsetError('');
  };

  // Get current offset display for a file
  const getCurrentOffsetDisplay = (file: SecondaryFile): string => {
    return formatMsToTimestamp(file.currentOffsetMs ?? 0);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Timeline Alignment</h2>

      {/* Primary timeline end section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 mb-2">
          <ClockIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" aria-hidden="true" />
          <label className="text-xs sm:text-sm font-medium text-gray-900">
            {mode === 'none'
              ? 'Merge Mode'
              : mode === 'custom'
                ? 'Custom Offset'
                : 'Primary timeline end'}
          </label>
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1 break-all">
          {mode === 'none'
            ? '00:00:00,000'
            : mode === 'custom'
              ? customOffset
              : formatMsToTimestamp(primaryEndMs)}
        </div>
        <p className="text-xs sm:text-sm text-blue-600">
          {mode === 'none'
            ? 'Files will be merged with original timestamps preserved (no timeline adjustments)'
            : mode === 'custom'
              ? 'All secondary files will be shifted by this custom offset'
              : 'Secondary files will be shifted to continue after this time'}
        </p>
      </div>

      {/* Secondary Files section */}
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Secondary Files</h3>

        {secondaryFiles.length === 0 ? (
          <p className="text-sm text-gray-500">No secondary files</p>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {secondaryFiles.map((file) => {
              const computed = computedOffsets.find(o => o.id === file.id);
              return (
                <div
                  key={file.id}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4"
                >
                  <div className="font-semibold text-sm sm:text-base text-gray-900 mb-2 sm:mb-3 break-words">{file.name}</div>

                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span className="text-gray-600">Current offset:</span>
                      <span className="font-mono text-gray-900 break-all">
                        {getCurrentOffsetDisplay(file)}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span className="text-gray-600">Applied offset:</span>
                      <span className="font-mono font-semibold text-blue-600 break-all">
                        {computed?.offsetDisplay ?? '00:00:00,000'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Shift mode controls */}
        <div className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-900 mb-3 block">
              Shift mode:
            </label>
            <div
              role="radiogroup"
              aria-label="Shift mode selection"
              className="space-y-2"
            >
              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input
                  type="radio"
                  name="shift-mode"
                  value="auto"
                  checked={mode === 'auto'}
                  onChange={() => setMode('auto')}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  aria-checked={mode === 'auto'}
                />
                <span className="text-sm text-gray-700">
                  Auto-shift by primary end
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded group">
                <input
                  type="radio"
                  name="shift-mode"
                  value="none"
                  checked={mode === 'none'}
                  onChange={() => setMode('none')}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  aria-checked={mode === 'none'}
                />
                <span className="text-sm text-gray-700 flex-1">No shift</span>
                <div className="relative group/tooltip">
                  <InfoIcon className="w-4 h-4 text-gray-400 hover:text-blue-600 cursor-help" />
                  <div className="absolute right-0 bottom-full mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-opacity z-10">
                    Simple merge without any timeline changes. Files keep their original timestamps.
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded group">
                <input
                  type="radio"
                  name="shift-mode"
                  value="custom"
                  checked={mode === 'custom'}
                  onChange={() => setMode('custom')}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  aria-checked={mode === 'custom'}
                />
                <span className="text-sm text-gray-700 flex-1">Custom offset</span>
                <div className="relative group/tooltip">
                  <InfoIcon className="w-4 h-4 text-gray-400 hover:text-blue-600 cursor-help" />
                  <div className="absolute right-0 bottom-full mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-opacity z-10">
                    Shifts all files by the same custom offset. Use this to apply a uniform time adjustment.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Custom offset input (only shown when custom mode is selected) */}
          {mode === 'custom' && (
            <div>
              <label
                htmlFor="custom-offset-input"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Custom offset:
              </label>
              <input
                id="custom-offset-input"
                type="text"
                value={customOffset}
                onChange={(e) => handleCustomOffsetChange(e.target.value)}
                placeholder="00:00:00,000"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${customOffsetError
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300 bg-white'
                  }`}
                aria-invalid={customOffsetError !== ''}
                aria-describedby={customOffsetError ? 'custom-offset-error' : undefined}
              />
              {customOffsetError && (
                <p
                  id="custom-offset-error"
                  className="mt-1 text-sm text-red-600"
                  role="alert"
                >
                  {customOffsetError}
                </p>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleApply}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm sm:text-base"
              aria-label="Apply preview offsets"
            >
              Apply preview
            </button>
            <button
              onClick={handleReset}
              className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors text-sm sm:text-base"
              aria-label="Reset to defaults"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


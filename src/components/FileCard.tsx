import React from 'react';
import {
  FileTextIcon,
  XIcon,
  ClockIcon,
  GripVerticalIcon,
  StarIcon
} from 'lucide-react';
import { TranscriptFile } from '../types';

interface FileCardProps {
  file: TranscriptFile;
  onSetPrimary: (id: string) => void;
  onRemove: (id: string) => void;
  onPreview?: (id: string) => void;
}

export function FileCard({ file, onRemove }: FileCardProps) {
  return (
    <div className={`
      group relative bg-white border rounded-xl p-4 sm:p-5 transition-all duration-200
      ${file.isPrimary
        ? 'border-blue-200 shadow-sm ring-1 ring-blue-100'
        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
      }
    `}>
      <div className="flex items-start gap-4">
        {/* Drag Handle */}
        <div className="mt-1 text-gray-300 cursor-grab active:cursor-grabbing hover:text-gray-500 transition-colors">
          <GripVerticalIcon className="w-5 h-5" />
        </div>

        {/* File Icon */}
        <div className={`
          p-2.5 rounded-lg flex-shrink-0
          ${file.isPrimary ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-500'}
        `}>
          <FileTextIcon className="w-6 h-6" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-medium text-gray-900 truncate pr-2 text-base" title={file.name}>
                {file.name}
              </h3>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-gray-500">
                <span className="font-mono text-xs text-gray-400 uppercase tracking-wider">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
                {file.duration && (
                  <div className="flex items-center gap-1.5 text-gray-600 bg-gray-50 px-2 py-0.5 rounded text-xs font-medium">
                    <ClockIcon className="w-3 h-3" />
                    <span className="font-mono">{file.duration}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => onRemove(file.id)}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
              title="Remove file"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Primary Badge */}
          {file.isPrimary && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
              <StarIcon className="w-3 h-3 fill-current" />
              Timeline Start
            </div>
          )}

          {/* Error Message */}
          {file.errors && file.errors.length > 0 && (
            <div className="mt-3 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100">
              {file.errors.join(', ')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import { FileTextIcon, GripVerticalIcon, Trash2Icon, EyeIcon } from 'lucide-react';
import { TranscriptFile } from '../types';

interface FileCardProps {
  file: TranscriptFile;
  onSetPrimary: (id: string) => void;
  onRemove: (id: string) => void;
  onPreview?: (id: string) => void;
}

export function FileCard({ file, onSetPrimary, onRemove, onPreview }: FileCardProps) {

  return (
    <div className={`
            group relative flex items-center gap-2 sm:gap-4 p-2.5 sm:p-4 rounded-xl border transition-all duration-200
            ${file.isPrimary
        ? 'bg-blue-50/50 border-blue-200 shadow-sm'
        : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'
      }
        `}>
      {/* Drag Handle */}
      <div className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors hidden sm:block">
        <GripVerticalIcon className="w-5 h-5" />
      </div>

      {/* File Icon */}
      <div className={`
                p-2 sm:p-3 rounded-lg transition-colors
                ${file.isPrimary ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'}
            `}>
        <FileTextIcon className="w-4 h-4 sm:w-6 sm:h-6" />
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium text-gray-900 truncate text-sm sm:text-base">
            {file.name}
          </h3>

          {file.isPrimary && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-100 rounded-full flex-shrink-0">
              Primary
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-3 text-xs text-gray-500 font-mono">
          <span>{(file.size / 1024).toFixed(1)} KB</span>
          {file.duration && (
            <>
              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
              <span>{file.duration}</span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        {onPreview && (
          <button
            onClick={() => onPreview(file.id)}
            className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Preview content"
          >
            <EyeIcon className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={() => onRemove(file.id)}
          className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          title="Remove file"
        >
          <Trash2Icon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
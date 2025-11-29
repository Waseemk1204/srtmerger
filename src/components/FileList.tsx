import React, { useState } from 'react';
import { FileCard } from './FileCard';
import { TranscriptFile } from '../types';
interface FileListProps {
  files: TranscriptFile[];
  onSetPrimary: (id: string) => void;
  onRemove: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onPreview?: (id: string) => void;
  onRename?: (id: string, newName: string) => void;
  onClear?: () => void;
}

export function FileList({
  files,
  onSetPrimary,
  onRemove,
  onReorder,
  onPreview,
  onRename,
  onClear
}: FileListProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== toIndex) {
      onReorder(draggedIndex, toIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  if (files.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h2 className="font-mono text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Uploaded Files ({files.length})
          </h2>
          <p className="text-xs text-gray-500 sm:hidden italic">
            Tip: Press and hold a file to reorder
          </p>
        </div>
        {onClear && (
          <button
            onClick={onClear}
            className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors self-end sm:self-auto"
          >
            Clear files
          </button>
        )}
      </div>

      <div className="space-y-3">
        {files.map((file, index) => (
          <div
            key={file.id}
            className={`
              flex items-start gap-3 sm:gap-4 transition-all duration-200
              ${draggedIndex === index ? 'opacity-40 scale-[0.98]' : ''}
              ${dragOverIndex === index ? 'border-t-2 border-blue-500 pt-2' : ''}
            `}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
          >
            <div className="flex-shrink-0 pt-4 font-mono text-xs sm:text-sm font-medium text-gray-400 w-8 text-right">
              {String(index + 1).padStart(2, '0')}
            </div>
            <div className="flex-1 min-w-0">
              <FileCard
                file={file}
                onSetPrimary={onSetPrimary}
                onRemove={onRemove}
                onPreview={onPreview}
                onRename={onRename}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
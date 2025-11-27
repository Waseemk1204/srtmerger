import React, { useState } from 'react';
import { FileTextIcon, GripVerticalIcon, Trash2Icon, StarIcon, EyeIcon, Edit2Icon } from 'lucide-react';
import { TranscriptFile } from '../types';

interface FileCardProps {
  file: TranscriptFile;
  onSetPrimary: (id: string) => void;
  onRemove: (id: string) => void;
  onPreview?: (id: string) => void;
  onRename?: (id: string, newName: string) => void;
}

export function FileCard({ file, onSetPrimary, onRemove, onPreview, onRename }: FileCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(file.name);

  const handleSaveRename = () => {
    if (editName.trim() && editName !== file.name && onRename) {
      onRename(file.id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveRename();
    } else if (e.key === 'Escape') {
      setEditName(file.name);
      setIsEditing(false);
    }
  };

  return (
    <div className={`
            group relative flex items-center gap-4 p-4 rounded-xl border transition-all duration-200
            ${file.isPrimary
        ? 'bg-blue-50/50 border-blue-200 shadow-sm'
        : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'
      }
        `}>
      {/* Drag Handle */}
      <div className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors">
        <GripVerticalIcon className="w-5 h-5" />
      </div>

      {/* File Icon */}
      <div className={`
                p-3 rounded-lg transition-colors
                ${file.isPrimary ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'}
            `}>
        <FileTextIcon className="w-6 h-6" />
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {isEditing ? (
            <div className="flex items-center gap-2 w-full max-w-[200px]">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleSaveRename}
                onKeyDown={handleKeyDown}
                className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
          ) : (
            <h3
              className="font-medium text-gray-900 truncate cursor-pointer hover:text-blue-600"
              onClick={() => onRename && setIsEditing(true)}
              title="Click to rename"
            >
              {file.name}
            </h3>
          )}

          {file.isPrimary && (
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-100 rounded-full">
              Primary
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500 font-mono">
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
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onPreview && (
          <button
            onClick={() => onPreview(file.id)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Preview content"
          >
            <EyeIcon className="w-4 h-4" />
          </button>
        )}

        {onRename && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Rename file"
          >
            <Edit2Icon className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={() => onSetPrimary(file.id)}
          disabled={file.isPrimary}
          className={`
                        p-2 rounded-lg transition-colors
                        ${file.isPrimary
              ? 'text-blue-500 bg-blue-50'
              : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
            }
                    `}
          title={file.isPrimary ? 'Primary file' : 'Set as primary'}
        >
          <StarIcon className={`w-4 h-4 ${file.isPrimary ? 'fill-current' : ''}`} />
        </button>

        <button
          onClick={() => onRemove(file.id)}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          title="Remove file"
        >
          <Trash2Icon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
import React, { useState, useRef } from 'react';
import { UploadCloudIcon } from 'lucide-react';

interface UploadAreaProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export function UploadArea({
  onFilesSelected,
  disabled = false
}: UploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const files = Array.from(e.dataTransfer.files);
    onFilesSelected(files);
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      onFilesSelected(files);
    }
  };

  return (
    <div
      className={`
        relative group cursor-pointer transition-all duration-300 ease-out
        border-2 border-dashed rounded-2xl p-10 sm:p-14 text-center
        ${isDragging
          ? 'border-blue-500 bg-blue-50/50 scale-[1.01]'
          : disabled
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
            : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-gray-50/50 hover:shadow-sm'
        }
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".srt,.vtt,.txt,.json,.csv"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      <div className={`
        w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center transition-all duration-300
        ${isDragging ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600'}
      `}>
        <UploadCloudIcon className="w-8 h-8" />
      </div>

      <h3 className="font-mono text-lg sm:text-xl font-bold text-gray-900 mb-3">
        Drop files here
      </h3>

      <p className="text-gray-500 mb-6 max-w-sm mx-auto leading-relaxed">
        Select your subtitle files to begin. We support SRT, VTT, and more.
      </p>

      <button className={`
        px-6 py-2.5 rounded-lg text-sm font-medium transition-all
        ${disabled
          ? 'bg-gray-200 text-gray-400'
          : 'bg-white border border-gray-200 text-gray-700 shadow-sm group-hover:border-blue-300 group-hover:text-blue-600'
        }
      `}>
        Browse Files
      </button>
    </div>
  );
}
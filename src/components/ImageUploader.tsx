import React, { useRef, useState } from 'react';
import { ImageIcon, UploadCloud, X } from 'lucide-react';
import { MediaFile } from '../types';

interface ImageUploaderProps {
  imageFile: MediaFile | null;
  onImageSelected: (file: File) => void;
  onImageRemoved: () => void;
  disabled?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  imageFile,
  onImageSelected,
  onImageRemoved,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(file.name)) {
      onImageSelected(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + ' KB';
    }
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <fieldset id="image-uploader-card" className="web1-fieldset flex flex-col h-full">
      <legend className="web1-legend">1. Select Cover Image</legend>

      <input
        ref={inputRef}
        id="image-file-input"
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
        disabled={disabled}
        onChange={(e) => handleFiles(e.target.files)}
      />

      {!imageFile ? (
        <div
          id="image-dropzone"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          className={`web1-dropzone p-4 flex flex-col items-center justify-center text-center cursor-pointer min-h-[170px] ${
            isDragging ? 'dragging' : ''
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="font-serif text-sm font-bold text-black mb-1">
            [ Drag & Drop Cover Image Here ]
          </div>
          <div className="text-xs text-[#555555] mb-3">
            (or click anywhere inside this box to browse)
          </div>
          <button
            type="button"
            disabled={disabled}
            className="web1-btn"
          >
            Browse Image...
          </button>
          <div className="text-[11px] text-[#777777] mt-2 font-mono">
            Formats: .jpg, .png, .webp
          </div>
        </div>
      ) : (
        <div
          id="image-preview-container"
          className="border border-[#888888] bg-[#f9f9f9] p-3 flex flex-col justify-between flex-1"
        >
          <div className="border border-black bg-white p-1 flex items-center justify-center h-[140px] mb-2 overflow-hidden">
            <img
              id="image-thumbnail-preview"
              src={imageFile.previewUrl}
              alt="Preview"
              className="max-h-full max-w-full object-contain"
            />
          </div>

          <div className="text-xs font-serif text-black">
            <div className="border border-[#cccccc] bg-white px-2 py-1 mb-2 font-mono text-[11px] truncate">
              <b>File:</b> {imageFile.name}{' '}
              {imageFile.dimensions ? `(${imageFile.dimensions.width}x${imageFile.dimensions.height})` : ''} — {formatSize(imageFile.size)}
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-change-image"
                type="button"
                onClick={() => !disabled && inputRef.current?.click()}
                disabled={disabled}
                className="web1-btn"
              >
                Change Image...
              </button>
              <button
                id="btn-remove-image"
                type="button"
                onClick={onImageRemoved}
                disabled={disabled}
                className="web1-btn"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </fieldset>
  );
};

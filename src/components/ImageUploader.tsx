import React, { useRef, useState } from 'react';
import { ImageIcon, UploadCloud, X, CheckCircle2, Sparkles } from 'lucide-react';
import { MediaFile } from '../types';

interface ImageUploaderProps {
  imageFile: MediaFile | null;
  onImageSelected: (file: File) => void;
  onImageRemoved: () => void;
  onLoadSample: () => void;
  disabled?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  imageFile,
  onImageSelected,
  onImageRemoved,
  onLoadSample,
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

  return (
    <div id="image-uploader-card" className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-sky-400" />
          <span>Cover Image</span>
          <span className="text-xs font-normal text-slate-400">(PNG, JPG)</span>
        </label>
        {!imageFile && (
          <button
            id="btn-load-sample-image"
            type="button"
            onClick={onLoadSample}
            disabled={disabled}
            className="text-xs text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-1 hover:underline cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3 h-3" />
            Try Sample Artwork
          </button>
        )}
      </div>

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
          className={`flex-1 border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 min-h-[220px] ${
            isDragging
              ? 'border-sky-400 bg-sky-950/30'
              : 'border-slate-700 hover:border-slate-500 bg-slate-800/40 hover:bg-slate-800/70'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mb-3 group-hover:scale-105 transition-transform">
            <UploadCloud className="w-6 h-6 text-sky-400" />
          </div>
          <p className="text-sm font-medium text-slate-200 mb-1">
            Click to upload or drag & drop image
          </p>
          <p className="text-xs text-slate-400">
            Supports PNG, JPG, JPEG (even dimensions automatically scaled)
          </p>
        </div>
      ) : (
        <div
          id="image-preview-container"
          className="flex-1 rounded-xl border border-slate-700 bg-slate-800/50 p-3.5 flex flex-col justify-between"
        >
          <div className="relative group rounded-lg overflow-hidden bg-slate-950 border border-slate-700/80 aspect-video flex items-center justify-center mb-3">
            <img
              id="image-thumbnail-preview"
              src={imageFile.previewUrl}
              alt="Uploaded preview"
              className="w-full h-full object-contain"
            />
            <div className="absolute top-2 right-2 flex gap-1.5">
              <button
                id="btn-remove-image"
                type="button"
                onClick={onImageRemoved}
                disabled={disabled}
                title="Remove image"
                className="w-7 h-7 rounded-full bg-slate-900/80 hover:bg-rose-900/80 text-slate-200 hover:text-white flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {imageFile.dimensions && (
              <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-900/80 text-[11px] font-mono text-slate-300 backdrop-blur-xs border border-slate-700/60">
                {imageFile.dimensions.width} × {imageFile.dimensions.height}px
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2 truncate pr-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-medium truncate text-slate-200">{imageFile.name}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-slate-400 font-mono">
                {(imageFile.size / 1024).toFixed(1)} KB
              </span>
              <button
                id="btn-change-image"
                type="button"
                onClick={() => !disabled && inputRef.current?.click()}
                disabled={disabled}
                className="text-sky-400 hover:text-sky-300 font-medium transition-colors cursor-pointer hover:underline text-xs"
              >
                Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

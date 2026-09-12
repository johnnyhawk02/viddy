import React, { useRef, useState } from 'react';
import { MediaFile } from '../types';
import { BlendConfig } from '../utils/generateCover';
import { AnimatedCoverCanvas } from './AnimatedCoverCanvas';

interface ImageUploaderProps {
  imageFile: MediaFile | null;
  autoCoverUrl?: string | null;
  blendConfig?: BlendConfig;
  trackName?: string;
  isAnimatedCover: boolean;
  tempo?: number;
  onToggleAnimatedCover: () => void;
  onShuffleColor?: () => void;
  onImageSelected: (file: File) => void;
  onImageRemoved: () => void;
  disabled?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  imageFile,
  autoCoverUrl,
  blendConfig,
  trackName = 'Track Title',
  isAnimatedCover,
  tempo = 120,
  onToggleAnimatedCover,
  onShuffleColor,
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

  return (
    <div id="image-uploader-card" className="flex flex-col h-full">
      <input
        ref={inputRef}
        id="image-file-input"
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
        disabled={disabled}
        onChange={(e) => handleFiles(e.target.files)}
      />

      {imageFile ? (
        <div
          id="image-preview-container"
          className="h-48 border border-zinc-200 rounded-lg p-2 flex flex-col justify-between"
        >
          <div className="flex-1 flex items-center justify-center overflow-hidden">
            <img
              id="image-thumbnail-preview"
              src={imageFile.previewUrl}
              alt="Preview"
              className="max-h-36 max-w-full object-contain rounded"
            />
          </div>
          <div className="flex items-center justify-between font-mono text-[11px] text-zinc-500 pt-1 border-t border-zinc-100">
            <span className="truncate max-w-[170px]" title={imageFile.name}>
              {imageFile.name}
            </span>
            <button
              id="btn-remove-image"
              type="button"
              onClick={onImageRemoved}
              disabled={disabled}
              className="text-zinc-400 hover:text-red-500 cursor-pointer transition-colors ml-2"
              title="Remove"
            >
              ✕
            </button>
          </div>
        </div>
      ) : blendConfig ? (
        <div
          id="image-auto-container"
          className="h-48 border border-zinc-200 rounded-lg p-2 flex flex-col justify-between"
        >
          <div className="flex-1 flex items-center justify-center overflow-hidden rounded bg-black/5">
            <AnimatedCoverCanvas
              blendConfig={blendConfig}
              trackName={trackName}
              isAnimated={isAnimatedCover}
              tempo={tempo}
            />
          </div>
          <div className="flex items-center justify-between font-mono text-[11px] text-zinc-400 pt-1 border-t border-zinc-100">
            <div className="flex items-center gap-1.5">
              <button
                id="btn-toggle-animation"
                type="button"
                onClick={onToggleAnimatedCover}
                disabled={disabled}
                className="hover:text-zinc-900 cursor-pointer transition-colors flex items-center gap-1"
                title="Toggle animated morphing / still mode"
              >
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full ${
                    isAnimatedCover ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-300'
                  }`}
                />
                <span className={isAnimatedCover ? 'text-zinc-900 font-medium' : 'text-zinc-500'}>
                  {isAnimatedCover ? 'animated' : 'still'}
                </span>
              </button>
              {isAnimatedCover && (
                <span className="text-zinc-400 text-[10px]">
                  {tempo} BPM
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onShuffleColor}
                disabled={disabled}
                className="hover:text-zinc-900 cursor-pointer transition-colors"
                title="Shuffle blend & polka dots"
              >
                shuffle
              </button>
              <button
                type="button"
                onClick={() => !disabled && inputRef.current?.click()}
                disabled={disabled}
                className="hover:text-zinc-900 cursor-pointer transition-colors"
                title="Upload custom image"
              >
                custom
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          id="image-dropzone"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          className={`h-48 border border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-zinc-900 bg-zinc-50 text-zinc-900'
              : 'border-zinc-300 hover:border-zinc-500 text-zinc-500 hover:text-zinc-800'
          } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          <span className="font-mono text-xs">+ image (optional)</span>
          <span className="font-mono text-[10px] text-zinc-400 mt-1">or auto blend + polka dots</span>
        </div>
      )}
    </div>
  );
};

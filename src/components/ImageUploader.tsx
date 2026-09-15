import React, { useRef, useState } from 'react';
import { ImageMediaFile } from '../types';
import { Image as ImageIcon, Upload, X, RefreshCw, Sparkles } from 'lucide-react';
import { createSampleImage } from '../utils/sampleMedia';

interface ImageUploaderProps {
  imageFile: ImageMediaFile | null;
  onImageSelect: (file: ImageMediaFile | null) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  imageFile,
  onImageSelect,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isGeneratingSample, setIsGeneratingSample] = useState(false);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, WEBP, GIF, SVG, etc.).');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      onImageSelect({
        file,
        name: file.name,
        size: file.size,
        type: file.type || 'image/png',
        previewUrl,
        width: img.naturalWidth || 1920,
        height: img.naturalHeight || 1080,
      });
    };
    img.onerror = () => {
      onImageSelect({
        file,
        name: file.name,
        size: file.size,
        type: file.type || 'image/png',
        previewUrl,
        width: 1920,
        height: 1080,
      });
    };
    img.src = previewUrl;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleLoadSample = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsGeneratingSample(true);
      const sample = await createSampleImage();
      processFile(sample);
    } finally {
      setIsGeneratingSample(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div id="image-uploader-card" className="p-5 bg-zinc-900/90 border border-zinc-800 rounded-2xl flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300">
            <ImageIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-mono text-sm text-zinc-100 font-semibold">1. Cover Image</h3>
            <p className="font-mono text-xs text-zinc-500">Still frame for 1fps video</p>
          </div>
        </div>

        {imageFile ? (
          <span className="font-mono text-xs text-emerald-400 flex items-center gap-1.5 bg-emerald-950/50 border border-emerald-800/40 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Loaded
          </span>
        ) : (
          <button
            type="button"
            onClick={handleLoadSample}
            disabled={isGeneratingSample}
            className="text-xs font-mono text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 cursor-pointer transition-colors"
            title="Load sample image"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{isGeneratingSample ? 'Generating...' : 'Sample'}</span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
      />

      {imageFile ? (
        <div className="flex flex-col gap-3">
          {/* Preview Container */}
          <div className="relative rounded-xl overflow-hidden bg-black border border-zinc-800 group aspect-video flex items-center justify-center">
            <img
              src={imageFile.previewUrl}
              alt={imageFile.name}
              className="w-full h-full object-contain"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-white text-zinc-950 font-mono text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-lg hover:bg-zinc-200 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Replace</span>
              </button>
              <button
                type="button"
                onClick={() => onImageSelect(null)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-200 font-mono text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-lg hover:bg-zinc-700 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            </div>
          </div>

          {/* Image Details */}
          <div className="flex items-center justify-between font-mono text-xs text-zinc-400 px-1">
            <span className="truncate max-w-[200px]" title={imageFile.name}>
              {imageFile.name}
            </span>
            <div className="flex items-center gap-2 text-zinc-500 shrink-0">
              <span>{imageFile.width}×{imageFile.height}</span>
              <span>·</span>
              <span>{formatSize(imageFile.size)}</span>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all aspect-video ${
            isDragging
              ? 'border-white bg-zinc-800/40'
              : 'border-zinc-800 hover:border-zinc-600 bg-zinc-950/40 hover:bg-zinc-950/80'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 mb-3 group-hover:scale-110 transition-transform">
            <Upload className="w-5 h-5" />
          </div>
          <p className="font-mono text-sm text-zinc-200 font-medium text-center">
            Upload Cover Image
          </p>
          <p className="font-mono text-xs text-zinc-500 mt-1 text-center">
            Drag & drop or click to browse
          </p>
          <p className="font-mono text-[11px] text-zinc-600 mt-2">
            PNG, JPG, WEBP, GIF, SVG
          </p>
        </div>
      )}
    </div>
  );
};

import React, { useRef, useState } from 'react';
import { MediaFile } from '../types';

interface AudioUploaderProps {
  audioFile: MediaFile | null;
  onAudioSelected: (file: File) => void;
  onAudioRemoved: () => void;
  disabled?: boolean;
}

export const AudioUploader: React.FC<AudioUploaderProps> = ({
  audioFile,
  onAudioSelected,
  onAudioRemoved,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|aif|aiff)$/i.test(file.name)) {
      onAudioSelected(file);
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

  const formatDuration = (seconds?: number) => {
    if (seconds === undefined || isNaN(seconds)) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + ' KB';
    }
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div id="audio-uploader-card" className="flex flex-col h-full">
      <input
        ref={inputRef}
        id="audio-file-input"
        type="file"
        accept="audio/*,.mp3,.wav,.aif,.aiff,.aac,.ogg,.m4a"
        className="hidden"
        disabled={disabled}
        onChange={(e) => handleFiles(e.target.files)}
      />

      {!audioFile ? (
        <div
          id="audio-dropzone"
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
          <span className="font-mono text-xs">+ audio</span>
          <span className="font-mono text-[10px] text-zinc-400 mt-1">drop or click</span>
        </div>
      ) : (
        <div
          id="audio-preview-container"
          className="h-48 border border-zinc-200 rounded-lg p-3 flex flex-col justify-between"
        >
          <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
            <span className="font-mono text-xs text-zinc-900 font-medium truncate max-w-[200px] mb-3" title={audioFile.name}>
              {audioFile.name.replace(/\.[^/.]+$/, '')}
            </span>
            <audio
              id="audio-player-preview"
              controls
              src={audioFile.previewUrl}
              className="w-full max-w-[210px] h-8"
            />
          </div>

          <div className="flex items-center justify-between font-mono text-[11px] text-zinc-400 pt-1 border-t border-zinc-100">
            <span>audio ready</span>
            <button
              id="btn-remove-audio"
              type="button"
              onClick={onAudioRemoved}
              disabled={disabled}
              className="text-zinc-400 hover:text-red-500 cursor-pointer transition-colors ml-2"
              title="Remove"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useRef, useState } from 'react';
import { Music, UploadCloud, X, Volume2 } from 'lucide-react';
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
    <div id="audio-uploader-card" className="flex flex-col h-full rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-100">
        <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5">
          <Music className="w-3.5 h-3.5 text-zinc-500" />
          <span>Audio Soundtrack</span>
        </label>
        <span className="text-[10px] font-mono text-zinc-400">MP3, WAV, AAC, M4A</span>
      </div>

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
          className={`minimal-dropzone rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer min-h-[190px] flex-1 ${
            isDragging ? 'is-dragging' : ''
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <UploadCloud className="w-6 h-6 text-zinc-400 mb-2.5 stroke-[1.5]" />
          <p className="text-xs font-medium text-zinc-800 mb-0.5">
            Drop soundtrack here
          </p>
          <p className="text-[11px] text-zinc-400 mb-3">
            or click to browse audio files
          </p>
          <span className="inline-flex items-center px-3 py-1 text-[11px] font-mono text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded transition-colors">
            Select file
          </span>
        </div>
      ) : (
        <div
          id="audio-preview-container"
          className="rounded-lg border border-zinc-100 bg-zinc-50 p-3 flex flex-col justify-between flex-1"
        >
          <div className="rounded-md border border-zinc-200/80 bg-white p-3 flex flex-col items-center justify-center h-[140px] mb-3">
            <div className="flex items-center gap-1.5 mb-2.5 text-zinc-500 text-xs font-medium">
              <Volume2 className="w-4 h-4 text-zinc-400" />
              <span>Audio Preview</span>
            </div>
            <audio
              id="audio-player-preview"
              controls
              src={audioFile.previewUrl}
              className="w-full max-w-[240px] h-8"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px] font-mono bg-white px-2.5 py-1.5 rounded border border-zinc-200/60 text-zinc-700">
              <span className="truncate max-w-[150px]" title={audioFile.name}>
                {audioFile.name}
              </span>
              <span className="text-zinc-400 shrink-0">
                {audioFile.duration !== undefined ? `${formatDuration(audioFile.duration)} · ` : ''}
                {formatSize(audioFile.size)}
              </span>
            </div>

            <div className="flex items-center justify-end gap-1.5">
              <button
                id="btn-change-audio"
                type="button"
                onClick={() => !disabled && inputRef.current?.click()}
                disabled={disabled}
                className="px-2.5 py-1 text-[11px] font-mono font-medium text-zinc-700 hover:text-black bg-white hover:bg-zinc-100 border border-zinc-200 rounded transition-colors cursor-pointer"
              >
                Change
              </button>
              <button
                id="btn-remove-audio"
                type="button"
                onClick={onAudioRemoved}
                disabled={disabled}
                className="px-2.5 py-1 text-[11px] font-mono font-medium text-red-600 hover:text-red-700 bg-white hover:bg-red-50 border border-zinc-200 rounded transition-colors cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

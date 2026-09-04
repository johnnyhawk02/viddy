import React, { useRef, useState } from 'react';
import { Music, UploadCloud, X, CheckCircle2, Sparkles, Volume2 } from 'lucide-react';
import { MediaFile } from '../types';

interface AudioUploaderProps {
  audioFile: MediaFile | null;
  onAudioSelected: (file: File) => void;
  onAudioRemoved: () => void;
  onLoadSample: () => void;
  disabled?: boolean;
}

export const AudioUploader: React.FC<AudioUploaderProps> = ({
  audioFile,
  onAudioSelected,
  onAudioRemoved,
  onLoadSample,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac)$/i.test(file.name)) {
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

  return (
    <div id="audio-uploader-card" className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Music className="w-4 h-4 text-emerald-400" />
          <span>Audio Soundtrack</span>
          <span className="text-xs font-normal text-slate-400">(MP3, WAV)</span>
        </label>
        {!audioFile && (
          <button
            id="btn-load-sample-audio"
            type="button"
            onClick={onLoadSample}
            disabled={disabled}
            className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 hover:underline cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3 h-3" />
            Try Sample Melody
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        id="audio-file-input"
        type="file"
        accept="audio/mp3,audio/mpeg,audio/wav,audio/x-wav,audio/ogg,audio/aac"
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
          className={`flex-1 border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 min-h-[220px] ${
            isDragging
              ? 'border-emerald-400 bg-emerald-950/30'
              : 'border-slate-700 hover:border-slate-500 bg-slate-800/40 hover:bg-slate-800/70'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mb-3 group-hover:scale-105 transition-transform">
            <UploadCloud className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="text-sm font-medium text-slate-200 mb-1">
            Click to upload or drag & drop audio
          </p>
          <p className="text-xs text-slate-400">
            Supports MP3, WAV (encoded to AAC 192kbps for MP4)
          </p>
        </div>
      ) : (
        <div
          id="audio-preview-container"
          className="flex-1 rounded-xl border border-slate-700 bg-slate-800/50 p-3.5 flex flex-col justify-between"
        >
          <div className="rounded-lg bg-slate-950 border border-slate-700/80 p-4 aspect-video flex flex-col items-center justify-center relative mb-3">
            <div className="w-12 h-12 rounded-full bg-emerald-950/70 border border-emerald-500/30 flex items-center justify-center mb-3 text-emerald-400">
              <Volume2 className="w-6 h-6 animate-pulse" />
            </div>

            {/* Built-in HTML5 Audio player preview */}
            <div className="w-full max-w-xs">
              <audio
                id="audio-player-preview"
                controls
                src={audioFile.previewUrl}
                className="w-full h-10 accent-emerald-500 rounded-lg shadow-inner"
              />
            </div>

            <div className="absolute top-2 right-2">
              <button
                id="btn-remove-audio"
                type="button"
                onClick={onAudioRemoved}
                disabled={disabled}
                title="Remove audio"
                className="w-7 h-7 rounded-full bg-slate-900/80 hover:bg-rose-900/80 text-slate-200 hover:text-white flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {audioFile.duration !== undefined && (
              <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-900/80 text-[11px] font-mono text-slate-300 backdrop-blur-xs border border-slate-700/60">
                Duration: {formatDuration(audioFile.duration)}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2 truncate pr-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-medium truncate text-slate-200">{audioFile.name}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-slate-400 font-mono">
                {(audioFile.size / 1024).toFixed(1)} KB
              </span>
              <button
                id="btn-change-audio"
                type="button"
                onClick={() => !disabled && inputRef.current?.click()}
                disabled={disabled}
                className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors cursor-pointer hover:underline text-xs"
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

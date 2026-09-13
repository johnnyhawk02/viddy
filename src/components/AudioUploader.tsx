import React, { useRef, useState } from 'react';
import { MediaFile } from '../types';
import { Upload, Music, X, Volume2 } from 'lucide-react';

interface AudioUploaderProps {
  audioFile: MediaFile | null;
  onAudioSelect: (file: MediaFile | null) => void;
}

export const AudioUploader: React.FC<AudioUploaderProps> = ({
  audioFile,
  onAudioSelect,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = (file: File) => {
    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|flac|m4a|aac)$/i)) {
      alert('Please upload a valid audio file (MP3, WAV, OGG, FLAC, M4A, AAC).');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const audio = new Audio(previewUrl);
    audio.onloadedmetadata = () => {
      onAudioSelect({
        file,
        name: file.name,
        size: file.size,
        type: file.type || 'audio/mpeg',
        previewUrl,
        duration: audio.duration,
      });
    };
    audio.onerror = () => {
      onAudioSelect({
        file,
        name: file.name,
        size: file.size,
        type: file.type || 'audio/mpeg',
        previewUrl,
      });
    };
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

  const formatSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds || isNaN(seconds)) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div id="audio-uploader-card" className="p-4 bg-zinc-900/80 border border-zinc-800/80 rounded-xl flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music className="w-4 h-4 text-zinc-400" />
          <span className="font-mono text-xs text-zinc-300 font-medium">Audio Track for MP4 Video</span>
        </div>
        {audioFile && (
          <span className="font-mono text-[11px] text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            Ready to compile
          </span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.ogg,.flac,.m4a,.aac"
        onChange={handleFileInput}
        className="hidden"
      />

      {audioFile ? (
        <div className="flex flex-col gap-2.5 p-3 rounded-lg bg-zinc-950 border border-zinc-800">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <Volume2 className="w-4 h-4 text-zinc-400 shrink-0" />
              <div className="flex flex-col truncate">
                <span className="font-mono text-xs text-zinc-200 truncate font-medium">{audioFile.name}</span>
                <span className="font-mono text-[11px] text-zinc-500">
                  {formatSize(audioFile.size)} {audioFile.duration ? `· ${formatDuration(audioFile.duration)}` : ''}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onAudioSelect(null)}
              className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Remove audio track"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <audio
            controls
            src={audioFile.previewUrl}
            className="w-full h-8 accent-white"
          />
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center p-5 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
            isDragging
              ? 'border-white bg-zinc-800/50'
              : 'border-zinc-800 hover:border-zinc-600 bg-zinc-950/50 hover:bg-zinc-900/50'
          }`}
        >
          <Upload className="w-5 h-5 text-zinc-400 mb-1.5" />
          <p className="font-mono text-xs text-zinc-300 font-medium">Drop audio file or click to browse</p>
          <p className="font-mono text-[11px] text-zinc-500 mt-0.5">MP3, WAV, FLAC, M4A, AAC</p>
        </div>
      )}
    </div>
  );
};

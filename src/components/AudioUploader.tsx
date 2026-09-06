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
    <fieldset id="audio-uploader-card" className="web1-fieldset flex flex-col h-full">
      <legend className="web1-legend">2. Select Audio Track</legend>

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
          className={`web1-dropzone p-4 flex flex-col items-center justify-center text-center cursor-pointer min-h-[170px] ${
            isDragging ? 'dragging' : ''
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="font-serif text-sm font-bold text-black mb-1">
            [ Drag & Drop Audio File Here ]
          </div>
          <div className="text-xs text-[#555555] mb-3">
            (or click anywhere inside this box to browse)
          </div>
          <button
            type="button"
            disabled={disabled}
            className="web1-btn"
          >
            Browse Audio...
          </button>
          <div className="text-[11px] text-[#777777] mt-2 font-mono">
            Formats: .mp3, .wav, .aiff
          </div>
        </div>
      ) : (
        <div
          id="audio-preview-container"
          className="border border-[#888888] bg-[#f9f9f9] p-3 flex flex-col justify-between flex-1"
        >
          <div className="border border-[#cccccc] bg-white p-3 flex flex-col items-center justify-center h-[140px] mb-2">
            <div className="text-xs font-serif font-bold text-black mb-2">
              Audio Playback Test:
            </div>
            <audio
              id="audio-player-preview"
              controls
              src={audioFile.previewUrl}
              className="w-full max-w-[260px] h-8"
            />
          </div>

          <div className="text-xs font-serif text-black">
            <div className="border border-[#cccccc] bg-white px-2 py-1 mb-2 font-mono text-[11px] truncate">
              <b>File:</b> {audioFile.name}{' '}
              {audioFile.duration !== undefined ? `(${formatDuration(audioFile.duration)})` : ''} — {formatSize(audioFile.size)}
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-change-audio"
                type="button"
                onClick={() => !disabled && inputRef.current?.click()}
                disabled={disabled}
                className="web1-btn"
              >
                Change Audio...
              </button>
              <button
                id="btn-remove-audio"
                type="button"
                onClick={onAudioRemoved}
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

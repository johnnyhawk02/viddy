import React from 'react';
import { VideoOutput } from '../types';

interface OutputSectionProps {
  output: VideoOutput;
  onReset: () => void;
}

export const OutputSection: React.FC<OutputSectionProps> = ({ output, onReset }) => {
  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = output.url;
    a.download = output.filename || 'rendered-video.mp4';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div id="output-video-section" className="mt-8">
      <div className="rounded-lg overflow-hidden border border-zinc-200 bg-black aspect-video max-h-[380px] flex items-center justify-center mx-auto mb-3">
        <video
          id="output-video-player"
          src={output.url}
          controls
          autoPlay
          loop
          playsInline
          className="w-full h-full object-contain"
        />
      </div>

      <div className="flex items-center justify-between font-mono text-xs text-zinc-500">
        <span>{formatSize(output.size)}</span>
        <div className="flex items-center gap-3">
          <button
            id="btn-create-another"
            type="button"
            onClick={onReset}
            className="hover:text-zinc-900 cursor-pointer"
          >
            reset
          </button>
          <button
            id="btn-download-video"
            type="button"
            onClick={handleDownload}
            className="bg-zinc-900 hover:bg-zinc-800 text-white px-3 py-1.5 rounded cursor-pointer transition-colors"
          >
            download mp4
          </button>
        </div>
      </div>
    </div>
  );
};


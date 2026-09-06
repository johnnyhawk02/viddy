import React from 'react';
import { Download, RotateCcw, CheckCircle2 } from 'lucide-react';
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
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div
      id="output-video-section"
      className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
    >
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-100">
        <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>MP4 Video Ready</span>
        </span>
        <span className="text-[10px] font-mono text-zinc-400">1 FPS · H.264 / AAC</span>
      </div>

      {/* Video player preview */}
      <div className="rounded-lg overflow-hidden border border-zinc-900/10 bg-black aspect-video max-h-[340px] flex items-center justify-center mx-auto mb-3 shadow-inner">
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

      {/* Details & Download action */}
      <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px] text-zinc-600 mb-3">
          <div>
            <span className="text-zinc-400">File: </span>
            <span className="text-zinc-900 font-medium truncate">{output.filename}</span>
          </div>
          <div className="sm:text-right">
            <span className="text-zinc-400">Size: </span>
            <span className="text-zinc-900 font-medium">{formatSize(output.size)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-zinc-200/60">
          <button
            id="btn-download-video"
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 bg-black hover:bg-zinc-800 text-white px-4 py-2 rounded-lg text-xs font-medium transition-all active:scale-[0.99] cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download MP4</span>
          </button>
          <button
            id="btn-create-another"
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-mono text-zinc-600 hover:text-black border border-zinc-200 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New conversion</span>
          </button>
        </div>
      </div>
    </div>
  );
};


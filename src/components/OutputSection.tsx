import React from 'react';
import { Download, Film, RotateCcw, CheckCircle2 } from 'lucide-react';
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
      className="mt-6 rounded-2xl border border-emerald-500/40 bg-slate-900/90 shadow-2xl p-6 transition-all animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Generated MP4 Video
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Ready
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              H.264 Video • AAC 192kbps Audio • YUV420p Color • Even Dimensions
            </p>
          </div>
        </div>

        <button
          id="btn-create-another"
          type="button"
          onClick={onReset}
          className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-750 text-xs font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Create Another
        </button>
      </div>

      {/* Video player preview */}
      <div className="relative rounded-xl overflow-hidden bg-black border border-slate-800 aspect-video max-h-[380px] flex items-center justify-center mx-auto mb-4">
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-800">
        <div className="flex items-center gap-4 text-xs text-slate-400 w-full sm:w-auto">
          <div>
            <span className="text-slate-500">File: </span>
            <span className="text-slate-200 font-mono font-medium">{output.filename}</span>
          </div>
          <div>
            <span className="text-slate-500">Size: </span>
            <span className="text-slate-200 font-mono font-medium">{formatSize(output.size)}</span>
          </div>
        </div>

        <button
          id="btn-download-video"
          type="button"
          onClick={handleDownload}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all transform active:scale-98 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Download MP4 Video
        </button>
      </div>
    </div>
  );
};

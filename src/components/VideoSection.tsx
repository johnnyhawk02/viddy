import React, { useState } from 'react';
import {
  ImageMediaFile,
  AudioMediaFile,
  VideoOutput,
  RenderProgress,
  FFmpegStatus,
} from '../types';
import { createOneFpsVideo } from '../utils/ffmpeg';
import {
  Film,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface VideoSectionProps {
  imageFile: ImageMediaFile | null;
  audioFile: AudioMediaFile | null;
}

export const VideoSection: React.FC<VideoSectionProps> = ({
  imageFile,
  audioFile,
}) => {
  const [status, setStatus] = useState<FFmpegStatus>('idle');
  const [progress, setProgress] = useState<RenderProgress>({ ratio: 0, percentage: 0 });
  const [statusText, setStatusText] = useState<string>('');
  const [videoOutput, setVideoOutput] = useState<VideoOutput | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const canGenerate = Boolean(imageFile && audioFile);

  const handleGenerate = async () => {
    if (!imageFile || !audioFile) {
      alert('Please select both an image and an audio file.');
      return;
    }

    try {
      setStatus('encoding');
      setProgress({ ratio: 0.05, percentage: 5 });
      setStatusText('Initializing FFmpeg WebAssembly compiler...');
      setErrorMessage('');

      const output = await createOneFpsVideo(
        imageFile.file,
        audioFile.file,
        audioFile.duration,
        (p) => {
          setProgress(p);
          setStatusText(`Encoding 1fps MP4 (${p.percentage}%)...`);
        },
        (log) => {
          if (log.includes('frame=')) {
            setStatusText(log.trim());
          }
        }
      );

      setVideoOutput(output);
      setStatus('done');
      setStatusText('1fps MP4 video created successfully!');
    } catch (err: any) {
      console.error('Video rendering error:', err);
      setStatus('error');
      setErrorMessage(
        err?.message || 'Failed to render 1fps MP4 video. Please check your browser support or connection.'
      );
    }
  };

  const handleReset = () => {
    setVideoOutput(null);
    setStatus('idle');
    setProgress({ ratio: 0, percentage: 0 });
    setStatusText('');
    setErrorMessage('');
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds || isNaN(seconds)) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      id="video-generator-card"
      className="p-6 bg-zinc-900/90 border border-zinc-800 rounded-2xl flex flex-col gap-5 shadow-xl"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-mono text-sm text-zinc-100 font-semibold">
              3. 1fps MP4 Video
            </h3>
            <p className="font-mono text-xs text-zinc-500">
              Combines image & audio into a lightweight 1 frame-per-second video
            </p>
          </div>
        </div>

        {status === 'done' && (
          <span className="font-mono text-xs text-emerald-400 flex items-center gap-1.5 bg-emerald-950/50 border border-emerald-800/40 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed
          </span>
        )}
      </div>

      {!videoOutput ? (
        <div className="flex flex-col gap-4">
          {/* Missing items checklist if not ready */}
          {!canGenerate && (
            <div className="flex flex-col gap-2 p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/60 font-mono text-xs text-zinc-400">
              <span className="text-zinc-500 font-medium">Requirements to compile:</span>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    imageFile ? 'bg-emerald-400' : 'bg-zinc-700'
                  }`}
                />
                <span className={imageFile ? 'text-zinc-200' : 'text-zinc-500'}>
                  {imageFile ? `Image selected (${imageFile.name})` : 'Select or upload an image'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    audioFile ? 'bg-emerald-400' : 'bg-zinc-700'
                  }`}
                />
                <span className={audioFile ? 'text-zinc-200' : 'text-zinc-500'}>
                  {audioFile ? `Audio selected (${audioFile.name})` : 'Select or upload an audio track'}
                </span>
              </div>
            </div>
          )}

          {/* Progress / Encoding state */}
          {status === 'encoding' ? (
            <div className="flex flex-col gap-3 p-5 bg-zinc-950 border border-zinc-800 rounded-xl">
              <div className="flex items-center justify-between font-mono text-xs text-zinc-300">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>{statusText || 'Encoding 1fps MP4...'}</span>
                </span>
                <span className="font-semibold text-white text-sm">{progress.percentage}%</span>
              </div>

              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-300 rounded-full"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>

              <p className="font-mono text-[11px] text-zinc-500 text-center">
                Muxing image still frame at 1 fps with H.264 & AAC audio. Runs 100% locally in your browser.
              </p>
            </div>
          ) : (
            <button
              id="btn-create-mp4"
              type="button"
              disabled={!canGenerate}
              onClick={handleGenerate}
              className={`w-full py-3.5 px-5 rounded-xl font-mono text-sm font-semibold flex items-center justify-center gap-2.5 transition-all shadow-lg ${
                canGenerate
                  ? 'bg-white hover:bg-zinc-200 text-zinc-950 cursor-pointer'
                  : 'bg-zinc-800/80 text-zinc-500 cursor-not-allowed opacity-60'
              }`}
            >
              <Film className="w-4 h-4" />
              <span>
                {canGenerate
                  ? 'Make 1fps .mp4'
                  : 'Upload Image & Audio to Make .mp4'}
              </span>
            </button>
          )}

          {/* Error display */}
          {status === 'error' && (
            <div className="p-4 bg-red-950/30 border border-red-800/60 rounded-xl flex flex-col gap-2 font-mono text-xs text-red-300">
              <div className="flex items-center gap-2 text-red-400 font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Error generating video</span>
              </div>
              <p className="text-red-300/90 leading-relaxed">{errorMessage}</p>
              <button
                type="button"
                onClick={handleGenerate}
                className="mt-1 self-start px-3 py-1.5 rounded-lg bg-red-900/60 hover:bg-red-800 text-red-100 font-medium cursor-pointer transition-colors"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Video Ready View */
        <div className="flex flex-col gap-4">
          <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-black aspect-video flex items-center justify-center">
            <video
              controls
              autoPlay
              src={videoOutput.url}
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-zinc-950 rounded-xl border border-zinc-800/80 font-mono text-xs text-zinc-400">
            <div className="flex items-center gap-2 truncate">
              <Film className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <span className="truncate font-medium text-zinc-200" title={videoOutput.filename}>
                {videoOutput.filename}
              </span>
            </div>
            <div className="flex items-center gap-3 text-zinc-400 shrink-0">
              <span>1 fps</span>
              <span>·</span>
              <span>{formatSize(videoOutput.size)}</span>
              {videoOutput.duration && (
                <>
                  <span>·</span>
                  <span>{formatDuration(videoOutput.duration)}</span>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              id="btn-download-video"
              href={videoOutput.url}
              download={videoOutput.filename}
              className="py-3 px-4 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>Download .mp4</span>
            </a>

            <button
              id="btn-create-another"
              type="button"
              onClick={handleReset}
              className="py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Make Another</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

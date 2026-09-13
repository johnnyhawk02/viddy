import React, { useState } from 'react';
import { VideoOutput, RenderProgress, FFmpegStatus, MediaFile, CoverConfig } from '../types';
import { createStaticCoverVideo } from '../utils/ffmpeg';
import { generateCoverPng } from '../utils/generateCover';
import { Video, Download, Loader2, Play, CheckCircle2, AlertCircle } from 'lucide-react';

interface VideoSectionProps {
  config: CoverConfig;
  audioFile: MediaFile | null;
  aspectRatio: '16:9' | '1:1';
}

export const VideoSection: React.FC<VideoSectionProps> = ({
  config,
  audioFile,
  aspectRatio,
}) => {
  const [status, setStatus] = useState<FFmpegStatus>('unloaded');
  const [progress, setProgress] = useState<RenderProgress>({ ratio: 0, percentage: 0 });
  const [statusText, setStatusText] = useState<string>('');
  const [videoOutput, setVideoOutput] = useState<VideoOutput | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleGenerateVideo = async () => {
    if (!audioFile) {
      alert('Please upload an audio file first to generate the MP4 video.');
      return;
    }

    try {
      setStatus('encoding');
      setStatusText('Generating master Bézier still frame...');
      setProgress({ ratio: 0.1, percentage: 10 });
      setErrorMessage('');

      const width = 1920;
      const height = aspectRatio === '1:1' ? 1920 : 1080;
      const imageBlob = await generateCoverPng(config, width, height);

      setStatusText('Initializing FFmpeg & muxing audio into MP4...');
      const output = await createStaticCoverVideo(
        imageBlob,
        audioFile.file,
        (p) => {
          setProgress(p);
          setStatusText(`Encoding MP4 (${p.percentage}%)...`);
        },
        (log) => {
          if (log.includes('frame=')) {
            setStatusText(log.trim());
          }
        }
      );

      setVideoOutput(output);
      setStatus('done');
      setStatusText('MP4 Video compiled successfully!');
    } catch (err: any) {
      console.error('Video generation error:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Failed to encode video. Please try again.');
    }
  };

  const formatSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div id="video-generator-card" className="p-4 bg-zinc-900/80 border border-zinc-800/80 rounded-xl flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-zinc-400" />
          <span className="font-mono text-xs text-zinc-300 font-medium">MP4 Video Compiler</span>
        </div>
        {status === 'done' && (
          <span className="font-mono text-[11px] text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Complete
          </span>
        )}
      </div>

      {!videoOutput ? (
        <div className="flex flex-col gap-3">
          <p className="font-mono text-xs text-zinc-400 leading-relaxed">
            Combines your high-resolution static Bézier cover art frame with the audio track into a standard MP4 video.
          </p>

          {status === 'encoding' ? (
            <div className="flex flex-col gap-2 p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
              <div className="flex items-center justify-between font-mono text-xs text-zinc-300">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  {statusText || 'Encoding MP4...'}
                </span>
                <span className="font-semibold text-white">{progress.percentage}%</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-200"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>
          ) : (
            <button
              id="btn-compile-mp4"
              type="button"
              disabled={!audioFile}
              onClick={handleGenerateVideo}
              className={`w-full py-3 px-4 rounded-xl font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                audioFile
                  ? 'bg-white hover:bg-zinc-200 text-zinc-950'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-60'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>{audioFile ? 'Generate MP4 Video' : 'Upload Audio to Generate MP4'}</span>
            </button>
          )}

          {status === 'error' && (
            <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-lg flex items-start gap-2 text-xs font-mono text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Video Preview */}
          <div className="relative rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950">
            <video
              controls
              src={videoOutput.url}
              className="w-full max-h-64 object-contain bg-black"
            />
          </div>

          <div className="flex items-center justify-between font-mono text-xs text-zinc-400">
            <span className="truncate">{videoOutput.filename}</span>
            <span className="shrink-0">{formatSize(videoOutput.size)}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <a
              id="btn-download-mp4"
              href={videoOutput.url}
              download={videoOutput.filename}
              className="py-2.5 px-3 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download MP4</span>
            </a>

            <button
              type="button"
              onClick={() => {
                setVideoOutput(null);
                setStatus('unloaded');
              }}
              className="py-2.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>Compile New</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

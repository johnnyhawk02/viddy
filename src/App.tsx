import React, { useState, useEffect, useCallback } from 'react';
import { Film, Play, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { FFmpegStatus, MediaFile, RenderProgress, InitProgress, LogEntry, VideoOutput } from './types';
import { initFFmpeg, convertImageAndAudioToVideo } from './utils/ffmpeg';
import { ImageUploader } from './components/ImageUploader';
import { AudioUploader } from './components/AudioUploader';
import { OutputSection } from './components/OutputSection';

export default function App() {
  const [engineStatus, setEngineStatus] = useState<FFmpegStatus>('loading');
  const [initProgress, setInitProgress] = useState<InitProgress | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<RenderProgress>({ ratio: 0, percentage: 0 });

  const [imageFile, setImageFile] = useState<MediaFile | null>(null);
  const [audioFile, setAudioFile] = useState<MediaFile | null>(null);
  const [videoOutput, setVideoOutput] = useState<VideoOutput | null>(null);

  // Pipe all logs to dev console for local AI Studio inspection
  const handleLog = useCallback((log: LogEntry) => {
    if (log.type === 'error') {
      console.error(`[FFmpeg Error]`, log.message);
    } else {
      console.log(`[FFmpeg]`, log.message);
    }
  }, []);

  const initializeEngine = useCallback(async () => {
    setEngineStatus('loading');
    setErrorMessage(null);
    setInitProgress({ percentage: 0, message: 'Loading core...' });

    try {
      await initFFmpeg(
        handleLog,
        (p) => setProgress(p),
        (initP) => setInitProgress(initP)
      );
      setEngineStatus('ready');
      console.log('[FFmpeg] Core ready.');
    } catch (err: any) {
      console.error('[FFmpeg] Init failed:', err);
      setEngineStatus('error');
      setErrorMessage(err?.message || 'Failed to initialize FFmpeg engine.');
    }
  }, [handleLog]);

  useEffect(() => {
    initializeEngine();
  }, [initializeEngine]);

  const handleImageSelected = (file: File) => {
    if (imageFile?.previewUrl) {
      URL.revokeObjectURL(imageFile.previewUrl);
    }
    const previewUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setImageFile({
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl,
        dimensions: { width: img.naturalWidth, height: img.naturalHeight },
      });
    };
    img.onerror = () => {
      setImageFile({
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl,
      });
    };
    img.src = previewUrl;
  };

  const handleImageRemoved = () => {
    if (imageFile?.previewUrl) {
      URL.revokeObjectURL(imageFile.previewUrl);
    }
    setImageFile(null);
  };

  const handleAudioSelected = (file: File) => {
    if (audioFile?.previewUrl) {
      URL.revokeObjectURL(audioFile.previewUrl);
    }
    const previewUrl = URL.createObjectURL(file);
    const audio = new Audio();
    audio.onloadedmetadata = () => {
      setAudioFile({
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl,
        duration: audio.duration,
      });
    };
    audio.onerror = () => {
      setAudioFile({
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl,
      });
    };
    audio.src = previewUrl;
  };

  const handleAudioRemoved = () => {
    if (audioFile?.previewUrl) {
      URL.revokeObjectURL(audioFile.previewUrl);
    }
    setAudioFile(null);
  };

  const handleGenerateVideo = async () => {
    if (!imageFile || !audioFile || engineStatus !== 'ready') return;

    setEngineStatus('encoding');
    setErrorMessage(null);
    setProgress({ ratio: 0, percentage: 0 });

    try {
      const result = await convertImageAndAudioToVideo(
        imageFile.file,
        audioFile.file,
        handleLog,
        (p) => setProgress(p),
        1
      );

      setVideoOutput(result);
      setEngineStatus('done');
    } catch (err: any) {
      console.error('[FFmpeg] Encoding failed:', err);
      setEngineStatus('error');
      setErrorMessage(err?.message || 'Error occurred during video compilation.');
    }
  };

  const handleResetOutput = () => {
    if (videoOutput?.url) {
      URL.revokeObjectURL(videoOutput.url);
    }
    setVideoOutput(null);
    setEngineStatus('ready');
    setProgress({ ratio: 0, percentage: 0 });
  };

  const isButtonDisabled =
    engineStatus === 'loading' ||
    engineStatus === 'encoding' ||
    !imageFile ||
    !audioFile;

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-900 flex flex-col justify-between p-4 sm:p-8 max-w-3xl mx-auto selection:bg-zinc-900 selection:text-white">
      <div>
        {/* Minimal Header */}
        <header id="main-header" className="pt-2 pb-6 sm:pb-8">
          <div className="flex items-center justify-between gap-4 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 font-semibold">
              WASM Video Compiler
            </span>
            {engineStatus === 'loading' && (
              <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin text-zinc-500" />
                loading core...
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-950 mb-2">
            Image & Audio to MP4
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 font-normal leading-relaxed max-w-xl">
            Compile an MP4 video at 1 FPS from a static cover image and an audio soundtrack. Runs 100% locally in-browser via WebAssembly FFmpeg.
          </p>
        </header>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-6 p-3.5 rounded-lg border border-red-200 bg-red-50 text-red-900 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 truncate">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span className="truncate">{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={initializeEngine}
              className="px-2.5 py-1 rounded bg-white hover:bg-red-100 text-red-700 border border-red-200 text-xs font-mono font-medium flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          </div>
        )}

        {/* Uploaders Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <ImageUploader
            imageFile={imageFile}
            onImageSelected={handleImageSelected}
            onImageRemoved={handleImageRemoved}
            disabled={engineStatus === 'encoding'}
          />
          <AudioUploader
            audioFile={audioFile}
            onAudioSelected={handleAudioSelected}
            onAudioRemoved={handleAudioRemoved}
            disabled={engineStatus === 'encoding'}
          />
        </div>

        {/* Progress bar during encoding */}
        {engineStatus === 'encoding' && (
          <div className="mb-5 p-4 rounded-xl border border-zinc-200 bg-white shadow-sm">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-600 mb-2">
              <span className="flex items-center gap-1.5 font-medium text-zinc-900">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-700" />
                Encoding MP4 video...
              </span>
              <span className="font-semibold">{progress.percentage}%</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-zinc-950 transition-all duration-150 rounded-full"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <div className="text-xs font-mono text-zinc-500">
            {!imageFile || !audioFile ? (
              <span>Upload cover image & audio track to convert</span>
            ) : engineStatus === 'loading' ? (
              <span className="text-zinc-400">Initializing WASM engine...</span>
            ) : engineStatus === 'encoding' ? (
              <span className="text-zinc-900 font-medium">Encoding in progress...</span>
            ) : (
              <span className="text-emerald-600 font-medium">● Ready to convert</span>
            )}
          </div>

          <button
            id="btn-generate-video"
            type="button"
            onClick={handleGenerateVideo}
            disabled={isButtonDisabled}
            className={`px-5 py-2.5 rounded-lg text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isButtonDisabled
                ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200/60'
                : 'bg-zinc-950 hover:bg-zinc-800 text-white shadow-sm active:scale-[0.99]'
            }`}
          >
            {engineStatus === 'encoding' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Converting ({progress.percentage}%)</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Convert to MP4</span>
              </>
            )}
          </button>
        </div>

        {/* Rendered Output Section */}
        {videoOutput && (
          <OutputSection output={videoOutput} onReset={handleResetOutput} />
        )}
      </div>

      {/* Minimal Footer */}
      <footer className="pt-12 pb-4 text-center text-[11px] font-mono text-zinc-400">
        <span>Image & Audio to MP4 · WebAssembly Client Engine</span>
      </footer>
    </div>
  );
}

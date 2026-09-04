import React, { useState, useEffect, useCallback } from 'react';
import { Film, Sparkles, Play, Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { FFmpegStatus, MediaFile, RenderProgress, InitProgress, LogEntry, VideoOutput } from './types';
import { initFFmpeg, convertImageAndAudioToVideo } from './utils/ffmpeg';
import { createSampleImage, createSampleAudio } from './utils/samples';
import { ImageUploader } from './components/ImageUploader';
import { AudioUploader } from './components/AudioUploader';
import { StatusConsole } from './components/StatusConsole';
import { OutputSection } from './components/OutputSection';

export default function App() {
  const [engineStatus, setEngineStatus] = useState<FFmpegStatus>('loading');
  const [initProgress, setInitProgress] = useState<InitProgress | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [progress, setProgress] = useState<RenderProgress>({ ratio: 0, percentage: 0 });

  const [imageFile, setImageFile] = useState<MediaFile | null>(null);
  const [audioFile, setAudioFile] = useState<MediaFile | null>(null);
  const [videoOutput, setVideoOutput] = useState<VideoOutput | null>(null);

  const addLog = useCallback((log: LogEntry) => {
    setLogs((prev) => [...prev.slice(-150), log]);
  }, []);

  // Initialize FFmpeg WASM on mount
  const initializeEngine = useCallback(async () => {
    setEngineStatus('loading');
    setErrorMessage(null);
    setInitProgress({ percentage: 0, message: 'Connecting to CDN...' });
    addLog({
      id: Math.random().toString(36).substring(2, 9),
      type: 'info',
      message: 'Connecting to CDN to fetch single-threaded FFmpeg 0.12 WASM engine...',
      timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    });

    try {
      await initFFmpeg(
        (log) => addLog(log),
        (p) => setProgress(p),
        (initP) => setInitProgress(initP)
      );
      setEngineStatus('ready');
      addLog({
        id: Math.random().toString(36).substring(2, 9),
        type: 'success',
        message: 'FFmpeg Core loaded successfully. Ready to compile video without COOP/COEP headers.',
        timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      });
    } catch (err: any) {
      console.error('FFmpeg initialization error:', err);
      setEngineStatus('error');
      const msg = err?.message || 'Failed to initialize FFmpeg WASM engine.';
      setErrorMessage(msg);
      addLog({
        id: Math.random().toString(36).substring(2, 9),
        type: 'error',
        message: `Initialization error: ${msg}`,
        timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      });
    }
  }, [addLog]);

  useEffect(() => {
    initializeEngine();
  }, [initializeEngine]);

  // Handle Image Selection
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

  // Handle Audio Selection
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

  // Sample Loaders
  const handleLoadSampleImage = async () => {
    try {
      const sample = await createSampleImage();
      handleImageSelected(sample);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLoadSampleAudio = async () => {
    try {
      const sample = await createSampleAudio();
      handleAudioSelected(sample);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLoadBothSamples = async () => {
    await handleLoadSampleImage();
    await handleLoadSampleAudio();
  };

  // Generate Video
  const handleGenerateVideo = async () => {
    if (!imageFile || !audioFile || engineStatus !== 'ready') return;

    setEngineStatus('encoding');
    setErrorMessage(null);
    setProgress({ ratio: 0, percentage: 0 });

    try {
      const result = await convertImageAndAudioToVideo(
        imageFile.file,
        audioFile.file,
        (log) => addLog(log),
        (p) => setProgress(p),
        1
      );

      setVideoOutput(result);
      setEngineStatus('done');
    } catch (err: any) {
      console.error('Encoding error:', err);
      setEngineStatus('error');
      const msg = err?.message || 'Error occurred during video compilation.';
      setErrorMessage(msg);
      addLog({
        id: Math.random().toString(36).substring(2, 9),
        type: 'error',
        message: `Video compilation failed: ${msg}`,
        timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      });
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-sky-500/30 selection:text-sky-200">
      {/* Header bar */}
      <header id="main-header" className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-100 leading-tight">
                Image & Audio to MP4
              </h1>
              <p className="text-xs text-slate-400 font-normal">
                Client-Side WASM Video Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800/80 text-slate-300 border border-slate-700/60">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              100% Client-Side Privacy
            </span>
            {(!imageFile || !audioFile) && (
              <button
                id="btn-quick-sample-demo"
                type="button"
                onClick={handleLoadBothSamples}
                disabled={engineStatus === 'encoding'}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Quick Demo
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-container" className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Core Layout Card */}
        <div
          id="converter-primary-card"
          className="rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl backdrop-blur-sm p-5 sm:p-7"
        >
          {/* Section Introduction */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">
              Create MP4 from Still Image & Audio
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Combines your cover image with an MP3, WAV, or AIFF soundtrack into an MP4 video at 1 FPS for fast, client-side rendering with full audio quality.
            </p>
          </div>

          {/* Uploaders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <ImageUploader
              imageFile={imageFile}
              onImageSelected={handleImageSelected}
              onImageRemoved={handleImageRemoved}
              onLoadSample={handleLoadSampleImage}
              disabled={engineStatus === 'encoding'}
            />
            <AudioUploader
              audioFile={audioFile}
              onAudioSelected={handleAudioSelected}
              onAudioRemoved={handleAudioRemoved}
              onLoadSample={handleLoadSampleAudio}
              disabled={engineStatus === 'encoding'}
            />
          </div>

          {/* Action Button Section */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-5 rounded-xl bg-slate-950/60 border border-slate-800/80 mb-6">
            <div className="text-xs text-slate-400">
              {!imageFile && !audioFile ? (
                <span className="flex items-center gap-1.5 text-slate-400">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Please select or drop both an image and audio file (MP3, WAV, or AIFF) to begin.
                </span>
              ) : !imageFile ? (
                <span className="flex items-center gap-1.5 text-amber-300">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Missing cover image.
                </span>
              ) : !audioFile ? (
                <span className="flex items-center gap-1.5 text-amber-300">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Missing audio soundtrack.
                </span>
              ) : engineStatus === 'loading' ? (
                <span className="flex items-center gap-1.5 text-amber-300">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  {initProgress?.message || 'Loading FFmpeg WASM Core...'}
                </span>
              ) : (
                <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                  Ready to encode MP4 video at 1 FPS (H.264 & AAC)!
                </span>
              )}
            </div>

            <button
              id="btn-generate-video"
              type="button"
              onClick={handleGenerateVideo}
              disabled={isButtonDisabled}
              className={`w-full sm:w-auto px-7 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-lg ${
                isButtonDisabled
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                  : 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-sky-500/25 active:scale-98'
              }`}
            >
              {engineStatus === 'encoding' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-sky-200" />
                  <span>Encoding Video... {progress.percentage}%</span>
                </>
              ) : engineStatus === 'loading' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  <span>
                    Loading Engine{initProgress && initProgress.percentage > 0 ? ` (${initProgress.percentage}%)` : '...'}
                  </span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Generate MP4 Video</span>
                </>
              )}
            </button>
          </div>

          {/* Real-time Status and Logs text area */}
          <StatusConsole
            status={engineStatus}
            progress={progress}
            initProgress={initProgress}
            logs={logs}
            errorMessage={errorMessage}
            onRetryInit={initializeEngine}
          />

          {/* Rendered Output Section (shown when video is generated) */}
          {videoOutput && (
            <OutputSection output={videoOutput} onReset={handleResetOutput} />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer id="main-footer" className="border-t border-slate-800/80 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Client-side MP4 video rendering powered by single-threaded FFmpeg.wasm</span>
          <span className="font-mono text-slate-600 text-[11px]">H.264 • AAC 192k • YUV420p</span>
        </div>
      </footer>
    </div>
  );
}

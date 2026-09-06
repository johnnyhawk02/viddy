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
    <div className="min-h-screen bg-white text-black font-serif p-4 sm:p-8 max-w-3xl mx-auto flex flex-col justify-between">
      <div>
        {/* Web 1.0 Header */}
        <header id="main-header" className="mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-black mb-1">
            Image & Audio to MP4 Converter
          </h1>
          <p className="text-xs sm:text-sm text-[#333333] leading-relaxed">
            Create an MP4 video (H.264 / AAC) at 1 frame per second from a static cover image and an audio file. All conversion takes place locally inside your browser via WebAssembly.
          </p>
          <hr className="my-3 border-t-2 border-black" />
        </header>

        {/* Engine status note if loading */}
        {engineStatus === 'loading' && (
          <div className="mb-4 p-2 bg-[#fffde7] border border-[#d4cf7b] text-xs font-serif">
            <i>Status: Loading WASM FFmpeg video core into browser memory... please wait.</i>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-4 p-2 bg-[#ffebee] border border-[#c62828] text-xs font-serif text-[#b71c1c] flex items-center justify-between">
            <span>
              <b>Error:</b> {errorMessage}
            </span>
            <button
              type="button"
              onClick={initializeEngine}
              className="web1-btn ml-2 text-xs"
            >
              Retry
            </button>
          </div>
        )}

        {/* Uploaders Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
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
          <div className="my-4 p-3 border border-black bg-[#f4f4f4]">
            <div className="text-xs font-bold font-serif mb-1">
              Encoding video in progress: {progress.percentage}% completed...
            </div>
            <div className="w-full border border-black bg-white h-4 p-[1px]">
              <div
                className="h-full bg-[#000080]"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            <div className="text-[11px] text-[#555555] font-mono mt-1">
              Rendering H.264 video stream at 1 FPS with AAC audio.
            </div>
          </div>
        )}

        <hr className="my-4 border-t border-[#888888]" />

        {/* Action Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 my-3">
          <div className="text-xs sm:text-sm font-serif">
            {!imageFile || !audioFile ? (
              <span className="text-[#555555]">
                <b>Note:</b> Both a cover image and an audio file are required before converting.
              </span>
            ) : engineStatus === 'loading' ? (
              <span className="text-[#666666] italic">
                WASM core is still initializing...
              </span>
            ) : engineStatus === 'encoding' ? (
              <span className="text-[#000080] font-bold">
                Currently converting video. Please do not close this tab.
              </span>
            ) : (
              <span className="text-[#006600] font-bold">
                ✓ Ready. Click &quot;Convert to MP4&quot; to begin.
              </span>
            )}
          </div>

          <button
            id="btn-generate-video"
            type="button"
            onClick={handleGenerateVideo}
            disabled={isButtonDisabled}
            className="web1-btn font-bold text-sm px-5 py-2 shrink-0"
          >
            {engineStatus === 'encoding'
              ? `Converting (${progress.percentage}%)...`
              : 'Convert to MP4'}
          </button>
        </div>

        {/* Rendered Output Section */}
        {videoOutput && (
          <OutputSection output={videoOutput} onReset={handleResetOutput} />
        )}
      </div>

      {/* Web 1.0 Footer */}
      <footer className="mt-12 pt-3 border-t border-black text-xs text-[#555555] text-center font-serif">
        <p>Image & Audio to MP4 Converter • Standard HTML / WebAssembly</p>
      </footer>
    </div>
  );
}

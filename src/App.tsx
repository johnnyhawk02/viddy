import React, { useState, useEffect, useCallback } from 'react';
import { FFmpegStatus, MediaFile, RenderProgress, InitProgress, LogEntry, VideoOutput } from './types';
import { initFFmpeg, convertImageAndAudioToVideo } from './utils/ffmpeg';
import { getRandomColor, generateCoverImage } from './utils/generateCover';
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
  const [autoColor, setAutoColor] = useState<string>(() => getRandomColor());
  const [autoCoverUrl, setAutoCoverUrl] = useState<string | null>(null);
  const [videoOutput, setVideoOutput] = useState<VideoOutput | null>(null);

  // Generate and update auto cover whenever audio is selected without a custom image
  useEffect(() => {
    let active = true;
    if (audioFile && !imageFile) {
      generateCoverImage(audioFile.name, autoColor).then((file) => {
        if (!active) return;
        const url = URL.createObjectURL(file);
        setAutoCoverUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      });
    } else {
      setAutoCoverUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    }

    return () => {
      active = false;
    };
  }, [audioFile, autoColor, imageFile]);

  const handleShuffleColor = () => {
    setAutoColor(getRandomColor());
  };

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
    if (!audioFile || engineStatus !== 'ready') return;

    setEngineStatus('encoding');
    setErrorMessage(null);
    setProgress({ ratio: 0, percentage: 0 });

    try {
      const finalImageFile = imageFile
        ? imageFile.file
        : await generateCoverImage(audioFile.name, autoColor);

      const result = await convertImageAndAudioToVideo(
        finalImageFile,
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
    !audioFile;

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col justify-center p-6 max-w-xl mx-auto selection:bg-zinc-900 selection:text-white">
      <header id="main-header" className="flex items-baseline justify-between mb-6">
        <h1 className="text-sm font-mono text-zinc-900 font-medium tracking-tight">
          image + audio → mp4
        </h1>
        {engineStatus === 'loading' && (
          <span className="text-[11px] font-mono text-zinc-400">loading engine...</span>
        )}
      </header>

      {errorMessage && (
        <div className="mb-4 text-xs font-mono text-red-600 flex items-center justify-between">
          <span className="truncate">{errorMessage}</span>
          <button
            type="button"
            onClick={initializeEngine}
            className="underline ml-2 cursor-pointer"
          >
            retry
          </button>
        </div>
      )}

      {/* Inputs */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <ImageUploader
          imageFile={imageFile}
          autoCoverUrl={autoCoverUrl}
          onShuffleColor={handleShuffleColor}
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

      {/* Progress during encoding */}
      {engineStatus === 'encoding' && (
        <div className="mb-4">
          <div className="w-full h-1 bg-zinc-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-zinc-900 transition-all duration-150"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <div className="text-right font-mono text-[10px] text-zinc-400 mt-1">
            {progress.percentage}%
          </div>
        </div>
      )}

      {/* Action */}
      {!videoOutput && (
        <button
          id="btn-generate-video"
          type="button"
          onClick={handleGenerateVideo}
          disabled={isButtonDisabled}
          className={`w-full py-2.5 rounded font-mono text-xs font-medium transition-colors cursor-pointer ${
            isButtonDisabled
              ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
              : 'bg-zinc-900 hover:bg-zinc-800 text-white'
          }`}
        >
          {engineStatus === 'encoding'
            ? `converting (${progress.percentage}%)`
            : 'convert to mp4'}
        </button>
      )}

      {/* Result */}
      {videoOutput && (
        <OutputSection output={videoOutput} onReset={handleResetOutput} />
      )}
    </div>
  );
}

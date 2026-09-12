import React, { useState, useEffect, useCallback } from 'react';
import { FFmpegStatus, MediaFile, RenderProgress, InitProgress, LogEntry, VideoOutput } from './types';
import { initFFmpeg, convertImageAndAudioToVideo } from './utils/ffmpeg';
import { convertAnimatedCanvasAndAudioToVideo } from './utils/animatedVideo';
import { getRandomBlendConfig, generateCoverImage, BlendConfig } from './utils/generateCover';
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
  const [blendConfig, setBlendConfig] = useState<BlendConfig>(() => getRandomBlendConfig());
  const [autoCoverUrl, setAutoCoverUrl] = useState<string | null>(null);
  const [videoOutput, setVideoOutput] = useState<VideoOutput | null>(null);
  const [isAnimatedCover, setIsAnimatedCover] = useState<boolean>(true);
  const [tempo, setTempo] = useState<number>(120);

  // Generate and update auto cover whenever a custom image is NOT uploaded
  useEffect(() => {
    let active = true;
    if (!imageFile) {
      const trackTitle = audioFile ? audioFile.name : 'Sample Track';
      generateCoverImage(trackTitle, blendConfig).then((file) => {
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
  }, [audioFile, blendConfig, imageFile]);

  const handleShuffleColor = () => {
    setBlendConfig(getRandomBlendConfig());
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

  const handleAudioDurationDetected = (duration: number) => {
    if (duration && !isNaN(duration) && isFinite(duration) && duration > 0) {
      setAudioFile((prev) => (prev ? { ...prev, duration } : null));
    }
  };

  const handleAudioSelected = (file: File) => {
    if (audioFile?.previewUrl) {
      URL.revokeObjectURL(audioFile.previewUrl);
    }
    const previewUrl = URL.createObjectURL(file);
    const audio = new Audio();
    audio.preload = 'auto';

    const setInfo = (dur?: number) => {
      setAudioFile((prev) => {
        const finalDur = (dur && !isNaN(dur) && isFinite(dur) && dur > 0) ? dur : prev?.duration;
        return {
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          previewUrl,
          duration: finalDur,
        };
      });
    };

    audio.onloadedmetadata = () => {
      const dur = audio.duration;
      if (dur === Infinity) {
        audio.currentTime = 1e101;
        audio.ontimeupdate = () => {
          audio.ontimeupdate = null;
          audio.currentTime = 0;
          setInfo(audio.duration);
        };
      } else {
        setInfo(dur);
      }
    };
    audio.ondurationchange = () => {
      setInfo(audio.duration);
    };
    audio.onerror = () => {
      setInfo();
    };
    audio.src = previewUrl;
    audio.load();

    // Fallback: AudioContext decodeAudioData
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const actx = new AudioCtx();
        file.arrayBuffer().then((buf) => {
          actx.decodeAudioData(buf).then((decoded) => {
            if (decoded && decoded.duration > 0) {
              setInfo(decoded.duration);
            }
            actx.close().catch(() => {});
          }).catch(() => actx.close().catch(() => {}));
        }).catch(() => {});
      }
    } catch {}
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
      let result: VideoOutput;

      if (!imageFile && isAnimatedCover) {
        // Animated Op Art morphing video @ 1 frame every beat (tempo BPM) for full audio duration
        result = await convertAnimatedCanvasAndAudioToVideo(
          audioFile.file,
          blendConfig,
          handleLog,
          (p) => setProgress(p),
          audioFile.duration,
          tempo
        );
      } else {
        // Still cover video @ 1 frame every beat
        const finalImageFile = imageFile
          ? imageFile.file
          : await generateCoverImage(audioFile.name, blendConfig);

        result = await convertImageAndAudioToVideo(
          finalImageFile,
          audioFile.file,
          handleLog,
          (p) => setProgress(p),
          tempo / 60
        );
      }

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
          blendConfig={blendConfig}
          trackName={audioFile?.name}
          isAnimatedCover={isAnimatedCover}
          tempo={tempo}
          onToggleAnimatedCover={() => setIsAnimatedCover((prev) => !prev)}
          onShuffleColor={handleShuffleColor}
          onImageSelected={handleImageSelected}
          onImageRemoved={handleImageRemoved}
          disabled={engineStatus === 'encoding'}
        />
        <AudioUploader
          audioFile={audioFile}
          onAudioSelected={handleAudioSelected}
          onAudioRemoved={handleAudioRemoved}
          onDurationDetected={handleAudioDurationDetected}
          disabled={engineStatus === 'encoding'}
        />
      </div>

      {/* Tempo Slider (70 - 200 BPM) */}
      <div id="tempo-control-card" className="mb-4 p-3 border border-zinc-200 rounded-lg bg-white">
        <div className="flex items-center justify-between font-mono text-xs mb-2">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 font-medium">tempo</span>
            <span className="bg-zinc-900 text-white px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide">
              {tempo} BPM
            </span>
          </div>
          <div className="text-zinc-500 text-[11px]">
            1 frame/beat · {(tempo / 60).toFixed(2)} fps · sub-pixel
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-zinc-400 select-none">70</span>
          <input
            id="tempo-slider"
            type="range"
            min={70}
            max={200}
            step={1}
            value={tempo}
            onChange={(e) => setTempo(Number(e.target.value))}
            disabled={engineStatus === 'encoding'}
            className="flex-1 accent-zinc-900 h-1.5 bg-zinc-100 rounded-lg cursor-pointer transition-all"
          />
          <span className="font-mono text-[10px] text-zinc-400 select-none">200</span>
        </div>

        {/* Quick presets for swift tempo selection */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-100 font-mono text-[10px]">
          <span className="text-zinc-400">presets</span>
          <div className="flex items-center gap-1.5">
            {[80, 100, 120, 140, 174].map((presetBpm) => (
              <button
                key={presetBpm}
                type="button"
                onClick={() => setTempo(presetBpm)}
                disabled={engineStatus === 'encoding'}
                className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                  tempo === presetBpm
                    ? 'bg-zinc-900 text-white font-medium'
                    : 'text-zinc-500 hover:bg-zinc-100'
                }`}
              >
                {presetBpm}
              </button>
            ))}
          </div>
        </div>
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

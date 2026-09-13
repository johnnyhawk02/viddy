import React, { useState, useCallback } from 'react';
import { CoverConfig, MediaFile } from './types';
import {
  getRandomCoverConfig,
  generateCoverPng,
  CURATED_PAIRS,
  hexToRgb,
} from './utils/generateCover';
import { BezierCanvas } from './components/BezierCanvas';
import { BezierControls } from './components/BezierControls';
import { AudioUploader } from './components/AudioUploader';
import { VideoSection } from './components/VideoSection';
import { Ratio, Dices, Film } from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState<CoverConfig>(() =>
    getRandomCoverConfig('Overmono - Diamond Cut')
  );
  const [audioFile, setAudioFile] = useState<MediaFile | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '1:1'>('16:9');
  const [copied, setCopied] = useState(false);

  const handleRandomize = useCallback(() => {
    setConfig((prev) => getRandomCoverConfig(prev.title));
  }, []);

  const handleShufflePalette = useCallback(() => {
    const pair = CURATED_PAIRS[Math.floor(Math.random() * CURATED_PAIRS.length)];
    const c1 = hexToRgb(pair[0]);
    const c2 = hexToRgb(pair[1]);

    setConfig((prev) => ({
      ...prev,
      points: [
        { ...prev.points[0], color: c1 },
        { ...prev.points[1], color: c2 },
      ],
      dots1: { ...prev.dots1, color: c1 },
      dots2: { ...prev.dots2, color: c2 },
    }));
  }, []);

  const handleDownloadPng = async (ratio: '16:9' | '1:1') => {
    try {
      const width = 1920;
      const height = ratio === '1:1' ? 1920 : 1080;
      const blob = await generateCoverPng(config, width, height);

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanTitle = (config.title || 'bezier-cover').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      a.download = `${cleanTitle}-${ratio === '1:1' ? 'square' : '16x9'}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export image:', err);
    }
  };

  const handleCopyImage = async () => {
    try {
      const blob = await generateCoverPng(config, 1920, aspectRatio === '1:1' ? 1920 : 1080);
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col p-4 sm:p-6 lg:p-8 selection:bg-zinc-800 selection:text-white">
      {/* Top Header */}
      <header id="main-header" className="max-w-7xl w-full mx-auto flex items-center justify-between pb-5 mb-6 border-b border-zinc-800/80">
        <div className="flex items-baseline gap-3">
          <h1 className="text-base sm:text-lg font-mono text-zinc-100 font-semibold tracking-tight">
            Bézier Cover & Video Generator
          </h1>
          <span className="hidden sm:inline-block font-mono text-xs text-zinc-500">
            Algorithmic Bernstein dot geometry · Static frame · MP4 audio mux
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAspectRatio((prev) => (prev === '16:9' ? '1:1' : '16:9'))}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-mono text-zinc-300 flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Toggle Aspect Ratio"
          >
            <Ratio className="w-3.5 h-3.5 text-zinc-400" />
            <span>{aspectRatio}</span>
          </button>

          <button
            id="btn-header-shuffle"
            type="button"
            onClick={handleRandomize}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-mono text-zinc-300 flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Randomize Bézier curves & colors"
          >
            <Dices className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Randomize</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1">
        {/* Left Column: Artwork Canvas & Video Production Workflow */}
        <section id="artwork-display-section" className="lg:col-span-7 xl:col-span-7 flex flex-col gap-4">
          {/* Real-time Bézier Canvas */}
          <div className={`w-full ${aspectRatio === '1:1' ? 'aspect-square max-w-xl mx-auto' : 'aspect-video'}`}>
            <BezierCanvas config={config} aspectRatio={aspectRatio} className="w-full h-full" />
          </div>

          <div className="flex items-center justify-between px-1 font-mono text-[11px] text-zinc-500">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-zinc-400">
                Formula: <span className="text-zinc-200">{config.dots1.formula}</span>
              </span>
              <span>·</span>
              <span className="text-zinc-400">
                Size: <span className="text-zinc-200">{config.dots1.sizeFormula}</span>
              </span>
            </div>
            <span>1920×{aspectRatio === '1:1' ? 1920 : 1080} Native Render</span>
          </div>

          {/* Audio Upload & MP4 Video Compilation Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <AudioUploader
              audioFile={audioFile}
              onAudioSelect={setAudioFile}
            />

            <VideoSection
              config={config}
              audioFile={audioFile}
              aspectRatio={aspectRatio}
            />
          </div>
        </section>

        {/* Right Column: Faders & Parametric Sculpting Controls */}
        <section id="controls-section" className="lg:col-span-5 xl:col-span-5">
          <BezierControls
            config={config}
            onChange={setConfig}
            onRandomize={handleRandomize}
            onShufflePalette={handleShufflePalette}
            aspectRatio={aspectRatio}
            onToggleAspectRatio={() => setAspectRatio((prev) => (prev === '16:9' ? '1:1' : '16:9'))}
            onDownloadPng={handleDownloadPng}
            onCopyImage={handleCopyImage}
            copied={copied}
          />
        </section>
      </main>

      {/* Footer */}
      <footer id="main-footer" className="max-w-7xl w-full mx-auto mt-10 pt-5 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-2 text-zinc-600 font-mono text-xs">
        <div className="flex items-center gap-2">
          <Film className="w-3.5 h-3.5" />
          <span>Still Cover Frame + Audio MP4 Muxer</span>
        </div>
        <span>Bézier Bernstein Tensor Engine B_{'{i}'}(t)</span>
      </footer>
    </div>
  );
}

import React, { useState } from 'react';
import { ImageMediaFile, AudioMediaFile } from './types';
import { ImageUploader } from './components/ImageUploader';
import { AudioUploader } from './components/AudioUploader';
import { VideoSection } from './components/VideoSection';
import { Film, Zap } from 'lucide-react';

export default function App() {
  const [imageFile, setImageFile] = useState<ImageMediaFile | null>(null);
  const [audioFile, setAudioFile] = useState<AudioMediaFile | null>(null);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col p-4 sm:p-6 lg:p-10 selection:bg-zinc-800 selection:text-white">
      {/* Header */}
      <header
        id="main-header"
        className="max-w-5xl w-full mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 mb-8 border-b border-zinc-800/80"
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white text-zinc-950 flex items-center justify-center font-bold shadow-md">
              <Film className="w-4 h-4" />
            </div>
            <h1 className="text-lg sm:text-xl font-mono text-zinc-100 font-bold tracking-tight">
              Image + Audio to 1fps .mp4
            </h1>
          </div>
          <p className="font-mono text-xs text-zinc-400">
            Upload an image and an audio track, then export a lightweight 1fps MP4 video.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-zinc-500 bg-zinc-900/60 border border-zinc-800 px-3 py-1.5 rounded-xl self-start sm:self-auto">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Browser WebAssembly · No upload limits</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1">
        {/* Left Column: Image & Audio Uploaders */}
        <section className="lg:col-span-6 flex flex-col gap-5">
          <ImageUploader
            imageFile={imageFile}
            onImageSelect={setImageFile}
          />

          <AudioUploader
            audioFile={audioFile}
            onAudioSelect={setAudioFile}
          />
        </section>

        {/* Right Column: 1fps MP4 Generation & Player */}
        <section className="lg:col-span-6">
          <div className="sticky top-6">
            <VideoSection
              imageFile={imageFile}
              audioFile={audioFile}
            />
          </div>
        </section>
      </main>

      {/* Minimal Footer */}
      <footer className="max-w-5xl w-full mx-auto mt-12 pt-6 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-zinc-600 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
          <span>1 FPS H.264 Video + AAC Audio Stream</span>
        </div>
        <span>Runs 100% client-side in browser</span>
      </footer>
    </div>
  );
}

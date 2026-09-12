import { LogEntry, RenderProgress, VideoOutput } from '../types';
import { initFFmpeg } from './ffmpeg';
import { BlendConfig, renderCoverFrame, HARMONIC_CYCLE_BEATS } from './generateCover';

/**
 * Encodes an animated video by generating 1 frame every beat synchronized to the tempo (BPM).
 * 
 * Uses FFmpeg `-framerate ${tempo}/60` and `-stream_loop -1` with `-shortest`
 * to guarantee that every frame corresponds to exactly 1 beat of the song,
 * and loops continuously for the full duration of the audio track.
 */
export async function convertAnimatedCanvasAndAudioToVideo(
  audioFile: File,
  blendConfig: BlendConfig,
  onLog: (log: LogEntry) => void,
  onProgress: (progress: RenderProgress) => void,
  knownDuration?: number,
  tempo: number = 120
): Promise<VideoOutput> {
  const ffmpeg = await initFFmpeg(onLog, onProgress);
  const clampedBpm = Math.max(70, Math.min(200, Math.round(tempo || 120)));
  const fpsNumeric = clampedBpm / 60;
  const fpsStr = `${clampedBpm}/60`;

  onLog({
    id: Math.random().toString(36).substring(2, 9),
    type: 'info',
    message: `Initializing beat-synchronized video engine (Tempo: ${clampedBpm} BPM, 1 frame/beat, ${fpsNumeric.toFixed(2)} fps)...`,
    timestamp: new Date().toLocaleTimeString([], { hour12: false }),
  });

  // Prepare audio file on FFmpeg virtual filesystem first
  const audExt = (audioFile.name.split('.').pop() || 'mp3').toLowerCase();
  const safeAudExt = ['mp3', 'wav', 'aac', 'ogg', 'm4a', 'flac'].includes(audExt) ? audExt : 'mp3';
  const audioBytes = new Uint8Array(await audioFile.arrayBuffer());
  const audioInFile = `audio_input.${safeAudExt}`;
  await ffmpeg.writeFile(audioInFile, audioBytes);

  // Probe exact audio duration using FFmpeg demuxer
  let audioDuration = 0;
  try {
    let probedDuration = 0;
    const probeListener = ({ message }: { message: string }) => {
      const match = message.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/i);
      if (match) {
        const h = parseFloat(match[1]);
        const m = parseFloat(match[2]);
        const s = parseFloat(match[3]);
        const dur = h * 3600 + m * 60 + s;
        if (dur > 0 && !isNaN(dur) && isFinite(dur)) {
          probedDuration = dur;
        }
      }
    };
    ffmpeg.on('log', probeListener);
    try {
      await ffmpeg.exec(['-i', audioInFile]);
    } catch {}
    ffmpeg.off('log', probeListener);
    if (probedDuration > 0) {
      audioDuration = probedDuration;
    }
  } catch {}

  // Fallback to knownDuration or browser metadata if FFmpeg probe was inconclusive
  if (!audioDuration || audioDuration <= 0) {
    if (knownDuration && knownDuration > 0 && isFinite(knownDuration)) {
      audioDuration = knownDuration;
    } else {
      audioDuration = await getAudioDuration(audioFile);
    }
  }

  onLog({
    id: Math.random().toString(36).substring(2, 9),
    type: 'info',
    message: `Detected audio duration: ${audioDuration.toFixed(2)}s. Generating beat-synchronized frames...`,
    timestamp: new Date().toLocaleTimeString([], { hour12: false }),
  });

  // Render beat frames directly onto offscreen canvas (1280x720 16:9 standard)
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Could not get canvas context for animation');

  return renderBeatFramesToFFmpeg(
    canvas,
    ctx,
    audioFile,
    audioInFile,
    blendConfig,
    audioDuration,
    clampedBpm,
    ffmpeg,
    onLog,
    onProgress
  );
}

async function renderBeatFramesToFFmpeg(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  audioFile: File,
  audioInFile: string,
  blendConfig: BlendConfig,
  audioDuration: number,
  bpm: number,
  ffmpeg: any,
  onLog: (log: LogEntry) => void,
  onProgress: (progress: RenderProgress) => void
): Promise<VideoOutput> {
  const fpsStr = `${bpm}/60`;
  const fpsNumeric = bpm / 60;
  const totalAudioBeats = Math.max(2, Math.ceil(audioDuration * fpsNumeric));
  
  // For audio tracks up to 384 beats (~3.2 minutes at 120 BPM),
  // render all beat frames directly for 100% linear playback with zero looping or PTS jumps.
  // For longer tracks, render an exact 64-beat harmonic cycle (HARMONIC_CYCLE_BEATS).
  const isDirectLinear = totalAudioBeats <= 384;
  const framesToRender = isDirectLinear ? totalAudioBeats : HARMONIC_CYCLE_BEATS;

  onLog({
    id: Math.random().toString(36).substring(2, 9),
    type: 'info',
    message: isDirectLinear
      ? `Rendering all ${framesToRender} beat frames (${audioDuration.toFixed(1)}s audio @ ${bpm} BPM, 1 frame/beat)...`
      : `Rendering ${framesToRender} beat frames for seamless 64-beat harmonic cycle (${bpm} BPM)...`,
    timestamp: new Date().toLocaleTimeString([], { hour12: false }),
  });

  for (let b = 0; b < framesToRender; b++) {
    // Optical animation advances on each beat with sub-pixel harmonic precision
    renderCoverFrame(ctx, canvas.width, canvas.height, audioFile.name, blendConfig, b);

    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.90));
    if (blob) {
      const bytes = new Uint8Array(await blob.arrayBuffer());
      const frameName = `frame_${String(b).padStart(4, '0')}.jpg`;
      await ffmpeg.writeFile(frameName, bytes);
    }

    const pct = Math.round((b / framesToRender) * 60);
    onProgress({ ratio: (b / framesToRender) * 0.6, percentage: pct });
  }

  onProgress({ ratio: 0.65, percentage: 65 });

  // Clean up any stale output.mp4 or loop.mp4
  try { await ffmpeg.deleteFile('loop.mp4'); } catch {}
  try { await ffmpeg.deleteFile('output.mp4'); } catch {}

  if (isDirectLinear) {
    onLog({
      id: Math.random().toString(36).substring(2, 9),
      type: 'info',
      message: `Compiling full continuous video directly with audio (${fpsNumeric.toFixed(2)} fps, zero stream loop)...`,
      timestamp: new Date().toLocaleTimeString([], { hour12: false }),
    });

    // Single-pass direct linear encode: 1 frame per beat matched precisely to audio
    await ffmpeg.exec([
      '-framerate', fpsStr,
      '-i', 'frame_%04d.jpg',
      '-i', audioInFile,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-shortest',
      'output.mp4'
    ]);
  } else {
    onLog({
      id: Math.random().toString(36).substring(2, 9),
      type: 'info',
      message: `Compiling seamless 64-beat loop at ${fpsNumeric.toFixed(2)} fps...`,
      timestamp: new Date().toLocaleTimeString([], { hour12: false }),
    });

    // 1. Compile 64-beat cycle into loop.mp4
    await ffmpeg.exec([
      '-framerate', fpsStr,
      '-i', 'frame_%04d.jpg',
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-g', String(HARMONIC_CYCLE_BEATS),
      '-keyint_min', String(HARMONIC_CYCLE_BEATS),
      '-pix_fmt', 'yuv420p',
      '-r', fpsStr,
      'loop.mp4'
    ]);

    onLog({
      id: Math.random().toString(36).substring(2, 9),
      type: 'info',
      message: `Muxing seamless loop with audio across full duration (${audioDuration.toFixed(1)}s)...`,
      timestamp: new Date().toLocaleTimeString([], { hour12: false }),
    });

    // 2. Mux with audio using re-encode to preserve strict monotonic presentation timestamps
    await ffmpeg.exec([
      '-stream_loop', '-1',
      '-i', 'loop.mp4',
      '-i', audioInFile,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-shortest',
      '-pix_fmt', 'yuv420p',
      'output.mp4'
    ]);
  }

  // Clean up individual frame JPEGs to free virtual FS memory
  for (let b = 0; b < framesToRender; b++) {
    try {
      await ffmpeg.deleteFile(`frame_${String(b).padStart(4, '0')}.jpg`);
    } catch {}
  }

  const outputData = await ffmpeg.readFile('output.mp4');
  const finalBlob = new Blob([outputData], { type: 'video/mp4' });
  const finalUrl = URL.createObjectURL(finalBlob);

  // Clean up intermediate files
  try { await ffmpeg.deleteFile('loop.mp4'); } catch {}
  try { await ffmpeg.deleteFile(audioInFile); } catch {}
  try { await ffmpeg.deleteFile('output.mp4'); } catch {}

  onProgress({ ratio: 1, percentage: 100 });

  onLog({
    id: Math.random().toString(36).substring(2, 9),
    type: 'success',
    message: `Complete! Video rendered at 1 frame/beat (${bpm} BPM = ${fpsNumeric.toFixed(2)} fps) for ${audioDuration.toFixed(1)}s.`,
    timestamp: new Date().toLocaleTimeString([], { hour12: false }),
  });

  return {
    blob: finalBlob,
    url: finalUrl,
    size: finalBlob.size,
    duration: audioDuration,
    filename: `${audioFile.name.replace(/\.[^/.]+$/, '')}.mp4`,
  };
}

async function getAudioDuration(file: File): Promise<number> {
  // Method A: HTMLAudioElement with preload=auto
  try {
    const fromAudioElement = await new Promise<number>((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const audio = new Audio();
      audio.preload = 'auto';
      const timer = setTimeout(() => {
        URL.revokeObjectURL(url);
        reject(new Error('timeout'));
      }, 3500);

      audio.onloadedmetadata = () => {
        clearTimeout(timer);
        URL.revokeObjectURL(url);
        if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0) {
          resolve(audio.duration);
        } else {
          reject(new Error('invalid duration'));
        }
      };

      audio.onerror = () => {
        clearTimeout(timer);
        URL.revokeObjectURL(url);
        reject(new Error('audio error'));
      };

      audio.src = url;
      audio.load();
    });

    if (fromAudioElement > 0) return fromAudioElement;
  } catch {}

  // Method B: AudioContext decodeAudioData
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      const buffer = await file.arrayBuffer();
      const decoded = await ctx.decodeAudioData(buffer);
      ctx.close();
      if (decoded.duration && decoded.duration > 0) {
        return decoded.duration;
      }
    }
  } catch {}

  // Fallback default
  return 60;
}


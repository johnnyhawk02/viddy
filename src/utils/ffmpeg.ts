import { VideoOutput, RenderProgress } from '../types';

declare global {
  interface Window {
    FFmpegWASM?: {
      FFmpeg: any;
    };
    FFmpegUtil?: {
      fetchFile: (input: any) => Promise<Uint8Array>;
      toBlobURL: (url: string, mimeType: string) => Promise<string>;
    };
  }
}

let ffmpegInstance: any = null;
let isLoaded = false;
let loadPromise: Promise<any> | null = null;

export async function toBlobURL(url: string, mimeType: string): Promise<string> {
  if (window.FFmpegUtil?.toBlobURL) {
    try {
      return await window.FFmpegUtil.toBlobURL(url, mimeType);
    } catch {
      // fallback to manual fetch
    }
  }
  const res = await fetch(url);
  const blob = await res.blob();
  return URL.createObjectURL(new Blob([blob], { type: mimeType }));
}

export async function fetchFile(input: File | Blob | string): Promise<Uint8Array> {
  if (window.FFmpegUtil?.fetchFile) {
    try {
      return await window.FFmpegUtil.fetchFile(input);
    } catch {
      // fallback
    }
  }
  if (input instanceof File || input instanceof Blob) {
    const buffer = await input.arrayBuffer();
    return new Uint8Array(buffer);
  }
  const res = await fetch(input);
  const buffer = await res.arrayBuffer();
  return new Uint8Array(buffer);
}

export async function initFFmpeg(
  onLog?: (msg: string) => void
): Promise<any> {
  if (isLoaded && ffmpegInstance) {
    return ffmpegInstance;
  }
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = (async () => {
    // Wait for window.FFmpegWASM if still loading
    let retries = 0;
    while (!window.FFmpegWASM && retries < 30) {
      await new Promise((r) => setTimeout(r, 100));
      retries++;
    }

    if (!window.FFmpegWASM?.FFmpeg) {
      throw new Error(
        'FFmpeg library could not be loaded from CDN. Please check your network connection.'
      );
    }

    const { FFmpeg } = window.FFmpegWASM;
    const ffmpeg = new FFmpeg();

    if (onLog) {
      ffmpeg.on('log', ({ message }: { message: string }) => {
        onLog(message);
      });
    }

    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
    const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');

    await ffmpeg.load({
      coreURL,
      wasmURL,
    });

    ffmpegInstance = ffmpeg;
    isLoaded = true;
    return ffmpeg;
  })();

  return loadPromise;
}

/**
 * Creates an MP4 video combining the static Bézier cover art frame + uploaded audio
 */
export async function createStaticCoverVideo(
  imageBlob: Blob,
  audioFile: File,
  onProgress?: (progress: RenderProgress) => void,
  onLog?: (msg: string) => void
): Promise<VideoOutput> {
  const ffmpeg = await initFFmpeg(onLog);

  const progressHandler = ({ progress }: { progress: number }) => {
    const p = Math.max(0, Math.min(1, progress || 0));
    onProgress?.({
      ratio: p,
      percentage: Math.round(p * 100),
    });
  };

  ffmpeg.on('progress', progressHandler);

  try {
    // 1. Write the static Bézier cover image
    const imgData = await fetchFile(imageBlob);
    await ffmpeg.writeFile('cover.png', imgData);

    // 2. Write the user's audio file
    const audioExt = audioFile.name.split('.').pop()?.toLowerCase() || 'mp3';
    const audioFilename = `input_audio.${audioExt}`;
    const audioData = await fetchFile(audioFile);
    await ffmpeg.writeFile(audioFilename, audioData);

    // 3. Encode static image + audio to MP4 using libx264 with stillimage tune
    onLog?.('Encoding static Bézier cover frame and muxing audio...');
    await ffmpeg.exec([
      '-loop',
      '1',
      '-framerate',
      '2',
      '-i',
      'cover.png',
      '-i',
      audioFilename,
      '-c:v',
      'libx264',
      '-tune',
      'stillimage',
      '-c:a',
      'aac',
      '-b:a',
      '192k',
      '-pix_fmt',
      'yuv420p',
      '-shortest',
      'output.mp4',
    ]);

    // 4. Read output MP4
    const data = await ffmpeg.readFile('output.mp4');
    const videoBlob = new Blob([data.buffer], { type: 'video/mp4' });
    const videoUrl = URL.createObjectURL(videoBlob);

    // 5. Clean up virtual FS
    try {
      await ffmpeg.deleteFile('cover.png');
      await ffmpeg.deleteFile(audioFilename);
      await ffmpeg.deleteFile('output.mp4');
    } catch {
      // ignore
    }

    const cleanBaseName = audioFile.name.replace(/\.[^/.]+$/, '').toLowerCase().replace(/[^a-z0-9_-]+/g, '_');
    return {
      blob: videoBlob,
      url: videoUrl,
      size: videoBlob.size,
      filename: `${cleanBaseName}_bezier_cover.mp4`,
    };
  } finally {
    ffmpeg.off('progress', progressHandler);
  }
}

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
      // fallback
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
 * Creates a 1fps MP4 video by combining the uploaded image and audio file
 */
export async function createOneFpsVideo(
  imageFile: File,
  audioFile: File,
  audioDuration?: number,
  onProgress?: (progress: RenderProgress) => void,
  onLog?: (msg: string) => void
): Promise<VideoOutput> {
  const ffmpeg = await initFFmpeg(onLog);

  let maxRatio = 0.05;
  onProgress?.({ ratio: maxRatio, percentage: Math.round(maxRatio * 100) });

  const progressHandler = ({ progress, time }: { progress: number; time?: number }) => {
    let p = 0;
    if (progress && progress > 0 && progress <= 1) {
      p = progress;
    } else if (time && audioDuration && audioDuration > 0) {
      // time is in microseconds in modern ffmpeg.wasm (or seconds)
      const sec = time > 100000 ? time / 1000000 : time;
      p = Math.min(1, sec / audioDuration);
    }

    if (p > maxRatio) {
      maxRatio = p;
      onProgress?.({
        ratio: maxRatio,
        percentage: Math.min(99, Math.round(maxRatio * 100)),
      });
    }
  };

  const logHandler = ({ message }: { message: string }) => {
    onLog?.(message);

    // Parse time=HH:MM:SS.XX from ffmpeg output for smooth progress
    if (audioDuration && audioDuration > 0) {
      const timeMatch = message.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d+)/);
      if (timeMatch) {
        const hours = parseFloat(timeMatch[1]);
        const mins = parseFloat(timeMatch[2]);
        const secs = parseFloat(timeMatch[3]);
        const totalSecs = hours * 3600 + mins * 60 + secs;
        const ratio = Math.min(0.99, totalSecs / audioDuration);
        if (ratio > maxRatio) {
          maxRatio = ratio;
          onProgress?.({
            ratio: maxRatio,
            percentage: Math.round(maxRatio * 100),
          });
        }
      }
    }
  };

  ffmpeg.on('progress', progressHandler);
  ffmpeg.on('log', logHandler);

  const imgExt = imageFile.name.split('.').pop()?.toLowerCase() || 'png';
  const audioExt = audioFile.name.split('.').pop()?.toLowerCase() || 'mp3';
  const imgFilename = `input_image.${imgExt}`;
  const audioFilename = `input_audio.${audioExt}`;
  const outFilename = 'output_1fps.mp4';

  try {
    // 1. Write the image
    onLog?.('Loading image into encoder...');
    const imgData = await fetchFile(imageFile);
    await ffmpeg.writeFile(imgFilename, imgData);

    // 2. Write the audio
    onLog?.('Loading audio into encoder...');
    const audioData = await fetchFile(audioFile);
    await ffmpeg.writeFile(audioFilename, audioData);

    // 3. Run ffmpeg command to create 1fps MP4
    // -framerate 1 sets input image framerate to 1 fps
    // -loop 1 loops the single image
    // -vf scale=trunc(iw/2)*2:trunc(ih/2)*2 ensures even dimensions for H.264
    // -r 1 forces output framerate to 1 fps
    // -tune stillimage optimizes x264 for static images
    // -c:a aac encodes audio to standard AAC
    // -pix_fmt yuv420p for maximum compatibility with all players
    // -shortest ends the video when the audio ends
    onLog?.('Encoding 1fps MP4 video...');
    await ffmpeg.exec([
      '-loop',
      '1',
      '-framerate',
      '1',
      '-i',
      imgFilename,
      '-i',
      audioFilename,
      '-vf',
      'scale=trunc(iw/2)*2:trunc(ih/2)*2',
      '-c:v',
      'libx264',
      '-r',
      '1',
      '-tune',
      'stillimage',
      '-c:a',
      'aac',
      '-b:a',
      '192k',
      '-pix_fmt',
      'yuv420p',
      '-shortest',
      outFilename,
    ]);

    // 4. Read output MP4
    const data = await ffmpeg.readFile(outFilename);
    const videoBlob = new Blob([data.buffer], { type: 'video/mp4' });
    const videoUrl = URL.createObjectURL(videoBlob);

    // 5. Clean up virtual filesystem
    try {
      await ffmpeg.deleteFile(imgFilename);
      await ffmpeg.deleteFile(audioFilename);
      await ffmpeg.deleteFile(outFilename);
    } catch {
      // ignore cleanup errors
    }

    onProgress?.({ ratio: 1, percentage: 100 });

    const cleanBaseName = audioFile.name
      .replace(/\.[^/.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '_');

    return {
      blob: videoBlob,
      url: videoUrl,
      size: videoBlob.size,
      filename: `${cleanBaseName || 'video'}_1fps.mp4`,
      duration: audioDuration,
    };
  } finally {
    ffmpeg.off('progress', progressHandler);
    ffmpeg.off('log', logHandler);
  }
}

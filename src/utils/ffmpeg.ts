import { InitProgress, LogEntry, RenderProgress, VideoOutput } from '../types';

declare global {
  interface Window {
    FFmpegWASM?: {
      FFmpeg: new () => any;
    };
    FFmpegUtil?: {
      fetchFile: (file: File | Blob | string) => Promise<Uint8Array>;
      toBlobURL: (url: string, mimeType: string) => Promise<string>;
    };
  }
}

let ffmpegInstance: any = null;
let isLoaded = false;
let initPromise: Promise<any> | null = null;

// Polyfill window.Worker so cross-origin scripts (like 814.ffmpeg.js from unpkg) load as same-origin Blobs
function installWorkerPolyfill() {
  if (typeof window === 'undefined' || !window.Worker) return;
  if ((window as any).__safeWorkerInstalled) return;

  const OriginalWorker = window.Worker;
  if (!(window as any).__workerBlobMap) {
    (window as any).__workerBlobMap = new Map<string, string>();
  }

  class SafeWorker extends OriginalWorker {
    constructor(scriptURL: string | URL, options?: WorkerOptions) {
      const urlStr = scriptURL instanceof URL ? scriptURL.href : String(scriptURL);
      const map: Map<string, string> | undefined = (window as any).__workerBlobMap;

      // 1. Direct match in preloaded blob map
      if (map && map.has(urlStr)) {
        super(map.get(urlStr)!, options);
        return;
      }

      // 2. Check if URL ends with 814.ffmpeg.js
      if (urlStr.includes('814.ffmpeg.js') && map) {
        for (const [key, val] of map.entries()) {
          if (key.includes('814.ffmpeg.js')) {
            super(val, options);
            return;
          }
        }
      }

      // 3. Any other cross-origin URL
      if (
        (urlStr.startsWith('http://') || urlStr.startsWith('https://')) &&
        !urlStr.startsWith(window.location.origin)
      ) {
        const blob = new Blob([
          '/* Cross-origin worker proxy */\n',
          'importScripts(' + JSON.stringify(urlStr) + ');'
        ], { type: 'text/javascript' });
        const blobUrl = URL.createObjectURL(blob);
        super(blobUrl, options);
        return;
      }

      super(scriptURL, options);
    }
  }

  window.Worker = SafeWorker;
  (window as any).__safeWorkerInstalled = true;
}

// IndexedDB Cache for WASM assets to allow instant 0-second reloads
const DB_NAME = 'ffmpeg_wasm_cache';
const STORE_NAME = 'blobs';

function openCacheDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getCachedBlob(key: string): Promise<Blob | null> {
  try {
    const db = await openCacheDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function setCachedBlob(key: string, blob: Blob): Promise<void> {
  try {
    const db = await openCacheDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(blob, key);
  } catch (err) {
    console.warn('Failed to cache blob in IndexedDB:', err);
  }
}

// Download with real-time percentage and byte tracking
async function fetchWithProgress(
  primaryUrl: string,
  fallbackUrl: string,
  mimeType: string,
  cacheKey: string,
  label: string,
  onProgress?: (progress: InitProgress) => void
): Promise<string> {
  // 1. Check local IndexedDB cache first
  const cached = await getCachedBlob(cacheKey);
  if (cached) {
    if (onProgress) {
      onProgress({ percentage: 100, message: `Loaded ${label} from instant browser cache` });
    }
    return URL.createObjectURL(cached);
  }

  // 2. Stream download from CDN with live progress updates
  const tryDownload = async (url: string): Promise<string> => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} when downloading ${label} from ${url}`);
    }

    const contentLength = response.headers.get('content-length');
    // Default estimated size for wasm is 30.6 MB (32,128,000 bytes) if Content-Length header is omitted by proxy
    const totalBytes = contentLength ? parseInt(contentLength, 10) : (mimeType.includes('wasm') ? 32128000 : 150000);

    if (!response.body) {
      const blob = await response.blob();
      await setCachedBlob(cacheKey, blob);
      return URL.createObjectURL(blob);
    }

    const reader = response.body.getReader();
    let receivedBytes = 0;
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        receivedBytes += value.length;
        if (onProgress) {
          const percent = Math.min(99, Math.round((receivedBytes / totalBytes) * 100));
          const mbReceived = (receivedBytes / (1024 * 1024)).toFixed(1);
          const mbTotal = (totalBytes / (1024 * 1024)).toFixed(1);
          onProgress({
            percentage: percent,
            message: `Downloading ${label}: ${mbReceived} / ${mbTotal} MB (${percent}%)`,
          });
        }
      }
    }

    const blob = new Blob(chunks, { type: mimeType });
    // Cache for future loads
    setCachedBlob(cacheKey, blob).catch(() => {});
    return URL.createObjectURL(blob);
  };

  try {
    return await tryDownload(primaryUrl);
  } catch (err) {
    console.warn(`Primary download failed for ${primaryUrl}, trying fallback ${fallbackUrl}`, err);
    return await tryDownload(fallbackUrl);
  }
}

// Ensure FFmpeg UMD script is available
async function ensureFFmpegScriptLoaded(onLog?: (log: LogEntry) => void): Promise<void> {
  if (window.FFmpegWASM?.FFmpeg) {
    return;
  }

  const loadScriptTag = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(script);
    });
  };

  try {
    onLog?.({
      id: Math.random().toString(36).substring(2, 9),
      type: 'info',
      message: 'Loading FFmpeg WASM wrapper script from CDN...',
      timestamp: new Date().toLocaleTimeString([], { hour12: false }),
    });
    await loadScriptTag('https://unpkg.com/@ffmpeg/ffmpeg@0.12.10/dist/umd/ffmpeg.js');
  } catch {
    // Fallback to jsdelivr
    await loadScriptTag('https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/dist/umd/ffmpeg.js');
  }

  // Also load util script if not present (non-blocking)
  if (!window.FFmpegUtil) {
    loadScriptTag('https://unpkg.com/@ffmpeg/util@0.12.1/dist/umd/index.js').catch(() => {});
  }
}

export async function initFFmpeg(
  onLog?: (log: LogEntry) => void,
  onProgress?: (progress: RenderProgress) => void,
  onInitProgress?: (progress: InitProgress) => void
): Promise<any> {
  if (ffmpegInstance && isLoaded) {
    return ffmpegInstance;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    installWorkerPolyfill();

    // Preload worker blob so new Worker() is guaranteed same-origin
    try {
      const localRes = await fetch('/814.ffmpeg.js').catch(() => null);
      if (localRes && localRes.ok) {
        const blob = await localRes.blob();
        const blobUrl = URL.createObjectURL(blob);
        const map = (window as any).__workerBlobMap;
        if (map) {
          map.set('https://unpkg.com/@ffmpeg/ffmpeg@0.12.10/dist/umd/814.ffmpeg.js', blobUrl);
          map.set('https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/dist/umd/814.ffmpeg.js', blobUrl);
          map.set('/814.ffmpeg.js', blobUrl);
        }
      }
    } catch (e) {
      console.warn('Worker prefetch warning:', e);
    }

    await ensureFFmpegScriptLoaded(onLog);

    if (!window.FFmpegWASM?.FFmpeg) {
      throw new Error('FFmpeg WASM wrapper could not be initialized from CDN.');
    }

    const FFmpegClass = window.FFmpegWASM.FFmpeg;
    ffmpegInstance = new FFmpegClass();

    // Attach log listener
    ffmpegInstance.on('log', ({ message }: { message: string }) => {
      if (onLog) {
        onLog({
          id: Math.random().toString(36).substring(2, 9),
          type: 'log',
          message,
          timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        });
      }
    });

    // Attach render progress listener
    ffmpegInstance.on('progress', ({ progress, time }: { progress: number; time?: number }) => {
      if (onProgress) {
        const percentage = Math.min(100, Math.max(0, Math.round(progress * 100)));
        onProgress({
          ratio: progress,
          percentage,
          time,
        });
      }
    });

    onInitProgress?.({ percentage: 5, message: 'Downloading core JavaScript loader...' });

    // Download core JS with progress
    const coreURL = await fetchWithProgress(
      'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
      'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
      'text/javascript',
      'core-js-0.12.6',
      'FFmpeg Core JS',
      onInitProgress
    );

    onInitProgress?.({ percentage: 15, message: 'Downloading single-threaded WebAssembly binary (~31 MB)...' });

    // Download wasm binary with live progress
    const wasmURL = await fetchWithProgress(
      'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm',
      'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm',
      'application/wasm',
      'core-wasm-0.12.6',
      'FFmpeg WASM Core',
      onInitProgress
    );

    onInitProgress?.({ percentage: 95, message: 'Initializing WebAssembly runtime...' });
    onLog?.({
      id: Math.random().toString(36).substring(2, 9),
      type: 'info',
      message: 'Loading WebAssembly binary into memory...',
      timestamp: new Date().toLocaleTimeString([], { hour12: false }),
    });

    await ffmpegInstance.load({
      coreURL,
      wasmURL,
    });

    isLoaded = true;
    onInitProgress?.({ percentage: 100, message: 'FFmpeg Core loaded successfully!' });

    return ffmpegInstance;
  })();

  return initPromise;
}

export async function convertImageAndAudioToVideo(
  imageFile: File,
  audioFile: File,
  onLog: (log: LogEntry) => void,
  onProgress: (progress: RenderProgress) => void,
  framerate: number = 1
): Promise<VideoOutput> {
  const ffmpeg = await initFFmpeg(onLog, onProgress);

  // Determine file extensions
  const imgExt = (imageFile.name.split('.').pop() || 'png').toLowerCase();
  const audExt = (audioFile.name.split('.').pop() || 'mp3').toLowerCase();

  const safeImgExt = ['jpg', 'jpeg', 'png', 'webp'].includes(imgExt) ? imgExt : 'png';
  const safeAudExt = ['mp3', 'wav', 'aac', 'ogg', 'm4a'].includes(audExt) ? audExt : 'mp3';

  const inputImg = `input.${safeImgExt}`;
  const inputAud = `input.${safeAudExt}`;
  const outputFileName = 'output.mp4';

  onLog({
    id: Math.random().toString(36).substring(2, 9),
    type: 'info',
    message: `Reading files: ${imageFile.name} (${(imageFile.size / 1024).toFixed(1)} KB) & ${audioFile.name} (${(audioFile.size / 1024).toFixed(1)} KB)...`,
    timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  });

  // Prepare file bytes natively (works 100% reliably in all browsers without external dependencies)
  const [imgData, audData] = await Promise.all([
    imageFile.arrayBuffer().then((b) => new Uint8Array(b)),
    audioFile.arrayBuffer().then((b) => new Uint8Array(b)),
  ]);

  // Clear previous files if any
  try { await ffmpeg.deleteFile(inputImg); } catch {}
  try { await ffmpeg.deleteFile(inputAud); } catch {}
  try { await ffmpeg.deleteFile(outputFileName); } catch {}

  onLog({
    id: Math.random().toString(36).substring(2, 9),
    type: 'info',
    message: `Writing inputs to virtual filesystem (${inputImg}, ${inputAud})...`,
    timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  });

  await ffmpeg.writeFile(inputImg, imgData);
  await ffmpeg.writeFile(inputAud, audData);

  const fpsVal = Math.max(1, Math.min(30, framerate || 1));
  const fpsStr = String(fpsVal);

  onLog({
    id: Math.random().toString(36).substring(2, 9),
    type: 'info',
    message: `Executing FFmpeg compilation: ${fpsStr} FPS (still image mode), H.264 ultrafast, AAC 192k audio...`,
    timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  });

  // Optimized still-image video compilation:
  // Using -framerate and -r reduces CPU work by ~95% in single-threaded WebAssembly
  // while preserving 100% full audio quality and visual sharpness.
  const ffmpegArgs = [
    '-loop', '1',
    '-framerate', fpsStr,
    '-i', inputImg,
    '-i', inputAud,
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-tune', 'stillimage',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-pix_fmt', 'yuv420p',
    '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
    '-shortest',
    '-r', fpsStr,
    outputFileName
  ];

  await ffmpeg.exec(ffmpegArgs);

  onLog({
    id: Math.random().toString(36).substring(2, 9),
    type: 'info',
    message: `Rendering complete! Extracting output video...`,
    timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  });

  const rawOutput = await ffmpeg.readFile(outputFileName);
  const videoBlob = new Blob([rawOutput], { type: 'video/mp4' });
  const videoUrl = URL.createObjectURL(videoBlob);

  // Clean up virtual filesystem
  try { await ffmpeg.deleteFile(inputImg); } catch {}
  try { await ffmpeg.deleteFile(inputAud); } catch {}
  try { await ffmpeg.deleteFile(outputFileName); } catch {}

  onLog({
    id: Math.random().toString(36).substring(2, 9),
    type: 'success',
    message: `Successfully rendered MP4 video (${(videoBlob.size / (1024 * 1024)).toFixed(2)} MB)!`,
    timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  });

  const baseImageName = imageFile.name.substring(0, imageFile.name.lastIndexOf('.')) || 'video';
  const downloadName = `${baseImageName}-video.mp4`;

  return {
    blob: videoBlob,
    url: videoUrl,
    size: videoBlob.size,
    filename: downloadName,
  };
}

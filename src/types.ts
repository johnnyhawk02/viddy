export type FFmpegStatus = 'unloaded' | 'loading' | 'ready' | 'encoding' | 'done' | 'error';

export interface MediaFile {
  file: File;
  name: string;
  size: number;
  type: string;
  previewUrl: string;
  dimensions?: { width: number; height: number };
  duration?: number;
}

export interface RenderProgress {
  ratio: number;
  percentage: number;
  time?: number;
}

export interface InitProgress {
  percentage: number;
  message: string;
}

export interface LogEntry {
  id: string;
  type: 'info' | 'log' | 'error' | 'success';
  message: string;
  timestamp: string;
}

export interface VideoOutput {
  blob: Blob;
  url: string;
  size: number;
  duration?: number;
  filename: string;
}

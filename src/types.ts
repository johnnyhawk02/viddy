export type FFmpegStatus = 'idle' | 'loading' | 'encoding' | 'done' | 'error';

export interface RenderProgress {
  ratio: number;
  percentage: number;
}

export interface ImageMediaFile {
  file: File;
  name: string;
  size: number;
  type: string;
  previewUrl: string;
  width: number;
  height: number;
}

export interface AudioMediaFile {
  file: File;
  name: string;
  size: number;
  type: string;
  previewUrl: string;
  duration?: number;
}

export interface VideoOutput {
  blob: Blob;
  url: string;
  size: number;
  filename: string;
  duration?: number;
}

import React, { useRef, useEffect } from 'react';
import { CoverConfig } from '../types';
import { renderCoverCanvas } from '../utils/generateCover';

interface BezierCanvasProps {
  config: CoverConfig;
  aspectRatio?: '16:9' | '1:1';
  className?: string;
}

export const BezierCanvas: React.FC<BezierCanvasProps> = ({
  config,
  aspectRatio = '16:9',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const width = 1920;
    const height = aspectRatio === '1:1' ? 1920 : 1080;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    renderCoverCanvas(ctx, width, height, config);
  }, [config, aspectRatio]);

  return (
    <div className={`relative w-full overflow-hidden rounded-xl bg-zinc-900 shadow-2xl border border-zinc-800 ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover block select-none"
        style={{ imageRendering: 'auto' }}
      />
    </div>
  );
};

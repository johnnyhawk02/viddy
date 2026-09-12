import React, { useRef, useEffect } from 'react';
import { BlendConfig, renderCoverFrame } from '../utils/generateCover';

interface AnimatedCoverCanvasProps {
  blendConfig: BlendConfig;
  trackName: string;
  isAnimated: boolean;
  tempo?: number;
  className?: string;
}

export const AnimatedCoverCanvas: React.FC<AnimatedCoverCanvasProps> = ({
  blendConfig,
  trackName,
  isAnimated,
  tempo = 120,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Internal canvas resolution matching standard 16:9 1920x1080 master canvas
    // so all gradient anchors, illusion centers, and dot coordinates match 1:1
    const width = 1920;
    const height = 1080;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    if (!isAnimated) {
      // Still mode: render exact static frame once at t=0
      renderCoverFrame(ctx, width, height, trackName, blendConfig, 0);
      return;
    }

    // 1 frame every beat: frame rate tied directly to tempo (BPM)
    let animationFrameId: number;
    const clampedBpm = Math.max(70, Math.min(200, tempo || 120));
    const beatIntervalMs = (60 / clampedBpm) * 1000; // e.g. 500ms at 120 BPM
    const startTime = performance.now();
    let lastBeatIndex = -1;

    // Draw initial beat frame immediately
    renderCoverFrame(ctx, width, height, trackName, blendConfig, 0);

    const loop = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(loop);

      const elapsed = currentTime - startTime;
      const currentBeat = Math.floor(elapsed / beatIntervalMs);

      if (currentBeat !== lastBeatIndex) {
        lastBeatIndex = currentBeat;
        // Step forward once per beat with almost sub-pixel changes
        renderCoverFrame(ctx, width, height, trackName, blendConfig, currentBeat);
      }
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [blendConfig, trackName, isAnimated, tempo]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full object-contain rounded ${className}`}
      style={{ imageRendering: 'auto' }}
    />
  );
};

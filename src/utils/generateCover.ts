import {
  RGBColor,
  Point2D,
  BlendPoint,
  CoverConfig,
  BezierDotLayerConfig,
  BezierFormulaType,
  BezierSizeMode,
} from '../types';
import {
  generateDotsFromBezier,
  generateBicubicControlNet,
  generateBicubicSizeNet,
  GeneratedBezierDot,
} from './bezierEngine';

export function rgbToString(c: RGBColor, alpha = 1): string {
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`;
}

export function hexToRgb(hex: string): RGBColor {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

export const CURATED_PAIRS: [string, string][] = [
  // High-contrast vibrant pairs
  ['#ff007f', '#00dfd8'], // Neon magenta & cyan
  ['#ff3366', '#ff9933'], // Hot pink & solar orange
  ['#7928ca', '#ff007f'], // Electric violet & magenta
  ['#4facfe', '#00f2fe'], // Neon cobalt & aqua
  ['#f72585', '#4cc9f0'], // Hot fuchsia & vivid sky
  ['#10b981', '#3b82f6'], // Emerald & electric blue
  ['#ff416c', '#8a2be2'], // Crimson rose & electric purple
  ['#fa709a', '#fee140'], // Punchy pink & golden flare
  ['#00c6ff', '#0072ff'], // Cyber cyan & rich blue
  ['#fc00ff', '#00dbde'], // Cyberpunk neon pink & turquoise
  ['#ea580c', '#e11d48'], // Molten orange & ruby
  ['#0575e6', '#00f260'], // Electric blue & neon lime
  ['#fd746c', '#ff9068'], // Bright coral & warm amber
  ['#8b5cf6', '#ec4899'], // Vivid violet & pink
  ['#38ef7d', '#11998e'], // Neon lime & deep turquoise
  ['#ff512f', '#dd2476'], // Fiery vermilion & red-violet

  // Dark moody + Neon pairs
  ['#09090b', '#ff007f'], // Obsidian & neon magenta
  ['#0f172a', '#00dfd8'], // Midnight slate & electric cyan
  ['#18181b', '#ff512f'], // Charcoal & blazing vermilion
  ['#1e1b4b', '#a855f7'], // Deep indigo & radiant purple
  ['#0d2818', '#38ef7d'], // Forest pine & neon emerald
  ['#2a1215', '#ff3366'], // Dark plum & neon coral
  ['#162032', '#38bdf8'], // Deep marine & vivid sky
  ['#1e172a', '#f43f5e'], // Dark void & hot rose
  ['#14281d', '#10b981'], // Obsidian emerald & mint neon
  ['#1c1917', '#f59e0b'], // Warm stone & golden amber
  ['#172554', '#00f2fe'], // Deep cobalt & cyan flare
  ['#261411', '#fb7185'], // Dark espresso & rose petal
];

export const BEZIER_FORMULA_PRESETS: {
  id: BezierFormulaType;
  label: string;
  description: string;
  defaultSizeMode: BezierSizeMode;
}[] = [
  {
    id: 'bicubic-patch',
    label: 'Bicubic Patch',
    description: '4×4 Bernstein tensor-product Bézier surface warping 2D space & radius',
    defaultSizeMode: 'bezier-tensor',
  },
  {
    id: 'streamlines',
    label: 'Streamlines',
    description: 'Bundle of cubic Bézier flow curves parameterized by arc velocity & curvature',
    defaultSizeMode: 'bezier-velocity',
  },
  {
    id: 'orthogonal-weave',
    label: 'Orthogonal Weave',
    description: 'Dual cross-directional cubic Bézier curves forming moiré interference lattices',
    defaultSizeMode: 'bezier-easing',
  },
  {
    id: 'radial-spiral',
    label: 'Radial Spiral',
    description: 'Polar cubic Bézier spirals with harmonic polynomial size expansion',
    defaultSizeMode: 'bezier-pinch',
  },
];

export const BEZIER_SIZE_MODES: {
  id: BezierSizeMode;
  label: string;
  description: string;
}[] = [
  {
    id: 'bezier-tensor',
    label: 'Bicubic Size Mesh',
    description: '16-point 2D scalar Bézier surface with local hills and valleys',
  },
  {
    id: 'bezier-velocity',
    label: 'Velocity / Speed',
    description: 'Dots scale dynamically with local Bézier curve speed ||C’(t)||',
  },
  {
    id: 'bezier-pinch',
    label: 'S-Curve Pinch & Bloom',
    description: 'Cubic Bézier inflection profile compressing and swelling radii',
  },
  {
    id: 'bezier-easing',
    label: 'Polynomial Transfer',
    description: '1D cubic Bernstein polynomial B(t; w₀, w₁, w₂, w₃)',
  },
];

/**
 * Creates a complete randomized CoverConfig with Bézier formulas
 */
export function getRandomCoverConfig(existingTitle?: string): CoverConfig {
  const pair = CURATED_PAIRS[Math.floor(Math.random() * CURATED_PAIRS.length)];
  const c1 = hexToRgb(pair[0]);
  const c2 = hexToRgb(pair[1]);

  const formulas: BezierFormulaType[] = ['bicubic-patch', 'streamlines', 'orthogonal-weave', 'radial-spiral'];
  const formula = formulas[Math.floor(Math.random() * formulas.length)];

  const sizeModes: BezierSizeMode[] = ['bezier-tensor', 'bezier-velocity', 'bezier-pinch', 'bezier-easing'];
  const sizeMode = sizeModes[Math.floor(Math.random() * sizeModes.length)];

  const curvature = 0.35 + Math.random() * 0.55; // [0.35 - 0.90]
  const twist = (Math.random() - 0.5) * 0.8; // [-0.4 to +0.4]
  const density = 32 + Math.floor(Math.random() * 24); // 32 - 56
  const baseRadius = 5.0 + Math.random() * 4.5;
  const flowAngle = Math.random() * Math.PI * 2;
  const gradientAngle = Math.random() * Math.PI * 2;
  const bloomRadius = 850 + Math.random() * 300;

  // Cubic Bézier size weights [w0, w1, w2, w3]
  const weightPresets: [number, number, number, number][] = [
    [0.2, 1.8, 0.4, 1.4], // Harmonic wave
    [0.1, 0.3, 1.7, 0.2], // Focal swell
    [1.6, 0.3, 0.4, 1.8], // Saddle pinch
    [0.3, 1.9, 1.6, 0.4], // Balloon bell
    [0.2, 0.5, 1.4, 2.0], // Ascending sweep
  ];
  const sizeWeights = weightPresets[Math.floor(Math.random() * weightPresets.length)];

  const dist = 600;
  const cx = 960;
  const cy = 540;
  const p1x = cx + Math.cos(gradientAngle) * dist;
  const p1y = cy + Math.sin(gradientAngle) * dist;
  const p2x = cx - Math.cos(gradientAngle) * dist;
  const p2y = cy - Math.sin(gradientAngle) * dist;

  const controlNet1 = generateBicubicControlNet(1920, 1080, curvature, flowAngle, twist, Math.random() * 100);
  const controlNet2 = generateBicubicControlNet(1920, 1080, curvature, flowAngle + Math.PI * 0.25, -twist, Math.random() * 100);

  const sizeNet1 = generateBicubicSizeNet(sizeWeights, curvature);
  const sizeNet2 = generateBicubicSizeNet([sizeWeights[3], sizeWeights[1], sizeWeights[2], sizeWeights[0]], curvature);

  const dots1: BezierDotLayerConfig = {
    formula,
    sizeFormula: sizeMode,
    density,
    curvature,
    twist,
    baseRadius,
    sizeWeights,
    sizeModulation: 0.95,
    pinchFactor: 1.0,
    jitter: 0,
    color: c1,
    opacity: 0.92,
    stagger: Math.random() > 0.4,
    staggerOffset: 0.5,
    flowAngle,
    controlNet: controlNet1,
    sizeNet: sizeNet1,
  };

  const dots2: BezierDotLayerConfig = {
    formula,
    sizeFormula: sizeMode,
    density,
    curvature,
    twist: -twist,
    baseRadius: baseRadius * 0.92,
    sizeWeights: [sizeWeights[3], sizeWeights[2], sizeWeights[1], sizeWeights[0]],
    sizeModulation: 0.95,
    pinchFactor: 1.0,
    jitter: 0,
    color: c2,
    opacity: 0.90,
    stagger: Math.random() > 0.4,
    staggerOffset: 0.5,
    flowAngle: flowAngle + Math.PI * 0.15,
    controlNet: controlNet2,
    sizeNet: sizeNet2,
  };

  return {
    id: Math.random().toString(36).substring(2, 9),
    title: existingTitle || 'Bézier Curves No. ' + Math.floor(Math.random() * 900 + 100),
    points: [
      { x: p1x, y: p1y, radius: bloomRadius, color: c1 },
      { x: p2x, y: p2y, radius: bloomRadius, color: c2 },
    ],
    gradientAngle,
    bloomRadius,
    baseColor: c1,
    dots1,
    dots2,
    showControlNet: false,
  };
}

/**
 * Draws the rich 2-point gradient blend background
 */
export function drawTwoPointBlend(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: CoverConfig
) {
  const cx = width / 2;
  const cy = height / 2;
  const angle = config.gradientAngle ?? 0;
  const dist = Math.min(width, height) * 0.35;
  const bloom = config.bloomRadius ?? 950;

  const p1x = cx + Math.cos(angle) * dist;
  const p1y = cy + Math.sin(angle) * dist;
  const p2x = cx - Math.cos(angle) * dist;
  const p2y = cy - Math.sin(angle) * dist;

  const c1 = config.dots1.color;
  const c2 = config.dots2.color;

  // 1. Smooth linear gradient between focal anchors
  const linear = ctx.createLinearGradient(p1x, p1y, p2x, p2y);
  linear.addColorStop(0, rgbToString(c1, 1));
  linear.addColorStop(1, rgbToString(c2, 1));
  ctx.fillStyle = linear;
  ctx.fillRect(0, 0, width, height);

  // 2. Radial blooms for organic spatial depth
  const rad2 = ctx.createRadialGradient(p2x, p2y, 0, p2x, p2y, bloom);
  rad2.addColorStop(0, rgbToString(c2, 1));
  rad2.addColorStop(0.5, rgbToString(c2, 0.65));
  rad2.addColorStop(1, rgbToString(c2, 0));
  ctx.fillStyle = rad2;
  ctx.fillRect(0, 0, width, height);

  const rad1 = ctx.createRadialGradient(p1x, p1y, 0, p1x, p1y, bloom);
  rad1.addColorStop(0, rgbToString(c1, 0.95));
  rad1.addColorStop(0.55, rgbToString(c1, 0.45));
  rad1.addColorStop(1, rgbToString(c1, 0));
  ctx.fillStyle = rad1;
  ctx.fillRect(0, 0, width, height);
}

/**
 * Renders the Bézier dot fields for both colors
 */
export function drawBezierDots(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: CoverConfig
) {
  const cx = width / 2;
  const cy = height / 2;
  const angle = config.gradientAngle ?? 0;
  const dist = Math.min(width, height) * 0.35;

  const p1 = { x: cx + Math.cos(angle) * dist, y: cy + Math.sin(angle) * dist };
  const p2 = { x: cx - Math.cos(angle) * dist, y: cy - Math.sin(angle) * dist };

  const scaleFactor = width / 1920;

  // Render Color 1 Bézier dots
  const dots1 = generateDotsFromBezier(width, height, config.dots1, 1, p1, p2);
  for (let i = 0; i < dots1.length; i++) {
    const dot = dots1[i];
    const alpha = config.dots1.opacity * dot.weight;
    const r = dot.radius * scaleFactor;
    if (r <= 0.5) continue;

    ctx.beginPath();
    ctx.arc(dot.x, dot.y, r, 0, Math.PI * 2);
    ctx.fillStyle = rgbToString(config.dots1.color, alpha);
    ctx.fill();
  }

  // Render Color 2 Bézier dots
  const dots2 = generateDotsFromBezier(width, height, config.dots2, 2, p1, p2);
  for (let i = 0; i < dots2.length; i++) {
    const dot = dots2[i];
    const alpha = config.dots2.opacity * dot.weight;
    const r = dot.radius * scaleFactor;
    if (r <= 0.5) continue;

    ctx.beginPath();
    ctx.arc(dot.x, dot.y, r, 0, Math.PI * 2);
    ctx.fillStyle = rgbToString(config.dots2.color, alpha);
    ctx.fill();
  }

  // Optional: Render Bézier Control Net Overlay
  if (config.showControlNet && config.dots1.controlNet) {
    drawControlNetOverlay(ctx, config.dots1.controlNet, scaleFactor);
  }
}

/**
 * Draws the 4x4 Bézier Control Net cage and handles
 */
function drawControlNetOverlay(
  ctx: CanvasRenderingContext2D,
  net: Point2D[][],
  scaleFactor: number
) {
  ctx.save();
  ctx.lineWidth = 1.2 * scaleFactor;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.setLineDash([4 * scaleFactor, 4 * scaleFactor]);

  // Draw U grid lines
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(net[i][0].x * scaleFactor, net[i][0].y * scaleFactor);
    for (let j = 1; j < 4; j++) {
      ctx.lineTo(net[i][j].x * scaleFactor, net[i][j].y * scaleFactor);
    }
    ctx.stroke();
  }

  // Draw V grid lines
  for (let j = 0; j < 4; j++) {
    ctx.beginPath();
    ctx.moveTo(net[0][j].x * scaleFactor, net[0][j].y * scaleFactor);
    for (let i = 1; i < 4; i++) {
      ctx.lineTo(net[i][j].x * scaleFactor, net[i][j].y * scaleFactor);
    }
    ctx.stroke();
  }

  // Draw control points
  ctx.setLineDash([]);
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      const pt = net[i][j];
      const isCorner = (i === 0 || i === 3) && (j === 0 || j === 3);
      const isInterior = (i === 1 || i === 2) && (j === 1 || j === 2);

      ctx.beginPath();
      ctx.arc(pt.x * scaleFactor, pt.y * scaleFactor, (isInterior ? 4 : isCorner ? 5 : 3) * scaleFactor, 0, Math.PI * 2);
      ctx.fillStyle = isInterior ? '#fee140' : isCorner ? '#ffffff' : 'rgba(255, 255, 255, 0.7)';
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.stroke();
    }
  }

  ctx.restore();
}

/**
 * Draws crisp typography for title
 */
export function drawTitleTypography(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  title: string
) {
  if (!title.trim()) return;

  const cleanName = title.trim();
  const maxLineWidth = width * 0.76;
  const fontSize = Math.round(width * 0.028);

  ctx.font = `500 ${fontSize}px "JetBrains Mono", ui-monospace, monospace`;

  // Split into lines
  const words = cleanName.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxLineWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  if (lines.length > 3) {
    lines.splice(2);
    lines[1] = lines[1] + '...';
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const lineHeight = fontSize * 1.35;
  const totalTextHeight = lines.length * lineHeight;
  const startY = (height - totalTextHeight) / 2 + lineHeight / 2;

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
  ctx.shadowBlur = Math.round(fontSize * 0.28);
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;

  ctx.fillStyle = '#ffffff';
  lines.forEach((line, index) => {
    ctx.fillText(line, width / 2, startY + index * lineHeight);
  });

  ctx.restore();
}

/**
 * Full master cover render into any canvas context
 */
export function renderCoverCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: CoverConfig
) {
  // 1. Background 2-point gradient blend
  drawTwoPointBlend(ctx, width, height, config);

  // 2. Bézier formula dots
  drawBezierDots(ctx, width, height, config);

  // 3. Typography
  drawTitleTypography(ctx, width, height, config.title);
}

/**
 * Exports full high-resolution PNG cover image
 */
export async function generateCoverPng(
  config: CoverConfig,
  width = 1920,
  height = 1080
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable');
  }

  renderCoverCanvas(ctx, width, height, config);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Export failed to create PNG blob'));
          return;
        }
        resolve(blob);
      },
      'image/png',
      1.0
    );
  });
}

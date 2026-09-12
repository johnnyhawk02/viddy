export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export interface BlendPoint {
  x: number;
  y: number;
  radius: number;
  color: RGBColor;
}

export interface PolkaDotPattern {
  radius: number;
  spacing: number;
  staggered: boolean;
  angle: number;
  jitter: number;
  opacity: number;
  color: RGBColor;
}

export interface BlendConfig {
  id: string;
  points: [BlendPoint, BlendPoint];
  baseColor: RGBColor;
  dots1: PolkaDotPattern;
  dots2: PolkaDotPattern;
}

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

export function hslToRgb(h: number, s: number, l: number): RGBColor {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return {
    r: Math.round(f(0) * 255),
    g: Math.round(f(8) * 255),
    b: Math.round(f(4) * 255),
  };
}

const CURATED_VIBRANT_PAIRS: [string, string][] = [
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
  ['#667eea', '#764ba2'], // Indigo twilight & purple
  ['#ff512f', '#dd2476'], // Fiery vermilion & red-violet
  ['#3a7bd5', '#3a6073'], // Deep cerulean & steel cyan
];

export function getRandomBlendConfig(): BlendConfig {
  const useCurated = Math.random() < 0.65;
  let colors: [RGBColor, RGBColor];

  if (useCurated) {
    const pair = CURATED_VIBRANT_PAIRS[Math.floor(Math.random() * CURATED_VIBRANT_PAIRS.length)];
    const shuffled = Math.random() < 0.5 ? [pair[0], pair[1]] : [pair[1], pair[0]];
    colors = [hexToRgb(shuffled[0]), hexToRgb(shuffled[1])];
  } else {
    // Generate vibrant complementary or high-contrast split hues
    const baseHue = Math.floor(Math.random() * 360);
    const hue2 = (baseHue + 70 + Math.floor(Math.random() * 110)) % 360;

    colors = [
      hslToRgb(baseHue, 92 + Math.floor(Math.random() * 8), 50 + Math.floor(Math.random() * 6)),
      hslToRgb(hue2, 92 + Math.floor(Math.random() * 8), 50 + Math.floor(Math.random() * 6)),
    ];
  }

  // Define diverse 2-point directional alignments across 1920x1080 canvas
  const orientations = [
    // Diagonal: Top-Left to Bottom-Right
    [
      { x: 1920 * (0.05 + Math.random() * 0.2), y: 1080 * (0.05 + Math.random() * 0.25), radius: 1300 + Math.random() * 400 },
      { x: 1920 * (0.75 + Math.random() * 0.2), y: 1080 * (0.70 + Math.random() * 0.25), radius: 1300 + Math.random() * 400 },
    ],
    // Diagonal: Bottom-Left to Top-Right
    [
      { x: 1920 * (0.05 + Math.random() * 0.2), y: 1080 * (0.70 + Math.random() * 0.25), radius: 1300 + Math.random() * 400 },
      { x: 1920 * (0.75 + Math.random() * 0.2), y: 1080 * (0.05 + Math.random() * 0.25), radius: 1300 + Math.random() * 400 },
    ],
    // Horizontal sweep: Left to Right
    [
      { x: 1920 * (0.05 + Math.random() * 0.18), y: 1080 * (0.35 + Math.random() * 0.3), radius: 1200 + Math.random() * 400 },
      { x: 1920 * (0.78 + Math.random() * 0.18), y: 1080 * (0.35 + Math.random() * 0.3), radius: 1200 + Math.random() * 400 },
    ],
    // Vertical sweep: Top to Bottom
    [
      { x: 1920 * (0.35 + Math.random() * 0.3), y: 1080 * (0.05 + Math.random() * 0.18), radius: 1200 + Math.random() * 400 },
      { x: 1920 * (0.35 + Math.random() * 0.3), y: 1080 * (0.78 + Math.random() * 0.18), radius: 1200 + Math.random() * 400 },
    ],
  ];

  const chosenOrientation = orientations[Math.floor(Math.random() * orientations.length)];
  const pointOrder = Math.random() < 0.5 ? [0, 1] : [1, 0];
  const color1 = colors[0];
  const color2 = colors[1];

  return {
    id: Math.random().toString(36).substring(2, 9),
    baseColor: color1,
    points: [
      { ...chosenOrientation[pointOrder[0]], color: color1 },
      { ...chosenOrientation[pointOrder[1]], color: color2 },
    ],
    dots1: getRandomPolkaDotPattern(color1, color2, 1),
    dots2: getRandomPolkaDotPattern(color2, color1, 2),
  };
}

function getRandomPolkaDotPattern(ownColor: RGBColor, otherColor: RGBColor, _side: 1 | 2): PolkaDotPattern {
  const angles = [0, Math.PI / 12, Math.PI / 6, Math.PI / 4, -Math.PI / 12, -Math.PI / 6];
  const angle = angles[Math.floor(Math.random() * angles.length)];

  // Randomize dot color theme
  const styleRoll = Math.random();
  let color: RGBColor;
  if (styleRoll < 0.60) {
    // High-impact pop-art contrast: use the other color of the 2-point blend
    color = otherColor;
  } else if (styleRoll < 0.80) {
    // Luminous crisp white dots
    color = { r: 255, g: 255, b: 255 };
  } else if (styleRoll < 0.92) {
    // Deep dark contrast dots
    color = { r: 16, g: 18, b: 24 };
  } else {
    // Lighter energetic tint of the background color
    color = {
      r: Math.min(255, Math.round(ownColor.r * 1.35 + 25)),
      g: Math.min(255, Math.round(ownColor.g * 1.35 + 25)),
      b: Math.min(255, Math.round(ownColor.b * 1.35 + 25)),
    };
  }

  return {
    radius: 6 + Math.floor(Math.random() * 9), // 6px to 14px
    spacing: 38 + Math.floor(Math.random() * 26), // 38px to 64px
    staggered: Math.random() < 0.65,
    angle,
    jitter: Math.random() < 0.35 ? 1.5 + Math.random() * 2.5 : 0,
    opacity: 0.30 + Math.random() * 0.28, // 0.30 to 0.58
    color,
  };
}

export function drawTwoPointBlend(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: BlendConfig
) {
  const [p1, p2] = config.points;

  // 1. Direct smooth linear gradient between the two focal points
  const linear = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
  linear.addColorStop(0, rgbToString(p1.color, 1));
  linear.addColorStop(1, rgbToString(p2.color, 1));
  ctx.fillStyle = linear;
  ctx.fillRect(0, 0, width, height);

  // 2. Radial bloom for Point 2 to give rich organic depth
  const rad2 = ctx.createRadialGradient(p2.x, p2.y, 0, p2.x, p2.y, p2.radius);
  rad2.addColorStop(0, rgbToString(p2.color, 1));
  rad2.addColorStop(0.5, rgbToString(p2.color, 0.7));
  rad2.addColorStop(1, rgbToString(p2.color, 0));
  ctx.fillStyle = rad2;
  ctx.fillRect(0, 0, width, height);

  // 3. Radial bloom for Point 1
  const rad1 = ctx.createRadialGradient(p1.x, p1.y, 0, p1.x, p1.y, p1.radius);
  rad1.addColorStop(0, rgbToString(p1.color, 0.95));
  rad1.addColorStop(0.55, rgbToString(p1.color, 0.5));
  rad1.addColorStop(1, rgbToString(p1.color, 0));
  ctx.fillStyle = rad1;
  ctx.fillRect(0, 0, width, height);
}

export function drawPolkaDotOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: BlendConfig
) {
  drawDotFieldForColor(ctx, width, height, config, 1);
  drawDotFieldForColor(ctx, width, height, config, 2);
}

function drawDotFieldForColor(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: BlendConfig,
  colorSide: 1 | 2
) {
  const p1 = config.points[0];
  const p2 = config.points[1];
  const dots = colorSide === 1 ? config.dots1 : config.dots2;

  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const lenSq = Math.max(1, dx * dx + dy * dy);

  const centerX = width / 2;
  const centerY = height / 2;

  const cos = Math.cos(dots.angle);
  const sin = Math.sin(dots.angle);

  const maxExtent = Math.max(width, height) * 0.85;
  const step = dots.spacing;

  let row = 0;
  for (let v = -maxExtent; v <= maxExtent; v += step) {
    row++;
    const rowOffset = dots.staggered && (row % 2 === 1) ? step / 2 : 0;

    for (let u = -maxExtent; u <= maxExtent; u += step) {
      const baseU = u + rowOffset;
      const jx = dots.jitter > 0 ? Math.sin(baseU * 12.9898 + v * 78.233) * dots.jitter : 0;
      const jy = dots.jitter > 0 ? Math.cos(baseU * 39.346 + v * 11.135) * dots.jitter : 0;

      const x = centerX + (baseU + jx) * cos - (v + jy) * sin;
      const y = centerY + (baseU + jx) * sin + (v + jy) * cos;

      if (x < -dots.radius || x > width + dots.radius || y < -dots.radius || y > height + dots.radius) {
        continue;
      }

      // Projection along gradient line from p1 (0) to p2 (1)
      const t = ((x - p1.x) * dx + (y - p1.y) * dy) / lenSq;

      // Color 1 dominates when t < 0.5; Color 2 dominates when t > 0.5
      let weight = 0;
      if (colorSide === 1) {
        // Full intensity on Color 1's side, smooth falloff into blend
        weight = Math.max(0, Math.min(1, (0.62 - t) / 0.32));
      } else {
        // Full intensity on Color 2's side, smooth falloff into blend
        weight = Math.max(0, Math.min(1, (t - 0.38) / 0.32));
      }

      if (weight <= 0.04) continue;

      let alpha = dots.opacity * weight;

      // Soft center attenuation to protect track title legibility
      const centerDist = Math.hypot(x - centerX, y - centerY);
      if (centerDist < 380) {
        const factor = Math.max(0.12, (centerDist - 120) / 260);
        alpha *= factor;
      }

      const r = dots.radius * (0.65 + 0.35 * weight);

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = rgbToString(dots.color, alpha);
      ctx.fill();
    }
  }
}

export async function generateCoverImage(
  trackName: string,
  blendConfig?: BlendConfig
): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 1920;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  const config = blendConfig || getRandomBlendConfig();

  // Draw vibrant 2-point blend
  drawTwoPointBlend(ctx, canvas.width, canvas.height, config);

  // Overlay random polka dot pattern on each color
  drawPolkaDotOverlay(ctx, canvas.width, canvas.height, config);

  // Clean track name formatting (strip file extension)
  const cleanName = trackName.replace(/\.[^/.]+$/, '').trim() || 'Untitled Track';

  // Minimalist typographic styling: JetBrains Mono
  const maxLineWidth = 1400;
  let fontSize = 56;
  ctx.font = `500 ${fontSize}px "JetBrains Mono", ui-monospace, monospace`;

  // Split into lines if needed
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

  // Cap at maximum 3 lines
  if (lines.length > 3) {
    lines.splice(2);
    lines[1] = lines[1] + '...';
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const lineHeight = fontSize * 1.35;
  const totalTextHeight = lines.length * lineHeight;
  const startY = (canvas.height - totalTextHeight) / 2 + lineHeight / 2;

  // Tasteful soft ambient center vignette to ensure crisp legibility on any vibrant blend
  const centerVignette = ctx.createRadialGradient(
    canvas.width / 2,
    canvas.height / 2,
    0,
    canvas.width / 2,
    canvas.height / 2,
    750
  );
  centerVignette.addColorStop(0, 'rgba(0, 0, 0, 0.42)');
  centerVignette.addColorStop(0.6, 'rgba(0, 0, 0, 0.18)');
  centerVignette.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = centerVignette;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;

  // Minimalist dot marker above track name
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.beginPath();
  ctx.arc(canvas.width / 2, startY - lineHeight / 2 - 28, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // Primary track name in clean white
  ctx.fillStyle = '#ffffff';
  lines.forEach((line, index) => {
    ctx.fillText(line, canvas.width / 2, startY + index * lineHeight);
  });

  ctx.restore();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas toBlob failed'));
          return;
        }
        const file = new File([blob], `${cleanName}-cover.png`, {
          type: 'image/png',
          lastModified: Date.now(),
        });
        resolve(file);
      },
      'image/png',
      1.0
    );
  });
}


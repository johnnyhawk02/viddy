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

export type IllusionType =
  | 'ripple'        // Concentric circular waves that warp depth perception
  | 'vortex'        // Logarithmic spiral wave causing rotational/spinning illusion
  | 'tunnel'        // Hyperbolic 3D funnel perspective creating depth suction
  | 'interference'  // Moire grid interference creating floating ghost waves
  | 'bulge'         // Sphere lens magnification warping local grid space
  | 'wavy-lattice'; // Cross-sine standing wave causing shimmering fluid undulation

export interface PolkaDotPattern {
  radius: number;
  spacing: number;
  staggered: boolean;
  angle: number;
  jitter: number;
  opacity: number;
  color: RGBColor;
  illusion: IllusionType;
  illusionFrequency: number;
  illusionStrength: number;
  illusionCenter: { x: number; y: number };
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

const CURATED_PAIRS: [string, string][] = [
  // Vibrant pairs
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

  // Dark + Vibrant pairs (high contrast graphic style)
  ['#09090b', '#ff007f'], // Obsidian & neon magenta
  ['#0f172a', '#00dfd8'], // Midnight slate & electric cyan
  ['#18181b', '#ff512f'], // Charcoal & blazing vermilion
  ['#1e1b4b', '#a855f7'], // Deep indigo & radiant purple
  ['#0d2818', '#38ef7d'], // Forest pine & neon emerald
  ['#2a1215', '#ff3366'], // Dark blood plum & neon coral
  ['#162032', '#38bdf8'], // Deep marine & vivid sky
  ['#1e172a', '#f43f5e'], // Dark void & hot rose
  ['#14281d', '#10b981'], // Obsidian emerald & mint neon
  ['#1c1917', '#f59e0b'], // Warm stone & golden amber
  ['#172554', '#00f2fe'], // Deep cobalt & cyan flare
  ['#261411', '#fb7185'], // Dark espresso & rose petal

  // Dark + Dark pairs (moody, sophisticated atmosphere)
  ['#09090b', '#1e1b4b'], // Pure obsidian & midnight indigo
  ['#0f172a', '#164e63'], // Midnight blue & deep petrol cyan
  ['#14281d', '#09090b'], // Dark pine & obsidian
  ['#1c1917', '#2a1b18'], // Warm stone & dark espresso
  ['#1e293b', '#09090b'], // Slate graphite & pure dark
  ['#282c34', '#111827'], // Dark metallic & obsidian ink
  ['#2e1065', '#0f172a'], // Deep gothic violet & midnight
  ['#1a102f', '#111827'], // Obsidian plum & dark gray
];

export function getRandomBlendConfig(): BlendConfig {
  const useCurated = Math.random() < 0.70;
  let colors: [RGBColor, RGBColor];

  if (useCurated) {
    const pair = CURATED_PAIRS[Math.floor(Math.random() * CURATED_PAIRS.length)];
    const shuffled = Math.random() < 0.5 ? [pair[0], pair[1]] : [pair[1], pair[0]];
    colors = [hexToRgb(shuffled[0]), hexToRgb(shuffled[1])];
  } else {
    // Procedural generation: mix of vibrant, dark+vibrant, or dark+dark
    const modeRoll = Math.random();
    const baseHue = Math.floor(Math.random() * 360);
    const hue2 = (baseHue + 60 + Math.floor(Math.random() * 120)) % 360;

    if (modeRoll < 0.40) {
      // Dark + Vibrant
      const darkFirst = Math.random() < 0.5;
      const darkColor = hslToRgb(baseHue, 35 + Math.floor(Math.random() * 35), 7 + Math.floor(Math.random() * 12));
      const vibrantColor = hslToRgb(hue2, 90 + Math.floor(Math.random() * 10), 48 + Math.floor(Math.random() * 8));
      colors = darkFirst ? [darkColor, vibrantColor] : [vibrantColor, darkColor];
    } else if (modeRoll < 0.65) {
      // Dark + Dark (moody)
      const dark1 = hslToRgb(baseHue, 40 + Math.floor(Math.random() * 30), 6 + Math.floor(Math.random() * 10));
      const dark2 = hslToRgb(hue2, 45 + Math.floor(Math.random() * 30), 12 + Math.floor(Math.random() * 12));
      colors = [dark1, dark2];
    } else {
      // Vibrant + Vibrant
      colors = [
        hslToRgb(baseHue, 92 + Math.floor(Math.random() * 8), 50 + Math.floor(Math.random() * 6)),
        hslToRgb(hue2, 92 + Math.floor(Math.random() * 8), 50 + Math.floor(Math.random() * 6)),
      ];
    }
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

  const ownLum = 0.299 * ownColor.r + 0.587 * ownColor.g + 0.114 * ownColor.b;
  const otherLum = 0.299 * otherColor.r + 0.587 * otherColor.g + 0.114 * otherColor.b;

  // Randomize dot color theme
  const styleRoll = Math.random();
  let color: RGBColor;
  let opacity = 0.35 + Math.random() * 0.28;

  if (ownLum < 60 && otherLum < 60) {
    // Both colors are dark - choose electric or luminous contrast dots
    if (styleRoll < 0.50) {
      color = { r: 255, g: 255, b: 255 }; // Crisp white dots
      opacity = 0.35 + Math.random() * 0.25;
    } else if (styleRoll < 0.82) {
      // Vivid pop neon dots on dark
      const neonHues = [
        { r: 0, g: 223, b: 216 }, // cyan
        { r: 255, g: 0, b: 127 }, // magenta
        { r: 56, g: 239, b: 125 }, // lime
        { r: 255, g: 153, b: 51 }, // orange
        { r: 168, g: 85, b: 247 }, // purple
      ];
      color = neonHues[Math.floor(Math.random() * neonHues.length)];
      opacity = 0.45 + Math.random() * 0.30;
    } else {
      // Subtle sleek tone-on-tone slightly lighter
      color = {
        r: Math.min(255, ownColor.r + 60),
        g: Math.min(255, ownColor.g + 60),
        b: Math.min(255, ownColor.b + 60),
      };
      opacity = 0.55 + Math.random() * 0.25;
    }
  } else if (styleRoll < 0.60) {
    // High-impact contrast: use the other color of the 2-point blend
    color = otherColor;
  } else if (styleRoll < 0.82) {
    // Luminous crisp white dots
    color = { r: 255, g: 255, b: 255 };
  } else if (styleRoll < 0.94) {
    // Deep dark contrast dots
    color = { r: 16, g: 18, b: 24 };
  } else {
    // Energetic tint of the background color
    color = {
      r: Math.min(255, Math.round(ownColor.r * 1.35 + 25)),
      g: Math.min(255, Math.round(ownColor.g * 1.35 + 25)),
      b: Math.min(255, Math.round(ownColor.b * 1.35 + 25)),
    };
  }

  const illusionTypes: IllusionType[] = [
    'ripple',
    'vortex',
    'tunnel',
    'interference',
    'bulge',
    'wavy-lattice',
  ];
  const illusion = illusionTypes[Math.floor(Math.random() * illusionTypes.length)];

  // Illusion origin point: either near gradient anchors or canvas center
  const centerOptions = [
    { x: 1920 * (0.15 + Math.random() * 0.35), y: 1080 * (0.2 + Math.random() * 0.6) },
    { x: 1920 * (0.55 + Math.random() * 0.35), y: 1080 * (0.2 + Math.random() * 0.6) },
    { x: 1920 * 0.5, y: 1080 * 0.5 },
  ];
  const illusionCenter = centerOptions[Math.floor(Math.random() * centerOptions.length)];

  const illusionFrequency = 0.008 + Math.random() * 0.016; // Spatial wavelength
  const illusionStrength = 0.55 + Math.random() * 0.40; // Size variation magnitude

  return {
    radius: 7 + Math.floor(Math.random() * 9), // 7px to 15px base radius
    spacing: 34 + Math.floor(Math.random() * 22), // 34px to 56px tighter grid for prominent illusion
    staggered: Math.random() < 0.70,
    angle,
    jitter: Math.random() < 0.25 ? 1.0 + Math.random() * 2.0 : 0,
    opacity,
    color,
    illusion,
    illusionFrequency,
    illusionStrength,
    illusionCenter,
  };
}

export function drawTwoPointBlend(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: BlendConfig,
  timeParam = 0
) {
  const [p1, p2] = config.points;

  // Subtle sub-pixel focal drift: coordinates shift by ~0.05px per beat frame
  const driftRadius = 2.0;
  const drift1X = Math.cos(timeParam * 0.025) * driftRadius;
  const drift1Y = Math.sin(timeParam * 0.025) * driftRadius;
  const drift2X = Math.sin(timeParam * 0.025) * driftRadius;
  const drift2Y = Math.cos(timeParam * 0.025) * driftRadius;

  const p1x = p1.x + drift1X;
  const p1y = p1.y + drift1Y;
  const p2x = p2.x + drift2X;
  const p2y = p2.y + drift2Y;

  // 1. Direct smooth linear gradient between the two focal points
  const linear = ctx.createLinearGradient(p1x, p1y, p2x, p2y);
  linear.addColorStop(0, rgbToString(p1.color, 1));
  linear.addColorStop(1, rgbToString(p2.color, 1));
  ctx.fillStyle = linear;
  ctx.fillRect(0, 0, width, height);

  // 2. Radial bloom for Point 2 to give rich organic depth
  const rad2 = ctx.createRadialGradient(p2x, p2y, 0, p2x, p2y, p2.radius);
  rad2.addColorStop(0, rgbToString(p2.color, 1));
  rad2.addColorStop(0.5, rgbToString(p2.color, 0.7));
  rad2.addColorStop(1, rgbToString(p2.color, 0));
  ctx.fillStyle = rad2;
  ctx.fillRect(0, 0, width, height);

  // 3. Radial bloom for Point 1
  const rad1 = ctx.createRadialGradient(p1x, p1y, 0, p1x, p1y, p1.radius);
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
  config: BlendConfig,
  timeParam = 0
) {
  drawDotFieldForColor(ctx, width, height, config, 1, timeParam);
  drawDotFieldForColor(ctx, width, height, config, 2, timeParam);
}

function drawDotFieldForColor(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: BlendConfig,
  colorSide: 1 | 2,
  timeParam = 0
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

  // Sub-pixel positional micro-drift: smooth harmonic orbit
  // In each beat frame, delta position is strictly sub-pixel (~0.12 - 0.22px)
  const driftRadius = 2.5;
  const driftPhase = (timeParam * 2 * Math.PI) / 64;
  const driftAngle = dots.angle + (colorSide === 1 ? 0 : Math.PI * 0.5);
  const driftX = Math.cos(driftPhase) * driftRadius * Math.cos(driftAngle) - Math.sin(driftPhase) * driftRadius * Math.sin(driftAngle);
  const driftY = Math.cos(driftPhase) * driftRadius * Math.sin(driftAngle) + Math.sin(driftPhase) * driftRadius * Math.cos(driftAngle);

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

      // Coordinate rendered with floating-point sub-pixel anti-aliasing on canvas
      const x = centerX + (baseU + jx) * cos - (v + jy) * sin + driftX;
      const y = centerY + (baseU + jx) * sin + (v + jy) * cos + driftY;

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

      // Optical illusion size modulation formula:
      // Computes a perceptual scale factor based on mathematical interference / wave patterns with subtle slow time morphing
      const scaleFactor = calculateIllusionScale(x, y, dots, timeParam);

      // Final dot radius with optical variation (clamped to prevent overlapping or disappearing dots)
      const maxRadius = (dots.spacing / 2) * 0.92;
      const r = Math.max(1.8, Math.min(maxRadius, dots.radius * scaleFactor * (0.65 + 0.35 * weight)));

      const alpha = dots.opacity * weight;

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = rgbToString(dots.color, alpha);
      ctx.fill();
    }
  }
}

/**
 * Optical illusion formulas calculating dot radius modulation factor.
 * In animated mode, timeParam smoothly shifts wave phases and blends across morph cycles
 * while keeping amplitude changes very subtle, slow, and hypnotic.
 */
function calculateIllusionScale(
  x: number,
  y: number,
  dots: PolkaDotPattern,
  timeParam = 0
): number {
  const cx = dots.illusionCenter.x;
  const cy = dots.illusionCenter.y;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);
  const freq = dots.illusionFrequency;
  const strength = dots.illusionStrength;

  // Compute wave value for any given illusion type with continuous time shift
  const evalFormula = (type: IllusionType, t: number): number => {
    switch (type) {
      case 'ripple': {
        // Concentric wave slowly undulating inward/outward
        return Math.sin(dist * freq * 1.5 - t * 1.8);
      }
      case 'vortex': {
        // Spiral arm slowly rotating and breathing
        const spiralPhase = dist * freq * 1.2 - angle * 3 - t * 1.2;
        return Math.sin(spiralPhase);
      }
      case 'tunnel': {
        // Logarithmic depth tunnel breathing
        const tunnelPhase = Math.log(Math.max(1, dist)) * 5.2 * (freq / 0.01) - t * 1.5;
        return Math.sin(tunnelPhase);
      }
      case 'interference': {
        // Moire grid interference wave planes slowly shifting against each other
        const wave1 = Math.sin((x * 0.707 + y * 0.707) * freq * 1.4 + t * 0.9);
        const wave2 = Math.sin((x * 0.707 - y * 0.707) * freq * 1.4 - t * 0.9);
        return wave1 * wave2;
      }
      case 'bulge': {
        // Gravitational lens / sphere breathing slowly in focal radius
        const sphereRadius = 450 + Math.sin(t * 1.1) * 80;
        if (dist < sphereRadius) {
          const norm = dist / sphereRadius;
          return Math.cos((norm * Math.PI) / 2) * 1.4;
        } else {
          return -0.35 * Math.sin(dist * freq * 0.8 + t * 0.7);
        }
      }
      case 'wavy-lattice':
      default: {
        // Standing wave liquid sheet undulating
        const waveX = Math.sin(x * freq * 1.2 + t * 0.8);
        const waveY = Math.cos(y * freq * 1.2 - t * 0.8);
        return (waveX + waveY) * 0.65;
      }
    }
  };

  let wave = 0;

  if (timeParam === 0) {
    // Static mode: evaluate current chosen illusion
    wave = evalFormula(dots.illusion, 0);
  } else {
    // Animated mode:
    // Continuous smooth morph across all 6 illusion formulas in an infinite loop
    const illusionSequence: IllusionType[] = [
      'ripple',
      'vortex',
      'tunnel',
      'interference',
      'bulge',
      'wavy-lattice',
    ];

    // Find starting offset based on the current assigned illusion
    const startIndex = Math.max(0, illusionSequence.indexOf(dots.illusion));

    // Sub-pixel time scaling: step of 1 beat produces delta r <= 0.25px (almost sub-pixel)
    const t = timeParam * 0.020;

    // A full morph cycle between two formulas takes 128 beats (ultra gradual sub-pixel blend)
    const morphCycleDuration = 128;
    const progress = (timeParam / morphCycleDuration) + startIndex;
    const fromIndex = Math.floor(progress) % illusionSequence.length;
    const toIndex = (fromIndex + 1) % illusionSequence.length;
    const blendFactor = progress - Math.floor(progress); // 0 to 1

    // Smooth cosine interpolation to avoid abrupt edges
    const smoothBlend = 0.5 - 0.5 * Math.cos(blendFactor * Math.PI);

    const waveA = evalFormula(illusionSequence[fromIndex], t);
    const waveB = evalFormula(illusionSequence[toIndex], t);

    wave = waveA * (1 - smoothBlend) + waveB * smoothBlend;
  }

  // Base scale is 1.0; modulated by strength * wave
  // Returns value typically within [0.28, 1.85]
  return Math.max(0.25, 1.0 + wave * strength);
}

/**
 * Reusable full frame renderer for either animated loop or static cover.
 * Draws directly into the provided canvas context with zero allocations.
 */
export function renderCoverFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  trackName: string,
  blendConfig: BlendConfig,
  timeParam = 0
) {
  // 1. Draw 2-point blend background with sub-pixel focal shift
  drawTwoPointBlend(ctx, width, height, blendConfig, timeParam);

  // 2. Draw polka dot optical illusion overlay (with time parameter for morphing)
  drawPolkaDotOverlay(ctx, width, height, blendConfig, timeParam);

  // 3. Draw clean track title typography
  const cleanName = trackName.replace(/\.[^/.]+$/, '').trim() || 'Untitled Track';
  const maxLineWidth = width * 0.72;
  const fontSize = Math.round(width * 0.03); // Scaled proportionally (e.g., ~29px on 960px canvas, 56px on 1920px)

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

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;

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


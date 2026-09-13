export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface BlendPoint {
  x: number;
  y: number;
  radius: number;
  color: RGBColor;
}

export type BezierFormulaType =
  | 'bicubic-patch'     // 4x4 Bicubic Bézier surface tensor product for (x, y)
  | 'streamlines'       // Bundle of cubic Bézier flow curves with arc-length pacing
  | 'orthogonal-weave'  // Dual cross-directional cubic Bézier curve families
  | 'radial-spiral';    // Polar Bézier spirals parameterized by cubic polynomials

export type BezierSizeMode =
  | 'bezier-tensor'     // 2D Bicubic Bézier scalar surface modulating radii
  | 'bezier-velocity'   // Scaled by Bézier velocity ||C'(t)|| with cubic profile
  | 'bezier-pinch'      // Cubic Bézier S-curve focal pinch and bloom
  | 'bezier-easing';    // 1D Cubic Bézier transfer curve B(s; w0, w1, w2, w3)

export interface BezierDotLayerConfig {
  formula: BezierFormulaType;
  sizeFormula: BezierSizeMode;
  density: number;          // Subdivision steps (16 - 72)
  curvature: number;        // Control point displacement magnitude [0.05 - 1.0]
  twist: number;            // Asymmetry twist [-1.0 to 1.0]
  baseRadius: number;       // Base dot radius in pixels (1.5 - 16)
  sizeWeights: [number, number, number, number]; // Cubic Bézier size control weights [w0, w1, w2, w3]
  sizeModulation: number;   // Amplitude of size modulation [0.0 - 1.0]
  pinchFactor: number;      // Focal pinch steepness [0.2 - 2.5]
  jitter: number;           // Tangential displacement jitter [0 - 15px]
  color: RGBColor;
  opacity: number;          // [0.1 - 1.0]
  stagger: boolean;
  staggerOffset: number;    // [0.0 - 1.0]
  flowAngle: number;        // [0 - 2*PI]
  controlNet?: Point2D[][];
  sizeNet?: number[][];
}

export interface CoverConfig {
  id: string;
  title: string;
  points: [BlendPoint, BlendPoint];
  gradientAngle: number;    // [0 - 2*PI]
  bloomRadius: number;      // [400 - 1600]
  baseColor: RGBColor;
  dots1: BezierDotLayerConfig;
  dots2: BezierDotLayerConfig;
  showControlNet: boolean;
}

export type FFmpegStatus = 'unloaded' | 'loading' | 'ready' | 'encoding' | 'done' | 'error';

export interface RenderProgress {
  ratio: number;
  percentage: number;
}

export interface MediaFile {
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

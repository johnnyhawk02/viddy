import { Point2D, BezierDotLayerConfig } from '../types';

/**
 * Cubic Bernstein basis polynomials
 * B_0(t) = (1 - t)^3
 * B_1(t) = 3(1 - t)^2 * t
 * B_2(t) = 3(1 - t) * t^2
 * B_3(t) = t^3
 */
export function bernstein0(t: number): number {
  const mt = 1 - t;
  return mt * mt * mt;
}

export function bernstein1(t: number): number {
  const mt = 1 - t;
  return 3 * mt * mt * t;
}

export function bernstein2(t: number): number {
  const mt = 1 - t;
  return 3 * mt * t * t;
}

export function bernstein3(t: number): number {
  return t * t * t;
}

export function bernsteinAll(t: number): [number, number, number, number] {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  return [mt2 * mt, 3 * mt2 * t, 3 * mt * t2, t2 * t];
}

/**
 * Evaluates a 1D cubic Bézier polynomial with control weights [w0, w1, w2, w3]
 */
export function evalCubicBezier1D(
  t: number,
  w0: number,
  w1: number,
  w2: number,
  w3: number
): number {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  return mt2 * mt * w0 + 3 * mt2 * t * w1 + 3 * mt * t2 * w2 + t2 * t * w3;
}

/**
 * Evaluates a 2D cubic Bézier curve C(t) = sum_{i=0}^3 B_i(t) * P_i
 */
export function evalCubicBezier2D(
  t: number,
  p0: Point2D,
  p1: Point2D,
  p2: Point2D,
  p3: Point2D
): Point2D {
  const [b0, b1, b2, b3] = bernsteinAll(t);
  return {
    x: b0 * p0.x + b1 * p1.x + b2 * p2.x + b3 * p3.x,
    y: b0 * p0.y + b1 * p1.y + b2 * p2.y + b3 * p3.y,
  };
}

/**
 * Evaluates first derivative (tangent velocity) C'(t) of a cubic Bézier curve
 */
export function evalCubicBezierDerivative(
  t: number,
  p0: Point2D,
  p1: Point2D,
  p2: Point2D,
  p3: Point2D
): { dx: number; dy: number; speed: number } {
  const mt = 1 - t;
  const d0 = 3 * mt * mt;
  const d1 = 6 * mt * t;
  const d2 = 3 * t * t;
  const dx = d0 * (p1.x - p0.x) + d1 * (p2.x - p1.x) + d2 * (p3.x - p2.x);
  const dy = d0 * (p1.y - p0.y) + d1 * (p2.y - p1.y) + d2 * (p3.y - p2.y);
  const speed = Math.hypot(dx, dy);
  return { dx, dy, speed };
}

/**
 * Evaluates a 2D Bicubic Bézier Tensor-Product surface point S(u, v)
 * S(u, v) = sum_{i=0}^3 sum_{j=0}^3 B_i(u) * B_j(v) * P_{i,j}
 */
export function evalBicubicSurfacePoint(
  u: number,
  v: number,
  controlNet: Point2D[][]
): Point2D {
  const bu = bernsteinAll(u);
  const bv = bernsteinAll(v);

  let x = 0;
  let y = 0;

  for (let i = 0; i < 4; i++) {
    const bu_i = bu[i];
    const row = controlNet[i];
    for (let j = 0; j < 4; j++) {
      const b = bu_i * bv[j];
      x += b * row[j].x;
      y += b * row[j].y;
    }
  }

  return { x, y };
}

/**
 * Evaluates a 2D Bicubic Bézier Scalar size surface W(u, v)
 * W(u, v) = sum_{i=0}^3 sum_{j=0}^3 B_i(u) * B_j(v) * w_{i,j}
 */
export function evalBicubicScalarSurface(
  u: number,
  v: number,
  sizeNet: number[][]
): number {
  const bu = bernsteinAll(u);
  const bv = bernsteinAll(v);

  let val = 0;
  for (let i = 0; i < 4; i++) {
    const bu_i = bu[i];
    const row = sizeNet[i];
    for (let j = 0; j < 4; j++) {
      val += bu_i * bv[j] * row[j];
    }
  }

  return val;
}

/**
 * Generates an expressive 4x4 control net for a Bicubic Bézier patch
 */
export function generateBicubicControlNet(
  width: number,
  height: number,
  curvature: number,
  flowAngle: number,
  twist = 0,
  seed = 1
): Point2D[][] {
  const net: Point2D[][] = [];
  const cx = width / 2;
  const cy = height / 2;
  const cos = Math.cos(flowAngle);
  const sin = Math.sin(flowAngle);

  // Randomize warp displacement vectors based on seed
  const s = Math.sin(seed * 12.9898) * 43758.5453;
  const warp1 = ((s - Math.floor(s)) - 0.5) * 2;
  const warp2 = ((Math.sin(seed * 78.233) * 43758.5453) % 1 - 0.5) * 2;

  for (let i = 0; i < 4; i++) {
    const row: Point2D[] = [];
    const uNorm = (i / 3) - 0.5; // [-0.5, 0.5]
    for (let j = 0; j < 4; j++) {
      const vNorm = (j / 3) - 0.5; // [-0.5, 0.5]

      // Baseline flat grid position
      let xLocal = uNorm * (width * 1.12);
      let yLocal = vNorm * (height * 1.12);

      // Curvilinear Op-Art warp: non-linear displacement of interior & corner control handles
      const isInterior = (i === 1 || i === 2) && (j === 1 || j === 2);
      const isEdge = (i === 1 || i === 2) || (j === 1 || j === 2);

      if (isInterior) {
        const factor = curvature * Math.min(width, height) * 0.42;
        xLocal += (uNorm * warp1 + vNorm * warp2) * factor;
        yLocal += (vNorm * warp1 - uNorm * warp2) * factor;
        // Apply twist shear
        xLocal += twist * factor * vNorm * 0.6;
        yLocal -= twist * factor * uNorm * 0.6;
      } else if (isEdge) {
        const factor = curvature * Math.min(width, height) * 0.22;
        xLocal += warp2 * factor * (j === 0 || j === 3 ? -1 : 1);
        yLocal += warp1 * factor * (i === 0 || i === 3 ? 1 : -1);
      }

      // Rotate around canvas center
      const rotX = cx + xLocal * cos - yLocal * sin;
      const rotY = cy + xLocal * sin + yLocal * cos;

      row.push({ x: rotX, y: rotY });
    }
    net.push(row);
  }

  return net;
}

/**
 * Generates a 4x4 scalar size net for bicubic dot size modulation
 */
export function generateBicubicSizeNet(
  sizeWeights: [number, number, number, number],
  curvature: number
): number[][] {
  const net: number[][] = [];
  const [w0, w1, w2, w3] = sizeWeights;

  for (let i = 0; i < 4; i++) {
    const row: number[] = [];
    const uWeight = [w0, w1, w2, w3][i];
    for (let j = 0; j < 4; j++) {
      const vWeight = [w0, w1, w2, w3][j];
      const combined = Math.max(0.2, (uWeight * 0.6 + vWeight * 0.4) * (0.85 + curvature * 0.45));
      row.push(combined);
    }
    net.push(row);
  }

  return net;
}

export interface GeneratedBezierDot {
  x: number;
  y: number;
  radius: number;
  u: number;
  v: number;
  weight: number;
}

/**
 * Generates all dot positions and sizes for a given Bézier dot configuration
 */
export function generateDotsFromBezier(
  width: number,
  height: number,
  config: BezierDotLayerConfig,
  colorSide: 1 | 2,
  p1: Point2D,
  p2: Point2D
): GeneratedBezierDot[] {
  const dots: GeneratedBezierDot[] = [];
  const {
    formula,
    sizeFormula,
    density,
    curvature,
    twist = 0,
    baseRadius,
    sizeWeights,
    sizeModulation = 1.0,
    pinchFactor = 1.0,
    jitter = 0,
    stagger,
    staggerOffset = 0.5,
    flowAngle,
  } = config;

  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const lenSq = Math.max(1, dx * dx + dy * dy);

  // 1. BICUBIC SURFACE PATCH
  if (formula === 'bicubic-patch') {
    const controlNet =
      config.controlNet ||
      generateBicubicControlNet(width, height, curvature, flowAngle, twist, colorSide * 13.37);
    const sizeNet = config.sizeNet || generateBicubicSizeNet(sizeWeights, curvature);

    const steps = Math.max(16, Math.min(72, density));
    const uStep = 1 / (steps - 1);
    const vStep = 1 / (steps - 1);

    for (let i = 0; i < steps; i++) {
      const v = i * vStep;
      const vOffset = stagger && i % 2 === 1 ? uStep * staggerOffset : 0;

      for (let j = 0; j < steps; j++) {
        let u = j * uStep + vOffset;
        if (u > 1.05 || u < -0.05) continue;
        const uClamped = Math.max(0, Math.min(1, u));

        // Evaluate (x, y) location using 2D Bernstein-Bézier Tensor Product
        const loc = evalBicubicSurfacePoint(uClamped, v, controlNet);

        // Add micro jitter if configured
        let dotX = loc.x;
        let dotY = loc.y;
        if (jitter > 0) {
          const jAngle = (uClamped * 17.13 + v * 31.41) * Math.PI;
          dotX += Math.cos(jAngle) * jitter;
          dotY += Math.sin(jAngle) * jitter;
        }

        if (
          dotX < -baseRadius * 2 ||
          dotX > width + baseRadius * 2 ||
          dotY < -baseRadius * 2 ||
          dotY > height + baseRadius * 2
        ) {
          continue;
        }

        // Color dominance weight based on projection along 2-point gradient vector
        const proj = ((dotX - p1.x) * dx + (dotY - p1.y) * dy) / lenSq;
        let blendWeight = 0;
        if (colorSide === 1) {
          blendWeight = Math.max(0, Math.min(1, (0.65 - proj) / 0.35));
        } else {
          blendWeight = Math.max(0, Math.min(1, (proj - 0.35) / 0.35));
        }
        if (blendWeight <= 0.03) continue;

        // Evaluate raw size factor using Bézier formulae
        let rawFactor = 1.0;
        if (sizeFormula === 'bezier-tensor') {
          rawFactor = evalBicubicScalarSurface(uClamped, v, sizeNet);
        } else if (sizeFormula === 'bezier-easing') {
          const diag = (uClamped + v) * 0.5;
          rawFactor = evalCubicBezier1D(diag, sizeWeights[0], sizeWeights[1], sizeWeights[2], sizeWeights[3]);
        } else if (sizeFormula === 'bezier-pinch') {
          const du = uClamped - 0.5;
          const dv = v - 0.5;
          const distPole = Math.min(1, Math.hypot(du, dv) * (1.6 * pinchFactor));
          rawFactor = evalCubicBezier1D(distPole, sizeWeights[3], sizeWeights[1], sizeWeights[2], sizeWeights[0]);
        } else {
          const su = evalCubicBezier1D(uClamped, sizeWeights[0], sizeWeights[1], sizeWeights[2], sizeWeights[3]);
          const sv = evalCubicBezier1D(v, sizeWeights[3], sizeWeights[2], sizeWeights[1], sizeWeights[0]);
          rawFactor = (su + sv) * 0.5;
        }

        // Modulate with sizeModulation fader
        const sizeFactor = 1.0 + (rawFactor - 1.0) * sizeModulation;
        const maxR = (Math.min(width, height) / steps) * 0.48;
        const radius = Math.max(1.5, Math.min(maxR, baseRadius * sizeFactor * (0.65 + 0.35 * blendWeight)));

        dots.push({
          x: dotX,
          y: dotY,
          radius,
          u: uClamped,
          v,
          weight: blendWeight,
        });
      }
    }
  }

  // 2. BÉZIER STREAMLINES
  else if (formula === 'streamlines') {
    const curveCount = Math.max(12, Math.min(48, Math.round(density * 0.75)));
    const dotsPerCurve = Math.max(20, Math.min(70, density));
    const cx = width / 2;
    const cy = height / 2;
    const cos = Math.cos(flowAngle);
    const sin = Math.sin(flowAngle);
    const span = Math.max(width, height) * 1.25;

    for (let c = 0; c < curveCount; c++) {
      const s = c / (curveCount - 1);
      const yOffset = (s - 0.5) * span;

      const p0Local = { x: -span * 0.55, y: yOffset };
      const p3Local = { x: span * 0.55, y: yOffset };

      const deflect1 = curvature * span * 0.35 * Math.sin(s * Math.PI * 2 + colorSide * 1.5) + twist * 40;
      const deflect2 = -curvature * span * 0.35 * Math.cos(s * Math.PI * 2 + colorSide * 1.5) - twist * 40;

      const p1Local = { x: -span * 0.18, y: yOffset + deflect1 };
      const p2Local = { x: span * 0.18, y: yOffset + deflect2 };

      const rot = (pt: Point2D): Point2D => ({
        x: cx + pt.x * cos - pt.y * sin,
        y: cy + pt.x * sin + pt.y * cos,
      });

      const p0 = rot(p0Local);
      const p1 = rot(p1Local);
      const p2 = rot(p2Local);
      const p3 = rot(p3Local);

      for (let d = 0; d < dotsPerCurve; d++) {
        const t = d / (dotsPerCurve - 1);
        const loc = evalCubicBezier2D(t, p0, p1, p2, p3);

        let dotX = loc.x;
        let dotY = loc.y;
        if (jitter > 0) {
          const jAngle = (t * 19.3 + s * 23.7) * Math.PI;
          dotX += Math.cos(jAngle) * jitter;
          dotY += Math.sin(jAngle) * jitter;
        }

        if (
          dotX < -baseRadius * 2 ||
          dotX > width + baseRadius * 2 ||
          dotY < -baseRadius * 2 ||
          dotY > height + baseRadius * 2
        ) {
          continue;
        }

        const proj = ((dotX - p1.x) * dx + (dotY - p1.y) * dy) / lenSq;
        let blendWeight = 0;
        if (colorSide === 1) {
          blendWeight = Math.max(0, Math.min(1, (0.65 - proj) / 0.35));
        } else {
          blendWeight = Math.max(0, Math.min(1, (proj - 0.35) / 0.35));
        }
        if (blendWeight <= 0.03) continue;

        let rawFactor = 1.0;
        if (sizeFormula === 'bezier-velocity') {
          const deriv = evalCubicBezierDerivative(t, p0, p1, p2, p3);
          const normSpeed = Math.min(2.5, Math.max(0.3, deriv.speed / (span / dotsPerCurve)));
          rawFactor = normSpeed * evalCubicBezier1D(t, sizeWeights[0], sizeWeights[1], sizeWeights[2], sizeWeights[3]);
        } else {
          const sizeT = evalCubicBezier1D(t, sizeWeights[0], sizeWeights[1], sizeWeights[2], sizeWeights[3]);
          const sizeS = evalCubicBezier1D(s, sizeWeights[3], sizeWeights[1], sizeWeights[2], sizeWeights[0]);
          rawFactor = sizeT * (0.6 + 0.4 * sizeS);
        }

        const sizeFactor = 1.0 + (rawFactor - 1.0) * sizeModulation;
        const maxR = (span / dotsPerCurve) * 0.45;
        const radius = Math.max(1.5, Math.min(maxR, baseRadius * sizeFactor * (0.65 + 0.35 * blendWeight)));

        dots.push({
          x: dotX,
          y: dotY,
          radius,
          u: t,
          v: s,
          weight: blendWeight,
        });
      }
    }
  }

  // 3. ORTHOGONAL WEAVE
  else if (formula === 'orthogonal-weave') {
    const steps = Math.max(16, Math.min(50, density));
    const stepU = 1 / (steps - 1);
    const stepV = 1 / (steps - 1);
    const cx = width / 2;
    const cy = height / 2;
    const spanX = width * 1.15;
    const spanY = height * 1.15;

    for (let i = 0; i < steps; i++) {
      const v = i * stepV;
      for (let j = 0; j < steps; j++) {
        const u = j * stepU;

        const xBaseline = cx + (u - 0.5) * spanX;
        const yBaseline = cy + (v - 0.5) * spanY;

        const warpX = evalCubicBezier1D(u, 0, curvature * 60 + twist * 20, -curvature * 60, 0);
        const warpY = evalCubicBezier1D(v, -curvature * 50, curvature * 50 - twist * 20, -curvature * 50, curvature * 50);

        let dotX = xBaseline + warpX * Math.cos(v * Math.PI * 3);
        let dotY = yBaseline + warpY * Math.sin(u * Math.PI * 3);

        if (jitter > 0) {
          const jAngle = (u * 13.7 + v * 29.1) * Math.PI;
          dotX += Math.cos(jAngle) * jitter;
          dotY += Math.sin(jAngle) * jitter;
        }

        if (dotX < -baseRadius || dotX > width + baseRadius || dotY < -baseRadius || dotY > height + baseRadius) {
          continue;
        }

        const proj = ((dotX - p1.x) * dx + (dotY - p1.y) * dy) / lenSq;
        let blendWeight = 0;
        if (colorSide === 1) {
          blendWeight = Math.max(0, Math.min(1, (0.65 - proj) / 0.35));
        } else {
          blendWeight = Math.max(0, Math.min(1, (proj - 0.35) / 0.35));
        }
        if (blendWeight <= 0.03) continue;

        const su = evalCubicBezier1D(u, sizeWeights[0], sizeWeights[1], sizeWeights[2], sizeWeights[3]);
        const sv = evalCubicBezier1D(v, sizeWeights[3], sizeWeights[2], sizeWeights[1], sizeWeights[0]);
        const rawFactor = su * sv;
        const sizeFactor = 1.0 + (rawFactor - 1.0) * sizeModulation;

        const maxR = (Math.min(width, height) / steps) * 0.44;
        const radius = Math.max(1.5, Math.min(maxR, baseRadius * sizeFactor * (0.65 + 0.35 * blendWeight)));

        dots.push({
          x: dotX,
          y: dotY,
          radius,
          u,
          v,
          weight: blendWeight,
        });
      }
    }
  }

  // 4. RADIAL SPIRAL
  else if (formula === 'radial-spiral') {
    const arms = Math.max(12, Math.min(36, Math.round(density * 0.6)));
    const dotsPerArm = Math.max(24, Math.min(70, density));
    const cx = width / 2;
    const cy = height / 2;
    const maxDist = Math.max(width, height) * 0.68;

    for (let a = 0; a < arms; a++) {
      const armAngle = (a / arms) * Math.PI * 2;

      for (let d = 0; d < dotsPerArm; d++) {
        const t = d / (dotsPerArm - 1);

        const rDist = evalCubicBezier1D(t, 25, maxDist * 0.25 * (1 - curvature * 0.5), maxDist * 0.65, maxDist);
        const twistAngle = evalCubicBezier1D(t, 0, curvature * 1.5, curvature * 3.2 + twist, curvature * 5.0);
        const totalAngle = armAngle + twistAngle + flowAngle;

        let dotX = cx + Math.cos(totalAngle) * rDist;
        let dotY = cy + Math.sin(totalAngle) * rDist;

        if (jitter > 0) {
          const jAngle = (t * 22.4 + a * 1.7) * Math.PI;
          dotX += Math.cos(jAngle) * jitter;
          dotY += Math.sin(jAngle) * jitter;
        }

        if (dotX < -baseRadius || dotX > width + baseRadius || dotY < -baseRadius || dotY > height + baseRadius) {
          continue;
        }

        const proj = ((dotX - p1.x) * dx + (dotY - p1.y) * dy) / lenSq;
        let blendWeight = 0;
        if (colorSide === 1) {
          blendWeight = Math.max(0, Math.min(1, (0.65 - proj) / 0.35));
        } else {
          blendWeight = Math.max(0, Math.min(1, (proj - 0.35) / 0.35));
        }
        if (blendWeight <= 0.03) continue;

        const rawFactor = evalCubicBezier1D(t, sizeWeights[0], sizeWeights[1], sizeWeights[2], sizeWeights[3]);
        const sizeFactor = 1.0 + (rawFactor - 1.0) * sizeModulation;
        const maxR = (maxDist / dotsPerArm) * 0.55;
        const radius = Math.max(1.5, Math.min(maxR, baseRadius * sizeFactor * (0.65 + 0.35 * blendWeight)));

        dots.push({
          x: dotX,
          y: dotY,
          radius,
          u: t,
          v: a / arms,
          weight: blendWeight,
        });
      }
    }
  }

  return dots;
}

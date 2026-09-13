import React, { useState } from 'react';
import {
  CoverConfig,
  BezierFormulaType,
  BezierSizeMode,
} from '../types';
import {
  BEZIER_FORMULA_PRESETS,
  BEZIER_SIZE_MODES,
  CURATED_PAIRS,
  hexToRgb,
} from '../utils/generateCover';
import {
  generateBicubicControlNet,
  generateBicubicSizeNet,
} from '../utils/bezierEngine';
import {
  Dices,
  Eye,
  Sparkles,
  Download,
  Copy,
  Check,
  Sliders,
  Palette,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface BezierControlsProps {
  config: CoverConfig;
  onChange: (updater: (prev: CoverConfig) => CoverConfig) => void;
  onRandomize: () => void;
  onShufflePalette: () => void;
  aspectRatio: '16:9' | '1:1';
  onToggleAspectRatio: () => void;
  onDownloadPng: (ratio: '16:9' | '1:1') => void;
  onCopyImage: () => void;
  copied: boolean;
}

export const BezierControls: React.FC<BezierControlsProps> = ({
  config,
  onChange,
  onRandomize,
  onShufflePalette,
  aspectRatio,
  onToggleAspectRatio,
  onDownloadPng,
  onCopyImage,
  copied,
}) => {
  const [activeTab, setActiveTab] = useState<'geometry' | 'size' | 'color'>('geometry');

  const currentFormula = config.dots1.formula;
  const currentSizeMode = config.dots1.sizeFormula;

  const handleFormulaChange = (formula: BezierFormulaType) => {
    onChange((prev) => {
      const preset = BEZIER_FORMULA_PRESETS.find((p) => p.id === formula);
      const newSizeMode = preset ? preset.defaultSizeMode : prev.dots1.sizeFormula;

      const controlNet1 = generateBicubicControlNet(
        1920,
        aspectRatio === '1:1' ? 1920 : 1080,
        prev.dots1.curvature,
        prev.dots1.flowAngle,
        prev.dots1.twist || 0,
        Math.random() * 50
      );
      const controlNet2 = generateBicubicControlNet(
        1920,
        aspectRatio === '1:1' ? 1920 : 1080,
        prev.dots2.curvature,
        prev.dots2.flowAngle,
        prev.dots2.twist || 0,
        Math.random() * 50
      );

      return {
        ...prev,
        dots1: {
          ...prev.dots1,
          formula,
          sizeFormula: newSizeMode,
          controlNet: controlNet1,
        },
        dots2: {
          ...prev.dots2,
          formula,
          sizeFormula: newSizeMode,
          controlNet: controlNet2,
        },
      };
    });
  };

  const handleSizeModeChange = (sizeFormula: BezierSizeMode) => {
    onChange((prev) => ({
      ...prev,
      dots1: { ...prev.dots1, sizeFormula },
      dots2: { ...prev.dots2, sizeFormula },
    }));
  };

  // Faders updates
  const updateGeometryFaders = (
    updater: Partial<{
      curvature: number;
      twist: number;
      density: number;
      baseRadius: number;
      flowAngle: number;
      jitter: number;
    }>
  ) => {
    onChange((prev) => {
      const curvature = updater.curvature ?? prev.dots1.curvature;
      const twist = updater.twist ?? prev.dots1.twist;
      const density = updater.density ?? prev.dots1.density;
      const baseRadius = updater.baseRadius ?? prev.dots1.baseRadius;
      const flowAngle = updater.flowAngle ?? prev.dots1.flowAngle;
      const jitter = updater.jitter ?? prev.dots1.jitter;

      const controlNet1 = generateBicubicControlNet(
        1920,
        aspectRatio === '1:1' ? 1920 : 1080,
        curvature,
        flowAngle,
        twist,
        1
      );
      const controlNet2 = generateBicubicControlNet(
        1920,
        aspectRatio === '1:1' ? 1920 : 1080,
        curvature,
        flowAngle + Math.PI * 0.15,
        -twist,
        2
      );

      return {
        ...prev,
        dots1: {
          ...prev.dots1,
          curvature,
          twist,
          density,
          baseRadius,
          flowAngle,
          jitter,
          controlNet: controlNet1,
        },
        dots2: {
          ...prev.dots2,
          curvature,
          twist: -twist,
          density: Math.round(density * 0.95),
          baseRadius: baseRadius * 0.92,
          flowAngle: flowAngle + Math.PI * 0.15,
          jitter,
          controlNet: controlNet2,
        },
      };
    });
  };

  const updateSizeFaders = (
    updater: Partial<{
      sizeModulation: number;
      pinchFactor: number;
      weights: [number, number, number, number];
    }>
  ) => {
    onChange((prev) => {
      const sizeModulation = updater.sizeModulation ?? prev.dots1.sizeModulation ?? 1.0;
      const pinchFactor = updater.pinchFactor ?? prev.dots1.pinchFactor ?? 1.0;
      const sizeWeights = updater.weights ?? prev.dots1.sizeWeights;

      const sizeWeights2: [number, number, number, number] = [
        sizeWeights[3],
        sizeWeights[2],
        sizeWeights[1],
        sizeWeights[0],
      ];

      const sizeNet1 = generateBicubicSizeNet(sizeWeights, prev.dots1.curvature);
      const sizeNet2 = generateBicubicSizeNet(sizeWeights2, prev.dots2.curvature);

      return {
        ...prev,
        dots1: {
          ...prev.dots1,
          sizeModulation,
          pinchFactor,
          sizeWeights,
          sizeNet: sizeNet1,
        },
        dots2: {
          ...prev.dots2,
          sizeModulation,
          pinchFactor,
          sizeWeights: sizeWeights2,
          sizeNet: sizeNet2,
        },
      };
    });
  };

  const updateColorFaders = (
    updater: Partial<{
      gradientAngle: number;
      bloomRadius: number;
      opacity1: number;
      opacity2: number;
      staggerOffset: number;
    }>
  ) => {
    onChange((prev) => ({
      ...prev,
      gradientAngle: updater.gradientAngle ?? prev.gradientAngle ?? 0,
      bloomRadius: updater.bloomRadius ?? prev.bloomRadius ?? 950,
      dots1: {
        ...prev.dots1,
        opacity: updater.opacity1 ?? prev.dots1.opacity,
        staggerOffset: updater.staggerOffset ?? prev.dots1.staggerOffset ?? 0.5,
      },
      dots2: {
        ...prev.dots2,
        opacity: updater.opacity2 ?? prev.dots2.opacity,
        staggerOffset: updater.staggerOffset ?? prev.dots2.staggerOffset ?? 0.5,
      },
    }));
  };

  const handleColorPairSelect = (hex1: string, hex2: string) => {
    const c1 = hexToRgb(hex1);
    const c2 = hexToRgb(hex2);
    onChange((prev) => ({
      ...prev,
      points: [
        { ...prev.points[0], color: c1 },
        { ...prev.points[1], color: c2 },
      ],
      dots1: { ...prev.dots1, color: c1 },
      dots2: { ...prev.dots2, color: c2 },
    }));
  };

  return (
    <div id="bezier-controls-panel" className="flex flex-col gap-4 text-zinc-300">
      {/* Title & Metadata Card */}
      <div id="card-title-input" className="p-4 bg-zinc-900/80 border border-zinc-800/80 rounded-xl flex flex-col gap-2">
        <label htmlFor="cover-title-field" className="font-mono text-xs text-zinc-400 font-medium">
          Artwork / Track Title
        </label>
        <input
          id="cover-title-field"
          type="text"
          value={config.title}
          onChange={(e) => onChange((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="Enter title (leave empty for abstract)..."
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 font-mono focus:outline-none focus:border-zinc-500 transition-colors"
        />
      </div>

      {/* Formula Presets Selector */}
      <div id="card-formula-select" className="p-4 bg-zinc-900/80 border border-zinc-800/80 rounded-xl flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-zinc-400 font-medium">Bézier Coordinate Algorithm</span>
          <span className="font-mono text-[11px] text-zinc-500">Dot Positions (x, y)</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {BEZIER_FORMULA_PRESETS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleFormulaChange(item.id)}
              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                currentFormula === item.id
                  ? 'bg-zinc-800 border-zinc-500 text-white shadow-sm'
                  : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              <span className="font-mono text-xs font-semibold">{item.label}</span>
              <span className="text-[11px] text-zinc-500 leading-snug line-clamp-1">{item.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Fader Category Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-zinc-900/90 border border-zinc-800/80 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab('geometry')}
          className={`flex-1 py-2 px-3 rounded-lg font-mono text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
            activeTab === 'geometry'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Geometry Faders</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('size')}
          className={`flex-1 py-2 px-3 rounded-lg font-mono text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
            activeTab === 'size'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Size Faders</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('color')}
          className={`flex-1 py-2 px-3 rounded-lg font-mono text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
            activeTab === 'color'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Color & Bloom</span>
        </button>
      </div>

      {/* 1. GEOMETRY FADERS PANEL */}
      {activeTab === 'geometry' && (
        <div id="card-geometry-faders" className="p-4 bg-zinc-900/80 border border-zinc-800/80 rounded-xl flex flex-col gap-4">
          <span className="font-mono text-xs text-zinc-400 font-medium">Bézier Coordinate & Curvature Faders</span>

          {/* Curvature Fader */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-zinc-400">Curvature Warp</span>
              <span className="text-white font-medium">{(config.dots1.curvature * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="1.0"
              step="0.01"
              value={config.dots1.curvature}
              onChange={(e) => updateGeometryFaders({ curvature: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-zinc-800 accent-white rounded-lg cursor-pointer"
            />
          </div>

          {/* Asymmetry / Twist Fader */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-zinc-400">Asymmetry Twist</span>
              <span className="text-white font-medium">{((config.dots1.twist || 0) * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="-1.0"
              max="1.0"
              step="0.02"
              value={config.dots1.twist || 0}
              onChange={(e) => updateGeometryFaders({ twist: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-zinc-800 accent-white rounded-lg cursor-pointer"
            />
          </div>

          {/* Density Fader */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-zinc-400">Grid / Streamline Density</span>
              <span className="text-white font-medium">{config.dots1.density}</span>
            </div>
            <input
              type="range"
              min="16"
              max="72"
              step="2"
              value={config.dots1.density}
              onChange={(e) => updateGeometryFaders({ density: parseInt(e.target.value, 10) })}
              className="w-full h-1.5 bg-zinc-800 accent-white rounded-lg cursor-pointer"
            />
          </div>

          {/* Base Dot Radius Fader */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-zinc-400">Base Dot Radius</span>
              <span className="text-white font-medium">{config.dots1.baseRadius.toFixed(1)}px</span>
            </div>
            <input
              type="range"
              min="1.5"
              max="16.0"
              step="0.5"
              value={config.dots1.baseRadius}
              onChange={(e) => updateGeometryFaders({ baseRadius: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-zinc-800 accent-white rounded-lg cursor-pointer"
            />
          </div>

          {/* Flow Rotation Angle Fader */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-zinc-400">Flow Rotation Angle</span>
              <span className="text-white font-medium">{Math.round((config.dots1.flowAngle * 180) / Math.PI)}°</span>
            </div>
            <input
              type="range"
              min="0"
              max={Math.PI * 2}
              step="0.05"
              value={config.dots1.flowAngle}
              onChange={(e) => updateGeometryFaders({ flowAngle: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-zinc-800 accent-white rounded-lg cursor-pointer"
            />
          </div>

          {/* Tangent Jitter Fader */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-zinc-400">Tangent Micro Jitter</span>
              <span className="text-white font-medium">{(config.dots1.jitter || 0).toFixed(1)}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="15.0"
              step="0.5"
              value={config.dots1.jitter || 0}
              onChange={(e) => updateGeometryFaders({ jitter: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-zinc-800 accent-white rounded-lg cursor-pointer"
            />
          </div>

          {/* Wireframe toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-zinc-400" />
              <span className="font-mono text-xs text-zinc-300">Show 4x4 Bézier Control Net Wireframe</span>
            </div>
            <button
              type="button"
              onClick={() => onChange((prev) => ({ ...prev, showControlNet: !prev.showControlNet }))}
              className={`px-2.5 py-1 rounded font-mono text-xs font-medium cursor-pointer transition-colors ${
                config.showControlNet
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {config.showControlNet ? 'Visible' : 'Hidden'}
            </button>
          </div>
        </div>
      )}

      {/* 2. SIZE FADERS PANEL */}
      {activeTab === 'size' && (
        <div id="card-size-faders" className="p-4 bg-zinc-900/80 border border-zinc-800/80 rounded-xl flex flex-col gap-4">
          <span className="font-mono text-xs text-zinc-400 font-medium">Bézier Dot Radius Modulation</span>

          {/* Size Mode Grid */}
          <div className="grid grid-cols-2 gap-2">
            {BEZIER_SIZE_MODES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSizeModeChange(item.id)}
                className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                  currentSizeMode === item.id
                    ? 'bg-zinc-800 border-zinc-500 text-white shadow-sm'
                    : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span className="font-mono text-xs font-semibold">{item.label}</span>
                <span className="text-[10px] text-zinc-500 line-clamp-1">{item.description}</span>
              </button>
            ))}
          </div>

          {/* Modulation Depth Fader */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-zinc-400">Modulation Amplitude Depth</span>
              <span className="text-white font-medium">{Math.round((config.dots1.sizeModulation ?? 1.0) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.5"
              step="0.02"
              value={config.dots1.sizeModulation ?? 1.0}
              onChange={(e) => updateSizeFaders({ sizeModulation: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-zinc-800 accent-white rounded-lg cursor-pointer"
            />
          </div>

          {/* S-Curve Pinch Factor Fader */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-zinc-400">S-Curve Pinch & Falloff</span>
              <span className="text-white font-medium">{(config.dots1.pinchFactor ?? 1.0).toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="2.5"
              step="0.05"
              value={config.dots1.pinchFactor ?? 1.0}
              onChange={(e) => updateSizeFaders({ pinchFactor: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-zinc-800 accent-white rounded-lg cursor-pointer"
            />
          </div>

          {/* Cubic Bézier weights w0, w1, w2, w3 */}
          <div className="flex flex-col gap-2 pt-2 border-t border-zinc-800/80">
            <span className="font-mono text-xs text-zinc-400">Cubic Bernstein Profile Weights B(t; w₀, w₁, w₂, w₃)</span>
            <div className="grid grid-cols-4 gap-2">
              {config.dots1.sizeWeights.map((w, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1.5">
                  <div className="flex items-center justify-between w-full font-mono text-[10px] text-zinc-500">
                    <span>w{idx}</span>
                    <span className="text-zinc-300">{w.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="3.0"
                    step="0.05"
                    value={w}
                    onChange={(e) => {
                      const next = [...config.dots1.sizeWeights] as [number, number, number, number];
                      next[idx] = parseFloat(e.target.value);
                      updateSizeFaders({ weights: next });
                    }}
                    className="w-full h-1 bg-zinc-800 accent-zinc-200 rounded cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. COLOR & BLOOM FADERS PANEL */}
      {activeTab === 'color' && (
        <div id="card-color-faders" className="p-4 bg-zinc-900/80 border border-zinc-800/80 rounded-xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-zinc-400 font-medium">Color Palette & Optical Bloom Faders</span>
            <button
              type="button"
              onClick={onShufflePalette}
              className="flex items-center gap-1 text-xs font-mono text-zinc-400 hover:text-white cursor-pointer transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              <span>Shuffle</span>
            </button>
          </div>

          {/* Color 1 Opacity */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-zinc-400">Color 1 Dot Opacity</span>
              <span className="text-white font-medium">{Math.round(config.dots1.opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.02"
              value={config.dots1.opacity}
              onChange={(e) => updateColorFaders({ opacity1: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-zinc-800 accent-white rounded-lg cursor-pointer"
            />
          </div>

          {/* Color 2 Opacity */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-zinc-400">Color 2 Dot Opacity</span>
              <span className="text-white font-medium">{Math.round(config.dots2.opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.02"
              value={config.dots2.opacity}
              onChange={(e) => updateColorFaders({ opacity2: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-zinc-800 accent-white rounded-lg cursor-pointer"
            />
          </div>

          {/* Gradient Direction Angle */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-zinc-400">Gradient Blend Direction</span>
              <span className="text-white font-medium">{Math.round(((config.gradientAngle ?? 0) * 180) / Math.PI)}°</span>
            </div>
            <input
              type="range"
              min="0"
              max={Math.PI * 2}
              step="0.05"
              value={config.gradientAngle ?? 0}
              onChange={(e) => updateColorFaders({ gradientAngle: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-zinc-800 accent-white rounded-lg cursor-pointer"
            />
          </div>

          {/* Radial Bloom Radius */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-zinc-400">Radial Bloom Glow Radius</span>
              <span className="text-white font-medium">{Math.round(config.bloomRadius ?? 950)}px</span>
            </div>
            <input
              type="range"
              min="400"
              max="1600"
              step="25"
              value={config.bloomRadius ?? 950}
              onChange={(e) => updateColorFaders({ bloomRadius: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-zinc-800 accent-white rounded-lg cursor-pointer"
            />
          </div>

          {/* Stagger Phase Shift */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-zinc-400">Stagger Phase Offset</span>
              <span className="text-white font-medium">{Math.round((config.dots1.staggerOffset ?? 0.5) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={config.dots1.staggerOffset ?? 0.5}
              onChange={(e) => updateColorFaders({ staggerOffset: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-zinc-800 accent-white rounded-lg cursor-pointer"
            />
          </div>

          {/* Palette Swatches */}
          <div className="pt-2 border-t border-zinc-800/80">
            <span className="font-mono text-[11px] text-zinc-500 mb-2 block">Curated High-Contrast Palettes</span>
            <div className="grid grid-cols-6 gap-2">
              {CURATED_PAIRS.slice(0, 12).map(([hex1, hex2], idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleColorPairSelect(hex1, hex2)}
                  className="h-7 rounded-lg overflow-hidden flex cursor-pointer border border-zinc-800 hover:scale-105 hover:border-zinc-500 transition-all"
                  title={`${hex1} / ${hex2}`}
                >
                  <span className="flex-1 h-full" style={{ backgroundColor: hex1 }} />
                  <span className="flex-1 h-full" style={{ backgroundColor: hex2 }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions & Static Image Export */}
      <div id="card-image-export-actions" className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={onRandomize}
          className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          <Dices className="w-3.5 h-3.5" />
          <span>Randomize Curves</span>
        </button>

        <button
          type="button"
          onClick={onCopyImage}
          className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied!' : 'Copy Frame'}</span>
        </button>

        <button
          type="button"
          onClick={() => onDownloadPng('16:9')}
          className="py-2.5 px-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 font-mono text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download 16:9 PNG</span>
        </button>

        <button
          type="button"
          onClick={() => onDownloadPng('1:1')}
          className="py-2.5 px-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 font-mono text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download 1:1 PNG</span>
        </button>
      </div>
    </div>
  );
};

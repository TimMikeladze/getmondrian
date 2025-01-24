import { Check, ChevronDown, Download, Github, Link, Plus, RefreshCw, Sliders, Twitter, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import type { SVGProps } from 'react';

interface Cell {
  id: string;
  color: string;
  width: number;
  height: number;
  x: number;
  y: number;
  colorIndex: number;
}

interface MondrianState {
  complexity: number;
  colors: string[];
  borderWidth: number;
  borderColor: string;
  minSplitRatio: number;
  maxSplitRatio: number;
  splitProbability: number;
  minSize: number;
  externalBorderWidth: number;
  borderRadius: number;
  seed: number;
  fullscreen?: boolean;
  title?: string;
}

const DEFAULT_COLORS: string[] = ['#ffffff', '#e72f24', '#f0d53c', '#234d9c'];

function getValidColor(colors: string[], index: number): string {
  if (colors.length === 0) return DEFAULT_COLORS[0]!;
  const safeIndex = Math.max(0, Math.min(index, colors.length - 1));
  return colors[safeIndex]!;
}

function generateRandomColor(existingColors: string[]): string {
  // If no existing colors, return a default color
  if (existingColors.length === 0) {
    return `hsl(${Math.random() * 360}, 60%, 50%)`;
  }

  // Get the HSL values of existing colors
  const existingHSL = existingColors.map((color) => {
    if (color.startsWith('hsl')) {
      const matches = color.match(/\d+/g);
      if (!matches || matches.length < 3) {
        return { h: 0, s: 50, l: 50 }; // Default values if parsing fails
      }
      return {
        h: Number(matches[0]),
        s: Number(matches[1]),
        l: Number(matches[2]),
      };
    }

    // For hex colors, convert to RGB then HSL
    const div = document.createElement('div');
    div.style.color = color;
    document.body.appendChild(div);
    const rgbColor = window.getComputedStyle(div).color;
    document.body.removeChild(div);

    const rgbMatches = rgbColor.match(/\d+/g);
    if (!rgbMatches || rgbMatches.length < 3) {
      return { h: 0, s: 50, l: 50 }; // Default values if parsing fails
    }

    const r = Number(rgbMatches[0]);
    const g = Number(rgbMatches[1]);
    const b = Number(rgbMatches[2]);

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2 / 255;
    const d = max - min;
    const s = max === 0 ? 0 : d / max;
    let h = 0;

    if (max !== min) {
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h = h * 60;
    }

    return { h, s: s * 100, l: l * 100 };
  });

  // Find the largest hue gap
  const sortedHues = existingHSL.map((c) => c.h).sort((a, b) => a - b);

  // If we only have one color, offset by 180 degrees
  if (sortedHues.length === 1) {
    const baseHue = sortedHues[0] || 0;
    const newHue = (baseHue + 180) % 360;
    return `hsl(${Math.round(newHue)}, 60%, 50%)`;
  }

  let maxGap = 0;
  let gapStart = 0;

  for (let i = 0; i < sortedHues.length; i++) {
    const currentHue = sortedHues[i] || 0;
    const nextHue = i === sortedHues.length - 1 ? (sortedHues[0] || 0) + 360 : sortedHues[i + 1] || 0;
    const gap = nextHue - currentHue;

    if (gap > maxGap) {
      maxGap = gap;
      gapStart = currentHue;
    }
  }

  // Choose a hue in the middle of the largest gap
  const newHue = (gapStart + maxGap / 2) % 360;

  // Average the saturation and lightness values, but ensure good contrast
  const avgSaturation = Math.min(Math.max(existingHSL.reduce((sum, c) => sum + c.s, 0) / existingHSL.length, 50), 80);

  const avgLightness = Math.min(Math.max(existingHSL.reduce((sum, c) => sum + c.l, 0) / existingHSL.length, 40), 60);

  return `hsl(${Math.round(newHue)}, ${Math.round(avgSaturation)}%, ${Math.round(avgLightness)}%)`;
}

// Seeded random number generator
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateGrid(
  depth: number,
  colors: string[],
  minSplitRatio: number,
  maxSplitRatio: number,
  splitProbability: number,
  minSize: number,
  seed: number
): Cell[] {
  const colorsToUse = colors?.length > 0 ? colors : DEFAULT_COLORS;
  const cells: Cell[] = [];
  const random = mulberry32(seed);

  // Use relative units (0-100) for coordinates and sizes
  const subdivide = (x: number, y: number, width: number, height: number, depth: number) => {
    if (depth <= 0 || (random() > splitProbability && depth < 3)) {
      const colorIndex = Math.min(Math.floor(random() * colorsToUse.length), colorsToUse.length - 1);
      cells.push({
        id: `${x}-${y}-${width}-${height}`,
        color: colorsToUse[colorIndex]!,
        colorIndex,
        width,
        height,
        x,
        y,
      });
      return;
    }

    if (random() > 0.5 && width > minSize / 8) {
      // Adjust minSize threshold for relative units
      const split = width * (minSplitRatio + random() * (maxSplitRatio - minSplitRatio));
      subdivide(x, y, split, height, depth - 1);
      subdivide(x + split, y, width - split, height, depth - 1);
    } else if (height > minSize / 8) {
      // Adjust minSize threshold for relative units
      const split = height * (minSplitRatio + random() * (maxSplitRatio - minSplitRatio));
      subdivide(x, y, width, split, depth - 1);
      subdivide(x, y + split, width, height - split, depth - 1);
    } else {
      const colorIndex = Math.min(Math.floor(random() * colorsToUse.length), colorsToUse.length - 1);
      cells.push({
        id: `${x}-${y}-${width}-${height}`,
        color: colorsToUse[colorIndex]!,
        colorIndex,
        width,
        height,
        x,
        y,
      });
    }
  };

  // Start with 100x100 relative units instead of 800x800 fixed units
  subdivide(0, 0, 100, 100, depth);
  return cells;
}

function stateToUrlParams(state: MondrianState, forSharing: boolean = false): string {
  const params = new URLSearchParams();

  if (forSharing) {
    // When sharing, include all state values
    params.set('c', state.complexity.toString());
    params.set('colors', state.colors.join(','));
    params.set('bw', state.borderWidth.toString());
    params.set('bc', state.borderColor.replace('#', ''));
    params.set('minr', state.minSplitRatio.toString());
    params.set('maxr', state.maxSplitRatio.toString());
    params.set('sp', state.splitProbability.toString());
    params.set('ms', state.minSize.toString());
    params.set('ebw', state.externalBorderWidth.toString());
    params.set('br', state.borderRadius.toString());
    params.set('seed', state.seed.toString());
    if (state.fullscreen) params.set('fs', '1');
    if (state.title && state.title !== 'Mondrian') params.set('title', state.title);
  } else {
    // For normal URL updates, only include non-default values
    if (state.complexity !== 4) params.set('c', state.complexity.toString());
    if (state.colors.join(',') !== DEFAULT_COLORS.join(',')) params.set('colors', state.colors.join(','));
    if (state.borderWidth !== 12) params.set('bw', state.borderWidth.toString());
    if (state.borderColor !== '#121212') params.set('bc', state.borderColor.replace('#', ''));
    if (state.minSplitRatio !== 0.35) params.set('minr', state.minSplitRatio.toString());
    if (state.maxSplitRatio !== 0.65) params.set('maxr', state.maxSplitRatio.toString());
    if (state.splitProbability !== 0.5) params.set('sp', state.splitProbability.toString());
    if (state.minSize !== 150) params.set('ms', state.minSize.toString());
    if (state.externalBorderWidth !== 16) params.set('ebw', state.externalBorderWidth.toString());
    if (state.borderRadius !== 0) params.set('br', state.borderRadius.toString());
    params.set('seed', state.seed.toString()); // Always include seed
    if (state.fullscreen) params.set('fs', '1');
    if (state.title && state.title !== 'Mondrian') params.set('title', state.title);
  }

  return params.toString();
}

function urlParamsToState(params: URLSearchParams): Partial<MondrianState> {
  const state: Partial<MondrianState> = {};

  if (params.has('c')) state.complexity = Number(params.get('c'));
  if (params.has('colors')) state.colors = params.get('colors')!.split(',');
  if (params.has('bw')) state.borderWidth = Number(params.get('bw'));
  if (params.has('bc')) state.borderColor = '#' + params.get('bc');
  if (params.has('minr')) state.minSplitRatio = Number(params.get('minr'));
  if (params.has('maxr')) state.maxSplitRatio = Number(params.get('maxr'));
  if (params.has('sp')) state.splitProbability = Number(params.get('sp'));
  if (params.has('ms')) state.minSize = Number(params.get('ms'));
  if (params.has('ebw')) state.externalBorderWidth = Number(params.get('ebw'));
  if (params.has('br')) state.borderRadius = Number(params.get('br'));
  if (params.has('fs')) state.fullscreen = params.get('fs') === '1';
  if (params.has('seed')) state.seed = Number(params.get('seed'));
  if (params.has('title')) {
    const titleParam = params.get('title');
    if (titleParam !== null) {
      state.title = titleParam;
    }
  }

  return state;
}

function Tooltip({ children, content }: { children: React.ReactNode; content: string }) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded whitespace-nowrap z-50">
          {content}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-full -mb-px border-4 border-transparent border-b-gray-900" />
        </div>
      )}
    </div>
  );
}

export function MondrianGenerator() {
  // Get initial state from URL if available
  const initialState = (() => {
    if (typeof window === 'undefined') return {};
    const params = new URLSearchParams(window.location.search);
    const state = params.toString() ? urlParamsToState(params) : {};
    // If we have URL params, ensure we have a seed
    if (params.toString()) {
      state.seed = params.has('seed') ? Number(params.get('seed')) : Math.floor(Math.random() * 1000000);
    }
    return state;
  })();

  const [complexity, setComplexity] = useState(initialState.complexity ?? 4);
  const [colors, setColors] = useState(initialState.colors ?? DEFAULT_COLORS);
  const [borderWidth, setBorderWidth] = useState(initialState.borderWidth ?? 12);
  const [borderColor, setBorderColor] = useState(initialState.borderColor ?? '#121212');
  const [minSplitRatio, setMinSplitRatio] = useState(initialState.minSplitRatio ?? 0.35);
  const [maxSplitRatio, setMaxSplitRatio] = useState(initialState.maxSplitRatio ?? 0.65);
  const [splitProbability, setSplitProbability] = useState(initialState.splitProbability ?? 0.5);
  const [minSize, setMinSize] = useState(initialState.minSize ?? 150);
  const [showControls, setShowControls] = useState(false);
  const [externalBorderWidth, setExternalBorderWidth] = useState(initialState.externalBorderWidth ?? 16);
  const [borderRadius, setBorderRadius] = useState(initialState.borderRadius ?? 0);
  const [seed, setSeed] = useState(initialState.seed ?? Math.floor(Math.random() * 1000000));
  const [copySuccess, setCopySuccess] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(initialState.fullscreen ?? false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [showFullscreenHint, setShowFullscreenHint] = useState(false);
  const [title, setTitle] = useState(initialState.title ?? 'Mondrian');

  // Initialize cells with URL state if available
  const [cells, setCells] = useState(() => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const useInitialState = params.toString() && initialState;
    const initialColors = useInitialState && initialState.colors ? initialState.colors : DEFAULT_COLORS;
    const complexity = useInitialState && typeof initialState.complexity === 'number' ? initialState.complexity : 4;
    const minSplitRatio =
      useInitialState && typeof initialState.minSplitRatio === 'number' ? initialState.minSplitRatio : 0.35;
    const maxSplitRatio =
      useInitialState && typeof initialState.maxSplitRatio === 'number' ? initialState.maxSplitRatio : 0.65;
    const splitProbability =
      useInitialState && typeof initialState.splitProbability === 'number' ? initialState.splitProbability : 0.5;
    const minSize = useInitialState && typeof initialState.minSize === 'number' ? initialState.minSize : 150;
    const gridSeed =
      useInitialState && typeof initialState.seed === 'number'
        ? initialState.seed
        : Math.floor(Math.random() * 1000000);

    return generateGrid(complexity, initialColors, minSplitRatio, maxSplitRatio, splitProbability, minSize, gridSeed);
  });

  // Update URL when state changes
  useEffect(() => {
    const state: MondrianState = {
      complexity,
      colors,
      borderWidth,
      borderColor,
      minSplitRatio,
      maxSplitRatio,
      splitProbability,
      minSize,
      externalBorderWidth,
      borderRadius,
      seed,
      fullscreen: isFullscreen,
      title,
    };
    const params = stateToUrlParams(state);
    window.history.replaceState(null, '', params ? `?${params}` : window.location.pathname);
  }, [
    complexity,
    colors,
    borderWidth,
    borderColor,
    minSplitRatio,
    maxSplitRatio,
    splitProbability,
    minSize,
    externalBorderWidth,
    borderRadius,
    seed,
    isFullscreen,
    title,
  ]);

  // Handle keyboard events for exiting fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Handle touch events for mobile swipe-down to exit fullscreen
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0]?.clientY ?? null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0]?.clientY ?? null);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchEnd - touchStart;
    const isDownSwipe = distance > 100; // Minimum 100px swipe

    if (isDownSwipe && isFullscreen) {
      toggleFullscreen();
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  const regenerateGrid = () => {
    const newSeed = Math.floor(Math.random() * 1000000);
    setSeed(newSeed);
    setCells(generateGrid(complexity, colors, minSplitRatio, maxSplitRatio, splitProbability, minSize, newSeed));
  };

  const handleColorChange = (index: number, color: string) => {
    const newColors = [...colors];
    newColors[index] = color;
    setColors(newColors);
    setCells(
      cells.map((cell) => ({
        ...cell,
        color: getValidColor(newColors, cell.colorIndex),
      }))
    );
  };

  const addColor = () => {
    const newColor = generateRandomColor(colors);
    setColors([...colors, newColor]);

    // Regenerate the grid with the new color
    setCells(
      generateGrid(complexity, [...colors, newColor], minSplitRatio, maxSplitRatio, splitProbability, minSize, seed)
    );
  };

  const removeColor = (index: number) => {
    if (colors.length <= 1) return;
    const newColors = colors.filter((_, i) => i !== index);
    setColors(newColors);
    setCells(
      cells.map((cell) => {
        const newColorIndex =
          cell.colorIndex >= index
            ? cell.colorIndex >= newColors.length
              ? newColors.length - 1
              : cell.colorIndex
            : cell.colorIndex;
        return {
          ...cell,
          colorIndex: newColorIndex,
          color: getValidColor(newColors, newColorIndex),
        };
      })
    );
  };

  const downloadSVG = () => {
    const svgData = document.getElementById('mondrian-svg')?.outerHTML;
    if (!svgData) return;

    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mondrian.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadRaster = async (format: 'png' | 'webp') => {
    const svg = document.getElementById('mondrian-svg');
    if (!svg) return;

    // Create a canvas with 2x size for better quality
    const canvas = document.createElement('canvas');
    const rect = svg.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Convert SVG to data URL
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    // Create image from SVG
    const img = new Image();
    img.src = svgUrl;

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    // Draw image to canvas with proper scaling
    ctx.scale(2, 2); // Scale up for better quality
    ctx.drawImage(img, 0, 0, rect.width, rect.height);

    // Convert to desired format
    const mimeType = format === 'png' ? 'image/png' : 'image/webp';
    const dataUrl = canvas.toDataURL(mimeType, 0.9);

    // Download
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `mondrian.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Cleanup
    URL.revokeObjectURL(svgUrl);
  };

  const copyUrlToClipboard = (includeFullscreen: boolean = false) => {
    const state: MondrianState = {
      complexity,
      colors,
      borderWidth,
      borderColor,
      minSplitRatio,
      maxSplitRatio,
      splitProbability,
      minSize,
      externalBorderWidth,
      borderRadius,
      seed,
      fullscreen: includeFullscreen,
      title,
    };
    const params = stateToUrlParams(state, true);
    const url = `${window.location.origin}${window.location.pathname}${params ? `?${params}` : ''}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setShowControls(false);
  };

  // Show hint when entering fullscreen
  useEffect(() => {
    if (isFullscreen) {
      setShowFullscreenHint(true);
      const timer = setTimeout(() => {
        setShowFullscreenHint(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isFullscreen]);

  return (
    <div className="h-[100svh] w-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* Toolbar */}
      {!isFullscreen && (
        <div className="w-full bg-white shadow-md z-10 flex-none border-b border-gray-200">
          <div className="max-w-screen-2xl mx-auto">
            {/* Main Toolbar */}
            <div className="h-12 px-4 flex items-center justify-between gap-2 md:gap-4">
              {/* Left Section */}
              <div className="flex items-center gap-3 min-w-0">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-lg font-bold text-gray-800 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-gray-200 rounded px-1 -ml-1 min-w-0 truncate"
                  aria-label="Title"
                />
                <div className="h-4 w-px bg-gray-300 hidden sm:block" />
              </div>

              {/* Center Section - Quick Controls */}
              <div className="hidden md:flex items-center gap-6">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-gray-500">Complexity</label>
                  <input
                    type="range"
                    min="2"
                    max="8"
                    value={complexity}
                    onChange={(e) => {
                      const newComplexity = Number(e.target.value);
                      setComplexity(newComplexity);
                      setCells(
                        generateGrid(
                          newComplexity,
                          colors,
                          minSplitRatio,
                          maxSplitRatio,
                          splitProbability,
                          minSize,
                          seed
                        )
                      );
                    }}
                    className="w-24 h-1.5"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-medium text-gray-500">Border</label>
                  <input
                    type="range"
                    min="2"
                    max="20"
                    value={borderWidth}
                    onChange={(e) => setBorderWidth(Number(e.target.value))}
                    className="w-24 h-1.5"
                  />
                </div>

                <div className="flex items-center gap-1">
                  {colors.map((color, index) => (
                    <div key={index} className="group relative">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => handleColorChange(index, e.target.value)}
                        className="w-6 h-6 rounded-md cursor-pointer border border-gray-200"
                      />
                      {colors.length > 1 && (
                        <button
                          onClick={() => removeColor(index)}
                          className="absolute -top-1 -right-1 hidden group-hover:flex w-3 h-3 items-center justify-center bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="w-2 h-2" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addColor}
                    className="w-6 h-6 flex items-center justify-center rounded-md border border-gray-200 hover:bg-gray-50"
                  >
                    <Plus className="w-3 h-3 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Right Section */}
              <div className="flex items-center gap-1 sm:gap-2">
                <Tooltip content="Advanced Settings">
                  <button
                    onClick={() => setShowControls(!showControls)}
                    className={`p-2 rounded-md transition-colors ${
                      showControls ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <Sliders className="w-4 h-4" />
                  </button>
                </Tooltip>
                <Tooltip content="Generate New Pattern">
                  <button
                    onClick={regenerateGrid}
                    className="p-2 text-gray-500 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </Tooltip>
                <div className="h-4 w-px bg-gray-200 hidden sm:block" />
                <div className="relative">
                  <Tooltip content="Share">
                    <button
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      className={`p-2 rounded-md transition-colors flex items-center gap-1 ${
                        copySuccess ? 'text-green-600' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {copySuccess ? <Check className="w-4 h-4" /> : <Link className="w-4 h-4" />}
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </Tooltip>
                  {showShareMenu && (
                    <div
                      className="absolute right-0 mt-1 py-1 w-40 bg-white rounded-md shadow-lg border border-gray-200 z-50"
                      onMouseLeave={() => setShowShareMenu(false)}
                    >
                      <button
                        onClick={() => {
                          copyUrlToClipboard(false);
                          setShowShareMenu(false);
                        }}
                        className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Copy URL
                      </button>
                      <button
                        onClick={() => {
                          copyUrlToClipboard(true);
                          setShowShareMenu(false);
                        }}
                        className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Copy Fullscreen URL
                      </button>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <Tooltip content="Download">
                    <button
                      onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                      className="p-2 text-gray-500 hover:bg-gray-50 rounded-md transition-colors flex items-center gap-1"
                    >
                      <Download className="w-4 h-4" />
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </Tooltip>
                  {showDownloadMenu && (
                    <div
                      className="absolute right-0 mt-1 py-1 w-32 bg-white rounded-md shadow-lg border border-gray-200 z-50"
                      onMouseLeave={() => setShowDownloadMenu(false)}
                    >
                      <button
                        onClick={() => {
                          downloadSVG();
                          setShowDownloadMenu(false);
                        }}
                        className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                      >
                        SVG
                      </button>
                      <button
                        onClick={() => {
                          downloadRaster('png');
                          setShowDownloadMenu(false);
                        }}
                        className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                      >
                        PNG
                      </button>
                      <button
                        onClick={() => {
                          downloadRaster('webp');
                          setShowDownloadMenu(false);
                        }}
                        className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                      >
                        WebP
                      </button>
                    </div>
                  )}
                </div>
                <Tooltip content="Toggle Fullscreen">
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 text-gray-500 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    {isFullscreen ? (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 3h6m0 0v6m0-6L14 10M9 21H3m0 0v-6m0 6l7-7m4-4l7-7" />
                      </svg>
                    )}
                  </button>
                </Tooltip>
                <div className="h-4 w-px bg-gray-200 hidden sm:block" />
                <div className="hidden sm:flex items-center gap-1">
                  <Tooltip content="View on GitHub">
                    <a
                      href="https://github.com/TimMikeladze"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-500 hover:bg-gray-50 rounded-md transition-colors"
                    >
                      <Github className="w-4 h-4" />
                    </a>
                  </Tooltip>
                  <Tooltip content="Follow on X">
                    <a
                      href="https://twitter.com/linesofcode"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-500 hover:bg-gray-50 rounded-md transition-colors"
                    >
                      <Twitter className="w-4 h-4" />
                    </a>
                  </Tooltip>
                  <Tooltip content="Follow on Bluesky">
                    <a
                      href="https://bsky.app/profile/linesofcode.bsky.social"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-500 hover:bg-gray-50 rounded-md transition-colors"
                    >
                      <ProiconsBluesky className="w-4 h-4" />
                    </a>
                  </Tooltip>
                </div>
              </div>
            </div>

            {/* Mobile Quick Controls */}
            <div className="md:hidden border-t border-gray-200">
              <div className="px-4 py-2 flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-[10px] font-medium text-gray-500">Complexity</label>
                  <input
                    type="range"
                    min="2"
                    max="8"
                    value={complexity}
                    onChange={(e) => {
                      const newComplexity = Number(e.target.value);
                      setComplexity(newComplexity);
                      setCells(
                        generateGrid(
                          newComplexity,
                          colors,
                          minSplitRatio,
                          maxSplitRatio,
                          splitProbability,
                          minSize,
                          seed
                        )
                      );
                    }}
                    className="w-full h-1.5"
                  />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-[10px] font-medium text-gray-500">Border</label>
                  <input
                    type="range"
                    min="2"
                    max="20"
                    value={borderWidth}
                    onChange={(e) => setBorderWidth(Number(e.target.value))}
                    className="w-full h-1.5"
                  />
                </div>
              </div>
              <div className="px-4 pb-2 flex items-center gap-2">
                {colors.map((color, index) => (
                  <div key={index} className="group relative">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => handleColorChange(index, e.target.value)}
                      className="w-8 h-8 rounded-md cursor-pointer border border-gray-200"
                    />
                    {colors.length > 1 && (
                      <button
                        onClick={() => removeColor(index)}
                        className="absolute -top-1 -right-1 hidden group-hover:flex w-4 h-4 items-center justify-center bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addColor}
                  className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 hover:bg-gray-50"
                >
                  <Plus className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Advanced Controls Panel */}
            {showControls && (
              <div className="border-t border-gray-200">
                <div className="px-4 py-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-4">
                  {/* Generation Controls */}
                  <div>
                    <div className="flex justify-between mb-3">
                      <label className="text-xs font-medium text-gray-600">Min Rectangle</label>
                      <span className="text-xs text-gray-400">{minSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="200"
                      step="10"
                      value={minSize}
                      onChange={(e) => {
                        setMinSize(Number(e.target.value));
                        setCells(
                          generateGrid(
                            complexity,
                            colors,
                            minSplitRatio,
                            maxSplitRatio,
                            splitProbability,
                            Number(e.target.value),
                            seed
                          )
                        );
                      }}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-3">
                      <label className="text-xs font-medium text-gray-600">Split Probability</label>
                      <span className="text-xs text-gray-400">{(splitProbability * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.3"
                      max="0.9"
                      step="0.1"
                      value={splitProbability}
                      onChange={(e) => {
                        setSplitProbability(Number(e.target.value));
                        setCells(
                          generateGrid(
                            complexity,
                            colors,
                            minSplitRatio,
                            maxSplitRatio,
                            Number(e.target.value),
                            minSize,
                            seed
                          )
                        );
                      }}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-3">
                      <label className="text-xs font-medium text-gray-600">Min Split Ratio</label>
                      <span className="text-xs text-gray-400">{(minSplitRatio * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="0.4"
                      step="0.05"
                      value={minSplitRatio}
                      onChange={(e) => {
                        setMinSplitRatio(Number(e.target.value));
                        setCells(
                          generateGrid(
                            complexity,
                            colors,
                            Number(e.target.value),
                            maxSplitRatio,
                            splitProbability,
                            minSize,
                            seed
                          )
                        );
                      }}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-3">
                      <label className="text-xs font-medium text-gray-600">Max Split Ratio</label>
                      <span className="text-xs text-gray-400">{(maxSplitRatio * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.6"
                      max="0.9"
                      step="0.05"
                      value={maxSplitRatio}
                      onChange={(e) => {
                        setMaxSplitRatio(Number(e.target.value));
                        setCells(
                          generateGrid(
                            complexity,
                            colors,
                            minSplitRatio,
                            Number(e.target.value),
                            splitProbability,
                            minSize,
                            seed
                          )
                        );
                      }}
                      className="w-full"
                    />
                  </div>

                  {/* Border Controls */}
                  <div>
                    <div className="flex justify-between mb-3">
                      <label className="text-xs font-medium text-gray-600">External Border</label>
                      <span className="text-xs text-gray-400">{externalBorderWidth}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      value={externalBorderWidth}
                      onChange={(e) => setExternalBorderWidth(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-3">
                      <label className="text-xs font-medium text-gray-600">Border Radius</label>
                      <span className="text-xs text-gray-400">{borderRadius}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      value={borderRadius}
                      onChange={(e) => setBorderRadius(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-3">
                      <label className="text-xs font-medium text-gray-600">Border Color</label>
                    </div>
                    <input
                      type="color"
                      value={borderColor}
                      onChange={(e) => setBorderColor(e.target.value)}
                      className="w-full h-7 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content - Mondrian Pattern */}
      <div className="flex-1 bg-gray-200 min-h-0 relative">
        <div
          className="w-full h-full"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <svg
            id="mondrian-svg"
            viewBox="0 0 100 100"
            className="w-full h-full"
            preserveAspectRatio="xMidYMid slice"
            style={{
              border: `${externalBorderWidth}px solid ${borderColor}`,
              borderRadius: `${borderRadius}px`,
            }}
          >
            {cells.map((cell) => (
              <rect
                key={cell.id}
                x={cell.x}
                y={cell.y}
                width={cell.width}
                height={cell.height}
                fill={cell.color}
                stroke={borderColor}
                strokeWidth={borderWidth / 20}
              />
            ))}
          </svg>
          {isFullscreen && showFullscreenHint && (
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-sm text-gray-500 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg pointer-events-none opacity-0 animate-fade-in-out">
              Press ESC or swipe down to exit
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProiconsBluesky(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" {...props}>
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.25}
        d="m2.753 4.514l.434 5.853a3.354 3.354 0 0 0 3.345 3.106h.702l-.51.291a5.94 5.94 0 0 0-2.447 2.677a2.655 2.655 0 0 0 .74 3.17l.972.787c1.226.994 3 1.236 4.085.089c.92-.974 1.32-1.914 1.405-2.128q.018-.046.032-.093l.295-.924c.111-.347.176-.707.194-1.07c.018.363.083.723.194 1.07l.295.924q.014.047.032.093c.084.214.486 1.154 1.405 2.128c1.084 1.147 2.859.906 4.085-.088l.971-.788a2.655 2.655 0 0 0 .741-3.17a5.94 5.94 0 0 0-2.447-2.676l-.51-.292h.702a3.354 3.354 0 0 0 3.345-3.106l.434-5.853c.101-1.363-1.373-2.25-2.5-1.477c-1.726 1.18-3.77 2.698-4.565 3.754c-1.41 1.872-2.117 3.559-2.182 3.719c-.065-.16-.772-1.847-2.182-3.72c-.795-1.055-2.84-2.573-4.564-3.754c-1.128-.772-2.602.115-2.5 1.478"
      ></path>
    </svg>
  );
}

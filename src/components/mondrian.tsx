import {
  Check,
  ChevronDown,
  Download,
  Github,
  HelpCircle,
  Link,
  Paintbrush,
  Plus,
  RefreshCw,
  Sliders,
  Twitter,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { DEFAULT_COLORS, generateGrid, getValidColor, MondrianState } from '@/lib/mondrian';
import { DEFAULT_VALUES, parseUrlParams, stateToUrlParams } from '@/lib/url-params';

import type { SVGProps } from 'react';

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

function AboutDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <h2 className="text-xl font-bold text-gray-900">About</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-4 text-gray-600 space-y-4">
            <p>
              Mondrian is an art generator inspired by the works of{' '}
              <a
                href="https://en.wikipedia.org/wiki/Piet_Mondrian"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Piet Mondrian
              </a>
              , a Dutch artist known for his abstract paintings featuring rectangles, primary colors, and bold black
              lines.
            </p>
            <p>
              This tool allows you to create your own Mondrian-style compositions by adjusting various parameters like
              complexity, colors, and border styles. Each pattern is unique and can be shared or downloaded in multiple
              formats.
            </p>
            <div className="pt-2">
              <div className="text-xs font-medium text-gray-900 mb-3">Follow me at</div>
              <div className="flex items-center gap-3">
                <a
                  href="https://github.com/TimMikeladze"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  <Github className="w-5 h-5" />
                  <span className="text-sm">GitHub</span>
                </a>
                <a
                  href="https://twitter.com/linesofcode"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  <Twitter className="w-5 h-5" />
                  <span className="text-sm">Twitter</span>
                </a>
                <a
                  href="https://bsky.app/profile/linesofcode.bsky.social"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  <ProiconsBluesky className="w-5 h-5" />
                  <span className="text-sm">Bluesky</span>
                </a>
                <a
                  href="https://www.linkedin.com/in/tim-mikeladze"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                  </svg>
                  <span className="text-sm">LinkedIn</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MondrianGenerator() {
  // Get initial state from URL if available
  const initialState = (() => {
    if (typeof window === 'undefined') return {};
    const params = new URLSearchParams(window.location.search);
    const state = params.toString() ? parseUrlParams(params) : {};
    // If we have URL params, ensure we have a seed
    if (params.toString()) {
      state.seed = params.has('seed') ? Number(params.get('seed')) : Math.floor(Math.random() * 1000000);
    }
    return state;
  })();

  const [complexity, setComplexity] = useState(initialState.complexity ?? DEFAULT_VALUES.complexity);
  const [colors, setColors] = useState(initialState.colors ?? DEFAULT_COLORS);
  const [borderWidth, setBorderWidth] = useState(initialState.borderWidth ?? DEFAULT_VALUES.borderWidth);
  const [borderColor, setBorderColor] = useState(initialState.borderColor ?? DEFAULT_VALUES.borderColor);
  const [minSplitRatio, setMinSplitRatio] = useState(initialState.minSplitRatio ?? DEFAULT_VALUES.minSplitRatio);
  const [maxSplitRatio, setMaxSplitRatio] = useState(initialState.maxSplitRatio ?? DEFAULT_VALUES.maxSplitRatio);
  const [splitProbability, setSplitProbability] = useState(
    initialState.splitProbability ?? DEFAULT_VALUES.splitProbability
  );
  const [minSize, setMinSize] = useState(initialState.minSize ?? DEFAULT_VALUES.minSize);
  const [showControls, setShowControls] = useState(false);
  const [externalBorderWidth, setExternalBorderWidth] = useState(
    initialState.externalBorderWidth ?? DEFAULT_VALUES.externalBorderWidth
  );
  const [borderRadius, setBorderRadius] = useState(initialState.borderRadius ?? DEFAULT_VALUES.borderRadius);
  const [seed, setSeed] = useState(initialState.seed ?? Math.floor(Math.random() * 1000000));
  const [copySuccess, setCopySuccess] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(initialState.fullscreen ?? false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [showFullscreenHint, setShowFullscreenHint] = useState(false);
  const [title, setTitle] = useState(initialState.title ?? DEFAULT_VALUES.title);
  const [showAboutDialog, setShowAboutDialog] = useState(false);
  const [isPaintMode, setIsPaintMode] = useState(false);

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
      if (e.key === 'Escape') {
        if (isFullscreen) {
          toggleFullscreen();
        } else {
          // Close all dialogs and menus
          setShowAboutDialog(false);
          setShowShareMenu(false);
          setShowDownloadMenu(false);
          setShowControls(false);
        }
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
    const isDownSwipe = distance > 100; // Minimum 100px swipe down
    const isUpSwipe = distance < -100; // Minimum 100px swipe up

    if ((isDownSwipe || isUpSwipe) && isFullscreen) {
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

  const copyUrlToClipboard = (includeFullscreen: boolean = false, format?: 'svg' | 'png' | 'webp') => {
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
    const url = format
      ? `${window.location.origin}/${format}?${params}`
      : `${window.location.origin}${window.location.pathname}${params ? `?${params}` : ''}`;
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

  // Add click handler for rectangles
  const handleRectClick = (cellId: string) => {
    if (!isPaintMode) return;

    setCells((prevCells) => {
      return prevCells.map((cell) => {
        if (cell.id === cellId) {
          // Get next color index
          const nextColorIndex = (cell.colorIndex + 1) % colors.length;
          return {
            ...cell,
            colorIndex: nextColorIndex,
            color: colors[nextColorIndex]!,
          };
        }
        return cell;
      });
    });
  };

  return (
    <div className="h-[100svh] w-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* Toolbar */}
      {!isFullscreen && (
        <div className="w-full bg-white shadow-md z-10 flex-none border-b border-gray-200">
          <div className="max-w-screen-2xl mx-auto">
            {/* Main Toolbar */}
            <div className="h-12 px-3 flex items-center justify-between gap-1 md:gap-3">
              {/* Left Section */}
              <div className="flex items-center gap-2 min-w-0">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-lg font-bold text-gray-800 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-gray-200 rounded px-1 -ml-1 min-w-0 truncate"
                  aria-label="Title"
                />
                <div className="h-4 w-px bg-gray-300 hidden sm:block" />
              </div>

              {/* Right Section */}
              <div className="flex items-center gap-1">
                {/* Quick Controls - Desktop */}
                <div className="hidden md:flex items-center gap-3 pr-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-medium text-gray-500">Complexity</label>
                    <input
                      type="range"
                      min="2"
                      max="15"
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
                      max="120"
                      value={borderWidth}
                      onChange={(e) => setBorderWidth(Number(e.target.value))}
                      className="w-24 h-1.5"
                    />
                  </div>

                  <div className="flex items-center gap-0.5">
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

                <div className="h-4 w-px bg-gray-200 hidden md:block" />

                <div className="flex items-center gap-1">
                  <Tooltip content="Advanced Settings">
                    <button
                      onClick={() => setShowControls(!showControls)}
                      className={`p-1.5 rounded-md transition-colors ${
                        showControls ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <Sliders className="w-4 h-4" />
                    </button>
                  </Tooltip>
                  <Tooltip
                    content={
                      isPaintMode ? 'Click rectangles to cycle through colors' : 'Enable paint mode to modify colors'
                    }
                  >
                    <button
                      onClick={() => setIsPaintMode(!isPaintMode)}
                      className={`p-1.5 rounded-md transition-colors ${
                        isPaintMode ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <Paintbrush className="w-4 h-4" />
                    </button>
                  </Tooltip>
                  <Tooltip content="Generate New Pattern">
                    <button
                      onClick={regenerateGrid}
                      className="p-1.5 text-gray-500 hover:bg-gray-50 rounded-md transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </Tooltip>
                </div>

                <div className="h-4 w-px bg-gray-200" />

                <div className="flex items-center gap-1">
                  <div className="relative">
                    <Tooltip content="Share">
                      <button
                        onClick={() => setShowShareMenu(!showShareMenu)}
                        className={`p-1.5 rounded-md transition-colors flex items-center gap-1 ${
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
                        <button
                          onClick={() => {
                            copyUrlToClipboard(false, 'svg');
                            setShowShareMenu(false);
                          }}
                          className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Copy SVG URL
                        </button>
                        <button
                          onClick={() => {
                            copyUrlToClipboard(false, 'png');
                            setShowShareMenu(false);
                          }}
                          className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Copy PNG URL
                        </button>
                        <button
                          onClick={() => {
                            copyUrlToClipboard(false, 'webp');
                            setShowShareMenu(false);
                          }}
                          className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Copy WebP URL
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <Tooltip content="Download">
                      <button
                        onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                        className="p-1.5 text-gray-500 hover:bg-gray-50 rounded-md transition-colors flex items-center gap-1"
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
                      className="p-1.5 text-gray-500 hover:bg-gray-50 rounded-md transition-colors"
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
                </div>

                <div className="h-4 w-px bg-gray-200" />

                {/* About Button */}
                <Tooltip content="About">
                  <button
                    onClick={() => setShowAboutDialog(true)}
                    className="p-1.5 text-gray-500 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </Tooltip>
              </div>
            </div>

            {/* Mobile Quick Controls */}
            <div className="md:hidden border-t border-gray-200">
              <div className="px-4 py-2 flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1 flex-1">
                  <div className="flex justify-between">
                    <label className="text-[10px] font-medium text-gray-500">Complexity</label>
                    <span className="text-[10px] text-gray-400">{complexity}</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="15"
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
                  <div className="flex justify-between">
                    <label className="text-[10px] font-medium text-gray-500">Border</label>
                    <span className="text-[10px] text-gray-400">{borderWidth}px</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="120"
                    value={borderWidth}
                    onChange={(e) => setBorderWidth(Number(e.target.value))}
                    className="w-full h-1.5"
                  />
                </div>
              </div>
            </div>

            {/* Advanced Controls Panel */}
            {showControls && (
              <div className="border-t border-gray-200">
                <div className="px-4 py-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-4">
                  {/* Mobile Colors Control */}
                  <div className="md:hidden col-span-2">
                    <div className="flex justify-between mb-3">
                      <label className="text-xs font-medium text-gray-600">Colors</label>
                    </div>
                    <div className="flex items-center gap-2">
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
                              className="absolute -top-1 -right-1 flex w-3.5 h-3.5 items-center justify-center bg-red-500 text-white rounded-full hover:bg-red-600"
                            >
                              <X className="w-2 h-2" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={addColor}
                        className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 hover:bg-gray-50"
                        aria-label="Add color"
                      >
                        <Plus className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {/* Generation Controls */}
                  <div>
                    <div className="flex justify-between mb-3">
                      <label className="text-xs font-medium text-gray-600">Min Rectangle</label>
                      <span className="text-xs text-gray-400">{minSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="1200"
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
                      min="0.1"
                      max="1.0"
                      step="0.05"
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
                      min="0.05"
                      max="0.45"
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
                      min="0.55"
                      max="0.95"
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
                      max="300"
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
                      max="300"
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
            className={`w-full h-full ${isPaintMode ? 'cursor-pointer' : ''}`}
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
                onClick={() => handleRectClick(cell.id)}
                className={isPaintMode ? 'hover:opacity-90 transition-opacity' : ''}
              />
            ))}
          </svg>
          {isFullscreen && showFullscreenHint && (
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-sm text-gray-500 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg pointer-events-none opacity-0 animate-fade-in-out">
              {isPaintMode ? 'Click rectangles to change colors' : 'Press ESC or swipe up/down to exit'}
            </div>
          )}
        </div>
      </div>

      <AboutDialog isOpen={showAboutDialog} onClose={() => setShowAboutDialog(false)} />
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

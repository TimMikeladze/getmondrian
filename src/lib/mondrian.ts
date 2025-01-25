export interface Cell {
  id: string;
  color: string;
  width: number;
  height: number;
  x: number;
  y: number;
  colorIndex: number;
}

export interface MondrianState {
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

export const DEFAULT_COLORS: string[] = ['#ffffff', '#e72f24', '#f0d53c', '#234d9c'];

export function getValidColor(colors: string[], index: number): string {
  if (colors.length === 0) return DEFAULT_COLORS[0]!;
  const safeIndex = Math.max(0, Math.min(index, colors.length - 1));
  return colors[safeIndex]!;
}

export function generateRandomColor(existingColors: string[]): string {
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
export function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateGrid(
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

  // Adjust minSize based on complexity to prevent too small rectangles
  const adjustedMinSize = Math.max(4, minSize / (depth * 2));

  // Use relative units (0-100) for coordinates and sizes
  const subdivide = (x: number, y: number, width: number, height: number, depth: number) => {
    // Stop subdividing if we've reached max depth or random chance
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

    // Decide whether to split vertically or horizontally based on dimensions
    const splitVertically = random() > 0.5;
    const minDimension = splitVertically ? width : height;
    const adjustedMinSizeRatio = adjustedMinSize / 100; // Convert to relative units

    // Only split if the resulting pieces would be larger than the adjusted minimum size
    if (minDimension > adjustedMinSizeRatio * 2) {
      if (splitVertically) {
        const split = width * (minSplitRatio + random() * (maxSplitRatio - minSplitRatio));
        subdivide(x, y, split, height, depth - 1);
        subdivide(x + split, y, width - split, height, depth - 1);
      } else {
        const split = height * (minSplitRatio + random() * (maxSplitRatio - minSplitRatio));
        subdivide(x, y, width, split, depth - 1);
        subdivide(x, y + split, width, height - split, depth - 1);
      }
    } else {
      // If we can't split further, create a cell
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

  // Start with 100x100 relative units
  subdivide(0, 0, 100, 100, depth);
  return cells;
}

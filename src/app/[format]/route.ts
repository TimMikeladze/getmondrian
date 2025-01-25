import { NextRequest } from 'next/server';

import { DEFAULT_COLORS, generateGrid } from '@/lib/mondrian';
import { DEFAULT_VALUES, parseUrlParams } from '@/lib/url-params';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Get parameters from URL or use defaults
  const format = request.nextUrl.pathname.split('/').pop();
  const searchParams = request.nextUrl.searchParams;
  const state = parseUrlParams(searchParams);

  // Generate the Mondrian grid
  const grid = generateGrid(
    state.complexity ?? DEFAULT_VALUES.complexity,
    state.colors ?? DEFAULT_COLORS,
    state.minSplitRatio ?? DEFAULT_VALUES.minSplitRatio,
    state.maxSplitRatio ?? DEFAULT_VALUES.maxSplitRatio,
    state.splitProbability ?? DEFAULT_VALUES.splitProbability,
    state.minSize ?? DEFAULT_VALUES.minSize,
    state.seed ?? Math.floor(Math.random() * 1000000)
  );

  // Generate SVG with explicit width and height
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
    <svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 100 100" preserveAspectRatio="none">
      ${grid
        .map(
          (cell) => `
        <rect
          x="${cell.x}"
          y="${cell.y}" 
          width="${cell.width}"
          height="${cell.height}"
          fill="${cell.color}"
          stroke="${state.borderColor ?? DEFAULT_VALUES.borderColor}"
          stroke-width="${(state.borderWidth ?? DEFAULT_VALUES.borderWidth) / 20}"
        />
      `
        )
        .join('')}
    </svg>`;

  // Return response based on format
  if (format !== 'svg') {
    return new Response('Unsupported format', { status: 400 });
  }

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
    },
  });
}

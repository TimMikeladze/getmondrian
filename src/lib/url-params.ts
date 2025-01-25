import { DEFAULT_COLORS, MondrianState } from './mondrian';

export function parseUrlParams(params: URLSearchParams): Partial<MondrianState> {
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

export function stateToUrlParams(state: MondrianState, forSharing: boolean = false): string {
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

export const DEFAULT_VALUES = {
  complexity: 5,
  borderWidth: 24,
  borderColor: '#121212',
  minSplitRatio: 0.35,
  maxSplitRatio: 0.65,
  splitProbability: 0.5,
  minSize: 150,
  externalBorderWidth: 16,
  borderRadius: 0,
  title: 'Mondrian',
} as const;

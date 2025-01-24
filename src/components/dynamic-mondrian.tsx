import dynamic from 'next/dynamic';

export const DynamicMondrian = dynamic(() => import('./mondrian').then((mod) => mod.MondrianGenerator), {
  ssr: false,
});

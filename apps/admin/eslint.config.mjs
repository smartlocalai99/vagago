import next from 'eslint-config-next';

const config = [
  ...next,
  { ignores: ['.next/**', 'out/**', 'public/sw.js', 'src/env.d.ts'] },
  // Static export has no image optimizer; photos are already resized when uploaded.
  { rules: { '@next/next/no-img-element': 'off' } },
];

export default config;

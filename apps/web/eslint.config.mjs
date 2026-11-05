import next from 'eslint-config-next';

const config = [
  ...next,
  { ignores: ['.next/**', 'out/**', 'public/sw.js', 'src/env.d.ts'] },
  // Photos are already resized when uploaded, so plain img tags with srcset are used.
  { rules: { '@next/next/no-img-element': 'off' } },
];

export default config;

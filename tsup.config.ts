import { defineConfig } from 'tsup';

const shared = {
  format: ['esm', 'cjs'] as ('esm' | 'cjs')[],
  dts: { compilerOptions: { ignoreDeprecations: "6.0" } },
  sourcemap: true,
  target: 'es2020',
  external: ['react', 'react/jsx-runtime'],
};

export default defineConfig([
  {
    ...shared,
    entry: { index: 'src/index.ts' },
    clean: true,
    banner: { js: '"use client";' },
  },
  {
    ...shared,
    entry: { 'consent-mode': 'src/consent-mode.tsx' },
    clean: false,
  },
]);

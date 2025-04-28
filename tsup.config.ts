import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/**/*.ts'],
    format: 'cjs',
    outDir: 'dist/cjs',
    dts: false,
    clean: true,
    bundle: false,
  },
  {
    entry: ['src/**/*.ts'],
    format: 'esm',
    outDir: 'dist/esm',
    dts: true,
    clean: true,
    bundle: false,
  }
]);
import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/**/*.ts'],
    format: 'cjs',
    outDir: 'dist',
    dts: true,
    clean: true,
    bundle: false,
  }
]);
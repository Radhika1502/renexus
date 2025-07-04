import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.tsx'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ['react', 'react-dom'],
  outDir: 'dist',
  minify: false,
  bundle: true,
  skipNodeModulesBundle: true,
  target: 'es2017',
  tsconfig: './tsconfig.json',
  silent: false,
  onSuccess: 'echo Build successful!',
  outExtension({ format }) {
    return {
      js: format === 'esm' ? '.mjs' : '.js',
    };
  },
});

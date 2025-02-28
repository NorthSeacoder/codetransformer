import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  shims: false,
  dts: true,
  clean: true,
  target: 'es2022',
  external: ['@babel/core'],
  noExternal: ['@babel/helper-plugin-utils']
})
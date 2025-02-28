import { defineConfig } from 'tsup'
const env = process.env.NODE_ENV;
console.log(env);
export default defineConfig({
  entry: [
    'src/index.ts',
  ],
  sourcemap: env === 'development',
  minify: env === 'production',
  watch: env === 'development',
  format: ['cjs'],
  shims: false,
  dts: false,
  target: 'es2022', 
  external: [
    'vscode',
    '@babel/preset-typescript'
  ],
  noExternal:['@nsea/depseeker']
})

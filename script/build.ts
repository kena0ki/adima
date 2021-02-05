import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

const argv = yargs(hideBin(process.argv)).argv;

require('esbuild').build({
  entryPoints: [argv.entryPoints || 'src/index.ts'],
  bundle: true,
  minify: true,
  sourcemap: true,
  target: ['es2019'],
  outdir: argv.outdir || 'dist',
  format: 'esm',
}).catch(() => process.exit(1));


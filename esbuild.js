const esbuild = require('esbuild');
const isWatch = process.argv.includes('--watch');

async function build() {
  const extensionCtx = await esbuild.context({
    entryPoints: {
      extension: './src/extension/extension.ts',
    },
    bundle: true,
    platform: 'node',
    target: 'node18',
    outdir: 'dist',
    external: ['vscode'],
    format: 'cjs',
    sourcemap: true,
    minify: !isWatch,
    logLevel: 'silent',
    define: {
      'process.env.NODE_ENV': isWatch ? '"development"' : '"production"',
    },
  });

  const webviewCtx = await esbuild.context({
    entryPoints: {
      webview: './src/webview/App.tsx',
    },
    bundle: true,
    platform: 'browser',
    target: 'es2020',
    outdir: 'dist',
    format: 'iife',
    sourcemap: true,
    minify: !isWatch,
    logLevel: 'silent',
    jsx: 'automatic',
    jsxImportSource: 'react',
    define: {
      'process.env.NODE_ENV': isWatch ? '"development"' : '"production"',
    },
  });

  if (isWatch) {
    await extensionCtx.watch();
    await webviewCtx.watch();
    console.log('[esbuild] Watching for changes...');
  } else {
    await extensionCtx.rebuild();
    await webviewCtx.rebuild();
    await extensionCtx.dispose();
    await webviewCtx.dispose();
    console.log('[esbuild] Build complete.');
  }
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});

import * as fs from 'fs';
import * as path from 'path';

// TODO: Allow customization, roughly following:
// https://developers.google.com/web/tools/workbox/modules/workbox-build#injectmanifest_mode
// const defaultOptions = {
//   globIgnores: ['**/*.{map}'],
//   globPatterns: ['**/*']
// };

export = function serviceWorkerManifestPlugin(bundler: any) {
  bundler.on('bundled', (mainBundle: any) => {
    const manifest = buildManifest(bundler, mainBundle);
    const manifestSource = `\n;this.__precacheManifest = ${JSON.stringify(manifest)};`;

    visitBundles(mainBundle, bundle => {
      if (bundle.type !== 'js') return;
      let contents = fs.readFileSync(bundle.name, { encoding: 'utf-8' });
      if (!contents.includes('__precacheManifest')) return;

      // Inject on last line, or right before a source mapping directive.
      const index = contents.lastIndexOf('\n//# ');
      if (index >= 0) {
        contents = contents.slice(0, index) + manifestSource + contents.slice(index);
      } else {
        contents += manifestSource;
      }

      fs.writeFileSync(bundle.name, contents);
    });
  });
};

function visitBundles(bundle: any, callback: (bundle: any) => void) {
  callback(bundle);
  for (const childBundle of bundle.childBundles) {
    visitBundles(childBundle, callback);
  }
}

function buildManifest(bundler: any, mainBundle: any) {
  const { outDir, publicURL } = bundler.options;
  const manifest = [] as { url: string; revision: string }[];

  visitBundles(mainBundle, bundle => {
    if (bundle.type === 'map') return;

    manifest.push({
      url: publicURL + path.relative(outDir, bundle.name),
      revision: bundle.getHash()
    });
  });

  return manifest;
}

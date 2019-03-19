import * as fs from 'fs';
import * as path from 'path';

type Manifest = { url: string; revision: string }[];

export = function serviceWorkerManifestPlugin(bundler: any) {
  bundler.on('bundled', (mainBundle: any) => {
    const manifest = buildManifest(bundler, mainBundle);

    visitBundles(mainBundle, bundle => {
      if (bundle.type !== 'js') return;
      const contents = fs.readFileSync(bundle.name, { encoding: 'utf-8' });
      if (!contents.includes('__precacheManifest')) return;

      injectManifest(bundler, bundle.name, contents, manifest);
    });
  });
};

function visitBundles(bundle: any, callback: (bundle: any) => void) {
  callback(bundle);
  for (const childBundle of bundle.childBundles) {
    visitBundles(childBundle, callback);
  }
}

function bundleUrl(bundler: any, bundlePath: string) {
  const { outDir, publicURL } = bundler.options;
  return publicURL + path.relative(outDir, bundlePath);
}

function buildManifest(bundler: any, mainBundle: any) {
  const manifest: Manifest = [];

  visitBundles(mainBundle, bundle => {
    if (bundle.type === 'map') return;

    manifest.push({
      url: bundleUrl(bundler, bundle.name),
      revision: bundle.getHash()
    });
  });

  return manifest;
}

function injectManifest(bundler: any, bundlePath: string, contents: string, fullManifest: Manifest) {
  const url = bundleUrl(bundler, bundlePath);
  const manifest = fullManifest.filter(m => m.url !== url);

  const manifestSource = `\n;this.__precacheManifest = ${JSON.stringify(manifest)};`;

  // Inject on last line, or right before a source mapping directive.
  const index = contents.lastIndexOf('\n//# ');
  if (index >= 0) {
    contents = contents.slice(0, index) + manifestSource + contents.slice(index);
  } else {
    contents += manifestSource;
  }

  fs.writeFileSync(bundlePath, contents);
}

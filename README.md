# @palactix/publisher-widget

> Embeddable publisher widget for Palactix — schedule and publish social media posts from any website.

Documentation: https://palactix.com/docs/publisher-widget

This package provides two distribution formats:

- ESM (recommended for bundlers / modern apps): `dist/esm/index.js` — import from `@palactix/publisher-widget`.
- Legacy IIFE (drop-in CDN): `dist/iife/loader.min.js` — exposes `window.PalactixWidget`.

--

## Install

Using npm:

```bash
npm install @palactix/publisher-widget
```

## Quick usage (ESM)

This example shows a typical usage in a modern app.

```js
import { init } from '@palactix/publisher-widget';

const widget = init({
  token: 'INIT_TOKEN_FROM_SERVER',
  appUrl: 'https://app.palactix.com',
  primary: '#0ea5a4',
  mode: 'modal', // 'modal' | 'drawer'
  onReady() { console.log('widget ready'); },
  onPublished(result) { console.log('published', result); },
  onClose() { console.log('closed'); }
});

// open publisher UI (the library does not inject a button)
widget.publish({ caption: 'Hello world', media: [] });

// destroy when finished
widget.destroy();
```

Notes:
- `init(config)` returns an object with `publish(preFill?)` and `destroy()` methods.
- `publish(preFill?)` accepts a pre-fill payload `{ caption?: string, media?: Array<{url,type,alt_text}> }`.

## Quick usage (CDN / legacy)

Use the IIFE file via a CDN (jsDelivr / unpkg) and call `window.PalactixWidget.init(...)`:

```html
<script src="https://cdn.jsdelivr.net/npm/@palactix/publisher-widget@0.1.0/dist/iife/loader.min.js"></script>
<script>
  const widget = window.PalactixWidget.init({
    token: 'INIT_TOKEN_FROM_SERVER',
    appUrl: 'https://app.palactix.com'
  });

  // open the UI
  widget.publish({ caption: 'Published from CDN' });
</script>
```

Unpkg example:

```
https://unpkg.com/@palactix/publisher-widget@0.1.0/dist/iife/loader.min.js
```

## Widget postMessage integration

When used in a popup or cross-origin embedding, the widget will post `PALACTIX_WIDGET_PUBLISHED` and `PALACTIX_WIDGET_READY` messages to the parent window. Example parent listener:

```js
window.addEventListener('message', (ev) => {
  if (!ev?.data) return;
  if (ev.data.type === 'PALACTIX_WIDGET_PUBLISHED') {
    console.log('Published result', ev.data.post);
  }
  if (ev.data.type === 'PALACTIX_WIDGET_READY') {
    console.log('Widget ready');
  }
});
```

To pre-fill the composer from the host page, post a `PALACTIX_WIDGET_CONFIG` message to the widget iframe (or popup):

```js
widgetIframe.contentWindow.postMessage({ type: 'PALACTIX_WIDGET_CONFIG', payload: { caption: 'Hello', media: [] } }, iframeOrigin);
```

## API Reference (brief)

- `init(config: PublisherConfig): PublisherWidget`
  - `PublisherConfig` fields:
    - `token` (string) — init token from your server (required)
    - `appUrl` (string) — base app URL (optional)
    - `primary` (string) — CSS color for theming (optional)
    - `mode?: 'modal'|'drawer'` — display mode (optional)
    - `onReady?: () => void` — called when widget is ready
    - `onPublished?: (result) => void` — called when publish completes
    - `onClose?: () => void` — called when widget closes

- `publisher.publish(preFill?: { caption?: string; media?: Array })` — opens the composer and optionally seeds fields.
- `publisher.destroy()` — cleans up the widget and listeners.

## Building from source

```bash
cd packages/publisher-widget || cd palactix-widgets/publisher-widget
npm ci
npm run typecheck
npm run build
```

The `dist/` directory will contain:

- `dist/esm/index.js` — ESM entry for bundlers (used when importing the package).
- `dist/iife/loader.min.js` — standalone loader for CDN usage. It attaches `window.PalactixWidget`.

## Publishing to npm

Prepublish checks are run automatically by `prepublishOnly` (typecheck + build). To publish manually:

```bash
npm login
npm version patch
npm publish --access public
```

After publishing the package, the IIFE artifact is available via jsDelivr/unpkg:

```
https://cdn.jsdelivr.net/npm/@palactix/publisher-widget@<version>/dist/iife/loader.min.js
```

## CDN Self-Hosting (optional)

If you need a custom domain or stricter caching controls, upload `dist/iife/loader.min.js` to S3/CloudFront or your CDN of choice. Version the path to avoid cache invalidation.

## Contributing

Contributions are welcome — open a PR with tests and a short description. Follow repo linting and run `npm run typecheck` before submitting.

## License

MIT

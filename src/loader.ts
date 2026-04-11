/**
 * @palactix/publisher-widget — IIFE CDN loader
 *
 * Drop-in script:
 *   <script src="https://widgets.palactix.com/publisher/v1/loader.min.js"></script>
 *
 * Usage:
 *   const widget = PalactixWidget.init({ token: serverToken });
 *   myBtn.addEventListener('click', () => {
 *     widget.publish({ caption: 'Hello!', media: [] });
 *   });
 */

import { init } from './widget';
import type { PublisherConfig, PublisherWidget, PublishPreFill, PublishMedia } from './types';

// Export init as a runtime value so esbuild's IIFE return object is { init }.
// The build.mjs footer then correctly pins window.PalactixWidget = { init }.
export { init };
export type { PublisherConfig, PublisherWidget, PublishPreFill, PublishMedia };

// Auto-initialise loader via `data-palactix-widget` elements. When an element
// contains `data-palactix-widget` the loader will call `init({...})` and
// inject a small launcher button that calls `widget.publish()` on click.
//
// Supported attributes:
// - `data-token` (required) — the init token returned by your server.
// - `data-app-url` (optional) — override widget app URL for local dev.
// - `data-primary` (optional) — theme color.
// - `data-mode` (optional) — 'modal' | 'drawer'
// - `data-button-text` (optional) — launcher button label
// - `data-button-class` (optional) — CSS class to apply to the launcher
if (typeof document !== 'undefined') {
	const parseConfigFromElement = (el: Element): PublisherConfig | null => {
		const e = el as HTMLElement;
		const token = e.getAttribute('data-token') ?? e.getAttribute('data-init-token');
		if (!token) return null;
		const cfg: PublisherConfig = { token } as PublisherConfig;
		const appUrl = e.getAttribute('data-app-url');
		const primary = e.getAttribute('data-primary');
		const mode = e.getAttribute('data-mode');
		if (appUrl) cfg.appUrl = appUrl;
		if (primary) cfg.primary = primary;
		if (mode === 'drawer' || mode === 'modal') cfg.mode = mode as 'modal' | 'drawer';
		return cfg;
	};

	const attachLauncher = (el: HTMLElement, widgetInstance: PublisherWidget) => {
		let btn = el.querySelector<HTMLButtonElement>('button[data-palactix-launcher]');
		if (!btn) {
			btn = document.createElement('button');
			btn.setAttribute('data-palactix-launcher', '1');
			btn.type = 'button';
			btn.textContent = el.getAttribute('data-button-text') ?? 'Publish';
			const cls = el.getAttribute('data-button-class');
			if (cls) btn.className = cls;
			el.appendChild(btn);
		}
		btn.addEventListener('click', () => widgetInstance.publish());
	};

	const autoInitElement = (el: Element) => {
		const cfg = parseConfigFromElement(el);
		if (!cfg) return;
		try {
			const widgetInstance = init(cfg);
			attachLauncher(el as HTMLElement, widgetInstance);
			(el as any).__palactix_widget = widgetInstance;
		} catch (err) {
			// Keep the loader robust — don't throw from auto-init.
			// eslint-disable-next-line no-console
			console.error('[PalactixWidget] auto-init failed', err);
		}
	};

	const runAutoInit = () => document.querySelectorAll('[data-palactix-widget]').forEach(autoInitElement);

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', runAutoInit);
	} else {
		runAutoInit();
	}
}

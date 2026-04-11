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

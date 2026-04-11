/**
 * @palactix/publisher-widget — ESM entry point (npm package)
 *
 * import { init } from '@palactix/publisher-widget';
 *
 * const widget = init({ token: serverToken });
 * myBtn.addEventListener('click', () => widget.publish({ caption: 'Hello!' }));
 */

export { init } from './widget';
export type { PublisherConfig, PublisherWidget, PublishPreFill, PublishMedia } from './types';

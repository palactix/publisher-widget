/**
 * PalactixWidget — iframe publisher widget.
 *
 * Modes:
 *  - "modal"  (default) — centred dialog with backdrop blur + scale-in animation.
 *  - "drawer"           — slide-in panel from the right (right sidebar).
 *
 * Lifecycle:
 *  1. init(config) → creates a hidden overlay DOM tree + pre-loads the iframe.
 *  2. instance.publish(preFill?) → shows the panel and sends PALACTIX_WIDGET_CONFIG.
 *  3. Widget sends PALACTIX_WIDGET_CLOSE → panel hides, onClose fires.
 *  4. Widget sends PALACTIX_WIDGET_PUBLISHED → onPublished fires, panel hides.
 *  5. instance.destroy() → removes all DOM nodes and event listeners.
 *
 * @example
 *   const widget = PalactixWidget.init({ token: serverToken });
 *   myBtn.addEventListener('click', () => {
 *     widget.publish({ caption: 'Hello!', media: [] });
 *   });
 */

import type { PublisherConfig, PublisherWidget, PublishPreFill } from './types';

const PROD_APP_URL = 'https://widgets.palactix.com/';

const MSG_READY     = 'PALACTIX_WIDGET_READY';
const MSG_CLOSE     = 'PALACTIX_WIDGET_CLOSE';
const MSG_PUBLISHED = 'PALACTIX_WIDGET_PUBLISHED';
const MSG_CONFIG    = 'PALACTIX_WIDGET_CONFIG';

export function init(config: PublisherConfig): PublisherWidget {
  const appUrl    = config.appUrl ?? PROD_APP_URL;
  const appOrigin = new URL(appUrl).origin;
  const mode      = config.mode ?? 'modal';

  // ── Build iframe hash (never exposes token in query string) ────────────
  const hashParts = [`token=${encodeURIComponent(config.token)}`];
  if (config.primary) hashParts.push(`primary=${encodeURIComponent(config.primary)}`);
  const iframeHash = `#${hashParts.join('&')}`;

  // ── DOM: overlay > backdrop + container > iframe ───────────────────────
  const overlayEl = document.createElement('div');
  overlayEl.style.cssText = [
    'position:fixed',
    'inset:0',
    'z-index:2147483646',
    'opacity:0',
    'pointer-events:none',
    'transition:opacity 200ms ease',
    // Center modal
    mode === 'modal' ? 'display:flex;align-items:center;justify-content:center;padding:16px' : '',
  ].filter(Boolean).join(';');

  const backdropEl = document.createElement('div');
  backdropEl.setAttribute('aria-hidden', 'true');
  backdropEl.style.cssText = [
    'position:absolute',
    'inset:0',
    'background:rgba(0,0,0,0.3)',
    'backdrop-filter:blur(4px)',
    '-webkit-backdrop-filter:blur(4px)',
  ].join(';');
  // Backdrop click intentionally does NOT close — only the close icon or
  // a successful publish can dismiss the widget.

  const containerEl = document.createElement('div');

  if (mode === 'modal') {
    containerEl.style.cssText = [
      'position:relative',
      'width:100%',
      'max-width:480px',
      'max-height:85vh',
      'border-radius:16px',
      'overflow:hidden',
      'box-shadow:0 8px 40px rgba(0,0,0,0.2)',
      // Scale-in animation
      'transform:scale(0.95)',
      'transition:transform 200ms ease-out',
    ].join(';');
  } else {
    // drawer
    containerEl.style.cssText = [
      'position:absolute',
      'top:0',
      'right:0',
      'height:100%',
      'width:min(400px,100vw)',
      'box-shadow:-4px 0 30px rgba(0,0,0,0.15)',
      'border-radius:16px 0 0 16px',
      // Slide-in animation
      'transform:translateX(100%)',
      'transition:transform 200ms ease-out',
      'overflow:hidden',
    ].join(';');
  }

  const iframeEl = document.createElement('iframe');
  iframeEl.src           = `${appUrl}/${iframeHash}`;
  iframeEl.title         = 'Publisher Widget';
  iframeEl.style.cssText = mode === 'modal'
    ? 'width:100%;height:85vh;border:none;display:block;'
    : 'width:100%;height:100%;border:none;display:block;';
  iframeEl.setAttribute('allowtransparency', 'true');

  containerEl.appendChild(iframeEl);
  overlayEl.appendChild(backdropEl);
  overlayEl.appendChild(containerEl);
  document.body.appendChild(overlayEl);

  // ── Open / close helpers ───────────────────────────────────────────────
  function showPanel(): void {
    overlayEl.style.opacity       = '1';
    overlayEl.style.pointerEvents = 'auto';
    containerEl.style.transform   = mode === 'modal' ? 'scale(1)' : 'translateX(0)';
  }

  function hidePanel(): void {
    overlayEl.style.opacity       = '0';
    overlayEl.style.pointerEvents = 'none';
    containerEl.style.transform   = mode === 'modal' ? 'scale(0.95)' : 'translateX(100%)';
    config.onClose?.();
  }

  // ── postMessage listener ───────────────────────────────────────────────
  let pendingPreFill: PublishPreFill | null = null;

  function onMessage(event: MessageEvent): void {
    if (event.origin !== appOrigin) return;
    const type = (event.data as { type?: string })?.type;

    if (type === MSG_READY) {
      config.onReady?.();
      if (pendingPreFill !== null && iframeEl.contentWindow) {
        iframeEl.contentWindow.postMessage(
          { type: MSG_CONFIG, payload: pendingPreFill },
          appOrigin,
        );
        pendingPreFill = null;
      }
    }

    if (type === MSG_CLOSE) {
      hidePanel();
    }

    if (type === MSG_PUBLISHED) {
      const post = (event.data as { post?: unknown }).post;
      config.onPublished?.(post);
      hidePanel();
    }
  }

  window.addEventListener('message', onMessage);

  // ── Public API ─────────────────────────────────────────────────────────
  return {
    publish(preFill?: PublishPreFill): void {
      showPanel();
      const payload = preFill ?? {};
      if (iframeEl.contentWindow) {
        iframeEl.contentWindow.postMessage({ type: MSG_CONFIG, payload }, appOrigin);
      } else {
        pendingPreFill = payload;
      }
    },

    destroy(): void {
      window.removeEventListener('message', onMessage);
      overlayEl.remove();
    },
  };
}

// Global assignment is handled by the IIFE loader (loader.ts + build.mjs footer).

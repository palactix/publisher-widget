<?php
/**
 * Publisher Widget — Local PHP Test Page
 *
 * HOW TO USE
 * ----------
 * 1. Fill in the four config values below.
 * 2. Start PHP's built-in server from palactix-widgets/:
 *        php -S localhost:8080
 * 3. Open: http://localhost:8080/publisher/test/index.php
 *
 * PREREQUISITES
 * -------------
 * - palactix-system (Laravel) running — default: http://localhost:8000
 * - publisher-app running on port 3001:
 *       cd publisher-app && npm run dev -- -p 3001
 * - publisher loader built:
 *       cd publisher && npm run build
 */

// ─── Config — fill these in ──────────────────────────────────────────────────

/** Widget ID (wgt_xxx from the developer portal → Widgets → Settings). */
$WIDGET_ID = 'wgt_MuJK5ab4YnRffY6TnRU81BbS';

/**
 * Widget Secret — generated at creation or after rotating the secret.
 * Never expose this in the browser. Only use it server-side.
 */
$WIDGET_SECRET = 'ij4Tc8xsZjdFnGUpYkLKv1ZjpSsu8XimtGEhmfbk9Zv7k6NYe8s1IONm0pwdKymN';

/**
 * A stable ID that identifies who is opening the widget (your end-user).
 * Can be a user ID, email, or any opaque string from your system.
 */
$EXTERNAL_USER_ID = 'test-user-001';

/** Laravel API base URL — no trailing slash. */
$API_BASE = 'http://127.0.0.1:8000';

/** publisher-app origin — where the iframe UI is running locally. */
$APP_URL = 'http://localhost:3001';

// ─── Token exchange ───────────────────────────────────────────────────────────

$initToken = null;
$error     = null;

$endpoint = "{$API_BASE}/widget/tokens";

$payload = json_encode([
    'external_user_id' => $EXTERNAL_USER_ID,
    'ttl'              => 300,  // 5 minutes
    'meta'             => [
        'name'  => 'Test User',
        'email' => 'test@example.com',
    ],
], JSON_THROW_ON_ERROR);

$basicCredential = base64_encode("{$WIDGET_ID}:{$WIDGET_SECRET}");

$ctx = stream_context_create([
    'http' => [
        'method'        => 'POST',
        'header'        => implode("\r\n", [
            'Content-Type: application/json',
            'Accept: application/json',
            "Authorization: Basic {$basicCredential}",
        ]),
        'content'       => $payload,
        'ignore_errors' => true,
        'timeout'       => 10,
    ],
]);

$raw = @file_get_contents($endpoint, false, $ctx);

if ($raw === false) {
    $error = 'Could not reach the API server. Is palactix-system running?';
} else {
    $response = json_decode($raw, true);
    $status   = (int) (explode(' ', $http_response_header[0] ?? 'HTTP/1.1 0')[1] ?? 0);

    if ($status >= 200 && $status < 300 && isset($response['init_token'])) {
        $initToken = $response['init_token'];
    } else {
        $message = $response['message'] ?? ($raw ?: 'Unknown error');
        $error   = "API error (HTTP {$status}): " . htmlspecialchars($message, ENT_QUOTES, 'UTF-8');
    }
}

// Safely embed JSON values into the HTML page
$jsAppUrl = json_encode($APP_URL,   JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP);
$jsToken  = json_encode($initToken, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP);

?><!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Publisher Widget — PHP Test</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: #f5f5f5;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card {
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      padding: 2rem;
      width: 100%;
      max-width: 460px;
    }
    h1 { font-size: 1.2rem; font-weight: 600; color: #111; margin-bottom: 0.5rem; }
    p  { font-size: 0.875rem; color: #666; margin-bottom: 1.5rem; line-height: 1.6; }
    .error {
      margin-bottom: 1.5rem;
      padding: 0.75rem 1rem;
      background: #fff5f5;
      border: 1px solid #fed7d7;
      border-radius: 8px;
      font-size: 0.85rem;
      color: #c53030;
      line-height: 1.5;
    }
    .success-badge {
      display: inline-block;
      margin-bottom: 1rem;
      padding: 0.2rem 0.6rem;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 6px;
      font-size: 0.75rem;
      color: #166534;
      font-weight: 500;
    }
    .publish-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: #6366f1;
      color: #fff;
      border: none;
      border-radius: 10px;
      font-family: inherit;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: opacity 0.15s;
    }
    .publish-btn:hover { opacity: 0.85; }
    .publish-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .note {
      margin-top: 1.5rem;
      padding: 0.75rem 1rem;
      background: #fafafa;
      border: 1px solid #e5e5e5;
      border-radius: 8px;
      font-size: 0.8rem;
      color: #888;
      line-height: 1.7;
    }
    .note strong { color: #444; }
    code { font-family: monospace; background: #f0f0f0; padding: 1px 4px; border-radius: 3px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Publisher Widget — PHP Test</h1>

    <?php if ($error): ?>
      <div class="error">
        <strong>Token exchange failed</strong><br />
        <?= $error ?>
        <br /><br />
        Check the config values at the top of <code>index.php</code>.
      </div>
    <?php else: ?>
      <span class="success-badge">Init token acquired</span>
      <p>
        Token was exchanged server-side. Use your own button to open the widget
        with optional pre-filled caption and media.
      </p>
    <?php endif; ?>

    <!--
      YOUR OWN BUTTON — the widget does not inject any button.
      Clicking this calls widget.publish() on the instance returned by init().
    -->
    <button
        
      class="publish-btn"
      <?= $initToken ? '' : 'disabled' ?>
    >
      Publish Post
    </button>


    <button
      id="publish-btn-2"
      class="publish-btn"
      <?= $initToken ? '' : 'disabled' ?>
    >
      Publish another Post
    </button>

    <div class="note">
      <strong>External user:</strong> <code><?= htmlspecialchars($EXTERNAL_USER_ID, ENT_QUOTES, 'UTF-8') ?></code><br />
      <strong>Widget:</strong> <code><?= htmlspecialchars($WIDGET_ID, ENT_QUOTES, 'UTF-8') ?></code><br />
      <strong>publisher-app:</strong> <code><?= htmlspecialchars($APP_URL, ENT_QUOTES, 'UTF-8') ?></code><br />
      <strong>Token status:</strong> <?= $initToken ? '<span style="color:#166534">OK (5 min TTL)</span>' : '<span style="color:#c53030">Not acquired</span>' ?>
    </div>
  </div>

  <!--
    Loader is served from palactix-widgets/ root.
    Run PHP server from palactix-widgets/:  php -S localhost:8080
    Then open: http://localhost:8080/publisher/test/index.php
  -->
  <script src="/publisher/dist/iife/loader.min.js"></script>
  <?php if ($initToken): ?>
  <script>
    // 1. Call init() ONCE on page load — pre-loads the iframe in the background.
    var widget = PalactixWidget.init({
      token:       <?= $jsToken ?>,
      appUrl:      <?= $jsAppUrl ?>,
      onReady:     function() { console.log('[test] Widget ready'); },
      onClose:     function() { console.log('[test] Widget closed'); },
      onPublished: function(post) { console.log('[test] Published:', post); },
    });

    // 2. YOUR button calls widget.publish() with optional pre-fill.
    // document.getElementById('publish-btn').addEventListener('click', function() {
    //   widget.publish({
    //     caption: 'Check out our latest update! 🚀',
    //     media: [
    //         {
    //             type: 'image',
    //             url: 'https://jitendra.dev/storage/post-files/GtlJ1JViIe6athuuOTbJdhRzQdTtZ0-metaR2VtaW5pX0dlbmVyYXRlZF9JbWFnZV8yZmdnb3cyZmdnb3cyZmdnLnBuZw==-.png',
    //             alt: 'Placeholder image with "Hello World" text',
    //         }
    //     ],
    //   });
    // });


    document.querySelectorAll('.publish-btn').forEach(function(btn, index) {
      btn.addEventListener('click', function() {
        widget.publish({
          caption: 'Here is another post with the same token! 🎉' + index,
        });
      });
    });
  </script>
  <?php endif; ?>
</body>
</html>

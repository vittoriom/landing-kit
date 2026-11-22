# landing-kit

Shared zero-dependency JS, CSS, component renderers, and starter template for local-first app showcase landing pages (`finances-app`, `travel-app`, `paperless-app`, and future apps).

## Quickstart for a New Landing Page

Copy the [`template/`](./template) folder into your new repo and replace `{{APP_NAME}}`, `{{APP_SLUG}}`, `{{REPO_NAME}}`, your accent colors in `index.css`, and your screenshots in `assets/`.

## Usage (via jsDelivr CDN)

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/vittoriom/landing-kit@v1.2.0/landing-core.css">
<script src="https://cdn.jsdelivr.net/gh/vittoriom/landing-kit@v1.2.0/landing-core.js"></script>
<script>
  LandingKit.init({
    theme: { storageKey: 'travel_theme' },
    i18n: { storageKey: 'travel_lang' },
    release: {
      repoOwner: 'vittoriom',
      repoName: 'travel',
      defaultVersion: 'v0.2.0',
      showSize: true,
    },
  });
</script>
```

## Shared HTML Renderers (`v1.2.0+`)

### 1. Developer Creator Card
Drop an empty container anywhere in your footer — `LandingKit.init()` automatically renders the developer card, infers the repo link from `release` (or `data-repo`), and localizes all labels (`EN`/`IT`) using built-in default translations:

```html
<div data-lk-creator-card></div>
```

Optional attributes: `data-repo="owner/repo"`, `data-fallback-avatar="assets/icon.png"`, `data-hide-title="true"`.

### 2. macOS DMG + Gatekeeper Install Guide
Drop an empty container inside your `#install` section — `LandingKit.init()` renders the 3-step DMG + `xattr -cr` terminal card and automatically wires up i18n and the copy-to-clipboard button:

```html
<div data-lk-install-guide
     data-app-name="Travel Companion"
     data-app-bundle="Travel Companion.app"
     data-size-hint="~15 MB"></div>
```

You can also append app-specific steps via `installGuide.extraSteps` in `LandingKit.init(...)`.

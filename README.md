# landing-kit

Shared zero-dependency JS & CSS core for local-first app showcase landing pages (`finances-app`, `travel-app`, `paperless-app`).

## Usage (via jsDelivr CDN)

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/vittoriom/landing-kit@v1.0.0/landing-core.css">
<script src="https://cdn.jsdelivr.net/gh/vittoriom/landing-kit@v1.0.0/landing-core.js"></script>
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

/* {{APP_NAME}} Landing Page — powered by vittoriom/landing-kit */
LandingKit.init({
  theme: { storageKey: '{{APP_SLUG}}_theme' },
  i18n: { storageKey: '{{APP_SLUG}}_lang' },
  release: {
    repoOwner: 'vittoriom',
    repoName: '{{REPO_NAME}}',
    defaultVersion: 'v1.0.0',
    showSize: true,
    defaultSizeLabel: '~15 MB',
  },
});

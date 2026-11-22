/* ============================================================
   Landing Kit — Shared Vanilla JS Core for Local-First App Landing Pages
   Zero dependencies. Supports Theme, i18n, GitHub Release Fetcher,
   FAQ Accordion, Mobile Menu, and Copy-to-Clipboard.
   ============================================================ */
(function (global) {
  'use strict';

  let activeLang = 'en';
  const langListeners = [];

  function getLang() {
    return activeLang;
  }

  function onLanguageChange(fn) {
    if (typeof fn === 'function') {
      langListeners.push(fn);
    }
  }

  /* ------------------------------------------------------------
     1. Theme Management (Dark / Light)
     ------------------------------------------------------------ */
  function initTheme(options) {
    if (!options || options.enabled === false) return;
    const storageKey = options.storageKey || 'app_theme';
    const toggleId = options.toggleId || 'theme-toggle-btn';
    const iconSelector = options.iconSelector || '.theme-icon';

    const toggleBtn = document.getElementById(toggleId);
    const storedTheme = safeGetItem(storageKey);
    const prefersDark =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = storedTheme || options.defaultTheme || (prefersDark ? 'dark' : 'light');

    applyTheme(initialTheme, iconSelector);

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next, iconSelector);
        safeSetItem(storageKey, next);
      });
    }
  }

  function applyTheme(theme, iconSelector) {
    document.documentElement.setAttribute('data-theme', theme);
    const icon = document.querySelector(iconSelector || '.theme-icon');
    if (icon) {
      icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  }

  /* ------------------------------------------------------------
     2. Localization (i18n)
     ------------------------------------------------------------ */
  function initLanguage(options) {
    const cfg = options || {};
    const storageKey = cfg.storageKey || 'app_lang';
    const supported = cfg.supported || ['en', 'it'];
    const fallback = cfg.fallback || 'en';

    const storedLang = safeGetItem(storageKey);
    const browserLang = (navigator.language || navigator.userLanguage || fallback).slice(0, 2);
    activeLang = storedLang && supported.includes(storedLang)
      ? storedLang
      : supported.includes(browserLang)
      ? browserLang
      : fallback;

    updateLanguageUI(activeLang, fallback);

    document.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const selected = btn.getAttribute('data-lang');
        if (selected && selected !== activeLang && supported.includes(selected)) {
          activeLang = selected;
          safeSetItem(storageKey, activeLang);
          updateLanguageUI(activeLang, fallback);
          langListeners.forEach((cb) => {
            try {
              cb(activeLang);
            } catch (e) {
              console.error('[LandingKit] language listener error:', e);
            }
          });
        }
      });
    });
  }

  function updateLanguageUI(lang, fallback) {
    document.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });

    const translations = global.translations || {};
    const dict = translations[lang] || translations[fallback || 'en'] || {};

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = dict[key];
        } else {
          el.innerHTML = dict[key];
        }
      }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (dict[key]) {
        el.placeholder = dict[key];
      }
    });

    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta && dict['meta-desc']) {
      descriptionMeta.setAttribute('content', dict['meta-desc']);
    }
    if (dict['meta-title']) {
      document.title = dict['meta-title'];
    }

    document.documentElement.lang = lang;
  }

  /* ------------------------------------------------------------
     3. GitHub Release Fetcher
     ------------------------------------------------------------ */
  function initReleaseFetcher(options) {
    if (!options || !options.repoOwner || !options.repoName) return;

    const repoOwner = options.repoOwner;
    const repoName = options.repoName;
    const defaultVersion = options.defaultVersion || 'v1.0.0';
    const downloadButtonIds = options.downloadButtonIds || [
      'nav-download-btn',
      'hero-download-btn',
      'cta-download-btn',
    ];
    const versionElementId = options.versionElementId || 'hero-version-text';
    const subtextElementId = options.subtextElementId || null;
    const showSize = Boolean(options.showSize);
    const defaultDownloadUrl =
      options.fallbackUrl || `https://github.com/${repoOwner}/${repoName}/releases`;
    const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/releases/latest`;

    let resolvedUrl = defaultDownloadUrl;
    let resolvedTag = defaultVersion;
    let resolvedSizeMb = options.defaultSizeLabel || '~15 MB';
    let useFallback = true;

    const updateUI = () => {
      downloadButtonIds.forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.href = resolvedUrl;
      });

      if (subtextElementId) {
        const subtextEl = document.getElementById(subtextElementId);
        if (subtextEl) {
          const dict = (global.translations && global.translations[activeLang]) || {};
          if (useFallback) {
            if (dict['release-view-github']) subtextEl.textContent = dict['release-view-github'];
          } else if (dict['release-latest']) {
            subtextEl.textContent = dict['release-latest'].replace('{version}', resolvedTag);
          }
        }
      }

      if (!useFallback && versionElementId) {
        const versionEl = document.getElementById(versionElementId);
        if (versionEl) {
          if (typeof options.formatVersionHtml === 'function') {
            versionEl.innerHTML = options.formatVersionHtml({
              tagName: resolvedTag,
              sizeMb: resolvedSizeMb,
              lang: activeLang,
            });
          } else {
            const sizePart = showSize ? ` (${resolvedSizeMb})` : '';
            versionEl.innerHTML = `Latest Release: <strong>${resolvedTag}</strong>${sizePart} • macOS 13+ Universal (Apple Silicon & Intel)`;
          }
        }
      }
    };

    if (subtextElementId) {
      const subtextEl = document.getElementById(subtextElementId);
      const dict = (global.translations && global.translations[activeLang]) || {};
      if (subtextEl && dict['release-checking']) {
        subtextEl.textContent = dict['release-checking'];
      }
    }

    onLanguageChange(updateUI);

    fetch(apiUrl)
      .then((res) => {
        if (!res.ok) throw new Error('Release not found or rate limited');
        return res.json();
      })
      .then((data) => {
        const assets = data.assets || [];
        const dmgAsset = assets.find((a) => a.name && a.name.toLowerCase().endsWith('.dmg'));
        resolvedTag = data.name || data.tag_name || defaultVersion;
        if (dmgAsset) {
          resolvedUrl = dmgAsset.browser_download_url;
          resolvedSizeMb = (dmgAsset.size / (1024 * 1024)).toFixed(1) + ' MB';
          useFallback = false;
        } else if (data.html_url) {
          resolvedUrl = data.html_url;
          useFallback = false;
        }
        updateUI();
      })
      .catch(() => {
        useFallback = true;
        updateUI();
      });
  }

  /* ------------------------------------------------------------
     4. FAQ Accordion
     ------------------------------------------------------------ */
  function initFaqAccordion(options) {
    const cfg = options || {};
    const itemSelector = cfg.itemSelector || '.faq-item';
    const headerSelector = cfg.headerSelector || '.faq-item-header';
    const iconSelector = cfg.iconSelector || '.faq-toggle-icon';
    const openClass = cfg.openClass || 'active';

    const items = document.querySelectorAll(itemSelector);
    items.forEach((item) => {
      const header = item.querySelector(headerSelector);
      if (header) {
        header.addEventListener('click', () => {
          const isOpen = item.classList.contains(openClass);
          items.forEach((i) => {
            i.classList.remove(openClass);
            const icon = i.querySelector(iconSelector);
            if (icon) icon.textContent = '+';
          });
          if (!isOpen) {
            item.classList.add(openClass);
            const icon = item.querySelector(iconSelector);
            if (icon) icon.textContent = '−';
          }
        });
      }
    });
  }

  /* ------------------------------------------------------------
     5. Copy to Clipboard Utility
     ------------------------------------------------------------ */
  function initCopyButtons(options) {
    const cfg = options || {};
    const buttonSelector = cfg.buttonSelector || '.btn-copy';
    const cmdSelector = cfg.cmdSelector || '.terminal-cmd';

    document.querySelectorAll(buttonSelector).forEach((btn) => {
      btn.addEventListener('click', () => {
        const prevCmd = btn.parentElement && btn.parentElement.querySelector(cmdSelector);
        const textToCopy = prevCmd ? prevCmd.textContent : '';

        if (textToCopy && navigator.clipboard) {
          navigator.clipboard.writeText(textToCopy.trim()).then(() => {
            const originalText = btn.textContent;
            btn.textContent = activeLang === 'it' ? 'Copiato! ✓' : 'Copied! ✓';
            btn.style.borderColor = 'var(--color-emerald)';
            btn.style.color = 'var(--color-emerald)';
            setTimeout(() => {
              btn.textContent = originalText;
              btn.style.borderColor = '';
              btn.style.color = '';
            }, 2000);
          });
        }
      });
    });
  }

  /* ------------------------------------------------------------
     6. Mobile Navigation Toggle
     ------------------------------------------------------------ */
  function initMobileMenu(options) {
    const cfg = options || {};
    const toggle = document.getElementById(cfg.toggleId || 'mobile-menu-toggle');
    const inner = document.querySelector(cfg.containerSelector || '.navbar-inner');
    if (toggle && inner) {
      toggle.addEventListener('click', () => {
        inner.classList.toggle('mobile-open');
      });

      document.querySelectorAll(cfg.linkSelector || '.nav-link').forEach((link) => {
        link.addEventListener('click', () => {
          inner.classList.remove('mobile-open');
        });
      });
    }
  }

  /* ------------------------------------------------------------
     Helpers
     ------------------------------------------------------------ */
  function safeGetItem(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function safeSetItem(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignore storage errors
    }
  }

  function init(config) {
    const cfg = config || {};
    const run = () => {
      if (cfg.theme !== false) initTheme(cfg.theme || {});
      if (cfg.i18n !== false) initLanguage(cfg.i18n || {});
      if (cfg.release) initReleaseFetcher(cfg.release);
      if (cfg.faq !== false) initFaqAccordion(cfg.faq || {});
      if (cfg.mobileMenu !== false) initMobileMenu(cfg.mobileMenu || {});
      if (cfg.copyButtons !== false) initCopyButtons(cfg.copyButtons || {});
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', run);
    } else {
      run();
    }
  }

  global.LandingKit = {
    init,
    getLang,
    onLanguageChange,
    initTheme,
    initLanguage,
    initReleaseFetcher,
    initFaqAccordion,
    initCopyButtons,
    initMobileMenu,
  };
})(typeof window !== 'undefined' ? window : globalThis);

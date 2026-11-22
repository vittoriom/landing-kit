/* ============================================================
   Landing Kit — Shared Vanilla JS Core for Local-First App Landing Pages
   Zero dependencies. Supports Theme, i18n, GitHub Release Fetcher,
   FAQ Accordion, Mobile Menu, and Copy-to-Clipboard.
   ============================================================ */
(function (global) {
  'use strict';

  let activeLang = 'en';
  const langListeners = [];
  let runtimeDefaultTranslations = { en: {}, it: {} };

  const DEFAULT_TRANSLATIONS = {
    en: {
      'footer-creator-title': 'About the Developer',
      'footer-creator-name': 'Vittorio Monaco',
      'footer-creator-role': 'Staff Software Engineer @ Databricks',
      'footer-creator-github': 'GitHub Profile',
      'install-badge': 'Quick Setup',
      'install-title': 'macOS Installation Guide',
      'install-step1-title': '1. Download the Disk Image (.dmg)',
      'install-step1-desc':
        'Download the latest universal macOS DMG bundle directly from GitHub Releases (Apple Silicon & Intel).',
      'install-step2-title': '2. Drag to Applications Folder',
      'install-step2-desc':
        'Mount the DMG disk image and drag the app icon into your /Applications directory.',
      'install-step3-title': '3. Allow First Launch (macOS Gatekeeper)',
      'install-step3-desc':
        'As an independently compiled open-source binary, right-click the app in Finder and choose Open, or run this one-line terminal command:',
      'install-btn-copy': 'Copy Command',
    },
    it: {
      'footer-creator-title': 'Sullo Sviluppatore',
      'footer-creator-name': 'Vittorio Monaco',
      'footer-creator-role': 'Staff Software Engineer @ Databricks',
      'footer-creator-github': 'Profilo GitHub',
      'install-badge': 'Setup Rapido',
      'install-title': 'Guida all\'Installazione macOS',
      'install-step1-title': '1. Scarica l\'Immagine Disco (.dmg)',
      'install-step1-desc':
        'Scarica l\'ultima build universale macOS DMG direttamente da GitHub Releases (Apple Silicon e Intel).',
      'install-step2-title': '2. Trascina nella Cartella Applicazioni',
      'install-step2-desc':
        'Monta il file DMG e trascina l\'icona dell\'app nella tua cartella /Applications.',
      'install-step3-title': '3. Consenti il Primo Avvio (macOS Gatekeeper)',
      'install-step3-desc':
        'Essendo un binario open-source compilato indipendentemente, fai clic destro sull\'app nel Finder e scegli Apri, oppure esegui questo comando da terminale:',
      'install-btn-copy': 'Copia Comando',
    },
  };

  function getMergedDict(lang, fallback) {
    const fb = fallback || 'en';
    const userTranslations = global.translations || {};
    return Object.assign(
      {},
      DEFAULT_TRANSLATIONS[fb] || {},
      runtimeDefaultTranslations[fb] || {},
      DEFAULT_TRANSLATIONS[lang] || {},
      runtimeDefaultTranslations[lang] || {},
      userTranslations[fb] || {},
      userTranslations[lang] || {}
    );
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

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

    const dict = getMergedDict(lang, fallback);

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
     7. Shared Component Renderers (Creator Card & Install Guide)
     ------------------------------------------------------------ */
  const CREATOR_DEFAULTS = {
    name: 'Vittorio Monaco',
    role: 'Staff Software Engineer @ Databricks',
    githubUser: 'vittoriom',
    avatarUrl: 'https://github.com/vittoriom.png',
    fallbackAvatar: 'assets/logo.png',
  };

  function renderCreatorCard(options, releaseCfg) {
    const cfg = options || {};
    const selector = cfg.selector || '[data-lk-creator-card]';
    const targets = document.querySelectorAll(selector);
    if (!targets.length) return;

    const githubUser = cfg.githubUser || CREATOR_DEFAULTS.githubUser;
    const defaultRepo =
      cfg.repo ||
      (releaseCfg && releaseCfg.repoOwner && releaseCfg.repoName
        ? `${releaseCfg.repoOwner}/${releaseCfg.repoName}`
        : '');

    targets.forEach((el) => {
      const repo = el.getAttribute('data-repo') || defaultRepo;
      const fallbackAvatar =
        el.getAttribute('data-fallback-avatar') ||
        cfg.fallbackAvatar ||
        CREATOR_DEFAULTS.fallbackAvatar;
      const hideTitle = el.getAttribute('data-hide-title') === 'true' || Boolean(cfg.hideTitle);
      const bioFallback = el.getAttribute('data-bio') || cfg.bio || '';
      const name = cfg.name || CREATOR_DEFAULTS.name;
      const role = cfg.role || CREATOR_DEFAULTS.role;
      const avatarUrl = cfg.avatarUrl || CREATOR_DEFAULTS.avatarUrl;

      const repoLinkHtml = repo
        ? `
            <a href="https://github.com/${escapeHtml(repo)}" target="_blank" rel="noopener noreferrer" class="creator-link">
              <svg class="icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
              </svg>
              <span>${escapeHtml(repo)}</span>
            </a>`
        : '';

      el.innerHTML = `${
        hideTitle
          ? ''
          : '<h4 class="footer-col-title" data-i18n="footer-creator-title">About the Developer</h4>'
      }
          <div class="footer-creator-card">
            <div class="creator-header">
              <img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(name)}" class="creator-avatar" width="48" height="48" onerror="this.src='${escapeHtml(fallbackAvatar)}'">
              <div class="creator-meta">
                <span class="creator-name" data-i18n="footer-creator-name">${escapeHtml(name)}</span>
                <span class="creator-role" data-i18n="footer-creator-role">${escapeHtml(role)}</span>
              </div>
            </div>
            <p class="creator-bio" data-i18n="footer-creator-bio">${escapeHtml(bioFallback)}</p>
            <div class="creator-links">
              <a href="https://github.com/${escapeHtml(githubUser)}" target="_blank" rel="noopener noreferrer" class="creator-link">
                <svg class="icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.67-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/>
                </svg>
                <span data-i18n="footer-creator-github">GitHub Profile</span>
              </a>${repoLinkHtml}
            </div>
          </div>`;
    });
  }

  function renderInstallGuide(options) {
    const cfg = options || {};
    const selector = cfg.selector || '[data-lk-install-guide]';
    const targets = document.querySelectorAll(selector);
    if (!targets.length) return;

    targets.forEach((el) => {
      const appName = el.getAttribute('data-app-name') || cfg.appName || 'this app';
      const appBundle =
        el.getAttribute('data-app-bundle') || cfg.appBundle || `${appName}.app`;
      const sizeHint = el.getAttribute('data-size-hint') || cfg.sizeHint || '';
      const gridClass = el.getAttribute('data-grid-class') || cfg.gridClass || 'install-grid';
      const extraSteps = Array.isArray(cfg.extraSteps) ? cfg.extraSteps : [];

      if (appName && appName !== 'this app') {
        const sizeSuffixEn = sizeHint ? ` (${sizeHint})` : '';
        const sizeSuffixIt = sizeHint ? ` (${sizeHint})` : '';
        runtimeDefaultTranslations.en['install-step1-desc'] =
          `Grab the latest universal macOS DMG build for Apple Silicon or Intel Macs${sizeSuffixEn}.`;
        runtimeDefaultTranslations.it['install-step1-desc'] =
          `Scarica l'ultima build universale macOS DMG per Mac Apple Silicon o Intel${sizeSuffixIt}.`;
        runtimeDefaultTranslations.en['install-step2-desc'] =
          `Mount the DMG disk image and drag ${appName} into your /Applications directory.`;
        runtimeDefaultTranslations.it['install-step2-desc'] =
          `Monta l'immagine disco DMG e trascina ${appName} nella cartella /Applications.`;
      }

      const gatekeeperCmd = `xattr -cr "/Applications/${appBundle}"`;

      const extraStepsHtml = extraSteps
        .map((step, idx) => {
          const num = step.num != null ? step.num : idx + 4;
          const styleAttr = step.fullWidth !== false ? ' style="grid-column: 1 / -1;"' : '';
          const titleKeyAttr = step.titleKey ? ` data-i18n="${escapeHtml(step.titleKey)}"` : '';
          const descKeyAttr = step.descKey ? ` data-i18n="${escapeHtml(step.descKey)}"` : '';
          return `
        <div class="install-card"${styleAttr}>
          <div class="install-step-header">
            <span class="install-step-num">${escapeHtml(num)}</span>
            <h3 class="install-step-title"${titleKeyAttr}>${escapeHtml(step.title || '')}</h3>
          </div>
          <p class="install-step-desc"${descKeyAttr}>${escapeHtml(step.desc || '')}</p>
        </div>`;
        })
        .join('');

      el.innerHTML = `<div class="${escapeHtml(gridClass)}">
        <div class="install-card">
          <div class="install-step-header">
            <span class="install-step-num">1</span>
            <h3 class="install-step-title" data-i18n="install-step1-title">1. Download the Disk Image (.dmg)</h3>
          </div>
          <p class="install-step-desc" data-i18n="install-step1-desc">
            Download the latest universal macOS DMG bundle directly from GitHub Releases (Apple Silicon &amp; Intel).
          </p>
        </div>

        <div class="install-card">
          <div class="install-step-header">
            <span class="install-step-num">2</span>
            <h3 class="install-step-title" data-i18n="install-step2-title">2. Drag to Applications Folder</h3>
          </div>
          <p class="install-step-desc" data-i18n="install-step2-desc">
            Mount the DMG disk image and drag ${escapeHtml(appName)} into your /Applications directory.
          </p>
        </div>

        <div class="install-card" style="grid-column: 1 / -1;">
          <div class="install-step-header">
            <span class="install-step-num">3</span>
            <h3 class="install-step-title" data-i18n="install-step3-title">3. Allow First Launch (macOS Gatekeeper)</h3>
          </div>
          <p class="install-step-desc" data-i18n="install-step3-desc">
            As an independently compiled open-source binary, right-click the app in Finder and choose Open, or run this one-line terminal command:
          </p>
          <div class="terminal-box">
            <span class="terminal-cmd">${escapeHtml(gatekeeperCmd)}</span>
            <button class="btn-copy">
              <span class="btn-text" data-i18n="install-btn-copy">Copy Command</span>
            </button>
          </div>
        </div>${extraStepsHtml}
      </div>`;
    });
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
      if (cfg.creatorCard !== false) renderCreatorCard(cfg.creatorCard || {}, cfg.release);
      if (cfg.installGuide !== false) renderInstallGuide(cfg.installGuide || {});
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
    renderCreatorCard,
    renderInstallGuide,
    DEFAULT_TRANSLATIONS,
  };
})(typeof window !== 'undefined' ? window : globalThis);

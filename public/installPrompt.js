// PWA Install Prompt Handler
(function() {
  'use strict';

  let deferredPrompt = null;
  const DISMISS_FLAG = 'wingman_install_dismissed';
  const BANNER_ID = 'install-prompt-banner';

  // Check if already dismissed
  function isDismissed() {
    return localStorage.getItem(DISMISS_FLAG) === 'true';
  }

  // Check if already installed
  function isAlreadyInstalled() {
    // iOS PWA check
    if (window.navigator.standalone === true) {
      return true;
    }
    // Android standalone check
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return true;
    }
    return false;
  }

  // Detect iOS
  function isIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
  }

  // Show banner
  function showBanner(isIOS) {
    if (isDismissed() || isAlreadyInstalled()) {
      return;
    }

    // Show banner for all users (authenticated or not)
    const banner = document.getElementById(BANNER_ID);
    if (!banner) return;

    if (isIOS) {
      showIOSBanner(banner);
    } else {
      showAndroidBanner(banner);
    }

    banner.classList.add('visible');
  }

  // Show Android/Chrome banner
  function showAndroidBanner(banner) {
    const content = banner.querySelector('.install-prompt-content');
    content.innerHTML = `
      <div style="display: flex; align-items: center; flex: 1; gap: 12px;">
        <span style="font-size: 20px;">📲</span>
        <div>
          <p style="margin: 0; font-weight: 600; color: #ffffff;">Add Wingman to your home screen</p>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #999;">Get the best experience</p>
        </div>
      </div>
      <div style="display: flex; gap: 8px; align-items: center;">
        <button id="install-btn" class="install-action-btn" style="background-color: #c9a84c; color: #0a0a0f; padding: 8px 16px;">
          Install
        </button>
        <button id="dismiss-btn" class="install-dismiss-btn">✕</button>
      </div>
    `;

    document.getElementById('install-btn').addEventListener('click', () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            localStorage.setItem(DISMISS_FLAG, 'true');
          }
          deferredPrompt = null;
          hideBanner();
        });
      }
    });

    document.getElementById('dismiss-btn').addEventListener('click', () => {
      localStorage.setItem(DISMISS_FLAG, 'true');
      hideBanner();
    });
  }

  // Show iOS/Safari banner
  function showIOSBanner(banner) {
    const content = banner.querySelector('.install-prompt-content');
    
    // iOS share button visual (simple SVG icon)
    const shareIcon = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
        <polyline points="16 6 12 2 8 6"></polyline>
        <line x1="12" y1="2" x2="12" y2="15"></line>
      </svg>
    `;

    content.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 12px; flex: 1;">
        <span style="font-size: 20px;">📲</span>
        <div>
          <p style="margin: 0; font-weight: 600; color: #ffffff;">Add Wingman to your home screen</p>
          <p style="margin: 8px 0 0 0; font-size: 13px; color: #999; line-height: 1.5;">
            Tap the Share button <span style="display: inline-flex; align-items: center; gap: 2px; background: rgba(201, 168, 76, 0.1); padding: 0 6px; border-radius: 4px;">${shareIcon}</span> then select "Add to Home Screen"
          </p>
        </div>
      </div>
      <button id="dismiss-btn" class="install-dismiss-btn">✕</button>
    `;

    document.getElementById('dismiss-btn').addEventListener('click', () => {
      localStorage.setItem(DISMISS_FLAG, 'true');
      hideBanner();
    });
  }

  // Hide banner
  function hideBanner() {
    const banner = document.getElementById(BANNER_ID);
    if (banner) {
      banner.classList.remove('visible');
    }
  }

  // Initialize
  function init() {
    // Listen for beforeinstallprompt on Android
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
    });

    // Listen for app installation success
    window.addEventListener('appinstalled', () => {
      localStorage.setItem(DISMISS_FLAG, 'true');
      hideBanner();
    });

    // Show banner immediately (testing) or after 30 seconds in production
    setTimeout(() => {
      showBanner(isIOS());
    }, 5000);
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

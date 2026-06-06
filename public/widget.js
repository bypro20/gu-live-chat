(function() {
  'use strict';

  // Gu Live Chat Widget Loader
  var GU_CONFIG = window.$gu ? window.$gu.q || [] : [];
  var WEBSITE_ID = null;

  // Parse config
  for (var i = 0; i < GU_CONFIG.length; i++) {
    if (GU_CONFIG[i][0] === 'set' && GU_CONFIG[i][1] === 'WEBSITE_ID') {
      WEBSITE_ID = GU_CONFIG[i][2];
    }
  }

  if (!WEBSITE_ID) {
    console.error('[Gu Live Chat] WEBSITE_ID is required. Add: $gu("set", "WEBSITE_ID", "your-id")');
    return;
  }

  // Same-origin when embedded on guchat.org; override with window.GU_WIDGET_URL for cross-domain installs
  function getWidgetBaseUrl() {
    return window.GU_WIDGET_URL || window.location.origin || 'https://guchat.org';
  }

  // ─── Force widget visibility with !important CSS ──────────────────────
  // CRITICAL: Elements are directly on document.body with position:fixed.
  // transform:none !important prevents parent containers with transform/filter
  // from breaking position:fixed (CSS spec: if ANY ancestor has transform/filter,
  // position:fixed children become position:absolute-like and scroll with page).
  // We also override common wrapper selectors to prevent containment issues.
  // ─── Force widget visibility with !important CSS ──────────────────────
  // CRITICAL: Elements are directly on document.body with position:fixed.
  // transform:none !important prevents parent containers with transform/filter
  // from breaking position:fixed (CSS spec: if ANY ancestor has transform/filter,
  // position:fixed children become position:absolute-like and scroll with page).
  // We also override common wrapper selectors to prevent containment issues.
  // NOTE: display is NOT forced with !important so the open/close toggle works.
  // The inline style (display:block/none) controls visibility instead.
  var forceStyle = document.createElement('style');
  forceStyle.id = 'gu-widget-force-style';
  forceStyle.textContent =
    '#gu-chat-button{position:fixed!important;bottom:24px!important;right:24px!important;z-index:2147483647!important;visibility:visible!important;pointer-events:auto!important;transform:none!important;filter:none!important;}' +
    '#gu-widget-iframe{position:fixed!important;bottom:88px!important;right:24px!important;z-index:2147483647!important;visibility:visible!important;pointer-events:auto!important;transform:none!important;filter:none!important;}' +
    'html,body{transform:none!important;filter:none!important;}' +
    '#root,#app,#__next,[class*="wrapper"],[class*="container"],[class*="app-root"],[class*="layout"]{transform:none!important;filter:none!important;}' +
    '#gu-chat-button svg{display:block;pointer-events:none;}' +
    '@keyframes gu-pulse{0%{box-shadow:0 0 0 0 rgba(108,60,225,0.45),0 8px 32px rgba(108,60,225,0.35)}50%{box-shadow:0 0 0 18px rgba(108,60,225,0.08),0 8px 32px rgba(108,60,225,0.5)}100%{box-shadow:0 0 0 0 rgba(108,60,225,0),0 8px 32px rgba(108,60,225,0.35)}}' +
    '@keyframes gu-fade-in{from{opacity:0}to{opacity:1}}' +
    '@keyframes gu-slide-up{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}';
  (document.head || document.documentElement).appendChild(forceStyle);

  // ─── Chat button — DIRECTLY on document.body (no container) ──────────
  // position:fixed anchors to viewport. Directly on body so no parent container
  // can interfere. CSS !important rules protect against style overrides.
  var CHAT_ICON = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M9 10h6"/><path d="M9 14h4"/></svg>';
  var CLOSE_ICON = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';

  var chatBtn = document.createElement('div');
  chatBtn.id = 'gu-chat-button';
  chatBtn.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:2147483647;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#6C3CE1,#8B5CF6);cursor:pointer;box-shadow:0 8px 32px rgba(108,60,225,0.35);display:flex;align-items:center;justify-content:center;transition:all 0.3s cubic-bezier(0.16,1,0.3,1);pointer-events:auto;transform:none;filter:none;animation:gu-pulse 2.5s ease-in-out 1;will-change:transform;backface-visibility:hidden;-webkit-font-smoothing:antialiased;';

  var chatOpen = false;  // Start closed — user clicks to open chat
  chatBtn.innerHTML = CHAT_ICON;
  chatBtn.addEventListener('click', function() {
    chatOpen = !chatOpen;
    if (chatOpen) {
      iframe.style.display = 'block';
      iframe.style.opacity = '1';
      iframe.contentWindow && iframe.contentWindow.postMessage({ type: 'gu:open' }, '*');
      chatBtn.innerHTML = CLOSE_ICON;
    } else {
      iframe.style.display = 'none';
      iframe.contentWindow && iframe.contentWindow.postMessage({ type: 'gu:close' }, '*');
      chatBtn.innerHTML = CHAT_ICON;
    }
  });
  chatBtn.addEventListener('mouseenter', function() { chatBtn.style.boxShadow = '0 12px 48px rgba(108,60,225,0.5)'; chatBtn.style.transform = 'scale(1.08)'; });
  chatBtn.addEventListener('mouseleave', function() { chatBtn.style.boxShadow = '0 8px 32px rgba(108,60,225,0.35)'; chatBtn.style.transform = 'scale(1)'; });
  // DIRECTLY on body — no container wrapper
  document.body.appendChild(chatBtn);

  // Create iframe — DIRECTLY on document.body (no container)
  var iframe = document.createElement('iframe');
  var iframeSrc = getWidgetBaseUrl() + '/widget/' + WEBSITE_ID;
  iframe.src = iframeSrc;
  iframe.id = 'gu-widget-iframe';
  iframe.style.cssText = 'border:none;position:fixed;bottom:88px;right:24px;z-index:2147483647;width:400px;height:640px;border-radius:20px;box-shadow:0 20px 60px -15px rgba(139,92,246,0.35),0 0 0 1px rgba(236,72,153,0.1);display:none;opacity:0;transition:opacity 0.3s ease;pointer-events:auto;background:white;transform:none;filter:none;';
  iframe.allow = 'microphone; camera';
  // DIRECTLY on body — no container wrapper
  document.body.appendChild(iframe);

  // ─── Proactive Messages ────────────────────────────────────────────
  var proactiveMessages = [];
  var shownProactiveIds = JSON.parse(localStorage.getItem('gu_proactive_shown') || '[]');
  var proactiveTimer = null;
  var proactiveExitAdded = false;
  var proactiveStartTime = Date.now();
  var proactiveLastScrollPct = 0;

  function fetchProactiveMessages() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', getWidgetBaseUrl() + '/api/proactive?websiteId=' + WEBSITE_ID, true);
    xhr.onload = function() {
      if (xhr.status === 200) {
        try {
          proactiveMessages = JSON.parse(xhr.responseText);
          startProactiveTracking();
        } catch(e) {}
      }
    };
    xhr.send();
  }

  function startProactiveTracking() {
    if (!proactiveMessages || !proactiveMessages.length) return;

    for (var i = 0; i < proactiveMessages.length; i++) {
      var msg = proactiveMessages[i];
      if (!msg.isActive) continue;

      if (msg.showOnce && shownProactiveIds.indexOf(msg.id) !== -1) continue;

      if (msg.targetPages && msg.targetPages !== '*') {
        try {
          var pages = JSON.parse(msg.targetPages);
          var currentPath = window.location.pathname;
          var matched = false;
          for (var p = 0; p < pages.length; p++) {
            if (currentPath.indexOf(pages[p]) !== -1) {
              matched = true;
              break;
            }
          }
          if (!matched) continue;
        } catch(e) { continue; }
      }

      if (msg.triggerType === 'EXIT_INTENT') {
        if (!proactiveExitAdded) {
          proactiveExitAdded = true;
          document.addEventListener('mouseleave', function(e) {
            if (e.clientY > 0) return;
            for (var j = 0; j < proactiveMessages.length; j++) {
              var pm = proactiveMessages[j];
              if (!pm.isActive) continue;
              if (pm.showOnce && shownProactiveIds.indexOf(pm.id) !== -1) continue;
              if (pm.triggerType !== 'EXIT_INTENT') continue;
              triggerProactiveMessage(pm);
            }
          });
        }
      } else if (msg.triggerType === 'TIME_ON_PAGE') {
        var seconds = parseInt(msg.triggerValue) || 30;
        (function(pm, sec) {
          setTimeout(function() {
            if (pm.showOnce && shownProactiveIds.indexOf(pm.id) !== -1) return;
            var elapsed = (Date.now() - proactiveStartTime) / 1000;
            if (elapsed >= sec) {
              triggerProactiveMessage(pm);
            }
          }, (sec + (pm.delay || 0)) * 1000);
        })(msg, seconds);
      } else if (msg.triggerType === 'SCROLL_DEPTH') {
        var pct = parseInt(msg.triggerValue) || 50;
        (function(pm, targetPct) {
          var scrollHandler = function() {
            if (pm.showOnce && shownProactiveIds.indexOf(pm.id) !== -1) {
              window.removeEventListener('scroll', scrollHandler);
              return;
            }
            var scrollPct = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
            if (scrollPct >= targetPct && proactiveLastScrollPct < targetPct) {
              setTimeout(function() {
                triggerProactiveMessage(pm);
              }, (pm.delay || 0) * 1000);
            }
            proactiveLastScrollPct = scrollPct;
          };
          window.addEventListener('scroll', scrollHandler);
        })(msg, pct);
      } else if (msg.triggerType === 'PAGE_VISIT') {
        (function(pm) {
          setTimeout(function() {
            if (pm.showOnce && shownProactiveIds.indexOf(pm.id) !== -1) return;
            triggerProactiveMessage(pm);
          }, (pm.delay || 0) * 1000);
        })(msg);
      }
    }
  }

  function triggerProactiveMessage(msg) {
    if (!iframe.contentWindow) return;
    if (msg.showOnce) {
      shownProactiveIds.push(msg.id);
      localStorage.setItem('gu_proactive_shown', JSON.stringify(shownProactiveIds));
    }
    iframe.contentWindow.postMessage({
      type: 'gu:proactive',
      id: msg.id,
      title: msg.title,
      message: msg.message,
    }, '*');
  }

  // ─── Self-healing: ensure widget stays mounted in the DOM ──────────
  var isReAddingWidget = false;

  function ensureWidgetMounted() {
    isReAddingWidget = true;

    var btn = document.getElementById('gu-chat-button');
    if (!btn || !document.body.contains(btn)) {
      document.body.appendChild(chatBtn);
    }
    var frm = document.getElementById('gu-widget-iframe');
    if (!frm || !document.body.contains(frm)) {
      document.body.appendChild(iframe);
    }
    if (!document.getElementById('gu-widget-force-style')) {
      (document.head || document.documentElement).appendChild(forceStyle);
    }

    isReAddingWidget = false;
  }

  // ─── MutationObserver: only re-add if widget elements are actually removed ──
  var domObserver = new MutationObserver(function(mutations) {
    if (isReAddingWidget) return;
    var btn = document.getElementById('gu-chat-button');
    var frm = document.getElementById('gu-widget-iframe');
    if ((!btn || !document.body.contains(btn)) || (!frm || !document.body.contains(frm))) {
      ensureWidgetMounted();
    }
  });
  domObserver.observe(document.body, { childList: true, subtree: false });

  var styleObserver = new MutationObserver(function() {
    if (isReAddingWidget) return;
    if (!document.getElementById('gu-widget-force-style')) {
      (document.head || document.documentElement).appendChild(forceStyle);
    }
  });
  if (document.head) {
    styleObserver.observe(document.head, { childList: true, subtree: false });
  }

  // ─── Sensitive field selector ─────────────────────────────────────
  var SENSITIVE_SELECTORS = [
    'input[type="password"]',
    'input[type="creditcard"]',
    'input[name*="card" i]',
    'input[name*="cvv" i]',
    'input[name*="cvc" i]',
    'input[name*="cc" i]',
    'input[name*="ccnum" i]',
    'input[name*="cardnumber" i]',
    'input[name*="securitycode" i]',
    'input[name*="iban" i]',
    'input[name*="password" i]',
    'input[name*="tc" i]',
    'input[name*="ssn" i]',
    'input[autocomplete="cc-number"]',
    'input[autocomplete="cc-csc"]',
    'input[autocomplete="cc-exp"]',
    'input[autocomplete="current-password"]',
    'input[autocomplete="new-password"]',
  ].join(',');

  // ─── Privacy mode (screen monitoring pause when sensitive input focused) ──
  var privacyModeActive = false;

  function setPrivacyMode(enabled) {
    if (privacyModeActive === enabled) return;
    privacyModeActive = enabled;
    if (iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        type: 'gu:privacy-mode',
        enabled: enabled,
      }, '*');
    }
  }

  document.addEventListener('focusin', function(e) {
    var target = e.target;
    if (!target || !target.matches) return;
    if (target.matches(SENSITIVE_SELECTORS)) {
      setPrivacyMode(true);
    }
  }, true);

  document.addEventListener('focusout', function(e) {
    var target = e.target;
    if (!target || !target.matches) return;
    if (target.matches(SENSITIVE_SELECTORS)) {
      setTimeout(function() {
        var activeEl = document.activeElement;
        if (!activeEl || !activeEl.matches || !activeEl.matches(SENSITIVE_SELECTORS)) {
          setPrivacyMode(false);
        }
      }, 100);
    }
  }, true);

  // ─── Rate-limited event sender ─────────────────────────────────────
  var activityThrottle = {};
  var THROTTLE_MS = 500;
  var CURSOR_THROTTLE_MS = 80;

  function sendActivity(eventType, data) {
    if (!iframe.contentWindow) return;

    var throttleMs = eventType === 'mousemove' ? CURSOR_THROTTLE_MS : THROTTLE_MS;
    var now = Date.now();
    if (activityThrottle[eventType] && now - activityThrottle[eventType] < throttleMs) {
      return;
    }
    activityThrottle[eventType] = now;

    iframe.contentWindow.postMessage({
      type: 'gu:visitor:activity',
      eventType: eventType,
      ...data,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    }, '*');
  }

  // ─── Listen for messages from iframe (e.g. close button inside widget) ──
  window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'gu:resize') {
      if (event.data.open) {
        iframe.style.display = 'block';
        iframe.style.opacity = '1';
        chatOpen = true;
        chatBtn.innerHTML = CLOSE_ICON;
        ensureWidgetMounted();
      } else {
        iframe.style.display = 'none';
        chatOpen = false;
        chatBtn.innerHTML = CHAT_ICON;
      }
    }
  });

  // ─── Track page views ────────────────────────────────────────────────
  var currentPage = window.location.href;
  var trackPageView = function() {
    if (iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        type: 'gu:pageview',
        url: window.location.href,
        title: document.title,
        referrer: document.referrer,
      }, '*');
    }
  };

  // Send initial page view + auto-open widget inside iframe
  iframe.addEventListener('load', function() {
    trackPageView();
    fetchProactiveMessages();
    if (chatOpen && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'gu:open' }, '*');
    }
  });

  // Track URL changes (SPA) — observe only <title> and <head>, not entire subtree
  var lastTrackedUrl = window.location.href;
  var pageObserver = new MutationObserver(function() {
    if (window.location.href !== lastTrackedUrl) {
      lastTrackedUrl = window.location.href;
      trackPageView();
    }
  });
  if (document.head) {
    pageObserver.observe(document.head, { childList: true, subtree: true });
  }

  // Also listen for popstate
  window.addEventListener('popstate', function() {
    currentPage = window.location.href;
    trackPageView();
  });

  // ─── Track mouse movement (cursor overlay) ────────────────────────
  document.addEventListener('mousemove', function(e) {
    sendActivity('mousemove', {
      x: e.clientX,
      y: e.clientY,
      viewportW: window.innerWidth,
      viewportH: window.innerHeight,
    });
  }, true);

  // ─── Track input/typing activity ─────────────────────────────────────
  document.addEventListener('input', function(e) {
    var target = e.target;
    if (!target || !target.tagName) return;
    if (target.matches && target.matches(SENSITIVE_SELECTORS)) return;

    var tagName = target.tagName.toLowerCase();
    if (tagName !== 'input' && tagName !== 'textarea' && !target.isContentEditable) return;

    var inputType = (target.type || '').toLowerCase();
    if (['hidden', 'submit', 'button', 'checkbox', 'radio', 'file', 'image', 'range', 'color'].indexOf(inputType) !== -1) return;

    // PRIVACY: never transmit what the visitor typed. Only signal that typing
    // is happening in a given field (selector), never the value/content.
    var selector = getSelector(target);

    sendActivity('input', {
      selector: selector,
    });
  }, true);

  // ─── Track focus (form field focus) ──────────────────────────────
  document.addEventListener('focus', function(e) {
    var target = e.target;
    if (!target || !target.tagName) return;

    var tagName = target.tagName.toLowerCase();
    if (tagName !== 'input' && tagName !== 'textarea' && tagName !== 'select' && !target.isContentEditable) return;
    if (target.matches && target.matches(SENSITIVE_SELECTORS)) return;

    var inputType = (target.type || '').toLowerCase();
    if (['hidden', 'submit', 'button', 'checkbox', 'radio', 'file', 'image', 'range', 'color'].indexOf(inputType) !== -1) return;

    var selector = getSelector(target);
    var fieldName = '';
    if (target.name) {
      fieldName = target.name;
    } else if (target.placeholder) {
      fieldName = target.placeholder;
    } else if (target.labels && target.labels.length > 0) {
      fieldName = target.labels[0].textContent.trim().substring(0, 50);
    }

    sendActivity('focus', {
      selector: selector,
      fieldName: fieldName,
      fieldType: inputType || tagName,
    });
  }, true);

  // ─── Track clicks ───────────────────────────────────────────────────
  document.addEventListener('click', function(e) {
    var target = e.target;
    if (!target || !target.tagName) return;

    var selector = getSelector(target);
    var text = '';

    // Only the visible label of buttons/links is captured — never an input's
    // value (that would leak typed data such as form contents).
    var tag = (target.tagName || '').toLowerCase();
    if (tag !== 'input' && tag !== 'textarea' && !target.isContentEditable && target.innerText) {
      text = target.innerText.substring(0, 80).trim();
    }

    sendActivity('click', {
      selector: selector,
      text: text,
      x: e.clientX,
      y: e.clientY,
    });
  }, true);

  // ─── Track scroll (heavily throttled) ──────────────────────────────
  var scrollTimeout = null;
  window.addEventListener('scroll', function() {
    if (scrollTimeout) return;
    scrollTimeout = setTimeout(function() {
      sendActivity('scroll', {
        scrollY: window.scrollY,
        scrollPercentage: Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100),
        viewportH: window.innerHeight,
        documentH: document.body.scrollHeight,
      });
      scrollTimeout = null;
    }, 2000);
  }, true);

  // ─── Helper: Generate CSS selector for an element ──────────────────
  function getSelector(el) {
    if (!el || !el.tagName) return '';
    var parts = [];
    var current = el;
    var maxDepth = 5;

    while (current && current !== document.body && maxDepth > 0) {
      var selector = current.tagName.toLowerCase();
      if (current.id) {
        selector += '#' + current.id;
        parts.unshift(selector);
        break;
      }
      if (current.className && typeof current.className === 'string') {
        var classes = current.className.trim().split(/\s+/).slice(0, 2).join('.');
        if (classes) selector += '.' + classes;
      }
      parts.unshift(selector);
      current = current.parentElement;
      maxDepth--;
    }

    return parts.join(' > ');
  }

  // ─── Screen Monitoring (Ekran İzleme) ─────────────────────────────────
  var SCREENSHOT_THROTTLE_MS = 150;
  var SCREENSHOT_QUALITY = 0.55;
  var screenshotTimer = null;
  var htmlToImageLoaded = false;
  var lastScreenshotLength = 0;
  var screenCaptureActive = false;
  var screenshotInProgress = false;

  // Dynamically load html-to-image library
  function loadHtmlToImage(callback) {
    if (htmlToImageLoaded) { callback(); return; }
    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.min.js';
    script.onload = function() {
      htmlToImageLoaded = true;
      if (callback) callback();
    };
    script.onerror = function() {
      console.warn('[Gu Live Chat] Screen monitoring: html-to-image could not load');
    };
    document.head.appendChild(script);
  }

  // Pre-load the library in the background
  loadHtmlToImage(null);

  // IDs of elements to exclude from screenshots — the widget iframe and button
  // are the heaviest DOM subtrees; skipping them makes screenshots 5-10× faster.
  var HIDDEN_ELEMENT_IDS = ['gu-widget-iframe', 'gu-chat-button'];

  // Capture screenshot — uses onclone (never modifies original DOM)
  var _captureCount = 0;
  function captureScreenshot() {
    _captureCount++;
    if (!htmlToImageLoaded || typeof window.htmlToImage === 'undefined') {
      scheduleNextScreenshot();
      return;
    }
    if (!screenCaptureActive) return;
    if (screenshotInProgress) {
      scheduleNextScreenshot();
      return;
    }

    screenshotInProgress = true;

    var vpWidth = window.innerWidth;
    var vpHeight = window.innerHeight;
    var scrollX = window.scrollX || window.pageXOffset || 0;
    var scrollY = window.scrollY || window.pageYOffset || 0;

    // If privacy mode is active, send a black frame instead of a real screenshot
    if (privacyModeActive) {
      var privacyCanvas = document.createElement('canvas');
      privacyCanvas.width = vpWidth;
      privacyCanvas.height = vpHeight;
      var privacyCtx = privacyCanvas.getContext('2d');
      privacyCtx.fillStyle = '#0a0a12';
      privacyCtx.fillRect(0, 0, vpWidth, vpHeight);
      privacyCtx.fillStyle = '#6b7280';
      privacyCtx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      privacyCtx.textAlign = 'center';
      privacyCtx.fillText('🔒 Gizlilik nedeniyle ekran geçici olarak gizlendi', vpWidth / 2, vpHeight / 2 - 10);
      privacyCtx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      privacyCtx.fillStyle = '#4b5563';
      privacyCtx.fillText('Hassas bilgi girişi tamamlandığında izleme devam edecek', vpWidth / 2, vpHeight / 2 + 15);

      var privacyDataUrl = privacyCanvas.toDataURL('image/jpeg', 0.5);
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage({
          type: 'gu:visitor:screenshot',
          screenshot: privacyDataUrl,
          viewportW: vpWidth,
          viewportH: vpHeight,
          scrollY: scrollY,
          documentH: document.documentElement.scrollHeight,
          privacyMode: true,
        }, '*');
      }
      screenshotInProgress = false;
      scheduleNextScreenshot();
      return;
    }

    // Pre-scan position:fixed elements — only scan visible elements, skip heavy subtrees
    var fixedElementIds = [];
    try {
      var allEls = document.querySelectorAll('body > *, header, nav, footer, [style*="position:fixed"]');
      for (var i = 0; i < allEls.length; i++) {
        if (window.getComputedStyle(allEls[i]).position === 'fixed' && allEls[i].id && HIDDEN_ELEMENT_IDS.indexOf(allEls[i].id) === -1) {
          fixedElementIds.push(allEls[i].id);
        }
      }
    } catch(e) {}

    // filter: Skip heavy subtrees (widget iframe/button/tracking banner) and
    // Gu-injected style/link elements. This makes screenshots 5-10× faster because
    // html-to-image no longer has to render the entire React app inside the iframe.
    function filterNode(node) {
      if (node.nodeType === 1) {
        // Skip elements by ID
        if (node.id && HIDDEN_ELEMENT_IDS.indexOf(node.id) !== -1) return false;
        // Skip Gu-injected style elements (force-style, widget CSS)
        if (node.tagName === 'STYLE' && node.id && node.id.indexOf('gu-') === 0) return false;
      }
      return true;
    }

    // onclone: Modify the CLONED document only — safe
    function oncloneCallback(clonedDoc) {
      // Blur sensitive fields in the clone
      try {
        var sensitiveFields = clonedDoc.querySelectorAll(SENSITIVE_SELECTORS);
        for (var s = 0; s < sensitiveFields.length; s++) {
          sensitiveFields[s].style.filter = 'blur(6px)';
        }
      } catch(e) {}

      // Counter-transform for position:fixed elements in the clone
      for (var f = 0; f < fixedElementIds.length; f++) {
        var clonedEl = clonedDoc.getElementById(fixedElementIds[f]);
        if (clonedEl) {
          var existingTransform = clonedEl.style.transform || '';
          var counterTransform = 'translate(' + scrollX + 'px, ' + scrollY + 'px)';
          clonedEl.style.transform = counterTransform + (existingTransform ? ' ' + existingTransform : '');
        }
      }
    }

    window.htmlToImage.toJpeg(document.documentElement, {
      quality: SCREENSHOT_QUALITY,
      backgroundColor: '#ffffff',
      width: vpWidth,
      height: vpHeight,
      canvasWidth: vpWidth,
      canvasHeight: vpHeight,
      pixelRatio: 1,
      skipAutoScale: true,
      filter: filterNode,
      onclone: oncloneCallback,
      style: {
        transform: 'translate(-' + scrollX + 'px, -' + scrollY + 'px)',
        transformOrigin: '0 0',
      },
    }).then(function(dataUrl) {
      screenshotInProgress = false;

      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage({
          type: 'gu:visitor:screenshot',
          screenshot: dataUrl,
          viewportW: vpWidth,
          viewportH: vpHeight,
          scrollY: scrollY,
          documentH: document.documentElement.scrollHeight,
        }, '*');
      }

      scheduleNextScreenshot();
    }).catch(function(err) {
      screenshotInProgress = false;
      scheduleNextScreenshot();
    });
  }

  function scheduleNextScreenshot() {
    if (!screenCaptureActive) return;
    screenshotTimer = setTimeout(captureScreenshot, SCREENSHOT_THROTTLE_MS);
  }

  function startScreenCapture() {
    if (screenCaptureActive) return;
    ensureWidgetMounted();
    screenCaptureActive = true;
    screenshotInProgress = false;
    loadHtmlToImage(function() {
      captureScreenshot();
    });
  }

  function stopScreenCapture() {
    screenCaptureActive = false;
    if (screenshotTimer) {
      clearTimeout(screenshotTimer);
      screenshotTimer = null;
    }
    screenshotInProgress = false;
    lastScreenshotLength = 0;
  }

  // ─── WebRTC Screen Sharing (visitor side) ────────────────────────────
  var webrtcPeerConnection = null;
  var webrtcScreenStream = null;
  // ICE candidates from the agent may arrive before the answer is applied.
  // Queue them until setRemoteDescription succeeds, then flush — otherwise
  // addIceCandidate throws and early candidates are silently dropped.
  var webrtcRemoteSet = false;
  var webrtcIceQueue = [];

  function flushWebrtcIceQueue() {
    if (!webrtcPeerConnection) return;
    while (webrtcIceQueue.length > 0) {
      var c = webrtcIceQueue.shift();
      webrtcPeerConnection.addIceCandidate(new RTCIceCandidate(c)).catch(function(err) {
        console.error('[Gu Live Chat] WebRTC addIceCandidate (queued) error:', err);
      });
    }
  }

  // Build a fresh RTCPeerConnection around an already-live MediaStream and send
  // the offer. Separated out so we can (re)connect a peer WITHOUT calling
  // getDisplayMedia again — the captured stream is a session singleton.
  function setupWebRTCPeer(stream) {
    webrtcRemoteSet = false;
    webrtcIceQueue = [];
    webrtcPeerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    stream.getTracks().forEach(function(track) {
      webrtcPeerConnection.addTrack(track, stream);
    });

    webrtcPeerConnection.onicecandidate = function(event) {
      if (event.candidate && iframe.contentWindow) {
        iframe.contentWindow.postMessage({
          type: 'gu:webrtc:ice-candidate',
          candidate: event.candidate.toJSON(),
        }, '*');
      }
    };

    // Notify iframe that the stream is ready
    if (iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'gu:webrtc:stream-ready' }, '*');
    }

    webrtcPeerConnection.createOffer().then(function(offer) {
      return webrtcPeerConnection.setLocalDescription(offer);
    }).then(function() {
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage({
          type: 'gu:webrtc:offer',
          sdp: webrtcPeerConnection.localDescription.sdp,
        }, '*');
      }
    }).catch(function(err) {
      console.error('[Gu Live Chat] WebRTC offer error:', err);
    });
  }

  function startWebRTCScreenShare() {
    // If we already have a screen stream, just reconnect the peer (no re-prompt).
    if (webrtcScreenStream) {
      setupWebRTCPeer(webrtcScreenStream);
      return;
    }

    navigator.mediaDevices.getDisplayMedia({
      video: { cursor: 'always' },
      audio: false,
    }).then(function(stream) {
      webrtcScreenStream = stream;

      // When the visitor stops sharing via browser UI, clean up.
      stream.getVideoTracks()[0].onended = function() {
        if (iframe.contentWindow) {
          iframe.contentWindow.postMessage({ type: 'gu:webrtc:stopped' }, '*');
        }
      };

      setupWebRTCPeer(stream);
    }).catch(function(err) {
      console.warn('[Gu Live Chat] getDisplayMedia denied or failed:', err.name || err.message);
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'gu:webrtc:denied' }, '*');
      }
    });
  }

  // Close the peer connection. By default the captured stream stays ALIVE so a
  // reconnect within the same session reuses it (no re-prompt). Pass true on an
  // explicit stop to also release the screen capture (turns off the browser's
  // "sharing your screen" indicator).
  function stopWebRTCScreenShare(releaseStream) {
    if (webrtcPeerConnection) {
      webrtcPeerConnection.close();
      webrtcPeerConnection = null;
    }
    webrtcRemoteSet = false;
    webrtcIceQueue = [];
    if (releaseStream && webrtcScreenStream) {
      webrtcScreenStream.getTracks().forEach(function(track) { track.stop(); });
      webrtcScreenStream = null;
    }
  }

  // ─── Listen for messages from iframe (screen capture + WebRTC signaling) ─────
  window.addEventListener('message', function(event) {
    if (!event.data || !event.data.type) return;

    if (event.data.type === 'gu:startScreenCapture') {
      startScreenCapture();
    }
    if (event.data.type === 'gu:stopScreenCapture') {
      stopScreenCapture();
    }
    // WebRTC signaling from iframe (answers and ICE candidates from admin)
    if (event.data.type === 'gu:webrtc:start') {
      startWebRTCScreenShare();
    }
    if (event.data.type === 'gu:webrtc:stop') {
      // Explicit stop from the agent → release the screen capture fully.
      stopWebRTCScreenShare(true);
    }
    if (event.data.type === 'gu:webrtc:answer' && webrtcPeerConnection) {
      webrtcPeerConnection.setRemoteDescription(new RTCSessionDescription({
        type: 'answer',
        sdp: event.data.sdp,
      })).then(function() {
        webrtcRemoteSet = true;
        flushWebrtcIceQueue();
      }).catch(function(err) {
        console.error('[Gu Live Chat] WebRTC setRemoteDescription error:', err);
      });
    }
    if (event.data.type === 'gu:webrtc:ice-candidate' && webrtcPeerConnection) {
      // Hold candidates until the remote description (answer) is applied.
      if (!webrtcRemoteSet) {
        webrtcIceQueue.push(event.data.candidate);
      } else {
        webrtcPeerConnection.addIceCandidate(new RTCIceCandidate(event.data.candidate)).catch(function(err) {
          console.error('[Gu Live Chat] WebRTC addIceCandidate error:', err);
        });
      }
    }
    // Remote click from agent — simulate a real click on the visitor's page
    if (event.data.type === 'gu:remote-click' && event.data.x != null && event.data.y != null) {
      var target = document.elementFromPoint(event.data.x, event.data.y);
      if (target) {
        // Simulate click with mouseover, mousedown, mouseup, click sequence
        var evtOpts = { bubbles: true, cancelable: true, view: window, clientX: event.data.x, clientY: event.data.y };
        target.dispatchEvent(new MouseEvent('mouseover', evtOpts));
        target.dispatchEvent(new MouseEvent('mousedown', evtOpts));
        target.dispatchEvent(new MouseEvent('mouseup', evtOpts));
        target.dispatchEvent(new MouseEvent('click', evtOpts));
        // If the target is inside a label, also click the associated input
        if (target.tagName === 'LABEL' && target.getAttribute('for')) {
          var forId = target.getAttribute('for');
          var forEl = document.getElementById(forId);
          if (forEl) forEl.click();
        }
      }
      // Track remote click for verification
      window.__guRemoteClicks = window.__guRemoteClicks || [];
      window.__guRemoteClicks.push({ x: event.data.x, y: event.data.y, target: target ? target.tagName : null, timestamp: Date.now() });
    }

    // Remote mouse move from agent (intervention) — move cursor on visitor's page
    if (event.data.type === 'gu:remote-mousemove' && event.data.x != null && event.data.y != null) {
      var moveTarget = document.elementFromPoint(event.data.x, event.data.y);
      if (moveTarget) {
        moveTarget.dispatchEvent(new MouseEvent('mousemove', {
          bubbles: true, cancelable: true, view: window,
          clientX: event.data.x, clientY: event.data.y
        }));
      }
    }

    // Remote scroll from agent (intervention) — scroll the page
    if (event.data.type === 'gu:remote-scroll') {
      window.scrollBy({
        left: event.data.deltaX || 0,
        top: event.data.deltaY || 0,
        behavior: 'instant'
      });
    }

    // Remote keyboard events from agent (intervention) — type on visitor's page
    if (event.data.type === 'gu:remote-keydown') {
      var kbTarget = document.activeElement || document.body;
      var kbOpts = {
        bubbles: true, cancelable: true, view: window,
        key: event.data.key || '',
        code: event.data.code || '',
        keyCode: event.data.keyCode || 0,
        which: event.data.keyCode || 0,
        shiftKey: !!event.data.shiftKey,
        ctrlKey: !!event.data.ctrlKey,
        altKey: !!event.data.altKey,
        metaKey: !!event.data.metaKey
      };
      kbTarget.dispatchEvent(new KeyboardEvent('keydown', kbOpts));
      // For printable characters: also inject the character into input fields
      if (event.data.key && event.data.key.length === 1 && !event.data.ctrlKey && !event.data.altKey && !event.data.metaKey) {
        kbTarget.dispatchEvent(new KeyboardEvent('keypress', kbOpts));
        var tag = kbTarget.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') {
          var start = kbTarget.selectionStart || kbTarget.value.length;
          var end = kbTarget.selectionEnd || kbTarget.value.length;
          kbTarget.value = kbTarget.value.substring(0, start) + event.data.key + kbTarget.value.substring(end);
          kbTarget.selectionStart = kbTarget.selectionEnd = start + 1;
          kbTarget.dispatchEvent(new Event('input', { bubbles: true }));
        } else if (kbTarget.isContentEditable) {
          document.execCommand('insertText', false, event.data.key);
        }
      }
    }

    if (event.data.type === 'gu:remote-keyup') {
      var kbTarget = document.activeElement || document.body;
      kbTarget.dispatchEvent(new KeyboardEvent('keyup', {
        bubbles: true, cancelable: true, view: window,
        key: event.data.key || '',
        code: event.data.code || '',
        keyCode: event.data.keyCode || 0,
        which: event.data.keyCode || 0,
        shiftKey: !!event.data.shiftKey,
        ctrlKey: !!event.data.ctrlKey,
        altKey: !!event.data.altKey,
        metaKey: !!event.data.metaKey
      }));
    }
  });

  // ─── Expose API ─────────────────────────────────────────────────────
  window.$gu = function() {
    var args = Array.prototype.slice.call(arguments);
    var method = args[0];

    switch(method) {
      case 'open':
        chatOpen = true;
        iframe.style.display = 'block';
        iframe.style.opacity = '1';
        iframe.contentWindow && iframe.contentWindow.postMessage({ type: 'gu:open' }, '*');
        chatBtn.innerHTML = CLOSE_ICON;
        ensureWidgetMounted();
        break;
      case 'close':
        chatOpen = false;
        iframe.style.display = 'none';
        iframe.contentWindow && iframe.contentWindow.postMessage({ type: 'gu:close' }, '*');
        chatBtn.innerHTML = CHAT_ICON;
        break;
      case 'startScreenCapture':
        startScreenCapture();
        break;
      case 'stopScreenCapture':
        stopScreenCapture();
        break;
      case 'startWebRTC':
        startWebRTCScreenShare();
        break;
      case 'stopWebRTC':
        stopWebRTCScreenShare(true);
        break;
      case 'set':
        break;
    }
  };

  // ─── GDPR/KVKK Consent Banner ─────────────────────────────────────────
  var GDPR_STORAGE_KEY = 'gu_gdpr_consent';
  var gdprConsent = localStorage.getItem(GDPR_STORAGE_KEY);

  function createConsentBanner() {
    var banner = document.createElement('div');
    banner.id = 'gu-consent-banner';
    banner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:2147483646;background:#1A1D2E;color:#fff;padding:16px 24px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;box-shadow:0 -4px 24px rgba(0,0,0,0.15);animation:gu-slide-up 0.4s ease;transform:none;filter:none;';

    var content = document.createElement('div');
    content.style.cssText = 'max-width:1200px;margin:0 auto;display:flex;flex-direction:column;gap:12px;';

    var text = document.createElement('p');
    text.style.cssText = 'margin:0;font-size:13px;line-height:1.6;color:#E5E0F0;';
    text.textContent = 'Bu site, size daha iyi hizmet verebilmek için çerezler ve kişisel verilerinizi işlemektedir. Devam ederek bunu kabul etmiş olursunuz.';

    var buttons = document.createElement('div');
    buttons.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;';

    var acceptBtn = document.createElement('button');
    acceptBtn.textContent = 'Kabul Et';
    acceptBtn.style.cssText = 'padding:8px 20px;border:none;border-radius:10px;background:linear-gradient(135deg,#6C3CE1,#8B5CF6);color:#fff;font-size:13px;font-weight:600;cursor:pointer;transition:opacity 0.2s;';
    acceptBtn.addEventListener('mouseenter', function() { acceptBtn.style.opacity = '0.9'; });
    acceptBtn.addEventListener('mouseleave', function() { acceptBtn.style.opacity = '1'; });
    acceptBtn.addEventListener('click', function() {
      localStorage.setItem(GDPR_STORAGE_KEY, 'granted');
      sendConsent(true);
      banner.remove();
      initWidget();
    });

    var rejectBtn = document.createElement('button');
    rejectBtn.textContent = 'Reddet';
    rejectBtn.style.cssText = 'padding:8px 20px;border:1px solid rgba(255,255,255,0.2);border-radius:10px;background:transparent;color:#E5E0F0;font-size:13px;font-weight:500;cursor:pointer;transition:background 0.2s;';
    rejectBtn.addEventListener('mouseenter', function() { rejectBtn.style.background = 'rgba(255,255,255,0.08)'; });
    rejectBtn.addEventListener('mouseleave', function() { rejectBtn.style.background = 'transparent'; });
    rejectBtn.addEventListener('click', function() {
      localStorage.setItem(GDPR_STORAGE_KEY, 'rejected');
      sendConsent(false);
      banner.remove();
      initWidget();
    });

    buttons.appendChild(acceptBtn);
    buttons.appendChild(rejectBtn);
    content.appendChild(text);
    content.appendChild(buttons);
    banner.appendChild(content);

    return banner;
  }

  function sendConsent(granted) {
    var payload = JSON.stringify({
      websiteId: WEBSITE_ID,
      visitorId: WEBSITE_ID + '-' + Date.now(),
      consentType: 'GDPR',
      granted: granted,
      userAgent: navigator.userAgent,
    });
    var xhr = new XMLHttpRequest();
    xhr.open('POST', getWidgetBaseUrl() + '/api/privacy/consent', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(payload);
  }

  // ─── Wrapped init ────────────────────────────────────────────────────
  function initWidget(limited) {
    chatBtn.style.display = 'flex';
    if (limited) {
      chatBtn.style.opacity = '0.6';
    } else {
      chatBtn.style.opacity = '1';
      chatBtn.style.pointerEvents = 'auto';
    }
  }

  if (gdprConsent === 'granted' || gdprConsent === 'rejected') {
    initWidget(gdprConsent === 'rejected');
  } else {
    chatBtn.style.display = 'none';
    iframe.style.display = 'none';
    chatBtn.style.pointerEvents = 'none';

    var consentBanner = createConsentBanner();
    document.body.appendChild(consentBanner);
  }

  console.log('[Gu Live Chat] Widget loaded for website:', WEBSITE_ID, '| Self-healing enabled | GDPR/KVKK consent:', gdprConsent || 'pending');
})();
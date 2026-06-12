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

  // Widget her zaman Gu Live Chat sunucusundan yüklenir — müşteri sitesinde origin yanlış olur
  function getWidgetBaseUrl() {
    if (window.GU_WIDGET_URL) return String(window.GU_WIDGET_URL).replace(/\/$/, '');
    var scripts = document.getElementsByTagName('script');
    for (var i = scripts.length - 1; i >= 0; i--) {
      var src = scripts[i].src || '';
      if (src.indexOf('widget.js') !== -1) {
        try {
          return new URL(src).origin;
        } catch (e) { /* ignore */ }
      }
    }
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return window.location.origin;
    }
    return 'https://www.gulivechat.com';
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
    '#gu-chat-dock{position:fixed!important;bottom:20px!important;right:20px!important;z-index:2147483647!important;display:flex!important;flex-direction:column!important;align-items:flex-end!important;gap:14px!important;pointer-events:none!important;filter:none!important;}' +
    '#gu-teaser-card{pointer-events:auto!important;max-width:calc(100vw - 40px)!important;animation:gu-slide-up 0.55s cubic-bezier(0.16,1,0.3,1)!important;}' +
    '#gu-teaser-top{height:5px!important;background:linear-gradient(90deg,#60A5FA,#818CF8,#A78BFA,#60A5FA)!important;background-size:200% 100%!important;animation:gu-shimmer 3s ease infinite!important;}' +
    '#gu-launcher-row{display:flex!important;align-items:center!important;gap:12px!important;pointer-events:none!important;}' +
    '#gu-status-pill{pointer-events:none!important;display:none;font:700 12px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#fff;padding:10px 16px;border-radius:999px;background:linear-gradient(135deg,rgba(16,185,129,0.92),rgba(5,150,105,0.92));box-shadow:0 8px 24px rgba(16,185,129,0.35),0 0 0 1px rgba(255,255,255,0.2);white-space:nowrap;animation:gu-float 3s ease-in-out infinite!important;}' +
    '@media(min-width:480px){#gu-status-pill{display:block!important;}}' +
    '#gu-launcher-wrap{position:relative!important;pointer-events:auto!important;}' +
    '#gu-launcher-ring,#gu-launcher-ring2{position:absolute!important;inset:-4px!important;border-radius:28px!important;pointer-events:none!important;}' +
    '#gu-launcher-ring{animation:gu-ring 2s ease-out infinite!important;border:2px solid rgba(99,102,241,0.55)!important;}' +
    '#gu-launcher-ring2{animation:gu-ring 2s ease-out 1s infinite!important;border:2px solid rgba(59,130,246,0.35)!important;}' +
    '#gu-chat-button{position:relative!important;width:76px!important;height:76px!important;border-radius:24px!important;z-index:1!important;visibility:visible!important;pointer-events:auto!important;background:linear-gradient(135deg,#60A5FA 0%,#6366F1 35%,#8B5CF6 70%,#3B82F6 100%)!important;background-size:200% 200%!important;animation:gu-float 2.8s ease-in-out infinite,gu-shimmer 5s ease infinite!important;box-shadow:0 20px 56px rgba(99,102,241,0.5),0 0 0 2px rgba(255,255,255,0.35) inset,0 0 48px rgba(99,102,241,0.35)!important;cursor:pointer!important;display:flex!important;align-items:center!important;justify-content:center!important;transition:transform 0.28s cubic-bezier(0.16,1,0.3,1)!important;}' +
    '#gu-widget-iframe{position:fixed!important;bottom:112px!important;right:20px!important;z-index:2147483647!important;visibility:visible!important;pointer-events:auto!important;filter:none!important;}' +
    'html,body{transform:none!important;filter:none!important;}' +
    '#root,#app,#__next,[class*="wrapper"],[class*="container"],[class*="app-root"],[class*="layout"]{transform:none!important;filter:none!important;}' +
    '#gu-chat-button svg{display:block;pointer-events:none;}' +
    '@keyframes gu-shimmer{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}' +
    '@keyframes gu-ring{0%{transform:scale(1);opacity:0.65}100%{transform:scale(1.6);opacity:0}}' +
    '@keyframes gu-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}' +
    '@keyframes gu-slide-up{from{opacity:0;transform:translateY(28px) scale(0.9);filter:blur(6px)}to{opacity:1;transform:translateY(0) scale(1);filter:blur(0)}}' +
    '@keyframes gu-badge-pop{0%{transform:scale(0)}60%{transform:scale(1.25)}100%{transform:scale(1)}}' +
    '@keyframes gu-bubble-in{from{opacity:0;transform:translateY(14px) scale(0.94)}to{opacity:1;transform:translateY(0) scale(1)}}' +
    '@keyframes gu-pop{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}';
  (document.head || document.documentElement).appendChild(forceStyle);

  var appearance = {
    primaryColor: '#6366F1',
    welcomeMessage: 'Merhaba! 👋 Sorularınız mı var? Hemen yazın, anında yardımcı olalım.',
    avatarUrl: null,
    websiteName: 'Canlı Destek',
    agentsOnline: true,
  };

  function fetchAppearance(cb) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', getWidgetBaseUrl() + '/api/widget/appearance?websiteId=' + encodeURIComponent(WEBSITE_ID), true);
    xhr.onload = function() {
      if (xhr.status === 200) {
        try {
          var data = JSON.parse(xhr.responseText);
          if (data.primaryColor) appearance.primaryColor = data.primaryColor;
          if (data.welcomeMessage) appearance.welcomeMessage = data.welcomeMessage;
          if (data.avatarUrl) appearance.avatarUrl = data.avatarUrl;
          if (data.websiteName) appearance.websiteName = data.websiteName;
          if (typeof data.agentsOnline === 'boolean') appearance.agentsOnline = data.agentsOnline;
        } catch (e) {}
      }
      if (cb) cb();
    };
    xhr.onerror = function() { if (cb) cb(); };
    xhr.send();
  }

  function applyPrimaryColor(color) {
    if (!color || color.charAt(0) !== '#') return;
    var ring = document.getElementById('gu-launcher-ring');
    if (ring) ring.style.borderColor = color + '88';
    var top = document.getElementById('gu-teaser-top');
    if (top) top.style.background = 'linear-gradient(90deg,' + color + ',#818CF8,#A78BFA,' + color + ')';
  }

  var CHAT_ICON = '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M9 10h6"/><path d="M9 14h4"/></svg>';
  var CLOSE_ICON = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';

  var chatDock = document.createElement('div');
  chatDock.id = 'gu-chat-dock';

  var teaserCard = document.createElement('div');
  teaserCard.id = 'gu-teaser-card';
  teaserCard.style.cssText = 'display:none;width:340px;max-width:calc(100vw - 40px);border-radius:24px;background:rgba(255,255,255,0.98);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:2px solid rgba(99,102,241,0.22);box-shadow:0 32px 64px -16px rgba(15,23,42,0.28),0 0 60px rgba(99,102,241,0.15);overflow:hidden;cursor:pointer;';

  var teaserTop = document.createElement('div');
  teaserTop.id = 'gu-teaser-top';
  teaserTop.style.cssText = 'height:5px;background:linear-gradient(90deg,#60A5FA,#818CF8,#A78BFA,#60A5FA);background-size:200% 100%;';

  var teaserBody = document.createElement('div');
  teaserBody.style.cssText = 'padding:18px 20px 20px;';

  var launcherRow = document.createElement('div');
  launcherRow.id = 'gu-launcher-row';

  var statusPill = document.createElement('div');
  statusPill.id = 'gu-status-pill';
  statusPill.textContent = '🟢 Canlı destek açık';

  var launcherWrap = document.createElement('div');
  launcherWrap.id = 'gu-launcher-wrap';

  var launcherRing = document.createElement('div');
  launcherRing.id = 'gu-launcher-ring';

  var launcherRing2 = document.createElement('div');
  launcherRing2.id = 'gu-launcher-ring2';

  var chatBtn = document.createElement('div');
  chatBtn.id = 'gu-chat-button';

  // ─── Unread badge (shown when widget is closed and new messages arrive) ──
  var unreadBadge = document.createElement('span');
  unreadBadge.id = 'gu-unread-badge';
  unreadBadge.style.cssText = 'position:absolute;top:-4px;right:-4px;min-width:20px;height:20px;padding:0 5px;border-radius:10px;background:#EF4444;color:#fff;font:700 11px/20px -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,0.2);box-sizing:border-box;display:none;animation:gu-badge-pop 0.3s cubic-bezier(0.16,1,0.3,1);';
  unreadBadge.textContent = '';
  chatBtn.appendChild(unreadBadge);

  var unreadCount = 0;
  function setUnread(count) {
    unreadCount = count > 0 ? count : 0;
    if (unreadCount > 0) {
      unreadBadge.textContent = unreadCount > 9 ? '9+' : String(unreadCount);
      unreadBadge.style.display = 'block';
    } else {
      unreadBadge.style.display = 'none';
    }
  }

  var chatOpen = false;  // Start closed — user clicks to open chat

  function showIframe() {
    iframe.style.display = 'block';
    // Animate in on the next frame so the transition runs.
    requestAnimationFrame(function() {
      iframe.style.opacity = '1';
      iframe.style.transform = 'translateY(0) scale(1)';
    });
  }
  function hideIframe() {
    iframe.style.opacity = '0';
    iframe.style.transform = 'translateY(12px) scale(0.98)';
    setTimeout(function() { if (!chatOpen) iframe.style.display = 'none'; }, 260);
  }

  var greetingDismissed = sessionStorage.getItem('gu_greeting_dismissed') === '1';

  function hideTeaser() {
    teaserCard.style.display = 'none';
  }

  function buildTeaserContent() {
    var color = appearance.primaryColor || '#6366F1';
    var initials = (appearance.websiteName || 'CD').slice(0, 2).toUpperCase();
    var avatarHtml = appearance.avatarUrl
      ? '<img src="' + appearance.avatarUrl + '" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"/>'
      : '<span style="font:800 18px/1 -apple-system,sans-serif;color:#fff;">' + initials + '</span>';

    teaserBody.innerHTML =
      '<div style="display:flex;align-items:center;gap:14px;margin-bottom:14px;">' +
        '<div style="position:relative;flex-shrink:0;">' +
          '<div style="width:56px;height:56px;border-radius:18px;background:linear-gradient(135deg,' + color + ',#818CF8);display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:0 10px 28px rgba(99,102,241,0.35);border:2px solid rgba(255,255,255,0.5);">' + avatarHtml + '</div>' +
          '<span style="position:absolute;bottom:-2px;right:-2px;width:16px;height:16px;border-radius:50%;background:#10B981;border:3px solid #fff;box-shadow:0 0 10px rgba(16,185,129,0.8);"></span>' +
        '</div>' +
        '<div style="flex:1;min-width:0;">' +
          '<p style="margin:0;font:800 16px/1.2 -apple-system,BlinkMacSystemFont,sans-serif;color:#0F172A;letter-spacing:-0.03em;">' + appearance.websiteName + '</p>' +
          '<p style="margin:4px 0 0;font:600 12px/1.4 -apple-system,sans-serif;color:#10B981;">🟢 Çevrimiçi · ~30 sn yanıt</p>' +
        '</div>' +
        '<button type="button" id="gu-teaser-close" aria-label="Kapat" style="width:28px;height:28px;border:none;border-radius:10px;background:#F1F5F9;color:#64748B;font:700 16px/1 sans-serif;cursor:pointer;flex-shrink:0;">×</button>' +
      '</div>' +
      '<p style="margin:0 0 16px;font:500 14px/1.6 -apple-system,sans-serif;color:#334155;">' + appearance.welcomeMessage + '</p>' +
      '<button type="button" id="gu-teaser-cta" style="width:100%;padding:14px 18px;border:none;border-radius:16px;background:linear-gradient(135deg,' + color + ',#818CF8);color:#fff;font:700 15px/1.2 -apple-system,sans-serif;cursor:pointer;box-shadow:0 10px 28px rgba(99,102,241,0.4);display:flex;align-items:center;justify-content:center;gap:8px;">💬 Hemen sohbet et →</button>' +
      '<p style="margin:10px 0 0;text-align:center;font:600 10px/1.4 -apple-system,sans-serif;color:#94A3B8;letter-spacing:0.04em;">ÜCRETSİZ · ANINDA YANIT · GÜVENLİ</p>';

    var closeBtn = document.getElementById('gu-teaser-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        greetingDismissed = true;
        try { sessionStorage.setItem('gu_greeting_dismissed', '1'); } catch (err) {}
        hideTeaser();
      });
    }
    var ctaBtn = document.getElementById('gu-teaser-cta');
    if (ctaBtn) {
      ctaBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (!chatOpen) chatBtn.click();
      });
    }
    applyPrimaryColor(color);
  }

  function showTeaser() {
    if (greetingDismissed || chatOpen) return;
    buildTeaserContent();
    teaserCard.style.display = 'block';
  }

  function removeGreeting() {
    hideTeaser();
  }

  teaserCard.addEventListener('click', function(e) {
    if (e.target && (e.target.id === 'gu-teaser-close' || e.target.id === 'gu-teaser-cta')) return;
    if (!chatOpen) chatBtn.click();
  });

  teaserCard.appendChild(teaserTop);
  teaserCard.appendChild(teaserBody);

  function setIconChat() { chatBtn.innerHTML = CHAT_ICON; chatBtn.appendChild(unreadBadge); }
  function setIconClose() { chatBtn.innerHTML = CLOSE_ICON; chatBtn.appendChild(unreadBadge); }

  chatBtn.innerHTML = CHAT_ICON;
  chatBtn.appendChild(unreadBadge);
  chatBtn.addEventListener('click', function() {
    chatOpen = !chatOpen;
    if (chatOpen) {
      hideTeaser();
      setUnread(0);
      showIframe();
      iframe.contentWindow && iframe.contentWindow.postMessage({ type: 'gu:open' }, '*');
      setIconClose();
    } else {
      hideIframe();
      iframe.contentWindow && iframe.contentWindow.postMessage({ type: 'gu:close' }, '*');
      setIconChat();
      if (!greetingDismissed) showTeaser();
    }
  });
  chatBtn.addEventListener('mouseenter', function() { chatBtn.style.transform = 'scale(1.1) rotate(-4deg)'; });
  chatBtn.addEventListener('mouseleave', function() { chatBtn.style.transform = 'scale(1) rotate(0deg)'; });

  launcherWrap.appendChild(launcherRing);
  launcherWrap.appendChild(launcherRing2);
  launcherWrap.appendChild(chatBtn);
  launcherRow.appendChild(statusPill);
  launcherRow.appendChild(launcherWrap);
  chatDock.appendChild(teaserCard);
  chatDock.appendChild(launcherRow);
  document.body.appendChild(chatDock);

  // Create iframe — DIRECTLY on document.body (no container)
  var iframe = document.createElement('iframe');
  var iframeSrc = getWidgetBaseUrl() + '/widget/' + WEBSITE_ID;
  iframe.src = iframeSrc;
  iframe.id = 'gu-widget-iframe';
  iframe.style.cssText = 'border:none;position:fixed;bottom:112px;right:20px;z-index:2147483647;width:440px;height:min(680px,calc(100vh - 132px));max-height:calc(100vh - 132px);border-radius:30px;box-shadow:0 50px 100px -28px rgba(15,23,42,0.42),0 0 80px rgba(99,102,241,0.2),0 0 120px rgba(99,102,241,0.1);display:none;opacity:0;transform:translateY(28px) scale(0.92);transform-origin:bottom right;transition:opacity 0.4s cubic-bezier(0.16,1,0.3,1),transform 0.4s cubic-bezier(0.16,1,0.3,1);pointer-events:auto;background:transparent;filter:none;overflow:hidden;';
  iframe.allow = 'microphone; camera';
  iframe.title = 'Canlı Sohbet';
  document.body.appendChild(iframe);

  fetchAppearance(function() {
    applyPrimaryColor(appearance.primaryColor);
    setTimeout(function() { showTeaser(); }, 1200);
  });

  // ─── Proactive Messages ────────────────────────────────────────────
  var proactiveMessages = [];
  var shownProactiveIds = JSON.parse(localStorage.getItem('gu_proactive_shown') || '[]');
  var proactiveTimer = null;
  var proactiveExitAdded = false;
  var proactiveStartTime = Date.now();
  var proactiveLastScrollPct = 0;

  function fetchProactiveMessages() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', getWidgetBaseUrl() + '/api/widget/proactive?websiteId=' + WEBSITE_ID, true);
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
  var CURSOR_THROTTLE_MS = 48;

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
    if (!event.data || !event.data.type) return;
    if (event.data.type === 'gu:resize') {
      if (event.data.open) {
        chatOpen = true;
        removeGreeting();
        setUnread(0);
        showIframe();
        setIconClose();
        chatBtn.style.animation = 'none';
        ensureWidgetMounted();
      } else {
        chatOpen = false;
        hideIframe();
        setIconChat();
      }
    } else if (event.data.type === 'gu:unread') {
      // The chat UI reports how many unread messages arrived while closed.
      if (!chatOpen) setUnread(parseInt(event.data.count, 10) || 0);
    } else if (event.data.type === 'gu:request-pageview') {
      trackPageView();
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
  var SCREENSHOT_THROTTLE_MS = 90;
  var SCREENSHOT_BURST_MS = 45;
  var SCREENSHOT_BURST_COUNT = 4;
  var SCREENSHOT_QUALITY = 0.52;
  var CAPTURE_MAX_WIDTH = 1366;
  var screenshotTimer = null;
  var htmlToImageLoaded = false;
  var lastScreenshotLength = 0;
  var screenCaptureActive = false;
  var screenshotInProgress = false;
  var screenshotBurstLeft = 0;
  var screenshotPending = false;
  var cachedFixedElementIds = [];
  var fixedElementScanCounter = 0;

  // Dynamically load html-to-image library (same origin first, then CDN fallback)
  function loadHtmlToImage(callback) {
    if (htmlToImageLoaded) { callback(); return; }
    var sources = [
      (typeof getWidgetBaseUrl === 'function' ? getWidgetBaseUrl() : window.location.origin) + '/vendor/html-to-image.min.js',
      'https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.min.js',
    ];
    var idx = 0;
    function tryNext() {
      if (idx >= sources.length) {
        console.warn('[Gu Live Chat] Screen monitoring: html-to-image could not load');
        if (callback) callback();
        return;
      }
      var script = document.createElement('script');
      script.src = sources[idx++];
      script.onload = function() {
        htmlToImageLoaded = true;
        if (callback) callback();
      };
      script.onerror = function() {
        script.remove();
        tryNext();
      };
      document.head.appendChild(script);
    }
    tryNext();
  }

  // Pre-load the library in the background
  loadHtmlToImage(null);

  // IDs of elements to exclude from screenshots — the widget iframe and button
  // are the heaviest DOM subtrees; skipping them makes screenshots 5-10× faster.
  var HIDDEN_ELEMENT_IDS = ['gu-widget-iframe', 'gu-chat-button', 'gu-greeting-bubble'];

  function getCaptureScale(width) {
    if (width <= CAPTURE_MAX_WIDTH) return 1;
    return CAPTURE_MAX_WIDTH / width;
  }

  function scanFixedElements() {
    cachedFixedElementIds = [];
    try {
      var allEls = document.querySelectorAll('body > *, header, nav, footer, [style*="position:fixed"]');
      for (var i = 0; i < allEls.length; i++) {
        if (window.getComputedStyle(allEls[i]).position === 'fixed' && allEls[i].id && HIDDEN_ELEMENT_IDS.indexOf(allEls[i].id) === -1) {
          cachedFixedElementIds.push(allEls[i].id);
        }
      }
    } catch (e) {}
  }

  function finishCaptureCycle() {
    screenshotInProgress = false;
    if (!screenCaptureActive) return;
    if (screenshotPending) {
      screenshotPending = false;
      setTimeout(captureScreenshot, 0);
      return;
    }
    scheduleNextScreenshot();
  }

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
      screenshotPending = true;
      return;
    }

    screenshotInProgress = true;

    var vpWidth = window.innerWidth;
    var vpHeight = window.innerHeight;
    var scrollX = window.scrollX || window.pageXOffset || 0;
    var scrollY = window.scrollY || window.pageYOffset || 0;
    var scale = getCaptureScale(vpWidth);
    var captureW = Math.max(320, Math.round(vpWidth * scale));
    var captureH = Math.max(240, Math.round(vpHeight * scale));

    fixedElementScanCounter++;
    if (fixedElementScanCounter === 1 || fixedElementScanCounter % 12 === 0) {
      scanFixedElements();
    }

    // If privacy mode is active, send a black frame instead of a real screenshot
    if (privacyModeActive) {
      var privacyCanvas = document.createElement('canvas');
      privacyCanvas.width = captureW;
      privacyCanvas.height = captureH;
      var privacyCtx = privacyCanvas.getContext('2d');
      privacyCtx.fillStyle = '#0a0a12';
      privacyCtx.fillRect(0, 0, captureW, captureH);
      privacyCtx.fillStyle = '#6b7280';
      privacyCtx.font = Math.round(16 * scale) + 'px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      privacyCtx.textAlign = 'center';
      privacyCtx.fillText('🔒 Gizlilik nedeniyle ekran geçici olarak gizlendi', captureW / 2, captureH / 2 - 10);
      privacyCtx.font = Math.round(12 * scale) + 'px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      privacyCtx.fillStyle = '#4b5563';
      privacyCtx.fillText('Hassas bilgi girişi tamamlandığında izleme devam edecek', captureW / 2, captureH / 2 + 15);

      var privacyDataUrl = privacyCanvas.toDataURL('image/jpeg', 0.45);
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
      finishCaptureCycle();
      return;
    }

    function filterNode(node) {
      if (node.nodeType === 1) {
        if (node.id && HIDDEN_ELEMENT_IDS.indexOf(node.id) !== -1) return false;
        if (node.tagName === 'STYLE' && node.id && node.id.indexOf('gu-') === 0) return false;
      }
      return true;
    }

    function oncloneCallback(clonedDoc) {
      try {
        var sensitiveFields = clonedDoc.querySelectorAll(SENSITIVE_SELECTORS);
        for (var s = 0; s < sensitiveFields.length; s++) {
          sensitiveFields[s].style.filter = 'blur(6px)';
        }
      } catch (e) {}

      for (var f = 0; f < cachedFixedElementIds.length; f++) {
        var clonedEl = clonedDoc.getElementById(cachedFixedElementIds[f]);
        if (clonedEl) {
          var existingTransform = clonedEl.style.transform || '';
          var counterTransform = 'translate(' + scrollX + 'px, ' + scrollY + 'px)';
          clonedEl.style.transform = counterTransform + (existingTransform ? ' ' + existingTransform : '');
        }
      }
    }

    window.htmlToImage.toJpeg(document.body, {
      quality: SCREENSHOT_QUALITY,
      backgroundColor: '#ffffff',
      width: captureW,
      height: captureH,
      canvasWidth: captureW,
      canvasHeight: captureH,
      pixelRatio: 1,
      skipAutoScale: true,
      filter: filterNode,
      onclone: oncloneCallback,
      style: {
        transform: 'translate(-' + scrollX + 'px, -' + scrollY + 'px) scale(' + scale + ')',
        transformOrigin: '0 0',
        width: vpWidth + 'px',
        height: vpHeight + 'px',
      },
    }).then(function(dataUrl) {
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
      finishCaptureCycle();
    }).catch(function() {
      finishCaptureCycle();
    });
  }

  function scheduleNextScreenshot() {
    if (!screenCaptureActive) return;
    var delay = screenshotBurstLeft > 0 ? SCREENSHOT_BURST_MS : SCREENSHOT_THROTTLE_MS;
    if (screenshotBurstLeft > 0) screenshotBurstLeft--;
    screenshotTimer = setTimeout(captureScreenshot, delay);
  }

  function startScreenCapture() {
    if (screenCaptureActive) return;
    ensureWidgetMounted();
    screenCaptureActive = true;
    screenshotInProgress = false;
    screenshotPending = false;
    screenshotBurstLeft = SCREENSHOT_BURST_COUNT;
    fixedElementScanCounter = 0;
    loadHtmlToImage(function() {
      captureScreenshot();
    });
  }

  function stopScreenCapture() {
    screenCaptureActive = false;
    screenshotPending = false;
    screenshotBurstLeft = 0;
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
        removeGreeting();
        setUnread(0);
        showIframe();
        iframe.contentWindow && iframe.contentWindow.postMessage({ type: 'gu:open' }, '*');
        setIconClose();
        chatBtn.style.animation = 'none';
        ensureWidgetMounted();
        break;
      case 'close':
        chatOpen = false;
        hideIframe();
        iframe.contentWindow && iframe.contentWindow.postMessage({ type: 'gu:close' }, '*');
        setIconChat();
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
  var privacyConfig = {
    showConsentBanner: true,
    consentBannerText: null,
    cookieConsentEnabled: true,
  };

  function fetchPrivacyConfig(cb) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', getWidgetBaseUrl() + '/api/widget/privacy?websiteId=' + WEBSITE_ID, true);
    xhr.onload = function() {
      if (xhr.status === 200) {
        try { privacyConfig = JSON.parse(xhr.responseText); } catch(e) {}
      }
      if (cb) cb();
    };
    xhr.onerror = function() { if (cb) cb(); };
    xhr.send();
  }

  function createConsentBanner() {
    var banner = document.createElement('div');
    banner.id = 'gu-consent-banner';
    banner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:2147483646;background:#1A1D2E;color:#fff;padding:16px 24px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;box-shadow:0 -4px 24px rgba(0,0,0,0.15);animation:gu-slide-up 0.4s ease;transform:none;filter:none;';

    var content = document.createElement('div');
    content.style.cssText = 'max-width:1200px;margin:0 auto;display:flex;flex-direction:column;gap:12px;';

    var text = document.createElement('p');
    text.style.cssText = 'margin:0;font-size:13px;line-height:1.6;color:#E5E0F0;';
    text.textContent = privacyConfig.consentBannerText || privacyConfig.cookieConsentText ||
      'Bu site, size daha iyi hizmet verebilmek için çerezler ve kişisel verilerinizi işlemektedir. Devam ederek bunu kabul etmiş olursunuz.';

    var buttons = document.createElement('div');
    buttons.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;';

    var acceptBtn = document.createElement('button');
    acceptBtn.textContent = 'Kabul Et';
    acceptBtn.style.cssText = 'padding:8px 20px;border:none;border-radius:10px;background:#1972F5;color:#fff;font-size:13px;font-weight:600;cursor:pointer;transition:opacity 0.2s;';
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

  function bootWidget() {
    if (gdprConsent === 'granted' || gdprConsent === 'rejected') {
      initWidget(gdprConsent === 'rejected');
    } else if (privacyConfig.showConsentBanner === false) {
      initWidget(false);
    } else {
      chatBtn.style.display = 'none';
      iframe.style.display = 'none';
      chatBtn.style.pointerEvents = 'none';
      var consentBanner = createConsentBanner();
      document.body.appendChild(consentBanner);
    }
  }

  fetchPrivacyConfig(bootWidget);

  console.log('[Gu Live Chat] Widget loaded for website:', WEBSITE_ID, '| Self-healing enabled | GDPR/KVKK consent:', gdprConsent || 'pending');
})();
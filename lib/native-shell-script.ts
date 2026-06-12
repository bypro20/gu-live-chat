/** Native shell — layout <head> içinde beforeInteractive çalışır */
export const NATIVE_SHELL_SCRIPT = `
(function () {
  try {
    var q = new URLSearchParams(location.search);
    var app = q.get('app');
    var ua = navigator.userAgent || '';
    var platform = null;

    if (app === 'admin' || /GuLiveChatAdminApp|GuChatAdminApp/i.test(ua)) platform = 'admin';
    else if (app === 'ios' || (app === 'android') || /GuLiveChatApp|GuChatApp/i.test(ua)) {
      platform = app === 'ios' ? 'ios' : 'android';
    } else {
      try {
        var stored = localStorage.getItem('gu-native-app');
        if (stored === 'android' || stored === 'ios' || stored === 'admin') platform = stored;
      } catch (e) {}
    }

    var cap = window.Capacitor;
    if (!platform && cap && cap.isNativePlatform && cap.isNativePlatform()) {
      platform = /GuLiveChatAdminApp|GuChatAdminApp/i.test(ua) ? 'admin' : 'android';
    }

    if (!platform) return;

    var root = document.documentElement;
    root.classList.add('native-app', 'native-app-' + platform);
    try { localStorage.setItem('gu-native-app', platform); } catch (e) {}

    if (app) {
      q.delete('app');
      var clean = location.pathname + (q.toString() ? '?' + q.toString() : '') + location.hash;
      history.replaceState({}, '', clean);
    }
  } catch (e) {}
})();
`.trim()

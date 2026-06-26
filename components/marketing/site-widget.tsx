'use client'

import Script from 'next/script'
import { WIDGET_ASSET_VERSION } from '@/lib/widget-theme'
import { getSiteUrl } from '@/lib/site-config'

const FALLBACK_APP_URL = getSiteUrl()

interface SiteWidgetProps {
  /** Panelden alınan public Website ID. Boşsa widget hiç render edilmez. */
  websiteId: string
}

/**
 * Marketing sayfalarında sağ alttaki canlı widget.
 * Config + widget.js tek blokta yüklenir (sıra hatası / kaybolma önlenir).
 */
export function SiteWidget({ websiteId }: SiteWidgetProps) {
  if (!websiteId) return null

  const bootstrapScript = `
(function () {
  var origin = window.location.origin || ${JSON.stringify(FALLBACK_APP_URL)};
  var websiteId = ${JSON.stringify(websiteId)};
  var version = ${JSON.stringify(WIDGET_ASSET_VERSION)};

  function addLink(rel, href, as) {
    if (!href || document.querySelector('link[rel="' + rel + '"][href="' + href + '"]')) return;
    var link = document.createElement('link');
    link.rel = rel;
    link.href = href;
    if (as) link.as = as;
    document.head.appendChild(link);
  }

  addLink('preconnect', origin);
  addLink('dns-prefetch', origin);
  addLink('preload', origin + '/widget.js?v=' + encodeURIComponent(version), 'script');

  var embedQuery =
    '?embedUrl=' + encodeURIComponent(window.location.href) +
    '&embedReferrer=' + encodeURIComponent(document.referrer || '') +
    '&embedTitle=' + encodeURIComponent(document.title || '');
  addLink('prefetch', origin + '/widget/' + websiteId + embedQuery);

  window.$gu = window.$gu || function () {
    (window.$gu.q = window.$gu.q || []).push(arguments);
  };
  window.GU_WIDGET_URL = origin;
  $gu('set', 'WEBSITE_ID', websiteId);

  if (document.getElementById('gu-widget-loader-external')) return;

  var s = document.createElement('script');
  s.id = 'gu-widget-loader-external';
  s.async = true;
  s.src = origin + '/widget.js?v=' + encodeURIComponent(version);
  (document.body || document.documentElement).appendChild(s);
})();
`.trim()

  return (
    <Script
      id="gu-widget-loader"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: bootstrapScript }}
    />
  )
}

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

  const loaderScript = `
(function () {
  var websiteId = ${JSON.stringify(websiteId)};
  var fallbackBase = ${JSON.stringify(FALLBACK_APP_URL)};
  var version = ${JSON.stringify(WIDGET_ASSET_VERSION)};

  window.$gu = window.$gu || function () {
    (window.$gu.q = window.$gu.q || []).push(arguments);
  };
  window.GU_WIDGET_URL = window.location.origin || fallbackBase;
  $gu('set', 'WEBSITE_ID', websiteId);

  if (document.getElementById('gu-widget-loader-external')) return;

  var s = document.createElement('script');
  s.id = 'gu-widget-loader-external';
  s.async = true;
  s.src = window.GU_WIDGET_URL + '/widget.js?v=' + encodeURIComponent(version);
  (document.body || document.documentElement).appendChild(s);
})();
`.trim()

  return (
    <Script
      id="gu-widget-loader"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: loaderScript }}
    />
  )
}

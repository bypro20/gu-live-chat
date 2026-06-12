import { WIDGET_ASSET_VERSION } from '@/lib/widget-theme'
import { getSiteUrl } from '@/lib/site-config'

const APP_URL = getSiteUrl()

export function buildWidgetInstallSnippet(websiteId: string) {
  const id = websiteId || 'WEBSITE_ID'
  return `<!-- Gu Live Chat — bu WEBSITE_ID yalnızca sizin panelinize bağlıdır -->
<script>
  window.$gu = window.$gu || function() {
    (window.$gu.q = window.$gu.q || []).push(arguments);
  };
  window.GU_WIDGET_URL = '${APP_URL}';
  $gu('set', 'WEBSITE_ID', '${id}');
</script>
<script async src="${APP_URL}/widget.js?v=${WIDGET_ASSET_VERSION}"></script>`
}

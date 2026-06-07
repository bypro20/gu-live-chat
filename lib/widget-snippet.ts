const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://guchat.org'

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
<script async src="${APP_URL}/widget.js"></script>`
}

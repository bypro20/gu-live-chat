import { buildWidgetInstallSnippet } from '@/lib/widget-snippet'

export type PlatformCategory = 'ecommerce' | 'cms' | 'builder' | 'framework'

export type PlatformInstallGuide = {
  id: string
  name: string
  category: PlatformCategory
  featured?: boolean
  region?: 'tr' | 'global'
  accent: string
  desc: { tr: string; en: string }
  steps: { tr: string[]; en: string[] }
  placement: { tr: string; en: string }
}

const SNIPPET_NOTE = {
  tr: 'Aşağıdaki kodu kopyalayıp sitenizin </body> etiketinden hemen önce yapıştırın.',
  en: 'Copy the code below and paste it just before </body> on your site.',
}

function guide(
  partial: Omit<PlatformInstallGuide, 'steps' | 'placement'> & {
    stepsTr: string[]
    stepsEn?: string[]
    placementTr: string
    placementEn?: string
  }
): PlatformInstallGuide {
  return {
    ...partial,
    steps: {
      tr: partial.stepsTr,
      en: partial.stepsEn || partial.stepsTr,
    },
    placement: {
      tr: partial.placementTr,
      en: partial.placementEn || partial.placementTr,
    },
  }
}

/** Tüm e-ticaret ve site platformları — panel + marketing tek kaynak */
export const PLATFORM_INSTALL_GUIDES: PlatformInstallGuide[] = [
  guide({
    id: 'shopify',
    name: 'Shopify',
    category: 'ecommerce',
    featured: true,
    region: 'global',
    accent: '#96bf48',
    desc: {
      tr: 'Shopify mağazanıza canlı sohbet; tema düzenleyici ile 2 dakikada kurulum.',
      en: 'Live chat for Shopify stores via theme editor in about 2 minutes.',
    },
    placementTr: 'Online Mağaza → Temalar → Düzenle → theme.liquid → </body> öncesi',
    placementEn: 'Online Store → Themes → Edit → theme.liquid → before </body>',
    stepsTr: [
      'Shopify yönetim panelinde Online Mağaza → Temalar → Düzenle.',
      'theme.liquid dosyasını açın, </body> etiketini bulun.',
      'Widget kodunu </body> satırının hemen üstüne yapıştırın.',
      'Kaydedin ve mağazayı önizleyerek sağ alttaki sohbet balonunu test edin.',
    ],
    stepsEn: [
      'In Shopify admin: Online Store → Themes → Edit code.',
      'Open theme.liquid and find </body>.',
      'Paste the widget snippet right above </body>.',
      'Save and preview your storefront to test the chat launcher.',
    ],
  }),
  guide({
    id: 'wordpress',
    name: 'WordPress',
    category: 'cms',
    featured: true,
    region: 'global',
    accent: '#21759b',
    desc: {
      tr: 'Klasik tema, block tema veya “Header/Footer Scripts” eklentisi ile kurulum.',
      en: 'Install via classic theme, block theme, or a header/footer scripts plugin.',
    },
    placementTr: 'Görünüm → Tema Dosya Düzenleyici → footer.php veya eklenti “Footer” alanı',
    stepsTr: [
      'WordPress yönetim → Görünüm → Tema Dosya Düzenleyici (veya Code Snippets / Insert Headers and Footers eklentisi).',
      'footer.php içinde </body> öncesine widget kodunu ekleyin.',
      'Alternatif: “Insert Headers and Footers” eklentisinde Footer bölümüne yapıştırın.',
      'Önbellek eklentiniz varsa temizleyip siteyi ziyaret edin.',
    ],
  }),
  guide({
    id: 'woocommerce',
    name: 'WooCommerce',
    category: 'ecommerce',
    featured: true,
    region: 'global',
    accent: '#96588a',
    desc: {
      tr: 'WordPress + WooCommerce mağazalarında sepet ve ürün sayfalarında canlı destek.',
      en: 'Live support on product, cart, and checkout pages for WooCommerce.',
    },
    placementTr: 'WordPress footer.php veya WooCommerce uyumlu footer hook',
    stepsTr: [
      'WordPress kurulum adımlarını uygulayın (footer veya eklenti).',
      'Kod tüm sayfalarda yüklensin — özellikle ürün, sepet ve ödeme sayfalarını test edin.',
      'WooCommerce önbellek/CDN varsa widget.js için istisna tanımlayın.',
    ],
  }),
  guide({
    id: 'wix',
    name: 'Wix',
    category: 'builder',
    featured: true,
    region: 'global',
    accent: '#0C6EFC',
    desc: {
      tr: 'Wix Sitesi ve Wix Stores — özel kod ile tüm sayfalara widget.',
      en: 'Wix Sites and Wix Stores — custom code on all pages.',
    },
    placementTr: 'Ayarlar → Özel kod → Gövde - son (Body - end)',
    stepsTr: [
      'Wix Dashboard → Ayarlar → Özel kod (Custom Code).',
      '“+ Yeni kod ekle” → Konum: Gövde - son (Body - end).',
      'Widget kodunu yapıştırın, tüm sayfalara uygula seçeneğini işaretleyin.',
      'Yayınlayın ve canlı sitede test edin.',
    ],
  }),
  guide({
    id: 'ideasoft',
    name: 'IdeaSoft',
    category: 'ecommerce',
    featured: true,
    region: 'tr',
    accent: '#e85d04',
    desc: {
      tr: 'IdeaSoft mağazalarında tema ayarları veya HTML blok ile widget.',
      en: 'Widget install for IdeaSoft storefronts via theme or HTML block.',
    },
    placementTr: 'Yönetim → Tasarım → HTML/CSS veya footer şablonu',
    stepsTr: [
      'IdeaSoft yönetim panelinde Tasarım / Tema ayarlarına gidin.',
      'Footer veya “HTML blok” alanına widget kodunu ekleyin.',
      'Tüm sayfalarda göründüğünü doğrulayın; mobil görünümü test edin.',
    ],
  }),
  guide({
    id: 'ticimax',
    name: 'Ticimax',
    category: 'ecommerce',
    featured: true,
    region: 'tr',
    accent: '#0066cc',
    desc: {
      tr: 'Ticimax e-ticaret sitelerinde footer veya script alanına ekleme.',
      en: 'Add widget to Ticimax footer or custom script area.',
    },
    placementTr: 'Panel → Tasarım → Script / Footer alanı',
    stepsTr: [
      'Ticimax yönetim → Tasarım veya Site Ayarları → Özel Script / Footer.',
      'Widget kodunu </body> öncesine denk gelecek alana yapıştırın.',
      'Kaydedip mağaza ana sayfasından test edin.',
    ],
  }),
  guide({
    id: 'ikas',
    name: 'ikas',
    category: 'ecommerce',
    featured: true,
    region: 'tr',
    accent: '#6366f1',
    desc: {
      tr: 'ikas mağazalarında tema düzenleyici veya uygulama script alanı.',
      en: 'ikas stores — theme editor or custom script section.',
    },
    placementTr: 'ikas Panel → Online Mağaza → Tema → Özel Kod',
    stepsTr: [
      'ikas panel → Online Mağaza → Temalar → Düzenle.',
      '“Özel kod” / “Script ekle” bölümüne widget kodunu yapıştırın.',
      'Yayınlayın ve sepet sayfasında da göründüğünü kontrol edin.',
    ],
  }),
  guide({
    id: 'tsoft',
    name: 'T-Soft',
    category: 'ecommerce',
    region: 'tr',
    accent: '#0ea5e9',
    desc: {
      tr: 'T-Soft altyapılı mağazalarda footer script entegrasyonu.',
      en: 'Footer script integration for T-Soft commerce sites.',
    },
    placementTr: 'T-Soft yönetim → Tasarım → Footer script',
    stepsTr: [
      'T-Soft panelinde site tasarım / footer script alanını açın.',
      'Widget kodunu ekleyin ve site genelinde aktif edin.',
    ],
  }),
  guide({
    id: 'magento',
    name: 'Magento / Adobe Commerce',
    category: 'ecommerce',
    region: 'global',
    accent: '#f26322',
    desc: {
      tr: 'Magento 2 tema layout veya Admin HTML Head/Foot yapılandırması.',
      en: 'Magento 2 theme layout or Admin HTML Head/Foot config.',
    },
    placementTr: 'Content → Design → Configuration → HTML Head/Foot veya default.xml',
    stepsTr: [
      'Admin → Content → Design → Configuration → HTML Head/Foot bölümüne ekleyin.',
      'Alternatif: tema default.xml içinde before </body> block tanımlayın.',
      'Cache temizleyip storefront’u test edin.',
    ],
  }),
  guide({
    id: 'prestashop',
    name: 'PrestaShop',
    category: 'ecommerce',
    region: 'global',
    accent: '#df0067',
    desc: {
      tr: 'PrestaShop tema footer.tpl veya modül ile global script.',
      en: 'PrestaShop theme footer.tpl or module for global script.',
    },
    placementTr: 'themes/[tema]/templates/_partials/footer.tpl',
    stepsTr: [
      'FTP veya tema düzenleyici ile footer.tpl dosyasını açın.',
      '</body> öncesine widget kodunu ekleyin.',
      'Önbelleği temizleyin.',
    ],
  }),
  guide({
    id: 'opencart',
    name: 'OpenCart',
    category: 'ecommerce',
    region: 'global',
    accent: '#23a8e0',
    desc: {
      tr: 'OpenCart catalog/view/theme/.../footer.twig veya common/footer.',
      en: 'OpenCart theme footer template integration.',
    },
    placementTr: 'catalog/view/theme/[tema]/template/common/footer.twig',
    stepsTr: [
      'Tema footer şablonunu düzenleyin.',
      'Widget kodunu footer kapanışından önce ekleyin.',
    ],
  }),
  guide({
    id: 'bigcommerce',
    name: 'BigCommerce',
    category: 'ecommerce',
    region: 'global',
    accent: '#34313f',
    desc: {
      tr: 'BigCommerce Script Manager ile tüm sayfalara footer script.',
      en: 'BigCommerce Script Manager — footer script on all pages.',
    },
    placementTr: 'Storefront → Script Manager → Footer',
    stepsTr: [
      'BigCommerce → Storefront → Script Manager.',
      'Yeni script → Location: Footer, Pages: All.',
      'Widget kodunu yapıştırın ve kaydedin.',
    ],
  }),
  guide({
    id: 'nopcommerce',
    name: 'NopCommerce',
    category: 'ecommerce',
    region: 'global',
    accent: '#1a5a96',
    desc: {
      tr: '.NET NopCommerce temasında _Root.razor / _Layout.cshtml footer.',
      en: 'NopCommerce _Root.razor or layout footer integration.',
    },
    placementTr: 'Views/Shared/_Root.cshtml veya _ColumnsOne.cshtml footer',
    stepsTr: [
      'Tema layout dosyasında </body> öncesine widget kodunu ekleyin.',
      'Uygulamayı yeniden derleyip yayınlayın.',
    ],
  }),
  guide({
    id: 'platinmarket',
    name: 'PlatinMarket',
    category: 'ecommerce',
    region: 'tr',
    accent: '#7c3aed',
    desc: {
      tr: 'PlatinMarket mağaza yönetiminde özel HTML / script alanı.',
      en: 'PlatinMarket custom HTML or script section.',
    },
    placementTr: 'Yönetim → Tasarım → Footer / Özel Kod',
    stepsTr: [
      'PlatinMarket panelinde footer veya özel kod alanına widget ekleyin.',
      'Tüm vitrin sayfalarında test edin.',
    ],
  }),
  guide({
    id: 'projesoft',
    name: 'Projesoft',
    category: 'ecommerce',
    region: 'tr',
    accent: '#0891b2',
    desc: {
      tr: 'Projesoft e-ticaret sitelerinde tema footer script.',
      en: 'Projesoft theme footer script integration.',
    },
    placementTr: 'Yönetim → Site Ayarları → Script',
    stepsTr: [
      'Projesoft yönetim panelinde site script / footer bölümünü açın.',
      'Widget kodunu kaydedin ve canlı sitede doğrulayın.',
    ],
  }),
  guide({
    id: 'nebim',
    name: 'Nebim V3',
    category: 'ecommerce',
    region: 'tr',
    accent: '#b45309',
    desc: {
      tr: 'Nebim entegrasyonlu e-ticaret vitrinlerinde HTML footer.',
      en: 'HTML footer for Nebim-integrated storefronts.',
    },
    placementTr: 'E-ticaret vitrin yönetimi → Şablon → Footer',
    stepsTr: [
      'Vitrin şablon yönetiminde footer HTML alanına widget kodunu ekleyin.',
      'CDN/önbellek varsa script yolunu whitelist edin.',
    ],
  }),
  guide({
    id: 'shopware',
    name: 'Shopware',
    category: 'ecommerce',
    region: 'global',
    accent: '#189eff',
    desc: {
      tr: 'Shopware 6 tema base.html.twig footer block.',
      en: 'Shopware 6 base.html.twig footer block.',
    },
    placementTr: 'Resources/views/storefront/layout/meta.html.twig veya base',
    stepsTr: [
      'Tema düzenleyicide footer veya base template açın.',
      '</body> öncesine widget kodunu ekleyin.',
      'Theme derleyip deploy edin.',
    ],
  }),
  guide({
    id: 'ecwid',
    name: 'Ecwid',
    category: 'ecommerce',
    region: 'global',
    accent: '#007cba',
    desc: {
      tr: 'Ecwid embed sitelerinde veya WordPress/Wix Ecwid sayfalarında widget.',
      en: 'Widget alongside Ecwid on any embedded storefront page.',
    },
    placementTr: 'Ecwid’in gömülü olduğu ana site footer’ı',
    stepsTr: [
      'Ecwid mağazasının gömülü olduğu web sitesinin footer’ına kodu ekleyin.',
      'Mağaza sayfası ve ana site birlikte test edin.',
    ],
  }),
  guide({
    id: 'squarespace',
    name: 'Squarespace',
    category: 'builder',
    region: 'global',
    accent: '#000000',
    desc: {
      tr: 'Squarespace Code Injection — Footer bölümü.',
      en: 'Squarespace Code Injection — Footer section.',
    },
    placementTr: 'Ayarlar → Gelişmiş → Code Injection → Footer',
    stepsTr: [
      'Squarespace → Settings → Advanced → Code Injection.',
      'Footer alanına widget kodunu yapıştırın.',
      'Kaydedip siteyi yayınlayın.',
    ],
  }),
  guide({
    id: 'webflow',
    name: 'Webflow',
    category: 'builder',
    region: 'global',
    accent: '#4353ff',
    desc: {
      tr: 'Webflow Project Settings → Custom Code → Footer.',
      en: 'Webflow Project Settings → Custom Code → Footer.',
    },
    placementTr: 'Project Settings → Custom Code → Footer Code',
    stepsTr: [
      'Webflow projesinde Settings → Custom Code.',
      'Footer Code alanına widget kodunu ekleyin.',
      'Publish ile canlıya alın.',
    ],
  }),
  guide({
    id: 'godaddy',
    name: 'GoDaddy Website Builder',
    category: 'builder',
    region: 'global',
    accent: '#1bdbdb',
    desc: {
      tr: 'GoDaddy Websites + Marketing — HTML / script bölümü.',
      en: 'GoDaddy Websites + Marketing HTML section.',
    },
    placementTr: 'Website Builder → Site Ayarları → HTML / Head-Foot',
    stepsTr: [
      'GoDaddy site düzenleyicide Ayarlar → HTML veya Head/Foot bölümünü açın.',
      'Footer script alanına widget kodunu yapıştırın.',
    ],
  }),
  guide({
    id: 'weebly',
    name: 'Weebly',
    category: 'builder',
    region: 'global',
    accent: '#0090ff',
    desc: {
      tr: 'Weebly Settings → SEO → Footer Code.',
      en: 'Weebly Settings → SEO → Footer Code.',
    },
    placementTr: 'Settings → SEO → Footer Code',
    stepsTr: [
      'Weebly editör → Settings → SEO.',
      'Footer Code alanına widget kodunu ekleyin.',
      'Publish edin.',
    ],
  }),
  guide({
    id: 'joomla',
    name: 'Joomla',
    category: 'cms',
    region: 'global',
    accent: '#5091cd',
    desc: {
      tr: 'Joomla template index.php veya “Custom HTML” modülü.',
      en: 'Joomla index.php or Custom HTML module.',
    },
    placementTr: 'templates/[tema]/index.php veya modül pozisyonu footer',
    stepsTr: [
      'Şablon index.php içinde </body> öncesine ekleyin.',
      'Alternatif: Custom HTML modülünü footer pozisyonuna yerleştirin.',
    ],
  }),
  guide({
    id: 'drupal',
    name: 'Drupal',
    category: 'cms',
    region: 'global',
    accent: '#0678be',
    desc: {
      tr: 'Drupal tema html.html.twig veya block ile global script.',
      en: 'Drupal html.html.twig or block for global script.',
    },
    placementTr: 'themes/custom/templates/html.html.twig',
    stepsTr: [
      'Aktif temanın html.html.twig dosyasında </body> öncesine kodu ekleyin.',
      'Drupal önbelleğini temizleyin.',
    ],
  }),
  guide({
    id: 'ghost',
    name: 'Ghost',
    category: 'cms',
    region: 'global',
    accent: '#15171a',
    desc: {
      tr: 'Ghost Code injection — Site footer.',
      en: 'Ghost Code injection — Site footer.',
    },
    placementTr: 'Settings → Code injection → Site Footer',
    stepsTr: [
      'Ghost Admin → Settings → Code injection.',
      'Site Footer alanına widget kodunu yapıştırın.',
    ],
  }),
  guide({
    id: 'hubspot-cms',
    name: 'HubSpot CMS',
    category: 'cms',
    region: 'global',
    accent: '#ff7a59',
    desc: {
      tr: 'HubSpot Site Footer HTML veya theme module.',
      en: 'HubSpot site footer HTML or theme module.',
    },
    placementTr: 'Settings → Website → Pages → Site footer HTML',
    stepsTr: [
      'HubSpot → Settings → Website → Pages → Site footer HTML.',
      'Widget kodunu ekleyin ve sayfaları yeniden yayınlayın.',
    ],
  }),
  guide({
    id: 'nextjs',
    name: 'Next.js / React',
    category: 'framework',
    featured: true,
    region: 'global',
    accent: '#000000',
    desc: {
      tr: 'app/layout.tsx veya pages/_document.tsx içinde Script bileşeni.',
      en: 'Script component in app/layout.tsx or pages/_document.tsx.',
    },
    placementTr: 'Root layout — </body> kapanmadan önce',
    stepsTr: [
      'app/layout.tsx (App Router) veya pages/_document.tsx (Pages Router) açın.',
      'Widget kodunu Script/next/script veya dangerouslySetInnerHTML ile body sonuna ekleyin.',
      'Deploy sonrası tüm rotalarda test edin.',
    ],
  }),
  guide({
    id: 'vue-nuxt',
    name: 'Vue / Nuxt',
    category: 'framework',
    region: 'global',
    accent: '#42b883',
    desc: {
      tr: 'nuxt.config app.head.script veya App.vue mounted hook.',
      en: 'nuxt.config app.head.script or App.vue setup.',
    },
    placementTr: 'nuxt.config.ts → app.head.script veya app.vue',
    stepsTr: [
      'Nuxt: nuxt.config.ts içinde app.head.script dizisine widget.js ekleyin.',
      'Vue SPA: public/index.html </body> öncesine snippet ekleyin.',
    ],
  }),
  guide({
    id: 'laravel',
    name: 'Laravel / PHP',
    category: 'framework',
    region: 'global',
    accent: '#ff2d20',
    desc: {
      tr: 'resources/views/layouts/app.blade.php footer section.',
      en: 'resources/views/layouts/app.blade.php footer.',
    },
    placementTr: "layouts/app.blade.php → @stack('scripts') veya footer",
    stepsTr: [
      'Ana blade layout dosyasında </body> öncesine @include veya ham script ekleyin.',
      'Tüm rotalarda layout’un extend edildiğinden emin olun.',
    ],
  }),
  guide({
    id: 'html-custom',
    name: 'HTML / Özel Site',
    category: 'framework',
    featured: true,
    region: 'global',
    accent: '#64748b',
    desc: {
      tr: 'Statik HTML, PHP veya herhangi bir sitede tek snippet yeterli.',
      en: 'Static HTML, PHP, or any custom site — one snippet is enough.',
    },
    placementTr: 'Her sayfanın </body> etiketinden hemen önce',
    stepsTr: [
      'Tüm sayfalarda ortak footer veya şablon dosyasına widget kodunu ekleyin.',
      'CDN/Cloudflare kullanıyorsanız widget.js için cache bypass kontrol edin.',
      SNIPPET_NOTE.tr,
    ],
  }),
  guide({
    id: 'jimdo',
    name: 'Jimdo',
    category: 'builder',
    region: 'global',
    accent: '#3b82f6',
    desc: {
      tr: 'Jimdo Pro+ Edit Head / Footer HTML.',
      en: 'Jimdo Pro+ Edit Head / Footer HTML.',
    },
    placementTr: 'Ayarlar → Head/Foot HTML → Footer',
    stepsTr: [
      'Jimdo Creator → Ayarlar → Head/Foot HTML.',
      'Footer bölümüne widget kodunu yapıştırın.',
    ],
  }),
  guide({
    id: 'duda',
    name: 'Duda',
    category: 'builder',
    region: 'global',
    accent: '#ff6b00',
    desc: {
      tr: 'Duda Site Settings → HEAD / Body end HTML.',
      en: 'Duda Site Settings → HEAD / Body end HTML.',
    },
    placementTr: 'Site Settings → HEAD HTML → Body end',
    stepsTr: [
      'Duda editör → Site Settings → HEAD HTML.',
      'Body end alanına widget kodunu ekleyin.',
    ],
  }),
  guide({
    id: 'carrd',
    name: 'Carrd',
    category: 'builder',
    region: 'global',
    accent: '#2563eb',
    desc: {
      tr: 'Carrd Pro — Page Settings → Code → Footer.',
      en: 'Carrd Pro — Page Settings → Code → Footer.',
    },
    placementTr: 'Page Settings → Code → Footer (Pro plan)',
    stepsTr: [
      'Carrd Pro ile sayfa ayarlarından Footer code alanına ekleyin.',
      'Çok sayfalı sitede her sayfaya veya ortak embed kullanın.',
    ],
  }),
  guide({
    id: 'salesforce-commerce',
    name: 'Salesforce Commerce',
    category: 'ecommerce',
    region: 'global',
    accent: '#00a1e0',
    desc: {
      tr: 'SFCC Business Manager — content slot veya template footer.',
      en: 'SFCC Business Manager content slot or template footer.',
    },
    placementTr: 'BM → Merchant Tools → Content → Footer slot',
    stepsTr: [
      'Business Manager’da global footer content asset oluşturun.',
      'Widget kodunu asset HTML’ine ekleyip tüm storefront’a bağlayın.',
    ],
  }),
  guide({
    id: 'shift4shop',
    name: 'Shift4Shop (3dcart)',
    category: 'ecommerce',
    region: 'global',
    accent: '#00529b',
    desc: {
      tr: 'Shift4Shop Core Template Footer script alanı.',
      en: 'Shift4Shop core template footer script area.',
    },
    placementTr: 'Design → Template Manager → Footer',
    stepsTr: [
      'Shift4Shop panel → Design → Template Manager.',
      'Footer script bölümüne widget kodunu ekleyin.',
    ],
  }),
  guide({
    id: 'stockmount',
    name: 'StockMount',
    category: 'ecommerce',
    region: 'tr',
    accent: '#16a34a',
    desc: {
      tr: 'StockMount vitrin sitelerinde footer script.',
      en: 'StockMount storefront footer script.',
    },
    placementTr: 'Panel → Site → Footer script',
    stepsTr: [
      'StockMount yönetiminde site footer script alanına widget ekleyin.',
    ],
  }),
  guide({
    id: 'trendyol-go',
    name: 'Trendyol GO / Pazaryeri',
    category: 'ecommerce',
    region: 'tr',
    accent: '#f27a1a',
    desc: {
      tr: 'Pazaryeri vitrininde değil; kendi marka sitenize widget ekleyin.',
      en: 'Not on marketplace pages — add widget to your own brand website.',
    },
    placementTr: 'Kendi domain’inizdeki e-ticaret veya landing sayfası',
    stepsTr: [
      'Trendyol GO satıcı paneli mağaza sayfasına widget eklenemez.',
      'Kendi web siteniz (Shopify, ikas, WordPress vb.) üzerinden kurulum yapın.',
      'Müşterileri destek için site linkinizi pazaryeri profilinize ekleyin.',
    ],
  }),
]

export const PLATFORM_CATEGORY_LABELS: Record<
  PlatformCategory,
  { tr: string; en: string }
> = {
  ecommerce: { tr: 'E-Ticaret', en: 'E-commerce' },
  cms: { tr: 'CMS & Blog', en: 'CMS & Blog' },
  builder: { tr: 'Site Oluşturucu', en: 'Site Builder' },
  framework: { tr: 'Framework & Özel', en: 'Framework & Custom' },
}

export function getPlatformSnippet(websiteId: string): string {
  return buildWidgetInstallSnippet(websiteId || 'WEBSITE_ID')
}

export function getFeaturedPlatforms(): PlatformInstallGuide[] {
  return PLATFORM_INSTALL_GUIDES.filter((p) => p.featured)
}

export function getPlatformsByCategory(category: PlatformCategory): PlatformInstallGuide[] {
  return PLATFORM_INSTALL_GUIDES.filter((p) => p.category === category)
}

export function searchPlatforms(query: string): PlatformInstallGuide[] {
  const q = query.trim().toLowerCase()
  if (!q) return PLATFORM_INSTALL_GUIDES
  return PLATFORM_INSTALL_GUIDES.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.desc.tr.toLowerCase().includes(q) ||
      p.desc.en.toLowerCase().includes(q)
  )
}

/** Marketing integrations sayfası için kart formatı */
export function toMarketingIntegrationItems(locale: 'tr' | 'en' = 'tr') {
  return PLATFORM_INSTALL_GUIDES.map((p) => ({
    name: p.name,
    desc: locale === 'en' ? p.desc.en : p.desc.tr,
    status: 'active' as const,
    category: p.category,
    accent: p.accent,
    id: p.id,
  }))
}

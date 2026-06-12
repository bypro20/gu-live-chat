import type { HomeMessages } from './home-types'

export const homeEn: HomeMessages = {
  trustStrip: {
    title: 'Why Gu Live Chat?',
    stats: [
      { value: '30 sec', label: 'Setup time' },
      { value: '7 days', label: 'Free PRO trial' },
      { value: '50+', label: 'Languages supported' },
      { value: 'GDPR', label: 'Ready infrastructure' },
    ],
  },
  mobileApp: {
    badge: 'Android App',
    title: 'Download our Android app',
    desc: 'At home, at work, on the go — keep talking to customers anywhere. Inbox, notifications, and quick replies in your pocket.',
    download: 'Download APK — Free',
    setup: 'Setup guide',
    note: 'Android 7.0+ · Sign in with your Gu Live Chat account',
    iconAlt: 'Gu Live Chat Android app icon',
  },
  features: {
    label: 'Features',
    title: 'Everything in one platform',
    subtitle: 'All the tools you need to run customer support end to end.',
    items: [
      { title: 'Live Chat', desc: 'Millisecond messaging, typing indicators, and file sharing.' },
      { title: 'AI Chat Assistant', desc: 'Human-like replies with GPT/Gemini — included on Pro, add-on on lower plans.' },
      { title: 'Unified Inbox', desc: 'Widget, email, and messaging channels on one screen.' },
      { title: 'Live Translation', desc: 'Two-way instant translation in 50+ languages — agents and visitors each use their own language.' },
      { title: 'Visitor Tracking', desc: 'Live visitor list, page history, and behavior analytics.' },
      { title: 'Knowledge Base', desc: 'Reduce support load with a self-service help center.' },
      { title: 'Analytics', desc: 'Response times, resolution rates, and team performance.' },
    ],
    cta: 'See all features',
  },
  ai: {
    label: 'AI Agent',
    title: 'Resolve most chats automatically',
    desc: 'Gu Live Chat AI Agent handles routine requests instantly, answers from your knowledge base, and saves agent hours — scale support without hiring.',
    steps: [
      { title: 'Connect your knowledge base', desc: 'Upload articles so AI learns your context.' },
      { title: 'Define workflows', desc: 'Set greeting, routing, and escalation rules.' },
      { title: 'Reply 24/7', desc: 'Let AI assist customers day and night.' },
      { title: 'Hand off to agents', desc: 'Complex requests transfer to live agents in one click.' },
    ],
    cta: 'Explore AI features',
  },
  translate: {
    label: 'Live Translation',
    title: 'Talk to customers anywhere in the world',
    desc: 'Real-time two-way translation. Agents write in their language, visitors read in theirs — same engine in widget, inbox, and admin.',
    bullets: [
      '20+ languages (Google + AI engine)',
      'Auto-detect in inbox',
      'One-click translate in widget',
      'Unlimited on PRO plan',
    ],
    cta: 'View PRO plan',
    demoStatus: 'Live translation active · TR ↔ EN',
    demos: [
      { lang: '🇩🇪 German', msg: 'Wo ist meine Bestellung?', translated: 'Where is my order?' },
      { lang: '🇬🇧 English', msg: 'I need a refund please', translated: 'I need a refund please' },
      { lang: '🇫🇷 French', msg: "Pouvez-vous m'aider?", translated: 'Can you help me?' },
    ],
  },
  inbox: {
    label: 'Unified Inbox',
    title: 'Chats, customers, and tickets in one place',
    desc: 'Manage widget, WhatsApp, Instagram, Telegram, and email in one inbox. Desktop notifications so you never miss a request; visitor profiles and history on one screen.',
    cta: 'View integrations',
    channels: ['Widget', 'Email', 'WhatsApp', 'Messenger', 'Instagram', 'Telegram'],
    samples: [
      { from: 'Widget', name: 'Sarah K.', msg: 'Order status?', time: '2m' },
      { from: 'Email', name: 'Mike D.', msg: 'Invoice request', time: '14m' },
      { from: 'WhatsApp', name: 'Emma A.', msg: 'Return process', time: '1h' },
    ],
  },
  knowledge: {
    label: 'Knowledge Base',
    title: 'Let customers help themselves',
    desc: 'Build a self-service help center with articles, categories, and search. Cut repetitive questions and save your team time.',
    searchPlaceholder: 'How can we help?',
    articles: [
      { title: 'Setup guide', count: '3 articles' },
      { title: 'Widget settings', count: '3 articles' },
      { title: 'Billing & plans', count: '3 articles' },
      { title: 'API documentation', count: '3 articles' },
    ],
  },
  automation: {
    label: 'Automation',
    title: 'Automate repetitive work',
    desc: 'Build trigger-and-action flows with the workflow editor. Greeting messages, tagging, routing, and webhook triggers.',
    bullets: ['New visitor greeting', 'After-hours auto-reply', 'CRM sync via webhook'],
    flows: [
      { trigger: 'New chat started', action: 'Send greeting message' },
      { trigger: 'After hours', action: 'Share knowledge base link' },
      { trigger: 'Tag: urgent', action: 'Assign agent + Slack alert' },
    ],
  },
  products: {
    label: 'Products',
    title: 'Modular solutions for your business',
    buy: 'Buy Now',
    items: [
      { title: 'Chat Widget', desc: 'Add to your site in seconds. Start on the free plan.', href: '/urunler#paketler' },
      { title: 'Customer CRM', desc: 'Manage relationships with contact profiles, chat history, and tags.', href: '/features#crm' },
      { title: 'AI Engine', desc: 'Smart replies, auto-classification, and suggestion system.', href: '/ai' },
      { title: 'Analytics Dashboard', desc: 'Real-time metrics and exportable reports.', href: '/urunler#eklentiler' },
    ],
  },
  useCases: {
    label: 'Use Cases',
    title: 'Gu Live Chat for every team',
    cases: [
      {
        id: 'support',
        label: 'Support',
        title: 'Speed up customer support',
        desc: 'Shorten response times and improve resolution rates. Empower your team with canned replies and a knowledge base.',
        bullets: ['Omnichannel inbox', 'SLA tracking', 'Satisfaction ratings'],
      },
      {
        id: 'sales',
        label: 'Sales',
        title: 'Turn visitors into customers',
        desc: 'Never miss a sales opportunity with proactive messages and live chat. Intervene at the right moment based on visitor behavior.',
        bullets: ['Proactive triggers', 'Visitor profiles', 'Lead capture'],
      },
      {
        id: 'marketing',
        label: 'Marketing',
        title: 'Boost engagement with campaigns',
        desc: 'Reach the right audience with targeted messages, announcements, and automation flows.',
        bullets: ['Campaign management', 'Segmentation', 'A/B testing support'],
      },
    ],
  },
  testimonials: {
    title: 'What our customers say',
    items: [
      { quote: 'Screen monitoring and instant intervention noticeably improved our customer satisfaction.', author: 'James Y.', role: 'E-commerce Manager', initials: 'JY' },
      { quote: 'Widget setup took seconds. The chatbot resolves half of incoming requests automatically.', author: 'Sarah A.', role: 'Operations Manager', initials: 'SA' },
      { quote: 'All channels on one screen, reports in real time. The Pro plan is a complete business solution.', author: 'Brian K.', role: 'IT Manager', initials: 'BK' },
    ],
  },
  faq: {
    title: 'Frequently asked questions',
    items: [
      { q: 'How long does it take to add Gu Live Chat to my site?', a: 'Add one line of code — it works in 30 seconds. No technical skills required. WordPress, Shopify, and all websites are supported.' },
      { q: 'Is live chat software free?', a: 'Yes. The free plan includes 2 agents, 100 chats per month, a basic widget, and email notifications. Upgrade anytime for more capacity.' },
      { q: 'Do you support WhatsApp live chat?', a: 'Yes. On the Professional plan, WhatsApp Business integration lets you manage WhatsApp messages in the unified inbox.' },
      { q: 'Is there chatbot and AI support?', a: 'Yes. A visual chatbot builder and GPT/Gemini-powered AI assistant are included on the Professional plan. Answer repetitive questions 24/7.' },
      { q: 'Can I change plans?', a: 'Yes. Upgrade or downgrade anytime. No data loss — changes take effect immediately.' },
      { q: 'Is my data secure?', a: 'SSL/TLS encryption, GDPR-ready practices, and regular backups. 99.9% uptime guarantee.' },
      { q: 'How many agents are supported?', a: 'Free: 2, Starter: 5, Professional: 25, Business: unlimited agents.' },
      { q: 'Who built Gu Live Chat?', a: 'Gu Live Chat is a live chat and chatbot platform built in Turkey, serving global teams with multi-currency payments via iyzico.' },
    ],
  },
  footerCta: {
    title: 'Get started today',
    desc: 'Try free without a credit card. Setup takes 30 seconds.',
    badges: ['GDPR ready', 'Built in Turkey', '24/7 support'],
    register: 'Create Free Account',
    contact: 'Contact Us',
  },
  planFeatures: {
    FREE: ['2 Agents', '100 Chats / Month', 'Basic Widget', 'Email Notifications'],
    STARTER: ['5 Agents', '1,000 Chats / Month', 'Visitor Tracking', 'Knowledge Base & Tickets', 'Canned Replies', 'AI Chat (via add-on)'],
    PRO: ['25 Agents', 'Unlimited Chats', 'AI Chat Assistant (GPT/Gemini)', 'Chatbot Builder', '50+ Language Translation', 'WhatsApp / Email / Messenger', 'API & Webhooks', 'Analytics & Reports'],
    BUSINESS: ['Unlimited Agents', 'Unlimited Chats', 'AI Assistant & Chatbot', 'White-label Branding', 'SLA Guarantee (99.9%)', '24/7 Priority Support', 'Custom Integration'],
  },
  mobilPage: {
    metaTitle: 'Download Mobile App — Gu Live Chat Android APK',
    metaDescription:
      'Download the Gu Live Chat Android app. Inbox, instant notifications, and reply to customer messages from your phone. Free APK.',
    badge: 'Mobile App',
    title: 'Gu Live Chat Android',
    subtitle:
      'Reply to customer messages instantly from your phone. Inbox, notifications, and quick replies — all in your pocket.',
    versionNote: 'Version {version} · Android 7.0+ · No address bar',
    download: 'Download APK (Android)',
    noAccount: "Don't have an account yet?",
    registerLink: 'Sign up free',
    features: [
      { title: 'Inbox', desc: 'All channels in one screen' },
      { title: 'Instant Notifications', desc: 'Get notified when new messages arrive' },
      { title: 'Secure', desc: 'SSL encryption, same panel security' },
    ],
    installTitle: 'Installation steps',
    installWarning:
      'First delete the old shortcut you added from Chrome. That is why the web address appears at the top — the APK below is the real app with no address bar.',
    steps: [
      'Tap Download APK and save the file.',
      'On your phone, enable Settings → Security → Install from unknown sources (or confirm during download).',
      'Open the downloaded GuLiveChat.apk file and tap Install.',
      'Open the app, sign in with your Gu Live Chat account — you are ready!',
    ],
    iphoneNote: 'iPhone users can access Gu Live Chat via the web panel and PWA.',
    webLogin: 'Sign in via web panel',
    iconAlt: 'Gu Live Chat app icon',
  },
  mobileBar: {
    download: 'Download Android App — Free',
    tagline: 'At home, at work, on the go — keep talking to your customers',
    navShort: 'Download',
  },
}

export const footerEn = {
  taglineExtra: 'Live chat, AI assistant, and unified inbox — built in Turkey.',
  columns: [
    {
      title: 'Product',
      links: [
        { label: 'Products & Pricing', href: '/urunler' },
        { label: 'Mobile App', href: '/mobil-indir' },
        { label: 'Live Chat', href: '/canli-destek' },
        { label: 'Chatbot', href: '/chatbot' },
        { label: 'WhatsApp Support', href: '/whatsapp-destek' },
        { label: 'Features', href: '/features' },
        { label: 'Integrations', href: '/integrations' },
        { label: 'Pricing', href: '/pricing' },
        { label: 'Apps & Add-ons', href: '/apps' },
        { label: 'Artificial Intelligence', href: '/ai' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'Help Center', href: '/help' },
        { label: 'Blog', href: '/blog' },
        { label: 'Contact', href: '/contact' },
        { label: 'FAQ', href: '/#faq' },
      ],
    },
    {
      title: 'Account',
      links: [
        { label: 'Sign In', href: '/login' },
        { label: 'Register', href: '/register' },
        { label: 'Request Demo', href: '/contact?konu=demo' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'About Us', href: '/hakkimizda' },
        { label: 'Privacy Policy', href: '/gizlilik' },
        { label: 'Delivery & Returns', href: '/teslimat-iade' },
        { label: 'Distance Sales Agreement', href: '/mesafeli-satis' },
        { label: 'Payment Security (SSL)', href: '/odeme-guvenligi' },
        { label: 'Terms of Use', href: '/kullanim-sartlari' },
        { label: 'GDPR / KVKK Notice', href: '/kvkk' },
        { label: 'Cookie Policy', href: '/cerez-politikasi' },
      ],
    },
  ],
  badges: {
    ssl: '256-bit SSL',
    privacy: 'GDPR Ready',
    madeIn: 'Made in Turkey',
    uptime: '99.9% Uptime',
  },
  iyzicoLinks: [
    { href: '/hakkimizda', label: 'About Us' },
    { href: '/urunler', label: 'Products' },
    { href: '/gizlilik', label: 'Privacy Policy' },
    { href: '/teslimat-iade', label: 'Delivery & Returns' },
    { href: '/mesafeli-satis', label: 'Distance Sales Agreement' },
    { href: '/odeme-guvenligi', label: 'Payment Security' },
  ],
}

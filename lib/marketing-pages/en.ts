import type { MarketingPages } from './types'

export const marketingEn: MarketingPages = {
  common: {
    legal: 'Legal',
    corporate: 'Corporate',
    security: 'Security',
    startFree: 'Start Free',
    seePricing: 'See Pricing',
    readMore: 'Read more',
    buyNow: 'Buy now',
    active: 'Active',
    addon: 'Add-on',
    popular: 'Popular',
    detail: 'Details',
    seeDetails: 'See details',
    customIntegration: 'Request custom integration',
    freeLabel: 'Free',
    perMonth: '/mo',
    productDetails: 'Product details',
    getQuote: 'Get a quote',
    notFoundHelp: 'Could not find what you need?',
    contactSupport: 'Contact support',
    menuAria: 'Open or close navigation menu',
  },
  seoChrome: {
    homeCrumb: 'Home',
    seePricing: 'See Pricing',
    faqTitle: 'Frequently Asked Questions',
    tryFreeTitle: 'Try it for free',
    tryFreeDesc: (trial: string) =>
      `Reach your customers instantly with Gu Live Chat. Setup takes 30 seconds and includes ${trial}.`,
    tryFreeCta: 'Start Free',
    relatedTitle: 'Related pages',
  },
  features: {
    badge: 'Features',
    title: 'One platform for customer service',
    subtitle: 'Omnichannel support, AI Agent, and a unified inbox in one place with Gu Live Chat.',
    ctaTitle: 'Start for free',
    ctaNote: 'No credit card required - Setup in 30 seconds',
    items: [
      {
        id: 'ai-agent',
        title: 'AI Agent',
        desc: 'Resolve standard requests instantly. Automated replies with knowledge base + LLM, then handoff to agents when needed.',
      },
      {
        id: 'widget',
        title: 'Live Chat Widget',
        desc: 'Real-time WebSocket messaging, file sharing, translation, and typing indicators.',
      },
      {
        id: 'translate',
        title: 'Live Translation (PRO)',
        desc: 'Two-way real-time translation in 50+ languages. Agents and visitors can chat smoothly across languages.',
      },
      {
        id: 'inbox',
        title: 'Unified Inbox',
        desc: 'Widget, WhatsApp, Instagram, Telegram, Messenger, and email in one panel with channel badges and filters.',
      },
      {
        title: 'AI Chat and Chatbot',
        desc: 'Human-like answers with GPT/Gemini (Professional+). Visual chatbot flows, FAQ automation, and workflows.',
      },
      {
        title: 'AI Writing Assistant',
        desc: 'Help agents write faster, clearer, and more effective responses with AI suggestions.',
      },
      {
        title: 'Multi-channel (PRO)',
        desc: 'WhatsApp Business, Instagram DM, Facebook Messenger, Telegram, and email integration.',
      },
      {
        title: 'Gu Marketing',
        desc: 'Run campaigns, targeted messages, and proactive chats to convert traffic into customers.',
      },
      {
        id: 'crm',
        title: 'Contacts and Visitor CRM',
        desc: 'Profiles, conversation history, tags, and live visitor tracking in a secure platform.',
      },
      {
        title: 'Video and Screen Monitoring',
        desc: 'Watch visitor screens in real time and provide visual product support (PRO).',
      },
      {
        title: 'Phone and SMS',
        desc: 'Automated SMS notifications with Twilio integration (Professional plan and above).',
      },
      {
        title: 'Knowledge Base',
        desc: 'FAQ and help articles to power AI Agent and chatbot context.',
      },
      {
        title: 'Workflow Automation',
        desc: 'Automated response flows based on triggers and actions.',
      },
      {
        id: 'analytics',
        title: 'Analytics and Performance',
        desc: 'Track channel mix, agent rankings, response times, and AI resolution rate.',
      },
      {
        title: 'API and Integrations',
        desc: 'Connect via REST API, webhooks, and ready-made integrations for CRM and custom tools.',
      },
      {
        title: 'Security',
        desc: 'SSL/TLS, KVKK alignment, and role-based access for secure operations.',
      },
      {
        title: 'Fast Setup',
        desc: 'Deploy with a one-line embed code and go live in 30 seconds.',
      },
    ],
  },
  integrations: {
    badge: 'Integrations',
    title: 'Connect with your existing tools',
    subtitle:
      'Gu Live Chat works seamlessly with messaging channels, automation tools, and major ecommerce platforms. Setup takes under 30 seconds on most platforms.',
    messagingTitle: 'Messaging Channels',
    messagingSubtitle: 'Bring every channel into one unified inbox.',
    automationTitle: 'Automation and API',
    automationSubtitle: 'Webhooks, REST API, and no-code automation tools.',
    ecommerceTitle: 'Ecommerce Platforms',
    ecommerceSubtitle: 'Works across all storefront stacks with a simple widget snippet.',
    ctaTitle: 'Ready to launch?',
    ctaSubtitle: 'Create your free account, paste the widget code, and connect channels from the dashboard.',
    customIntegration: 'Request custom integration',
    messaging: [
      {
        name: 'Live Chat Widget',
        desc: 'Add live chat to your website with one line of code.',
        status: 'active',
        href: '/canli-destek',
      },
      {
        name: 'WhatsApp Business',
        desc: 'Manage WhatsApp conversations in the unified inbox.',
        status: 'addon',
        href: '/whatsapp-destek',
      },
      {
        name: 'Facebook Messenger',
        desc: 'Reply to Messenger conversations from a single panel.',
        status: 'active',
      },
      {
        name: 'Instagram DM',
        desc: 'Route Instagram Direct messages into your inbox.',
        status: 'active',
      },
      {
        name: 'Telegram',
        desc: 'Forward Telegram bot conversations to your support team.',
        status: 'active',
      },
      {
        name: 'Email Channel',
        desc: 'Sync incoming email into inbox and send replies by email.',
        status: 'active',
      },
      {
        name: 'SMS (Twilio)',
        desc: 'Two-way SMS and notification workflows.',
        status: 'active',
      },
      {
        name: 'Slack',
        desc: 'Send conversation and message notifications to Slack.',
        status: 'active',
      },
    ],
    automation: [
      {
        name: 'Webhooks and REST API',
        desc: 'conversation.created, message.sent, and more for custom workflows.',
        status: 'active',
      },
      {
        name: 'Zapier and Make',
        desc: 'No-code automation across 5000+ apps.',
        status: 'active',
      },
      {
        name: 'Workflow Automation',
        desc: 'Build trigger-action automations for repetitive tasks.',
        status: 'active',
      },
      {
        name: 'Ecommerce Tracking',
        desc: 'Track cart, page view, and conversion events.',
        status: 'addon',
        href: '/apps',
      },
    ],
    ecommerce: [
      { name: 'Shopify', desc: 'Install widget and track orders and carts in Shopify stores.', status: 'active' },
      { name: 'WooCommerce', desc: 'Live support and chatbot for WooCommerce websites.', status: 'active' },
      { name: 'IdeaSoft', desc: 'One-click widget install for popular local storefronts.', status: 'active' },
      { name: 'Ticimax', desc: 'Visitor tracking and proactive messaging for Ticimax stores.', status: 'active' },
      { name: 'ikas', desc: 'Live chat and AI support for ikas commerce stores.', status: 'active' },
      { name: 'T-Soft', desc: 'Unified customer support for T-Soft storefronts.', status: 'active' },
      { name: 'Magento', desc: 'Integrated live support for Magento and Adobe Commerce.', status: 'active' },
      { name: 'OpenCart', desc: 'Instant support with lightweight widget deployment.', status: 'active' },
      { name: 'PrestaShop', desc: 'Multilingual customer support for PrestaShop stores.', status: 'active' },
      { name: 'Wix eCommerce', desc: 'Simple integration for Wix online stores.', status: 'active' },
      { name: 'BigCommerce', desc: 'Visitor and cart tracking in BigCommerce stores.', status: 'active' },
      { name: 'NopCommerce', desc: 'Live chat support for NopCommerce (.NET) stores.', status: 'active' },
      { name: 'PlatinMarket', desc: 'Customer support layer for PlatinMarket stores.', status: 'active' },
      { name: 'Projesoft', desc: 'Fast widget setup for Projesoft websites.', status: 'active' },
      { name: 'WordPress', desc: 'Install by plugin or snippet on any WordPress site.', status: 'active' },
      { name: 'Custom / Headless', desc: 'React, Next.js, Vue, and API-first custom stacks.', status: 'active' },
    ],
  },
  ai: {
    badge: 'Artificial Intelligence',
    title: 'Smarter support, measurable outcomes',
    subtitle:
      'The Gu Live Chat AI assistant auto-resolves repetitive requests, saves team time, and delivers always-on customer support.',
    howTitle: 'How to get started',
    howSubtitle: 'Launch your AI assistant in 4 steps',
    steps: [
      'Create your knowledge base or import existing content',
      'Define chatbot journeys in the visual flow builder',
      'Enable AI assistant and test your flows',
      'Track performance from the analytics dashboard',
    ],
    stats: ['40% fewer repetitive requests', '24/7 automated responses', 'One-click human handoff'],
    ctaTitle: 'Try the AI assistant',
    ctaSubtitle: 'AI features are included in the Professional plan.',
    capabilities: [
      {
        title: 'Context-aware responses',
        desc: 'Understands customer intent and provides the best answer from your knowledge base.',
      },
      {
        title: 'Knowledge base integration',
        desc: 'Train AI on your articles to provide current and accurate responses.',
      },
      {
        title: 'Smart escalation',
        desc: 'Automatically routes complex requests to live agents.',
      },
      {
        title: 'Agent reply suggestions',
        desc: 'Speeds up human replies with AI-assisted recommendations.',
      },
    ],
  },
  contact: {
    badge: 'Contact',
    title: 'Get in touch',
    subtitle: 'Contact our team for questions, demos, and enterprise solutions.',
    email: 'Email',
    emailNote: 'Response within 24 hours',
    liveChat: 'Live Chat',
    liveChatNote: 'Available on the website',
    liveChatAction: 'Open chat',
    enterprise: 'Enterprise',
    enterpriseNote: 'Custom pricing and SLA',
    enterpriseAction: 'Request quote',
    corporateInfo: 'Corporate information',
    helpCenter: 'Help center',
    formTitle: 'Send a message',
    formSubtitle: 'Use the form for demos, enterprise pricing, or technical support.',
    nameLabel: 'Full name',
    namePlaceholder: 'Your full name',
    emailLabel: 'Email',
    emailPlaceholder: 'name@company.com',
    subjectLabel: 'Subject',
    messageLabel: 'Message',
    messagePlaceholder: 'How can we help you?',
    submit: 'Send',
    submitting: 'Sending...',
    privacyNote: 'By submitting, you agree to the privacy policy.',
    privacyLink: 'privacy policy',
    subjects: {
      demo: 'Demo Request',
      general: 'General Inquiry',
      enterprise: 'Enterprise Solution',
      support: 'Technical Support',
    },
    toastSuccessTitle: 'Message received',
    toastSuccessDesc: 'Our team will get back to you shortly.',
    toastErrorTitle: 'Could not send message',
    toastLiveChatTitle: 'Live chat',
    toastLiveChatDesc: 'Use the chat bubble in the bottom-right corner to reach us.',
    sendError: 'An unexpected error occurred',
  },
  help: {
    badge: 'Help',
    title: 'Help Center',
    subtitle: 'Guides for setup, usage, and troubleshooting.',
    notFound: 'Could not find what you need?',
    contactCta: 'Contact support',
    categories: [
      {
        title: 'Getting Started',
        articles: [
          {
            q: 'How do I install Gu Live Chat?',
            a: 'After signing up, copy the embed code from Settings > Widget and paste it into your website.',
          },
          {
            q: 'How can I customize the widget?',
            a: 'You can configure colors, position, welcome message, and avatar from the dashboard.',
          },
          {
            q: 'How do I add a teammate?',
            a: 'Go to Settings > Team and send an invitation by email.',
          },
        ],
      },
      {
        title: 'Chat and Inbox',
        articles: [
          {
            q: 'How do canned responses work?',
            a: "Type '/' in the inbox composer to insert saved replies.",
          },
          {
            q: 'How do I assign a conversation?',
            a: 'Open conversation details and select an agent from the top-right assignment menu.',
          },
          {
            q: 'Do you support file sharing?',
            a: 'Yes, image and document sharing is supported, subject to plan limits.',
          },
        ],
      },
      {
        title: 'Automation and Integrations',
        articles: [
          {
            q: 'How do I set up webhooks?',
            a: 'Open Settings > Webhooks, add your endpoint URL, and choose events.',
          },
          {
            q: 'How does chatbot setup work?',
            a: 'Use the visual editor in Settings > Chatbot to build and publish flows.',
          },
          {
            q: 'Where is the API documentation?',
            a: 'REST API access is available on Professional and above. Contact support@gulivechat.com.',
          },
        ],
      },
    ],
  },
  apps: {
    badge: 'Apps',
    title: 'Add-on marketplace',
    subtitle:
      'Extend Gu Live Chat based on your needs. All add-ons are sold as monthly digital subscriptions with secure iyzico payment.',
    catalogLink: 'See full product catalog',
    customAddon: 'Need a custom add-on?',
    contactCta: 'Contact us',
    items: [
      {
        name: 'WhatsApp Channel',
        desc: 'Route WhatsApp Business messages into the unified inbox.',
        price: 'from $49/mo',
        status: 'Active',
      },
      {
        name: 'AI Assistant Pro',
        desc: 'Advanced context understanding and multilingual responses.',
        price: 'from $89/mo',
        status: 'Popular',
      },
      {
        name: 'White Label',
        desc: 'Use your own brand, domain, and visual style.',
        price: 'from $69/mo',
        status: 'Active',
      },
      {
        name: 'Advanced Analytics',
        desc: 'Custom reports, CSV export, and API access.',
        price: 'from $29/mo',
        status: 'Active',
      },
      {
        name: 'Email Pro',
        desc: 'Inbox sync and automated email replies.',
        price: 'from $39/mo',
        status: 'Active',
      },
      {
        name: 'Zapier Connector',
        desc: 'No-code automation with 5000+ applications.',
        price: 'from $19/mo',
        status: 'Active',
      },
    ],
  },
  blog: {
    badge: 'Blog',
    title: 'Live Chat and Customer Service Guides',
    subtitle:
      'Practical guides for live chat, chatbot, WhatsApp support, and customer experience to improve sales and satisfaction.',
    readMore: 'Read more',
    backToBlog: 'Back to blog',
    ctaTitle: 'Get started with Gu Live Chat',
    ctaButton: 'Sign up free',
    homeCrumb: 'Home',
    blogCrumb: 'Blog',
    notFound: 'Post not found',
    trialNote: '7-day free trial — no credit card required',
  },
  knowledge: {
    titleSuffix: 'Knowledge Base',
    subtitle: 'Frequently asked questions and help articles',
    homeLink: 'Home',
    searchPlaceholder: 'Search articles...',
    allArticles: 'All articles',
    back: 'Back',
    views: 'views',
    featuredTitle: 'Featured articles',
    allArticlesTitle: 'All articles',
    noResultsTitle: 'No articles found',
    noResultsDesc: 'No articles match your search',
    helpful: 'helpful',
    footerPowered: 'Powered by Gu Live Chat',
  },
  urunler: {
    heroBadge: 'Digital Product Catalog',
    heroTitle: 'Gu Live Chat subscriptions and add-ons',
    heroSubtitle:
      'Gu Live Chat is a SaaS platform with no physical goods. All products are delivered as digital subscriptions and processed with iyzico secure payments.',
    packagesBtn: 'Subscription Plans',
    addonsBtn: 'Add-on Marketplace',
    packagesTitle: 'Live Support Subscription Plans',
    packagesSubtitle: 'Monthly or yearly billing - VAT included - Instant digital delivery',
    monthly: 'Monthly',
    yearly: 'Yearly',
    yearlyDiscount: '-20%',
    billingAria: 'Billing period',
    addonsTitle: 'Add-on Marketplace',
    addonsSubtitle: 'Monthly digital add-ons you can activate on top of your subscription',
    active: 'Active',
    buyNow: 'Buy now',
    startFree: 'Start free',
    getQuote: 'Get a quote',
    productDetails: 'Product details',
    paymentNote:
      'Payments are processed via iyzico secure infrastructure over 256-bit SSL. Visa and MasterCard are accepted. Digital services are activated instantly after purchase.',
    comparePricing: 'Compare detailed pricing',
    freeProduct: 'Free',
    perMonth: '/mo',
  },
  hakkimizda: {
    badge: 'Corporate',
    title: 'About Us',
    subtitle:
      '{company} is a locally built SaaS platform that helps businesses manage customer service through live chat, AI assistant, and a unified inbox.',
    sections: [
      {
        title: 'Company Profile',
        paragraphs: [
          '{company} ({name}) develops customer communication technology for modern support and sales teams.',
          'Contact: {email} - {phone}. Registered address: {address}. Official website: {url}.',
        ],
      },
      {
        title: 'Official Information',
        paragraphs: [
          'MERSIS number: {mersis}',
          'Tax office: {taxOffice} - Tax number: {taxNo}',
        ],
      },
    ],
    servicesTitle: 'Our Services',
    servicesText:
      'We provide live chat widget, AI Agent, WhatsApp/email/Messenger integrations, knowledge base, analytics, and team management tools.',
    sslTitle: 'SSL Certificate',
    sslText: 'Our website ({url}) is fully protected with HTTPS and 256-bit SSL.',
    salesTitle: 'Sales Model',
    salesText:
      'Gu Live Chat offers digital subscription plans and add-ons. No physical goods are sold, and service is provisioned instantly after purchase.',
    paymentTitle: 'Secure Payments (iyzico)',
    paymentText:
      'Subscription payments are processed through iyzico. Visa and MasterCard are supported. Card data is not stored by us.',
    legalDocsTitle: 'Legal Documents',
    legalLinks: [
      { label: 'Privacy Policy', href: '/gizlilik' },
      { label: 'Delivery and Refund Terms', href: '/teslimat-iade' },
      { label: 'Distance Sales Agreement', href: '/mesafeli-satis' },
      { label: 'Payment Security', href: '/odeme-guvenligi' },
    ],
    corpFields: {
      tradeName: 'Trade name',
      address: 'Address',
      mersis: 'MERSIS',
      taxOffice: 'Tax office',
      taxNo: 'Tax number',
      email: 'Email',
      phone: 'Phone',
      web: 'Website',
    },
  },
  ads: {
    login: 'Login',
    badge: 'Live chat platform built for Turkiye',
    title: 'Reach customers instantly and increase sales',
    titleHighlight: 'instantly',
    subtitle: 'Add live chat to your website in 30 seconds. AI-powered, WhatsApp-ready, and free to start.',
    proofs: ['No credit card required', '7 days PRO free', '30-second setup', 'KVKK aligned'],
    bullets: [
      'Live chat widget with one-line install',
      'AI chatbot for repetitive customer questions',
      'WhatsApp and email in one inbox',
      'Live visitor tracking by page',
    ],
    cta: 'Create free account',
    statSetup: '30 sec',
    statSetupLabel: 'Setup time',
    statConversion: '40%',
    statConversionLabel: 'Conversion uplift*',
    statCompliance: 'KVKK',
    statComplianceLabel: 'Compliant infrastructure',
    disclaimer: '*Average conversion improvement among businesses using live chat. Results vary by sector.',
    copyright: 'Gu Live Chat © 2026 - gulivechat.com',
  },
  seoLandings: {
    canliDestek: {
      badge: 'Live Support Software',
      h1: 'Add professional live support to your website',
      subtitle:
        'Respond to visitors in real time with Gu Live Chat. Live chat widget, visitor tracking, proactive messaging, and AI support in one platform.',
      cta: { label: 'Start Free Live Support', href: '/register' },
      benefits: [
        {
          title: 'Go live in 30 seconds',
          desc: 'Install the widget with one line of code. No technical setup required.',
        },
        {
          title: 'Live visitor tracking',
          desc: 'See active visitors in real time, monitor their pages, and send proactive messages.',
        },
        {
          title: 'AI-assisted responses',
          desc: 'Automate repetitive questions with chatbot and reduce agent workload.',
        },
        {
          title: 'Unified inbox',
          desc: 'Widget, WhatsApp, email, and Messenger channels in one screen.',
        },
        {
          title: 'Proactive campaigns',
          desc: 'Send the right message at the right moment to reduce cart abandonment.',
        },
        {
          title: 'Analytics and reporting',
          desc: 'Track response time, satisfaction, and team performance with clear metrics.',
        },
      ],
      sections: [
        {
          title: 'What is live support software?',
          paragraphs: [
            'Live support software enables real-time communication with visitors on your website. Customers can message through the chat widget and agents can respond instantly.',
            'Compared to email support, live chat resolves questions faster and helps customers complete purchase decisions with confidence.',
            'Gu Live Chat is a local-first platform with secure payments, compliance-focused architecture, and a modern operator experience.',
          ],
        },
        {
          title: 'Who should use live support?',
          paragraphs: [
            'Ecommerce brands, SaaS teams, agencies, education providers, and service businesses all benefit from live support.',
            'Small teams can start free and scale into Professional or Enterprise plans as volume grows.',
          ],
        },
      ],
      faqs: [
        {
          q: 'Is live support free?',
          a: 'Yes. Gu Live Chat includes a free tier with 2 agents and 100 chats per month, plus a 7-day PRO trial with no credit card required.',
        },
        {
          q: 'How long does setup take?',
          a: 'Paste the widget code into your website and go live in about 30 seconds.',
        },
        {
          q: 'Is it mobile friendly?',
          a: 'Yes. The widget works smoothly across desktop and mobile devices.',
        },
        {
          q: 'Can I use it together with WhatsApp?',
          a: 'Yes. With WhatsApp Business integration, all channels are managed from the same inbox.',
        },
      ],
      relatedLinks: [
        { label: 'Chatbot Software', href: '/chatbot' },
        { label: 'WhatsApp Support', href: '/whatsapp-destek' },
        { label: 'Pricing', href: '/pricing' },
        { label: 'Features', href: '/features' },
      ],
    },
    chatbot: {
      badge: 'Chatbot Software',
      h1: 'Automated customer support chatbot available 24/7',
      subtitle:
        'Use Gu Live Chat chatbot to automate repetitive requests with visual flows, AI-generated responses, and smart escalation to human agents.',
      cta: { label: 'Try Chatbot Free', href: '/register' },
      benefits: [
        {
          title: 'Visual flow builder',
          desc: 'Create and launch chatbot journeys quickly with drag-and-drop editing.',
        },
        {
          title: 'AI-generated responses',
          desc: 'Deliver natural responses with GPT and Gemini trained on your knowledge base.',
        },
        {
          title: 'Smart routing',
          desc: 'Escalate complex issues automatically to the right live agent.',
        },
        {
          title: 'Omnichannel coverage',
          desc: 'Run the same chatbot experience across widget, WhatsApp, and Messenger.',
        },
        {
          title: 'FAQ automation',
          desc: 'Automate repetitive support questions and save team capacity.',
        },
        {
          title: 'Performance insights',
          desc: 'See top intents and continuously optimize chatbot quality.',
        },
      ],
      sections: [
        {
          title: 'How does customer service chatbot work?',
          paragraphs: [
            'The chatbot answers visitor questions automatically, starts welcome flows, and routes customers to human support when needed.',
            'Gu Live Chat makes setup visual: define intent branches, quick replies, and fallback paths without coding.',
            'In Professional plan, AI reads your knowledge base and responds naturally until a human takes over.',
          ],
        },
        {
          title: 'How much can chatbot save?',
          paragraphs: [
            'Most support queues include repetitive topics such as shipping, refund policy, and pricing. Chatbot handles these requests instantly.',
            'After-hours requests no longer wait until the next day, improving satisfaction and reducing operational cost.',
          ],
        },
      ],
      faqs: [
        {
          q: 'Do I need coding knowledge to build chatbot flows?',
          a: 'No. You can build flows visually with drag-and-drop tools.',
        },
        {
          q: 'Which languages are supported?',
          a: 'AI responses and live translation support 50+ languages, including Turkish.',
        },
        {
          q: 'Can chatbot and agents work together?',
          a: 'Yes. Chatbot resolves simple requests and escalates advanced ones to live agents.',
        },
        {
          q: 'Is chatbot available on the free plan?',
          a: 'Basic chatbot flows are available in entry plans, while AI chatbot features are in Professional.',
        },
      ],
      relatedLinks: [
        { label: 'Live Support', href: '/canli-destek' },
        { label: 'Artificial Intelligence', href: '/ai' },
        { label: 'Blog: Chatbot Setup', href: '/blog/chatbot-kurulum-rehberi' },
        { label: 'Pricing', href: '/pricing' },
      ],
    },
    whatsappDestek: {
      badge: 'WhatsApp Live Support',
      h1: 'Strengthen customer support with WhatsApp',
      subtitle:
        'Connect WhatsApp Business with Gu Live Chat and manage every message in one inbox with chatbot, team assignment, and reporting.',
      cta: { label: 'Start WhatsApp Support', href: '/register' },
      benefits: [
        {
          title: 'Single inbox',
          desc: 'Manage WhatsApp, widget, email, and Messenger conversations from one interface.',
        },
        {
          title: 'WhatsApp chatbot',
          desc: 'Automate repetitive customer questions directly on WhatsApp.',
        },
        {
          title: 'Team assignment',
          desc: 'Route incoming WhatsApp messages to the right team member automatically.',
        },
        {
          title: 'Conversation history',
          desc: 'Keep full WhatsApp history in each customer profile.',
        },
        {
          title: 'Saved replies',
          desc: 'Use ready-to-send templates for faster and consistent support.',
        },
        {
          title: 'Instant alerts',
          desc: 'Get notified the moment a new WhatsApp message arrives.',
        },
      ],
      sections: [
        {
          title: 'Why WhatsApp customer service?',
          paragraphs: [
            'WhatsApp is one of the most widely used messaging channels for customer communication.',
            'With WhatsApp Business API, you can deliver scalable support using automations and human agents together.',
            'Gu Live Chat merges WhatsApp with website and email conversations into one operational inbox.',
          ],
        },
        {
          title: 'How to set up WhatsApp support',
          paragraphs: [
            'Go to Settings > Channels, connect your WhatsApp Business API account, and activate the add-on.',
            'Apply your chatbot flows, greeting logic, and routing rules to WhatsApp.',
            'Professional plan includes WhatsApp integration, while Enterprise adds priority support and SLA options.',
          ],
        },
      ],
      faqs: [
        {
          q: 'Do I need a WhatsApp Business account?',
          a: 'Yes. A verified WhatsApp Business account is required for API integration.',
        },
        {
          q: 'Are WhatsApp messages visible in inbox?',
          a: 'Yes. WhatsApp conversations appear in the same inbox with other channels.',
        },
        {
          q: 'Does chatbot work on WhatsApp?',
          a: 'Yes. Published chatbot flows can respond automatically on WhatsApp.',
        },
        {
          q: 'Which plan includes WhatsApp?',
          a: 'WhatsApp integration is available with Professional plan and add-on activation.',
        },
      ],
      relatedLinks: [
        { label: 'Live Support', href: '/canli-destek' },
        { label: 'Integrations', href: '/integrations' },
        { label: 'Blog: WhatsApp Support', href: '/blog/whatsapp-ile-musteri-destegi' },
        { label: 'Pricing', href: '/pricing' },
      ],
    },
  },
  legal: {
    gizlilik: {
      badge: 'Legal',
      title: 'Privacy Policy',
      updated: 'Last updated: June 2026',
      sections: [
        {
          title: '1. Data Controller',
          paragraphs: ['{company} ({name}) operates at {address}. Contact: {email} - {phone}.'],
        },
        {
          title: '2. Data We Collect',
          paragraphs: [
            'To provide our services, we may process name, email, phone, billing information, IP address, browser and device details, chat records, and product usage data.',
          ],
        },
        {
          title: '3. Payments and Card Data',
          paragraphs: [
            'Card payments are processed through iyzico secure infrastructure with 256-bit SSL encryption.',
            'Sensitive card information such as card number and CVV is not stored by us and is processed directly in PCI-DSS compliant environments.',
          ],
        },
        {
          title: '4. How Data Is Used',
          paragraphs: [
            'Data is used for service delivery, subscription management, support operations, billing, security, analytics, and legal compliance.',
          ],
        },
        {
          title: '5. Data Sharing',
          paragraphs: [
            'Your data may be shared with payment processors, email infrastructure providers, and authorized institutions when legally required.',
          ],
        },
        {
          title: '6. Retention',
          paragraphs: [
            'Data is retained during the service relationship. Upon account deletion requests, data is removed within 30 days except where legal retention applies.',
          ],
        },
        {
          title: '7. Your Rights',
          paragraphs: [
            'You may request access, correction, deletion, processing restrictions, and objection rights under applicable law. Contact us at {email}.',
          ],
        },
        {
          title: '8. Secure Connection (SSL)',
          paragraphs: ['{url} is protected with HTTPS (SSL/TLS). All page and payment traffic is encrypted in transit.'],
        },
      ],
    },
    teslimatIade: {
      badge: 'Legal',
      title: 'Delivery and Refund Terms',
      updated: 'Last updated: 2026',
      sections: [
        {
          title: 'Seller Information',
          paragraphs: ['{company} - {address}', 'Contact: {email} - {phone}'],
        },
        {
          title: '1. Delivery',
          paragraphs: [
            'Subscriptions and digital services purchased via {name} are provisioned electronically after payment confirmation, usually within minutes.',
            'You can track service status from your dashboard and confirmation emails.',
          ],
        },
        {
          title: '2. Refund Conditions',
          paragraphs: [
            'For instantly delivered digital services, withdrawal rights may end once service delivery starts and consent is provided.',
            'If service has not started or access cannot be provided due to technical reasons, you can request a refund via {email}.',
          ],
        },
        {
          title: '3. Subscription Cancellation',
          paragraphs: [
            'Monthly or yearly subscriptions can be canceled until period end from your panel. Partial refund policy depends on package terms.',
          ],
        },
        {
          title: '4. Contact',
          paragraphs: ['Delivery and refund requests: {email} - {phone}'],
        },
      ],
    },
    mesafeliSatis: {
      badge: 'Legal',
      title: 'Distance Sales Agreement',
      updated: 'Last updated: 2026',
      sections: [
        {
          title: '1. Parties',
          paragraphs: [
            'Seller: {company} - Email: {email} - Phone: {phone} - Address: {address}',
            'MERSIS: {mersis} - Tax Office: {taxOffice} - Tax No: {taxNo}',
            'Buyer: The natural or legal person whose details are provided during registration or payment.',
          ],
        },
        {
          title: '2. Subject',
          paragraphs: [
            'This agreement governs rights and obligations related to subscriptions and digital services purchased electronically via {url} under {name}.',
          ],
        },
        {
          title: '3. Service and Pricing',
          paragraphs: [
            'Service scope and fee are displayed during checkout/subscription. Prices include VAT unless stated otherwise.',
          ],
        },
        {
          title: '4. Payment',
          paragraphs: [
            'Payment is collected via iyzico secure infrastructure with Visa/MasterCard over 256-bit SSL.',
            'Service delivery starts after payment approval. Card information is not stored by seller.',
          ],
        },
        {
          title: '5. Delivery',
          paragraphs: ['Digital services are delivered electronically and account access is granted after payment approval.'],
        },
        {
          title: '6. Right of Withdrawal',
          paragraphs: [
            'For instantly delivered digital services, withdrawal rights may end once performance begins with customer consent.',
          ],
        },
        {
          title: '7. Dispute Resolution',
          paragraphs: ['Consumer arbitration boards and courts are authorized for disputes. Contact: {email}.'],
        },
      ],
    },
    odemeGuvenligi: {
      badge: 'Security',
      title: 'Payment Security',
      sections: [
        {
          title: 'SSL Certificate',
          paragraphs: ['{url} is fully protected with HTTPS (256-bit SSL/TLS). The lock icon in the browser indicates secure transport.'],
        },
        {
          title: 'iyzico Secure Payments',
          paragraphs: [
            'All card payments are processed through licensed iyzico infrastructure and support 3D Secure.',
            'Card data is not stored on {name} servers; payment processing follows PCI-DSS compliant practices.',
          ],
        },
        {
          title: 'Contact',
          paragraphs: ['For payment security questions: {email} - {phone}'],
        },
      ],
    },
    kvkk: {
      badge: 'Legal',
      title: 'KVKK Information Notice',
      subtitle:
        'As a data controller under Law No. 6698 on Protection of Personal Data, we would like to inform you about data processing practices.',
      sections: [
        {
          title: 'Data Controller',
          paragraphs: ['{company} operates at {address} and acts as data controller under KVKK.'],
        },
        {
          title: 'Purpose of Processing Personal Data',
          paragraphs: [
            'Personal data is processed for service delivery, customer satisfaction, communication, marketing, legal compliance, and business continuity.',
          ],
        },
        {
          title: 'Data Transfer',
          paragraphs: [
            'Personal data is not shared with third parties beyond legal obligations, except limited sharing with service providers for operational purposes.',
          ],
        },
        {
          title: 'Your Rights',
          paragraphs: [
            'You may request information on processing, access your data, request correction or deletion, object to processing, and seek compensation where applicable.',
            'For requests: {email}',
          ],
        },
      ],
    },
    cerez: {
      badge: 'Legal',
      title: 'Cookie Policy',
      subtitle: 'This website uses cookies to provide a better browsing experience.',
      sections: [
        {
          title: 'What is a cookie?',
          paragraphs: [
            'Cookies are small text files stored by websites in your browser to remember preferences and improve service quality.',
          ],
        },
        {
          title: 'Cookie types we use',
          paragraphs: [
            'Strictly Necessary Cookies: Required for session continuity and security.',
            'Performance Cookies: Collect usage analytics for site improvement.',
            'Functional Cookies: Store language and interface preferences.',
            'Targeting Cookies: Used for personalized content and campaign relevance.',
          ],
        },
        {
          title: 'Cookie management',
          paragraphs: [
            'You can manage or delete cookies from browser settings. Disabling certain cookies may affect site functionality.',
            'For details: {email}',
          ],
        },
      ],
    },
    kullanimSartlari: {
      badge: 'Legal',
      title: 'Terms of Use',
      updated: 'Last updated: 2026',
      sections: [
        {
          title: '1. Service Usage',
          paragraphs: ['By using {name}, you agree to these terms and to use the service only for lawful purposes.'],
        },
        {
          title: '2. Account Security',
          paragraphs: ['You are responsible for account confidentiality and all activity performed under your credentials.'],
        },
        {
          title: '3. Subscriptions and Payments',
          paragraphs: ['Subscriptions are billed monthly or yearly. Service remains active through the end of the paid billing period after cancellation.'],
        },
        {
          title: '4. Service Availability',
          paragraphs: ['Except for planned maintenance or force majeure, we target 99.9% uptime and do not accept liability for consequential losses.'],
        },
        {
          title: '5. Intellectual Property',
          paragraphs: ['All platform rights belong to {company}. Unauthorized copying, distribution, or reverse engineering is prohibited.'],
        },
      ],
    },
  },
}

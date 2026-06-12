export type HomeMessages = {
  trustStrip: { title: string; stats: { value: string; label: string }[] }
  mobileApp: {
    badge: string
    title: string
    desc: string
    download: string
    setup: string
    note: string
    iconAlt: string
  }
  features: {
    label: string
    title: string
    subtitle: string
    items: { title: string; desc: string }[]
    cta: string
  }
  ai: {
    label: string
    title: string
    desc: string
    steps: { title: string; desc: string }[]
    cta: string
  }
  translate: {
    label: string
    title: string
    desc: string
    bullets: string[]
    cta: string
    demoStatus: string
    demos: { lang: string; msg: string; translated: string }[]
  }
  inbox: {
    label: string
    title: string
    desc: string
    cta: string
    channels: string[]
    samples: { from: string; name: string; msg: string; time: string }[]
  }
  knowledge: {
    label: string
    title: string
    desc: string
    searchPlaceholder: string
    articles: { title: string; count: string }[]
  }
  automation: {
    label: string
    title: string
    desc: string
    bullets: string[]
    flows: { trigger: string; action: string }[]
  }
  products: {
    label: string
    title: string
    buy: string
    items: { title: string; desc: string; href: string }[]
  }
  useCases: {
    label: string
    title: string
    cases: {
      id: string
      label: string
      title: string
      desc: string
      bullets: string[]
    }[]
  }
  testimonials: {
    title: string
    items: { quote: string; author: string; role: string; initials: string }[]
  }
  faq: { title: string; items: { q: string; a: string }[] }
  footerCta: {
    title: string
    desc: string
    badges: string[]
    register: string
    contact: string
  }
  planFeatures: {
    FREE: string[]
    STARTER: string[]
    PRO: string[]
    BUSINESS: string[]
  }
  mobilPage: {
    metaTitle: string
    metaDescription: string
    badge: string
    title: string
    subtitle: string
    versionNote: string
    download: string
    noAccount: string
    registerLink: string
    features: { title: string; desc: string }[]
    installTitle: string
    installWarning: string
    steps: string[]
    iphoneNote: string
    webLogin: string
    iconAlt: string
  }
  mobileBar: {
    download: string
    tagline: string
    navShort: string
  }
}

export type FooterMessages = {
  taglineExtra: string
  columns: { title: string; links: { label: string; href: string }[] }[]
  badges: { ssl: string; privacy: string; madeIn: string; uptime: string }
  iyzicoLinks: { label: string; href: string }[]
}

export type SmmProvider = "moresmm" | "jap";

export type SmmService = {
  service: number;
  name: string;
  type: string;
  category: string;
  rate: string;
  min: string;
  max: string;
  refill: boolean;
};

const PROVIDERS: Record<
  SmmProvider,
  { name: string; url: string; keyEnv: string }
> = {
  moresmm: {
    name: "MoreSMM",
    url: process.env.MORESMM_API_URL || "https://moresmm.com/api/v2",
    keyEnv: "MORESMM_API_KEY",
  },
  jap: {
    name: "JustAnotherPanel",
    url: process.env.JAP_API_URL || "https://justanotherpanel.com/api/v2",
    keyEnv: "JAP_API_KEY",
  },
};

function getKey(provider: SmmProvider) {
  const cfg = PROVIDERS[provider];
  if (provider === "moresmm") return process.env.MORESMM_API_KEY || "";
  return process.env.JAP_API_KEY || "";
}

async function smmPost(
  provider: SmmProvider,
  params: Record<string, string | number>
) {
  const cfg = PROVIDERS[provider];
  const key = getKey(provider);
  if (!key) {
    throw new Error(`${cfg.name} API key tanımlı değil (.env)`);
  }

  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    body.set(k, String(v));
  }
  body.set("key", key);

  const res = await fetch(cfg.url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  const data = await res.json();
  if (data?.error) {
    throw new Error(String(data.error));
  }
  return data;
}

export function isConfigured(provider: SmmProvider) {
  return Boolean(getKey(provider));
}

export function getProviderList() {
  return (Object.keys(PROVIDERS) as SmmProvider[]).map((id) => ({
    id,
    name: PROVIDERS[id].name,
    configured: isConfigured(id),
  }));
}

export async function getBalance(provider: SmmProvider) {
  return smmPost(provider, { action: "balance" }) as Promise<{
    balance: string;
    currency: string;
  }>;
}

export async function getServices(provider: SmmProvider) {
  const data = await smmPost(provider, { action: "services" });
  return data as SmmService[];
}

export async function addOrder(
  provider: SmmProvider,
  input: { service: number; link: string; quantity: number }
) {
  return smmPost(provider, {
    action: "add",
    service: input.service,
    link: input.link,
    quantity: input.quantity,
  }) as Promise<{ order: number }>;
}

export async function getOrderStatus(provider: SmmProvider, orderId: number) {
  return smmPost(provider, { action: "status", order: orderId }) as Promise<{
    charge?: string;
    start_count?: string;
    status?: string;
    remains?: string;
    currency?: string;
    error?: string;
  }>;
}

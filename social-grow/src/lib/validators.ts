const ORDER_CODE_RE = /^PM-\d{8}-[A-Z0-9]{6}$/;

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidOrderCode(value: string) {
  return ORDER_CODE_RE.test(value.toUpperCase());
}

export function normalizeOrderCode(value: string) {
  return value.trim().toUpperCase();
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

const ORDER_STATUSES = [
  "PENDING",
  "PAID",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
  "FAILED",
] as const;

export type OrderStatusValue = (typeof ORDER_STATUSES)[number];

export function isValidOrderStatus(value: string): value is OrderStatusValue {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

export function parseQuantityFromPackageName(name: string): number {
  const cleaned = name.replace(/\./g, "").replace(/,/g, "");
  const match = cleaned.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 100;
}

/**
 * Client-side PayTR utilities
 * These are safe to import in client components (no secrets)
 */

/**
 * Get the PayTR iFrame URL for a payment token
 */
export function getPaytrIframeUrl(token: string): string {
  return `https://www.paytr.com/odeme/guvenli/${token}`
}

/**
 * Check if PayTR is enabled (client-side)
 */
export function isPaytrEnabled(): boolean {
  return process.env.NEXT_PUBLIC_PAYTR_ENABLED === 'true'
}
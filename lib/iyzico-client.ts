/** Client-side iyzico utilities (no secrets) */

export function isIyzicoEnabled(): boolean {
  return process.env.NEXT_PUBLIC_IYZICO_ENABLED === 'true'
}

import { SITE_LEGAL } from '@/lib/site-legal'

export function fillLegal(text: string): string {
  return text
    .replaceAll('{company}', SITE_LEGAL.legalName)
    .replaceAll('{name}', SITE_LEGAL.name)
    .replaceAll('{email}', SITE_LEGAL.email)
    .replaceAll('{phone}', SITE_LEGAL.phone)
    .replaceAll('{address}', SITE_LEGAL.address)
    .replaceAll('{url}', SITE_LEGAL.url)
    .replaceAll('{mersis}', SITE_LEGAL.mersis)
    .replaceAll('{taxOffice}', SITE_LEGAL.taxOffice)
    .replaceAll('{taxNo}', SITE_LEGAL.taxNo)
}

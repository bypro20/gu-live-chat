export interface ParsedUserAgent {
  browser: string
  os: string
  device: string
  deviceType: 'mobile' | 'tablet' | 'desktop'
}

export function parseUserAgent(ua: string): ParsedUserAgent {
  let browser = 'Unknown'
  let os = 'Unknown'
  let device = 'Desktop'

  if (!ua) {
    return { browser, os, device, deviceType: 'desktop' }
  }

  if (/iPhone/i.test(ua)) {
    device = 'Mobile'
    os = 'iOS'
  } else if (/iPad/i.test(ua)) {
    device = 'Tablet'
    os = 'iPadOS'
  } else if (/Android/i.test(ua)) {
    device = /Mobile/i.test(ua) ? 'Mobile' : 'Tablet'
    os = 'Android'
  } else if (/Mac/i.test(ua)) os = 'macOS'
  else if (/Windows/i.test(ua)) os = 'Windows'
  else if (/Linux/i.test(ua)) os = 'Linux'
  else if (/CrOS/i.test(ua)) os = 'Chrome OS'

  if (/Edg\//i.test(ua)) browser = 'Edge'
  else if (/OPR|Opera/i.test(ua)) browser = 'Opera'
  else if (/Firefox/i.test(ua)) browser = 'Firefox'
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari'
  else if (/Chrome/i.test(ua)) browser = 'Chrome'

  const deviceType =
    device === 'Mobile' ? 'mobile' : device === 'Tablet' ? 'tablet' : 'desktop'

  return { browser, os, device, deviceType }
}

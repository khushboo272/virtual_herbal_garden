/**
 * Lightweight, zero-dependency User-Agent parser for human-readable session labels.
 */
export function parseDeviceLabel(ua?: string): string {
  if (!ua || ua === 'unknown') return 'Unknown Device';

  let browser = 'Web Browser';
  if (/edg/i.test(ua)) {
    browser = 'Edge';
  } else if (/opr|opera/i.test(ua)) {
    browser = 'Opera';
  } else if (/chrome|crios/i.test(ua)) {
    browser = 'Chrome';
  } else if (/firefox|fxios/i.test(ua)) {
    browser = 'Firefox';
  } else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) {
    browser = 'Safari';
  }

  let os = 'Unknown OS';
  if (/windows nt 10/i.test(ua)) {
    os = 'Windows 10/11';
  } else if (/windows/i.test(ua)) {
    os = 'Windows';
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    os = 'iOS';
  } else if (/android/i.test(ua)) {
    os = 'Android';
  } else if (/macintosh|mac os x/i.test(ua)) {
    os = 'macOS';
  } else if (/linux/i.test(ua)) {
    os = 'Linux';
  }

  return `${browser} on ${os}`;
}

export function parseDeviceDetails(ua?: string): { browser: string; os: string; device: string } {
  if (!ua || ua === 'unknown') return { browser: 'Unknown Browser', os: 'Unknown OS', device: 'Desktop' };

  let browser = 'Web Browser';
  if (/edg/i.test(ua)) browser = 'Edge';
  else if (/opr|opera/i.test(ua)) browser = 'Opera';
  else if (/chrome|crios/i.test(ua)) browser = 'Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) browser = 'Safari';

  let os = 'Unknown OS';
  let device = 'Desktop';
  if (/windows nt 10/i.test(ua)) { os = 'Windows 10/11'; device = 'Desktop'; }
  else if (/windows/i.test(ua)) { os = 'Windows'; device = 'Desktop'; }
  else if (/iphone/i.test(ua)) { os = 'iOS'; device = 'Mobile'; }
  else if (/ipad/i.test(ua)) { os = 'iPadOS'; device = 'Tablet'; }
  else if (/android/i.test(ua)) { os = 'Android'; device = 'Mobile'; }
  else if (/macintosh|mac os x/i.test(ua)) { os = 'macOS'; device = 'Desktop'; }
  else if (/linux/i.test(ua)) { os = 'Linux'; device = 'Desktop'; }

  return { browser, os, device };
}

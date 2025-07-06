export function isValidUrl(text: string): boolean {
  try {
    const url = new URL(text);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function extractUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
  const matches = text.match(urlRegex);
  return matches ? matches.filter(isValidUrl) : [];
}

export function isValidSlug(slug: string): boolean {
  if (!slug || slug.length === 0) return false;
  if (slug.length > 50) return false;
  
  // Check for valid characters (letters, numbers, hyphens, underscores)
  const slugRegex = /^[a-zA-Z0-9-_]+$/;
  return slugRegex.test(slug);
}

export function sanitizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '')
    .replace(/^[-_]+|[-_]+$/g, '')
    .substring(0, 50);
}

export function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Remove trailing slash if present
    if (urlObj.pathname.endsWith('/') && urlObj.pathname !== '/') {
      urlObj.pathname = urlObj.pathname.slice(0, -1);
    }
    return urlObj.toString();
  } catch {
    return url;
  }
}

export function getDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return 'unknown';
  }
}

export function isShortUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const shortDomains = [
      'bit.ly',
      'tinyurl.com',
      'short.link',
      'dub.sh',
      'dub.co',
      't.co',
      'goo.gl',
      'ow.ly',
      'is.gd',
      'buff.ly',
    ];
    
    return shortDomains.some(domain => 
      urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}
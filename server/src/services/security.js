import dns from 'node:dns/promises';
import { URL } from 'node:url';

const MAX_RESPONSE_SIZE = 10 * 1024 * 1024; // 10 MB limit
const REQUEST_TIMEOUT_MS = 12000; // 12 seconds
const MAX_REDIRECTS = 5;

/**
 * Checks if an IPv4 address is in a private, loopback, or reserved range.
 * @param {string} ip
 * @returns {boolean}
 */
export function isPrivateIPv4(ip) {
  const parts = ip.split('.').map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true; // invalid format considered unsafe
  }

  const [a, b] = parts;

  // 0.0.0.0/8 (Current network)
  if (a === 0) return true;
  // 10.0.0.0/8 (Private network)
  if (a === 10) return true;
  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;
  // 169.254.0.0/16 (Link-local)
  if (a === 169 && b === 254) return true;
  // 172.16.0.0/12 (Private network: 172.16.0.0 - 172.31.255.255)
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.168.0.0/16 (Private network)
  if (a === 192 && b === 168) return true;
  // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved)
  if (a >= 224) return true;

  return false;
}

/**
 * Checks if an IPv6 address is in a private, loopback, or reserved range.
 * @param {string} ip
 * @returns {boolean}
 */
export function isPrivateIPv6(ip) {
  const normalized = ip.toLowerCase();
  // Loopback ::1
  if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') return true;
  // Unspecified ::
  if (normalized === '::') return true;
  // Unique local fc00::/7 (fc00... or fd00...)
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
  // Link-local fe80::/10
  if (normalized.startsWith('fe80') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb')) {
    return true;
  }
  // IPv4-mapped IPv6 (::ffff:127.0.0.1 or ::ffff:7f00:1)
  if (normalized.includes('::ffff:')) {
    const v4Part = normalized.split('::ffff:')[1];
    if (v4Part && v4Part.includes('.')) {
      return isPrivateIPv4(v4Part);
    }
    return true;
  }

  return false;
}

/**
 * Validates a target URL against SSRF attacks and protocol restrictions.
 *
 * @param {string} rawUrl
 * @param {{ allowLocalhost?: boolean }} [options]
 * @returns {Promise<{ isValid: boolean, parsedUrl: URL | null, error: string }>}
 */
export async function validateSafeUrl(rawUrl, options = {}) {
  const { allowLocalhost = false } = options;

  if (!rawUrl || typeof rawUrl !== 'string') {
    return {
      isValid: false,
      parsedUrl: null,
      error: 'Article URL is required and must be a valid string.',
    };
  }

  const trimmed = rawUrl.trim();
  if (/\s/.test(trimmed)) {
    return {
      isValid: false,
      parsedUrl: null,
      error: 'URL cannot contain whitespace characters.',
    };
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      isValid: false,
      parsedUrl: null,
      error: 'Malformed URL format. Must include valid protocol and domain.',
    };
  }

  // Enforce HTTP / HTTPS protocol
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      isValid: false,
      parsedUrl: null,
      error: `Unsupported protocol "${parsed.protocol}". Only HTTP and HTTPS are permitted.`,
    };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Explicit loopback/localhost rejection
  if (!allowLocalhost && (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '0.0.0.0')) {
    return {
      isValid: false,
      parsedUrl: null,
      error: 'Access to localhost and internal loopback addresses is forbidden.',
    };
  }

  // Resolve hostname via DNS to verify target IP is public
  if (!allowLocalhost) {
    try {
      const records = await dns.lookup(hostname, { all: true });
      for (const record of records) {
        if (record.family === 4 && isPrivateIPv4(record.address)) {
          return {
            isValid: false,
            parsedUrl: null,
            error: `Access to private or internal network address (${record.address}) is forbidden.`,
          };
        }
        if (record.family === 6 && isPrivateIPv6(record.address)) {
          return {
            isValid: false,
            parsedUrl: null,
            error: `Access to private or internal IPv6 address (${record.address}) is forbidden.`,
          };
        }
      }
    } catch (dnsErr) {
      return {
        isValid: false,
        parsedUrl: null,
        error: `DNS lookup failed for host "${hostname}": ${dnsErr.message}`,
      };
    }
  }

  return {
    isValid: true,
    parsedUrl: parsed,
    error: '',
  };
}

/**
 * Safely fetches an external URL with SSRF validation, redirect revalidation,
 * response size limits, and timeout protection.
 *
 * @param {string} initialUrl
 * @param {RequestInit & { allowLocalhost?: boolean }} [options]
 * @returns {Promise<{ response: Response, finalUrl: string, bodyText: string }>}
 */
export async function safeFetch(initialUrl, options = {}) {
  const { allowLocalhost = false, ...fetchOptions } = options;
  let currentUrl = initialUrl;
  let redirectCount = 0;

  while (redirectCount <= MAX_REDIRECTS) {
    // 1. SSRF validation on current URL
    const validation = await validateSafeUrl(currentUrl, { allowLocalhost });
    if (!validation.isValid) {
      throw new Error(`Security validation error: ${validation.error}`);
    }

    // 2. Timeout controller
    const signal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);

    // 3. Perform fetch with manual redirect handling to revalidate each hop
    const response = await fetch(currentUrl, {
      ...fetchOptions,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Web2Mag-Article-Ingester/1.0',
        Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        ...(fetchOptions.headers || {}),
      },
      redirect: 'manual',
      signal,
    });

    // Check for redirects (301, 302, 303, 307, 308)
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location) {
        throw new Error(`Redirect status ${response.status} returned without Location header.`);
      }

      // Resolve relative redirect location against current URL
      const redirectTarget = new URL(location, currentUrl).href;
      currentUrl = redirectTarget;
      redirectCount += 1;
      continue;
    }

    if (!response.ok) {
      throw new Error(`HTTP fetch failed with status ${response.status} (${response.statusText})`);
    }

    // 4. Validate Content-Type
    const contentType = response.headers.get('content-type') || '';
    const isHtml = contentType.includes('text/html') || contentType.includes('application/xhtml+xml');
    const isJson = contentType.includes('application/json');

    if (!isHtml && !isJson) {
      throw new Error(
        `Invalid response content type: "${contentType}". Only HTML and JSON article endpoints are supported.`
      );
    }

    // 5. Enforce response size limit
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_RESPONSE_SIZE) {
      throw new Error(
        `Response size (${contentLength} bytes) exceeds maximum allowable limit of ${MAX_RESPONSE_SIZE} bytes.`
      );
    }

    // Read response text with size tracking
    const bodyText = await response.text();
    if (bodyText.length > MAX_RESPONSE_SIZE) {
      throw new Error(`Downloaded response exceeded maximum allowable limit of ${MAX_RESPONSE_SIZE} bytes.`);
    }

    return {
      response,
      finalUrl: currentUrl,
      bodyText,
    };
  }

  throw new Error(`Too many redirects encountered (exceeded limit of ${MAX_REDIRECTS}).`);
}

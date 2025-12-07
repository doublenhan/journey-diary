// XSS Prevention Utility using DOMPurify
import DOMPurify from 'isomorphic-dompurify';

// Configuration for different content types
const SANITIZE_CONFIG = {
  // For memory titles - only plain text, no HTML
  plainText: {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  },
  
  // For memory descriptions - allow basic formatting
  richText: {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p', 'ul', 'ol', 'li', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'], // For external links
  },
  
  // For URLs - ensure safe URL schemes
  url: {
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  },
};

/**
 * Sanitize plain text (titles, names, etc.)
 * Removes ALL HTML tags and dangerous characters
 */
export function sanitizePlainText(text: string | null | undefined): string {
  if (!text || typeof text !== 'string') return '';
  
  // Remove all HTML tags and keep only text content
  const cleaned = DOMPurify.sanitize(text, SANITIZE_CONFIG.plainText);
  
  // Additional cleanup for special characters
  return cleaned
    .replace(/[<>]/g, '') // Remove any remaining brackets
    .trim();
}

/**
 * Sanitize rich text (descriptions, comments)
 * Allows safe HTML formatting tags
 */
export function sanitizeRichText(html: string | null | undefined): string {
  if (!html || typeof html !== 'string') return '';
  
  const cleaned = DOMPurify.sanitize(html, SANITIZE_CONFIG.richText);
  
  // Ensure external links open in new tab with security
  return cleaned.replace(
    /<a\s+href="(https?:\/\/[^"]+)"/gi,
    '<a href="$1" target="_blank" rel="noopener noreferrer"'
  );
}

/**
 * Sanitize URL
 * Ensures URL uses safe protocol (http/https)
 */
export function sanitizeUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return '';
  
  // Check for javascript: or data: protocols
  const dangerous = /^(javascript|data|vbscript|file):/i;
  if (dangerous.test(url.trim())) {
    console.warn('⚠️ Blocked dangerous URL:', url);
    return '';
  }
  
  return DOMPurify.sanitize(url, SANITIZE_CONFIG.url);
}

/**
 * Sanitize HTML attributes
 * Use for dynamic attribute values
 */
export function sanitizeAttribute(attr: string | null | undefined): string {
  if (!attr || typeof attr !== 'string') return '';
  
  return attr
    .replace(/["'<>]/g, '') // Remove quotes and brackets
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Sanitize object with multiple fields
 * Useful for form submissions, API payloads
 */
export function sanitizeObject(obj: any, schema: Record<string, string> = {}): Record<string, any> {
  if (!obj || typeof obj !== 'object') return {};
  
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const sanitizeType = schema[key] || 'plainText';
    
    if (typeof value === 'string') {
      switch (sanitizeType) {
        case 'richText':
          sanitized[key] = sanitizeRichText(value);
          break;
        case 'url':
          sanitized[key] = sanitizeUrl(value);
          break;
        case 'plainText':
        default:
          sanitized[key] = sanitizePlainText(value);
          break;
      }
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizePlainText(item) : item
      );
    } else {
      sanitized[key] = value; // Keep non-string values as is
    }
  }
  
  return sanitized;
}

/**
 * Pre-configured sanitizers for common use cases
 */
export const sanitizers = {
  // Memory data
  memory: (data: any) => sanitizeObject(data, {
    title: 'plainText',
    description: 'richText',
    location: 'plainText',
    imageUrl: 'url',
    tags: 'plainText',
  }),
  
  // User profile
  profile: (data: any) => sanitizeObject(data, {
    displayName: 'plainText',
    bio: 'richText',
    photoURL: 'url',
    email: 'plainText',
  }),
  
  // Comment/Note
  comment: (data: any) => sanitizeObject(data, {
    text: 'richText',
    author: 'plainText',
  }),
};

export default {
  sanitizePlainText,
  sanitizeRichText,
  sanitizeUrl,
  sanitizeAttribute,
  sanitizeObject,
  sanitizers,
};

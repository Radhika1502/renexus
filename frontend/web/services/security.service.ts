import { AES, enc } from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';

export class SecurityService {
  private static instance: SecurityService;
  private encryptionKey: string;
  private deviceId: string;

  private constructor() {
    // Generate or retrieve device ID
    this.deviceId = this.getOrCreateDeviceId();
    
    // Generate encryption key from environment and device ID
    this.encryptionKey = this.generateEncryptionKey();
  }

  static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  private getOrCreateDeviceId(): string {
    const storedId = localStorage.getItem('device_id');
    if (storedId) {
      return storedId;
    }
    const newId = uuidv4();
    localStorage.setItem('device_id', newId);
    return newId;
  }

  private generateEncryptionKey(): string {
    const baseKey = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'default-key';
    return `${baseKey}-${this.deviceId}`;
  }

  // Encrypt sensitive data
  encrypt(data: string): string {
    return AES.encrypt(data, this.encryptionKey).toString();
  }

  // Decrypt sensitive data
  decrypt(encryptedData: string): string {
    const bytes = AES.decrypt(encryptedData, this.encryptionKey);
    return bytes.toString(enc.Utf8);
  }

  // Sanitize user input
  sanitizeInput(input: string): string {
    // Remove potentially dangerous characters and HTML
    return input
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .trim();
  }

  // Validate API response structure
  validateApiResponse(response: any): boolean {
    // Add validation logic based on expected response structure
    if (!response || typeof response !== 'object') {
      return false;
    }

    // Add more specific validation as needed
    return true;
  }

  // Generate secure random values
  generateSecureRandom(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Hash sensitive data (e.g., for caching keys)
  hash(data: string): string {
    const encoder = new TextEncoder();
    const buffer = encoder.encode(data);
    return crypto.subtle.digest('SHA-256', buffer).then(hash => {
      return Array.from(new Uint8Array(hash))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
    });
  }

  // Validate file types for upload
  validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type);
  }

  // Validate file size
  validateFileSize(file: File, maxSizeInMB: number): boolean {
    return file.size <= maxSizeInMB * 1024 * 1024;
  }

  // Detect potential XSS in strings
  detectXSS(input: string): boolean {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /onerror=/gi,
      /onload=/gi,
      /onclick=/gi,
      /onmouseover=/gi,
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  }

  // Validate URLs
  validateUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return ['http:', 'https:'].includes(parsedUrl.protocol);
    } catch {
      return false;
    }
  }

  // Generate CSRF token
  generateCsrfToken(): string {
    return this.generateSecureRandom(32);
  }

  // Validate password strength
  validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Rate limiting helper
  private rateLimiters = new Map<string, { count: number; timestamp: number }>();

  checkRateLimit(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const limiter = this.rateLimiters.get(key) || { count: 0, timestamp: now };

    // Reset if outside window
    if (now - limiter.timestamp > windowMs) {
      limiter.count = 1;
      limiter.timestamp = now;
    } else {
      limiter.count++;
    }

    this.rateLimiters.set(key, limiter);
    return limiter.count <= limit;
  }
} 
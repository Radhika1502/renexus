import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { SecurityService } from '../services/security.service';

export class SecurityMiddleware {
  private static instance: SecurityMiddleware;
  private security: SecurityService;
  private axiosInstance: AxiosInstance;

  private constructor() {
    this.security = SecurityService.getInstance();
    this.axiosInstance = axios.create();
    this.setupInterceptors();
  }

  static getInstance(): SecurityMiddleware {
    if (!SecurityMiddleware.instance) {
      SecurityMiddleware.instance = new SecurityMiddleware();
    }
    return SecurityMiddleware.instance;
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config: AxiosRequestConfig) => {
        // Add CSRF token to headers
        const csrfToken = this.security.generateCsrfToken();
        config.headers = {
          ...config.headers,
          'X-CSRF-Token': csrfToken,
        };

        // Rate limiting check
        const endpoint = config.url || '';
        if (!this.security.checkRateLimit(endpoint, 100, 60000)) {
          return Promise.reject(new Error('Rate limit exceeded'));
        }

        // Validate URLs
        if (config.url && !this.security.validateUrl(config.url)) {
          return Promise.reject(new Error('Invalid URL'));
        }

        // Sanitize request data
        if (config.data && typeof config.data === 'object') {
          config.data = this.sanitizeRequestData(config.data);
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        // Validate response structure
        if (!this.security.validateApiResponse(response.data)) {
          return Promise.reject(new Error('Invalid API response'));
        }

        // Sanitize response data
        response.data = this.sanitizeResponseData(response.data);

        return response;
      },
      (error) => {
        // Handle specific security-related errors
        if (error.response) {
          switch (error.response.status) {
            case 401:
              // Handle unauthorized
              break;
            case 403:
              // Handle forbidden
              break;
            case 419:
              // Handle CSRF token mismatch
              break;
            case 429:
              // Handle rate limiting
              break;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private sanitizeRequestData(data: any): any {
    if (typeof data === 'string') {
      return this.security.sanitizeInput(data);
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeRequestData(item));
    }

    if (typeof data === 'object' && data !== null) {
      const sanitized: Record<string, any> = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeRequestData(value);
      }
      return sanitized;
    }

    return data;
  }

  private sanitizeResponseData(data: any): any {
    // Similar to sanitizeRequestData but with response-specific logic
    return this.sanitizeRequestData(data);
  }

  // Get the configured axios instance
  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }

  // Create a new instance with custom config
  createInstance(config: AxiosRequestConfig): AxiosInstance {
    const instance = axios.create(config);
    this.setupInterceptors();
    return instance;
  }

  // Validate file upload
  validateFileUpload(
    file: File,
    allowedTypes: string[] = ['image/jpeg', 'image/png', 'application/pdf'],
    maxSizeInMB: number = 10
  ): {
    isValid: boolean;
    errors: string[];
  } {
    return {
      isValid:
        this.security.validateFileType(file, allowedTypes) &&
        this.security.validateFileSize(file, maxSizeInMB),
      errors: [
        !this.security.validateFileType(file, allowedTypes) && 'Invalid file type',
        !this.security.validateFileSize(file, maxSizeInMB) &&
          `File size must be less than ${maxSizeInMB}MB`,
      ].filter(Boolean) as string[],
    };
  }

  // Encrypt data before sending
  encryptData(data: string): string {
    return this.security.encrypt(data);
  }

  // Decrypt received data
  decryptData(encryptedData: string): string {
    return this.security.decrypt(encryptedData);
  }

  // Check for XSS in user input
  validateUserInput(input: string): {
    isValid: boolean;
    error?: string;
  } {
    const hasXSS = this.security.detectXSS(input);
    return {
      isValid: !hasXSS,
      error: hasXSS ? 'Potential XSS detected' : undefined,
    };
  }

  // Validate URLs
  validateUrl(url: string): boolean {
    return this.security.validateUrl(url);
  }

  // Check rate limits
  checkRateLimit(key: string, limit: number, windowMs: number): boolean {
    return this.security.checkRateLimit(key, limit, windowMs);
  }
} 
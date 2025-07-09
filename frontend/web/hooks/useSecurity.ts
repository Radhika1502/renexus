import { useCallback } from 'react';
import { SecurityService } from '../services/security.service';

export const useSecurity = () => {
  const security = SecurityService.getInstance();

  const encryptData = useCallback((data: string) => {
    return security.encrypt(data);
  }, []);

  const decryptData = useCallback((encryptedData: string) => {
    return security.decrypt(encryptedData);
  }, []);

  const sanitizeInput = useCallback((input: string) => {
    return security.sanitizeInput(input);
  }, []);

  const validateApiResponse = useCallback((response: any) => {
    return security.validateApiResponse(response);
  }, []);

  const generateSecureRandom = useCallback((length?: number) => {
    return security.generateSecureRandom(length);
  }, []);

  const hashData = useCallback(async (data: string) => {
    return security.hash(data);
  }, []);

  const validateFileUpload = useCallback(
    (file: File, allowedTypes: string[], maxSizeInMB: number) => {
      const isValidType = security.validateFileType(file, allowedTypes);
      const isValidSize = security.validateFileSize(file, maxSizeInMB);
      return {
        isValid: isValidType && isValidSize,
        errors: [
          !isValidType && 'Invalid file type',
          !isValidSize && `File size must be less than ${maxSizeInMB}MB`,
        ].filter(Boolean) as string[],
      };
    },
    []
  );

  const detectXSS = useCallback((input: string) => {
    return security.detectXSS(input);
  }, []);

  const validateUrl = useCallback((url: string) => {
    return security.validateUrl(url);
  }, []);

  const generateCsrfToken = useCallback(() => {
    return security.generateCsrfToken();
  }, []);

  const validatePasswordStrength = useCallback((password: string) => {
    return security.validatePasswordStrength(password);
  }, []);

  const checkRateLimit = useCallback(
    (key: string, limit: number, windowMs: number) => {
      return security.checkRateLimit(key, limit, windowMs);
    },
    []
  );

  return {
    encryptData,
    decryptData,
    sanitizeInput,
    validateApiResponse,
    generateSecureRandom,
    hashData,
    validateFileUpload,
    detectXSS,
    validateUrl,
    generateCsrfToken,
    validatePasswordStrength,
    checkRateLimit,
  };
}; 
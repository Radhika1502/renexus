/**
 * Validation Utilities
 * 
 * This file exports validation utility functions
 */

// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation
export const isStrongPassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// URL validation
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Phone number validation
export const isValidPhoneNumber = (phone: string): boolean => {
  // Basic phone validation - can be enhanced for specific country formats
  const phoneRegex = /^\+?[0-9]{10,15}$/;
  return phoneRegex.test(phone);
};

// Date validation
export const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

// Required field validation
export const isNotEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};

// Number range validation
export const isInRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};

// Form validation
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validateForm = <T extends Record<string, any>>(
  data: T,
  rules: Record<keyof T, (value: any) => boolean | string>
): ValidationResult => {
  const errors: Record<string, string> = {};
  let isValid = true;

  for (const field in rules) {
    const result = rules[field](data[field]);
    
    if (typeof result === 'string') {
      errors[field] = result;
      isValid = false;
    } else if (!result) {
      errors[field] = `${String(field)} is invalid`;
      isValid = false;
    }
  }

  return { isValid, errors };
};

// Common validation rules
export const validationRules = {
  required: (value: any): boolean | string => {
    return isNotEmpty(value) || 'This field is required';
  },
  email: (value: string): boolean | string => {
    return isValidEmail(value) || 'Please enter a valid email address';
  },
  password: (value: string): boolean | string => {
    return isStrongPassword(value) || 
      'Password must be at least 8 characters with uppercase, lowercase, number, and special character';
  },
  url: (value: string): boolean | string => {
    return isValidUrl(value) || 'Please enter a valid URL';
  },
  phone: (value: string): boolean | string => {
    return isValidPhoneNumber(value) || 'Please enter a valid phone number';
  },
  date: (value: string): boolean | string => {
    return isValidDate(value) || 'Please enter a valid date';
  },
  minLength: (min: number) => (value: string): boolean | string => {
    return value.length >= min || `Must be at least ${min} characters`;
  },
  maxLength: (max: number) => (value: string): boolean | string => {
    return value.length <= max || `Must be no more than ${max} characters`;
  },
  min: (min: number) => (value: number): boolean | string => {
    return value >= min || `Must be at least ${min}`;
  },
  max: (max: number) => (value: number): boolean | string => {
    return value <= max || `Must be no more than ${max}`;
  }
};

/**
 * Unit Tests for Date Utilities
 * Phase 5.1.1 - Utility Function Tests
 */
const DateUtils = require('../../../src/utils/DateUtils');

describe('DateUtils', () => {
  describe('formatDate()', () => {
    test('should format date in default format', () => {
      const date = new Date('2025-06-15T14:30:45.000Z');
      const formattedDate = DateUtils.formatDate(date);
      expect(formattedDate).toBe('Jun 15, 2025');
    });

    test('should format date in custom format', () => {
      const date = new Date('2025-06-15T14:30:45.000Z');
      const formattedDate = DateUtils.formatDate(date, 'YYYY-MM-DD');
      expect(formattedDate).toBe('2025-06-15');
    });

    test('should handle date as string input', () => {
      const dateString = '2025-06-15T14:30:45.000Z';
      const formattedDate = DateUtils.formatDate(dateString);
      expect(formattedDate).toBe('Jun 15, 2025');
    });

    test('should return empty string for null input', () => {
      const formattedDate = DateUtils.formatDate(null);
      expect(formattedDate).toBe('');
    });

    test('should return empty string for undefined input', () => {
      const formattedDate = DateUtils.formatDate(undefined);
      expect(formattedDate).toBe('');
    });

    test('should return empty string for invalid date input', () => {
      const formattedDate = DateUtils.formatDate('not-a-date');
      expect(formattedDate).toBe('');
    });
  });

  describe('formatDateTime()', () => {
    test('should format date and time in default format', () => {
      const date = new Date('2025-06-15T14:30:45.000Z');
      const formatted = DateUtils.formatDateTime(date);
      expect(formatted).toBe('Jun 15, 2025, 2:30 PM');
    });

    test('should format date in custom format', () => {
      const date = new Date('2025-06-15T14:30:45.000Z');
      const formatted = DateUtils.formatDateTime(date, 'YYYY-MM-DD HH:mm:ss');
      expect(formatted).toBe('2025-06-15 14:30:45');
    });

    test('should handle date as string input', () => {
      const dateString = '2025-06-15T14:30:45.000Z';
      const formatted = DateUtils.formatDateTime(dateString);
      expect(formatted).toBe('Jun 15, 2025, 2:30 PM');
    });
    
    test('should return empty string for null input', () => {
      const formatted = DateUtils.formatDateTime(null);
      expect(formatted).toBe('');
    });
  });

  describe('addDays()', () => {
    test('should add days to a date', () => {
      const date = new Date('2025-06-15T12:00:00.000Z');
      const newDate = DateUtils.addDays(date, 5);
      expect(newDate.toISOString()).toBe('2025-06-20T12:00:00.000Z');
    });

    test('should subtract days when given negative value', () => {
      const date = new Date('2025-06-15T12:00:00.000Z');
      const newDate = DateUtils.addDays(date, -5);
      expect(newDate.toISOString()).toBe('2025-06-10T12:00:00.000Z');
    });

    test('should handle month transitions', () => {
      const date = new Date('2025-06-28T12:00:00.000Z');
      const newDate = DateUtils.addDays(date, 5);
      expect(newDate.toISOString()).toBe('2025-07-03T12:00:00.000Z');
    });

    test('should handle year transitions', () => {
      const date = new Date('2025-12-29T12:00:00.000Z');
      const newDate = DateUtils.addDays(date, 5);
      expect(newDate.toISOString()).toBe('2026-01-03T12:00:00.000Z');
    });

    test('should return new date object without modifying original', () => {
      const originalDate = new Date('2025-06-15T12:00:00.000Z');
      const originalISOString = originalDate.toISOString();
      
      const newDate = DateUtils.addDays(originalDate, 5);
      
      expect(newDate).not.toBe(originalDate); // Not the same object
      expect(originalDate.toISOString()).toBe(originalISOString); // Original unchanged
      expect(newDate.toISOString()).toBe('2025-06-20T12:00:00.000Z');
    });
  });

  describe('getDateDifference()', () => {
    test('should return difference in days between two dates', () => {
      const date1 = new Date('2025-06-15T12:00:00.000Z');
      const date2 = new Date('2025-06-20T12:00:00.000Z');
      const diff = DateUtils.getDateDifference(date1, date2);
      expect(diff).toBe(5);
    });

    test('should return negative difference when second date is before first', () => {
      const date1 = new Date('2025-06-20T12:00:00.000Z');
      const date2 = new Date('2025-06-15T12:00:00.000Z');
      const diff = DateUtils.getDateDifference(date1, date2);
      expect(diff).toBe(-5);
    });

    test('should return 0 when dates are the same', () => {
      const date1 = new Date('2025-06-15T12:00:00.000Z');
      const date2 = new Date('2025-06-15T12:00:00.000Z');
      const diff = DateUtils.getDateDifference(date1, date2);
      expect(diff).toBe(0);
    });

    test('should handle string date inputs', () => {
      const date1 = '2025-06-15T12:00:00.000Z';
      const date2 = '2025-06-20T12:00:00.000Z';
      const diff = DateUtils.getDateDifference(date1, date2);
      expect(diff).toBe(5);
    });

    test('should ignore time component when onlyDays is true', () => {
      const date1 = new Date('2025-06-15T08:00:00.000Z');
      const date2 = new Date('2025-06-15T20:00:00.000Z');
      const diff = DateUtils.getDateDifference(date1, date2, true);
      expect(diff).toBe(0); // Same day, ignoring time
    });
  });

  describe('isDateValid()', () => {
    test('should return true for valid date object', () => {
      const date = new Date('2025-06-15T12:00:00.000Z');
      expect(DateUtils.isDateValid(date)).toBe(true);
    });

    test('should return true for valid date string', () => {
      const dateString = '2025-06-15T12:00:00.000Z';
      expect(DateUtils.isDateValid(dateString)).toBe(true);
    });

    test('should return false for invalid date object', () => {
      const date = new Date('invalid-date');
      expect(DateUtils.isDateValid(date)).toBe(false);
    });

    test('should return false for invalid date string', () => {
      expect(DateUtils.isDateValid('invalid-date')).toBe(false);
    });

    test('should return false for null input', () => {
      expect(DateUtils.isDateValid(null)).toBe(false);
    });

    test('should return false for undefined input', () => {
      expect(DateUtils.isDateValid(undefined)).toBe(false);
    });

    test('should return false for non-date objects', () => {
      expect(DateUtils.isDateValid({})).toBe(false);
      expect(DateUtils.isDateValid(123)).toBe(false);
      expect(DateUtils.isDateValid(true)).toBe(false);
    });
  });
});

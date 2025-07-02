/**
 * Standard API response format
 * @param status Response status (success, error, warning)
 * @param message Response message
 * @param data Response data payload
 * @returns Formatted API response
 */
export const formatResponse = (
  status: 'success' | 'error' | 'warning',
  message: string,
  data: any
) => {
  return {
    status,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

import { RetryOptions, RetryState } from '../types/retry';

/**
 * Check if error is retryable (network error, timeout, or optional 5xx)
 */
const isRetryableError = (error: any, retryOn5xx: boolean): boolean => {
  // AbortError should not be retried
  if (error.name === 'AbortError') {
    return false;
  }

  // Network error (no response)
  if (!error.response) {
    return true;
  }

  const status = error.response.status;
  
  // Don't retry client errors (4xx)
  if (status >= 400 && status < 500) {
    return false;
  }

  // Retry server errors (5xx) if enabled
  if (retryOn5xx && status >= 500) {
    return true;
  }

  return false;
};

/**
 * Calculate delay using exponential backoff formula: baseDelay * 2^(attempt-1)
 */
const calculateDelay = (attempt: number, baseDelay: number): number => {
  return baseDelay * Math.pow(2, attempt - 1);
};

/**
 * Wait for specified delay
 */
const wait = (delay: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, delay));
};

/**
 * Main retry function with exponential backoff
 */
export const fetchWithRetry = async <T>(
  apiCall: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const {
    maxRetry = 3,
    baseDelay = 500,
    retryOn5xx = true
  } = options;

  const state: RetryState = {
    attempt: 0,
    maxRetry,
    baseDelay
  };

  while (state.attempt <= maxRetry) {
    try {
      state.attempt++;
      
      console.log(`🔄 [Retry] Attempt ${state.attempt}/${maxRetry + 1}`);
      
      const result = await apiCall();
      
      // Success - return result
      console.log(`✅ [Retry] Attempt ${state.attempt} successful`);
      return result;
      
    } catch (error: any) {
      console.log(`❌ [Retry] Attempt ${state.attempt} failed:`, error.message);
      
      // Check if we should retry
      const shouldRetry = state.attempt <= maxRetry && 
                         isRetryableError(error, retryOn5xx);
      
      if (!shouldRetry) {
        console.log(`🚫 [Retry] Max retry reached or non-retryable error`);
        throw error;
      }
      
      // Calculate and wait for retry delay
      const delay = calculateDelay(state.attempt, baseDelay);
      console.log(`⏳ [Retry] Retrying in ${delay}ms...`);
      
      await wait(delay);
    }
  }
  
  throw new Error('Unexpected error in fetchWithRetry');
};
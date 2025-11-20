export interface RetryOptions {
  maxRetry?: number;
  baseDelay?: number;
  retryOn5xx?: boolean;
}

export interface RetryState {
  attempt: number;
  maxRetry: number;
  baseDelay: number;
}
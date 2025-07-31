/**
 * Database retry utility for handling connection issues
 */

export interface RetryOptions {
  maxRetries?: number;
  delayMs?: number;
  backoffMultiplier?: number;
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
  } = options;

  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Only retry on connection errors (P1001) or timeout errors
      const shouldRetry = 
        error?.code === 'P1001' || // Connection error
        error?.code === 'P1008' || // Timeout error
        error?.message?.includes('Can\'t reach database server') ||
        error?.message?.includes('timeout');
      
      if (!shouldRetry || attempt === maxRetries) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = delayMs * Math.pow(backoffMultiplier, attempt);
      console.warn(`⚠️ Database operation failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Wrapper for Prisma operations with automatic retry
 */
export function createRetryWrapper(defaultOptions?: RetryOptions) {
  return function retryWrapper<T>(
    operation: () => Promise<T>,
    options?: RetryOptions
  ): Promise<T> {
    return withRetry(operation, { ...defaultOptions, ...options });
  };
}

// Default retry wrapper with sensible defaults
export const retryDb = createRetryWrapper({
  maxRetries: 3,
  delayMs: 1000,
  backoffMultiplier: 1.5,
}); 
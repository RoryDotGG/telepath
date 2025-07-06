export class BotError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public userMessage?: string
  ) {
    super(message);
    this.name = 'BotError';
  }
}

export class DubAPIError extends BotError {
  constructor(message: string, statusCode?: number) {
    super(
      message,
      'DUB_API_ERROR',
      statusCode,
      'Failed to create short link. Please try again.'
    );
    this.name = 'DubAPIError';
  }
}

export class AIServiceError extends BotError {
  constructor(message: string) {
    super(
      message,
      'AI_SERVICE_ERROR',
      undefined,
      'Failed to generate intelligent slug. Using fallback.'
    );
    this.name = 'AIServiceError';
  }
}

export class ValidationError extends BotError {
  constructor(message: string, userMessage: string) {
    super(message, 'VALIDATION_ERROR', undefined, userMessage);
    this.name = 'ValidationError';
  }
}

export function handleError(error: unknown, context?: string): BotError {
  console.error(`Error in ${context || 'unknown context'}:`, error);

  if (error instanceof BotError) {
    return error;
  }

  if (error instanceof Error) {
    // Handle specific error types
    if (error.message.includes('Invalid token')) {
      return new BotError(
        'Invalid bot token',
        'INVALID_TOKEN',
        401,
        'Bot configuration error. Please contact administrator.'
      );
    }

    if (error.message.includes('Network')) {
      return new BotError(
        'Network error',
        'NETWORK_ERROR',
        undefined,
        'Network connection failed. Please try again.'
      );
    }

    if (error.message.includes('Rate limit')) {
      return new BotError(
        'Rate limit exceeded',
        'RATE_LIMIT',
        429,
        'Too many requests. Please wait a moment and try again.'
      );
    }

    return new BotError(
      error.message,
      'UNKNOWN_ERROR',
      undefined,
      'An unexpected error occurred. Please try again.'
    );
  }

  return new BotError(
    'Unknown error occurred',
    'UNKNOWN_ERROR',
    undefined,
    'An unexpected error occurred. Please try again.'
  );
}

export function getUserFriendlyMessage(error: BotError): string {
  return error.userMessage || error.message || 'An unexpected error occurred.';
}

export function shouldRetry(error: BotError): boolean {
  const retryableCodes = ['NETWORK_ERROR', 'RATE_LIMIT'];
  return error.code ? retryableCodes.includes(error.code) : false;
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: BotError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = handleError(error, `Attempt ${attempt}`);
      
      if (attempt === maxRetries || !shouldRetry(lastError)) {
        throw lastError;
      }

      console.log(`Retrying in ${delay}ms... (attempt ${attempt}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }

  throw lastError!;
}
/**
 * Error types for the explorer API layer.
 *
 * Provides structured error information so consumers can distinguish between
 * transient failures (retryable), client errors (bad input), and network issues.
 */

export class ExplorerError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly isRetryable: boolean = false,
  ) {
    super(message);
    this.name = 'ExplorerError';
  }
}

export class ExplorerNetworkError extends ExplorerError {
  constructor(message: string) {
    super(message, 'NETWORK_ERROR', true);
    this.name = 'ExplorerNetworkError';
  }
}

export class ExplorerTimeoutError extends ExplorerError {
  constructor(message: string = 'Request timed out') {
    super(message, 'TIMEOUT', true);
    this.name = 'ExplorerTimeoutError';
  }
}

export class ExplorerClientError extends ExplorerError {
  constructor(message: string, public readonly statusCode: number) {
    super(message, 'CLIENT_ERROR', false);
    this.name = 'ExplorerClientError';
  }
}

export class ExplorerServerError extends ExplorerError {
  constructor(message: string, public readonly statusCode: number) {
    super(message, 'SERVER_ERROR', true);
    this.name = 'ExplorerServerError';
  }
}

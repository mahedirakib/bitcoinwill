import { describe, expect, it } from 'vitest';
import {
  ExplorerError,
  ExplorerNetworkError,
  ExplorerTimeoutError,
  ExplorerClientError,
  ExplorerServerError,
} from './errors';

describe('explorer errors', () => {
  describe('ExplorerError', () => {
    it('creates base error with defaults', () => {
      const error = new ExplorerError('Something went wrong', 'UNKNOWN');
      expect(error.message).toBe('Something went wrong');
      expect(error.code).toBe('UNKNOWN');
      expect(error.isRetryable).toBe(false);
      expect(error.name).toBe('ExplorerError');
    });

    it('allows custom retryable flag', () => {
      const error = new ExplorerError('Retry this', 'CUSTOM', true);
      expect(error.isRetryable).toBe(true);
    });
  });

  describe('ExplorerNetworkError', () => {
    it('creates retryable network error', () => {
      const error = new ExplorerNetworkError('Connection refused');
      expect(error.message).toBe('Connection refused');
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.isRetryable).toBe(true);
      expect(error.name).toBe('ExplorerNetworkError');
    });
  });

  describe('ExplorerTimeoutError', () => {
    it('creates retryable timeout error with default message', () => {
      const error = new ExplorerTimeoutError();
      expect(error.message).toBe('Request timed out');
      expect(error.code).toBe('TIMEOUT');
      expect(error.isRetryable).toBe(true);
      expect(error.name).toBe('ExplorerTimeoutError');
    });

    it('allows custom timeout message', () => {
      const error = new ExplorerTimeoutError('Custom timeout message');
      expect(error.message).toBe('Custom timeout message');
    });
  });

  describe('ExplorerClientError', () => {
    it('creates non-retryable client error with status code', () => {
      const error = new ExplorerClientError('Bad request', 400);
      expect(error.message).toBe('Bad request');
      expect(error.code).toBe('CLIENT_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.isRetryable).toBe(false);
      expect(error.name).toBe('ExplorerClientError');
    });

    it('handles 404 not found', () => {
      const error = new ExplorerClientError('Address not found', 404);
      expect(error.statusCode).toBe(404);
      expect(error.isRetryable).toBe(false);
    });

    it('handles 429 rate limit', () => {
      const error = new ExplorerClientError('Rate limited', 429);
      expect(error.statusCode).toBe(429);
      expect(error.isRetryable).toBe(false);
    });
  });

  describe('ExplorerServerError', () => {
    it('creates retryable server error with status code', () => {
      const error = new ExplorerServerError('Internal server error', 500);
      expect(error.message).toBe('Internal server error');
      expect(error.code).toBe('SERVER_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.isRetryable).toBe(true);
      expect(error.name).toBe('ExplorerServerError');
    });

    it('handles 503 service unavailable', () => {
      const error = new ExplorerServerError('Service unavailable', 503);
      expect(error.statusCode).toBe(503);
      expect(error.isRetryable).toBe(true);
    });

    it('handles 502 bad gateway', () => {
      const error = new ExplorerServerError('Bad gateway', 502);
      expect(error.statusCode).toBe(502);
      expect(error.isRetryable).toBe(true);
    });
  });

  describe('error inheritance', () => {
    it('all errors extend ExplorerError', () => {
      expect(new ExplorerNetworkError('test')).toBeInstanceOf(ExplorerError);
      expect(new ExplorerTimeoutError()).toBeInstanceOf(ExplorerError);
      expect(new ExplorerClientError('test', 400)).toBeInstanceOf(ExplorerError);
      expect(new ExplorerServerError('test', 500)).toBeInstanceOf(ExplorerError);
    });

    it('all errors extend Error', () => {
      expect(new ExplorerNetworkError('test')).toBeInstanceOf(Error);
      expect(new ExplorerTimeoutError()).toBeInstanceOf(Error);
    });
  });
});

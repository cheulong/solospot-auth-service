import { describe, it, expect } from 'vitest';
import { HttpError } from './HttpError';

describe('HttpError', () => {
  it('should create an HttpError with message and status', () => {
    const error = new HttpError('Not Found', 404);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(HttpError);
    expect(error.message).toBe('Not Found');
    expect(error.status).toBe(404);
  });

  it('should preserve prototype chain', () => {
    const error = new HttpError('Unauthorized', 401);

    expect(Object.getPrototypeOf(error)).toBe(HttpError.prototype);
  });
});

import { describe, it, expect } from 'vitest';
import { greet } from './index';

describe('Pic-Map', () => {

  it('should greet a user', () => {
    expect(greet('World')).toBe('Hello, World! Welcome to Pic-Map.');
  });
});

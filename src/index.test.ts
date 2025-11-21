import { describe, it, expect } from 'vitest';
import { greet, version } from './index';

describe('Pic-Map', () => {
  it('should have a version', () => {
    expect(version).toBe('1.0.0');
  });

  it('should greet a user', () => {
    expect(greet('World')).toBe('Hello, World! Welcome to Pic-Map.');
  });
});

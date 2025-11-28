/**
 * Pic-Map - Create maps with picture borders
 * Main entry point
 */

export const version = '1.0.0';

export function greet(name: string): string {
  return `Hello, ${name}! Welcome to Pic-Map.`;
}

// Export type definitions
export * from './types';

// Export validators
export * from './validators';

// Export loaders
export * from './loaders';

// Export map engine
export * from './map-engine';

// Export compositor
export * from './compositor';
// Export link manager
export * from './link-manager';
// Export picture border engine
export * from './picture-border-engine';

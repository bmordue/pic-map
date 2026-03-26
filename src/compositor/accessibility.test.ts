import { describe, it, expect } from 'vitest';
import { Compositor } from './compositor';
import type { CompositorConfig, CompositionInput } from './types';

describe('Compositor Accessibility', () => {
  const defaultConfig: CompositorConfig = {
    pageSize: 'A4',
    orientation: 'landscape',
    borderWidth: 30,
    pictureSpacing: 5,
    margin: { top: 10, right: 10, bottom: 10, left: 10 },
    dpi: 72,
  };

  const defaultInput: CompositionInput = {
    map: {
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="#ccc" width="400" height="300"/></svg>',
      width: 400,
      height: 300,
      bounds: { north: 52, south: 51, east: 0, west: -1 },
    },
    images: [{ filePath: '/images/image1.jpg', caption: 'Image 1' }],
    links: [{ imageIndex: 0, markerPosition: { x: 100, y: 150 }, label: 'A' }],
  };

  it('should include accessibility metadata in pictures', () => {
    const compositor = new Compositor(defaultConfig);
    const result = compositor.render(defaultInput);

    // Should have role="graphics-symbol" on the picture group
    expect(result.svg).toContain('role="graphics-symbol"');
    // Should have aria-label="Image 1" on the picture group
    expect(result.svg).toContain('aria-label="Image 1"');
    // Should have a title element inside
    expect(result.svg).toContain('<title>Image 1</title>');

    // Should NOT have the old redundant nested group
    // The old one was: <g role="img" aria-label="Image 1"><title>Image 1</title></g>
    // But since it's now applied to the parent, searching for it specifically:
    expect(result.svg).not.toMatch(/<g role="img" aria-label="Image 1">/);
  });
});

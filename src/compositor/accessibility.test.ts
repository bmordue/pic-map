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

  it('should include accessibility metadata in pictures and map area', () => {
    const compositor = new Compositor(defaultConfig);
    const result = compositor.render(defaultInput);

    // Should have role="img" and aria-label="Map area" on the map area group
    expect(result.svg).toContain('<g class="map-area" transform="translate(');
    expect(result.svg).toContain('role="img"');
    expect(result.svg).toContain('aria-label="Map area"');

    // Should have role="graphics-symbol" on the picture group
    expect(result.svg).toContain('role="graphics-symbol"');
    // Should have aria-label with label correlation
    expect(result.svg).toContain('aria-label="Image 1 (labeled A)"');
    // Should have aria-posinset and aria-setsize
    expect(result.svg).toContain('aria-posinset="1"');
    expect(result.svg).toContain('aria-setsize="1"');
    // Should have a title element inside
    expect(result.svg).toContain('<title>Image 1 (labeled A)</title>');
    // Should have tabindex for keyboard navigation
    expect(result.svg).toContain('tabindex="0"');
    // Should have aria-hidden on decorative groups
    expect(result.svg).toContain('aria-hidden="true"');

    // Should NOT have the old redundant nested group
    // The old one was: <g role="img" aria-label="Image 1"><title>Image 1</title></g>
    // But since it's now applied to the parent, searching for it specifically:
    expect(result.svg).not.toMatch(/<g role="img" aria-label="Image 1">/);
  });

  it('should include interactive styles in the composition SVG', () => {
    const compositor = new Compositor(defaultConfig);
    const result = compositor.render(defaultInput);

    expect(result.svg).toContain('<style>');
    expect(result.svg).toContain(
      '.picture, .marker { cursor: pointer; outline: none; transition: filter 0.2s; }'
    );
    expect(result.svg).toContain(
      '  .picture:hover, .picture:focus-visible, .marker:hover, .marker:focus-visible { filter: brightness(1.1) drop-shadow(0 2px 4px rgba(0,0,0,0.2)); }'
    );
    expect(result.svg).toContain(
      '.picture:focus-visible, .marker:focus-visible { outline: 3px solid #4a90e2;'
    );
    expect(result.svg).toContain('</style>');
  });
});

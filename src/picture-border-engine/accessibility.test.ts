import { describe, it, expect } from 'vitest';
import { PictureBorderEngine } from './engine';
import type { ImageMetadata, LayoutOptions } from '../types';

describe('PictureBorderEngine Accessibility', () => {
  const defaultLayout: LayoutOptions = {
    pageSize: 'A4',
    orientation: 'landscape',
    borderWidth: 60,
    pictureSpacing: 10,
    margin: { top: 20, right: 20, bottom: 20, left: 20 },
  };

  const images: ImageMetadata[] = [
    { filePath: 'test1.jpg', caption: 'Test Image 1' },
  ];

  it('should include accessibility metadata in root SVG', () => {
    const engine = new PictureBorderEngine();
    const result = engine.renderBorder({
      layout: defaultLayout,
      images,
    });

    expect(result.svg).toContain('role="img"');
    expect(result.svg).toContain('aria-label="Picture border for map"');
    expect(result.svg).toContain('<title>Picture border for map</title>');
  });

  it('should include interactive styles in the SVG', () => {
    const engine = new PictureBorderEngine();
    const result = engine.renderBorder({
      layout: defaultLayout,
      images,
    });

    expect(result.svg).toContain('<style>');
    expect(result.svg).toContain('.picture { cursor: pointer; outline: none; }');
    expect(result.svg).toContain('.picture:focus-visible { outline: 3px solid #4a90e2;');
    expect(result.svg).toContain('</style>');
  });

  it('should include aria-hidden on decorative elements', () => {
    const engine = new PictureBorderEngine();
    const result = engine.renderBorder({
      layout: defaultLayout,
      images,
    });

    // Check border background rectangles
    const rectCount = (result.svg.match(/<rect[^>]*aria-hidden="true"/g) || []).length;
    // 4 background borders + 1 inner area = 5
    expect(rectCount).toBeGreaterThanOrEqual(5);
  });

  it('should enhance picture frame accessibility with labels', () => {
    const engine = new PictureBorderEngine();
    const result = engine.renderBorder({
      layout: defaultLayout,
      images,
      links: [{ imageId: '0', label: 'A' }]
    });

    expect(result.svg).toContain('class="picture-frame picture"');
    expect(result.svg).toContain('role="graphics-symbol"');
    expect(result.svg).toContain('aria-label="Test Image 1 (labeled A)"');
    expect(result.svg).toContain('aria-posinset="1"');
    expect(result.svg).toContain('aria-setsize="1"');
    expect(result.svg).toContain('<title>Test Image 1 (labeled A)</title>');
    expect(result.svg).toContain('tabindex="0"');

    // Labels should be aria-hidden
    expect(result.svg).toContain('<circle');
    expect(result.svg).toContain('aria-hidden="true"');
    expect(result.svg).toContain('<text');
    expect(result.svg).toContain('aria-hidden="true">A</text>');
  });
});

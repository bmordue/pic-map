import { describe, it, expect } from 'vitest';
import { PictureBorderEngine } from './engine';
import type { LayoutOptions, ImageMetadata } from '../types';

describe('PictureBorderEngine Accessibility', () => {
  const defaultLayout: LayoutOptions = {
    pageSize: 'A4',
    orientation: 'landscape',
    borderWidth: 60,
    pictureSpacing: 10,
    margin: { top: 20, right: 20, bottom: 20, left: 20 },
  };

  const sampleImages: ImageMetadata[] = [
    { filePath: '/img1.jpg', caption: 'Image 1', dimensions: { width: 1920, height: 1080 } },
  ];

  it('should include interactive styles and .picture class', () => {
    const engine = new PictureBorderEngine();
    const result = engine.renderBorder({
      layout: defaultLayout,
      images: sampleImages,
    });

    expect(result.svg).toContain('<style>');
    expect(result.svg).toContain('.picture { cursor: pointer; outline: none; transition: filter 0.2s; }');
    expect(result.svg).toContain('.picture:hover { filter: brightness(1.1); }');
    expect(result.svg).toContain('.picture:focus-visible { outline: 3px solid #4a90e2;');
    expect(result.svg).toContain('</style>');
    expect(result.svg).toContain('class="picture"');
    expect(result.svg).toContain('role="graphics-symbol"');
    expect(result.svg).toContain('tabindex="0"');
  });

  it('should hide decorative elements from screen readers', () => {
    const engine = new PictureBorderEngine();
    const result = engine.renderBorder({
      layout: defaultLayout,
      images: sampleImages,
      links: [{ imageId: '0', label: 'A' }],
    });

    // Border background
    expect(result.svg).toContain('id="border-background" aria-hidden="true"');

    // Inner area placeholder
    expect(result.svg).toContain('stroke-dasharray="5,5" aria-hidden="true"');

    // Image placeholders
    expect(result.svg).toContain('fill="#e0e0e0"');
    expect(result.svg).toContain('aria-hidden="true"');

    // Redundant label text
    expect(result.svg).toContain('font-weight="bold" fill="white" aria-hidden="true">A</text>');
  });
});

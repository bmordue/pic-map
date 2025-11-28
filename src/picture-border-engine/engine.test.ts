import { describe, it, expect } from 'vitest';
import { PictureBorderEngine } from './engine';
import type { LayoutOptions, ImageMetadata, PictureBorderStyle } from '../types';

describe('PictureBorderEngine', () => {
  const defaultLayout: LayoutOptions = {
    pageSize: 'A4',
    orientation: 'landscape',
    borderWidth: 60,
    pictureSpacing: 10,
    margin: { top: 20, right: 20, bottom: 20, left: 20 },
  };

  const sampleImages: ImageMetadata[] = [
    { filePath: '/img1.jpg', caption: 'Image 1', dimensions: { width: 1920, height: 1080 } },
    { filePath: '/img2.jpg', caption: 'Image 2', dimensions: { width: 800, height: 600 } },
    { filePath: '/img3.jpg', caption: 'Image 3', dimensions: { width: 1200, height: 800 } },
    { filePath: '/img4.jpg', caption: 'Image 4', dimensions: { width: 1000, height: 1000 } },
  ];

  describe('renderBorder', () => {
    it('should render a basic picture border', () => {
      const engine = new PictureBorderEngine();
      const result = engine.renderBorder({
        layout: defaultLayout,
        images: sampleImages,
      });

      expect(result).toBeDefined();
      expect(result.svg).toContain('<svg');
      expect(result.svg).toContain('</svg>');
      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
    });

    it('should include layout information in result', () => {
      const engine = new PictureBorderEngine();
      const result = engine.renderBorder({
        layout: defaultLayout,
        images: sampleImages,
      });

      expect(result.layout).toBeDefined();
      expect(result.layout.pageWidth).toBeGreaterThan(0);
      expect(result.layout.pageHeight).toBeGreaterThan(0);
      expect(result.layout.borderWidth).toBeGreaterThan(0);
      expect(result.layout.innerArea).toBeDefined();
      expect(result.layout.slots.length).toBe(4);
    });

    it('should include positioned pictures in result', () => {
      const engine = new PictureBorderEngine();
      const result = engine.renderBorder({
        layout: defaultLayout,
        images: sampleImages,
      });

      expect(result.positionedPictures).toBeDefined();
      expect(result.positionedPictures.length).toBe(4);
    });

    it('should render with custom style', () => {
      const engine = new PictureBorderEngine();
      const customStyle: PictureBorderStyle = {
        backgroundColor: '#f0f0f0',
        borderColor: '#ff0000',
        borderThickness: 4,
        cornerRadius: 10,
      };

      const result = engine.renderBorder({
        layout: defaultLayout,
        images: sampleImages,
        style: customStyle,
      });

      expect(result.svg).toContain('#f0f0f0');
      expect(result.svg).toContain('#ff0000');
      expect(result.svg).toContain('stroke-width="4"');
      expect(result.svg).toContain('rx="10"');
    });

    it('should use default style when not provided', () => {
      const engine = new PictureBorderEngine();
      const result = engine.renderBorder({
        layout: defaultLayout,
        images: sampleImages,
      });

      // Default border color is #333333
      expect(result.svg).toContain('#333333');
      // Default border thickness is 2
      expect(result.svg).toContain('stroke-width="2"');
    });

    it('should render labels when links are provided', () => {
      const engine = new PictureBorderEngine();
      const links = [
        { imageId: '0', label: 'A' },
        { imageId: '1', label: 'B' },
        { imageId: '2', label: 'C' },
        { imageId: '3', label: 'D' },
      ];

      const result = engine.renderBorder({
        layout: defaultLayout,
        images: sampleImages,
        links,
      });

      expect(result.svg).toContain('>A<');
      expect(result.svg).toContain('>B<');
      expect(result.svg).toContain('>C<');
      expect(result.svg).toContain('>D<');
    });

    it('should escape XML special characters in labels', () => {
      const engine = new PictureBorderEngine();
      const links = [{ imageId: '0', label: 'A & B' }];

      const result = engine.renderBorder({
        layout: defaultLayout,
        images: [sampleImages[0]],
        links,
      });

      expect(result.svg).toContain('A &amp; B');
      expect(result.svg).not.toContain('A & B');
    });

    it('should render empty border with no images', () => {
      const engine = new PictureBorderEngine();
      const result = engine.renderBorder({
        layout: defaultLayout,
        images: [],
      });

      expect(result.svg).toContain('<svg');
      expect(result.svg).toContain('</svg>');
      expect(result.layout.slots.length).toBe(0);
      expect(result.positionedPictures.length).toBe(0);
    });

    it('should include inner area placeholder for map', () => {
      const engine = new PictureBorderEngine();
      const result = engine.renderBorder({
        layout: defaultLayout,
        images: sampleImages,
      });

      // Inner area should be rendered with dashed stroke
      expect(result.svg).toContain('stroke-dasharray="5,5"');
    });

    it('should create clip paths for rounded corners', () => {
      const engine = new PictureBorderEngine();
      const result = engine.renderBorder({
        layout: defaultLayout,
        images: sampleImages,
        style: { cornerRadius: 10 },
      });

      expect(result.svg).toContain('<clipPath id="clip-0">');
      expect(result.svg).toContain('<clipPath id="clip-1">');
    });

    it('should not create clip paths when cornerRadius is 0', () => {
      const engine = new PictureBorderEngine();
      const result = engine.renderBorder({
        layout: defaultLayout,
        images: sampleImages,
        style: { cornerRadius: 0 },
      });

      expect(result.svg).not.toContain('<clipPath id="clip-');
    });

    it('should apply custom background color', () => {
      const engine = new PictureBorderEngine();
      const result = engine.renderBorder({
        layout: defaultLayout,
        images: sampleImages,
        borderBackgroundColor: '#eeeeee',
      });

      expect(result.svg).toContain('#eeeeee');
    });

    it('should use default background color for invalid color', () => {
      const engine = new PictureBorderEngine();
      const result = engine.renderBorder({
        layout: defaultLayout,
        images: sampleImages,
        borderBackgroundColor: 'invalid<script>alert(1)</script>',
      });

      expect(result.svg).toContain('#f5f5f5');
      expect(result.svg).not.toContain('<script>');
    });

    it('should handle different page sizes', () => {
      const engine = new PictureBorderEngine();

      const a3Layout: LayoutOptions = { ...defaultLayout, pageSize: 'A3' };
      const a3Result = engine.renderBorder({ layout: a3Layout, images: sampleImages });

      const letterLayout: LayoutOptions = { ...defaultLayout, pageSize: 'Letter' };
      const letterResult = engine.renderBorder({ layout: letterLayout, images: sampleImages });

      expect(a3Result.width).toBeGreaterThan(letterResult.width);
    });

    it('should handle portrait orientation', () => {
      const engine = new PictureBorderEngine();
      const portraitLayout: LayoutOptions = { ...defaultLayout, orientation: 'portrait' };

      const result = engine.renderBorder({
        layout: portraitLayout,
        images: sampleImages,
      });

      expect(result.height).toBeGreaterThan(result.width);
    });

    it('should render picture frames group', () => {
      const engine = new PictureBorderEngine();
      const result = engine.renderBorder({
        layout: defaultLayout,
        images: sampleImages,
      });

      expect(result.svg).toContain('id="picture-frames"');
      expect(result.svg).toContain('class="picture-frame"');
    });

    it('should include slot reference in picture frames', () => {
      const engine = new PictureBorderEngine();
      const result = engine.renderBorder({
        layout: defaultLayout,
        images: sampleImages,
      });

      expect(result.svg).toContain('data-slot="slot-0"');
      expect(result.svg).toContain('data-slot="slot-1"');
    });
  });

  describe('getLayout', () => {
    it('should return layout without rendering', () => {
      const engine = new PictureBorderEngine();
      const layout = engine.getLayout(defaultLayout, 8);

      expect(layout).toBeDefined();
      expect(layout.pageWidth).toBeGreaterThan(0);
      expect(layout.pageHeight).toBeGreaterThan(0);
      expect(layout.slots.length).toBe(8);
    });

    it('should allow planning with different picture counts', () => {
      const engine = new PictureBorderEngine();

      const layout4 = engine.getLayout(defaultLayout, 4);
      const layout8 = engine.getLayout(defaultLayout, 8);
      const layout12 = engine.getLayout(defaultLayout, 12);

      expect(layout4.slots.length).toBe(4);
      expect(layout8.slots.length).toBe(8);
      expect(layout12.slots.length).toBe(12);
    });

    it('should use custom DPI', () => {
      const engine = new PictureBorderEngine();

      const layout300 = engine.getLayout(defaultLayout, 4, 300);
      const layout96 = engine.getLayout(defaultLayout, 4, 96);

      // 300 DPI should produce larger pixel dimensions
      expect(layout300.pageWidth).toBeGreaterThan(layout96.pageWidth);
      expect(layout300.pageHeight).toBeGreaterThan(layout96.pageHeight);
    });
  });

  describe('Style Validation', () => {
    it('should sanitize invalid background color', () => {
      const engine = new PictureBorderEngine();
      const result = engine.renderBorder({
        layout: defaultLayout,
        images: sampleImages,
        style: {
          backgroundColor: 'javascript:alert(1)',
        },
      });

      // Should fall back to default #ffffff
      expect(result.svg).toContain('#ffffff');
      expect(result.svg).not.toContain('javascript');
    });

    it('should sanitize invalid border color', () => {
      const engine = new PictureBorderEngine();
      const result = engine.renderBorder({
        layout: defaultLayout,
        images: sampleImages,
        style: {
          borderColor: '<script>',
        },
      });

      // Should fall back to default #333333
      expect(result.svg).toContain('#333333');
      expect(result.svg).not.toContain('<script>');
    });

    it('should accept valid hex colors', () => {
      const engine = new PictureBorderEngine();
      const result = engine.renderBorder({
        layout: defaultLayout,
        images: sampleImages,
        style: {
          backgroundColor: '#ff00ff',
          borderColor: '#123abc',
        },
      });

      expect(result.svg).toContain('#ff00ff');
      expect(result.svg).toContain('#123abc');
    });

    it('should accept named colors', () => {
      const engine = new PictureBorderEngine();
      const result = engine.renderBorder({
        layout: defaultLayout,
        images: sampleImages,
        style: {
          backgroundColor: 'white',
          borderColor: 'navy',
        },
      });

      expect(result.svg).toContain('white');
      expect(result.svg).toContain('navy');
    });

    it('should accept rgb colors', () => {
      const engine = new PictureBorderEngine();
      const result = engine.renderBorder({
        layout: defaultLayout,
        images: sampleImages,
        style: {
          backgroundColor: 'rgb(255, 128, 0)',
        },
      });

      expect(result.svg).toContain('rgb(255, 128, 0)');
    });

    it('should accept rgba colors', () => {
      const engine = new PictureBorderEngine();
      const result = engine.renderBorder({
        layout: defaultLayout,
        images: sampleImages,
        style: {
          backgroundColor: 'rgba(255, 128, 0, 0.5)',
        },
      });

      expect(result.svg).toContain('rgba(255, 128, 0, 0.5)');
    });
  });

  describe('SVG Output Quality', () => {
    it('should include xmlns for xlink', () => {
      const engine = new PictureBorderEngine();
      const result = engine.renderBorder({
        layout: defaultLayout,
        images: sampleImages,
      });

      expect(result.svg).toContain('xmlns:xlink="http://www.w3.org/1999/xlink"');
    });

    it('should include viewBox attribute', () => {
      const engine = new PictureBorderEngine();
      const result = engine.renderBorder({
        layout: defaultLayout,
        images: sampleImages,
      });

      expect(result.svg).toContain('viewBox="0 0');
    });

    it('should use consistent coordinate system', () => {
      const engine = new PictureBorderEngine();
      const result = engine.renderBorder({
        layout: defaultLayout,
        images: sampleImages,
      });

      // ViewBox should match width/height
      expect(result.svg).toContain(`viewBox="0 0 ${result.width} ${result.height}"`);
    });
  });
});

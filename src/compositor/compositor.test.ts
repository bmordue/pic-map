import { describe, it, expect } from 'vitest';
import { Compositor, createCompositorFromLayout } from './compositor';
import type { CompositorConfig, CompositionInput } from './types';

describe('Compositor', () => {
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
    images: [
      { filePath: '/images/image1.jpg', caption: 'Image 1' },
      { filePath: '/images/image2.jpg', caption: 'Image 2' },
    ],
    links: [
      { imageIndex: 0, markerPosition: { x: 100, y: 150 }, label: 'A' },
      { imageIndex: 1, markerPosition: { x: 200, y: 100 }, label: 'B' },
    ],
  };

  describe('constructor', () => {
    it('should create compositor with default DPI when not specified', () => {
      const configWithoutDpi: CompositorConfig = {
        pageSize: 'A4',
        orientation: 'portrait',
        borderWidth: 20,
        pictureSpacing: 5,
        margin: { top: 10, right: 10, bottom: 10, left: 10 },
      };

      const compositor = new Compositor(configWithoutDpi);
      const config = compositor.getConfig();

      expect(config.dpi).toBe(300); // DEFAULT_DPI
    });

    it('should validate and clamp DPI', () => {
      const configWithLowDpi: CompositorConfig = {
        ...defaultConfig,
        dpi: 10, // Below MIN_DPI
      };

      const compositor = new Compositor(configWithLowDpi);
      const config = compositor.getConfig();

      expect(config.dpi).toBe(72); // MIN_DPI
    });
  });

  describe('createLayout', () => {
    it('should create a layout without rendering', () => {
      const compositor = new Compositor(defaultConfig);
      const layout = compositor.createLayout(defaultInput);

      expect(layout.pageDimensions).toBeDefined();
      expect(layout.mapArea).toBeDefined();
      expect(layout.borderAreas).toBeDefined();
      expect(layout.pictures).toBeDefined();
      expect(layout.links).toBeDefined();
    });
  });

  describe('render', () => {
    it('should render a complete composition', () => {
      const compositor = new Compositor(defaultConfig);
      const result = compositor.render(defaultInput);

      expect(result.svg).toContain('<svg');
      expect(result.svg).toContain('</svg>');
      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
      expect(result.dpi).toBe(72);
      expect(result.pageSizeMm).toBeDefined();
    });

    it('should include border backgrounds', () => {
      const compositor = new Compositor(defaultConfig);
      const result = compositor.render(defaultInput);

      expect(result.svg).toContain('class="border-backgrounds"');
    });

    it('should include map area', () => {
      const compositor = new Compositor(defaultConfig);
      const result = compositor.render(defaultInput);

      expect(result.svg).toContain('class="map-area"');
    });

    it('should include pictures', () => {
      const compositor = new Compositor(defaultConfig);
      const result = compositor.render(defaultInput);

      expect(result.svg).toContain('class="pictures"');
      expect(result.svg).toContain('class="picture"');
    });

    it('should include link lines when type is line or both', () => {
      const configWithLines: CompositorConfig = {
        ...defaultConfig,
        linkStyle: { type: 'line' },
      };

      const compositor = new Compositor(configWithLines);
      const result = compositor.render(defaultInput);

      expect(result.svg).toContain('class="link-lines"');
    });

    it('should include link labels when type is label or both', () => {
      const configWithLabels: CompositorConfig = {
        ...defaultConfig,
        linkStyle: { type: 'label' },
      };

      const compositor = new Compositor(configWithLabels);
      const result = compositor.render(defaultInput);

      expect(result.svg).toContain('class="link-labels"');
      expect(result.svg).toContain('>A<');
    });

    it('should not include link lines when type is none', () => {
      const configNoLinks: CompositorConfig = {
        ...defaultConfig,
        linkStyle: { type: 'none' },
      };

      const compositor = new Compositor(configNoLinks);
      const result = compositor.render(defaultInput);

      expect(result.svg).not.toContain('class="link-lines"');
      expect(result.svg).not.toContain('class="link-labels"');
    });

    it('should apply custom picture border styling', () => {
      const configWithStyle: CompositorConfig = {
        ...defaultConfig,
        pictureBorderStyle: {
          backgroundColor: '#f0f0f0',
          borderColor: '#0000ff',
          borderThickness: 4,
          cornerRadius: 8,
        },
      };

      const compositor = new Compositor(configWithStyle);
      const result = compositor.render(defaultInput);

      expect(result.svg).toContain('#0000ff');
      expect(result.svg).toContain('#f0f0f0');
      expect(result.svg).toContain('rx="8"');
    });

    it('should escape XML special characters in image paths', () => {
      const inputWithSpecialChars: CompositionInput = {
        ...defaultInput,
        images: [{ filePath: '/images/test<>&.jpg' }],
        links: [{ imageIndex: 0, markerPosition: { x: 100, y: 100 } }],
      };

      const compositor = new Compositor(defaultConfig);
      const result = compositor.render(inputWithSpecialChars);

      expect(result.svg).toContain('test&lt;&gt;&amp;.jpg');
      expect(result.svg).not.toContain('test<>&.jpg');
    });

    it('should render with dashed link lines', () => {
      const configWithDashedLines: CompositorConfig = {
        ...defaultConfig,
        linkStyle: { type: 'line', lineStyle: 'dashed', lineWidth: 2 },
      };

      const compositor = new Compositor(configWithDashedLines);
      const result = compositor.render(defaultInput);

      expect(result.svg).toContain('stroke-dasharray="8 4"');
    });

    it('should render with dotted link lines', () => {
      const configWithDottedLines: CompositorConfig = {
        ...defaultConfig,
        linkStyle: { type: 'line', lineStyle: 'dotted', lineWidth: 2 },
      };

      const compositor = new Compositor(configWithDottedLines);
      const result = compositor.render(defaultInput);

      expect(result.svg).toContain('stroke-dasharray="2 4"');
    });
  });

  describe('preview', () => {
    it('should generate a preview at lower resolution', () => {
      const compositor = new Compositor({
        ...defaultConfig,
        dpi: 300,
      });

      const result = compositor.preview(defaultInput, 72);

      expect(result.dpi).toBe(72);
      expect(result.width).toBeLessThan(compositor.getPageDimensionsPixels().width);
    });

    it('should use default preview DPI of 72', () => {
      const compositor = new Compositor({
        ...defaultConfig,
        dpi: 300,
      });

      const result = compositor.preview(defaultInput);

      expect(result.dpi).toBe(72);
    });
  });

  describe('getConfig', () => {
    it('should return a copy of the configuration', () => {
      const compositor = new Compositor(defaultConfig);
      const config = compositor.getConfig();

      expect(config).toEqual(
        expect.objectContaining({
          pageSize: 'A4',
          orientation: 'landscape',
          borderWidth: 30,
        })
      );

      // Modifying returned config should not affect compositor
      config.borderWidth = 100;
      expect(compositor.getConfig().borderWidth).toBe(30);
    });
  });

  describe('getPageDimensionsPixels', () => {
    it('should return page dimensions in pixels', () => {
      const compositor = new Compositor(defaultConfig);
      const dims = compositor.getPageDimensionsPixels();

      // A4 landscape at 72 DPI
      expect(dims.width).toBeGreaterThan(0);
      expect(dims.height).toBeGreaterThan(0);
      expect(dims.width).toBeGreaterThan(dims.height); // landscape
    });
  });

  describe('createCompositorFromLayout', () => {
    it('should create compositor from layout options', () => {
      const layout = {
        pageSize: 'Letter' as const,
        orientation: 'portrait' as const,
        borderWidth: 25,
        pictureSpacing: 8,
        margin: { top: 15, right: 15, bottom: 15, left: 15 },
      };

      const compositor = createCompositorFromLayout(layout);
      const config = compositor.getConfig();

      expect(config.pageSize).toBe('Letter');
      expect(config.orientation).toBe('portrait');
      expect(config.borderWidth).toBe(25);
      expect(config.pictureSpacing).toBe(8);
    });

    it('should accept optional styling parameters', () => {
      const layout = {
        pageSize: 'A4' as const,
        orientation: 'landscape' as const,
        borderWidth: 30,
        pictureSpacing: 5,
        margin: { top: 10, right: 10, bottom: 10, left: 10 },
      };

      const pictureBorder = { borderColor: '#ff0000' };
      const linkStyle = { type: 'both' as const };

      const compositor = createCompositorFromLayout(layout, pictureBorder, linkStyle, 150);
      const config = compositor.getConfig();

      expect(config.dpi).toBe(150);
      expect(config.pictureBorderStyle?.borderColor).toBe('#ff0000');
      expect(config.linkStyle?.type).toBe('both');
    });
  });
});

describe('Compositor Integration', () => {
  it('should render a valid SVG structure', () => {
    const config: CompositorConfig = {
      pageSize: 'A4',
      orientation: 'landscape',
      borderWidth: 40,
      pictureSpacing: 10,
      margin: { top: 20, right: 20, bottom: 20, left: 20 },
      dpi: 72,
      linkStyle: { type: 'both' },
    };

    const input: CompositionInput = {
      map: {
        svg: '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect fill="#e8e8e8" width="600" height="400"/><text x="300" y="200" text-anchor="middle">Map</text></svg>',
        width: 600,
        height: 400,
        bounds: { north: 52, south: 51, east: 0, west: -1 },
      },
      images: [
        { filePath: '/images/photo1.jpg', caption: 'Photo 1' },
        { filePath: '/images/photo2.jpg', caption: 'Photo 2' },
        { filePath: '/images/photo3.jpg', caption: 'Photo 3' },
      ],
      links: [
        { imageIndex: 0, markerPosition: { x: 150, y: 200 }, label: 'A' },
        { imageIndex: 1, markerPosition: { x: 300, y: 150 }, label: 'B' },
        { imageIndex: 2, markerPosition: { x: 450, y: 250 }, label: 'C' },
      ],
    };

    const compositor = new Compositor(config);
    const result = compositor.render(input);

    // Check SVG structure
    expect(result.svg).toMatch(/<svg[^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"[^>]*>/);
    expect(result.svg).toContain('</svg>');

    // Count opening and closing svg tags should match
    const openTags = (result.svg.match(/<svg/g) || []).length;
    const closeTags = (result.svg.match(/<\/svg>/g) || []).length;
    expect(openTags).toBe(closeTags);

    // Should have correct page dimensions
    expect(result.pageSizeMm.width).toBeCloseTo(297, 0); // A4 landscape width
    expect(result.pageSizeMm.height).toBeCloseTo(210, 0); // A4 landscape height
  });

  it('should handle custom page sizes', () => {
    const config: CompositorConfig = {
      pageSize: 'custom',
      customDimensions: { width: 300, height: 200 },
      orientation: 'portrait',
      borderWidth: 20,
      pictureSpacing: 5,
      margin: { top: 10, right: 10, bottom: 10, left: 10 },
      dpi: 72,
    };

    const input: CompositionInput = {
      map: {
        svg: '<svg></svg>',
        width: 100,
        height: 80,
        bounds: { north: 52, south: 51, east: 0, west: -1 },
      },
      images: [{ filePath: '/images/test.jpg' }],
      links: [],
    };

    const compositor = new Compositor(config);
    const result = compositor.render(input);

    expect(result.pageSizeMm.width).toBe(200);
    expect(result.pageSizeMm.height).toBe(300);
  });

  it('should handle empty images array', () => {
    const config: CompositorConfig = {
      pageSize: 'A4',
      orientation: 'portrait',
      borderWidth: 30,
      pictureSpacing: 5,
      margin: { top: 10, right: 10, bottom: 10, left: 10 },
      dpi: 72,
    };

    const input: CompositionInput = {
      map: {
        svg: '<svg><rect fill="#ccc" width="100" height="100"/></svg>',
        width: 100,
        height: 100,
        bounds: { north: 52, south: 51, east: 0, west: -1 },
      },
      images: [],
      links: [],
    };

    const compositor = new Compositor(config);
    const result = compositor.render(input);

    expect(result.svg).toContain('<svg');
    expect(result.svg).toContain('class="pictures"');
  });
});

import { describe, it, expect } from 'vitest';
import { createCompositorFromLayout } from './compositor';
import { MapEngine } from '../map-engine/engine';
import { geoToViewportPixel } from '../map-engine/coordinates';
import type { PicMapConfig } from '../types';

describe('Full Rendering Integration', () => {
  /**
   * Helper to create a composition from a PicMapConfig
   */
  function renderFromConfig(config: PicMapConfig) {
    // Create map with markers
    const mapEngine = new MapEngine();
    const markers = MapEngine.createMarkersFromLinks(config.links);

    // Determine map dimensions based on layout
    const compositor = createCompositorFromLayout(
      config.layout,
      config.pictureBorder,
      config.linkStyle,
      72 // Use low DPI for tests
    );

    const layout = compositor.createLayout({
      map: { svg: '', width: 0, height: 0, bounds: { north: 0, south: 0, east: 0, west: 0 } },
      images: config.images,
      links: [],
    });

    const mapWidth = layout.mapArea.width;
    const mapHeight = layout.mapArea.height;

    // Render the map
    const renderedMap = mapEngine.renderMap({
      style: config.map,
      width: mapWidth,
      height: mapHeight,
      markers,
    });

    // Calculate marker positions relative to map
    const markerPositions = config.links.map((link) => {
      const pixel = geoToViewportPixel(
        link.location,
        config.map.center,
        config.map.zoom,
        mapWidth,
        mapHeight
      );
      return {
        imageIndex: parseInt(link.imageId, 10),
        markerPosition: pixel,
        label: link.label,
      };
    });

    // Create full composition
    return compositor.render({
      map: renderedMap,
      images: config.images,
      links: markerPositions,
    });
  }

  it('should render a complete pic-map from configuration', () => {
    const config: PicMapConfig = {
      title: 'London Tourism Map',
      description: 'A test map',
      layout: {
        pageSize: 'A4',
        orientation: 'landscape',
        borderWidth: 40,
        pictureSpacing: 10,
        margin: { top: 15, right: 15, bottom: 15, left: 15 },
      },
      map: {
        provider: 'openstreetmap',
        zoom: 12,
        center: { latitude: 51.5074, longitude: -0.1278 },
        showScale: true,
        showAttribution: true,
      },
      images: [
        { filePath: '/images/big-ben.jpg', caption: 'Big Ben' },
        { filePath: '/images/tower-bridge.jpg', caption: 'Tower Bridge' },
        { filePath: '/images/london-eye.jpg', caption: 'London Eye' },
      ],
      links: [
        {
          imageId: '0',
          location: { latitude: 51.5007, longitude: -0.1246 },
          label: 'A',
        },
        {
          imageId: '1',
          location: { latitude: 51.5055, longitude: -0.0754 },
          label: 'B',
        },
        {
          imageId: '2',
          location: { latitude: 51.5033, longitude: -0.1195 },
          label: 'C',
        },
      ],
      pictureBorder: {
        backgroundColor: '#ffffff',
        borderColor: '#333333',
        borderThickness: 2,
        cornerRadius: 4,
      },
      linkStyle: {
        type: 'both',
        lineColor: '#0066cc',
        lineWidth: 1,
        lineStyle: 'solid',
      },
    };

    const result = renderFromConfig(config);

    // Verify SVG structure
    expect(result.svg).toContain('<svg');
    expect(result.svg).toContain('</svg>');

    // Verify components are present
    expect(result.svg).toContain('class="border-backgrounds"');
    expect(result.svg).toContain('class="map-area"');
    expect(result.svg).toContain('class="pictures"');
    expect(result.svg).toContain('class="link-lines"');
    expect(result.svg).toContain('class="link-labels"');

    // Verify labels
    expect(result.svg).toContain('>A<');
    expect(result.svg).toContain('>B<');
    expect(result.svg).toContain('>C<');

    // Verify map content is embedded
    expect(result.svg).toContain('class="marker"');

    // Verify page dimensions
    expect(result.pageSizeMm.width).toBeCloseTo(297, 0); // A4 landscape
    expect(result.pageSizeMm.height).toBeCloseTo(210, 0);
  });

  it('should render with Letter page size', () => {
    const config: PicMapConfig = {
      title: 'US Map',
      layout: {
        pageSize: 'Letter',
        orientation: 'portrait',
        borderWidth: 35,
        pictureSpacing: 8,
        margin: { top: 20, right: 20, bottom: 20, left: 20 },
      },
      map: {
        provider: 'openstreetmap',
        zoom: 10,
        center: { latitude: 40.7128, longitude: -74.006 },
      },
      images: [
        { filePath: '/images/statue.jpg' },
        { filePath: '/images/bridge.jpg' },
      ],
      links: [
        {
          imageId: '0',
          location: { latitude: 40.6892, longitude: -74.0445 },
          label: '1',
        },
        {
          imageId: '1',
          location: { latitude: 40.7061, longitude: -73.9969 },
          label: '2',
        },
      ],
    };

    const result = renderFromConfig(config);

    expect(result.svg).toContain('<svg');
    expect(result.pageSizeMm.width).toBeCloseTo(215.9, 0); // Letter portrait
    expect(result.pageSizeMm.height).toBeCloseTo(279.4, 0);
  });

  it('should render with custom page size', () => {
    const config: PicMapConfig = {
      title: 'Custom Size Map',
      layout: {
        pageSize: 'custom',
        customDimensions: { width: 400, height: 300 },
        orientation: 'landscape',
        borderWidth: 30,
        pictureSpacing: 5,
        margin: { top: 10, right: 10, bottom: 10, left: 10 },
      },
      map: {
        provider: 'custom',
        zoom: 8,
        center: { latitude: 48.8566, longitude: 2.3522 },
      },
      images: [{ filePath: '/images/eiffel.jpg' }],
      links: [
        {
          imageId: '0',
          location: { latitude: 48.8584, longitude: 2.2945 },
          label: 'ET',
        },
      ],
    };

    const result = renderFromConfig(config);

    expect(result.svg).toContain('<svg');
    expect(result.pageSizeMm.width).toBe(400);
    expect(result.pageSizeMm.height).toBe(300);
  });

  it('should render with no links', () => {
    const config: PicMapConfig = {
      title: 'Simple Map',
      layout: {
        pageSize: 'A4',
        orientation: 'portrait',
        borderWidth: 25,
        pictureSpacing: 5,
        margin: { top: 10, right: 10, bottom: 10, left: 10 },
      },
      map: {
        provider: 'openstreetmap',
        zoom: 12,
        center: { latitude: 51.5074, longitude: -0.1278 },
      },
      images: [],
      links: [],
      linkStyle: {
        type: 'none',
      },
    };

    const result = renderFromConfig(config);

    expect(result.svg).toContain('<svg');
    expect(result.svg).not.toContain('class="link-lines"');
    expect(result.svg).not.toContain('class="link-labels"');
  });

  it('should render with different link styles', () => {
    const baseConfig: PicMapConfig = {
      title: 'Link Style Test',
      layout: {
        pageSize: 'A4',
        orientation: 'landscape',
        borderWidth: 30,
        pictureSpacing: 5,
        margin: { top: 10, right: 10, bottom: 10, left: 10 },
      },
      map: {
        provider: 'openstreetmap',
        zoom: 12,
        center: { latitude: 51.5074, longitude: -0.1278 },
      },
      images: [{ filePath: '/images/test.jpg' }],
      links: [
        {
          imageId: '0',
          location: { latitude: 51.5074, longitude: -0.1278 },
          label: 'X',
        },
      ],
    };

    // Test line only
    const lineConfig = {
      ...baseConfig,
      linkStyle: { type: 'line' as const, lineColor: '#ff0000' },
    };
    const lineResult = renderFromConfig(lineConfig);
    expect(lineResult.svg).toContain('class="link-lines"');
    expect(lineResult.svg).not.toContain('class="link-labels"');

    // Test label only
    const labelConfig = {
      ...baseConfig,
      linkStyle: { type: 'label' as const },
    };
    const labelResult = renderFromConfig(labelConfig);
    expect(labelResult.svg).not.toContain('class="link-lines"');
    expect(labelResult.svg).toContain('class="link-labels"');
  });

  it('should handle many images', () => {
    const images = Array(12)
      .fill(null)
      .map((_, i) => ({ filePath: `/images/photo${i}.jpg` }));

    const links = images.slice(0, 8).map((_, i) => ({
      imageId: i.toString(),
      location: {
        latitude: 51.5 + (i % 4) * 0.01,
        longitude: -0.12 + Math.floor(i / 4) * 0.01,
      },
      label: String.fromCharCode(65 + i), // A, B, C, ...
    }));

    const config: PicMapConfig = {
      title: 'Many Photos Map',
      layout: {
        pageSize: 'A3',
        orientation: 'landscape',
        borderWidth: 50,
        pictureSpacing: 8,
        margin: { top: 15, right: 15, bottom: 15, left: 15 },
      },
      map: {
        provider: 'openstreetmap',
        zoom: 14,
        center: { latitude: 51.5074, longitude: -0.1278 },
      },
      images,
      links,
      linkStyle: { type: 'both' },
    };

    const result = renderFromConfig(config);

    expect(result.svg).toContain('<svg');
    expect(result.svg).toContain('class="pictures"');
    expect(result.pageSizeMm.width).toBeCloseTo(420, 0); // A3 landscape
    expect(result.pageSizeMm.height).toBeCloseTo(297, 0);
  });

  describe('Preview functionality', () => {
    it('should generate a lower resolution preview', () => {
      const config: PicMapConfig = {
        title: 'Preview Test',
        layout: {
          pageSize: 'A4',
          orientation: 'landscape',
          borderWidth: 30,
          pictureSpacing: 5,
          margin: { top: 10, right: 10, bottom: 10, left: 10 },
        },
        map: {
          provider: 'openstreetmap',
          zoom: 12,
          center: { latitude: 51.5074, longitude: -0.1278 },
        },
        images: [{ filePath: '/images/test.jpg' }],
        links: [
          {
            imageId: '0',
            location: { latitude: 51.5074, longitude: -0.1278 },
            label: 'A',
          },
        ],
      };

      // Create compositor at high DPI
      const compositor = createCompositorFromLayout(
        config.layout,
        config.pictureBorder,
        config.linkStyle,
        300
      );

      // Get full resolution dimensions
      const fullDims = compositor.getPageDimensionsPixels();

      // Generate preview
      const mapEngine = new MapEngine();
      const renderedMap = mapEngine.renderMap({
        style: config.map,
        width: 400,
        height: 300,
      });

      const preview = compositor.preview(
        {
          map: renderedMap,
          images: config.images,
          links: [{ imageIndex: 0, markerPosition: { x: 200, y: 150 }, label: 'A' }],
        },
        72
      );

      // Preview should be smaller
      expect(preview.width).toBeLessThan(fullDims.width);
      expect(preview.height).toBeLessThan(fullDims.height);
      expect(preview.dpi).toBe(72);

      // Preview should still have valid SVG
      expect(preview.svg).toContain('<svg');
      expect(preview.svg).toContain('</svg>');
    });
  });
});

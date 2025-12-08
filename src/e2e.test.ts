/**
 * End-to-End Tests for Pic-Map
 *
 * These tests verify the complete pipeline from configuration loading
 * through to final output generation, testing with realistic data scenarios.
 */

import { describe, it, expect } from 'vitest';
import { parseConfigFromJSON, normalizeConfig, validateConfigReferences } from './loaders';
import { validatePicMapConfig } from './validators';
import { MapEngine } from './map-engine/engine';
import { PictureBorderEngine } from './picture-border-engine/engine';
import { createCompositorFromLayout } from './compositor/compositor';
import { geoToViewportPixel } from './map-engine/coordinates';
import { ExportEngine } from './export-engine';
import type { PicMapConfig } from './types';

describe('End-to-End Integration Tests', () => {
  /**
   * Sample configuration representing a real-world tourism map
   */
  const sampleConfigJSON = `{
    "title": "London Tourism Map",
    "description": "A map of London showing major tourist attractions with photos",
    "layout": {
      "pageSize": "A4",
      "orientation": "landscape",
      "borderWidth": 60,
      "pictureSpacing": 10,
      "margin": {
        "top": 20,
        "right": 20,
        "bottom": 20,
        "left": 20
      }
    },
    "map": {
      "provider": "openstreetmap",
      "zoom": 12,
      "center": {
        "latitude": 51.5074,
        "longitude": -0.1278,
        "name": "London",
        "description": "Capital of the United Kingdom"
      },
      "showScale": true,
      "showAttribution": true
    },
    "pictureBorder": {
      "backgroundColor": "#ffffff",
      "borderColor": "#333333",
      "borderThickness": 2,
      "cornerRadius": 5
    },
    "linkStyle": {
      "type": "both",
      "lineColor": "#0066cc",
      "lineWidth": 2,
      "lineStyle": "solid",
      "labelStyle": {
        "fontFamily": "Arial",
        "fontSize": 14,
        "color": "#000000"
      }
    },
    "images": [
      {
        "filePath": "/images/big-ben.jpg",
        "caption": "Big Ben and Houses of Parliament",
        "altText": "The iconic clock tower of Westminster",
        "credit": "Photo by John Smith",
        "dimensions": { "width": 1920, "height": 1280 }
      },
      {
        "filePath": "/images/tower-bridge.jpg",
        "caption": "Tower Bridge",
        "altText": "The famous bridge over the River Thames",
        "dimensions": { "width": 1920, "height": 1280 }
      },
      {
        "filePath": "/images/london-eye.jpg",
        "caption": "The London Eye",
        "altText": "Giant observation wheel on the South Bank",
        "dimensions": { "width": 1920, "height": 1280 }
      }
    ],
    "links": [
      {
        "imageId": "0",
        "location": { "latitude": 51.5007, "longitude": -0.1246, "name": "Big Ben" },
        "label": "A"
      },
      {
        "imageId": "1",
        "location": { "latitude": 51.5055, "longitude": -0.0754, "name": "Tower Bridge" },
        "label": "B"
      },
      {
        "imageId": "2",
        "location": { "latitude": 51.5033, "longitude": -0.1195, "name": "London Eye" },
        "label": "C"
      }
    ]
  }`;

  describe('Complete Configuration Workflow', () => {
    it('should parse, validate, and normalize a complete configuration', () => {
      // Step 1: Parse JSON
      const config = parseConfigFromJSON(sampleConfigJSON);

      // Step 2: Validate structure
      const validationResult = validatePicMapConfig(config);
      expect(validationResult.valid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);

      // Step 3: Validate references
      const refErrors = validateConfigReferences(config);
      expect(refErrors).toHaveLength(0);

      // Step 4: Normalize with defaults
      const normalized = normalizeConfig(config);
      expect(normalized.pictureBorder).toBeDefined();
      expect(normalized.linkStyle).toBeDefined();
      expect(normalized.map.showScale).toBe(true);
      expect(normalized.map.showAttribution).toBe(true);
    });

    it('should handle configuration with minimal required fields', () => {
      const minimalConfig = `{
        "title": "Simple Map",
        "layout": {
          "pageSize": "A4",
          "orientation": "portrait",
          "borderWidth": 30,
          "pictureSpacing": 5,
          "margin": { "top": 10, "right": 10, "bottom": 10, "left": 10 }
        },
        "map": {
          "provider": "openstreetmap",
          "zoom": 10,
          "center": { "latitude": 0, "longitude": 0 }
        },
        "images": [],
        "links": []
      }`;

      const config = parseConfigFromJSON(minimalConfig);
      expect(config.title).toBe('Simple Map');

      const normalized = normalizeConfig(config);
      // Defaults should be applied
      expect(normalized.pictureBorder?.backgroundColor).toBe('#ffffff');
      expect(normalized.linkStyle?.type).toBe('label');
    });
  });

  describe('Complete Rendering Pipeline', () => {
    /**
     * Helper function to render a complete pic-map from configuration
     */
    function renderFullPicMap(config: PicMapConfig) {
      // Create compositor
      const compositor = createCompositorFromLayout(
        config.layout,
        config.pictureBorder,
        config.linkStyle,
        72 // Low DPI for testing
      );

      // Get layout to determine map dimensions
      const layout = compositor.createLayout({
        map: { svg: '', width: 0, height: 0, bounds: { north: 0, south: 0, east: 0, west: 0 } },
        images: config.images,
        links: [],
      });

      // Render map with markers
      const mapEngine = new MapEngine();
      const markers = MapEngine.createMarkersFromLinks(config.links);
      const renderedMap = mapEngine.renderMap({
        style: config.map,
        width: layout.mapArea.width,
        height: layout.mapArea.height,
        markers,
      });

      // Calculate marker positions
      const markerPositions = config.links.map((link) => {
        const pixel = geoToViewportPixel(
          link.location,
          config.map.center,
          config.map.zoom,
          layout.mapArea.width,
          layout.mapArea.height
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

    it('should render a complete map with all components', () => {
      const config = parseConfigFromJSON(sampleConfigJSON);
      const result = renderFullPicMap(config);

      // Verify SVG is well-formed
      expect(result.svg).toMatch(/^<svg[^>]*>/);
      expect(result.svg).toMatch(/<\/svg>$/);

      // Verify all major components are present
      expect(result.svg).toContain('class="border-backgrounds"');
      expect(result.svg).toContain('class="map-area"');
      expect(result.svg).toContain('class="pictures"');
      expect(result.svg).toContain('class="link-lines"');
      expect(result.svg).toContain('class="link-labels"');

      // Verify markers are rendered
      expect(result.svg).toContain('class="marker"');

      // Verify labels
      expect(result.svg).toContain('>A<');
      expect(result.svg).toContain('>B<');
      expect(result.svg).toContain('>C<');

      // Verify page dimensions
      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
      expect(result.pageSizeMm.width).toBeCloseTo(297, 0); // A4 landscape
      expect(result.pageSizeMm.height).toBeCloseTo(210, 0);
    });

    it('should render picture border independently', () => {
      const config = parseConfigFromJSON(sampleConfigJSON);
      const borderEngine = new PictureBorderEngine();

      const borderResult = borderEngine.renderBorder({
        layout: config.layout,
        images: config.images,
        style: config.pictureBorder,
        links: config.links.map((l) => ({ imageId: l.imageId, label: l.label })),
        dpi: 72,
      });

      expect(borderResult.svg).toContain('<svg');
      expect(borderResult.svg).toContain('</svg>');
      expect(borderResult.positionedPictures).toHaveLength(3);

      // Each picture should have a slot and position
      for (const pic of borderResult.positionedPictures) {
        expect(pic.slot).toBeDefined();
        expect(pic.centerX).toBeGreaterThan(0);
        expect(pic.centerY).toBeGreaterThan(0);
      }
    });
  });

  describe('Export Pipeline', () => {
    it('should export rendered map to SVG format', () => {
      const config = parseConfigFromJSON(sampleConfigJSON);

      // Render map
      const mapEngine = new MapEngine();
      const mapResult = mapEngine.renderMap({
        style: config.map,
        width: 800,
        height: 600,
        markers: MapEngine.createMarkersFromLinks(config.links),
      });

      // Export to SVG - use explicit page size since export engine doesn't support 'custom' string
      const exportEngine = new ExportEngine();
      const pageSize =
        config.layout.pageSize === 'custom' && config.layout.customDimensions
          ? config.layout.customDimensions
          : (config.layout.pageSize as 'A4' | 'Letter' | 'A3' | 'Legal');
      const exportResult = exportEngine.exportToSvg(
        {
          svg: mapResult.svg,
          width: mapResult.width,
          height: mapResult.height,
        },
        {
          pageSize,
          orientation: config.layout.orientation,
          title: config.title,
          author: 'Pic-Map E2E Test',
        }
      );

      // Verify export
      expect(exportResult.format).toBe('svg');
      expect(typeof exportResult.data).toBe('string');
      expect(exportResult.data).toContain('xmlns="http://www.w3.org/2000/svg"');
      expect(exportResult.data).toContain(`<title>${config.title}</title>`);
      expect(exportResult.widthMm).toBe(297); // A4 landscape
      expect(exportResult.heightMm).toBe(210);
    });

    it('should export rendered map to PDF format', async () => {
      const config = parseConfigFromJSON(sampleConfigJSON);

      // Render map
      const mapEngine = new MapEngine();
      const mapResult = mapEngine.renderMap({
        style: config.map,
        width: 800,
        height: 600,
        markers: MapEngine.createMarkersFromLinks(config.links),
      });

      // Export to PDF - use explicit page size since export engine doesn't support 'custom' string
      const exportEngine = new ExportEngine();
      const pageSize =
        config.layout.pageSize === 'custom' && config.layout.customDimensions
          ? config.layout.customDimensions
          : (config.layout.pageSize as 'A4' | 'Letter' | 'A3' | 'Legal');
      const exportResult = await exportEngine.exportToPdf(
        {
          svg: mapResult.svg,
          width: mapResult.width,
          height: mapResult.height,
        },
        {
          pageSize,
          orientation: config.layout.orientation,
          title: config.title,
          author: 'Pic-Map E2E Test',
          dpi: 150,
        }
      );

      // Verify export
      expect(exportResult.format).toBe('pdf');
      expect(Buffer.isBuffer(exportResult.data)).toBe(true);

      // Check PDF header
      const pdfHeader = (exportResult.data as Buffer).subarray(0, 4).toString('utf-8');
      expect(pdfHeader).toBe('%PDF');

      // Verify dimensions
      expect(exportResult.widthMm).toBe(297); // A4 landscape
      expect(exportResult.heightMm).toBe(210);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle a travel itinerary with multiple stops', () => {
      const config: PicMapConfig = {
        title: 'European Trip Itinerary',
        description: 'Our 10-day European adventure',
        layout: {
          pageSize: 'A3',
          orientation: 'landscape',
          borderWidth: 50,
          pictureSpacing: 8,
          margin: { top: 15, right: 15, bottom: 15, left: 15 },
        },
        map: {
          provider: 'openstreetmap',
          zoom: 5,
          center: { latitude: 48.5, longitude: 8.5 },
          showScale: true,
          showAttribution: true,
        },
        images: [
          { filePath: '/photos/paris-eiffel.jpg', caption: 'Eiffel Tower' },
          { filePath: '/photos/paris-louvre.jpg', caption: 'Louvre Museum' },
          { filePath: '/photos/amsterdam-canal.jpg', caption: 'Amsterdam Canals' },
          { filePath: '/photos/berlin-gate.jpg', caption: 'Brandenburg Gate' },
          { filePath: '/photos/prague-bridge.jpg', caption: 'Charles Bridge' },
          { filePath: '/photos/vienna-schonbrunn.jpg', caption: 'Schönbrunn Palace' },
          { filePath: '/photos/munich-marienplatz.jpg', caption: 'Marienplatz' },
          { filePath: '/photos/zurich-lake.jpg', caption: 'Lake Zurich' },
        ],
        links: [
          { imageId: '0', location: { latitude: 48.8584, longitude: 2.2945 }, label: '1' },
          { imageId: '1', location: { latitude: 48.8606, longitude: 2.3376 }, label: '2' },
          { imageId: '2', location: { latitude: 52.3676, longitude: 4.9041 }, label: '3' },
          { imageId: '3', location: { latitude: 52.5163, longitude: 13.3777 }, label: '4' },
          { imageId: '4', location: { latitude: 50.0865, longitude: 14.4114 }, label: '5' },
          { imageId: '5', location: { latitude: 48.1845, longitude: 16.3122 }, label: '6' },
          { imageId: '6', location: { latitude: 48.1374, longitude: 11.5755 }, label: '7' },
          { imageId: '7', location: { latitude: 47.3769, longitude: 8.5417 }, label: '8' },
        ],
        linkStyle: { type: 'both', lineColor: '#e74c3c', lineWidth: 2, lineStyle: 'dashed' },
      };

      const compositor = createCompositorFromLayout(config.layout, config.pictureBorder, config.linkStyle, 72);
      const layout = compositor.createLayout({
        map: { svg: '', width: 0, height: 0, bounds: { north: 0, south: 0, east: 0, west: 0 } },
        images: config.images,
        links: [],
      });

      // Verify all 8 pictures fit in the border
      expect(layout.pictures.length).toBe(8);

      // Render map
      const mapEngine = new MapEngine();
      const mapResult = mapEngine.renderMap({
        style: config.map,
        width: layout.mapArea.width,
        height: layout.mapArea.height,
        markers: MapEngine.createMarkersFromLinks(config.links),
      });

      // All markers should be rendered
      const markerMatches = mapResult.svg.match(/class="marker"/g) || [];
      expect(markerMatches.length).toBe(8);
    });

    it('should handle a business directory map', () => {
      const config: PicMapConfig = {
        title: 'Downtown Business Directory',
        description: 'Local businesses in the city center',
        layout: {
          pageSize: 'Letter',
          orientation: 'portrait',
          borderWidth: 45,
          pictureSpacing: 6,
          margin: { top: 12, right: 12, bottom: 12, left: 12 },
        },
        map: {
          provider: 'openstreetmap',
          zoom: 16,
          center: { latitude: 40.7580, longitude: -73.9855 },
          showScale: true,
          showAttribution: true,
        },
        images: [
          { filePath: '/ads/coffee-shop.jpg', caption: "Joe's Coffee" },
          { filePath: '/ads/bookstore.jpg', caption: 'Book Haven' },
          { filePath: '/ads/restaurant.jpg', caption: 'Fine Dining' },
          { filePath: '/ads/boutique.jpg', caption: 'Fashion Forward' },
        ],
        links: [
          { imageId: '0', location: { latitude: 40.7585, longitude: -73.9852 }, label: 'A' },
          { imageId: '1', location: { latitude: 40.7578, longitude: -73.9860 }, label: 'B' },
          { imageId: '2', location: { latitude: 40.7575, longitude: -73.9848 }, label: 'C' },
          { imageId: '3', location: { latitude: 40.7582, longitude: -73.9862 }, label: 'D' },
        ],
        pictureBorder: {
          backgroundColor: '#f5f5f5',
          borderColor: '#2c3e50',
          borderThickness: 3,
          cornerRadius: 8,
        },
        linkStyle: { type: 'label', labelStyle: { fontSize: 16, color: '#2c3e50' } },
      };

      const validationResult = validatePicMapConfig(config);
      expect(validationResult.valid).toBe(true);

      const normalized = normalizeConfig(config);
      expect(normalized.linkStyle?.type).toBe('label');
    });

    it('should handle a single-image map', () => {
      const config: PicMapConfig = {
        title: 'My Special Place',
        layout: {
          pageSize: 'A4',
          orientation: 'portrait',
          borderWidth: 80,
          pictureSpacing: 0,
          margin: { top: 25, right: 25, bottom: 25, left: 25 },
        },
        map: {
          provider: 'openstreetmap',
          zoom: 18,
          center: { latitude: 51.5014, longitude: -0.1419 },
        },
        images: [{ filePath: '/my-photo.jpg', caption: 'Where we met', dimensions: { width: 4000, height: 3000 } }],
        links: [{ imageId: '0', location: { latitude: 51.5014, longitude: -0.1419 }, label: '♥' }],
        linkStyle: { type: 'both', lineColor: '#ff1493' },
      };

      // Use link labels for composition
      const linkLabels = config.links.map((l) => ({
        imageIndex: parseInt(l.imageId, 10),
        markerPosition: { x: 0, y: 0 },
        label: l.label,
      }));

      const compositor = createCompositorFromLayout(config.layout, config.pictureBorder, config.linkStyle, 150);
      const layout = compositor.createLayout({
        map: { svg: '', width: 0, height: 0, bounds: { north: 0, south: 0, east: 0, west: 0 } },
        images: config.images,
        links: linkLabels,
      });

      expect(layout.pictures.length).toBe(1);
      expect(layout.pictures[0].label).toBe('♥');
    });
  });

  describe('Error Handling', () => {
    it('should reject invalid JSON', () => {
      expect(() => parseConfigFromJSON('invalid json')).toThrow();
    });

    it('should reject configuration with missing required fields', () => {
      const invalidConfig = `{
        "title": "Missing Layout",
        "map": { "provider": "openstreetmap", "zoom": 10, "center": { "latitude": 0, "longitude": 0 } },
        "images": [],
        "links": []
      }`;

      expect(() => parseConfigFromJSON(invalidConfig)).toThrow();
    });

    it('should reject configuration with invalid coordinates', () => {
      const invalidConfig = `{
        "title": "Invalid Coords",
        "layout": {
          "pageSize": "A4",
          "orientation": "portrait",
          "borderWidth": 30,
          "pictureSpacing": 5,
          "margin": { "top": 10, "right": 10, "bottom": 10, "left": 10 }
        },
        "map": {
          "provider": "openstreetmap",
          "zoom": 10,
          "center": { "latitude": 100, "longitude": 0 }
        },
        "images": [],
        "links": []
      }`;

      expect(() => parseConfigFromJSON(invalidConfig)).toThrow();
    });

    it('should detect invalid image references in links', () => {
      const config: PicMapConfig = {
        title: 'Bad References',
        layout: {
          pageSize: 'A4',
          orientation: 'portrait',
          borderWidth: 30,
          pictureSpacing: 5,
          margin: { top: 10, right: 10, bottom: 10, left: 10 },
        },
        map: {
          provider: 'openstreetmap',
          zoom: 10,
          center: { latitude: 0, longitude: 0 },
        },
        images: [{ filePath: '/image.jpg' }],
        links: [
          { imageId: '0', location: { latitude: 0, longitude: 0 } },
          { imageId: '5', location: { latitude: 1, longitude: 1 } }, // Invalid - image 5 doesn't exist
        ],
      };

      const errors = validateConfigReferences(config);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.includes('5'))).toBe(true);
    });
  });
});

describe('Print Output Validation', () => {
  describe('SVG Structure Validation', () => {
    it('should produce valid SVG with proper namespace', () => {
      const mapEngine = new MapEngine();
      const result = mapEngine.renderMap({
        style: {
          provider: 'openstreetmap',
          zoom: 12,
          center: { latitude: 51.5074, longitude: -0.1278 },
          showScale: true,
          showAttribution: true,
        },
        width: 800,
        height: 600,
      });

      // Check SVG namespace
      expect(result.svg).toContain('xmlns="http://www.w3.org/2000/svg"');

      // Check that there's exactly one opening and closing SVG tag
      const openTags = result.svg.match(/<svg[^>]*>/g) || [];
      const closeTags = result.svg.match(/<\/svg>/g) || [];
      expect(openTags.length).toBe(1);
      expect(closeTags.length).toBe(1);
    });

    it('should escape special characters in text elements', () => {
      const mapEngine = new MapEngine();
      const result = mapEngine.renderMap({
        style: {
          provider: 'openstreetmap',
          zoom: 12,
          center: { latitude: 51.5074, longitude: -0.1278 },
        },
        width: 400,
        height: 300,
        markers: [
          {
            location: { latitude: 51.5074, longitude: -0.1278 },
            label: 'Test <script> & "quotes"',
          },
        ],
      });

      // Special characters should be escaped - prevents XSS
      expect(result.svg).not.toContain('<script>');
      expect(result.svg).toContain('&lt;script&gt;');
      expect(result.svg).toContain('&amp;');
      expect(result.svg).toContain('&quot;');

      // Verify the raw malicious content is not present anywhere
      expect(result.svg).not.toMatch(/<script[^>]*>/i);
      expect(result.svg).not.toMatch(/<\/script>/i);

      // Verify the label is properly contained within text element
      expect(result.svg).toMatch(/<text[^>]*>.*&lt;script&gt;.*<\/text>/);
    });

    it('should sanitize various XSS attack vectors in text elements', () => {
      const mapEngine = new MapEngine();

      // Test various XSS attack vectors
      const xssVectors = [
        '<script>alert("xss")</script>',
        '<img src=x onerror=alert("xss")>',
        'javascript:alert("xss")',
        '<svg onload=alert("xss")>',
        '"><script>alert("xss")</script>',
      ];

      for (const vector of xssVectors) {
        const result = mapEngine.renderMap({
          style: {
            provider: 'openstreetmap',
            zoom: 12,
            center: { latitude: 51.5074, longitude: -0.1278 },
          },
          width: 400,
          height: 300,
          markers: [
            {
              location: { latitude: 51.5074, longitude: -0.1278 },
              label: vector,
            },
          ],
        });

        // Should never contain raw (unescaped) script tags
        // The regex looks for actual script tags, not escaped ones like &lt;script&gt;
        expect(result.svg).not.toMatch(/<script[^>]*>/i);
        expect(result.svg).not.toMatch(/<\/script>/i);

        // Verify dangerous characters are properly escaped
        if (vector.includes('<')) {
          expect(result.svg).toContain('&lt;');
        }
        if (vector.includes('>')) {
          expect(result.svg).toContain('&gt;');
        }
        if (vector.includes('"')) {
          expect(result.svg).toContain('&quot;');
        }
      }
    });

    it('should use valid color values in SVG elements', () => {
      const mapEngine = new MapEngine();
      const result = mapEngine.renderMap({
        style: {
          provider: 'openstreetmap',
          zoom: 12,
          center: { latitude: 51.5074, longitude: -0.1278 },
        },
        width: 400,
        height: 300,
        markers: [
          {
            location: { latitude: 51.5074, longitude: -0.1278 },
            style: { color: '#ff0000', size: 20, shape: 'circle' },
          },
        ],
        backgroundColor: '#ffffff',
      });

      // All fill and stroke attributes should have valid color values
      const fillMatches = result.svg.match(/fill="([^"]*)"/g) || [];
      const strokeMatches = result.svg.match(/stroke="([^"]*)"/g) || [];

      for (const match of [...fillMatches, ...strokeMatches]) {
        const color = match.match(/"([^"]*)"/)?.[1];
        if (color && color !== 'none') {
          // Should be a hex color, named color, or rgb/rgba value
          expect(color).toMatch(/^(#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})|[a-zA-Z]+|rgb\([^)]+\)|rgba\([^)]+\))$/);
        }
      }
    });
  });

  describe('PDF Output Validation', () => {
    it('should produce valid PDF header', async () => {
      const mapEngine = new MapEngine();
      const mapResult = mapEngine.renderMap({
        style: {
          provider: 'openstreetmap',
          zoom: 12,
          center: { latitude: 51.5074, longitude: -0.1278 },
        },
        width: 400,
        height: 300,
      });

      const exportEngine = new ExportEngine();
      const pdfResult = await exportEngine.exportToPdf({
        svg: mapResult.svg,
        width: mapResult.width,
        height: mapResult.height,
      });

      // Verify PDF magic bytes
      const buffer = pdfResult.data as Buffer;
      expect(buffer[0]).toBe(0x25); // %
      expect(buffer[1]).toBe(0x50); // P
      expect(buffer[2]).toBe(0x44); // D
      expect(buffer[3]).toBe(0x46); // F
    });

    it('should produce PDF with correct page size', async () => {
      const mapEngine = new MapEngine();
      const mapResult = mapEngine.renderMap({
        style: {
          provider: 'openstreetmap',
          zoom: 12,
          center: { latitude: 51.5074, longitude: -0.1278 },
        },
        width: 800,
        height: 600,
      });

      const exportEngine = new ExportEngine();

      // Test A4 landscape
      const a4Landscape = await exportEngine.exportToPdf(
        { svg: mapResult.svg, width: mapResult.width, height: mapResult.height },
        { pageSize: 'A4', orientation: 'landscape' }
      );
      expect(a4Landscape.widthMm).toBe(297);
      expect(a4Landscape.heightMm).toBe(210);

      // Test A4 portrait
      const a4Portrait = await exportEngine.exportToPdf(
        { svg: mapResult.svg, width: mapResult.width, height: mapResult.height },
        { pageSize: 'A4', orientation: 'portrait' }
      );
      expect(a4Portrait.widthMm).toBe(210);
      expect(a4Portrait.heightMm).toBe(297);

      // Test Letter
      const letter = await exportEngine.exportToPdf(
        { svg: mapResult.svg, width: mapResult.width, height: mapResult.height },
        { pageSize: 'Letter', orientation: 'portrait' }
      );
      expect(letter.widthMm).toBeCloseTo(215.9, 0);
      expect(letter.heightMm).toBeCloseTo(279.4, 0);
    });
  });

  describe('Coordinate System Validation', () => {
    it('should correctly convert geographic coordinates to pixel positions', () => {
      const center = { latitude: 0, longitude: 0 };
      const zoom = 10;
      const width = 512;
      const height = 512;

      // Test center point - should be at center of viewport
      const centerPixel = geoToViewportPixel(center, center, zoom, width, height);
      expect(centerPixel.x).toBeCloseTo(width / 2, 0);
      expect(centerPixel.y).toBeCloseTo(height / 2, 0);

      // Test point east of center - should have larger x
      const eastPoint = { latitude: 0, longitude: 0.01 };
      const eastPixel = geoToViewportPixel(eastPoint, center, zoom, width, height);
      expect(eastPixel.x).toBeGreaterThan(centerPixel.x);

      // Test point north of center - should have smaller y (SVG y increases downward)
      const northPoint = { latitude: 0.01, longitude: 0 };
      const northPixel = geoToViewportPixel(northPoint, center, zoom, width, height);
      expect(northPixel.y).toBeLessThan(centerPixel.y);
    });

    it('should handle extreme latitude values correctly', () => {
      const center = { latitude: 80, longitude: 0 };
      const zoom = 5;
      const width = 512;
      const height = 512;

      // This should not throw
      const result = geoToViewportPixel(center, center, zoom, width, height);
      expect(result.x).toBe(width / 2);
      expect(result.y).toBe(height / 2);
    });
  });
});

describe('Performance Validation', () => {
  it('should render a map with many markers efficiently', () => {
    const mapEngine = new MapEngine();

    // Generate 100 markers
    const markers = Array.from({ length: 100 }, (_, i) => ({
      location: {
        latitude: 51.5 + (i % 10) * 0.01,
        longitude: -0.1 + Math.floor(i / 10) * 0.01,
      },
      label: `M${i}`,
      style: { color: '#e74c3c', size: 10, shape: 'circle' as const },
    }));

    const startTime = Date.now();

    const result = mapEngine.renderMap({
      style: {
        provider: 'openstreetmap',
        zoom: 13,
        center: { latitude: 51.55, longitude: -0.05 },
      },
      width: 1200,
      height: 800,
      markers,
    });

    const elapsed = Date.now() - startTime;

    // Should complete in reasonable time (threshold increased for CI stability)
    expect(elapsed).toBeLessThan(5000);

    // All markers should be rendered
    const markerMatches = result.svg.match(/class="marker"/g) || [];
    expect(markerMatches.length).toBe(100);
  });

  it('should handle large SVG export efficiently', () => {
    const mapEngine = new MapEngine();
    const exportEngine = new ExportEngine();

    // Render at high resolution
    const mapResult = mapEngine.renderMap({
      style: {
        provider: 'openstreetmap',
        zoom: 12,
        center: { latitude: 51.5074, longitude: -0.1278 },
        showScale: true,
        showAttribution: true,
      },
      width: 3508, // A4 at 300 DPI
      height: 2480,
    });

    const startTime = Date.now();

    const result = exportEngine.exportToSvg(
      {
        svg: mapResult.svg,
        width: mapResult.width,
        height: mapResult.height,
      },
      { pageSize: 'A4', orientation: 'landscape', dpi: 300 }
    );

    const elapsed = Date.now() - startTime;

    // Should complete in reasonable time (threshold increased for CI stability)
    expect(elapsed).toBeLessThan(2000);
    expect(result.format).toBe('svg');
  });

  it('should handle picture border layout with many images efficiently', () => {
    const borderEngine = new PictureBorderEngine();

    // Generate 20 images
    const images = Array.from({ length: 20 }, (_, i) => ({
      filePath: `/images/photo${i}.jpg`,
      caption: `Photo ${i}`,
      dimensions: { width: 1920, height: 1280 },
    }));

    const startTime = Date.now();

    const result = borderEngine.renderBorder({
      layout: {
        pageSize: 'A3',
        orientation: 'landscape',
        borderWidth: 60,
        pictureSpacing: 8,
        margin: { top: 15, right: 15, bottom: 15, left: 15 },
      },
      images,
      dpi: 150,
    });

    const elapsed = Date.now() - startTime;

    // Should complete in reasonable time (threshold increased for CI stability)
    expect(elapsed).toBeLessThan(2000);
    expect(result.positionedPictures.length).toBe(20);
  });
});

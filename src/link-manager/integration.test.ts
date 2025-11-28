import { describe, it, expect } from 'vitest';
import { LinkManager, PicturePosition, LinkRenderConfig } from './link-manager';
import { MapEngine } from '../map-engine';
import type { PicMapConfig, ImageLocationLink, MapStyle } from '../types';

describe('LinkManager Integration', () => {
  describe('with MapEngine', () => {
    const defaultMapStyle: MapStyle = {
      provider: 'openstreetmap',
      zoom: 12,
      center: { latitude: 51.5074, longitude: -0.1278 },
      showScale: true,
      showAttribution: true,
    };

    it('should render links that align with map markers', () => {
      const engine = new MapEngine();
      const linkManager = new LinkManager();

      // Create a configuration with images and links
      const config: PicMapConfig = {
        title: 'Integration Test Map',
        layout: {
          pageSize: 'A4',
          orientation: 'landscape',
          borderWidth: 60,
          pictureSpacing: 10,
          margin: { top: 20, right: 20, bottom: 20, left: 20 },
        },
        map: defaultMapStyle,
        linkStyle: {
          type: 'both',
          lineColor: '#0066cc',
          lineWidth: 2,
          lineStyle: 'solid',
        },
        images: [
          { filePath: '/images/img1.jpg' },
          { filePath: '/images/img2.jpg' },
          { filePath: '/images/img3.jpg' },
        ],
        links: [
          {
            imageId: '0',
            location: { latitude: 51.5074, longitude: -0.1278 },
            label: 'A',
          },
          {
            imageId: '1',
            location: { latitude: 51.51, longitude: -0.13 },
            label: 'B',
          },
          {
            imageId: '2',
            location: { latitude: 51.505, longitude: -0.12 },
            label: 'C',
          },
        ],
      };

      // Render the map
      const markers = MapEngine.createMarkersFromLinks(config.links);
      const mapResult = engine.renderMap({
        style: config.map,
        width: 800,
        height: 600,
        markers,
      });

      // Create picture positions for the border
      const picturePositions = LinkManager.createPicturePositions(config.images.length, {
        totalWidth: 920,
        totalHeight: 720,
        borderWidth: 60,
        mapOffsetX: 60,
        mapOffsetY: 60,
        mapWidth: 800,
        mapHeight: 600,
      });

      // Render links
      const linkConfig: LinkRenderConfig = {
        style: config.linkStyle!,
        mapStyle: config.map,
        mapViewport: {
          width: 800,
          height: 600,
          offsetX: 60,
          offsetY: 60,
        },
      };

      const linkResult = linkManager.renderAllLinks(
        config.links,
        picturePositions,
        linkConfig
      );

      // Verify map was rendered with markers
      expect(mapResult.svg).toContain('<svg');
      expect(mapResult.svg).toContain('class="marker"');
      expect(mapResult.svg).toContain('>A<');
      expect(mapResult.svg).toContain('>B<');
      expect(mapResult.svg).toContain('>C<');

      // Verify links were rendered
      expect(linkResult.svg).toContain('<g class="links">');
      expect(linkResult.svg).toContain('<g class="link-lines">');
      expect(linkResult.svg).toContain('<g class="link-labels">');
      expect(linkResult.linkCount).toBe(3);
    });

    it('should handle multiple pictures at the same location', () => {
      const linkManager = new LinkManager();
      const sameLocation = { latitude: 51.5074, longitude: -0.1278 };

      const links: ImageLocationLink[] = [
        { imageId: '0', location: sameLocation, label: 'A' },
        { imageId: '1', location: sameLocation, label: 'B' },
      ];

      const positions: PicturePosition[] = [
        {
          imageId: '0',
          center: { x: 50, y: 30 },
          connectionPoint: { x: 50, y: 60 },
        },
        {
          imageId: '1',
          center: { x: 150, y: 30 },
          connectionPoint: { x: 150, y: 60 },
        },
      ];

      const linkConfig: LinkRenderConfig = {
        style: { type: 'line', lineColor: '#ff0000' },
        mapStyle: defaultMapStyle,
        mapViewport: {
          width: 800,
          height: 600,
          offsetX: 60,
          offsetY: 60,
        },
      };

      const result = linkManager.renderAllLinks(links, positions, linkConfig);

      // Should render both lines
      expect(result.svg).toContain('data-image-id="0"');
      expect(result.svg).toContain('data-image-id="1"');

      // Should warn about multiple pictures at same location
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('2 pictures');
    });

    it('should create a complete composition SVG', () => {
      const engine = new MapEngine();
      const linkManager = new LinkManager();

      // Render map
      const mapResult = engine.renderMap({
        style: defaultMapStyle,
        width: 800,
        height: 600,
        markers: [
          { location: { latitude: 51.5074, longitude: -0.1278 }, label: 'A' },
          { location: { latitude: 51.51, longitude: -0.13 }, label: 'B' },
        ],
      });

      // Create picture positions
      const positions: PicturePosition[] = [
        {
          imageId: '0',
          center: { x: 50, y: 30 },
          connectionPoint: { x: 50, y: 60 },
          label: 'A',
        },
        {
          imageId: '1',
          center: { x: 150, y: 30 },
          connectionPoint: { x: 150, y: 60 },
          label: 'B',
        },
      ];

      const links: ImageLocationLink[] = [
        {
          imageId: '0',
          location: { latitude: 51.5074, longitude: -0.1278 },
          label: 'A',
        },
        {
          imageId: '1',
          location: { latitude: 51.51, longitude: -0.13 },
          label: 'B',
        },
      ];

      const linkConfig: LinkRenderConfig = {
        style: { type: 'both', lineColor: '#0066cc', lineWidth: 2 },
        mapStyle: defaultMapStyle,
        mapViewport: {
          width: 800,
          height: 600,
          offsetX: 60,
          offsetY: 60,
        },
      };

      const linkResult = linkManager.renderAllLinks(links, positions, linkConfig);

      // Combine into a complete composition (simplified)
      const compositeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="920" height="720">
        <g id="map" transform="translate(60, 60)">
          ${mapResult.svg.replace(/<\/?svg[^>]*>/g, '')}
        </g>
        ${linkResult.svg}
      </svg>`;

      // Verify the composition has all expected elements
      expect(compositeSvg).toContain('<svg');
      expect(compositeSvg).toContain('</svg>');
      expect(compositeSvg).toContain('id="map"');
      expect(compositeSvg).toContain('class="links"');
      expect(compositeSvg).toContain('class="marker"');
    });
  });

  describe('with different link styles', () => {
    const defaultMapStyle: MapStyle = {
      provider: 'openstreetmap',
      zoom: 12,
      center: { latitude: 51.5074, longitude: -0.1278 },
    };

    const positions: PicturePosition[] = [
      {
        imageId: '0',
        center: { x: 50, y: 30 },
        connectionPoint: { x: 50, y: 60 },
      },
    ];

    const links: ImageLocationLink[] = [
      {
        imageId: '0',
        location: { latitude: 51.5074, longitude: -0.1278 },
        label: 'A',
      },
    ];

    it('should render dashed lines', () => {
      const linkManager = new LinkManager();
      const config: LinkRenderConfig = {
        style: { type: 'line', lineStyle: 'dashed' },
        mapStyle: defaultMapStyle,
        mapViewport: { width: 800, height: 600, offsetX: 60, offsetY: 60 },
      };

      const result = linkManager.renderAllLinks(links, positions, config);
      expect(result.svg).toContain('stroke-dasharray="8,4"');
    });

    it('should render dotted lines', () => {
      const linkManager = new LinkManager();
      const config: LinkRenderConfig = {
        style: { type: 'line', lineStyle: 'dotted' },
        mapStyle: defaultMapStyle,
        mapViewport: { width: 800, height: 600, offsetX: 60, offsetY: 60 },
      };

      const result = linkManager.renderAllLinks(links, positions, config);
      expect(result.svg).toContain('stroke-dasharray="2,2"');
    });

    it('should render labels only without lines', () => {
      const linkManager = new LinkManager();
      const config: LinkRenderConfig = {
        style: { type: 'label' },
        mapStyle: defaultMapStyle,
        mapViewport: { width: 800, height: 600, offsetX: 60, offsetY: 60 },
      };

      const result = linkManager.renderAllLinks(links, positions, config);
      expect(result.svg).not.toContain('<line');
      expect(result.svg).toContain('link-label');
    });

    it('should render nothing when type is none', () => {
      const linkManager = new LinkManager();
      const config: LinkRenderConfig = {
        style: { type: 'none' },
        mapStyle: defaultMapStyle,
        mapViewport: { width: 800, height: 600, offsetX: 60, offsetY: 60 },
      };

      const result = linkManager.renderAllLinks(links, positions, config);
      expect(result.svg).toBe('');
      expect(result.linkCount).toBe(0);
    });
  });

  describe('picture position generation', () => {
    it('should place pictures evenly around a border', () => {
      const positions = LinkManager.createPicturePositions(8, {
        totalWidth: 1000,
        totalHeight: 800,
        borderWidth: 60,
        mapOffsetX: 60,
        mapOffsetY: 60,
        mapWidth: 880,
        mapHeight: 680,
      });

      // Should have 8 positions
      expect(positions).toHaveLength(8);

      // First few should be on top edge (y near 30)
      const topPositions = positions.filter((p) => p.center.y < 100);
      expect(topPositions.length).toBeGreaterThan(0);

      // Some should be on right edge (x near 970)
      const rightPositions = positions.filter((p) => p.center.x > 900);
      expect(rightPositions.length).toBeGreaterThan(0);

      // All should have labels
      positions.forEach((p, i) => {
        expect(p.label).toBe(String.fromCharCode(65 + i));
      });
    });

    it('should handle odd numbers of pictures', () => {
      const positions = LinkManager.createPicturePositions(5, {
        totalWidth: 1000,
        totalHeight: 800,
        borderWidth: 60,
        mapOffsetX: 60,
        mapOffsetY: 60,
        mapWidth: 880,
        mapHeight: 680,
      });

      expect(positions).toHaveLength(5);
      expect(positions[0].imageId).toBe('0');
      expect(positions[4].imageId).toBe('4');
    });

    it('should handle single picture', () => {
      const positions = LinkManager.createPicturePositions(1, {
        totalWidth: 1000,
        totalHeight: 800,
        borderWidth: 60,
        mapOffsetX: 60,
        mapOffsetY: 60,
        mapWidth: 880,
        mapHeight: 680,
      });

      expect(positions).toHaveLength(1);
      expect(positions[0].imageId).toBe('0');
      expect(positions[0].label).toBe('A');
    });
  });

  describe('link validation', () => {
    it('should validate all links have matching positions', () => {
      const links: ImageLocationLink[] = [
        { imageId: '0', location: { latitude: 51.5, longitude: -0.1 } },
        { imageId: '1', location: { latitude: 51.5, longitude: -0.1 } },
      ];

      const positions: PicturePosition[] = [
        { imageId: '0', center: { x: 50, y: 30 }, connectionPoint: { x: 50, y: 60 } },
        { imageId: '1', center: { x: 150, y: 30 }, connectionPoint: { x: 150, y: 60 } },
      ];

      const errors = LinkManager.validateLinks(links, positions);
      expect(errors).toHaveLength(0);
    });

    it('should report errors for missing position references', () => {
      const links: ImageLocationLink[] = [
        { imageId: '0', location: { latitude: 51.5, longitude: -0.1 } },
        { imageId: '99', location: { latitude: 51.5, longitude: -0.1 } },
      ];

      const positions: PicturePosition[] = [
        { imageId: '0', center: { x: 50, y: 30 }, connectionPoint: { x: 50, y: 60 } },
      ];

      const errors = LinkManager.validateLinks(links, positions);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('99');
    });
  });
});

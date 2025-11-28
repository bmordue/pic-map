import { describe, it, expect } from 'vitest';
import {
  LinkManager,
  PicturePosition,
  ResolvedLink,
  LinkRenderConfig,
} from './link-manager';
import type { ImageLocationLink, MapStyle } from '../types';

describe('LinkManager', () => {
  // Test fixtures
  const defaultMapStyle: MapStyle = {
    provider: 'openstreetmap',
    zoom: 12,
    center: { latitude: 51.5074, longitude: -0.1278 },
    showScale: true,
    showAttribution: true,
  };

  const defaultLinkRenderConfig: LinkRenderConfig = {
    style: {
      type: 'both',
      lineColor: '#0066cc',
      lineWidth: 2,
      lineStyle: 'solid',
      labelStyle: {
        fontFamily: 'Arial',
        fontSize: 12,
        color: '#000000',
      },
    },
    mapStyle: defaultMapStyle,
    mapViewport: {
      width: 800,
      height: 600,
      offsetX: 60,
      offsetY: 60,
    },
  };

  const createSampleLinks = (): ImageLocationLink[] => [
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

  const createSamplePicturePositions = (): PicturePosition[] => [
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

  describe('resolveLinks', () => {
    it('should resolve links with matching picture positions', () => {
      const manager = new LinkManager();
      const links = createSampleLinks();
      const positions = createSamplePicturePositions();

      const resolved = manager.resolveLinks(links, positions, defaultLinkRenderConfig);

      expect(resolved).toHaveLength(2);
      expect(resolved[0].link.imageId).toBe('0');
      expect(resolved[0].picturePosition.imageId).toBe('0');
      expect(resolved[0].label).toBe('A');
      expect(resolved[1].link.imageId).toBe('1');
      expect(resolved[1].label).toBe('B');
    });

    it('should skip links without matching picture positions', () => {
      const manager = new LinkManager();
      const links: ImageLocationLink[] = [
        {
          imageId: '0',
          location: { latitude: 51.5074, longitude: -0.1278 },
          label: 'A',
        },
        {
          imageId: '99', // No matching position
          location: { latitude: 51.51, longitude: -0.13 },
          label: 'B',
        },
      ];
      const positions: PicturePosition[] = [
        {
          imageId: '0',
          center: { x: 50, y: 30 },
          connectionPoint: { x: 50, y: 60 },
        },
      ];

      const resolved = manager.resolveLinks(links, positions, defaultLinkRenderConfig);

      expect(resolved).toHaveLength(1);
      expect(resolved[0].link.imageId).toBe('0');
    });

    it('should auto-generate labels when not provided', () => {
      const manager = new LinkManager();
      const links: ImageLocationLink[] = [
        {
          imageId: '0',
          location: { latitude: 51.5074, longitude: -0.1278 },
          // No label provided
        },
        {
          imageId: '1',
          location: { latitude: 51.51, longitude: -0.13 },
          // No label provided
        },
      ];
      const positions: PicturePosition[] = [
        {
          imageId: '0',
          center: { x: 50, y: 30 },
          connectionPoint: { x: 50, y: 60 },
          // No label
        },
        {
          imageId: '1',
          center: { x: 150, y: 30 },
          connectionPoint: { x: 150, y: 60 },
          // No label
        },
      ];

      const resolved = manager.resolveLinks(links, positions, defaultLinkRenderConfig);

      expect(resolved).toHaveLength(2);
      expect(resolved[0].label).toBe('A');
      expect(resolved[1].label).toBe('B');
    });

    it('should use picture position label when link label is not provided', () => {
      const manager = new LinkManager();
      const links: ImageLocationLink[] = [
        {
          imageId: '0',
          location: { latitude: 51.5074, longitude: -0.1278 },
          // No label
        },
      ];
      const positions: PicturePosition[] = [
        {
          imageId: '0',
          center: { x: 50, y: 30 },
          connectionPoint: { x: 50, y: 60 },
          label: 'PictureLabel',
        },
      ];

      const resolved = manager.resolveLinks(links, positions, defaultLinkRenderConfig);

      expect(resolved[0].label).toBe('PictureLabel');
    });

    it('should calculate marker position with map viewport offset', () => {
      const manager = new LinkManager();
      const links = createSampleLinks();
      const positions = createSamplePicturePositions();

      const resolved = manager.resolveLinks(links, positions, defaultLinkRenderConfig);

      // Marker position should include the viewport offset
      expect(resolved[0].markerPosition.x).toBeGreaterThan(defaultLinkRenderConfig.mapViewport.offsetX);
      expect(resolved[0].markerPosition.y).toBeGreaterThan(defaultLinkRenderConfig.mapViewport.offsetY);
    });
  });

  describe('groupLinksByLocation', () => {
    it('should group links at the same location', () => {
      const manager = new LinkManager();
      const sameLocation = { latitude: 51.5074, longitude: -0.1278 };

      const resolvedLinks: ResolvedLink[] = [
        {
          link: { imageId: '0', location: sameLocation, label: 'A' },
          picturePosition: {
            imageId: '0',
            center: { x: 50, y: 30 },
            connectionPoint: { x: 50, y: 60 },
          },
          markerPosition: { x: 400, y: 300 },
          label: 'A',
        },
        {
          link: { imageId: '1', location: sameLocation, label: 'B' },
          picturePosition: {
            imageId: '1',
            center: { x: 150, y: 30 },
            connectionPoint: { x: 150, y: 60 },
          },
          markerPosition: { x: 400, y: 300 },
          label: 'B',
        },
      ];

      const groups = manager.groupLinksByLocation(resolvedLinks);

      expect(groups).toHaveLength(1);
      expect(groups[0].links).toHaveLength(2);
      expect(groups[0].location).toEqual(sameLocation);
    });

    it('should separate links at different locations', () => {
      const manager = new LinkManager();

      const resolvedLinks: ResolvedLink[] = [
        {
          link: {
            imageId: '0',
            location: { latitude: 51.5074, longitude: -0.1278 },
            label: 'A',
          },
          picturePosition: {
            imageId: '0',
            center: { x: 50, y: 30 },
            connectionPoint: { x: 50, y: 60 },
          },
          markerPosition: { x: 400, y: 300 },
          label: 'A',
        },
        {
          link: {
            imageId: '1',
            location: { latitude: 51.51, longitude: -0.13 },
            label: 'B',
          },
          picturePosition: {
            imageId: '1',
            center: { x: 150, y: 30 },
            connectionPoint: { x: 150, y: 60 },
          },
          markerPosition: { x: 450, y: 350 },
          label: 'B',
        },
      ];

      const groups = manager.groupLinksByLocation(resolvedLinks);

      expect(groups).toHaveLength(2);
      expect(groups[0].links).toHaveLength(1);
      expect(groups[1].links).toHaveLength(1);
    });
  });

  describe('renderLinks', () => {
    it('should render SVG with link lines and labels when style is "both"', () => {
      const manager = new LinkManager();
      const links = createSampleLinks();
      const positions = createSamplePicturePositions();
      const resolved = manager.resolveLinks(links, positions, defaultLinkRenderConfig);

      const result = manager.renderLinks(resolved, defaultLinkRenderConfig);

      expect(result.svg).toContain('<g class="links">');
      expect(result.svg).toContain('<g class="link-lines">');
      expect(result.svg).toContain('<g class="link-labels">');
      expect(result.svg).toContain('<line');
      expect(result.svg).toContain('class="link-label link-label-picture"');
      expect(result.svg).toContain('class="link-label link-label-marker"');
      expect(result.linkCount).toBe(2);
    });

    it('should render only lines when style is "line"', () => {
      const manager = new LinkManager();
      const links = createSampleLinks();
      const positions = createSamplePicturePositions();
      const config: LinkRenderConfig = {
        ...defaultLinkRenderConfig,
        style: { type: 'line', lineColor: '#ff0000' },
      };
      const resolved = manager.resolveLinks(links, positions, config);

      const result = manager.renderLinks(resolved, config);

      expect(result.svg).toContain('<g class="link-lines">');
      expect(result.svg).not.toContain('<g class="link-labels">');
      expect(result.svg).toContain('<line');
    });

    it('should render only labels when style is "label"', () => {
      const manager = new LinkManager();
      const links = createSampleLinks();
      const positions = createSamplePicturePositions();
      const config: LinkRenderConfig = {
        ...defaultLinkRenderConfig,
        style: { type: 'label' },
      };
      const resolved = manager.resolveLinks(links, positions, config);

      const result = manager.renderLinks(resolved, config);

      expect(result.svg).not.toContain('<g class="link-lines">');
      expect(result.svg).toContain('<g class="link-labels">');
    });

    it('should render nothing when style is "none"', () => {
      const manager = new LinkManager();
      const links = createSampleLinks();
      const positions = createSamplePicturePositions();
      const config: LinkRenderConfig = {
        ...defaultLinkRenderConfig,
        style: { type: 'none' },
      };
      const resolved = manager.resolveLinks(links, positions, config);

      const result = manager.renderLinks(resolved, config);

      expect(result.svg).toBe('');
      expect(result.linkCount).toBe(0);
    });

    it('should return empty SVG when no links provided', () => {
      const manager = new LinkManager();

      const result = manager.renderLinks([], defaultLinkRenderConfig);

      expect(result.svg).toBe('');
      expect(result.linkCount).toBe(0);
    });

    it('should apply line color from style', () => {
      const manager = new LinkManager();
      const links = createSampleLinks();
      const positions = createSamplePicturePositions();
      const config: LinkRenderConfig = {
        ...defaultLinkRenderConfig,
        style: { type: 'line', lineColor: '#ff5500' },
      };
      const resolved = manager.resolveLinks(links, positions, config);

      const result = manager.renderLinks(resolved, config);

      expect(result.svg).toContain('stroke="#ff5500"');
    });

    it('should apply dashed line style', () => {
      const manager = new LinkManager();
      const links = createSampleLinks();
      const positions = createSamplePicturePositions();
      const config: LinkRenderConfig = {
        ...defaultLinkRenderConfig,
        style: { type: 'line', lineStyle: 'dashed' },
      };
      const resolved = manager.resolveLinks(links, positions, config);

      const result = manager.renderLinks(resolved, config);

      expect(result.svg).toContain('stroke-dasharray="8,4"');
    });

    it('should apply dotted line style', () => {
      const manager = new LinkManager();
      const links = createSampleLinks();
      const positions = createSamplePicturePositions();
      const config: LinkRenderConfig = {
        ...defaultLinkRenderConfig,
        style: { type: 'line', lineStyle: 'dotted' },
      };
      const resolved = manager.resolveLinks(links, positions, config);

      const result = manager.renderLinks(resolved, config);

      expect(result.svg).toContain('stroke-dasharray="2,2"');
    });

    it('should warn when multiple pictures link to the same location', () => {
      const manager = new LinkManager();
      const sameLocation = { latitude: 51.5074, longitude: -0.1278, name: 'Test Location' };

      const resolved: ResolvedLink[] = [
        {
          link: { imageId: '0', location: sameLocation, label: 'A' },
          picturePosition: {
            imageId: '0',
            center: { x: 50, y: 30 },
            connectionPoint: { x: 50, y: 60 },
          },
          markerPosition: { x: 400, y: 300 },
          label: 'A',
        },
        {
          link: { imageId: '1', location: sameLocation, label: 'B' },
          picturePosition: {
            imageId: '1',
            center: { x: 150, y: 30 },
            connectionPoint: { x: 150, y: 60 },
          },
          markerPosition: { x: 400, y: 300 },
          label: 'B',
        },
      ];

      const config: LinkRenderConfig = {
        ...defaultLinkRenderConfig,
        style: { type: 'line' },
      };

      const result = manager.renderLinks(resolved, config);

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('Test Location');
      expect(result.warnings[0]).toContain('2 pictures');
    });

    it('should escape XML special characters in labels', () => {
      const manager = new LinkManager();

      const resolved: ResolvedLink[] = [
        {
          link: {
            imageId: '0',
            location: { latitude: 51.5074, longitude: -0.1278 },
            label: 'A & B',
          },
          picturePosition: {
            imageId: '0',
            center: { x: 50, y: 30 },
            connectionPoint: { x: 50, y: 60 },
          },
          markerPosition: { x: 400, y: 300 },
          label: 'A & B',
        },
      ];

      const config: LinkRenderConfig = {
        ...defaultLinkRenderConfig,
        style: { type: 'label' },
      };

      const result = manager.renderLinks(resolved, config);

      expect(result.svg).toContain('A &amp; B');
      expect(result.svg).not.toContain('A & B');
    });

    it('should use default color for invalid color value', () => {
      const manager = new LinkManager();
      const links = createSampleLinks();
      const positions = createSamplePicturePositions();
      const config: LinkRenderConfig = {
        ...defaultLinkRenderConfig,
        style: { type: 'line', lineColor: 'invalid<script>alert(1)</script>' },
      };
      const resolved = manager.resolveLinks(links, positions, config);

      const result = manager.renderLinks(resolved, config);

      expect(result.svg).toContain('stroke="#000000"');
      expect(result.svg).not.toContain('<script>');
    });
  });

  describe('renderAllLinks', () => {
    it('should resolve and render links in one call', () => {
      const manager = new LinkManager();
      const links = createSampleLinks();
      const positions = createSamplePicturePositions();

      const result = manager.renderAllLinks(links, positions, defaultLinkRenderConfig);

      expect(result.svg).toContain('<g class="links">');
      expect(result.linkCount).toBe(2);
    });
  });

  describe('validateLinks', () => {
    it('should return empty array for valid links', () => {
      const links = createSampleLinks();
      const positions = createSamplePicturePositions();

      const errors = LinkManager.validateLinks(links, positions);

      expect(errors).toHaveLength(0);
    });

    it('should return errors for links with missing positions', () => {
      const links: ImageLocationLink[] = [
        {
          imageId: '0',
          location: { latitude: 51.5074, longitude: -0.1278 },
        },
        {
          imageId: '99', // No matching position
          location: { latitude: 51.51, longitude: -0.13 },
        },
      ];
      const positions: PicturePosition[] = [
        {
          imageId: '0',
          center: { x: 50, y: 30 },
          connectionPoint: { x: 50, y: 60 },
        },
      ];

      const errors = LinkManager.validateLinks(links, positions);

      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('99');
    });
  });

  describe('createPicturePositions', () => {
    it('should create positions for pictures around the border', () => {
      const positions = LinkManager.createPicturePositions(4, {
        totalWidth: 1000,
        totalHeight: 800,
        borderWidth: 60,
        mapOffsetX: 60,
        mapOffsetY: 60,
        mapWidth: 880,
        mapHeight: 680,
      });

      expect(positions).toHaveLength(4);
      expect(positions[0].imageId).toBe('0');
      expect(positions[1].imageId).toBe('1');
      expect(positions[2].imageId).toBe('2');
      expect(positions[3].imageId).toBe('3');
    });

    it('should return empty array for zero pictures', () => {
      const positions = LinkManager.createPicturePositions(0, {
        totalWidth: 1000,
        totalHeight: 800,
        borderWidth: 60,
        mapOffsetX: 60,
        mapOffsetY: 60,
        mapWidth: 880,
        mapHeight: 680,
      });

      expect(positions).toHaveLength(0);
    });

    it('should assign labels A-Z to pictures', () => {
      const positions = LinkManager.createPicturePositions(3, {
        totalWidth: 1000,
        totalHeight: 800,
        borderWidth: 60,
        mapOffsetX: 60,
        mapOffsetY: 60,
        mapWidth: 880,
        mapHeight: 680,
      });

      expect(positions[0].label).toBe('A');
      expect(positions[1].label).toBe('B');
      expect(positions[2].label).toBe('C');
    });

    it('should handle more than 26 pictures with two-letter labels', () => {
      const positions = LinkManager.createPicturePositions(28, {
        totalWidth: 1000,
        totalHeight: 800,
        borderWidth: 60,
        mapOffsetX: 60,
        mapOffsetY: 60,
        mapWidth: 880,
        mapHeight: 680,
      });

      expect(positions).toHaveLength(28);
      expect(positions[25].label).toBe('Z');
      expect(positions[26].label).toBe('AA');
      expect(positions[27].label).toBe('AB');
    });
  });

  describe('label generation', () => {
    it('should generate correct labels for indices 0-25', () => {
      const manager = new LinkManager();
      const positions: PicturePosition[] = [];

      // Create 26 picture positions without labels
      for (let i = 0; i < 26; i++) {
        positions.push({
          imageId: i.toString(),
          center: { x: i * 10, y: 30 },
          connectionPoint: { x: i * 10, y: 60 },
        });
      }

      const links: ImageLocationLink[] = positions.map((_, i) => ({
        imageId: i.toString(),
        location: { latitude: 51.5074 + i * 0.001, longitude: -0.1278 },
      }));

      const resolved = manager.resolveLinks(links, positions, defaultLinkRenderConfig);

      expect(resolved[0].label).toBe('A');
      expect(resolved[25].label).toBe('Z');
    });

    it('should generate two-letter labels for indices >= 26', () => {
      const manager = new LinkManager();
      const positions: PicturePosition[] = [];

      // Create 30 picture positions without labels
      for (let i = 0; i < 30; i++) {
        positions.push({
          imageId: i.toString(),
          center: { x: i * 10, y: 30 },
          connectionPoint: { x: i * 10, y: 60 },
        });
      }

      const links: ImageLocationLink[] = positions.map((_, i) => ({
        imageId: i.toString(),
        location: { latitude: 51.5074 + i * 0.001, longitude: -0.1278 },
      }));

      const resolved = manager.resolveLinks(links, positions, defaultLinkRenderConfig);

      expect(resolved[26].label).toBe('AA');
      expect(resolved[27].label).toBe('AB');
      expect(resolved[28].label).toBe('AC');
      expect(resolved[29].label).toBe('AD');
    });
  });

  describe('line style rendering', () => {
    it('should not include stroke-dasharray for solid lines', () => {
      const manager = new LinkManager();
      const links = createSampleLinks();
      const positions = createSamplePicturePositions();
      const config: LinkRenderConfig = {
        ...defaultLinkRenderConfig,
        style: { type: 'line', lineStyle: 'solid' },
      };
      const resolved = manager.resolveLinks(links, positions, config);

      const result = manager.renderLinks(resolved, config);

      expect(result.svg).not.toContain('stroke-dasharray');
    });

    it('should apply line width from style', () => {
      const manager = new LinkManager();
      const links = createSampleLinks();
      const positions = createSamplePicturePositions();
      const config: LinkRenderConfig = {
        ...defaultLinkRenderConfig,
        style: { type: 'line', lineWidth: 5 },
      };
      const resolved = manager.resolveLinks(links, positions, config);

      const result = manager.renderLinks(resolved, config);

      expect(result.svg).toContain('stroke-width="5"');
    });
  });

  describe('label style rendering', () => {
    it('should apply font family from label style', () => {
      const manager = new LinkManager();
      const links = createSampleLinks();
      const positions = createSamplePicturePositions();
      const config: LinkRenderConfig = {
        ...defaultLinkRenderConfig,
        style: {
          type: 'label',
          labelStyle: { fontFamily: 'Helvetica' },
        },
      };
      const resolved = manager.resolveLinks(links, positions, config);

      const result = manager.renderLinks(resolved, config);

      expect(result.svg).toContain('font-family="Helvetica, sans-serif"');
    });

    it('should apply font size from label style', () => {
      const manager = new LinkManager();
      const links = createSampleLinks();
      const positions = createSamplePicturePositions();
      const config: LinkRenderConfig = {
        ...defaultLinkRenderConfig,
        style: {
          type: 'label',
          labelStyle: { fontSize: 16 },
        },
      };
      const resolved = manager.resolveLinks(links, positions, config);

      const result = manager.renderLinks(resolved, config);

      expect(result.svg).toContain('font-size="16"');
    });
  });

  describe('integration with map engine', () => {
    it('should include image-id data attribute on lines', () => {
      const manager = new LinkManager();
      const links = createSampleLinks();
      const positions = createSamplePicturePositions();
      const config: LinkRenderConfig = {
        ...defaultLinkRenderConfig,
        style: { type: 'line' },
      };
      const resolved = manager.resolveLinks(links, positions, config);

      const result = manager.renderLinks(resolved, config);

      expect(result.svg).toContain('data-image-id="0"');
      expect(result.svg).toContain('data-image-id="1"');
    });
  });
});

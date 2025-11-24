import { describe, it, expect } from 'vitest';
import { MapEngine } from './engine';
import { calculateCenter, calculateZoomToFit } from './coordinates';
import type { PicMapConfig } from '../types';

describe('Map Engine Integration', () => {
  it('should render a complete map from configuration', () => {
    const config: PicMapConfig = {
      title: 'Test Map',
      layout: {
        pageSize: 'A4',
        orientation: 'landscape',
        borderWidth: 60,
        pictureSpacing: 10,
        margin: { top: 20, right: 20, bottom: 20, left: 20 },
      },
      map: {
        provider: 'openstreetmap',
        zoom: 12,
        center: { latitude: 51.5074, longitude: -0.1278 },
        showScale: true,
        showAttribution: true,
      },
      images: [
        { filePath: '/images/img1.jpg' },
        { filePath: '/images/img2.jpg' },
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
      ],
    };
    
    const engine = new MapEngine();
    const markers = MapEngine.createMarkersFromLinks(config.links);
    
    const result = engine.renderMap({
      style: config.map,
      width: 800,
      height: 600,
      markers,
    });
    
    expect(result.svg).toBeDefined();
    expect(result.svg).toContain('<svg');
    expect(result.svg).toContain('</svg>');
    expect(result.svg).toContain('class="marker"');
    expect(result.svg).toContain('>A<');
    expect(result.svg).toContain('>B<');
    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
  });
  
  it('should auto-fit zoom and center for multiple markers', () => {
    const locations = [
      { latitude: 51.5074, longitude: -0.1278 }, // London
      { latitude: 48.8566, longitude: 2.3522 },  // Paris
      { latitude: 52.52, longitude: 13.405 },    // Berlin
    ];
    
    const center = calculateCenter(locations);
    const zoom = calculateZoomToFit(locations, 1000, 800);
    
    expect(center.latitude).toBeGreaterThan(48);
    expect(center.latitude).toBeLessThan(53);
    expect(zoom).toBeGreaterThan(0);
    expect(zoom).toBeLessThanOrEqual(20);
    
    const engine = new MapEngine();
    const markers = locations.map((location, i) => ({
      location,
      label: String.fromCharCode(65 + i), // A, B, C
    }));
    
    const result = engine.renderMap({
      style: {
        provider: 'openstreetmap',
        zoom,
        center,
        showScale: true,
        showAttribution: true,
      },
      width: 1000,
      height: 800,
      markers,
    });
    
    expect(result.svg).toContain('class="marker"');
    expect(result.svg).toContain('>A<');
    expect(result.svg).toContain('>B<');
    expect(result.svg).toContain('>C<');
  });
  
  it('should render map without markers', () => {
    const engine = new MapEngine();
    
    const result = engine.renderMap({
      style: {
        provider: 'openstreetmap',
        zoom: 10,
        center: { latitude: 40.7128, longitude: -74.006 },
        showScale: false,
        showAttribution: false,
      },
      width: 600,
      height: 400,
    });
    
    expect(result.svg).toBeDefined();
    expect(result.svg).toContain('<svg');
    expect(result.svg).not.toContain('class="marker"');
    expect(result.svg).not.toContain('class="scale"');
  });
  
  it('should handle custom map styling', () => {
    const engine = new MapEngine();
    const markers = [
      {
        location: { latitude: 51.5074, longitude: -0.1278 },
        label: 'Custom',
        style: {
          color: '#00ff00',
          size: 30,
          shape: 'square' as const,
        },
      },
    ];
    
    const result = engine.renderMap({
      style: {
        provider: 'custom',
        zoom: 14,
        center: { latitude: 51.5074, longitude: -0.1278 },
        showScale: true,
        showAttribution: true,
      },
      width: 1024,
      height: 768,
      markers,
      backgroundColor: '#f5f5f5',
    });
    
    expect(result.svg).toContain('#00ff00');
    expect(result.svg).toContain('#f5f5f5');
    expect(result.svg).toContain('Custom Map');
  });
  
  it('should create valid SVG structure', () => {
    const engine = new MapEngine();
    const markers = [
      {
        location: { latitude: 51.5074, longitude: -0.1278 },
        label: 'Test',
      },
    ];
    
    const result = engine.renderMap({
      style: {
        provider: 'openstreetmap',
        zoom: 12,
        center: { latitude: 51.5074, longitude: -0.1278 },
      },
      width: 800,
      height: 600,
      markers,
    });
    
    // Check SVG has proper structure
    expect(result.svg).toMatch(/<svg[^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"[^>]*>/);
    expect(result.svg).toMatch(/<svg[^>]*width="800"[^>]*>/);
    expect(result.svg).toMatch(/<svg[^>]*height="600"[^>]*>/);
    expect(result.svg).toContain('</svg>');
    
    // SVG should close properly
    const openTags = (result.svg.match(/<svg/g) || []).length;
    const closeTags = (result.svg.match(/<\/svg>/g) || []).length;
    expect(openTags).toBe(closeTags);
  });
});

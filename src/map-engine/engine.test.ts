import { describe, it, expect } from 'vitest';
import { MapEngine } from './engine';
import type { MapStyle, MapMarker, GeoLocation } from '../types';

describe('MapEngine', () => {
  const defaultMapStyle: MapStyle = {
    provider: 'openstreetmap',
    zoom: 12,
    center: { latitude: 51.5074, longitude: -0.1278 },
    showScale: true,
    showAttribution: true,
  };
  
  describe('renderMap', () => {
    it('should render a basic map', () => {
      const engine = new MapEngine();
      const result = engine.renderMap({
        style: defaultMapStyle,
        width: 800,
        height: 600,
      });
      
      expect(result).toBeDefined();
      expect(result.svg).toContain('<svg');
      expect(result.svg).toContain('</svg>');
      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
      expect(result.bounds).toBeDefined();
    });
    
    it('should include bounds information', () => {
      const engine = new MapEngine();
      const result = engine.renderMap({
        style: defaultMapStyle,
        width: 800,
        height: 600,
      });
      
      expect(result.bounds.north).toBeGreaterThan(result.bounds.south);
      expect(result.bounds.east).toBeGreaterThan(result.bounds.west);
      expect(result.bounds.north).toBeGreaterThan(defaultMapStyle.center.latitude);
      expect(result.bounds.south).toBeLessThan(defaultMapStyle.center.latitude);
    });
    
    it('should render map with custom background color', () => {
      const engine = new MapEngine();
      const result = engine.renderMap({
        style: defaultMapStyle,
        width: 800,
        height: 600,
        backgroundColor: '#abcdef',
      });
      
      expect(result.svg).toContain('#abcdef');
    });
    
    it('should use default background color for invalid color value', () => {
      const engine = new MapEngine();
      const result = engine.renderMap({
        style: defaultMapStyle,
        width: 800,
        height: 600,
        backgroundColor: 'invalid<script>alert(1)</script>',
      });
      
      expect(result.svg).toContain('#f0f0f0');
      expect(result.svg).not.toContain('<script>');
    });
    
    it('should include scale when showScale is true', () => {
      const engine = new MapEngine();
      const result = engine.renderMap({
        style: { ...defaultMapStyle, showScale: true },
        width: 800,
        height: 600,
      });
      
      expect(result.svg).toContain('class="scale"');
    });
    
    it('should not include scale when showScale is false', () => {
      const engine = new MapEngine();
      const result = engine.renderMap({
        style: { ...defaultMapStyle, showScale: false },
        width: 800,
        height: 600,
      });
      
      expect(result.svg).not.toContain('class="scale"');
    });
    
    it('should include attribution when showAttribution is true', () => {
      const engine = new MapEngine();
      const result = engine.renderMap({
        style: { ...defaultMapStyle, showAttribution: true },
        width: 800,
        height: 600,
      });
      
      expect(result.svg).toContain('OpenStreetMap contributors');
    });
    
    it('should not include attribution when showAttribution is false', () => {
      const engine = new MapEngine();
      const result = engine.renderMap({
        style: { ...defaultMapStyle, showAttribution: false },
        width: 800,
        height: 600,
      });
      
      expect(result.svg).not.toContain('OpenStreetMap contributors');
    });
    
    it('should render markers', () => {
      const engine = new MapEngine();
      const markers: MapMarker[] = [
        {
          location: { latitude: 51.5074, longitude: -0.1278 },
          label: 'A',
        },
      ];
      
      const result = engine.renderMap({
        style: defaultMapStyle,
        width: 800,
        height: 600,
        markers,
      });
      
      expect(result.svg).toContain('class="marker"');
      expect(result.svg).toContain('>A<');
    });
    
    it('should render multiple markers', () => {
      const engine = new MapEngine();
      const markers: MapMarker[] = [
        {
          location: { latitude: 51.5074, longitude: -0.1278 },
          label: 'A',
        },
        {
          location: { latitude: 51.51, longitude: -0.13 },
          label: 'B',
        },
      ];
      
      const result = engine.renderMap({
        style: defaultMapStyle,
        width: 800,
        height: 600,
        markers,
      });
      
      expect(result.svg).toContain('>A<');
      expect(result.svg).toContain('>B<');
    });
    
    it('should render markers with different shapes', () => {
      const engine = new MapEngine();
      const markers: MapMarker[] = [
        {
          location: { latitude: 51.5074, longitude: -0.1278 },
          style: { shape: 'circle' },
        },
        {
          location: { latitude: 51.51, longitude: -0.13 },
          style: { shape: 'square' },
        },
        {
          location: { latitude: 51.52, longitude: -0.14 },
          style: { shape: 'pin' },
        },
      ];
      
      const result = engine.renderMap({
        style: defaultMapStyle,
        width: 800,
        height: 600,
        markers,
      });
      
      expect(result.svg).toContain('<circle');
      expect(result.svg).toContain('<rect');
      expect(result.svg).toContain('<path');
    });
    
    it('should escape XML special characters in labels', () => {
      const engine = new MapEngine();
      const markers: MapMarker[] = [
        {
          location: { latitude: 51.5074, longitude: -0.1278 },
          label: 'A & B',
        },
      ];
      
      const result = engine.renderMap({
        style: defaultMapStyle,
        width: 800,
        height: 600,
        markers,
      });
      
      expect(result.svg).toContain('A &amp; B');
      expect(result.svg).not.toContain('A & B');
    });
    
    it('should render custom attribution for custom provider', () => {
      const engine = new MapEngine();
      const result = engine.renderMap({
        style: { ...defaultMapStyle, provider: 'custom', showAttribution: true },
        width: 800,
        height: 600,
      });
      
      expect(result.svg).toContain('Custom Map');
    });
    
    it('should use default color for markers with invalid color', () => {
      const engine = new MapEngine();
      const markers: MapMarker[] = [
        {
          location: { latitude: 51.5074, longitude: -0.1278 },
          style: { color: 'invalid<script>alert(1)</script>' },
        },
      ];
      
      const result = engine.renderMap({
        style: defaultMapStyle,
        width: 800,
        height: 600,
        markers,
      });
      
      expect(result.svg).toContain('#e74c3c');
      expect(result.svg).not.toContain('<script>');
    });
    
    it('should accept valid hex colors for markers', () => {
      const engine = new MapEngine();
      const markers: MapMarker[] = [
        {
          location: { latitude: 51.5074, longitude: -0.1278 },
          style: { color: '#00ff00' },
        },
      ];
      
      const result = engine.renderMap({
        style: defaultMapStyle,
        width: 800,
        height: 600,
        markers,
      });
      
      expect(result.svg).toContain('#00ff00');
    });
    
    it('should accept named colors for background', () => {
      const engine = new MapEngine();
      const result = engine.renderMap({
        style: defaultMapStyle,
        width: 800,
        height: 600,
        backgroundColor: 'lightblue',
      });
      
      expect(result.svg).toContain('lightblue');
    });
  });
  
  describe('createMarkersFromLinks', () => {
    it('should create markers from links', () => {
      const links = [
        {
          imageId: '0',
          location: { latitude: 51.5074, longitude: -0.1278 } as GeoLocation,
          label: 'A',
        },
        {
          imageId: '1',
          location: { latitude: 51.51, longitude: -0.13 } as GeoLocation,
          label: 'B',
        },
      ];
      
      const markers = MapEngine.createMarkersFromLinks(links);
      
      expect(markers).toHaveLength(2);
      expect(markers[0].location.latitude).toBe(51.5074);
      expect(markers[0].label).toBe('A');
      expect(markers[1].location.latitude).toBe(51.51);
      expect(markers[1].label).toBe('B');
    });
    
    it('should create markers without labels', () => {
      const links = [
        {
          imageId: '0',
          location: { latitude: 51.5074, longitude: -0.1278 } as GeoLocation,
        },
      ];
      
      const markers = MapEngine.createMarkersFromLinks(links);
      
      expect(markers).toHaveLength(1);
      expect(markers[0].label).toBeUndefined();
    });
    
    it('should apply default marker style', () => {
      const links = [
        {
          imageId: '0',
          location: { latitude: 51.5074, longitude: -0.1278 } as GeoLocation,
        },
      ];
      
      const markers = MapEngine.createMarkersFromLinks(links);
      
      expect(markers[0].style).toBeDefined();
      expect(markers[0].style?.color).toBe('#e74c3c');
      expect(markers[0].style?.size).toBe(20);
      expect(markers[0].style?.shape).toBe('pin');
    });
  });
});

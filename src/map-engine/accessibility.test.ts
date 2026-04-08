import { describe, it, expect } from 'vitest';
import { MapEngine } from './engine';
import type { MapStyle, MapMarker } from '../types';

describe('MapEngine Accessibility', () => {
  const defaultMapStyle: MapStyle = {
    provider: 'openstreetmap',
    zoom: 12,
    center: { latitude: 51.5074, longitude: -0.1278, name: 'London' },
    showScale: true,
    showAttribution: true,
  };

  it('should include accessibility metadata in root SVG', () => {
    const engine = new MapEngine();
    const result = engine.renderMap({
      style: defaultMapStyle,
      width: 800,
      height: 600,
    });

    expect(result.svg).toContain('role="img"');
    expect(result.svg).toContain('aria-label="Map of London"');
    expect(result.svg).toContain('<title>Map of London</title>');

    // Should also work without name
    const resultNoName = engine.renderMap({
      style: { ...defaultMapStyle, center: { latitude: 51.5074, longitude: -0.1278 } },
      width: 800,
      height: 600,
    });
    expect(resultNoName.svg).toContain('aria-label="Map centered at 51.5074, -0.1278"');
    expect(result.svg).toContain(
      '<desc>A map of London with no markers at zoom level 12</desc>'
    );
  });

  it('should include descriptive metadata with marker count', () => {
    const engine = new MapEngine();
    const markers: MapMarker[] = [
      { location: { latitude: 51.5, longitude: -0.1 }, label: '1' },
      { location: { latitude: 51.6, longitude: -0.2 }, label: '2' },
    ];

    const result = engine.renderMap({
      style: defaultMapStyle,
      width: 800,
      height: 600,
      markers,
    });

    expect(result.svg).toContain(
      '<desc>A map of London with 2 markers at zoom level 12</desc>'
    );
  });

  it('should include title and aria-label in markers', () => {
    const engine = new MapEngine();
    const markers: MapMarker[] = [
      {
        location: { latitude: 51.5074, longitude: -0.1278, name: 'Big Ben' },
        label: 'A',
      },
    ];

    const result = engine.renderMap({
      style: defaultMapStyle,
      width: 800,
      height: 600,
      markers,
    });

    expect(result.svg).toContain('role="graphics-symbol"');
    expect(result.svg).toContain('aria-label="Big Ben (marker A)"');
    expect(result.svg).toContain('aria-posinset="1"');
    expect(result.svg).toContain('aria-setsize="1"');
    expect(result.svg).toContain('<title>Big Ben (marker A)</title>');
    expect(result.svg).toContain('tabindex="0"');
    expect(result.svg).toContain('aria-hidden="true"'); // For decorative features and scale
    expect(result.svg).toContain('aria-hidden="true">© OpenStreetMap contributors</text>');
  });

  it('should include interactive styles in the SVG', () => {
    const engine = new MapEngine();
    const result = engine.renderMap({
      style: defaultMapStyle,
      width: 800,
      height: 600,
    });

    expect(result.svg).toContain('<style>');
    expect(result.svg).toContain(
      '.marker { cursor: pointer; outline: none; transition: filter 0.2s; }'
    );
    expect(result.svg).toContain(
      '.marker:hover, .marker:focus-visible { filter: brightness(1.1) drop-shadow(0 2px 4px rgba(0,0,0,0.2)); }'
    );
    expect(result.svg).toContain('.marker:focus-visible { outline: 3px solid #4a90e2;');
    expect(result.svg).toContain('</style>');
  });
});

import { describe, it, expect } from 'vitest';
import {
  geoToPixel,
  pixelToGeo,
  calculateBounds,
  geoToViewportPixel,
  calculateZoomToFit,
  calculateCenter,
} from './coordinates';
import type { GeoLocation } from '../types';

describe('geoToPixel', () => {
  it('should convert geographic coordinates to pixel coordinates at zoom level 0', () => {
    const location: GeoLocation = { latitude: 0, longitude: 0 };
    const pixel = geoToPixel(location, 0);

    // At zoom 0, the world is 256 pixels, center is at 128,128
    expect(pixel.x).toBeCloseTo(128, 0);
    expect(pixel.y).toBeCloseTo(128, 0);
  });

  it('should handle positive latitude and longitude', () => {
    const location: GeoLocation = { latitude: 51.5074, longitude: -0.1278 };
    const pixel = geoToPixel(location, 10);

    expect(pixel.x).toBeGreaterThan(0);
    expect(pixel.y).toBeGreaterThan(0);
  });

  it('should scale with zoom level', () => {
    const location: GeoLocation = { latitude: 51.5074, longitude: -0.1278 };
    const pixel1 = geoToPixel(location, 10);
    const pixel2 = geoToPixel(location, 11);

    // At zoom 11, coordinates should be roughly 2x those at zoom 10
    expect(pixel2.x).toBeCloseTo(pixel1.x * 2, 0);
    expect(pixel2.y).toBeCloseTo(pixel1.y * 2, 0);
  });
});

describe('pixelToGeo', () => {
  it('should convert pixel coordinates to geographic coordinates', () => {
    const pixel = { x: 128, y: 128 };
    const location = pixelToGeo(pixel, 0);

    expect(location.latitude).toBeCloseTo(0, 1);
    expect(location.longitude).toBeCloseTo(0, 1);
  });

  it('should be inverse of geoToPixel', () => {
    const originalLocation: GeoLocation = { latitude: 51.5074, longitude: -0.1278 };
    const zoom = 10;

    const pixel = geoToPixel(originalLocation, zoom);
    const convertedLocation = pixelToGeo(pixel, zoom);

    expect(convertedLocation.latitude).toBeCloseTo(originalLocation.latitude, 4);
    expect(convertedLocation.longitude).toBeCloseTo(originalLocation.longitude, 4);
  });
});

describe('calculateBounds', () => {
  it('should calculate bounding box for a map', () => {
    const center: GeoLocation = { latitude: 51.5074, longitude: -0.1278 };
    const bounds = calculateBounds(center, 10, 800, 600);

    expect(bounds.north).toBeGreaterThan(center.latitude);
    expect(bounds.south).toBeLessThan(center.latitude);
    expect(bounds.east).toBeGreaterThan(center.longitude);
    expect(bounds.west).toBeLessThan(center.longitude);
  });

  it('should have center within bounds', () => {
    const center: GeoLocation = { latitude: 40.7128, longitude: -74.006 };
    const bounds = calculateBounds(center, 12, 1000, 800);

    expect(center.latitude).toBeGreaterThan(bounds.south);
    expect(center.latitude).toBeLessThan(bounds.north);
    expect(center.longitude).toBeGreaterThan(bounds.west);
    expect(center.longitude).toBeLessThan(bounds.east);
  });

  it('should handle different viewport sizes', () => {
    const center: GeoLocation = { latitude: 0, longitude: 0 };
    const smallBounds = calculateBounds(center, 10, 400, 300);
    const largeBounds = calculateBounds(center, 10, 800, 600);

    // Larger viewport should have larger bounds
    const smallRange = smallBounds.north - smallBounds.south;
    const largeRange = largeBounds.north - largeBounds.south;
    expect(largeRange).toBeGreaterThan(smallRange);
  });
});

describe('geoToViewportPixel', () => {
  it('should place center location at viewport center', () => {
    const center: GeoLocation = { latitude: 51.5074, longitude: -0.1278 };
    const width = 800;
    const height = 600;

    const pixel = geoToViewportPixel(center, center, 10, width, height);

    expect(pixel.x).toBeCloseTo(width / 2, 0);
    expect(pixel.y).toBeCloseTo(height / 2, 0);
  });

  it('should correctly position locations relative to center', () => {
    const center: GeoLocation = { latitude: 51.5074, longitude: -0.1278 };
    const north: GeoLocation = { latitude: 52.0, longitude: -0.1278 }; // Same longitude, north of center

    const centerPixel = geoToViewportPixel(center, center, 10, 800, 600);
    const northPixel = geoToViewportPixel(north, center, 10, 800, 600);

    // North location should have smaller y (up is negative in screen coordinates)
    expect(northPixel.y).toBeLessThan(centerPixel.y);
    // Should have same x (same longitude)
    expect(northPixel.x).toBeCloseTo(centerPixel.x, 0);
  });
});

describe('calculateZoomToFit', () => {
  it('should return default zoom for empty array', () => {
    const zoom = calculateZoomToFit([], 800, 600);
    expect(zoom).toBe(10);
  });

  it('should return close-up zoom for single location', () => {
    const locations: GeoLocation[] = [{ latitude: 51.5074, longitude: -0.1278 }];
    const zoom = calculateZoomToFit(locations, 800, 600);
    expect(zoom).toBe(15);
  });

  it('should calculate appropriate zoom for multiple locations', () => {
    const locations: GeoLocation[] = [
      { latitude: 51.5074, longitude: -0.1278 }, // London
      { latitude: 48.8566, longitude: 2.3522 }, // Paris
    ];
    const zoom = calculateZoomToFit(locations, 800, 600);

    expect(zoom).toBeGreaterThan(0);
    expect(zoom).toBeLessThanOrEqual(20);
  });

  it('should use lower zoom for widely dispersed locations', () => {
    const close: GeoLocation[] = [
      { latitude: 51.5, longitude: -0.1 },
      { latitude: 51.6, longitude: -0.2 },
    ];
    const far: GeoLocation[] = [
      { latitude: 51.5, longitude: -0.1 },
      { latitude: 40.7, longitude: -74.0 }, // New York
    ];

    const closeZoom = calculateZoomToFit(close, 800, 600);
    const farZoom = calculateZoomToFit(far, 800, 600);

    expect(farZoom).toBeLessThan(closeZoom);
  });

  it('should clamp zoom to valid range', () => {
    const locations: GeoLocation[] = [
      { latitude: 0, longitude: 0 },
      { latitude: 0.00001, longitude: 0.00001 },
    ];
    const zoom = calculateZoomToFit(locations, 800, 600);

    expect(zoom).toBeGreaterThanOrEqual(0);
    expect(zoom).toBeLessThanOrEqual(20);
  });
});

describe('calculateCenter', () => {
  it('should return origin for empty array', () => {
    const center = calculateCenter([]);
    expect(center.latitude).toBe(0);
    expect(center.longitude).toBe(0);
  });

  it('should return the location for single point', () => {
    const location: GeoLocation = { latitude: 51.5074, longitude: -0.1278 };
    const center = calculateCenter([location]);

    expect(center.latitude).toBe(location.latitude);
    expect(center.longitude).toBe(location.longitude);
  });

  it('should calculate average for multiple locations', () => {
    const locations: GeoLocation[] = [
      { latitude: 50, longitude: 0 },
      { latitude: 52, longitude: 0 },
    ];
    const center = calculateCenter(locations);

    expect(center.latitude).toBe(51);
    expect(center.longitude).toBe(0);
  });

  it('should handle locations across the globe', () => {
    const locations: GeoLocation[] = [
      { latitude: 51.5074, longitude: -0.1278 }, // London
      { latitude: 48.8566, longitude: 2.3522 }, // Paris
      { latitude: 52.52, longitude: 13.405 }, // Berlin
    ];
    const center = calculateCenter(locations);

    // Center should be somewhere in Europe
    expect(center.latitude).toBeGreaterThan(48);
    expect(center.latitude).toBeLessThan(53);
    expect(center.longitude).toBeGreaterThan(-1);
    expect(center.longitude).toBeLessThan(14);
  });
});

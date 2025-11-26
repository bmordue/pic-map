/**
 * Coordinate conversion utilities for map rendering
 * Converts between geographic coordinates (lat/lon) and pixel coordinates
 */

import { GeoLocation, PixelCoordinate, BoundingBox } from '../types';

/**
 * Web Mercator projection constants
 */
const TILE_SIZE = 256;

/**
 * Converts latitude to Web Mercator Y coordinate
 * @param lat - Latitude in degrees
 * @returns Y coordinate in Web Mercator projection
 */
function latitudeToY(lat: number): number {
  const latRad = (lat * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + latRad / 2));
}

/**
 * Converts Web Mercator Y coordinate back to latitude
 * @param y - Y coordinate in Web Mercator projection
 * @returns Latitude in degrees
 */
function yToLatitude(y: number): number {
  return (2 * Math.atan(Math.exp(y)) - Math.PI / 2) * (180 / Math.PI);
}

/**
 * Converts geographic coordinates to pixel coordinates for a given zoom level
 * @param location - Geographic location
 * @param zoom - Zoom level (0-20)
 * @returns Pixel coordinates at the given zoom level
 */
export function geoToPixel(location: GeoLocation, zoom: number): PixelCoordinate {
  const scale = Math.pow(2, zoom) * TILE_SIZE;
  const worldX = (location.longitude + 180) / 360;
  const worldY = (1 - latitudeToY(location.latitude) / Math.PI) / 2;
  
  return {
    x: worldX * scale,
    y: worldY * scale,
  };
}

/**
 * Converts pixel coordinates to geographic coordinates for a given zoom level
 * @param pixel - Pixel coordinates
 * @param zoom - Zoom level (0-20)
 * @returns Geographic location
 */
export function pixelToGeo(pixel: PixelCoordinate, zoom: number): GeoLocation {
  const scale = Math.pow(2, zoom) * TILE_SIZE;
  const worldX = pixel.x / scale;
  const worldY = pixel.y / scale;
  
  const longitude = worldX * 360 - 180;
  const latitude = yToLatitude((1 - 2 * worldY) * Math.PI);
  
  return {
    latitude,
    longitude,
  };
}

/**
 * Calculates the bounding box for a map centered at a given location
 * @param center - Center location of the map
 * @param zoom - Zoom level
 * @param widthPixels - Width of the map in pixels
 * @param heightPixels - Height of the map in pixels
 * @returns Bounding box of the map area
 */
export function calculateBounds(
  center: GeoLocation,
  zoom: number,
  widthPixels: number,
  heightPixels: number
): BoundingBox {
  const centerPixel = geoToPixel(center, zoom);
  
  const northWestPixel: PixelCoordinate = {
    x: centerPixel.x - widthPixels / 2,
    y: centerPixel.y - heightPixels / 2,
  };
  
  const southEastPixel: PixelCoordinate = {
    x: centerPixel.x + widthPixels / 2,
    y: centerPixel.y + heightPixels / 2,
  };
  
  const northWest = pixelToGeo(northWestPixel, zoom);
  const southEast = pixelToGeo(southEastPixel, zoom);
  
  return {
    north: northWest.latitude,
    south: southEast.latitude,
    east: southEast.longitude,
    west: northWest.longitude,
  };
}

/**
 * Converts a geographic location to pixel coordinates relative to a map viewport
 * @param location - Geographic location to convert
 * @param center - Center location of the map
 * @param zoom - Zoom level
 * @param widthPixels - Width of the map in pixels
 * @param heightPixels - Height of the map in pixels
 * @returns Pixel coordinates relative to the map viewport (0,0 is top-left)
 */
export function geoToViewportPixel(
  location: GeoLocation,
  center: GeoLocation,
  zoom: number,
  widthPixels: number,
  heightPixels: number
): PixelCoordinate {
  const locationPixel = geoToPixel(location, zoom);
  const centerPixel = geoToPixel(center, zoom);
  
  return {
    x: locationPixel.x - centerPixel.x + widthPixels / 2,
    y: locationPixel.y - centerPixel.y + heightPixels / 2,
  };
}

/**
 * Calculates the appropriate zoom level to fit all markers within a viewport
 * @param locations - Array of locations to fit
 * @param widthPixels - Width of the viewport in pixels
 * @param heightPixels - Height of the viewport in pixels
 * @param padding - Padding factor (0-1) to add around the markers
 * @returns Appropriate zoom level
 */
export function calculateZoomToFit(
  locations: GeoLocation[],
  widthPixels: number,
  heightPixels: number,
  padding = 0.1
): number {
  if (locations.length === 0) {
    return 10; // Default zoom level
  }
  
  if (locations.length === 1) {
    return 15; // Close-up for single location
  }
  
  // Find bounding box of all locations
  const lats = locations.map((loc) => loc.latitude);
  const lngs = locations.map((loc) => loc.longitude);
  
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  
  // Apply padding
  const latRange = (maxLat - minLat) * (1 + padding);
  const lngRange = (maxLng - minLng) * (1 + padding);
  
  // Calculate zoom level for latitude
  const latZoom = Math.log2((heightPixels * 180) / (latRange * TILE_SIZE));
  
  // Calculate zoom level for longitude
  const lngZoom = Math.log2((widthPixels * 360) / (lngRange * TILE_SIZE));
  
  // Use the smaller zoom to ensure everything fits
  const zoom = Math.floor(Math.min(latZoom, lngZoom));
  
  // Clamp to valid zoom range
  return Math.max(0, Math.min(20, zoom));
}

/**
 * Calculates the center point for a collection of locations
 * 
 * NOTE: This function uses simple arithmetic averaging for longitude, which
 * produces incorrect results when locations span across the international date
 * line (longitude ±180°). For example, locations at 170° and -170° would average
 * to 0° instead of 180°/-180°. This limitation is acceptable for use cases
 * covering continental regions but may need spherical averaging for global coverage.
 * 
 * @param locations - Array of locations
 * @returns Center point of all locations
 */
export function calculateCenter(locations: GeoLocation[]): GeoLocation {
  if (locations.length === 0) {
    return { latitude: 0, longitude: 0 };
  }
  
  const avgLat = locations.reduce((sum, loc) => sum + loc.latitude, 0) / locations.length;
  const avgLng = locations.reduce((sum, loc) => sum + loc.longitude, 0) / locations.length;
  
  return {
    latitude: avgLat,
    longitude: avgLng,
  };
}

/**
 * Main map rendering engine for generating SVG maps
 */

import { MapStyle, MapMarker, RenderedMap, GeoLocation } from '../types';
import { geoToViewportPixel, calculateBounds } from './coordinates';

/**
 * Configuration for map rendering
 */
export interface MapRenderConfig {
  /** Map style configuration */
  style: MapStyle;
  /** Width of the output map in pixels */
  width: number;
  /** Height of the output map in pixels */
  height: number;
  /** Markers to render on the map */
  markers?: MapMarker[];
  /** Background color for the map */
  backgroundColor?: string;
}

/**
 * Constants for rendering
 */
const TILE_SIZE = 256; // Standard tile size for grid
const PIN_SHAPE_RATIO = 1 / 3; // Width ratio for pin base
const PIN_HEIGHT_RATIO = 1.2; // Height ratio for pin top curve

/**
 * Regex pattern for validating hex CSS color values
 */
const HEX_COLOR_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * Validates RGB color values (0-255 for each component)
 */
function isValidRgbColor(color: string): boolean {
  const match = color.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/);
  if (!match) return false;
  const [, r, g, b] = match;
  return parseInt(r) <= 255 && parseInt(g) <= 255 && parseInt(b) <= 255;
}

/**
 * Validates RGBA color values (0-255 for RGB, 0-1 for alpha)
 */
function isValidRgbaColor(color: string): boolean {
  const match = color.match(/^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*([\d.]+)\s*\)$/);
  if (!match) return false;
  const [, r, g, b, a] = match;
  const alpha = parseFloat(a);
  return parseInt(r) <= 255 && parseInt(g) <= 255 && parseInt(b) <= 255 && alpha >= 0 && alpha <= 1;
}

/**
 * Validates HSL color values (0-360 for hue, 0-100 for saturation/lightness)
 */
function isValidHslColor(color: string): boolean {
  const match = color.match(/^hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/);
  if (!match) return false;
  const [, h, s, l] = match;
  return parseInt(h) <= 360 && parseInt(s) <= 100 && parseInt(l) <= 100;
}

/**
 * Validates HSLA color values (0-360 for hue, 0-100 for saturation/lightness, 0-1 for alpha)
 */
function isValidHslaColor(color: string): boolean {
  const match = color.match(/^hsla\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*,\s*([\d.]+)\s*\)$/);
  if (!match) return false;
  const [, h, s, l, a] = match;
  const alpha = parseFloat(a);
  return parseInt(h) <= 360 && parseInt(s) <= 100 && parseInt(l) <= 100 && alpha >= 0 && alpha <= 1;
}

const NAMED_COLORS = new Set([
  'aliceblue', 'antiquewhite', 'aqua', 'aquamarine', 'azure', 'beige', 'bisque', 'black',
  'blanchedalmond', 'blue', 'blueviolet', 'brown', 'burlywood', 'cadetblue', 'chartreuse',
  'chocolate', 'coral', 'cornflowerblue', 'cornsilk', 'crimson', 'cyan', 'darkblue', 'darkcyan',
  'darkgoldenrod', 'darkgray', 'darkgreen', 'darkgrey', 'darkkhaki', 'darkmagenta', 'darkolivegreen',
  'darkorange', 'darkorchid', 'darkred', 'darksalmon', 'darkseagreen', 'darkslateblue', 'darkslategray',
  'darkslategrey', 'darkturquoise', 'darkviolet', 'deeppink', 'deepskyblue', 'dimgray', 'dimgrey',
  'dodgerblue', 'firebrick', 'floralwhite', 'forestgreen', 'fuchsia', 'gainsboro', 'ghostwhite',
  'gold', 'goldenrod', 'gray', 'green', 'greenyellow', 'grey', 'honeydew', 'hotpink', 'indianred',
  'indigo', 'ivory', 'khaki', 'lavender', 'lavenderblush', 'lawngreen', 'lemonchiffon', 'lightblue',
  'lightcoral', 'lightcyan', 'lightgoldenrodyellow', 'lightgray', 'lightgreen', 'lightgrey', 'lightpink',
  'lightsalmon', 'lightseagreen', 'lightskyblue', 'lightslategray', 'lightslategrey', 'lightsteelblue',
  'lightyellow', 'lime', 'limegreen', 'linen', 'magenta', 'maroon', 'mediumaquamarine', 'mediumblue',
  'mediumorchid', 'mediumpurple', 'mediumseagreen', 'mediumslateblue', 'mediumspringgreen', 'mediumturquoise',
  'mediumvioletred', 'midnightblue', 'mintcream', 'mistyrose', 'moccasin', 'navajowhite', 'navy', 'oldlace',
  'olive', 'olivedrab', 'orange', 'orangered', 'orchid', 'palegoldenrod', 'palegreen', 'paleturquoise',
  'palevioletred', 'papayawhip', 'peachpuff', 'peru', 'pink', 'plum', 'powderblue', 'purple', 'rebeccapurple',
  'red', 'rosybrown', 'royalblue', 'saddlebrown', 'salmon', 'sandybrown', 'seagreen', 'seashell', 'sienna',
  'silver', 'skyblue', 'slateblue', 'slategray', 'slategrey', 'snow', 'springgreen', 'steelblue', 'tan',
  'teal', 'thistle', 'tomato', 'turquoise', 'violet', 'wheat', 'white', 'whitesmoke', 'yellow', 'yellowgreen',
]);

/**
 * Validates a CSS color value for use in SVG attributes
 * @param color - The color value to validate
 * @returns true if the color is valid, false otherwise
 */
function isValidColor(color: string): boolean {
  if (!color || typeof color !== 'string') {
    return false;
  }
  const lowerColor = color.toLowerCase().trim();
  return (
    HEX_COLOR_PATTERN.test(lowerColor) ||
    isValidRgbColor(color) ||
    isValidRgbaColor(color) ||
    isValidHslColor(color) ||
    isValidHslaColor(color) ||
    NAMED_COLORS.has(lowerColor)
  );
}

/**
 * Sanitizes a color value, returning a safe default if invalid
 * @param color - The color value to sanitize
 * @param defaultColor - The default color to use if invalid
 * @returns A safe color value
 */
function sanitizeColor(color: string | undefined, defaultColor: string): string {
  if (color && isValidColor(color)) {
    return color;
  }
  return defaultColor;
}

/**
 * Map rendering engine
 */
export class MapEngine {
  /**
   * Renders a map to SVG based on the provided configuration
   * @param config - Map rendering configuration
   * @returns Rendered map with SVG content
   */
  renderMap(config: MapRenderConfig): RenderedMap {
    const { style, width, height, markers = [] } = config;
    const backgroundColor = sanitizeColor(config.backgroundColor, '#f0f0f0');
    
    // Calculate bounds
    const bounds = calculateBounds(style.center, style.zoom, width, height);
    
    // Build SVG
    const svgParts: string[] = [];
    
    // SVG header
    svgParts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`);
    
    // Background
    svgParts.push(`<rect width="${width}" height="${height}" fill="${backgroundColor}"/>`);
    
    // Add map tiles placeholder (for now, just a background with border)
    svgParts.push(`<rect width="${width}" height="${height}" fill="#e8e8e8" stroke="#cccccc" stroke-width="1"/>`);
    
    // Add grid lines to simulate map tiles
    this.addGridLines(svgParts, width, height);
    
    // Render markers
    if (markers.length > 0) {
      svgParts.push('<g id="markers">');
      markers.forEach((marker) => {
        const markerSvg = this.renderMarker(marker, style, width, height);
        svgParts.push(markerSvg);
      });
      svgParts.push('</g>');
    }
    
    // Add scale if requested
    if (style.showScale) {
      const scaleSvg = this.renderScale(style.zoom, width, height, style.center);
      svgParts.push(scaleSvg);
    }
    
    // Add attribution if requested
    if (style.showAttribution) {
      const attributionSvg = this.renderAttribution(style.provider, width, height);
      svgParts.push(attributionSvg);
    }
    
    // Close SVG
    svgParts.push('</svg>');
    
    return {
      svg: svgParts.join('\n'),
      width,
      height,
      bounds,
    };
  }
  
  /**
   * Adds decorative grid lines to simulate map tiles
   */
  private addGridLines(svgParts: string[], width: number, height: number): void {
    
    svgParts.push('<g id="grid" opacity="0.3">');
    
    // Vertical lines
    for (let x = 0; x <= width; x += TILE_SIZE) {
      svgParts.push(`<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="#999999" stroke-width="0.5"/>`);
    }
    
    // Horizontal lines
    for (let y = 0; y <= height; y += TILE_SIZE) {
      svgParts.push(`<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="#999999" stroke-width="0.5"/>`);
    }
    
    svgParts.push('</g>');
  }
  
  /**
   * Renders a single marker on the map
   */
  private renderMarker(
    marker: MapMarker,
    style: MapStyle,
    width: number,
    height: number
  ): string {
    const pixel = geoToViewportPixel(marker.location, style.center, style.zoom, width, height);
    
    const color = sanitizeColor(marker.style?.color, '#e74c3c');
    const size = marker.style?.size || 20;
    const shape = marker.style?.shape || 'pin';
    
    const parts: string[] = [];
    parts.push(`<g class="marker" transform="translate(${pixel.x}, ${pixel.y})">`);
    
    switch (shape) {
      case 'circle':
        parts.push(`<circle r="${size / 2}" fill="${color}" stroke="white" stroke-width="2"/>`);
        break;
      case 'square':
        parts.push(
          `<rect x="${-size / 2}" y="${-size / 2}" width="${size}" height="${size}" fill="${color}" stroke="white" stroke-width="2"/>`
        );
        break;
      case 'pin':
      default:
        // Draw a pin shape (teardrop)
        parts.push(`<path d="M 0,0 L -${size * PIN_SHAPE_RATIO},-${size} Q 0,-${size * PIN_HEIGHT_RATIO} ${size * PIN_SHAPE_RATIO},-${size} Z" fill="${color}" stroke="white" stroke-width="2"/>`);
        break;
    }
    
    // Add label if present
    if (marker.label) {
      const labelY = shape === 'pin' ? -size - 5 : 0;
      parts.push(
        `<text x="0" y="${labelY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="black" stroke="white" stroke-width="3" paint-order="stroke">${this.escapeXml(marker.label)}</text>`
      );
    }
    
    parts.push('</g>');
    
    return parts.join('\n');
  }
  
  /**
   * Renders a scale bar on the map
   * @param zoom - The zoom level
   * @param _width - The width of the map (unused but kept for consistency)
   * @param height - The height of the map
   * @param center - The center location of the map, used for accurate scale calculation
   */
  private renderScale(zoom: number, _width: number, height: number, center: GeoLocation): string {
    // Calculate scale in meters per pixel at this zoom level, using center latitude for accuracy
    const metersPerPixel = (156543.03392 * Math.cos((center.latitude * Math.PI) / 180)) / Math.pow(2, zoom);
    
    // Create a scale bar representing a nice round distance
    const scaleWidthPixels = 100;
    const scaleMeters = scaleWidthPixels * metersPerPixel;
    
    // Convert to km if over 1000m
    let scaleText: string;
    if (scaleMeters >= 1000) {
      scaleText = `${(scaleMeters / 1000).toFixed(1)} km`;
    } else {
      scaleText = `${Math.round(scaleMeters)} m`;
    }
    
    const x = 20;
    const y = height - 30;
    
    const parts: string[] = [];
    parts.push(`<g class="scale">`);
    
    // Scale bar background
    parts.push(`<rect x="${x - 5}" y="${y - 5}" width="${scaleWidthPixels + 10}" height="25" fill="white" fill-opacity="0.8" stroke="#333" stroke-width="1"/>`);
    
    // Scale bar
    parts.push(`<line x1="${x}" y1="${y + 10}" x2="${x + scaleWidthPixels}" y2="${y + 10}" stroke="#333" stroke-width="2"/>`);
    parts.push(`<line x1="${x}" y1="${y + 5}" x2="${x}" y2="${y + 15}" stroke="#333" stroke-width="2"/>`);
    parts.push(`<line x1="${x + scaleWidthPixels}" y1="${y + 5}" x2="${x + scaleWidthPixels}" y2="${y + 15}" stroke="#333" stroke-width="2"/>`);
    
    // Scale text
    parts.push(`<text x="${x + scaleWidthPixels / 2}" y="${y + 5}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#333">${this.escapeXml(scaleText)}</text>`);
    
    parts.push('</g>');
    
    return parts.join('\n');
  }
  
  /**
   * Renders attribution text on the map
   */
  private renderAttribution(provider: string, width: number, height: number): string {
    let attributionText = '© OpenStreetMap contributors';
    if (provider === 'custom') {
      attributionText = 'Custom Map';
    }
    
    const x = width - 10;
    const y = height - 10;
    
    return `<text x="${x}" y="${y}" text-anchor="end" font-family="Arial, sans-serif" font-size="10" fill="#666">${this.escapeXml(attributionText)}</text>`;
  }
  
  /**
   * Escapes special XML characters in text
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
  
  /**
   * Creates markers from image-location links
   * @param links - Array of image-location links
   * @returns Array of map markers
   */
  static createMarkersFromLinks(
    links: Array<{ imageId: string; location: GeoLocation; label?: string }>
  ): MapMarker[] {
    return links.map((link) => ({
      location: link.location,
      label: link.label,
      style: {
        color: '#e74c3c',
        size: 20,
        shape: 'pin' as const,
      },
    }));
  }
}

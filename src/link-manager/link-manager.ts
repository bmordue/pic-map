/**
 * Link Manager - Manages connections between pictures and map markers
 * Handles rendering of visual link indicators (lines, numbers, labels)
 */

import {
  GeoLocation,
  ImageLocationLink,
  LinkStyle,
  PixelCoordinate,
  MapStyle,
} from '../types';
import { geoToViewportPixel } from '../map-engine/coordinates';

/**
 * Position information for a picture in the border
 */
export interface PicturePosition {
  /** Unique identifier matching imageId in ImageLocationLink */
  imageId: string;
  /** Pixel coordinates of the picture's center in the overall composition */
  center: PixelCoordinate;
  /** Connection point for link lines (usually edge of picture closest to map) */
  connectionPoint: PixelCoordinate;
  /** Optional label for the picture */
  label?: string;
}

/**
 * Resolved link with all positioning information
 */
export interface ResolvedLink {
  /** Original link data */
  link: ImageLocationLink;
  /** Picture position information */
  picturePosition: PicturePosition;
  /** Marker position on the map (in viewport pixels) */
  markerPosition: PixelCoordinate;
  /** Label to display (from link or auto-generated) */
  label: string;
}

/**
 * Configuration for rendering links
 */
export interface LinkRenderConfig {
  /** Style options for the links */
  style: LinkStyle;
  /** Map style for coordinate conversion */
  mapStyle: MapStyle;
  /** Map viewport dimensions */
  mapViewport: {
    width: number;
    height: number;
    /** Offset of map within the overall composition */
    offsetX: number;
    offsetY: number;
  };
}

/**
 * Result of rendering links
 */
export interface RenderedLinks {
  /** SVG string containing all link visualizations */
  svg: string;
  /** Number of links rendered */
  linkCount: number;
  /** Any warnings or issues encountered */
  warnings: string[];
}

/**
 * Group of links sharing the same location
 */
export interface LocationGroup {
  /** Geographic location shared by the group */
  location: GeoLocation;
  /** Links pointing to this location */
  links: ResolvedLink[];
}

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
  return parseInt(r, 10) <= 255 && parseInt(g, 10) <= 255 && parseInt(b, 10) <= 255;
}

/**
 * Validates RGBA color values (0-255 for RGB, 0-1 for alpha)
 */
function isValidRgbaColor(color: string): boolean {
  const match = color.match(
    /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*([\d.]+)\s*\)$/
  );
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
  const match = color.match(
    /^hsla\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*,\s*([\d.]+)\s*\)$/
  );
  if (!match) return false;
  const [, h, s, l, a] = match;
  const alpha = parseFloat(a);
  return parseInt(h) <= 360 && parseInt(s) <= 100 && parseInt(l) <= 100 && alpha >= 0 && alpha <= 1;
}

const NAMED_COLORS = new Set([
  'aliceblue',
  'antiquewhite',
  'aqua',
  'aquamarine',
  'azure',
  'beige',
  'bisque',
  'black',
  'blanchedalmond',
  'blue',
  'blueviolet',
  'brown',
  'burlywood',
  'cadetblue',
  'chartreuse',
  'chocolate',
  'coral',
  'cornflowerblue',
  'cornsilk',
  'crimson',
  'cyan',
  'darkblue',
  'darkcyan',
  'darkgoldenrod',
  'darkgray',
  'darkgreen',
  'darkgrey',
  'darkkhaki',
  'darkmagenta',
  'darkolivegreen',
  'darkorange',
  'darkorchid',
  'darkred',
  'darksalmon',
  'darkseagreen',
  'darkslateblue',
  'darkslategray',
  'darkslategrey',
  'darkturquoise',
  'darkviolet',
  'deeppink',
  'deepskyblue',
  'dimgray',
  'dimgrey',
  'dodgerblue',
  'firebrick',
  'floralwhite',
  'forestgreen',
  'fuchsia',
  'gainsboro',
  'ghostwhite',
  'gold',
  'goldenrod',
  'gray',
  'green',
  'greenyellow',
  'grey',
  'honeydew',
  'hotpink',
  'indianred',
  'indigo',
  'ivory',
  'khaki',
  'lavender',
  'lavenderblush',
  'lawngreen',
  'lemonchiffon',
  'lightblue',
  'lightcoral',
  'lightcyan',
  'lightgoldenrodyellow',
  'lightgray',
  'lightgreen',
  'lightgrey',
  'lightpink',
  'lightsalmon',
  'lightseagreen',
  'lightskyblue',
  'lightslategray',
  'lightslategrey',
  'lightsteelblue',
  'lightyellow',
  'lime',
  'limegreen',
  'linen',
  'magenta',
  'maroon',
  'mediumaquamarine',
  'mediumblue',
  'mediumorchid',
  'mediumpurple',
  'mediumseagreen',
  'mediumslateblue',
  'mediumspringgreen',
  'mediumturquoise',
  'mediumvioletred',
  'midnightblue',
  'mintcream',
  'mistyrose',
  'moccasin',
  'navajowhite',
  'navy',
  'oldlace',
  'olive',
  'olivedrab',
  'orange',
  'orangered',
  'orchid',
  'palegoldenrod',
  'palegreen',
  'paleturquoise',
  'palevioletred',
  'papayawhip',
  'peachpuff',
  'peru',
  'pink',
  'plum',
  'powderblue',
  'purple',
  'rebeccapurple',
  'red',
  'rosybrown',
  'royalblue',
  'saddlebrown',
  'salmon',
  'sandybrown',
  'seagreen',
  'seashell',
  'sienna',
  'silver',
  'skyblue',
  'slateblue',
  'slategray',
  'slategrey',
  'snow',
  'springgreen',
  'steelblue',
  'tan',
  'teal',
  'thistle',
  'tomato',
  'turquoise',
  'violet',
  'wheat',
  'white',
  'whitesmoke',
  'yellow',
  'yellowgreen',
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
 * Default link style values
 */
const DEFAULT_LINK_STYLE: Required<Omit<LinkStyle, 'labelStyle'>> & {
  labelStyle: Required<NonNullable<LinkStyle['labelStyle']>>;
} = {
  type: 'label',
  lineColor: '#000000',
  lineWidth: 1,
  lineStyle: 'solid',
  labelStyle: {
    fontFamily: 'Arial',
    fontSize: 12,
    color: '#000000',
  },
};

/**
 * Link Manager class for handling picture-to-marker connections
 */
export class LinkManager {
  /**
   * Resolves links by combining link data with picture positions and marker coordinates
   * @param links - Array of image-location links
   * @param picturePositions - Array of picture positions in the border
   * @param config - Link rendering configuration
   * @returns Array of resolved links with all position information
   */
  resolveLinks(
    links: ImageLocationLink[],
    picturePositions: PicturePosition[],
    config: LinkRenderConfig
  ): ResolvedLink[] {
    const positionMap = new Map<string, PicturePosition>();
    picturePositions.forEach((pos) => positionMap.set(pos.imageId, pos));

    const resolvedLinks: ResolvedLink[] = [];
    let labelIndex = 0;

    for (const link of links) {
      const picturePosition = positionMap.get(link.imageId);
      if (!picturePosition) {
        // Picture not found - skip this link
        continue;
      }

      // Convert geographic location to viewport pixel coordinates
      const geoPixel = geoToViewportPixel(
        link.location,
        config.mapStyle.center,
        config.mapStyle.zoom,
        config.mapViewport.width,
        config.mapViewport.height
      );

      // Add map viewport offset to get coordinates in the overall composition
      const markerPosition: PixelCoordinate = {
        x: geoPixel.x + config.mapViewport.offsetX,
        y: geoPixel.y + config.mapViewport.offsetY,
      };

      // Determine label: use provided label, picture label, or auto-generate
      const label =
        link.label ?? picturePosition.label ?? this.generateLabel(labelIndex);

      resolvedLinks.push({
        link,
        picturePosition,
        markerPosition,
        label,
      });

      labelIndex++;
    }

    return resolvedLinks;
  }

  /**
   * Groups links by their geographic location
   * Useful for handling multiple pictures pointing to the same marker
   * @param resolvedLinks - Array of resolved links
   * @returns Array of location groups
   */
  groupLinksByLocation(resolvedLinks: ResolvedLink[]): LocationGroup[] {
    const locationMap = new Map<string, LocationGroup>();

    for (const resolved of resolvedLinks) {
      const key = `${resolved.link.location.latitude},${resolved.link.location.longitude}`;

      if (!locationMap.has(key)) {
        locationMap.set(key, {
          location: resolved.link.location,
          links: [],
        });
      }

      locationMap.get(key)!.links.push(resolved);
    }

    return Array.from(locationMap.values());
  }

  /**
   * Renders link visualizations as SVG
   * @param resolvedLinks - Array of resolved links to render
   * @param config - Link rendering configuration
   * @returns Rendered links result with SVG content
   */
  renderLinks(resolvedLinks: ResolvedLink[], config: LinkRenderConfig): RenderedLinks {
    const style = this.normalizeStyle(config.style);
    const warnings: string[] = [];

    if (style.type === 'none' || resolvedLinks.length === 0) {
      return {
        svg: '',
        linkCount: 0,
        warnings,
      };
    }

    const parts: string[] = [];
    parts.push('<g class="links">');

    // Render based on style type
    if (style.type === 'line' || style.type === 'both') {
      parts.push(this.renderLines(resolvedLinks, style, warnings));
    }

    if (style.type === 'label' || style.type === 'both') {
      parts.push(this.renderLabels(resolvedLinks, style));
    }

    parts.push('</g>');

    return {
      svg: parts.join('\n'),
      linkCount: resolvedLinks.length,
      warnings,
    };
  }

  /**
   * Renders all link elements for a complete composition
   * This is a convenience method that combines resolving and rendering
   * @param links - Array of image-location links
   * @param picturePositions - Array of picture positions
   * @param config - Link rendering configuration
   * @returns Rendered links result
   */
  renderAllLinks(
    links: ImageLocationLink[],
    picturePositions: PicturePosition[],
    config: LinkRenderConfig
  ): RenderedLinks {
    const resolved = this.resolveLinks(links, picturePositions, config);
    return this.renderLinks(resolved, config);
  }

  /**
   * Generates an auto-label for a link
   * Uses letters A-Z, then AA-AZ, BA-BZ, etc.
   * @param index - Zero-based index of the link
   * @returns Generated label string
   */
  private generateLabel(index: number): string {
    if (index < 26) {
      return String.fromCharCode(65 + index); // A-Z
    }

    // For indices >= 26, use AA, AB, etc.
    const firstChar = String.fromCharCode(65 + Math.floor(index / 26) - 1);
    const secondChar = String.fromCharCode(65 + (index % 26));
    return firstChar + secondChar;
  }

  /**
   * Normalizes link style by filling in defaults
   * @param style - Partial style configuration
   * @returns Complete style configuration with defaults applied
   */
  private normalizeStyle(
    style: LinkStyle
  ): Required<Omit<LinkStyle, 'labelStyle'>> & {
    labelStyle: Required<NonNullable<LinkStyle['labelStyle']>>;
  } {
    return {
      type: style.type ?? DEFAULT_LINK_STYLE.type,
      lineColor: sanitizeColor(style.lineColor, DEFAULT_LINK_STYLE.lineColor),
      lineWidth: style.lineWidth ?? DEFAULT_LINK_STYLE.lineWidth,
      lineStyle: style.lineStyle ?? DEFAULT_LINK_STYLE.lineStyle,
      labelStyle: {
        fontFamily: style.labelStyle?.fontFamily ?? DEFAULT_LINK_STYLE.labelStyle.fontFamily,
        fontSize: style.labelStyle?.fontSize ?? DEFAULT_LINK_STYLE.labelStyle.fontSize,
        color: sanitizeColor(style.labelStyle?.color, DEFAULT_LINK_STYLE.labelStyle.color),
      },
    };
  }

  /**
   * Renders connection lines between pictures and markers
   * @param resolvedLinks - Resolved links to render
   * @param style - Normalized style configuration
   * @param warnings - Array to collect warnings
   * @returns SVG string containing line elements
   */
  private renderLines(
    resolvedLinks: ResolvedLink[],
    style: ReturnType<LinkManager['normalizeStyle']>,
    warnings: string[]
  ): string {
    const parts: string[] = [];
    parts.push('<g class="link-lines">');

    // Group links by location to handle multiple pictures per marker
    const groups = this.groupLinksByLocation(resolvedLinks);

    for (const group of groups) {
      if (group.links.length === 1) {
        // Simple case: single link to location
        const resolved = group.links[0];
        parts.push(this.renderSingleLine(resolved, style));
      } else {
        // Multiple pictures point to same location
        // Render lines with slight offsets to avoid complete overlap
        for (let i = 0; i < group.links.length; i++) {
          const resolved = group.links[i];
          const offset = this.calculateMultiLinkOffset(i, group.links.length);
          parts.push(this.renderSingleLine(resolved, style, offset));
        }
        warnings.push(
          `Location "${group.location.name ?? 'unnamed'}" has ${group.links.length} pictures linked to it`
        );
      }
    }

    parts.push('</g>');
    return parts.join('\n');
  }

  /**
   * Renders a single connection line
   * @param resolved - Resolved link data
   * @param style - Normalized style configuration
   * @param offset - Optional offset for the line endpoint (for overlapping lines)
   * @returns SVG line element string
   */
  private renderSingleLine(
    resolved: ResolvedLink,
    style: ReturnType<LinkManager['normalizeStyle']>,
    offset: PixelCoordinate = { x: 0, y: 0 }
  ): string {
    const x1 = resolved.picturePosition.connectionPoint.x;
    const y1 = resolved.picturePosition.connectionPoint.y;
    const x2 = resolved.markerPosition.x + offset.x;
    const y2 = resolved.markerPosition.y + offset.y;

    const strokeDasharray = this.getStrokeDasharray(style.lineStyle);

    return `<line class="link-line" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${style.lineColor}" stroke-width="${style.lineWidth}"${strokeDasharray} data-image-id="${this.escapeXml(resolved.link.imageId)}"/>`;
  }

  /**
   * Gets the stroke-dasharray attribute value for a line style
   * @param lineStyle - Line style type
   * @returns Stroke-dasharray attribute string (including leading space) or empty string
   */
  private getStrokeDasharray(lineStyle: 'solid' | 'dashed' | 'dotted'): string {
    switch (lineStyle) {
      case 'dashed':
        return ' stroke-dasharray="8,4"';
      case 'dotted':
        return ' stroke-dasharray="2,2"';
      case 'solid':
      default:
        return '';
    }
  }

  /**
   * Calculates offset for lines when multiple pictures link to the same location
   * @param index - Index of the link within the group
   * @param total - Total number of links in the group
   * @returns Pixel offset for the line endpoint
   */
  private calculateMultiLinkOffset(index: number, total: number): PixelCoordinate {
    if (total <= 1) {
      return { x: 0, y: 0 };
    }

    // Spread offsets around the marker point
    const angle = ((2 * Math.PI) / total) * index;
    const radius = 5; // Small offset to visually separate lines

    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  }

  /**
   * Renders labels on pictures and markers
   * @param resolvedLinks - Resolved links to render
   * @param style - Normalized style configuration
   * @returns SVG string containing label elements
   */
  private renderLabels(
    resolvedLinks: ResolvedLink[],
    style: ReturnType<LinkManager['normalizeStyle']>
  ): string {
    const parts: string[] = [];
    parts.push('<g class="link-labels">');

    for (const resolved of resolvedLinks) {
      // Label near the picture
      parts.push(this.renderLabelAtPosition(
        resolved.picturePosition.connectionPoint,
        resolved.label,
        style.labelStyle,
        'picture'
      ));

      // Label near the marker
      parts.push(this.renderLabelAtPosition(
        resolved.markerPosition,
        resolved.label,
        style.labelStyle,
        'marker'
      ));
    }

    parts.push('</g>');
    return parts.join('\n');
  }

  /**
   * Renders a label at a specific position
   * @param position - Position for the label
   * @param label - Label text
   * @param labelStyle - Label styling options
   * @param type - Whether this is a picture or marker label
   * @returns SVG group containing the label
   */
  private renderLabelAtPosition(
    position: PixelCoordinate,
    label: string,
    labelStyle: Required<NonNullable<LinkStyle['labelStyle']>>,
    type: 'picture' | 'marker'
  ): string {
    const escapedLabel = this.escapeXml(label);
    const fontSize = labelStyle.fontSize;
    const radius = fontSize * 0.7;
    const bgColor = type === 'marker' ? '#ffffff' : '#f0f0f0';
    const borderColor = labelStyle.color;

    // Position offset based on type
    const offsetY = type === 'marker' ? -radius - 10 : 0;

    const parts: string[] = [];
    parts.push(
      `<g class="link-label link-label-${type}" transform="translate(${position.x}, ${position.y + offsetY})">`
    );

    // Background circle
    parts.push(
      `<circle r="${radius}" fill="${bgColor}" stroke="${borderColor}" stroke-width="1"/>`
    );

    // Label text
    parts.push(
      `<text text-anchor="middle" dominant-baseline="central" font-family="${labelStyle.fontFamily}, sans-serif" font-size="${fontSize}" font-weight="bold" fill="${labelStyle.color}">${escapedLabel}</text>`
    );

    parts.push('</g>');
    return parts.join('\n');
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
   * Validates that all image IDs in links have corresponding picture positions
   * @param links - Array of image-location links
   * @param picturePositions - Array of picture positions
   * @returns Array of validation error messages
   */
  static validateLinks(
    links: ImageLocationLink[],
    picturePositions: PicturePosition[]
  ): string[] {
    const errors: string[] = [];
    const positionIds = new Set(picturePositions.map((p) => p.imageId));

    for (const link of links) {
      if (!positionIds.has(link.imageId)) {
        errors.push(`Link references image ID "${link.imageId}" which has no position`);
      }
    }

    return errors;
  }

  /**
   * Creates picture positions from an array of pictures with border layout info
   * This is a helper for simple rectangular border layouts
   * @param pictureCount - Number of pictures
   * @param borderConfig - Border layout configuration
   * @returns Array of picture positions
   */
  static createPicturePositions(
    pictureCount: number,
    borderConfig: {
      totalWidth: number;
      totalHeight: number;
      borderWidth: number;
      mapOffsetX: number;
      mapOffsetY: number;
      mapWidth: number;
      mapHeight: number;
    }
  ): PicturePosition[] {
    const positions: PicturePosition[] = [];

    if (pictureCount === 0) {
      return positions;
    }

    // Calculate center X and Y of the map area
    const mapCenterX = borderConfig.mapOffsetX + borderConfig.mapWidth / 2;
    const mapCenterY = borderConfig.mapOffsetY + borderConfig.mapHeight / 2;

    const labelGenerator = (i: number) =>
      i < 26
        ? String.fromCharCode(65 + i)
        : String.fromCharCode(65 + Math.floor(i / 26) - 1) + String.fromCharCode(65 + (i % 26));

    // Distribute pictures evenly around the perimeter
    // Calculate the perimeter and place pictures at equal intervals
    const innerWidth = borderConfig.totalWidth - 2 * borderConfig.borderWidth;
    const innerHeight = borderConfig.totalHeight - 2 * borderConfig.borderWidth;
    const perimeter = 2 * innerWidth + 2 * innerHeight;
    const spacing = perimeter / pictureCount;

    for (let index = 0; index < pictureCount; index++) {
      // Calculate position along perimeter
      const distance = index * spacing + spacing / 2;

      let x: number;
      let y: number;
      let connectionX: number;
      let connectionY: number;

      if (distance < innerWidth) {
        // Top edge
        x = borderConfig.borderWidth + distance;
        y = borderConfig.borderWidth / 2;
        connectionX = x;
        connectionY = borderConfig.borderWidth;
      } else if (distance < innerWidth + innerHeight) {
        // Right edge
        x = borderConfig.totalWidth - borderConfig.borderWidth / 2;
        y = borderConfig.borderWidth + (distance - innerWidth);
        connectionX = borderConfig.totalWidth - borderConfig.borderWidth;
        connectionY = y;
      } else if (distance < 2 * innerWidth + innerHeight) {
        // Bottom edge (reversed direction)
        x = borderConfig.totalWidth - borderConfig.borderWidth - (distance - innerWidth - innerHeight);
        y = borderConfig.totalHeight - borderConfig.borderWidth / 2;
        connectionX = x;
        connectionY = borderConfig.totalHeight - borderConfig.borderWidth;
      } else {
        // Left edge (reversed direction)
        x = borderConfig.borderWidth / 2;
        y = borderConfig.totalHeight - borderConfig.borderWidth - (distance - 2 * innerWidth - innerHeight);
        connectionX = borderConfig.borderWidth;
        connectionY = y;
      }

      positions.push({
        imageId: index.toString(),
        center: { x, y },
        connectionPoint: { x: connectionX, y: connectionY },
        label: labelGenerator(index),
      });
    }

    // Update connection points to point toward map center for cleaner lines
    for (const pos of positions) {
      // Adjust connection point to be on the edge closest to map
      const dx = mapCenterX - pos.center.x;
      const dy = mapCenterY - pos.center.y;
      const magnitude = Math.sqrt(dx * dx + dy * dy);

      if (magnitude > 0) {
        // Normalize and scale to border width
        const scale = (borderConfig.borderWidth * 0.4) / magnitude;
        pos.connectionPoint = {
          x: pos.center.x + dx * scale,
          y: pos.center.y + dy * scale,
        };
      }
    }

    return positions;
  }
}

/**
 * Main compositor module for combining map and picture border elements
 */

import { PictureBorderStyle, LinkStyle } from '../types';
import {
  CompositorConfig,
  CompositionInput,
  CompositionLayout,
  RenderedComposition,
  PositionedPicture,
  LinkLine,
  Dimensions,
} from './types';
import { createCompositionLayout } from './layout-engine';
import { getPageDimensionsMm, DEFAULT_DPI, validateDpi } from './page-sizes';

/**
 * Default picture border style
 */
const DEFAULT_PICTURE_BORDER_STYLE: Required<PictureBorderStyle> = {
  backgroundColor: '#ffffff',
  borderColor: '#333333',
  borderThickness: 2,
  cornerRadius: 4,
};

/**
 * Default link style
 */
const DEFAULT_LINK_STYLE: LinkStyle = {
  type: 'both',
  lineColor: '#666666',
  lineWidth: 1,
  lineStyle: 'solid',
  labelStyle: {
    fontFamily: 'Arial, sans-serif',
    fontSize: 12,
    color: '#333333',
  },
};

/**
 * Regex pattern for validating hex CSS color values.
 * Supports 3-digit (#RGB) and 6-digit (#RRGGBB) formats.
 * Note: 8-digit hex colors with alpha channels (#RRGGBBAA) are not supported.
 * For print output, alpha channels are generally avoided in favor of solid colors.
 */
const HEX_COLOR_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * Named CSS colors
 */
const NAMED_COLORS = new Set([
  'black',
  'white',
  'red',
  'green',
  'blue',
  'yellow',
  'orange',
  'purple',
  'gray',
  'grey',
  'transparent',
]);

/**
 * Validates a CSS color value
 */
function isValidColor(color: string): boolean {
  if (!color || typeof color !== 'string') return false;
  const lowerColor = color.toLowerCase().trim();
  return HEX_COLOR_PATTERN.test(lowerColor) || NAMED_COLORS.has(lowerColor);
}

/**
 * Sanitizes a color value
 */
function sanitizeColor(color: string | undefined, defaultColor: string): string {
  if (color && isValidColor(color)) return color;
  return defaultColor;
}

/**
 * Escapes special XML characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Compositor class for combining map and picture border elements
 */
export class Compositor {
  private config: CompositorConfig;
  private pictureStyle: Required<PictureBorderStyle>;
  private linkStyle: LinkStyle;

  /**
   * Creates a new Compositor instance
   * @param config - Compositor configuration
   */
  constructor(config: CompositorConfig) {
    this.config = {
      ...config,
      dpi: validateDpi(config.dpi ?? DEFAULT_DPI),
    };

    this.pictureStyle = {
      ...DEFAULT_PICTURE_BORDER_STYLE,
      ...config.pictureBorderStyle,
    };

    this.linkStyle = {
      ...DEFAULT_LINK_STYLE,
      ...config.linkStyle,
      labelStyle: {
        ...DEFAULT_LINK_STYLE.labelStyle,
        ...config.linkStyle?.labelStyle,
      },
    };
  }

  /**
   * Creates a composition layout without rendering
   * @param input - Composition input data
   * @returns Composition layout
   */
  createLayout(input: CompositionInput): CompositionLayout {
    return createCompositionLayout(this.config, input);
  }

  /**
   * Renders the complete composition to SVG
   * @param input - Composition input data
   * @returns Rendered composition
   */
  render(input: CompositionInput): RenderedComposition {
    const layout = this.createLayout(input);
    const svgParts: string[] = [];
    const defsParts: string[] = [];

    const dpi = this.config.dpi ?? DEFAULT_DPI;

    // SVG header
    svgParts.push(
      `<svg xmlns="http://www.w3.org/2000/svg" ` +
        `width="${layout.pageDimensions.width}" height="${layout.pageDimensions.height}" ` +
        `viewBox="0 0 ${layout.pageDimensions.width} ${layout.pageDimensions.height}">`
    );

    // Collect defs for pictures (clip paths and gradients)
    this.collectPictureDefs(layout.pictures, defsParts);

    // Add collected defs
    if (defsParts.length > 0) {
      svgParts.push('<defs>');
      svgParts.push(...defsParts);
      svgParts.push('</defs>');
    }

    // Background
    svgParts.push(
      `<rect width="${layout.pageDimensions.width}" height="${layout.pageDimensions.height}" fill="#ffffff"/>`
    );

    // Render border backgrounds
    svgParts.push(this.renderBorderBackgrounds(layout));

    // Render map area (embedded from input)
    svgParts.push(this.renderMapArea(input, layout));

    // Render link lines (behind pictures if type includes lines)
    if (this.linkStyle.type === 'line' || this.linkStyle.type === 'both') {
      svgParts.push(this.renderLinkLines(layout.links));
    }

    // Render pictures
    svgParts.push(this.renderPictures(layout.pictures));

    // Render link labels
    if (this.linkStyle.type === 'label' || this.linkStyle.type === 'both') {
      svgParts.push(this.renderLinkLabels(layout.pictures));
    }

    // Close SVG
    svgParts.push('</svg>');

    // Get page size in mm
    const pageSizeMm = getPageDimensionsMm(
      this.config.pageSize,
      this.config.orientation,
      this.config.customDimensions
    );

    return {
      svg: svgParts.join('\n'),
      width: layout.pageDimensions.width,
      height: layout.pageDimensions.height,
      dpi,
      pageSizeMm,
    };
  }

  /**
   * Collects SVG defs for all pictures (clip paths and gradients)
   */
  private collectPictureDefs(pictures: PositionedPicture[], defsParts: string[]): void {
    const borderThickness = this.pictureStyle.borderThickness ?? 2;
    const innerPadding = borderThickness + 2;

    for (const picture of pictures) {
      const { rect } = picture;
      const x = rect.x + innerPadding;
      const y = rect.y + innerPadding;
      const width = Math.max(0, rect.width - 2 * innerPadding);
      const height = Math.max(0, rect.height - 2 * innerPadding);

      // Clip path for the image area
      const clipId = `image-clip-${picture.imageIndex}`;
      defsParts.push(
        `<clipPath id="${clipId}"><rect x="${x}" y="${y}" width="${width}" height="${height}"/></clipPath>`
      );

      // Vignette gradient
      defsParts.push(
        `<radialGradient id="vignette-${picture.imageIndex}" cx="50%" cy="50%" r="70%">` +
          `<stop offset="0%" stop-color="transparent"/>` +
          `<stop offset="100%" stop-color="black"/>` +
          `</radialGradient>`
      );
    }
  }

  /**
   * Generates a preview at a lower resolution
   * @param input - Composition input data
   * @param previewDpi - DPI for preview (default 72)
   * @returns Rendered composition at preview resolution
   */
  preview(input: CompositionInput, previewDpi = 72): RenderedComposition {
    // Create a temporary compositor with lower DPI
    const previewConfig: CompositorConfig = {
      ...this.config,
      dpi: validateDpi(previewDpi),
    };

    // Scale the map to fit the preview size
    const previewCompositor = new Compositor(previewConfig);

    // Scale the input map dimensions
    const scaleFactor = previewDpi / (this.config.dpi ?? DEFAULT_DPI);
    const scaledInput: CompositionInput = {
      ...input,
      map: {
        ...input.map,
        width: Math.round(input.map.width * scaleFactor),
        height: Math.round(input.map.height * scaleFactor),
      },
      links: input.links.map((link) => ({
        ...link,
        markerPosition: {
          x: link.markerPosition.x * scaleFactor,
          y: link.markerPosition.y * scaleFactor,
        },
      })),
    };

    return previewCompositor.render(scaledInput);
  }

  /**
   * Renders the border background areas
   */
  private renderBorderBackgrounds(layout: CompositionLayout): string {
    const parts: string[] = [];
    const bgColor = sanitizeColor(this.pictureStyle.backgroundColor, '#ffffff');

    parts.push('<g class="border-backgrounds">');

    for (const [, area] of Object.entries(layout.borderAreas)) {
      parts.push(
        `<rect x="${area.x}" y="${area.y}" width="${area.width}" height="${area.height}" fill="${bgColor}"/>`
      );
    }

    parts.push('</g>');

    return parts.join('\n');
  }

  /**
   * Renders the map area with the provided map SVG
   */
  private renderMapArea(input: CompositionInput, layout: CompositionLayout): string {
    const parts: string[] = [];
    const mapArea = layout.mapArea;

    parts.push(`<g class="map-area" transform="translate(${mapArea.x}, ${mapArea.y})">`);

    // Clip the map to the map area
    parts.push(`<defs>`);
    parts.push(
      `<clipPath id="map-clip"><rect width="${mapArea.width}" height="${mapArea.height}"/></clipPath>`
    );
    parts.push(`</defs>`);

    parts.push(`<g clip-path="url(#map-clip)">`);

    // Scale the map SVG to fit the map area if needed
    const scaleX = mapArea.width / input.map.width;
    const scaleY = mapArea.height / input.map.height;
    const scale = Math.min(scaleX, scaleY);
    const needsScaling = scale !== 1;

    // Extract inner SVG content (remove the outer <svg> tags)
    const mapContent = this.extractSvgContent(input.map.svg);

    // Apply scaling transform if needed, then add map content
    if (needsScaling) {
      parts.push(`<g transform="scale(${scale})">`);
      parts.push(mapContent);
      parts.push('</g>');
    } else {
      parts.push(mapContent);
    }

    parts.push('</g>');
    parts.push('</g>');

    return parts.join('\n');
  }

  /**
   * Extracts the content from an SVG string (removes outer svg tags).
   * Note: This uses simple regex replacement which works for well-formed SVG
   * with a single root <svg> element. For complex SVG with nested <svg> elements,
   * a proper XML parser would be more robust.
   */
  private extractSvgContent(svg: string): string {
    // Remove opening <svg ...> tag (handles both <svg ...> and self-closing won't have content)
    let content = svg.replace(/<svg[^>]*>/i, '');
    // Remove closing </svg> tag
    content = content.replace(/<\/svg>/i, '');
    return content.trim();
  }

  /**
   * Renders the link lines between pictures and map markers
   */
  private renderLinkLines(links: LinkLine[]): string {
    const parts: string[] = [];
    const lineColor = sanitizeColor(this.linkStyle.lineColor, '#666666');
    const lineWidth = this.linkStyle.lineWidth ?? 1;
    const lineStyle = this.linkStyle.lineStyle ?? 'solid';

    let strokeDasharray = '';
    if (lineStyle === 'dashed') {
      strokeDasharray = ` stroke-dasharray="${lineWidth * 4} ${lineWidth * 2}"`;
    } else if (lineStyle === 'dotted') {
      strokeDasharray = ` stroke-dasharray="${lineWidth} ${lineWidth * 2}"`;
    }

    parts.push('<g class="link-lines">');

    for (const link of links) {
      parts.push(
        `<line x1="${link.start.x}" y1="${link.start.y}" ` +
          `x2="${link.end.x}" y2="${link.end.y}" ` +
          `stroke="${lineColor}" stroke-width="${lineWidth}"${strokeDasharray}/>`
      );
    }

    parts.push('</g>');

    return parts.join('\n');
  }

  /**
   * Renders the picture frames
   */
  private renderPictures(pictures: PositionedPicture[]): string {
    const parts: string[] = [];
    const borderColor = sanitizeColor(this.pictureStyle.borderColor, '#333333');
    const bgColor = sanitizeColor(this.pictureStyle.backgroundColor, '#ffffff');
    const borderThickness = this.pictureStyle.borderThickness ?? 2;
    const cornerRadius = this.pictureStyle.cornerRadius ?? 0;

    parts.push('<g class="pictures">');

    for (const picture of pictures) {
      const { rect } = picture;

      parts.push(`<g class="picture" data-index="${picture.imageIndex}">`);

      // Picture frame background
      parts.push(
        `<rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" ` +
          `fill="${bgColor}" stroke="${borderColor}" stroke-width="${borderThickness}" ` +
          `rx="${cornerRadius}" ry="${cornerRadius}"/>`
      );

      // Render a stylized placeholder image that looks like a photograph
      const innerPadding = borderThickness + 2;
      const innerX = rect.x + innerPadding;
      const innerY = rect.y + innerPadding;
      const innerWidth = Math.max(0, rect.width - 2 * innerPadding);
      const innerHeight = Math.max(0, rect.height - 2 * innerPadding);

      parts.push(this.renderImagePlaceholder(innerX, innerY, innerWidth, innerHeight, picture));

      // Add image path as title for accessibility
      parts.push(`<title>${escapeXml(picture.image.filePath)}</title>`);

      parts.push('</g>');
    }

    parts.push('</g>');

    return parts.join('\n');
  }

  /**
   * Renders a stylized placeholder image that simulates a photograph
   */
  private renderImagePlaceholder(
    x: number,
    y: number,
    width: number,
    height: number,
    picture: PositionedPicture
  ): string {
    const parts: string[] = [];

    // Use the image index to generate different placeholder styles
    const colorSchemes = [
      { sky: '#87CEEB', ground: '#90EE90', accent: '#FFD700' }, // Blue sky, green landscape, gold accent
      { sky: '#4682B4', ground: '#708090', accent: '#CD853F' }, // Steel blue sky, slate ground
      { sky: '#FF6B6B', ground: '#4ECDC4', accent: '#FFE66D' }, // Sunset colors
      { sky: '#2C3E50', ground: '#34495E', accent: '#E74C3C' }, // Dark urban
      { sky: '#E8D5B7', ground: '#8B7355', accent: '#F5DEB3' }, // Sepia/vintage
      { sky: '#6B5B95', ground: '#88B04B', accent: '#F7CAC9' }, // Purple dusk
    ];

    const scheme = colorSchemes[picture.imageIndex % colorSchemes.length];
    const skyHeight = height * 0.6;
    const groundHeight = height * 0.4;

    // Use the pre-defined clip path (defined in collectPictureDefs)
    const clipId = `image-clip-${picture.imageIndex}`;
    parts.push(`<g clip-path="url(#${clipId})">`);

    // Sky/background gradient
    parts.push(
      `<rect x="${x}" y="${y}" width="${width}" height="${skyHeight}" fill="${scheme.sky}"/>`
    );

    // Ground/foreground
    parts.push(
      `<rect x="${x}" y="${y + skyHeight}" width="${width}" height="${groundHeight}" fill="${scheme.ground}"/>`
    );

    // Add some decorative elements based on the image type
    const centerX = x + width / 2;

    // Sun or moon
    parts.push(
      `<circle cx="${x + width * 0.8}" cy="${y + height * 0.25}" r="${Math.min(width, height) * 0.08}" fill="${scheme.accent}" opacity="0.9"/>`
    );

    // Simple silhouette (building, mountain, or landmark shape based on index)
    const silhouetteY = y + skyHeight;
    const silhouetteHeight = groundHeight * 0.8;

    switch (picture.imageIndex % 4) {
      case 0:
        // Tower/building silhouette (like Big Ben)
        parts.push(
          `<rect x="${centerX - 8}" y="${silhouetteY - silhouetteHeight}" width="16" height="${silhouetteHeight}" fill="rgba(0,0,0,0.3)"/>`
        );
        parts.push(
          `<polygon points="${centerX},${silhouetteY - silhouetteHeight - 15} ${centerX - 5},${silhouetteY - silhouetteHeight} ${centerX + 5},${silhouetteY - silhouetteHeight}" fill="rgba(0,0,0,0.3)"/>`
        );
        break;
      case 1:
        // Bridge silhouette
        parts.push(
          `<path d="M ${x} ${silhouetteY} Q ${centerX} ${silhouetteY - silhouetteHeight * 0.7} ${x + width} ${silhouetteY}" fill="none" stroke="rgba(0,0,0,0.3)" stroke-width="4"/>`
        );
        parts.push(
          `<rect x="${centerX - 5}" y="${silhouetteY - silhouetteHeight}" width="10" height="${silhouetteHeight}" fill="rgba(0,0,0,0.3)"/>`
        );
        parts.push(
          `<rect x="${centerX + 25}" y="${silhouetteY - silhouetteHeight}" width="10" height="${silhouetteHeight}" fill="rgba(0,0,0,0.3)"/>`
        );
        break;
      case 2: {
        // Ferris wheel silhouette (like London Eye)
        const wheelRadius = Math.min(width, height) * 0.25;
        parts.push(
          `<circle cx="${centerX}" cy="${silhouetteY - wheelRadius}" r="${wheelRadius}" fill="none" stroke="rgba(0,0,0,0.3)" stroke-width="3"/>`
        );
        parts.push(
          `<line x1="${centerX}" y1="${silhouetteY}" x2="${centerX}" y2="${silhouetteY - wheelRadius * 2}" stroke="rgba(0,0,0,0.3)" stroke-width="2"/>`
        );
        break;
      }
      case 3:
      default:
        // Mountain/landscape silhouette
        parts.push(
          `<polygon points="${x},${silhouetteY} ${centerX - 30},${silhouetteY - silhouetteHeight * 0.5} ${centerX},${silhouetteY - silhouetteHeight} ${centerX + 30},${silhouetteY - silhouetteHeight * 0.6} ${x + width},${silhouetteY}" fill="rgba(0,0,0,0.2)"/>`
        );
        break;
    }

    // Add a subtle vignette effect (using pre-defined gradient from collectPictureDefs)
    parts.push(
      `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="url(#vignette-${picture.imageIndex})" opacity="0.3"/>`
    );

    // Add caption text if present
    if (picture.image.caption) {
      const captionY = y + height - 8;
      const captionX = x + 5;
      // Background for caption
      parts.push(
        `<rect x="${captionX - 2}" y="${captionY - 10}" width="${width - 6}" height="14" fill="rgba(0,0,0,0.5)" rx="2"/>`
      );
      parts.push(
        `<text x="${captionX}" y="${captionY}" font-family="Arial, sans-serif" font-size="9" fill="white">${escapeXml(picture.image.caption.substring(0, 30))}</text>`
      );
    }

    parts.push('</g>');

    return parts.join('\n');
  }

  /**
   * Renders labels on the pictures
   */
  private renderLinkLabels(pictures: PositionedPicture[]): string {
    const parts: string[] = [];
    const labelStyle = this.linkStyle.labelStyle ?? DEFAULT_LINK_STYLE.labelStyle;
    const fontFamily = labelStyle?.fontFamily ?? 'Arial, sans-serif';
    const fontSize = labelStyle?.fontSize ?? 12;
    const color = sanitizeColor(labelStyle?.color, '#333333');

    parts.push('<g class="link-labels">');

    for (const picture of pictures) {
      if (!picture.label) continue;

      const { rect } = picture;
      const labelX = rect.x + rect.width / 2;
      const labelY = rect.y + rect.height / 2;

      // Label background circle
      const circleRadius = fontSize * 0.8;
      parts.push(
        `<circle cx="${labelX}" cy="${labelY}" r="${circleRadius}" ` +
          `fill="white" stroke="${color}" stroke-width="1"/>`
      );

      // Label text
      parts.push(
        `<text x="${labelX}" y="${labelY}" ` +
          `text-anchor="middle" dominant-baseline="central" ` +
          `font-family="${escapeXml(fontFamily)}" font-size="${fontSize}" ` +
          `font-weight="bold" fill="${color}">${escapeXml(picture.label)}</text>`
      );
    }

    parts.push('</g>');

    return parts.join('\n');
  }

  /**
   * Gets the current configuration
   */
  getConfig(): CompositorConfig {
    return { ...this.config };
  }

  /**
   * Gets the page dimensions in pixels
   */
  getPageDimensionsPixels(): Dimensions {
    const pageDimensionsMm = getPageDimensionsMm(
      this.config.pageSize,
      this.config.orientation,
      this.config.customDimensions
    );
    const dpi = this.config.dpi ?? DEFAULT_DPI;

    return {
      width: Math.round((pageDimensionsMm.width * dpi) / 25.4),
      height: Math.round((pageDimensionsMm.height * dpi) / 25.4),
    };
  }
}

/**
 * Creates a compositor from a PicMapConfig layout
 * @param layout - Layout options from PicMapConfig
 * @param pictureBorder - Optional picture border style
 * @param linkStyle - Optional link style
 * @returns Configured compositor
 */
export function createCompositorFromLayout(
  layout: {
    pageSize: 'A4' | 'Letter' | 'A3' | 'custom';
    customDimensions?: { width: number; height: number };
    orientation: 'portrait' | 'landscape';
    borderWidth: number;
    pictureSpacing: number;
    margin: { top: number; right: number; bottom: number; left: number };
  },
  pictureBorder?: PictureBorderStyle,
  linkStyle?: LinkStyle,
  dpi?: number
): Compositor {
  return new Compositor({
    pageSize: layout.pageSize,
    customDimensions: layout.customDimensions,
    orientation: layout.orientation,
    borderWidth: layout.borderWidth,
    pictureSpacing: layout.pictureSpacing,
    margin: layout.margin,
    dpi,
    pictureBorderStyle: pictureBorder,
    linkStyle,
  });
}

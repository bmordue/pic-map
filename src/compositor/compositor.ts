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

    const dpi = this.config.dpi ?? DEFAULT_DPI;

    // SVG header
    svgParts.push(
      `<svg xmlns="http://www.w3.org/2000/svg" ` +
        `width="${layout.pageDimensions.width}" height="${layout.pageDimensions.height}" ` +
        `viewBox="0 0 ${layout.pageDimensions.width} ${layout.pageDimensions.height}">`
    );

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
      parts.push(`<rect x="${area.x}" y="${area.y}" width="${area.width}" height="${area.height}" fill="${bgColor}"/>`);
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

      // Placeholder for image (in a real implementation, this would embed or reference the image)
      // For now, we show a placeholder with the image path
      const placeholderColor = '#e0e0e0';
      const innerPadding = borderThickness + 2;
      parts.push(
        `<rect x="${rect.x + innerPadding}" y="${rect.y + innerPadding}" ` +
          `width="${Math.max(0, rect.width - 2 * innerPadding)}" ` +
          `height="${Math.max(0, rect.height - 2 * innerPadding)}" ` +
          `fill="${placeholderColor}"/>`
      );

      // Add image path as title for accessibility
      parts.push(`<title>${escapeXml(picture.image.filePath)}</title>`);

      parts.push('</g>');
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

/**
 * Picture Border Engine - Renders picture borders around a map
 */

import {
  ImageMetadata,
  PictureBorderStyle,
  LayoutOptions,
  RenderedPictureBorder,
  PositionedPicture,
  BorderLayout,
} from '../types';
import { calculateBorderLayout, positionPicturesInSlots, DEFAULT_DPI } from './layout';

/**
 * Configuration for picture border rendering
 */
export interface PictureBorderRenderConfig {
  /** Layout options (page size, margins, etc.) */
  layout: LayoutOptions;
  /** Images to place in the border */
  images: ImageMetadata[];
  /** Optional styling for picture frames */
  style?: PictureBorderStyle;
  /** Optional links for labels */
  links?: Array<{ imageId: string; label?: string }>;
  /** DPI for print quality (default: 300) */
  dpi?: number;
  /** Background color for the entire border area */
  borderBackgroundColor?: string;
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
  return (
    parseInt(r, 10) <= 255 &&
    parseInt(g, 10) <= 255 &&
    parseInt(b, 10) <= 255 &&
    alpha >= 0 &&
    alpha <= 1
  );
}

/**
 * Common named CSS colors
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
  'pink',
  'gray',
  'grey',
  'brown',
  'cyan',
  'magenta',
  'lime',
  'maroon',
  'navy',
  'olive',
  'teal',
  'aqua',
  'silver',
  'fuchsia',
  'transparent',
]);

/**
 * Validates a CSS color value for use in SVG attributes
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
    NAMED_COLORS.has(lowerColor)
  );
}

/**
 * Sanitizes a color value, returning a safe default if invalid
 */
function sanitizeColor(color: string | undefined, defaultColor: string): string {
  if (color && isValidColor(color)) {
    return color;
  }
  return defaultColor;
}

/**
 * Picture Border Engine for rendering picture borders around maps
 */
export class PictureBorderEngine {
  /**
   * Renders a picture border based on the provided configuration
   * @param config - Picture border rendering configuration
   * @returns Rendered picture border with SVG content
   */
  renderBorder(config: PictureBorderRenderConfig): RenderedPictureBorder {
    const dpi = config.dpi || DEFAULT_DPI;
    const style = this.normalizeStyle(config.style);

    // Calculate the border layout
    const layout = calculateBorderLayout(config.layout, config.images.length, dpi);

    // Position pictures in slots
    const positionedPictures = positionPicturesInSlots(config.images, layout.slots, config.links);

    // Build SVG
    const svg = this.buildSvg(layout, positionedPictures, style, config.borderBackgroundColor);

    return {
      svg,
      width: layout.pageWidth,
      height: layout.pageHeight,
      layout,
      positionedPictures,
    };
  }

  /**
   * Normalizes style options with defaults
   */
  private normalizeStyle(style?: PictureBorderStyle): Required<PictureBorderStyle> {
    return {
      backgroundColor: sanitizeColor(style?.backgroundColor, '#ffffff'),
      borderColor: sanitizeColor(style?.borderColor, '#333333'),
      borderThickness: style?.borderThickness ?? 2,
      cornerRadius: style?.cornerRadius ?? 0,
    };
  }

  /**
   * Builds the complete SVG for the picture border
   */
  private buildSvg(
    layout: BorderLayout,
    positionedPictures: PositionedPicture[],
    style: Required<PictureBorderStyle>,
    borderBackgroundColor?: string
  ): string {
    const parts: string[] = [];

    // SVG header
    parts.push(
      `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
        `width="${layout.pageWidth}" height="${layout.pageHeight}" ` +
        `viewBox="0 0 ${layout.pageWidth} ${layout.pageHeight}">`
    );

    // Definitions for patterns and masks
    parts.push('<defs>');
    // Add clip paths for rounded corners if needed
    if (style.cornerRadius > 0) {
      positionedPictures.forEach((pic, idx) => {
        parts.push(
          `<clipPath id="clip-${idx}">` +
            `<rect x="${pic.slot.x + pic.offsetX}" y="${pic.slot.y + pic.offsetY}" ` +
            `width="${pic.renderWidth}" height="${pic.renderHeight}" ` +
            `rx="${style.cornerRadius}" ry="${style.cornerRadius}"/>` +
            `</clipPath>`
        );
      });
    }
    parts.push('</defs>');

    // Background for the border areas
    const bgColor = sanitizeColor(borderBackgroundColor, '#f5f5f5');
    this.addBorderBackground(parts, layout, bgColor);

    // Inner area (where map will be placed) - leave transparent
    parts.push(
      `<rect x="${layout.innerArea.x}" y="${layout.innerArea.y}" ` +
        `width="${layout.innerArea.width}" height="${layout.innerArea.height}" ` +
        `fill="none" stroke="#cccccc" stroke-width="1" stroke-dasharray="5,5"/>`
    );

    // Render picture frames
    parts.push('<g id="picture-frames">');
    positionedPictures.forEach((pic, idx) => {
      this.renderPictureFrame(parts, pic, style, idx);
    });
    parts.push('</g>');

    // Close SVG
    parts.push('</svg>');

    return parts.join('\n');
  }

  /**
   * Adds background rectangles for the border areas
   */
  private addBorderBackground(parts: string[], layout: BorderLayout, color: string): void {
    const { pageWidth, pageHeight, borderWidth, margin, innerArea } = layout;

    // Top border area
    parts.push(
      `<rect x="${margin.left}" y="${margin.top}" ` +
        `width="${pageWidth - margin.left - margin.right}" height="${borderWidth}" ` +
        `fill="${color}"/>`
    );

    // Bottom border area
    parts.push(
      `<rect x="${margin.left}" y="${pageHeight - margin.bottom - borderWidth}" ` +
        `width="${pageWidth - margin.left - margin.right}" height="${borderWidth}" ` +
        `fill="${color}"/>`
    );

    // Left border area (excluding corners)
    parts.push(
      `<rect x="${margin.left}" y="${innerArea.y}" ` +
        `width="${borderWidth}" height="${innerArea.height}" ` +
        `fill="${color}"/>`
    );

    // Right border area (excluding corners)
    parts.push(
      `<rect x="${pageWidth - margin.right - borderWidth}" y="${innerArea.y}" ` +
        `width="${borderWidth}" height="${innerArea.height}" ` +
        `fill="${color}"/>`
    );
  }

  /**
   * Renders a single picture frame
   */
  private renderPictureFrame(
    parts: string[],
    pic: PositionedPicture,
    style: Required<PictureBorderStyle>,
    index: number
  ): void {
    const x = pic.slot.x + pic.offsetX;
    const y = pic.slot.y + pic.offsetY;

    parts.push(`<g class="picture-frame" data-slot="${pic.slot.id}">`);

    // Background rectangle
    parts.push(
      `<rect x="${x}" y="${y}" width="${pic.renderWidth}" height="${pic.renderHeight}" ` +
        `fill="${style.backgroundColor}" rx="${style.cornerRadius}" ry="${style.cornerRadius}"/>`
    );

    // Image placeholder (in actual use, this would be an <image> element)
    // Using a pattern to indicate where the image would go
    const useClipPath = style.cornerRadius > 0 ? ` clip-path="url(#clip-${index})"` : '';
    parts.push(
      `<rect x="${x}" y="${y}" width="${pic.renderWidth}" height="${pic.renderHeight}" ` +
        `fill="#e0e0e0"${useClipPath}/>`
    );

    // Image placeholder cross pattern
    parts.push(
      `<line x1="${x}" y1="${y}" x2="${x + pic.renderWidth}" y2="${y + pic.renderHeight}" ` +
        `stroke="#cccccc" stroke-width="1"${useClipPath}/>`
    );
    parts.push(
      `<line x1="${x + pic.renderWidth}" y1="${y}" x2="${x}" y2="${y + pic.renderHeight}" ` +
        `stroke="#cccccc" stroke-width="1"${useClipPath}/>`
    );

    // Border
    if (style.borderThickness > 0) {
      parts.push(
        `<rect x="${x}" y="${y}" width="${pic.renderWidth}" height="${pic.renderHeight}" ` +
          `fill="none" stroke="${style.borderColor}" stroke-width="${style.borderThickness}" ` +
          `rx="${style.cornerRadius}" ry="${style.cornerRadius}"/>`
      );
    }

    // Label badge
    if (pic.label) {
      this.renderLabel(parts, pic, style);
    }

    parts.push('</g>');
  }

  /**
   * Renders a label badge on a picture
   */
  private renderLabel(
    parts: string[],
    pic: PositionedPicture,
    style: Required<PictureBorderStyle>
  ): void {
    const x = pic.slot.x + pic.offsetX;
    const y = pic.slot.y + pic.offsetY;
    const labelSize = 24;
    const labelX = x + 5;
    const labelY = y + 5;

    // Label background circle
    parts.push(
      `<circle cx="${labelX + labelSize / 2}" cy="${labelY + labelSize / 2}" r="${labelSize / 2}" ` +
        `fill="${style.borderColor}"/>`
    );

    // Label text
    parts.push(
      `<text x="${labelX + labelSize / 2}" y="${labelY + labelSize / 2 + 5}" ` +
        `text-anchor="middle" font-family="Arial, sans-serif" font-size="14" ` +
        `font-weight="bold" fill="white">${this.escapeXml(pic.label!)}</text>`
    );
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
   * Gets layout information without rendering
   * Useful for planning and integration with map rendering
   * @param config - Configuration without images for layout planning
   * @param pictureCount - Number of pictures to plan for
   * @returns Border layout information
   */
  getLayout(
    layoutOptions: LayoutOptions,
    pictureCount: number,
    dpi: number = DEFAULT_DPI
  ): BorderLayout {
    return calculateBorderLayout(layoutOptions, pictureCount, dpi);
  }
}

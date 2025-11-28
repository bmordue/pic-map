/**
 * SVG export functionality
 *
 * Handles SVG export with proper print-ready formatting
 */

import {
  ExportConfig,
  ExportResult,
  ExportInput,
  PAGE_SIZES,
  PageSizePreset,
} from './types';

/**
 * Get page dimensions in millimeters based on config
 */
function getPageDimensions(
  pageSize: PageSizePreset | { width: number; height: number },
  orientation: 'portrait' | 'landscape'
): { width: number; height: number } {
  let width: number;
  let height: number;

  if (typeof pageSize === 'string') {
    const preset = PAGE_SIZES[pageSize];
    width = preset.width;
    height = preset.height;
  } else {
    width = pageSize.width;
    height = pageSize.height;
  }

  // Swap dimensions for landscape orientation
  if (orientation === 'landscape') {
    [width, height] = [height, width];
  }

  return { width, height };
}

/**
 * Convert millimeters to pixels at given DPI
 */
function mmToPixels(mm: number, dpi: number): number {
  return Math.round((mm / 25.4) * dpi);
}

/**
 * Escapes special XML characters in text
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
 * Exports content to SVG format with print-ready formatting
 *
 * @param input - The SVG content to export
 * @param config - Export configuration options
 * @returns Export result with SVG string
 */
export function exportToSvg(input: ExportInput, config: ExportConfig): ExportResult {
  const dpi = config.dpi || 300;
  const { width: widthMm, height: heightMm } = getPageDimensions(
    config.pageSize,
    config.orientation
  );

  const widthPx = mmToPixels(widthMm, dpi);
  const heightPx = mmToPixels(heightMm, dpi);

  // Parse the input SVG to extract the content inside the svg element
  // This regex handles the most common case of SVG content from our MapEngine
  // For nested SVG elements, the entire input is used as fallback
  const svgContentMatch = input.svg.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
  const innerContent = svgContentMatch ? svgContentMatch[1] : input.svg;

  // Build the print-ready SVG with proper dimensions
  const svgParts: string[] = [];

  // XML declaration for proper encoding
  svgParts.push('<?xml version="1.0" encoding="UTF-8"?>');

  // SVG root element with proper namespaces and dimensions
  // Using mm units for print compatibility
  svgParts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${widthMm}mm" height="${heightMm}mm" viewBox="0 0 ${widthPx} ${heightPx}">`
  );

  // Add metadata
  if (config.title || config.author) {
    svgParts.push('  <metadata>');
    if (config.title) {
      svgParts.push(`    <title>${escapeXml(config.title)}</title>`);
    }
    if (config.author) {
      svgParts.push(`    <author>${escapeXml(config.author)}</author>`);
    }
    svgParts.push('  </metadata>');
  }

  // Add a group to scale the original content to fit the new dimensions
  const scaleX = widthPx / input.width;
  const scaleY = heightPx / input.height;
  const scale = Math.min(scaleX, scaleY);

  // Center the content if aspect ratios don't match
  const scaledWidth = input.width * scale;
  const scaledHeight = input.height * scale;
  const offsetX = (widthPx - scaledWidth) / 2;
  const offsetY = (heightPx - scaledHeight) / 2;

  svgParts.push(
    `  <g transform="translate(${offsetX}, ${offsetY}) scale(${scale})">`
  );
  svgParts.push(innerContent);
  svgParts.push('  </g>');

  svgParts.push('</svg>');

  return {
    data: svgParts.join('\n'),
    format: 'svg',
    widthMm,
    heightMm,
    widthPx,
    heightPx,
  };
}

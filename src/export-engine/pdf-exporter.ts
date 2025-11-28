/**
 * PDF export functionality
 *
 * Handles PDF export with proper print-ready formatting using PDFKit
 */

import PDFDocument from 'pdfkit';
import {
  ExportConfig,
  ExportResult,
  ExportInput,
  PAGE_SIZES,
  PageSizePreset,
} from './types';

/**
 * Convert millimeters to PDF points (1 inch = 72 points)
 */
function mmToPoints(mm: number): number {
  return (mm / 25.4) * 72;
}

/**
 * Get page dimensions in points based on config
 */
function getPageDimensionsInPoints(
  pageSize: PageSizePreset | { width: number; height: number },
  orientation: 'portrait' | 'landscape'
): { width: number; height: number } {
  let widthMm: number;
  let heightMm: number;

  if (typeof pageSize === 'string') {
    const preset = PAGE_SIZES[pageSize];
    widthMm = preset.width;
    heightMm = preset.height;
  } else {
    widthMm = pageSize.width;
    heightMm = pageSize.height;
  }

  // Swap dimensions for landscape orientation
  if (orientation === 'landscape') {
    [widthMm, heightMm] = [heightMm, widthMm];
  }

  return {
    width: mmToPoints(widthMm),
    height: mmToPoints(heightMm),
  };
}

/**
 * Get page dimensions in millimeters based on config
 */
function getPageDimensionsMm(
  pageSize: PageSizePreset | { width: number; height: number },
  orientation: 'portrait' | 'landscape'
): { widthMm: number; heightMm: number } {
  let widthMm: number;
  let heightMm: number;

  if (typeof pageSize === 'string') {
    const preset = PAGE_SIZES[pageSize];
    widthMm = preset.width;
    heightMm = preset.height;
  } else {
    widthMm = pageSize.width;
    heightMm = pageSize.height;
  }

  // Swap dimensions for landscape orientation
  if (orientation === 'landscape') {
    [widthMm, heightMm] = [heightMm, widthMm];
  }

  return { widthMm, heightMm };
}

/**
 * Convert millimeters to pixels at given DPI
 */
function mmToPixels(mm: number, dpi: number): number {
  return Math.round((mm / 25.4) * dpi);
}

/**
 * Parse color value from SVG format to PDF-compatible format
 */
function parseColor(color: string): string {
  // Handle rgb() format
  const rgbMatch = color.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10).toString(16).padStart(2, '0');
    const g = parseInt(rgbMatch[2], 10).toString(16).padStart(2, '0');
    const b = parseInt(rgbMatch[3], 10).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }

  // Return as-is for hex colors and named colors
  return color;
}

/**
 * Simple SVG element parser for basic elements
 */
interface SvgElement {
  type: string;
  attrs: Record<string, string>;
}

/**
 * Extract attributes from an SVG element string
 */
function extractAttributes(elementStr: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const attrRegex = /(\w[\w-]*)\s*=\s*"([^"]*)"/g;
  let match: RegExpExecArray | null;

  while ((match = attrRegex.exec(elementStr)) !== null) {
    attrs[match[1]] = match[2];
  }

  return attrs;
}

/**
 * Parse SVG elements from SVG content
 */
function parseSvgElements(svg: string): SvgElement[] {
  const elements: SvgElement[] = [];

  // Extract rect elements
  const rectRegex = /<rect\s+([^/>]+)\/?>/g;
  let match: RegExpExecArray | null;

  while ((match = rectRegex.exec(svg)) !== null) {
    elements.push({
      type: 'rect',
      attrs: extractAttributes(match[1]),
    });
  }

  // Extract line elements
  const lineRegex = /<line\s+([^/>]+)\/?>/g;
  while ((match = lineRegex.exec(svg)) !== null) {
    elements.push({
      type: 'line',
      attrs: extractAttributes(match[1]),
    });
  }

  // Extract circle elements
  const circleRegex = /<circle\s+([^/>]+)\/?>/g;
  while ((match = circleRegex.exec(svg)) !== null) {
    elements.push({
      type: 'circle',
      attrs: extractAttributes(match[1]),
    });
  }

  // Extract path elements
  const pathRegex = /<path\s+([^/>]+)\/?>/g;
  while ((match = pathRegex.exec(svg)) !== null) {
    elements.push({
      type: 'path',
      attrs: extractAttributes(match[1]),
    });
  }

  // Extract text elements
  const textRegex = /<text\s+([^>]+)>([^<]*)<\/text>/g;
  while ((match = textRegex.exec(svg)) !== null) {
    const attrs = extractAttributes(match[1]);
    attrs['textContent'] = match[2];
    elements.push({
      type: 'text',
      attrs,
    });
  }

  return elements;
}

/**
 * Draw an SVG element onto the PDF document
 */
function drawElement(
  doc: PDFKit.PDFDocument,
  element: SvgElement,
  scale: number,
  offsetX: number,
  offsetY: number
): void {
  const { type, attrs } = element;

  switch (type) {
    case 'rect': {
      const x = (parseFloat(attrs['x'] || '0') + offsetX) * scale;
      const y = (parseFloat(attrs['y'] || '0') + offsetY) * scale;
      const width = parseFloat(attrs['width'] || '0') * scale;
      const height = parseFloat(attrs['height'] || '0') * scale;
      const fill = attrs['fill'];
      const stroke = attrs['stroke'];
      const strokeWidth = parseFloat(attrs['stroke-width'] || '1') * scale;

      if (fill && fill !== 'none') {
        doc.fillColor(parseColor(fill));
        doc.rect(x, y, width, height).fill();
      }

      if (stroke && stroke !== 'none') {
        doc.strokeColor(parseColor(stroke));
        doc.lineWidth(strokeWidth);
        doc.rect(x, y, width, height).stroke();
      }
      break;
    }

    case 'line': {
      const x1 = (parseFloat(attrs['x1'] || '0') + offsetX) * scale;
      const y1 = (parseFloat(attrs['y1'] || '0') + offsetY) * scale;
      const x2 = (parseFloat(attrs['x2'] || '0') + offsetX) * scale;
      const y2 = (parseFloat(attrs['y2'] || '0') + offsetY) * scale;
      const stroke = attrs['stroke'] || '#000000';
      const strokeWidth = parseFloat(attrs['stroke-width'] || '1') * scale;

      doc.strokeColor(parseColor(stroke));
      doc.lineWidth(strokeWidth);
      doc.moveTo(x1, y1).lineTo(x2, y2).stroke();
      break;
    }

    case 'circle': {
      const cx = (parseFloat(attrs['cx'] || '0') + offsetX) * scale;
      const cy = (parseFloat(attrs['cy'] || '0') + offsetY) * scale;
      const r = parseFloat(attrs['r'] || '0') * scale;
      const fill = attrs['fill'];
      const stroke = attrs['stroke'];
      const strokeWidth = parseFloat(attrs['stroke-width'] || '1') * scale;

      if (fill && fill !== 'none') {
        doc.fillColor(parseColor(fill));
        doc.circle(cx, cy, r).fill();
      }

      if (stroke && stroke !== 'none') {
        doc.strokeColor(parseColor(stroke));
        doc.lineWidth(strokeWidth);
        doc.circle(cx, cy, r).stroke();
      }
      break;
    }

    case 'path': {
      // For now, we'll draw paths as simple shapes
      // Full SVG path parsing would require a more comprehensive parser
      const d = attrs['d'];
      const fill = attrs['fill'];
      const stroke = attrs['stroke'];
      const strokeWidth = parseFloat(attrs['stroke-width'] || '1') * scale;

      if (d) {
        // Apply transformation to path
        doc.save();
        doc.translate(offsetX * scale, offsetY * scale);
        doc.scale(scale, scale);

        if (fill && fill !== 'none') {
          doc.fillColor(parseColor(fill));
          doc.path(d).fill();
        }

        if (stroke && stroke !== 'none') {
          doc.strokeColor(parseColor(stroke));
          doc.lineWidth(strokeWidth / scale);
          doc.path(d).stroke();
        }

        doc.restore();
      }
      break;
    }

    case 'text': {
      const x = (parseFloat(attrs['x'] || '0') + offsetX) * scale;
      const y = (parseFloat(attrs['y'] || '0') + offsetY) * scale;
      const text = attrs['textContent'] || '';
      const fill = attrs['fill'] || '#000000';
      const fontSize = parseFloat(attrs['font-size'] || '12') * scale;
      const textAnchor = attrs['text-anchor'] || 'start';

      doc.fillColor(parseColor(fill));
      doc.fontSize(fontSize);

      // Handle text-anchor alignment
      let align: 'left' | 'center' | 'right' = 'left';
      if (textAnchor === 'middle') {
        align = 'center';
      } else if (textAnchor === 'end') {
        align = 'right';
      }

      // Decode HTML entities
      const decodedText = text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'");

      // Adjust y position to account for baseline differences
      const adjustedY = y - fontSize * 0.8;

      if (align === 'center') {
        doc.text(decodedText, x, adjustedY, { align: 'center', width: 0 });
      } else if (align === 'right') {
        const textWidth = doc.widthOfString(decodedText);
        doc.text(decodedText, x - textWidth, adjustedY);
      } else {
        doc.text(decodedText, x, adjustedY);
      }
      break;
    }
  }
}

/**
 * Exports content to PDF format
 *
 * @param input - The SVG content to export
 * @param config - Export configuration options
 * @returns Promise resolving to export result with PDF buffer
 */
export async function exportToPdf(
  input: ExportInput,
  config: ExportConfig
): Promise<ExportResult> {
  const dpi = config.dpi || 300;
  const { width: widthPt, height: heightPt } = getPageDimensionsInPoints(
    config.pageSize,
    config.orientation
  );
  const { widthMm, heightMm } = getPageDimensionsMm(config.pageSize, config.orientation);

  const widthPx = mmToPixels(widthMm, dpi);
  const heightPx = mmToPixels(heightMm, dpi);

  return new Promise((resolve, reject) => {
    try {
      // Create PDF document with specified dimensions
      const doc = new PDFDocument({
        size: [widthPt, heightPt],
        margin: 0,
        info: {
          Title: config.title || 'Pic-Map Export',
          Author: config.author || 'Pic-Map',
          Creator: 'Pic-Map Export Engine',
        },
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve({
          data: pdfBuffer,
          format: 'pdf',
          widthMm,
          heightMm,
          widthPx,
          heightPx,
        });
      });

      doc.on('error', (error: Error) => {
        reject(error);
      });

      // Calculate scale to fit SVG content into PDF page
      const scaleX = widthPt / input.width;
      const scaleY = heightPt / input.height;
      const scale = Math.min(scaleX, scaleY);

      // Center the content
      const scaledWidth = input.width * scale;
      const scaledHeight = input.height * scale;
      const offsetX = (widthPt - scaledWidth) / (2 * scale);
      const offsetY = (heightPt - scaledHeight) / (2 * scale);

      // Parse and render SVG elements
      const elements = parseSvgElements(input.svg);

      for (const element of elements) {
        drawElement(doc, element, scale, offsetX, offsetY);
      }

      // Finalize the PDF
      doc.end();
    } catch (error) {
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}

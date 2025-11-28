/**
 * Export engine type definitions
 */

/**
 * Supported export formats
 */
export type ExportFormat = 'svg' | 'pdf';

/**
 * Page size presets with dimensions in millimeters
 */
export const PAGE_SIZES = {
  A4: { width: 210, height: 297 },
  A3: { width: 297, height: 420 },
  Letter: { width: 215.9, height: 279.4 },
  Legal: { width: 215.9, height: 355.6 },
} as const;

export type PageSizePreset = keyof typeof PAGE_SIZES;

/**
 * Page orientation
 */
export type PageOrientation = 'portrait' | 'landscape';

/**
 * Export configuration options
 */
export interface ExportConfig {
  /** Output format */
  format: ExportFormat;
  /** Page size (preset name or custom dimensions in mm) */
  pageSize: PageSizePreset | { width: number; height: number };
  /** Page orientation */
  orientation: PageOrientation;
  /** Output resolution in DPI (for PDF) */
  dpi?: number;
  /** Whether to embed images as base64 (for SVG) */
  embedImages?: boolean;
  /** Title for the document metadata */
  title?: string;
  /** Author for the document metadata */
  author?: string;
}

/**
 * Default export configuration
 */
export const DEFAULT_EXPORT_CONFIG: ExportConfig = {
  format: 'svg',
  pageSize: 'A4',
  orientation: 'portrait',
  dpi: 300,
  embedImages: true,
};

/**
 * Result of an export operation
 */
export interface ExportResult {
  /** The exported data (string for SVG, Buffer for PDF) */
  data: string | Buffer;
  /** The format of the export */
  format: ExportFormat;
  /** Width in millimeters */
  widthMm: number;
  /** Height in millimeters */
  heightMm: number;
  /** Width in pixels (at specified DPI) */
  widthPx: number;
  /** Height in pixels (at specified DPI) */
  heightPx: number;
}

/**
 * Input for export operations - SVG content to export
 */
export interface ExportInput {
  /** SVG content to export */
  svg: string;
  /** Original width of the SVG in pixels */
  width: number;
  /** Original height of the SVG in pixels */
  height: number;
}

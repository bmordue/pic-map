/**
 * Export Engine - Main entry point for export functionality
 *
 * Handles exporting maps to various print-ready formats (SVG, PDF)
 */

import {
  ExportConfig,
  ExportResult,
  ExportInput,
  ExportFormat,
  DEFAULT_EXPORT_CONFIG,
  PageSizePreset,
  PageOrientation,
  PAGE_SIZES,
} from './types';
import { exportToSvg } from './svg-exporter';
import { exportToPdf } from './pdf-exporter';

/**
 * Error thrown when export operations fail
 */
export class ExportError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'ExportError';
  }
}

/**
 * Validates export configuration
 */
function validateConfig(config: Partial<ExportConfig>): void {
  if (config.format && !['svg', 'pdf'].includes(config.format)) {
    throw new ExportError(`Unsupported export format: ${config.format}`);
  }

  if (config.dpi !== undefined && (config.dpi < 72 || config.dpi > 1200)) {
    throw new ExportError(`DPI must be between 72 and 1200, got: ${config.dpi}`);
  }

  if (config.pageSize !== undefined) {
    if (typeof config.pageSize === 'string') {
      if (!Object.keys(PAGE_SIZES).includes(config.pageSize)) {
        throw new ExportError(`Invalid page size preset: ${config.pageSize}`);
      }
    } else {
      if (config.pageSize.width <= 0 || config.pageSize.height <= 0) {
        throw new ExportError('Custom page dimensions must be positive');
      }
    }
  }

  if (config.orientation && !['portrait', 'landscape'].includes(config.orientation)) {
    throw new ExportError(`Invalid orientation: ${config.orientation}`);
  }
}

/**
 * Validates export input
 */
function validateInput(input: ExportInput): void {
  if (!input.svg || typeof input.svg !== 'string') {
    throw new ExportError('Input SVG must be a non-empty string');
  }

  if (input.width <= 0 || input.height <= 0) {
    throw new ExportError('Input dimensions must be positive');
  }
}

/**
 * Export Engine class for generating print-ready output
 */
export class ExportEngine {
  private defaultConfig: ExportConfig;

  /**
   * Creates a new ExportEngine instance
   * @param defaultConfig - Default export configuration to use
   */
  constructor(defaultConfig?: Partial<ExportConfig>) {
    this.defaultConfig = {
      ...DEFAULT_EXPORT_CONFIG,
      ...defaultConfig,
    };
  }

  /**
   * Export content to the specified format
   *
   * @param input - The SVG content to export
   * @param config - Export configuration (optional, uses defaults if not provided)
   * @returns Export result with the exported data
   * @throws ExportError if export fails
   */
  async export(input: ExportInput, config?: Partial<ExportConfig>): Promise<ExportResult> {
    const mergedConfig: ExportConfig = {
      ...this.defaultConfig,
      ...config,
    };

    validateConfig(mergedConfig);
    validateInput(input);

    try {
      switch (mergedConfig.format) {
        case 'svg':
          return exportToSvg(input, mergedConfig);
        case 'pdf':
          return await exportToPdf(input, mergedConfig);
      }
    } catch (error) {
      if (error instanceof ExportError) {
        throw error;
      }
      throw new ExportError(
        `Export failed: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Export content to SVG format
   *
   * @param input - The SVG content to export
   * @param config - Export configuration (optional)
   * @returns Export result with SVG string
   */
  exportToSvg(input: ExportInput, config?: Partial<ExportConfig>): ExportResult {
    const mergedConfig: ExportConfig = {
      ...this.defaultConfig,
      ...config,
      format: 'svg',
    };

    validateConfig(mergedConfig);
    validateInput(input);

    return exportToSvg(input, mergedConfig);
  }

  /**
   * Export content to PDF format
   *
   * @param input - The SVG content to export
   * @param config - Export configuration (optional)
   * @returns Promise resolving to export result with PDF buffer
   */
  async exportToPdf(input: ExportInput, config?: Partial<ExportConfig>): Promise<ExportResult> {
    const mergedConfig: ExportConfig = {
      ...this.defaultConfig,
      ...config,
      format: 'pdf',
    };

    validateConfig(mergedConfig);
    validateInput(input);

    return exportToPdf(input, mergedConfig);
  }

  /**
   * Get available export formats
   */
  static getAvailableFormats(): ExportFormat[] {
    return ['svg', 'pdf'];
  }

  /**
   * Get available page size presets
   */
  static getPageSizePresets(): PageSizePreset[] {
    return Object.keys(PAGE_SIZES) as PageSizePreset[];
  }

  /**
   * Get dimensions for a page size preset
   * @param preset - The page size preset name
   * @param orientation - Page orientation
   * @returns Page dimensions in millimeters
   */
  static getPageDimensions(
    preset: PageSizePreset,
    orientation: PageOrientation = 'portrait'
  ): { width: number; height: number } {
    const dims = PAGE_SIZES[preset];
    if (orientation === 'landscape') {
      return { width: dims.height, height: dims.width };
    }
    return { ...dims };
  }
}

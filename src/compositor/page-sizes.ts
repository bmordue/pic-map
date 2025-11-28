/**
 * Page size utilities for the compositor
 */

import {
  PageSizeId,
  Dimensions,
  Orientation,
  PAGE_SIZES,
  Margin,
  Rectangle,
  CompositorConfig,
} from './types';

/**
 * Default DPI for print-quality output
 */
export const DEFAULT_DPI = 300;

/**
 * Minimum DPI for reasonable quality
 */
export const MIN_DPI = 72;

/**
 * Maximum DPI supported
 */
export const MAX_DPI = 600;

/**
 * Gets the page dimensions in millimeters for a given page size and orientation
 * @param pageSize - Page size identifier
 * @param orientation - Page orientation
 * @param customDimensions - Custom dimensions (required if pageSize is 'custom')
 * @returns Page dimensions in millimeters
 */
export function getPageDimensionsMm(
  pageSize: PageSizeId,
  orientation: Orientation,
  customDimensions?: Dimensions
): Dimensions {
  let baseDimensions: Dimensions;

  if (pageSize === 'custom') {
    if (!customDimensions) {
      throw new Error('Custom dimensions required when page size is "custom"');
    }
    baseDimensions = customDimensions;
  } else {
    baseDimensions = PAGE_SIZES[pageSize];
  }

  // Apply orientation
  if (orientation === 'landscape') {
    return {
      width: Math.max(baseDimensions.width, baseDimensions.height),
      height: Math.min(baseDimensions.width, baseDimensions.height),
    };
  }

  return {
    width: Math.min(baseDimensions.width, baseDimensions.height),
    height: Math.max(baseDimensions.width, baseDimensions.height),
  };
}

/**
 * Converts millimeters to pixels at a given DPI
 * @param mm - Value in millimeters
 * @param dpi - Dots per inch
 * @returns Value in pixels
 */
export function mmToPixels(mm: number, dpi: number): number {
  // 1 inch = 25.4 mm
  return Math.round((mm * dpi) / 25.4);
}

/**
 * Converts pixels to millimeters at a given DPI
 * @param pixels - Value in pixels
 * @param dpi - Dots per inch
 * @returns Value in millimeters
 */
export function pixelsToMm(pixels: number, dpi: number): number {
  return (pixels * 25.4) / dpi;
}

/**
 * Converts dimensions from millimeters to pixels
 * @param dimensions - Dimensions in millimeters
 * @param dpi - Dots per inch
 * @returns Dimensions in pixels
 */
export function dimensionsToPixels(dimensions: Dimensions, dpi: number): Dimensions {
  return {
    width: mmToPixels(dimensions.width, dpi),
    height: mmToPixels(dimensions.height, dpi),
  };
}

/**
 * Converts margin from millimeters to pixels
 * @param margin - Margin in millimeters
 * @param dpi - Dots per inch
 * @returns Margin in pixels
 */
export function marginToPixels(margin: Margin, dpi: number): Margin {
  return {
    top: mmToPixels(margin.top, dpi),
    right: mmToPixels(margin.right, dpi),
    bottom: mmToPixels(margin.bottom, dpi),
    left: mmToPixels(margin.left, dpi),
  };
}

/**
 * Calculates the content area (page minus margins)
 * @param pageDimensions - Page dimensions in pixels
 * @param margin - Margin in pixels
 * @returns Content area rectangle
 */
export function calculateContentArea(pageDimensions: Dimensions, margin: Margin): Rectangle {
  return {
    x: margin.left,
    y: margin.top,
    width: pageDimensions.width - margin.left - margin.right,
    height: pageDimensions.height - margin.top - margin.bottom,
  };
}

/**
 * Calculates the map area and border areas from compositor config
 * @param config - Compositor configuration
 * @returns Object containing map area and border areas
 */
export function calculateLayoutAreas(config: CompositorConfig): {
  pageDimensions: Dimensions;
  mapArea: Rectangle;
  borderAreas: {
    top: Rectangle;
    right: Rectangle;
    bottom: Rectangle;
    left: Rectangle;
  };
} {
  const dpi = config.dpi ?? DEFAULT_DPI;

  // Get page dimensions in mm
  const pageDimensionsMm = getPageDimensionsMm(
    config.pageSize,
    config.orientation,
    config.customDimensions
  );

  // Convert to pixels
  const pageDimensions = dimensionsToPixels(pageDimensionsMm, dpi);
  const margin = marginToPixels(config.margin, dpi);
  const borderWidth = mmToPixels(config.borderWidth, dpi);

  // Calculate content area (inside margins)
  const contentArea = calculateContentArea(pageDimensions, margin);

  // Calculate border areas
  const borderAreas = {
    top: {
      x: contentArea.x,
      y: contentArea.y,
      width: contentArea.width,
      height: borderWidth,
    },
    right: {
      x: contentArea.x + contentArea.width - borderWidth,
      y: contentArea.y + borderWidth,
      width: borderWidth,
      height: contentArea.height - 2 * borderWidth,
    },
    bottom: {
      x: contentArea.x,
      y: contentArea.y + contentArea.height - borderWidth,
      width: contentArea.width,
      height: borderWidth,
    },
    left: {
      x: contentArea.x,
      y: contentArea.y + borderWidth,
      width: borderWidth,
      height: contentArea.height - 2 * borderWidth,
    },
  };

  // Calculate map area (inside the borders)
  const mapArea: Rectangle = {
    x: contentArea.x + borderWidth,
    y: contentArea.y + borderWidth,
    width: contentArea.width - 2 * borderWidth,
    height: contentArea.height - 2 * borderWidth,
  };

  return {
    pageDimensions,
    mapArea,
    borderAreas,
  };
}

/**
 * Validates DPI value
 * @param dpi - DPI value to validate
 * @returns Clamped DPI value within valid range
 */
export function validateDpi(dpi: number): number {
  if (!Number.isFinite(dpi) || dpi <= 0) {
    return DEFAULT_DPI;
  }
  return Math.max(MIN_DPI, Math.min(MAX_DPI, Math.round(dpi)));
}

/**
 * Picture border layout calculation utilities
 */

import {
  LayoutOptions,
  BorderLayout,
  PictureSlot,
  BorderEdge,
  ImageMetadata,
  PositionedPicture,
} from '../types';

/**
 * Standard page sizes in millimeters
 */
const PAGE_SIZES: Record<string, { width: number; height: number }> = {
  A4: { width: 210, height: 297 },
  A3: { width: 297, height: 420 },
  Letter: { width: 215.9, height: 279.4 },
};

/**
 * Default DPI for print quality output
 * 300 DPI is the standard for high-quality print
 */
export const DEFAULT_DPI = 300;

/**
 * Converts millimeters to pixels at the specified DPI
 * @param mm - Value in millimeters
 * @param dpi - Dots per inch (default: 300 for print quality)
 * @returns Value in pixels
 */
export function mmToPixels(mm: number, dpi: number = DEFAULT_DPI): number {
  // 1 inch = 25.4 mm
  return Math.round((mm / 25.4) * dpi);
}

/**
 * Converts pixels to millimeters at the specified DPI
 * @param pixels - Value in pixels
 * @param dpi - Dots per inch (default: 300 for print quality)
 * @returns Value in millimeters
 */
export function pixelsToMm(pixels: number, dpi: number = DEFAULT_DPI): number {
  return (pixels * 25.4) / dpi;
}

/**
 * Gets page dimensions in millimeters based on layout options
 * @param layout - Layout options containing page size and orientation
 * @returns Page dimensions in millimeters
 */
export function getPageDimensionsMm(layout: LayoutOptions): { width: number; height: number } {
  let width: number;
  let height: number;

  if (layout.pageSize === 'custom' && layout.customDimensions) {
    width = layout.customDimensions.width;
    height = layout.customDimensions.height;
  } else {
    const size = PAGE_SIZES[layout.pageSize] || PAGE_SIZES.A4;
    width = size.width;
    height = size.height;
  }

  // Apply orientation
  if (layout.orientation === 'landscape') {
    return { width: Math.max(width, height), height: Math.min(width, height) };
  }
  return { width: Math.min(width, height), height: Math.max(width, height) };
}

/**
 * Gets page dimensions in pixels based on layout options and DPI
 * @param layout - Layout options containing page size and orientation
 * @param dpi - Dots per inch for conversion
 * @returns Page dimensions in pixels
 */
export function getPageDimensionsPixels(
  layout: LayoutOptions,
  dpi: number = DEFAULT_DPI
): { width: number; height: number } {
  const mmDimensions = getPageDimensionsMm(layout);
  return {
    width: mmToPixels(mmDimensions.width, dpi),
    height: mmToPixels(mmDimensions.height, dpi),
  };
}

/**
 * Calculates the border layout including all picture slots
 * @param layout - Layout options
 * @param pictureCount - Number of pictures to distribute
 * @param dpi - DPI for pixel conversion
 * @returns Complete border layout with slots
 */
export function calculateBorderLayout(
  layout: LayoutOptions,
  pictureCount: number,
  dpi: number = DEFAULT_DPI
): BorderLayout {
  const pageDimensions = getPageDimensionsPixels(layout, dpi);
  const borderWidthPx = mmToPixels(layout.borderWidth, dpi);
  const spacingPx = mmToPixels(layout.pictureSpacing, dpi);

  const marginPx = {
    top: mmToPixels(layout.margin.top, dpi),
    right: mmToPixels(layout.margin.right, dpi),
    bottom: mmToPixels(layout.margin.bottom, dpi),
    left: mmToPixels(layout.margin.left, dpi),
  };

  // Calculate inner area (where the map goes)
  const innerArea = {
    x: marginPx.left + borderWidthPx,
    y: marginPx.top + borderWidthPx,
    width: pageDimensions.width - marginPx.left - marginPx.right - 2 * borderWidthPx,
    height: pageDimensions.height - marginPx.top - marginPx.bottom - 2 * borderWidthPx,
  };

  // Calculate slots for pictures
  const slots = calculatePictureSlots(
    pageDimensions.width,
    pageDimensions.height,
    borderWidthPx,
    marginPx,
    spacingPx,
    pictureCount
  );

  return {
    pageWidth: pageDimensions.width,
    pageHeight: pageDimensions.height,
    borderWidth: borderWidthPx,
    innerArea,
    slots,
    margin: marginPx,
    pictureSpacing: spacingPx,
  };
}

/**
 * Distributes pictures evenly across the four edges of the border
 * @param pictureCount - Total number of pictures
 * @returns Object with counts for each edge
 */
export function distributePicturesAcrossEdges(pictureCount: number): Record<BorderEdge, number> {
  if (pictureCount === 0) {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  // Distribute evenly, starting from top and going clockwise
  const base = Math.floor(pictureCount / 4);
  const remainder = pictureCount % 4;

  // Distribute remainder clockwise
  const counts: Record<BorderEdge, number> = { top: base, right: base, bottom: base, left: base };
  const edges: BorderEdge[] = ['top', 'right', 'bottom', 'left'];
  for (let i = 0; i < remainder; i++) {
    counts[edges[i]]++;
  }
  return counts;
}

/**
 * Calculates the available length for pictures on each edge
 * @param pageWidth - Total page width
 * @param pageHeight - Total page height
 * @param borderWidth - Width of the border area
 * @param margin - Margin on each side
 * @returns Available length for each edge
 */
function calculateEdgeLengths(
  pageWidth: number,
  pageHeight: number,
  borderWidth: number,
  margin: { top: number; right: number; bottom: number; left: number }
): Record<BorderEdge, number> {
  // Horizontal edges span the full width minus margins
  const horizontalLength = pageWidth - margin.left - margin.right;
  // Vertical edges span the height minus margins and corners (which belong to horizontal)
  const verticalLength = pageHeight - margin.top - margin.bottom - 2 * borderWidth;

  return {
    top: horizontalLength,
    bottom: horizontalLength,
    left: verticalLength,
    right: verticalLength,
  };
}

/**
 * Calculates picture slots for all edges
 */
function calculatePictureSlots(
  pageWidth: number,
  pageHeight: number,
  borderWidth: number,
  margin: { top: number; right: number; bottom: number; left: number },
  spacing: number,
  pictureCount: number
): PictureSlot[] {
  const distribution = distributePicturesAcrossEdges(pictureCount);
  const edgeLengths = calculateEdgeLengths(pageWidth, pageHeight, borderWidth, margin);
  const slots: PictureSlot[] = [];
  let slotIndex = 0;

  const edges: BorderEdge[] = ['top', 'right', 'bottom', 'left'];

  for (const edge of edges) {
    const count = distribution[edge];
    if (count === 0) continue;

    const edgeSlots = calculateEdgeSlots(
      edge,
      count,
      edgeLengths[edge],
      borderWidth,
      pageWidth,
      pageHeight,
      margin,
      spacing,
      slotIndex
    );

    slots.push(...edgeSlots);
    slotIndex += count;
  }

  return slots;
}

/**
 * Calculates slots for a single edge
 */
function calculateEdgeSlots(
  edge: BorderEdge,
  count: number,
  edgeLength: number,
  borderWidth: number,
  pageWidth: number,
  pageHeight: number,
  margin: { top: number; right: number; bottom: number; left: number },
  spacing: number,
  startIndex: number
): PictureSlot[] {
  const slots: PictureSlot[] = [];

  // Calculate slot size based on edge length and number of pictures
  // Total spacing = (count - 1) * spacing + 2 * spacing for edges
  const totalSpacing = count > 0 ? (count + 1) * spacing : 0;
  const availableLength = edgeLength - totalSpacing;
  const slotSize = count > 0 ? Math.max(0, Math.floor(availableLength / count)) : 0;

  for (let i = 0; i < count; i++) {
    const position = calculateSlotPosition(
      edge,
      i,
      count,
      slotSize,
      borderWidth,
      pageWidth,
      pageHeight,
      margin,
      spacing
    );

    slots.push({
      id: `slot-${startIndex + i}`,
      edge,
      x: position.x,
      y: position.y,
      width: position.width,
      height: position.height,
      edgeIndex: i,
    });
  }

  return slots;
}

/**
 * Calculates the position and size of a single slot
 */
function calculateSlotPosition(
  edge: BorderEdge,
  index: number,
  _count: number,
  slotSize: number,
  borderWidth: number,
  pageWidth: number,
  pageHeight: number,
  margin: { top: number; right: number; bottom: number; left: number },
  spacing: number
): { x: number; y: number; width: number; height: number } {
  // Calculate the offset along the edge
  const offset = spacing + index * (slotSize + spacing);

  switch (edge) {
    case 'top':
      return {
        x: margin.left + offset,
        y: margin.top,
        width: slotSize,
        height: borderWidth,
      };
    case 'bottom':
      return {
        x: margin.left + offset,
        y: pageHeight - margin.bottom - borderWidth,
        width: slotSize,
        height: borderWidth,
      };
    case 'left':
      return {
        x: margin.left,
        y: margin.top + borderWidth + offset,
        width: borderWidth,
        height: slotSize,
      };
    case 'right':
      return {
        x: pageWidth - margin.right - borderWidth,
        y: margin.top + borderWidth + offset,
        width: borderWidth,
        height: slotSize,
      };
  }
}

/**
 * Calculates aspect ratio preserving dimensions that fit within a slot
 * @param originalWidth - Original image width
 * @param originalHeight - Original image height
 * @param maxWidth - Maximum available width (slot width)
 * @param maxHeight - Maximum available height (slot height)
 * @returns Scaled dimensions that preserve aspect ratio
 */
export function calculateFitDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  if (originalWidth <= 0 || originalHeight <= 0) {
    return { width: 0, height: 0 };
  }

  const aspectRatio = originalWidth / originalHeight;
  const slotAspectRatio = maxWidth / maxHeight;

  let width: number;
  let height: number;

  if (aspectRatio > slotAspectRatio) {
    // Image is wider than slot, fit to width
    width = maxWidth;
    height = Math.round(maxWidth / aspectRatio);
  } else {
    // Image is taller than slot, fit to height
    height = maxHeight;
    width = Math.round(maxHeight * aspectRatio);
  }

  return { width, height };
}

/**
 * Positions pictures in slots, handling aspect ratio preservation
 * @param images - Array of image metadata
 * @param slots - Array of available slots
 * @param links - Optional array of links to get labels from
 * @param defaultDimensions - Default dimensions for images without specified dimensions
 * @returns Array of positioned pictures
 */
export function positionPicturesInSlots(
  images: ImageMetadata[],
  slots: PictureSlot[],
  links?: Array<{ imageId: string; label?: string }>,
  defaultDimensions: { width: number; height: number } = { width: 800, height: 600 }
): PositionedPicture[] {
  const positionedPictures: PositionedPicture[] = [];

  // Create a map of image IDs to labels
  const labelMap = new Map<string, string>();
  if (links) {
    links.forEach((link) => {
      if (link.label) {
        labelMap.set(link.imageId, link.label);
      }
    });
  }

  // Position each image in its corresponding slot
  for (let i = 0; i < Math.min(images.length, slots.length); i++) {
    const image = images[i];
    const slot = slots[i];

    // Get image dimensions (use default if not specified)
    const imageDims = image.dimensions || defaultDimensions;

    // Calculate fit dimensions preserving aspect ratio
    const fitDims = calculateFitDimensions(
      imageDims.width,
      imageDims.height,
      slot.width,
      slot.height
    );

    // Calculate centering offset within the slot
    const offsetX = Math.round((slot.width - fitDims.width) / 2);
    const offsetY = Math.round((slot.height - fitDims.height) / 2);

    // Calculate center point for link drawing
    const centerX = slot.x + offsetX + fitDims.width / 2;
    const centerY = slot.y + offsetY + fitDims.height / 2;

    // Get label from links map
    const label = labelMap.get(i.toString());

    positionedPictures.push({
      image,
      slot,
      renderWidth: fitDims.width,
      renderHeight: fitDims.height,
      offsetX,
      offsetY,
      label,
      centerX,
      centerY,
    });
  }

  return positionedPictures;
}

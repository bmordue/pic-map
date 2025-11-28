/**
 * Layout engine for positioning pictures in the border
 */

import { ImageMetadata } from '../types';
import {
  Rectangle,
  BorderPosition,
  PositionedPicture,
  CompositorConfig,
  LinkLine,
  CompositionLayout,
  CompositionInput,
} from './types';
import { calculateLayoutAreas, mmToPixels, DEFAULT_DPI } from './page-sizes';

/**
 * Distribution strategy for pictures
 */
export type DistributionStrategy = 'even' | 'proportional' | 'fixed';

/**
 * Configuration for picture distribution
 */
export interface DistributionConfig {
  /** How to distribute pictures */
  strategy: DistributionStrategy;
  /** Fixed size for pictures (used with 'fixed' strategy) */
  fixedSize?: number;
}

/**
 * Calculates how many pictures fit in a border area
 * @param borderLength - Length of the border (width for horizontal, height for vertical)
 * @param spacing - Spacing between pictures in pixels
 * @param pictureSize - Size of each picture in pixels
 * @returns Number of pictures that fit
 */
function calculatePictureCount(
  borderLength: number,
  spacing: number,
  pictureSize: number
): number {
  if (pictureSize <= 0) return 0;
  // Total space needed per picture = pictureSize + spacing (spacing between pictures)
  // First picture doesn't need leading spacing
  const availableLength = borderLength - spacing; // account for end spacing
  const perPictureSpace = pictureSize + spacing;
  return Math.max(0, Math.floor(availableLength / perPictureSpace));
}

/**
 * Calculates the optimal picture size to fit a target number of pictures
 * @param borderLength - Length of the border
 * @param spacing - Spacing between pictures
 * @param targetCount - Target number of pictures to fit
 * @returns Optimal picture size
 */
function calculateOptimalPictureSize(
  borderLength: number,
  spacing: number,
  targetCount: number
): number {
  if (targetCount <= 0) return 0;
  // Available space = borderLength - (targetCount - 1) * spacing - 2 * spacing (end padding)
  const totalSpacing = (targetCount + 1) * spacing;
  const availableForPictures = borderLength - totalSpacing;
  return Math.max(0, availableForPictures / targetCount);
}

/**
 * Distributes pictures across border areas
 * @param images - Array of image metadata
 * @param borderAreas - Border area rectangles
 * @param spacing - Spacing between pictures in pixels
 * @returns Array of positioned pictures
 */
export function distributePictures(
  images: ImageMetadata[],
  borderAreas: {
    top: Rectangle;
    right: Rectangle;
    bottom: Rectangle;
    left: Rectangle;
  },
  spacing: number
): PositionedPicture[] {
  if (images.length === 0) {
    return [];
  }

  const positions: BorderPosition[] = ['top', 'right', 'bottom', 'left'];
  const borderLengths: Record<BorderPosition, number> = {
    top: borderAreas.top.width,
    right: borderAreas.right.height,
    bottom: borderAreas.bottom.width,
    left: borderAreas.left.height,
  };

  // Calculate how many pictures each border can hold
  // Use the shorter dimension of each border for picture size
  const borderWidths: Record<BorderPosition, number> = {
    top: borderAreas.top.height,
    right: borderAreas.right.width,
    bottom: borderAreas.bottom.height,
    left: borderAreas.left.width,
  };

  // Calculate picture size based on border width (use square pictures)
  const minBorderWidth = Math.min(...Object.values(borderWidths));
  const pictureSize = Math.max(minBorderWidth - 2 * spacing, spacing);

  // Calculate capacity for each border
  const capacities: Record<BorderPosition, number> = {
    top: calculatePictureCount(borderLengths.top, spacing, pictureSize),
    right: calculatePictureCount(borderLengths.right, spacing, pictureSize),
    bottom: calculatePictureCount(borderLengths.bottom, spacing, pictureSize),
    left: calculatePictureCount(borderLengths.left, spacing, pictureSize),
  };

  const totalCapacity = Object.values(capacities).reduce((sum, cap) => sum + cap, 0);

  // If we have more images than capacity, we need to scale down
  let adjustedPictureSize = pictureSize;
  if (images.length > totalCapacity && totalCapacity > 0) {
    // Calculate a smaller size to fit more pictures.
    // We use square root scaling because reducing picture size by a linear factor
    // increases capacity proportionally in both border dimensions (width and count),
    // but we want to minimize the size reduction while fitting all images.
    // sqrt(scaleFactor) provides a balanced reduction that approximately doubles
    // capacity when the scale factor is 0.5.
    const scaleFactor = totalCapacity / images.length;
    adjustedPictureSize = pictureSize * Math.sqrt(scaleFactor);
    // Recalculate capacities with the adjusted picture size
    for (const pos of positions) {
      capacities[pos] = calculatePictureCount(borderLengths[pos], spacing, adjustedPictureSize);
    }
  }

  // Distribute images across borders
  const positionedPictures: PositionedPicture[] = [];
  let imageIndex = 0;

  for (const pos of positions) {
    const border = borderAreas[pos];
    const capacity = capacities[pos];
    const imagesToPlace = Math.min(capacity, images.length - imageIndex);

    if (imagesToPlace <= 0) continue;

    // Calculate actual picture size for this border
    const borderLength = borderLengths[pos];
    const actualSize = calculateOptimalPictureSize(borderLength, spacing, imagesToPlace);

    // Position pictures in this border
    const isHorizontal = pos === 'top' || pos === 'bottom';

    for (let i = 0; i < imagesToPlace; i++) {
      const offset = spacing + i * (actualSize + spacing);

      let rect: Rectangle;
      if (isHorizontal) {
        rect = {
          x: border.x + offset,
          y: border.y + spacing,
          width: actualSize,
          height: Math.min(actualSize, border.height - 2 * spacing),
        };
      } else {
        rect = {
          x: border.x + spacing,
          y: border.y + offset,
          width: Math.min(actualSize, border.width - 2 * spacing),
          height: actualSize,
        };
      }

      positionedPictures.push({
        image: images[imageIndex],
        rect,
        borderPosition: pos,
        imageIndex,
      });

      imageIndex++;
    }

    if (imageIndex >= images.length) break;
  }

  return positionedPictures;
}

/**
 * Calculates link lines between pictures and map markers
 * @param pictures - Positioned pictures
 * @param markerPositions - Map marker positions (relative to map area)
 * @param mapArea - Map area rectangle
 * @returns Array of link lines
 */
export function calculateLinkLines(
  pictures: PositionedPicture[],
  markerPositions: Array<{ imageIndex: number; x: number; y: number; label?: string }>,
  mapArea: Rectangle
): LinkLine[] {
  const links: LinkLine[] = [];

  for (const marker of markerPositions) {
    const picture = pictures.find((p) => p.imageIndex === marker.imageIndex);
    if (!picture) continue;

    // Calculate picture edge point (closest to map)
    const pictureCenterX = picture.rect.x + picture.rect.width / 2;
    const pictureCenterY = picture.rect.y + picture.rect.height / 2;

    let startX: number;
    let startY: number;

    switch (picture.borderPosition) {
      case 'top':
        startX = pictureCenterX;
        startY = picture.rect.y + picture.rect.height;
        break;
      case 'bottom':
        startX = pictureCenterX;
        startY = picture.rect.y;
        break;
      case 'left':
        startX = picture.rect.x + picture.rect.width;
        startY = pictureCenterY;
        break;
      case 'right':
        startX = picture.rect.x;
        startY = pictureCenterY;
        break;
    }

    // Calculate map marker position (convert from map-relative to page-absolute)
    const endX = mapArea.x + marker.x;
    const endY = mapArea.y + marker.y;

    links.push({
      start: { x: startX, y: startY },
      end: { x: endX, y: endY },
      label: marker.label,
      imageIndex: marker.imageIndex,
    });
  }

  return links;
}

/**
 * Creates a complete composition layout
 * @param config - Compositor configuration
 * @param input - Composition input data
 * @returns Complete composition layout
 */
export function createCompositionLayout(
  config: CompositorConfig,
  input: CompositionInput
): CompositionLayout {
  const dpi = config.dpi ?? DEFAULT_DPI;
  const spacing = mmToPixels(config.pictureSpacing, dpi);

  // Calculate layout areas
  const { pageDimensions, mapArea, borderAreas } = calculateLayoutAreas(config);

  // Distribute pictures
  const pictures = distributePictures(input.images, borderAreas, spacing);

  // Add labels to pictures based on links
  for (const link of input.links) {
    const picture = pictures.find((p) => p.imageIndex === link.imageIndex);
    if (picture) {
      picture.label = link.label;
    }
  }

  // Transform links to the format expected by calculateLinkLines
  const markerPositions = input.links.map((link) => ({
    imageIndex: link.imageIndex,
    x: link.markerPosition.x,
    y: link.markerPosition.y,
    label: link.label,
  }));

  // Calculate link lines
  const links = calculateLinkLines(pictures, markerPositions, mapArea);

  return {
    pageDimensions,
    dpi,
    mapArea,
    borderAreas,
    pictures,
    links,
  };
}

/**
 * Gets the center point of a rectangle
 * @param rect - Rectangle
 * @returns Center point coordinates
 */
export function getRectCenter(rect: Rectangle): { x: number; y: number } {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
}

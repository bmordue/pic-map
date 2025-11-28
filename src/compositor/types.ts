/**
 * Types for the compositor module
 */

import { RenderedMap, PictureBorderStyle, ImageMetadata, LinkStyle } from '../types';

/**
 * Page size identifier
 */
export type PageSizeId = 'A4' | 'Letter' | 'A3' | 'custom';

/**
 * Dimensions in millimeters
 */
export interface Dimensions {
  /** Width in millimeters */
  width: number;
  /** Height in millimeters */
  height: number;
}

/**
 * Page orientation
 */
export type Orientation = 'portrait' | 'landscape';

/**
 * Standard page sizes in millimeters (portrait orientation)
 */
export const PAGE_SIZES: Record<Exclude<PageSizeId, 'custom'>, Dimensions> = {
  A4: { width: 210, height: 297 },
  Letter: { width: 215.9, height: 279.4 },
  A3: { width: 297, height: 420 },
};

/**
 * Margin specification
 */
export interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Rectangle specification for positioning elements
 */
export interface Rectangle {
  /** X position (from left) in pixels */
  x: number;
  /** Y position (from top) in pixels */
  y: number;
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
}

/**
 * Position of a picture in the border
 */
export type BorderPosition = 'top' | 'right' | 'bottom' | 'left';

/**
 * Positioned picture element in the border
 */
export interface PositionedPicture {
  /** Original image metadata */
  image: ImageMetadata;
  /** Position of the picture frame */
  rect: Rectangle;
  /** Which border the picture is on */
  borderPosition: BorderPosition;
  /** Index of the image in the original array */
  imageIndex: number;
  /** Label for linking to map marker */
  label?: string;
}

/**
 * Link line between a picture and a map marker
 */
export interface LinkLine {
  /** Start point (picture edge) */
  start: { x: number; y: number };
  /** End point (map marker position) */
  end: { x: number; y: number };
  /** Label for the link */
  label?: string;
  /** Index of the associated image */
  imageIndex: number;
}

/**
 * Layout specification for the composition
 */
export interface CompositionLayout {
  /** Total page dimensions in pixels */
  pageDimensions: Dimensions;
  /** DPI used for rendering */
  dpi: number;
  /** Map area rectangle */
  mapArea: Rectangle;
  /** Picture border areas */
  borderAreas: {
    top: Rectangle;
    right: Rectangle;
    bottom: Rectangle;
    left: Rectangle;
  };
  /** Positioned pictures */
  pictures: PositionedPicture[];
  /** Link lines between pictures and markers */
  links: LinkLine[];
}

/**
 * Rendered picture element
 */
export interface RenderedPicture {
  /** SVG string for the picture frame */
  svg: string;
  /** Bounding rectangle */
  rect: Rectangle;
}

/**
 * Rendered composition output
 */
export interface RenderedComposition {
  /** Complete SVG string */
  svg: string;
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
  /** DPI used for rendering */
  dpi: number;
  /** Page size in millimeters */
  pageSizeMm: Dimensions;
}

/**
 * Configuration for the compositor
 */
export interface CompositorConfig {
  /** Page size identifier */
  pageSize: PageSizeId;
  /** Custom dimensions (required if pageSize is 'custom') */
  customDimensions?: Dimensions;
  /** Page orientation */
  orientation: Orientation;
  /** Border width for pictures in mm */
  borderWidth: number;
  /** Spacing between pictures in mm */
  pictureSpacing: number;
  /** Margin around the composition in mm */
  margin: Margin;
  /** DPI for rendering (default 300 for print quality) */
  dpi?: number;
  /** Picture border styling */
  pictureBorderStyle?: PictureBorderStyle;
  /** Link styling */
  linkStyle?: LinkStyle;
}

/**
 * Input data for composition
 */
export interface CompositionInput {
  /** Rendered map */
  map: RenderedMap;
  /** Image metadata array */
  images: ImageMetadata[];
  /** Links between images and map locations (imageIndex, marker position) */
  links: Array<{
    imageIndex: number;
    markerPosition: { x: number; y: number };
    label?: string;
  }>;
}

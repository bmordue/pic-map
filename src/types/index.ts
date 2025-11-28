/**
 * Core type definitions for Pic-Map
 */

/**
 * Geographic location with coordinates and optional place name
 */
export interface GeoLocation {
  /** Latitude in decimal degrees (-90 to 90) */
  latitude: number;
  /** Longitude in decimal degrees (-180 to 180) */
  longitude: number;
  /** Optional name for the location */
  name?: string;
  /** Optional description or address */
  description?: string;
}

/**
 * Image dimensions in pixels
 */
export interface ImageDimensions {
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
}

/**
 * Image metadata including file information and display properties
 */
export interface ImageMetadata {
  /** Path to the image file (relative or absolute) */
  filePath: string;
  /** Optional caption to display with the image */
  caption?: string;
  /** Image dimensions in pixels */
  dimensions?: ImageDimensions;
  /** Optional alternative text for accessibility */
  altText?: string;
  /** Optional photographer/creator credit */
  credit?: string;
}

/**
 * Link between an image and a geographic location
 */
export interface ImageLocationLink {
  /** Reference to the image (by index or ID) */
  imageId: string;
  /** Geographic location to link to */
  location: GeoLocation;
  /** Optional label for the link (e.g., "A", "1", etc.) */
  label?: string;
}

/**
 * Layout options for the picture border
 */
export interface LayoutOptions {
  /** Page size preset or custom dimensions */
  pageSize: 'A4' | 'Letter' | 'A3' | 'custom';
  /** Custom page dimensions if pageSize is 'custom' (in mm) */
  customDimensions?: {
    width: number;
    height: number;
  };
  /** Orientation of the page */
  orientation: 'portrait' | 'landscape';
  /** Border width for pictures (in mm) */
  borderWidth: number;
  /** Spacing between pictures (in mm) */
  pictureSpacing: number;
  /** Margin around the entire composition (in mm) */
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

/**
 * Map styling options
 */
export interface MapStyle {
  /** Map provider/style type */
  provider: 'openstreetmap' | 'custom';
  /** Zoom level for the map */
  zoom: number;
  /** Center point of the map */
  center: GeoLocation;
  /** Show map scale */
  showScale?: boolean;
  /** Show attribution */
  showAttribution?: boolean;
}

/**
 * Picture border styling options
 */
export interface PictureBorderStyle {
  /** Background color for picture frames */
  backgroundColor?: string;
  /** Border color for picture frames */
  borderColor?: string;
  /** Border thickness in pixels */
  borderThickness?: number;
  /** Corner radius for rounded borders (in pixels) */
  cornerRadius?: number;
}

/**
 * Link visualization styling
 */
export interface LinkStyle {
  /** Type of link indicator */
  type: 'line' | 'label' | 'both' | 'none';
  /** Color for link lines */
  lineColor?: string;
  /** Line width in pixels */
  lineWidth?: number;
  /** Line style */
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  /** Label style (if using labels) */
  labelStyle?: {
    fontFamily?: string;
    fontSize?: number;
    color?: string;
  };
}

/**
 * Complete configuration schema for a Pic-Map project
 */
export interface PicMapConfig {
  /** Project title */
  title: string;
  /** Optional project description */
  description?: string;
  /** Layout configuration */
  layout: LayoutOptions;
  /** Map configuration */
  map: MapStyle;
  /** Picture border styling */
  pictureBorder?: PictureBorderStyle;
  /** Link styling */
  linkStyle?: LinkStyle;
  /** List of images with metadata */
  images: ImageMetadata[];
  /** Links between images and locations */
  links: ImageLocationLink[];
}

/**
 * Validation result type
 */
export interface ValidationResult {
  /** Whether the data is valid */
  valid: boolean;
  /** Error messages if validation failed */
  errors: string[];
}

/**
 * Pixel coordinates for rendering
 */
export interface PixelCoordinate {
  /** X coordinate in pixels */
  x: number;
  /** Y coordinate in pixels */
  y: number;
}

/**
 * Bounding box for map area
 */
export interface BoundingBox {
  /** North latitude */
  north: number;
  /** South latitude */
  south: number;
  /** East longitude */
  east: number;
  /** West longitude */
  west: number;
}

/**
 * Map marker configuration
 */
export interface MapMarker {
  /** Geographic location of the marker */
  location: GeoLocation;
  /** Label to display on/near the marker */
  label?: string;
  /** Marker style/color */
  style?: {
    color?: string;
    size?: number;
    shape?: 'circle' | 'pin' | 'square';
  };
}

/**
 * Rendered map output
 */
export interface RenderedMap {
  /** SVG string containing the map */
  svg: string;
  /** Width of the map in pixels */
  width: number;
  /** Height of the map in pixels */
  height: number;
  /** Bounding box of the rendered area */
  bounds: BoundingBox;
}

/**
 * Edge of the picture border
 */
export type BorderEdge = 'top' | 'right' | 'bottom' | 'left';

/**
 * A slot where a picture can be placed in the border
 */
export interface PictureSlot {
  /** Unique identifier for the slot */
  id: string;
  /** Edge of the border where the slot is located */
  edge: BorderEdge;
  /** X coordinate of the slot (top-left corner) */
  x: number;
  /** Y coordinate of the slot (top-left corner) */
  y: number;
  /** Width of the slot in pixels */
  width: number;
  /** Height of the slot in pixels */
  height: number;
  /** Index of the slot within its edge (0-based) */
  edgeIndex: number;
}

/**
 * A positioned picture with its placement information
 */
export interface PositionedPicture {
  /** The image metadata */
  image: ImageMetadata;
  /** The slot where the picture is placed */
  slot: PictureSlot;
  /** Actual rendered width (may differ from slot due to aspect ratio) */
  renderWidth: number;
  /** Actual rendered height (may differ from slot due to aspect ratio) */
  renderHeight: number;
  /** X offset within the slot for centering */
  offsetX: number;
  /** Y offset within the slot for centering */
  offsetY: number;
  /** Optional label associated with this picture */
  label?: string;
  /** Center point of the rendered picture for link drawing */
  centerX: number;
  /** Center point of the rendered picture for link drawing */
  centerY: number;
}

/**
 * Border layout information
 */
export interface BorderLayout {
  /** Total width of the page in pixels */
  pageWidth: number;
  /** Total height of the page in pixels */
  pageHeight: number;
  /** Width of the border area (where pictures go) in pixels */
  borderWidth: number;
  /** Inner area where the map is rendered */
  innerArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** All available picture slots */
  slots: PictureSlot[];
  /** Margin in pixels */
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  /** Spacing between pictures in pixels */
  pictureSpacing: number;
}

/**
 * Rendered picture border output
 */
export interface RenderedPictureBorder {
  /** SVG string containing the picture border */
  svg: string;
  /** Width of the border in pixels */
  width: number;
  /** Height of the border in pixels */
  height: number;
  /** Layout information used for rendering */
  layout: BorderLayout;
  /** Positioned pictures with their placement information */
  positionedPictures: PositionedPicture[];
}

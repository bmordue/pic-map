/**
 * Data validation utilities for Pic-Map
 */

import {
  GeoLocation,
  ImageMetadata,
  ImageDimensions,
  PicMapConfig,
  LayoutOptions,
  MapStyle,
  ImageLocationLink,
  ValidationResult,
} from '../types';

/**
 * Validates a geographic location
 */
export function validateGeoLocation(location: unknown): ValidationResult {
  const errors: string[] = [];

  if (typeof location !== 'object' || location === null) {
    return { valid: false, errors: ['Location must be an object'] };
  }

  const loc = location as Partial<GeoLocation>;

  // Validate latitude
  if (typeof loc.latitude !== 'number') {
    errors.push('Latitude must be a number');
  } else if (loc.latitude < -90 || loc.latitude > 90) {
    errors.push('Latitude must be between -90 and 90');
  }

  // Validate longitude
  if (typeof loc.longitude !== 'number') {
    errors.push('Longitude must be a number');
  } else if (loc.longitude < -180 || loc.longitude > 180) {
    errors.push('Longitude must be between -180 and 180');
  }

  // Optional fields
  if (loc.name !== undefined && typeof loc.name !== 'string') {
    errors.push('Name must be a string');
  }

  if (loc.description !== undefined && typeof loc.description !== 'string') {
    errors.push('Description must be a string');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates image dimensions
 */
export function validateImageDimensions(
  dimensions: unknown,
): ValidationResult {
  const errors: string[] = [];

  if (typeof dimensions !== 'object' || dimensions === null) {
    return { valid: false, errors: ['Dimensions must be an object'] };
  }

  const dims = dimensions as Partial<ImageDimensions>;

  if (typeof dims.width !== 'number') {
    errors.push('Width must be a number');
  } else if (dims.width <= 0) {
    errors.push('Width must be positive');
  }

  if (typeof dims.height !== 'number') {
    errors.push('Height must be a number');
  } else if (dims.height <= 0) {
    errors.push('Height must be positive');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates image metadata
 */
export function validateImageMetadata(metadata: unknown): ValidationResult {
  const errors: string[] = [];

  if (typeof metadata !== 'object' || metadata === null) {
    return { valid: false, errors: ['Metadata must be an object'] };
  }

  const meta = metadata as Partial<ImageMetadata>;

  // Required field
  if (typeof meta.filePath !== 'string') {
    errors.push('filePath must be a string');
  } else if (meta.filePath.trim() === '') {
    errors.push('filePath cannot be empty');
  }

  // Optional fields
  if (meta.caption !== undefined && typeof meta.caption !== 'string') {
    errors.push('caption must be a string');
  }

  if (meta.altText !== undefined && typeof meta.altText !== 'string') {
    errors.push('altText must be a string');
  }

  if (meta.credit !== undefined && typeof meta.credit !== 'string') {
    errors.push('credit must be a string');
  }

  if (meta.dimensions !== undefined) {
    const dimResult = validateImageDimensions(meta.dimensions);
    if (!dimResult.valid) {
      errors.push(...dimResult.errors.map((e) => `dimensions.${e}`));
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates layout options
 */
export function validateLayoutOptions(layout: unknown): ValidationResult {
  const errors: string[] = [];

  if (typeof layout !== 'object' || layout === null) {
    return { valid: false, errors: ['Layout must be an object'] };
  }

  const opts = layout as Partial<LayoutOptions>;

  // Validate pageSize
  const validPageSizes = ['A4', 'Letter', 'A3', 'custom'];
  if (typeof opts.pageSize !== 'string') {
    errors.push('pageSize must be a string');
  } else if (!validPageSizes.includes(opts.pageSize)) {
    errors.push(
      `pageSize must be one of: ${validPageSizes.join(', ')}`,
    );
  }

  // If custom, check customDimensions
  if (opts.pageSize === 'custom') {
    if (!opts.customDimensions) {
      errors.push('customDimensions required when pageSize is "custom"');
    } else {
      const dims = opts.customDimensions;
      if (typeof dims.width !== 'number' || dims.width <= 0) {
        errors.push('customDimensions.width must be a positive number');
      }
      if (typeof dims.height !== 'number' || dims.height <= 0) {
        errors.push('customDimensions.height must be a positive number');
      }
    }
  }

  // Validate orientation
  const validOrientations = ['portrait', 'landscape'];
  if (typeof opts.orientation !== 'string') {
    errors.push('orientation must be a string');
  } else if (!validOrientations.includes(opts.orientation)) {
    errors.push(
      `orientation must be one of: ${validOrientations.join(', ')}`,
    );
  }

  // Validate numeric fields
  if (typeof opts.borderWidth !== 'number') {
    errors.push('borderWidth must be a number');
  } else if (opts.borderWidth < 0) {
    errors.push('borderWidth must be non-negative');
  }

  if (typeof opts.pictureSpacing !== 'number') {
    errors.push('pictureSpacing must be a number');
  } else if (opts.pictureSpacing < 0) {
    errors.push('pictureSpacing must be non-negative');
  }

  // Validate margin
  if (!opts.margin || typeof opts.margin !== 'object') {
    errors.push('margin must be an object');
  } else {
    const margin = opts.margin;
    const sides = ['top', 'right', 'bottom', 'left'] as const;
    for (const side of sides) {
      if (typeof margin[side] !== 'number') {
        errors.push(`margin.${side} must be a number`);
      } else if (margin[side] < 0) {
        errors.push(`margin.${side} must be non-negative`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates map style configuration
 */
export function validateMapStyle(mapStyle: unknown): ValidationResult {
  const errors: string[] = [];

  if (typeof mapStyle !== 'object' || mapStyle === null) {
    return { valid: false, errors: ['MapStyle must be an object'] };
  }

  const style = mapStyle as Partial<MapStyle>;

  // Validate provider
  const validProviders = ['openstreetmap', 'custom'];
  if (typeof style.provider !== 'string') {
    errors.push('provider must be a string');
  } else if (!validProviders.includes(style.provider)) {
    errors.push(`provider must be one of: ${validProviders.join(', ')}`);
  }

  // Validate zoom
  if (typeof style.zoom !== 'number') {
    errors.push('zoom must be a number');
  } else if (style.zoom < 0 || style.zoom > 20) {
    errors.push('zoom must be between 0 and 20');
  }

  // Validate center
  if (!style.center) {
    errors.push('center is required');
  } else {
    const centerResult = validateGeoLocation(style.center);
    if (!centerResult.valid) {
      errors.push(
        ...centerResult.errors.map((e) => `center.${e}`),
      );
    }
  }

  // Optional boolean fields
  if (
    style.showScale !== undefined &&
    typeof style.showScale !== 'boolean'
  ) {
    errors.push('showScale must be a boolean');
  }

  if (
    style.showAttribution !== undefined &&
    typeof style.showAttribution !== 'boolean'
  ) {
    errors.push('showAttribution must be a boolean');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates image-location link
 */
export function validateImageLocationLink(link: unknown): ValidationResult {
  const errors: string[] = [];

  if (typeof link !== 'object' || link === null) {
    return { valid: false, errors: ['Link must be an object'] };
  }

  const lnk = link as Partial<ImageLocationLink>;

  // Validate imageId
  if (typeof lnk.imageId !== 'string') {
    errors.push('imageId must be a string');
  } else if (lnk.imageId.trim() === '') {
    errors.push('imageId cannot be empty');
  }

  // Validate location
  if (!lnk.location) {
    errors.push('location is required');
  } else {
    const locResult = validateGeoLocation(lnk.location);
    if (!locResult.valid) {
      errors.push(...locResult.errors.map((e) => `location.${e}`));
    }
  }

  // Optional label
  if (lnk.label !== undefined && typeof lnk.label !== 'string') {
    errors.push('label must be a string');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a complete PicMap configuration
 */
export function validatePicMapConfig(config: unknown): ValidationResult {
  const errors: string[] = [];

  if (typeof config !== 'object' || config === null) {
    return { valid: false, errors: ['Config must be an object'] };
  }

  const cfg = config as Partial<PicMapConfig>;

  // Validate title
  if (typeof cfg.title !== 'string') {
    errors.push('title must be a string');
  } else if (cfg.title.trim() === '') {
    errors.push('title cannot be empty');
  }

  // Optional description
  if (cfg.description !== undefined && typeof cfg.description !== 'string') {
    errors.push('description must be a string');
  }

  // Validate layout
  if (!cfg.layout) {
    errors.push('layout is required');
  } else {
    const layoutResult = validateLayoutOptions(cfg.layout);
    if (!layoutResult.valid) {
      errors.push(...layoutResult.errors.map((e) => `layout.${e}`));
    }
  }

  // Validate map
  if (!cfg.map) {
    errors.push('map is required');
  } else {
    const mapResult = validateMapStyle(cfg.map);
    if (!mapResult.valid) {
      errors.push(...mapResult.errors.map((e) => `map.${e}`));
    }
  }

  // Validate images array
  if (!Array.isArray(cfg.images)) {
    errors.push('images must be an array');
  } else {
    cfg.images.forEach((img, idx) => {
      const imgResult = validateImageMetadata(img);
      if (!imgResult.valid) {
        errors.push(
          ...imgResult.errors.map((e) => `images[${idx}].${e}`),
        );
      }
    });
  }

  // Validate links array
  if (!Array.isArray(cfg.links)) {
    errors.push('links must be an array');
  } else {
    cfg.links.forEach((link, idx) => {
      const linkResult = validateImageLocationLink(link);
      if (!linkResult.valid) {
        errors.push(
          ...linkResult.errors.map((e) => `links[${idx}].${e}`),
        );
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Type guard to check if a value is a valid GeoLocation
 */
export function isGeoLocation(value: unknown): value is GeoLocation {
  return validateGeoLocation(value).valid;
}

/**
 * Type guard to check if a value is valid ImageMetadata
 */
export function isImageMetadata(value: unknown): value is ImageMetadata {
  return validateImageMetadata(value).valid;
}

/**
 * Type guard to check if a value is a valid PicMapConfig
 */
export function isPicMapConfig(value: unknown): value is PicMapConfig {
  return validatePicMapConfig(value).valid;
}

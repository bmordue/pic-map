/**
 * Data loading and parsing utilities for Pic-Map
 */

import { readFile } from 'fs/promises';
import { PicMapConfig } from '../types';
import { validatePicMapConfig } from '../validators';

/**
 * Error thrown when config loading fails
 */
export class ConfigLoadError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'ConfigLoadError';
  }
}

/**
 * Error thrown when config validation fails
 */
export class ConfigValidationError extends Error {
  constructor(
    message: string,
    public readonly validationErrors: string[]
  ) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

/**
 * Parses a JSON string into a PicMapConfig object
 * @param jsonString - JSON string to parse
 * @returns Parsed and validated configuration
 * @throws ConfigValidationError if validation fails
 */
export function parseConfigFromJSON(jsonString: string): PicMapConfig {
  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonString);
  } catch (error) {
    throw new ConfigLoadError('Failed to parse JSON', error instanceof Error ? error : undefined);
  }

  const validationResult = validatePicMapConfig(parsed);

  if (!validationResult.valid) {
    throw new ConfigValidationError('Configuration validation failed', validationResult.errors);
  }

  return parsed as PicMapConfig;
}

/**
 * Loads a PicMapConfig from a JSON file
 * @param filePath - Path to the JSON configuration file
 * @returns Parsed and validated configuration
 * @throws ConfigLoadError if file cannot be read
 * @throws ConfigValidationError if validation fails
 */
export async function loadConfigFromFile(filePath: string): Promise<PicMapConfig> {
  let content: string;

  try {
    content = await readFile(filePath, 'utf-8');
  } catch (error) {
    throw new ConfigLoadError(
      `Failed to read config file: ${filePath}`,
      error instanceof Error ? error : undefined
    );
  }

  return parseConfigFromJSON(content);
}

/**
 * Normalizes a configuration object by filling in default values
 * @param config - Configuration to normalize
 * @returns Normalized configuration with defaults applied
 */
export function normalizeConfig(config: PicMapConfig): PicMapConfig {
  // Merge default labelStyle with user-provided labelStyle
  const defaultLabelStyle = {
    fontFamily: 'Arial',
    fontSize: 12,
    color: '#000000',
  };

  const normalizedLabelStyle = {
    ...defaultLabelStyle,
    ...config.linkStyle?.labelStyle,
  };

  // Destructure linkStyle to separate labelStyle from other properties
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { labelStyle: _, ...restLinkStyle } = config.linkStyle ?? {};

  return {
    ...config,
    // Apply default picture border style if not provided
    pictureBorder: {
      backgroundColor: '#ffffff',
      borderColor: '#000000',
      borderThickness: 1,
      cornerRadius: 0,
      ...config.pictureBorder,
    },
    // Apply default link style if not provided
    linkStyle: {
      type: 'label',
      lineColor: '#000000',
      lineWidth: 1,
      lineStyle: 'solid',
      labelStyle: normalizedLabelStyle,
      ...restLinkStyle,
    },
    // Apply default map options if not provided
    map: {
      ...config.map,
      showScale: config.map.showScale ?? true,
      showAttribution: config.map.showAttribution ?? true,
    },
  };
}

/**
 * Validates that all image IDs referenced in links exist in the images array
 * @param config - Configuration to validate
 * @returns Array of error messages, empty if valid
 */
export function validateImageReferences(config: PicMapConfig): string[] {
  const errors: string[] = [];
  const imageIds = new Set<string>();

  // Build a set of valid image IDs (using array indices as IDs)
  config.images.forEach((_, idx) => {
    imageIds.add(idx.toString());
  });

  // Check each link references a valid image
  config.links.forEach((link, linkIdx) => {
    if (!imageIds.has(link.imageId)) {
      errors.push(`Link ${linkIdx} references non-existent image ID: ${link.imageId}`);
    }
  });

  return errors;
}

/**
 * Performs comprehensive validation of a configuration including cross-references
 * @param config - Configuration to validate
 * @returns Array of error messages, empty if valid
 */
export function validateConfigReferences(config: PicMapConfig): string[] {
  const errors: string[] = [];

  // Validate image references
  errors.push(...validateImageReferences(config));

  // Check for duplicate image IDs in links
  const imageIdCounts = new Map<string, number>();
  config.links.forEach((link) => {
    const count = imageIdCounts.get(link.imageId) ?? 0;
    imageIdCounts.set(link.imageId, count + 1);
  });

  imageIdCounts.forEach((count, imageId) => {
    if (count > 1) {
      errors.push(`Image ID ${imageId} is referenced in multiple links`);
    }
  });

  return errors;
}

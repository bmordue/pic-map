import { describe, it, expect } from 'vitest';
import {
  validateGeoLocation,
  validateImageDimensions,
  validateImageMetadata,
  validateLayoutOptions,
  validateMapStyle,
  validateImageLocationLink,
  validatePicMapConfig,
  isGeoLocation,
  isImageMetadata,
  isPicMapConfig,
} from './index';
import type {
  GeoLocation,
  ImageMetadata,
  LayoutOptions,
  MapStyle,
  PicMapConfig,
} from '../types';

describe('validateGeoLocation', () => {
  it('should validate a valid location', () => {
    const location: GeoLocation = {
      latitude: 51.5074,
      longitude: -0.1278,
      name: 'London',
    };
    const result = validateGeoLocation(location);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject invalid latitude', () => {
    const result = validateGeoLocation({ latitude: 91, longitude: 0 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Latitude must be between -90 and 90');
  });

  it('should reject invalid longitude', () => {
    const result = validateGeoLocation({ latitude: 0, longitude: 181 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Longitude must be between -180 and 180');
  });

  it('should reject non-object input', () => {
    const result = validateGeoLocation('not an object');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Location must be an object');
  });

  it('should reject missing latitude', () => {
    const result = validateGeoLocation({ longitude: 0 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Latitude must be a number');
  });

  it('should reject missing longitude', () => {
    const result = validateGeoLocation({ latitude: 0 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Longitude must be a number');
  });

  it('should accept location without optional fields', () => {
    const result = validateGeoLocation({ latitude: 0, longitude: 0 });
    expect(result.valid).toBe(true);
  });
});

describe('validateImageDimensions', () => {
  it('should validate valid dimensions', () => {
    const result = validateImageDimensions({ width: 800, height: 600 });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject negative width', () => {
    const result = validateImageDimensions({ width: -1, height: 600 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Width must be positive');
  });

  it('should reject zero height', () => {
    const result = validateImageDimensions({ width: 800, height: 0 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Height must be positive');
  });

  it('should reject non-object input', () => {
    const result = validateImageDimensions(null);
    expect(result.valid).toBe(false);
  });
});

describe('validateImageMetadata', () => {
  it('should validate valid metadata', () => {
    const metadata: ImageMetadata = {
      filePath: '/path/to/image.jpg',
      caption: 'A beautiful sunset',
      dimensions: { width: 800, height: 600 },
    };
    const result = validateImageMetadata(metadata);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject missing filePath', () => {
    const result = validateImageMetadata({ caption: 'Test' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('filePath must be a string');
  });

  it('should reject empty filePath', () => {
    const result = validateImageMetadata({ filePath: '   ' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('filePath cannot be empty');
  });

  it('should accept metadata with only required fields', () => {
    const result = validateImageMetadata({ filePath: '/path/to/image.jpg' });
    expect(result.valid).toBe(true);
  });

  it('should validate nested dimensions', () => {
    const result = validateImageMetadata({
      filePath: '/path/to/image.jpg',
      dimensions: { width: -1, height: 600 },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('dimensions'))).toBe(true);
  });
});

describe('validateLayoutOptions', () => {
  it('should validate valid layout options', () => {
    const layout: LayoutOptions = {
      pageSize: 'A4',
      orientation: 'portrait',
      borderWidth: 50,
      pictureSpacing: 10,
      margin: { top: 20, right: 20, bottom: 20, left: 20 },
    };
    const result = validateLayoutOptions(layout);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject invalid pageSize', () => {
    const layout = {
      pageSize: 'Invalid',
      orientation: 'portrait',
      borderWidth: 50,
      pictureSpacing: 10,
      margin: { top: 20, right: 20, bottom: 20, left: 20 },
    };
    const result = validateLayoutOptions(layout);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('pageSize'))).toBe(true);
  });

  it('should require customDimensions when pageSize is custom', () => {
    const layout = {
      pageSize: 'custom',
      orientation: 'portrait',
      borderWidth: 50,
      pictureSpacing: 10,
      margin: { top: 20, right: 20, bottom: 20, left: 20 },
    };
    const result = validateLayoutOptions(layout);
    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) => e.includes('customDimensions')),
    ).toBe(true);
  });

  it('should accept custom pageSize with valid dimensions', () => {
    const layout = {
      pageSize: 'custom',
      customDimensions: { width: 300, height: 400 },
      orientation: 'portrait',
      borderWidth: 50,
      pictureSpacing: 10,
      margin: { top: 20, right: 20, bottom: 20, left: 20 },
    };
    const result = validateLayoutOptions(layout);
    expect(result.valid).toBe(true);
  });

  it('should reject negative borderWidth', () => {
    const layout = {
      pageSize: 'A4',
      orientation: 'portrait',
      borderWidth: -5,
      pictureSpacing: 10,
      margin: { top: 20, right: 20, bottom: 20, left: 20 },
    };
    const result = validateLayoutOptions(layout);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('borderWidth'))).toBe(true);
  });

  it('should reject invalid orientation', () => {
    const layout = {
      pageSize: 'A4',
      orientation: 'diagonal',
      borderWidth: 50,
      pictureSpacing: 10,
      margin: { top: 20, right: 20, bottom: 20, left: 20 },
    };
    const result = validateLayoutOptions(layout);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('orientation'))).toBe(true);
  });

  it('should reject negative margin values', () => {
    const layout = {
      pageSize: 'A4',
      orientation: 'portrait',
      borderWidth: 50,
      pictureSpacing: 10,
      margin: { top: -1, right: 20, bottom: 20, left: 20 },
    };
    const result = validateLayoutOptions(layout);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('margin.top'))).toBe(true);
  });
});

describe('validateMapStyle', () => {
  it('should validate valid map style', () => {
    const mapStyle: MapStyle = {
      provider: 'openstreetmap',
      zoom: 10,
      center: { latitude: 51.5074, longitude: -0.1278 },
      showScale: true,
      showAttribution: true,
    };
    const result = validateMapStyle(mapStyle);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject invalid provider', () => {
    const mapStyle = {
      provider: 'invalid',
      zoom: 10,
      center: { latitude: 51.5074, longitude: -0.1278 },
    };
    const result = validateMapStyle(mapStyle);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('provider'))).toBe(true);
  });

  it('should reject invalid zoom level', () => {
    const mapStyle = {
      provider: 'openstreetmap',
      zoom: 25,
      center: { latitude: 51.5074, longitude: -0.1278 },
    };
    const result = validateMapStyle(mapStyle);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('zoom'))).toBe(true);
  });

  it('should reject missing center', () => {
    const mapStyle = {
      provider: 'openstreetmap',
      zoom: 10,
    };
    const result = validateMapStyle(mapStyle);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('center'))).toBe(true);
  });

  it('should validate nested center location', () => {
    const mapStyle = {
      provider: 'openstreetmap',
      zoom: 10,
      center: { latitude: 91, longitude: 0 },
    };
    const result = validateMapStyle(mapStyle);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('center'))).toBe(true);
  });
});

describe('validateImageLocationLink', () => {
  it('should validate valid link', () => {
    const link = {
      imageId: '0',
      location: { latitude: 51.5074, longitude: -0.1278 },
      label: 'A',
    };
    const result = validateImageLocationLink(link);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject empty imageId', () => {
    const link = {
      imageId: '   ',
      location: { latitude: 51.5074, longitude: -0.1278 },
    };
    const result = validateImageLocationLink(link);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('imageId'))).toBe(true);
  });

  it('should reject missing location', () => {
    const link = {
      imageId: '0',
    };
    const result = validateImageLocationLink(link);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('location'))).toBe(true);
  });

  it('should accept link without optional label', () => {
    const link = {
      imageId: '0',
      location: { latitude: 51.5074, longitude: -0.1278 },
    };
    const result = validateImageLocationLink(link);
    expect(result.valid).toBe(true);
  });
});

describe('validatePicMapConfig', () => {
  const validConfig: PicMapConfig = {
    title: 'My Map',
    description: 'A test map',
    layout: {
      pageSize: 'A4',
      orientation: 'portrait',
      borderWidth: 50,
      pictureSpacing: 10,
      margin: { top: 20, right: 20, bottom: 20, left: 20 },
    },
    map: {
      provider: 'openstreetmap',
      zoom: 10,
      center: { latitude: 51.5074, longitude: -0.1278 },
    },
    images: [
      { filePath: '/path/to/image1.jpg' },
      { filePath: '/path/to/image2.jpg' },
    ],
    links: [
      {
        imageId: '0',
        location: { latitude: 51.5074, longitude: -0.1278 },
      },
    ],
  };

  it('should validate a complete valid config', () => {
    const result = validatePicMapConfig(validConfig);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject missing title', () => {
    const config = { ...validConfig, title: undefined };
    const result = validatePicMapConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('title'))).toBe(true);
  });

  it('should reject empty title', () => {
    const config = { ...validConfig, title: '   ' };
    const result = validatePicMapConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('title'))).toBe(true);
  });

  it('should reject missing layout', () => {
    const config = { ...validConfig, layout: undefined };
    const result = validatePicMapConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('layout'))).toBe(true);
  });

  it('should reject missing map', () => {
    const config = { ...validConfig, map: undefined };
    const result = validatePicMapConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('map'))).toBe(true);
  });

  it('should reject non-array images', () => {
    const config = { ...validConfig, images: 'not an array' };
    const result = validatePicMapConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('images'))).toBe(true);
  });

  it('should reject non-array links', () => {
    const config = { ...validConfig, links: 'not an array' };
    const result = validatePicMapConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('links'))).toBe(true);
  });

  it('should validate individual images in array', () => {
    const config = {
      ...validConfig,
      images: [{ filePath: '/valid.jpg' }, { filePath: '' }],
    };
    const result = validatePicMapConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('images[1]'))).toBe(true);
  });

  it('should validate individual links in array', () => {
    const config = {
      ...validConfig,
      links: [
        {
          imageId: '0',
          location: { latitude: 51.5074, longitude: -0.1278 },
        },
        {
          imageId: '',
          location: { latitude: 51.5074, longitude: -0.1278 },
        },
      ],
    };
    const result = validatePicMapConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('links[1]'))).toBe(true);
  });

  it('should accept config without optional description', () => {
    const config = { ...validConfig, description: undefined };
    const result = validatePicMapConfig(config);
    expect(result.valid).toBe(true);
  });
});

describe('Type Guards', () => {
  describe('isGeoLocation', () => {
    it('should return true for valid location', () => {
      const location: GeoLocation = {
        latitude: 51.5074,
        longitude: -0.1278,
      };
      expect(isGeoLocation(location)).toBe(true);
    });

    it('should return false for invalid location', () => {
      expect(isGeoLocation({ latitude: 91, longitude: 0 })).toBe(false);
    });
  });

  describe('isImageMetadata', () => {
    it('should return true for valid metadata', () => {
      const metadata: ImageMetadata = { filePath: '/path/to/image.jpg' };
      expect(isImageMetadata(metadata)).toBe(true);
    });

    it('should return false for invalid metadata', () => {
      expect(isImageMetadata({ filePath: '' })).toBe(false);
    });
  });

  describe('isPicMapConfig', () => {
    it('should return true for valid config', () => {
      const config: PicMapConfig = {
        title: 'Test',
        layout: {
          pageSize: 'A4',
          orientation: 'portrait',
          borderWidth: 50,
          pictureSpacing: 10,
          margin: { top: 20, right: 20, bottom: 20, left: 20 },
        },
        map: {
          provider: 'openstreetmap',
          zoom: 10,
          center: { latitude: 0, longitude: 0 },
        },
        images: [],
        links: [],
      };
      expect(isPicMapConfig(config)).toBe(true);
    });

    it('should return false for invalid config', () => {
      expect(isPicMapConfig({ title: '' })).toBe(false);
    });
  });
});

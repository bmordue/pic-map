import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import {
  parseConfigFromJSON,
  loadConfigFromFile,
  normalizeConfig,
  validateImageReferences,
  validateConfigReferences,
  ConfigLoadError,
  ConfigValidationError,
} from './index';
import type { PicMapConfig } from '../types';

describe('parseConfigFromJSON', () => {
  const validConfigJSON = JSON.stringify({
    title: 'Test Map',
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
    images: [{ filePath: '/path/to/image.jpg' }],
    links: [
      {
        imageId: '0',
        location: { latitude: 51.5074, longitude: -0.1278 },
      },
    ],
  });

  it('should parse valid JSON config', () => {
    const config = parseConfigFromJSON(validConfigJSON);
    expect(config.title).toBe('Test Map');
    expect(config.images).toHaveLength(1);
  });

  it('should throw ConfigLoadError for invalid JSON', () => {
    expect(() => parseConfigFromJSON('not valid json{')).toThrow(
      ConfigLoadError,
    );
  });

  it('should throw ConfigValidationError for invalid config', () => {
    const invalidConfig = JSON.stringify({ title: '' });
    expect(() => parseConfigFromJSON(invalidConfig)).toThrow(
      ConfigValidationError,
    );
  });

  it('should include validation errors in exception', () => {
    const invalidConfig = JSON.stringify({ title: '' });
    try {
      parseConfigFromJSON(invalidConfig);
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ConfigValidationError);
      if (error instanceof ConfigValidationError) {
        expect(error.validationErrors.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('loadConfigFromFile', () => {
  const testDir = join(tmpdir(), 'pic-map-test');
  const testFile = join(testDir, 'test-config.json');

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('should load valid config from file', async () => {
    const validConfig = {
      title: 'Test Map',
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
      images: [{ filePath: '/path/to/image.jpg' }],
      links: [
        {
          imageId: '0',
          location: { latitude: 51.5074, longitude: -0.1278 },
        },
      ],
    };

    await writeFile(testFile, JSON.stringify(validConfig, null, 2));

    const config = await loadConfigFromFile(testFile);
    expect(config.title).toBe('Test Map');
    expect(config.images).toHaveLength(1);
  });

  it('should throw ConfigLoadError for non-existent file', async () => {
    await expect(
      loadConfigFromFile('/non/existent/file.json'),
    ).rejects.toThrow(ConfigLoadError);
  });

  it('should throw ConfigValidationError for invalid config file', async () => {
    await writeFile(testFile, JSON.stringify({ title: '' }));

    await expect(loadConfigFromFile(testFile)).rejects.toThrow(
      ConfigValidationError,
    );
  });

  it('should throw ConfigLoadError for malformed JSON file', async () => {
    await writeFile(testFile, 'not valid json{');

    await expect(loadConfigFromFile(testFile)).rejects.toThrow(
      ConfigLoadError,
    );
  });
});

describe('normalizeConfig', () => {
  const minimalConfig: PicMapConfig = {
    title: 'Test Map',
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
    images: [],
    links: [],
  };

  it('should apply default picture border style', () => {
    const normalized = normalizeConfig(minimalConfig);
    expect(normalized.pictureBorder).toBeDefined();
    expect(normalized.pictureBorder?.backgroundColor).toBe('#ffffff');
    expect(normalized.pictureBorder?.borderColor).toBe('#000000');
    expect(normalized.pictureBorder?.borderThickness).toBe(1);
    expect(normalized.pictureBorder?.cornerRadius).toBe(0);
  });

  it('should apply default link style', () => {
    const normalized = normalizeConfig(minimalConfig);
    expect(normalized.linkStyle).toBeDefined();
    expect(normalized.linkStyle?.type).toBe('label');
    expect(normalized.linkStyle?.lineColor).toBe('#000000');
    expect(normalized.linkStyle?.lineWidth).toBe(1);
    expect(normalized.linkStyle?.labelStyle?.fontFamily).toBe('Arial');
  });

  it('should apply default map options', () => {
    const normalized = normalizeConfig(minimalConfig);
    expect(normalized.map.showScale).toBe(true);
    expect(normalized.map.showAttribution).toBe(true);
  });

  it('should preserve existing custom values', () => {
    const configWithCustoms: PicMapConfig = {
      ...minimalConfig,
      pictureBorder: {
        backgroundColor: '#ff0000',
        borderColor: '#00ff00',
      },
      linkStyle: {
        type: 'line',
        lineColor: '#0000ff',
      },
    };

    const normalized = normalizeConfig(configWithCustoms);
    expect(normalized.pictureBorder?.backgroundColor).toBe('#ff0000');
    expect(normalized.linkStyle?.type).toBe('line');
  });

  it('should preserve explicit map option values', () => {
    const configWithMapOptions: PicMapConfig = {
      ...minimalConfig,
      map: {
        ...minimalConfig.map,
        showScale: false,
        showAttribution: false,
      },
    };

    const normalized = normalizeConfig(configWithMapOptions);
    expect(normalized.map.showScale).toBe(false);
    expect(normalized.map.showAttribution).toBe(false);
  });
});

describe('validateImageReferences', () => {
  it('should return no errors for valid references', () => {
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
      images: [{ filePath: '/img1.jpg' }, { filePath: '/img2.jpg' }],
      links: [
        {
          imageId: '0',
          location: { latitude: 0, longitude: 0 },
        },
        {
          imageId: '1',
          location: { latitude: 1, longitude: 1 },
        },
      ],
    };

    const errors = validateImageReferences(config);
    expect(errors).toHaveLength(0);
  });

  it('should detect invalid image ID references', () => {
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
      images: [{ filePath: '/img1.jpg' }],
      links: [
        {
          imageId: '0',
          location: { latitude: 0, longitude: 0 },
        },
        {
          imageId: '5',
          location: { latitude: 1, longitude: 1 },
        },
      ],
    };

    const errors = validateImageReferences(config);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('non-existent image ID');
  });

  it('should return empty array for config with no links', () => {
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
      images: [{ filePath: '/img1.jpg' }],
      links: [],
    };

    const errors = validateImageReferences(config);
    expect(errors).toHaveLength(0);
  });
});

describe('validateConfigReferences', () => {
  it('should validate config with unique image references', () => {
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
      images: [{ filePath: '/img1.jpg' }, { filePath: '/img2.jpg' }],
      links: [
        {
          imageId: '0',
          location: { latitude: 0, longitude: 0 },
        },
        {
          imageId: '1',
          location: { latitude: 1, longitude: 1 },
        },
      ],
    };

    const errors = validateConfigReferences(config);
    expect(errors).toHaveLength(0);
  });

  it('should detect duplicate image ID references', () => {
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
      images: [{ filePath: '/img1.jpg' }],
      links: [
        {
          imageId: '0',
          location: { latitude: 0, longitude: 0 },
        },
        {
          imageId: '0',
          location: { latitude: 1, longitude: 1 },
        },
      ],
    };

    const errors = validateConfigReferences(config);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.includes('multiple links'))).toBe(true);
  });

  it('should detect both invalid and duplicate references', () => {
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
      images: [{ filePath: '/img1.jpg' }],
      links: [
        {
          imageId: '0',
          location: { latitude: 0, longitude: 0 },
        },
        {
          imageId: '0',
          location: { latitude: 1, longitude: 1 },
        },
        {
          imageId: '5',
          location: { latitude: 2, longitude: 2 },
        },
      ],
    };

    const errors = validateConfigReferences(config);
    expect(errors.length).toBeGreaterThan(1);
    expect(errors.some((e) => e.includes('multiple links'))).toBe(true);
    expect(errors.some((e) => e.includes('non-existent'))).toBe(true);
  });
});

describe('Custom Error Classes', () => {
  it('ConfigLoadError should have correct name', () => {
    const error = new ConfigLoadError('test message');
    expect(error.name).toBe('ConfigLoadError');
    expect(error.message).toBe('test message');
  });

  it('ConfigLoadError should preserve cause', () => {
    const cause = new Error('Original error');
    const error = new ConfigLoadError('Wrapper error', cause);
    expect(error.cause).toBe(cause);
  });

  it('ConfigValidationError should have correct name', () => {
    const error = new ConfigValidationError('test message', ['error1']);
    expect(error.name).toBe('ConfigValidationError');
    expect(error.message).toBe('test message');
    expect(error.validationErrors).toEqual(['error1']);
  });
});

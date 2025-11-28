import { describe, it, expect } from 'vitest';
import {
  getPageDimensionsMm,
  mmToPixels,
  pixelsToMm,
  dimensionsToPixels,
  marginToPixels,
  calculateContentArea,
  calculateLayoutAreas,
  validateDpi,
  DEFAULT_DPI,
  MIN_DPI,
  MAX_DPI,
} from './page-sizes';
import { PAGE_SIZES } from './types';

describe('Page Sizes', () => {
  describe('PAGE_SIZES', () => {
    it('should have correct A4 dimensions', () => {
      expect(PAGE_SIZES.A4).toEqual({ width: 210, height: 297 });
    });

    it('should have correct Letter dimensions', () => {
      expect(PAGE_SIZES.Letter).toEqual({ width: 215.9, height: 279.4 });
    });

    it('should have correct A3 dimensions', () => {
      expect(PAGE_SIZES.A3).toEqual({ width: 297, height: 420 });
    });
  });

  describe('getPageDimensionsMm', () => {
    it('should return portrait A4 dimensions', () => {
      const dims = getPageDimensionsMm('A4', 'portrait');
      expect(dims.width).toBe(210);
      expect(dims.height).toBe(297);
    });

    it('should return landscape A4 dimensions', () => {
      const dims = getPageDimensionsMm('A4', 'landscape');
      expect(dims.width).toBe(297);
      expect(dims.height).toBe(210);
    });

    it('should return portrait Letter dimensions', () => {
      const dims = getPageDimensionsMm('Letter', 'portrait');
      expect(dims.width).toBe(215.9);
      expect(dims.height).toBe(279.4);
    });

    it('should return landscape Letter dimensions', () => {
      const dims = getPageDimensionsMm('Letter', 'landscape');
      expect(dims.width).toBe(279.4);
      expect(dims.height).toBe(215.9);
    });

    it('should use custom dimensions when provided', () => {
      const dims = getPageDimensionsMm('custom', 'portrait', { width: 100, height: 200 });
      expect(dims.width).toBe(100);
      expect(dims.height).toBe(200);
    });

    it('should apply orientation to custom dimensions', () => {
      const dims = getPageDimensionsMm('custom', 'landscape', { width: 100, height: 200 });
      expect(dims.width).toBe(200);
      expect(dims.height).toBe(100);
    });

    it('should throw error when custom dimensions are missing', () => {
      expect(() => getPageDimensionsMm('custom', 'portrait')).toThrow(
        'Custom dimensions required'
      );
    });
  });

  describe('mmToPixels', () => {
    it('should convert mm to pixels at 72 DPI', () => {
      // 25.4mm = 1 inch = 72 pixels at 72 DPI
      expect(mmToPixels(25.4, 72)).toBe(72);
    });

    it('should convert mm to pixels at 300 DPI', () => {
      // 25.4mm = 1 inch = 300 pixels at 300 DPI
      expect(mmToPixels(25.4, 300)).toBe(300);
    });

    it('should round to nearest pixel', () => {
      expect(mmToPixels(1, 72)).toBe(3); // 1mm ≈ 2.83 pixels at 72 DPI
    });
  });

  describe('pixelsToMm', () => {
    it('should convert pixels to mm at 72 DPI', () => {
      expect(pixelsToMm(72, 72)).toBeCloseTo(25.4, 1);
    });

    it('should convert pixels to mm at 300 DPI', () => {
      expect(pixelsToMm(300, 300)).toBeCloseTo(25.4, 1);
    });
  });

  describe('dimensionsToPixels', () => {
    it('should convert dimensions from mm to pixels', () => {
      const dims = dimensionsToPixels({ width: 210, height: 297 }, 300);
      expect(dims.width).toBe(2480); // A4 width at 300 DPI
      expect(dims.height).toBe(3508); // A4 height at 300 DPI
    });
  });

  describe('marginToPixels', () => {
    it('should convert margin from mm to pixels', () => {
      const margin = marginToPixels({ top: 10, right: 10, bottom: 10, left: 10 }, 300);
      expect(margin.top).toBe(118); // 10mm at 300 DPI
      expect(margin.right).toBe(118);
      expect(margin.bottom).toBe(118);
      expect(margin.left).toBe(118);
    });
  });

  describe('calculateContentArea', () => {
    it('should calculate content area correctly', () => {
      const pageDims = { width: 1000, height: 800 };
      const margin = { top: 50, right: 50, bottom: 50, left: 50 };
      const content = calculateContentArea(pageDims, margin);

      expect(content.x).toBe(50);
      expect(content.y).toBe(50);
      expect(content.width).toBe(900);
      expect(content.height).toBe(700);
    });
  });

  describe('calculateLayoutAreas', () => {
    it('should calculate layout areas for A4 landscape', () => {
      const config = {
        pageSize: 'A4' as const,
        orientation: 'landscape' as const,
        borderWidth: 30,
        pictureSpacing: 5,
        margin: { top: 10, right: 10, bottom: 10, left: 10 },
        dpi: 300,
      };

      const { pageDimensions, mapArea, borderAreas } = calculateLayoutAreas(config);

      // A4 landscape at 300 DPI
      expect(pageDimensions.width).toBe(3508); // 297mm
      expect(pageDimensions.height).toBe(2480); // 210mm

      // Map area should be inside borders
      expect(mapArea.width).toBeGreaterThan(0);
      expect(mapArea.height).toBeGreaterThan(0);
      expect(mapArea.x).toBeGreaterThan(0);
      expect(mapArea.y).toBeGreaterThan(0);

      // Border areas should exist
      expect(borderAreas.top.height).toBeGreaterThan(0);
      expect(borderAreas.right.width).toBeGreaterThan(0);
      expect(borderAreas.bottom.height).toBeGreaterThan(0);
      expect(borderAreas.left.width).toBeGreaterThan(0);
    });

    it('should use default DPI when not specified', () => {
      const config = {
        pageSize: 'A4' as const,
        orientation: 'portrait' as const,
        borderWidth: 20,
        pictureSpacing: 5,
        margin: { top: 10, right: 10, bottom: 10, left: 10 },
      };

      const { pageDimensions } = calculateLayoutAreas(config);

      // Should use DEFAULT_DPI (300)
      expect(pageDimensions.width).toBe(2480); // 210mm at 300 DPI
      expect(pageDimensions.height).toBe(3508); // 297mm at 300 DPI
    });
  });

  describe('validateDpi', () => {
    it('should return DEFAULT_DPI for invalid values', () => {
      expect(validateDpi(NaN)).toBe(DEFAULT_DPI);
      expect(validateDpi(Infinity)).toBe(DEFAULT_DPI);
      expect(validateDpi(-1)).toBe(DEFAULT_DPI);
      expect(validateDpi(0)).toBe(DEFAULT_DPI);
    });

    it('should clamp to MIN_DPI', () => {
      expect(validateDpi(10)).toBe(MIN_DPI);
    });

    it('should clamp to MAX_DPI', () => {
      expect(validateDpi(1000)).toBe(MAX_DPI);
    });

    it('should return valid DPI values unchanged', () => {
      expect(validateDpi(150)).toBe(150);
      expect(validateDpi(300)).toBe(300);
    });
  });
});

import { describe, it, expect } from 'vitest';
import {
  distributePictures,
  calculateLinkLines,
  createCompositionLayout,
  getRectCenter,
} from './layout-engine';
import type { Rectangle, CompositorConfig, CompositionInput } from './types';
import type { ImageMetadata } from '../types';

describe('Layout Engine', () => {
  const mockBorderAreas = {
    top: { x: 100, y: 0, width: 800, height: 100 },
    right: { x: 900, y: 100, width: 100, height: 600 },
    bottom: { x: 100, y: 700, width: 800, height: 100 },
    left: { x: 0, y: 100, width: 100, height: 600 },
  };

  describe('distributePictures', () => {
    it('should return empty array when no images', () => {
      const result = distributePictures([], mockBorderAreas, 10);
      expect(result).toEqual([]);
    });

    it('should distribute a single image', () => {
      const images: ImageMetadata[] = [{ filePath: '/test/image1.jpg' }];
      const result = distributePictures(images, mockBorderAreas, 10);

      expect(result).toHaveLength(1);
      expect(result[0].imageIndex).toBe(0);
      expect(result[0].borderPosition).toBe('top');
      expect(result[0].rect.width).toBeGreaterThan(0);
      expect(result[0].rect.height).toBeGreaterThan(0);
    });

    it('should distribute multiple images across borders', () => {
      const images: ImageMetadata[] = Array(8)
        .fill(null)
        .map((_, i) => ({ filePath: `/test/image${i}.jpg` }));

      const result = distributePictures(images, mockBorderAreas, 10);

      expect(result.length).toBeLessThanOrEqual(8);
      expect(result.length).toBeGreaterThan(0);

      // Check that images are positioned in order
      for (let i = 0; i < result.length; i++) {
        expect(result[i].imageIndex).toBe(i);
      }
    });

    it('should position pictures within border bounds', () => {
      const images: ImageMetadata[] = [
        { filePath: '/test/image1.jpg' },
        { filePath: '/test/image2.jpg' },
      ];

      const result = distributePictures(images, mockBorderAreas, 10);

      for (const picture of result) {
        const border = mockBorderAreas[picture.borderPosition];
        expect(picture.rect.x).toBeGreaterThanOrEqual(border.x);
        expect(picture.rect.y).toBeGreaterThanOrEqual(border.y);
        expect(picture.rect.x + picture.rect.width).toBeLessThanOrEqual(border.x + border.width);
        expect(picture.rect.y + picture.rect.height).toBeLessThanOrEqual(border.y + border.height);
      }
    });

    it('should preserve image metadata', () => {
      const images: ImageMetadata[] = [
        { filePath: '/test/image1.jpg', caption: 'Test Caption', altText: 'Alt text' },
      ];

      const result = distributePictures(images, mockBorderAreas, 10);

      expect(result[0].image).toEqual(images[0]);
    });
  });

  describe('calculateLinkLines', () => {
    it('should return empty array when no marker positions', () => {
      const pictures = [
        {
          image: { filePath: '/test/image1.jpg' },
          rect: { x: 50, y: 10, width: 80, height: 80 },
          borderPosition: 'top' as const,
          imageIndex: 0,
        },
      ];
      const mapArea: Rectangle = { x: 100, y: 100, width: 600, height: 400 };

      const result = calculateLinkLines(pictures, [], mapArea);
      expect(result).toEqual([]);
    });

    it('should create link lines for matching pictures and markers', () => {
      const pictures = [
        {
          image: { filePath: '/test/image1.jpg' },
          rect: { x: 50, y: 10, width: 80, height: 80 },
          borderPosition: 'top' as const,
          imageIndex: 0,
        },
      ];
      const markerPositions = [{ imageIndex: 0, x: 300, y: 200, label: 'A' }];
      const mapArea: Rectangle = { x: 100, y: 100, width: 600, height: 400 };

      const result = calculateLinkLines(pictures, markerPositions, mapArea);

      expect(result).toHaveLength(1);
      expect(result[0].imageIndex).toBe(0);
      expect(result[0].label).toBe('A');
      expect(result[0].start.y).toBe(90); // Bottom of picture (top border)
      expect(result[0].end.x).toBe(400); // mapArea.x + marker.x
      expect(result[0].end.y).toBe(300); // mapArea.y + marker.y
    });

    it('should handle pictures on different borders', () => {
      const pictures = [
        {
          image: { filePath: '/test/image1.jpg' },
          rect: { x: 50, y: 10, width: 80, height: 80 },
          borderPosition: 'top' as const,
          imageIndex: 0,
        },
        {
          image: { filePath: '/test/image2.jpg' },
          rect: { x: 10, y: 150, width: 80, height: 80 },
          borderPosition: 'left' as const,
          imageIndex: 1,
        },
        {
          image: { filePath: '/test/image3.jpg' },
          rect: { x: 810, y: 150, width: 80, height: 80 },
          borderPosition: 'right' as const,
          imageIndex: 2,
        },
        {
          image: { filePath: '/test/image4.jpg' },
          rect: { x: 50, y: 710, width: 80, height: 80 },
          borderPosition: 'bottom' as const,
          imageIndex: 3,
        },
      ];
      const markerPositions = [
        { imageIndex: 0, x: 300, y: 200 },
        { imageIndex: 1, x: 100, y: 200 },
        { imageIndex: 2, x: 500, y: 200 },
        { imageIndex: 3, x: 300, y: 350 },
      ];
      const mapArea: Rectangle = { x: 100, y: 100, width: 600, height: 400 };

      const result = calculateLinkLines(pictures, markerPositions, mapArea);

      expect(result).toHaveLength(4);

      // Top border: start at bottom edge of picture
      expect(result[0].start.y).toBe(90);

      // Left border: start at right edge of picture
      expect(result[1].start.x).toBe(90);

      // Right border: start at left edge of picture
      expect(result[2].start.x).toBe(810);

      // Bottom border: start at top edge of picture
      expect(result[3].start.y).toBe(710);
    });

    it('should skip markers without matching pictures', () => {
      const pictures = [
        {
          image: { filePath: '/test/image1.jpg' },
          rect: { x: 50, y: 10, width: 80, height: 80 },
          borderPosition: 'top' as const,
          imageIndex: 0,
        },
      ];
      const markerPositions = [
        { imageIndex: 0, x: 300, y: 200 },
        { imageIndex: 5, x: 400, y: 300 }, // No matching picture
      ];
      const mapArea: Rectangle = { x: 100, y: 100, width: 600, height: 400 };

      const result = calculateLinkLines(pictures, markerPositions, mapArea);

      expect(result).toHaveLength(1);
      expect(result[0].imageIndex).toBe(0);
    });
  });

  describe('createCompositionLayout', () => {
    it('should create a complete composition layout', () => {
      const config: CompositorConfig = {
        pageSize: 'A4',
        orientation: 'landscape',
        borderWidth: 30,
        pictureSpacing: 5,
        margin: { top: 10, right: 10, bottom: 10, left: 10 },
        dpi: 72, // Use low DPI for simpler numbers
      };

      const input: CompositionInput = {
        map: {
          svg: '<svg></svg>',
          width: 400,
          height: 300,
          bounds: { north: 52, south: 51, east: 0, west: -1 },
        },
        images: [{ filePath: '/test/image1.jpg' }, { filePath: '/test/image2.jpg' }],
        links: [
          { imageIndex: 0, markerPosition: { x: 100, y: 150 }, label: 'A' },
          { imageIndex: 1, markerPosition: { x: 200, y: 100 }, label: 'B' },
        ],
      };

      const layout = createCompositionLayout(config, input);

      expect(layout.pageDimensions.width).toBeGreaterThan(0);
      expect(layout.pageDimensions.height).toBeGreaterThan(0);
      expect(layout.dpi).toBe(72);
      expect(layout.mapArea.width).toBeGreaterThan(0);
      expect(layout.mapArea.height).toBeGreaterThan(0);
      expect(layout.borderAreas).toBeDefined();
      expect(layout.pictures.length).toBeLessThanOrEqual(2);

      // Check labels are assigned
      const pictureWithLabelA = layout.pictures.find((p) => p.label === 'A');
      expect(pictureWithLabelA).toBeDefined();
    });
  });

  describe('getRectCenter', () => {
    it('should return center of rectangle', () => {
      const rect: Rectangle = { x: 100, y: 200, width: 300, height: 400 };
      const center = getRectCenter(rect);

      expect(center.x).toBe(250);
      expect(center.y).toBe(400);
    });

    it('should handle rectangle at origin', () => {
      const rect: Rectangle = { x: 0, y: 0, width: 100, height: 100 };
      const center = getRectCenter(rect);

      expect(center.x).toBe(50);
      expect(center.y).toBe(50);
    });
  });
});

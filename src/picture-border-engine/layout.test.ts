import { describe, it, expect } from 'vitest';
import {
  mmToPixels,
  pixelsToMm,
  getPageDimensionsMm,
  getPageDimensionsPixels,
  calculateBorderLayout,
  distributePicturesAcrossEdges,
  calculateFitDimensions,
  positionPicturesInSlots,
  DEFAULT_DPI,
} from './layout';
import type { LayoutOptions, ImageMetadata, PictureSlot } from '../types';

describe('Unit Conversions', () => {
  describe('mmToPixels', () => {
    it('should convert mm to pixels at default DPI (300)', () => {
      // 25.4mm = 1 inch = 300 pixels at 300 DPI
      expect(mmToPixels(25.4)).toBe(300);
    });

    it('should convert mm to pixels at custom DPI', () => {
      // 25.4mm = 1 inch = 96 pixels at 96 DPI
      expect(mmToPixels(25.4, 96)).toBe(96);
    });

    it('should handle zero', () => {
      expect(mmToPixels(0)).toBe(0);
    });

    it('should round to nearest integer', () => {
      // 10mm at 300 DPI = 118.11... -> 118
      expect(mmToPixels(10)).toBe(118);
    });
  });

  describe('pixelsToMm', () => {
    it('should convert pixels to mm at default DPI (300)', () => {
      // 300 pixels = 1 inch = 25.4mm at 300 DPI
      expect(pixelsToMm(300)).toBeCloseTo(25.4, 1);
    });

    it('should convert pixels to mm at custom DPI', () => {
      // 96 pixels = 1 inch = 25.4mm at 96 DPI
      expect(pixelsToMm(96, 96)).toBeCloseTo(25.4, 1);
    });

    it('should be inverse of mmToPixels', () => {
      const original = 100;
      const pixels = mmToPixels(original);
      const backToMm = pixelsToMm(pixels);
      expect(backToMm).toBeCloseTo(original, 0);
    });
  });

  describe('DEFAULT_DPI', () => {
    it('should be 300 for print quality', () => {
      expect(DEFAULT_DPI).toBe(300);
    });
  });
});

describe('Page Dimensions', () => {
  describe('getPageDimensionsMm', () => {
    it('should return A4 portrait dimensions', () => {
      const layout: LayoutOptions = {
        pageSize: 'A4',
        orientation: 'portrait',
        borderWidth: 50,
        pictureSpacing: 10,
        margin: { top: 20, right: 20, bottom: 20, left: 20 },
      };
      const dims = getPageDimensionsMm(layout);
      expect(dims.width).toBe(210);
      expect(dims.height).toBe(297);
    });

    it('should return A4 landscape dimensions', () => {
      const layout: LayoutOptions = {
        pageSize: 'A4',
        orientation: 'landscape',
        borderWidth: 50,
        pictureSpacing: 10,
        margin: { top: 20, right: 20, bottom: 20, left: 20 },
      };
      const dims = getPageDimensionsMm(layout);
      expect(dims.width).toBe(297);
      expect(dims.height).toBe(210);
    });

    it('should return Letter dimensions', () => {
      const layout: LayoutOptions = {
        pageSize: 'Letter',
        orientation: 'portrait',
        borderWidth: 50,
        pictureSpacing: 10,
        margin: { top: 20, right: 20, bottom: 20, left: 20 },
      };
      const dims = getPageDimensionsMm(layout);
      expect(dims.width).toBeCloseTo(215.9, 1);
      expect(dims.height).toBeCloseTo(279.4, 1);
    });

    it('should return A3 dimensions', () => {
      const layout: LayoutOptions = {
        pageSize: 'A3',
        orientation: 'portrait',
        borderWidth: 50,
        pictureSpacing: 10,
        margin: { top: 20, right: 20, bottom: 20, left: 20 },
      };
      const dims = getPageDimensionsMm(layout);
      expect(dims.width).toBe(297);
      expect(dims.height).toBe(420);
    });

    it('should return custom dimensions', () => {
      const layout: LayoutOptions = {
        pageSize: 'custom',
        customDimensions: { width: 300, height: 400 },
        orientation: 'portrait',
        borderWidth: 50,
        pictureSpacing: 10,
        margin: { top: 20, right: 20, bottom: 20, left: 20 },
      };
      const dims = getPageDimensionsMm(layout);
      expect(dims.width).toBe(300);
      expect(dims.height).toBe(400);
    });

    it('should apply landscape to custom dimensions', () => {
      const layout: LayoutOptions = {
        pageSize: 'custom',
        customDimensions: { width: 200, height: 300 },
        orientation: 'landscape',
        borderWidth: 50,
        pictureSpacing: 10,
        margin: { top: 20, right: 20, bottom: 20, left: 20 },
      };
      const dims = getPageDimensionsMm(layout);
      expect(dims.width).toBe(300);
      expect(dims.height).toBe(200);
    });
  });

  describe('getPageDimensionsPixels', () => {
    it('should convert dimensions to pixels at default DPI', () => {
      const layout: LayoutOptions = {
        pageSize: 'A4',
        orientation: 'portrait',
        borderWidth: 50,
        pictureSpacing: 10,
        margin: { top: 20, right: 20, bottom: 20, left: 20 },
      };
      const dims = getPageDimensionsPixels(layout);
      // 210mm * (300/25.4) = 2480.31... -> 2480
      expect(dims.width).toBe(2480);
      // 297mm * (300/25.4) = 3507.87... -> 3508
      expect(dims.height).toBe(3508);
    });

    it('should convert dimensions at custom DPI', () => {
      const layout: LayoutOptions = {
        pageSize: 'A4',
        orientation: 'portrait',
        borderWidth: 50,
        pictureSpacing: 10,
        margin: { top: 20, right: 20, bottom: 20, left: 20 },
      };
      const dims = getPageDimensionsPixels(layout, 96);
      // 210mm * (96/25.4) = 793.70... -> 794
      expect(dims.width).toBe(794);
      // 297mm * (96/25.4) = 1122.52... -> 1123
      expect(dims.height).toBe(1123);
    });
  });
});

describe('Picture Distribution', () => {
  describe('distributePicturesAcrossEdges', () => {
    it('should return zeros for no pictures', () => {
      const dist = distributePicturesAcrossEdges(0);
      expect(dist.top).toBe(0);
      expect(dist.right).toBe(0);
      expect(dist.bottom).toBe(0);
      expect(dist.left).toBe(0);
    });

    it('should distribute 4 pictures evenly', () => {
      const dist = distributePicturesAcrossEdges(4);
      expect(dist.top).toBe(1);
      expect(dist.right).toBe(1);
      expect(dist.bottom).toBe(1);
      expect(dist.left).toBe(1);
    });

    it('should distribute 8 pictures evenly', () => {
      const dist = distributePicturesAcrossEdges(8);
      expect(dist.top).toBe(2);
      expect(dist.right).toBe(2);
      expect(dist.bottom).toBe(2);
      expect(dist.left).toBe(2);
    });

    it('should distribute 5 pictures with extra on top', () => {
      const dist = distributePicturesAcrossEdges(5);
      expect(dist.top).toBe(2);
      expect(dist.bottom).toBe(1);
      expect(dist.left).toBe(1);
      expect(dist.right).toBe(1);
    });

    it('should distribute 6 pictures with extra on top and right', () => {
      const dist = distributePicturesAcrossEdges(6);
      expect(dist.top).toBe(2);
      expect(dist.right).toBe(2);
      expect(dist.bottom).toBe(1);
      expect(dist.left).toBe(1);
    });

    it('should distribute 7 pictures clockwise starting from top (top=2, right=2, bottom=2, left=1)', () => {
      const dist = distributePicturesAcrossEdges(7);
      expect(dist.top).toBe(2);
      expect(dist.right).toBe(2);
      expect(dist.bottom).toBe(2);
      expect(dist.left).toBe(1);
    });

    it('should sum to total picture count', () => {
      for (let count = 0; count <= 20; count++) {
        const dist = distributePicturesAcrossEdges(count);
        const total = dist.top + dist.right + dist.bottom + dist.left;
        expect(total).toBe(count);
      }
    });
  });
});

describe('Fit Dimensions', () => {
  describe('calculateFitDimensions', () => {
    it('should fit a square image in a square slot', () => {
      const dims = calculateFitDimensions(100, 100, 200, 200);
      expect(dims.width).toBe(200);
      expect(dims.height).toBe(200);
    });

    it('should fit a wide image in a wide slot', () => {
      // 16:9 image in 16:9 slot
      const dims = calculateFitDimensions(1600, 900, 800, 450);
      expect(dims.width).toBe(800);
      expect(dims.height).toBe(450);
    });

    it('should fit a wide image in a square slot', () => {
      // 16:9 image in square slot - width constrained
      const dims = calculateFitDimensions(1600, 900, 400, 400);
      expect(dims.width).toBe(400);
      expect(dims.height).toBe(225); // 400 / (16/9) = 225
    });

    it('should fit a tall image in a square slot', () => {
      // 9:16 image in square slot - height constrained
      const dims = calculateFitDimensions(900, 1600, 400, 400);
      expect(dims.width).toBe(225); // 400 * (9/16) = 225
      expect(dims.height).toBe(400);
    });

    it('should handle zero dimensions gracefully', () => {
      const dims = calculateFitDimensions(0, 0, 400, 300);
      expect(dims.width).toBe(400);
      expect(dims.height).toBe(300);
    });

    it('should handle negative dimensions gracefully', () => {
      const dims = calculateFitDimensions(-100, -100, 400, 300);
      expect(dims.width).toBe(400);
      expect(dims.height).toBe(300);
    });
  });
});

describe('Border Layout Calculation', () => {
  const defaultLayout: LayoutOptions = {
    pageSize: 'A4',
    orientation: 'landscape',
    borderWidth: 60,
    pictureSpacing: 10,
    margin: { top: 20, right: 20, bottom: 20, left: 20 },
  };

  describe('calculateBorderLayout', () => {
    it('should calculate correct page dimensions', () => {
      const layout = calculateBorderLayout(defaultLayout, 8);
      // A4 landscape at 300 DPI
      expect(layout.pageWidth).toBe(3508);
      expect(layout.pageHeight).toBe(2480);
    });

    it('should calculate correct border width in pixels', () => {
      const layout = calculateBorderLayout(defaultLayout, 8);
      // 60mm at 300 DPI = 709 pixels
      expect(layout.borderWidth).toBe(709);
    });

    it('should calculate correct inner area', () => {
      const layout = calculateBorderLayout(defaultLayout, 8);
      // Inner area starts after margin + border
      // Margin 20mm = 236px, Border 60mm = 709px
      expect(layout.innerArea.x).toBe(236 + 709); // 945
      expect(layout.innerArea.y).toBe(236 + 709);
      // Width = pageWidth - 2 * (margin + border)
      expect(layout.innerArea.width).toBe(3508 - 2 * (236 + 709)); // 1618
    });

    it('should create correct number of slots', () => {
      const layout = calculateBorderLayout(defaultLayout, 8);
      expect(layout.slots.length).toBe(8);
    });

    it('should create no slots for zero pictures', () => {
      const layout = calculateBorderLayout(defaultLayout, 0);
      expect(layout.slots.length).toBe(0);
    });

    it('should create slots with unique IDs', () => {
      const layout = calculateBorderLayout(defaultLayout, 8);
      const ids = layout.slots.map((s) => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(8);
    });

    it('should distribute slots across all edges', () => {
      const layout = calculateBorderLayout(defaultLayout, 8);
      const edges = layout.slots.map((s) => s.edge);
      expect(edges.filter((e) => e === 'top').length).toBe(2);
      expect(edges.filter((e) => e === 'bottom').length).toBe(2);
      expect(edges.filter((e) => e === 'left').length).toBe(2);
      expect(edges.filter((e) => e === 'right').length).toBe(2);
    });

    it('should position top edge slots correctly', () => {
      const layout = calculateBorderLayout(defaultLayout, 4);
      const topSlots = layout.slots.filter((s) => s.edge === 'top');
      expect(topSlots.length).toBe(1);
      const topSlot = topSlots[0];
      expect(topSlot.y).toBe(layout.margin.top);
      expect(topSlot.height).toBe(layout.borderWidth);
    });

    it('should position bottom edge slots correctly', () => {
      const layout = calculateBorderLayout(defaultLayout, 4);
      const bottomSlots = layout.slots.filter((s) => s.edge === 'bottom');
      expect(bottomSlots.length).toBe(1);
      const bottomSlot = bottomSlots[0];
      expect(bottomSlot.y).toBe(layout.pageHeight - layout.margin.bottom - layout.borderWidth);
      expect(bottomSlot.height).toBe(layout.borderWidth);
    });

    it('should position left edge slots correctly', () => {
      const layout = calculateBorderLayout(defaultLayout, 4);
      const leftSlots = layout.slots.filter((s) => s.edge === 'left');
      expect(leftSlots.length).toBe(1);
      const leftSlot = leftSlots[0];
      expect(leftSlot.x).toBe(layout.margin.left);
      expect(leftSlot.width).toBe(layout.borderWidth);
    });

    it('should position right edge slots correctly', () => {
      const layout = calculateBorderLayout(defaultLayout, 4);
      const rightSlots = layout.slots.filter((s) => s.edge === 'right');
      expect(rightSlots.length).toBe(1);
      const rightSlot = rightSlots[0];
      expect(rightSlot.x).toBe(layout.pageWidth - layout.margin.right - layout.borderWidth);
      expect(rightSlot.width).toBe(layout.borderWidth);
    });

    it('should include spacing in slot dimensions', () => {
      const layout = calculateBorderLayout(defaultLayout, 8);
      // With spacing between slots, slot width should be less than
      // the full edge width divided by number of slots
      const topSlots = layout.slots.filter((s) => s.edge === 'top');
      const edgeWidth = layout.pageWidth - layout.margin.left - layout.margin.right;
      const maxSlotWidth = edgeWidth / topSlots.length;
      expect(topSlots[0].width).toBeLessThan(maxSlotWidth);
    });
  });
});

describe('Picture Positioning', () => {
  describe('positionPicturesInSlots', () => {
    const mockSlots: PictureSlot[] = [
      { id: 'slot-0', edge: 'top', x: 100, y: 20, width: 200, height: 100, edgeIndex: 0 },
      { id: 'slot-1', edge: 'top', x: 320, y: 20, width: 200, height: 100, edgeIndex: 1 },
    ];

    const mockImages: ImageMetadata[] = [
      { filePath: '/img1.jpg', dimensions: { width: 1920, height: 1080 } },
      { filePath: '/img2.jpg', dimensions: { width: 800, height: 600 } },
    ];

    it('should position all images in corresponding slots', () => {
      const positioned = positionPicturesInSlots(mockImages, mockSlots);
      expect(positioned.length).toBe(2);
      expect(positioned[0].slot.id).toBe('slot-0');
      expect(positioned[1].slot.id).toBe('slot-1');
    });

    it('should calculate fit dimensions preserving aspect ratio', () => {
      const positioned = positionPicturesInSlots(mockImages, mockSlots);
      // First image: 1920x1080 (16:9) in 200x100 slot
      // Width-constrained: 200 wide, height = 200 * (1080/1920) = 112.5 -> but slot is 100 high
      // So height-constrained: 100 high, width = 100 * (1920/1080) = 177.78 -> 178
      expect(positioned[0].renderWidth).toBe(178);
      expect(positioned[0].renderHeight).toBe(100);
    });

    it('should center images within slots', () => {
      const positioned = positionPicturesInSlots(mockImages, mockSlots);
      // Slot width 200, render width 178, offset = (200-178)/2 = 11
      expect(positioned[0].offsetX).toBe(11);
      // Slot height 100, render height 100, offset = 0
      expect(positioned[0].offsetY).toBe(0);
    });

    it('should calculate center points correctly', () => {
      const positioned = positionPicturesInSlots(mockImages, mockSlots);
      const pic = positioned[0];
      const expectedCenterX = pic.slot.x + pic.offsetX + pic.renderWidth / 2;
      const expectedCenterY = pic.slot.y + pic.offsetY + pic.renderHeight / 2;
      expect(pic.centerX).toBe(expectedCenterX);
      expect(pic.centerY).toBe(expectedCenterY);
    });

    it('should use default dimensions for images without dimensions', () => {
      const imagesWithoutDims: ImageMetadata[] = [{ filePath: '/img.jpg' }];
      const positioned = positionPicturesInSlots(imagesWithoutDims, mockSlots);
      // Default is 800x600 (4:3) in 200x100 slot
      // Height-constrained: 100 high, width = 100 * (800/600) = 133.33 -> 133
      expect(positioned[0].renderWidth).toBe(133);
      expect(positioned[0].renderHeight).toBe(100);
    });

    it('should handle more slots than images', () => {
      const singleImage: ImageMetadata[] = [{ filePath: '/img.jpg' }];
      const positioned = positionPicturesInSlots(singleImage, mockSlots);
      expect(positioned.length).toBe(1);
    });

    it('should handle more images than slots', () => {
      const manyImages: ImageMetadata[] = [
        { filePath: '/img1.jpg' },
        { filePath: '/img2.jpg' },
        { filePath: '/img3.jpg' },
      ];
      const positioned = positionPicturesInSlots(manyImages, mockSlots);
      expect(positioned.length).toBe(2); // Only 2 slots available
    });

    it('should assign labels from links', () => {
      const links = [
        { imageId: '0', label: 'A' },
        { imageId: '1', label: 'B' },
      ];
      const positioned = positionPicturesInSlots(mockImages, mockSlots, links);
      expect(positioned[0].label).toBe('A');
      expect(positioned[1].label).toBe('B');
    });

    it('should handle images without labels', () => {
      const links = [{ imageId: '0', label: 'A' }];
      const positioned = positionPicturesInSlots(mockImages, mockSlots, links);
      expect(positioned[0].label).toBe('A');
      expect(positioned[1].label).toBeUndefined();
    });
  });
});

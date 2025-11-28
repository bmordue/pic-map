import { describe, it, expect } from 'vitest';
import { MapEngine } from '../map-engine';
import { ExportEngine } from './engine';

describe('Export Engine Integration', () => {
  describe('MapEngine to ExportEngine pipeline', () => {
    it('should export a rendered map to SVG', () => {
      // Create a map using MapEngine
      const mapEngine = new MapEngine();
      const mapResult = mapEngine.renderMap({
        style: {
          provider: 'openstreetmap',
          zoom: 12,
          center: { latitude: 51.5074, longitude: -0.1278 },
          showScale: true,
          showAttribution: true,
        },
        width: 800,
        height: 600,
        markers: [
          {
            location: { latitude: 51.5074, longitude: -0.1278 },
            label: 'A',
            style: { color: '#ff0000', size: 20, shape: 'pin' },
          },
        ],
      });

      // Export the rendered map
      const exportEngine = new ExportEngine();
      const exportResult = exportEngine.exportToSvg(
        {
          svg: mapResult.svg,
          width: mapResult.width,
          height: mapResult.height,
        },
        {
          pageSize: 'A4',
          orientation: 'landscape',
          title: 'London Map',
          author: 'Pic-Map',
        }
      );

      // Verify the export
      expect(exportResult.format).toBe('svg');
      expect(typeof exportResult.data).toBe('string');
      expect(exportResult.widthMm).toBe(297); // A4 landscape
      expect(exportResult.heightMm).toBe(210);
      expect(exportResult.data).toContain('xmlns="http://www.w3.org/2000/svg"');
      expect(exportResult.data).toContain('<title>London Map</title>');
    });

    it('should export a rendered map to PDF', async () => {
      // Create a map using MapEngine
      const mapEngine = new MapEngine();
      const mapResult = mapEngine.renderMap({
        style: {
          provider: 'openstreetmap',
          zoom: 14,
          center: { latitude: 48.8566, longitude: 2.3522 },
          showScale: true,
          showAttribution: true,
        },
        width: 1200,
        height: 800,
        markers: [
          {
            location: { latitude: 48.8584, longitude: 2.2945 },
            label: 'Eiffel Tower',
            style: { color: '#3498db', size: 25, shape: 'circle' },
          },
          {
            location: { latitude: 48.8606, longitude: 2.3376 },
            label: 'Louvre',
            style: { color: '#e74c3c', size: 25, shape: 'square' },
          },
        ],
      });

      // Export the rendered map to PDF
      const exportEngine = new ExportEngine();
      const exportResult = await exportEngine.exportToPdf(
        {
          svg: mapResult.svg,
          width: mapResult.width,
          height: mapResult.height,
        },
        {
          pageSize: 'A3',
          orientation: 'landscape',
          title: 'Paris Map',
          author: 'Pic-Map',
          dpi: 300,
        }
      );

      // Verify the export
      expect(exportResult.format).toBe('pdf');
      expect(Buffer.isBuffer(exportResult.data)).toBe(true);
      expect(exportResult.widthMm).toBe(420); // A3 landscape
      expect(exportResult.heightMm).toBe(297);

      // Check PDF header
      const pdfHeader = (exportResult.data as Buffer).subarray(0, 4).toString('utf-8');
      expect(pdfHeader).toBe('%PDF');
    });

    it('should handle maps with multiple markers', async () => {
      const mapEngine = new MapEngine();
      const markers = [
        { location: { latitude: 51.5074, longitude: -0.1278 }, label: 'A' },
        { location: { latitude: 51.5033, longitude: -0.1195 }, label: 'B' },
        { location: { latitude: 51.5055, longitude: -0.0754 }, label: 'C' },
      ];

      const mapResult = mapEngine.renderMap({
        style: {
          provider: 'openstreetmap',
          zoom: 13,
          center: { latitude: 51.5054, longitude: -0.1109 },
        },
        width: 1000,
        height: 700,
        markers,
      });

      const exportEngine = new ExportEngine();

      // Test SVG export
      const svgResult = exportEngine.exportToSvg({
        svg: mapResult.svg,
        width: mapResult.width,
        height: mapResult.height,
      });
      expect(svgResult.data).toContain('class="marker"');

      // Test PDF export
      const pdfResult = await exportEngine.exportToPdf({
        svg: mapResult.svg,
        width: mapResult.width,
        height: mapResult.height,
      });
      expect(Buffer.isBuffer(pdfResult.data)).toBe(true);
    });
  });

  describe('export format preservation', () => {
    it('should preserve vector quality in SVG export', () => {
      const mapEngine = new MapEngine();
      const mapResult = mapEngine.renderMap({
        style: {
          provider: 'openstreetmap',
          zoom: 10,
          center: { latitude: 40.7128, longitude: -74.006 },
        },
        width: 500,
        height: 400,
      });

      const exportEngine = new ExportEngine();
      const result = exportEngine.exportToSvg(
        {
          svg: mapResult.svg,
          width: mapResult.width,
          height: mapResult.height,
        },
        {
          pageSize: 'Letter',
          orientation: 'portrait',
        }
      );

      // SVG should contain scalable elements, not raster data
      expect(result.data).not.toContain('data:image/png');
      expect(result.data).not.toContain('data:image/jpeg');

      // Should contain vector elements
      expect(result.data).toContain('<rect');
      expect(result.data).toContain('<line');
      expect(result.data).toContain('viewBox');
    });

    it('should handle different DPI settings for PDF', async () => {
      const mapEngine = new MapEngine();
      const mapResult = mapEngine.renderMap({
        style: {
          provider: 'openstreetmap',
          zoom: 12,
          center: { latitude: 35.6762, longitude: 139.6503 },
        },
        width: 600,
        height: 400,
      });

      const exportEngine = new ExportEngine();

      const lowDpi = await exportEngine.exportToPdf(
        { svg: mapResult.svg, width: mapResult.width, height: mapResult.height },
        { dpi: 72 }
      );

      const highDpi = await exportEngine.exportToPdf(
        { svg: mapResult.svg, width: mapResult.width, height: mapResult.height },
        { dpi: 300 }
      );

      // Both should produce valid PDFs
      expect(Buffer.isBuffer(lowDpi.data)).toBe(true);
      expect(Buffer.isBuffer(highDpi.data)).toBe(true);

      // Different DPI should affect pixel dimensions
      expect(highDpi.widthPx).toBeGreaterThan(lowDpi.widthPx);
      expect(highDpi.heightPx).toBeGreaterThan(lowDpi.heightPx);
    });
  });

  describe('custom page sizes', () => {
    it('should handle custom page sizes for SVG', () => {
      const mapEngine = new MapEngine();
      const mapResult = mapEngine.renderMap({
        style: {
          provider: 'openstreetmap',
          zoom: 12,
          center: { latitude: 0, longitude: 0 },
        },
        width: 400,
        height: 300,
      });

      const exportEngine = new ExportEngine();
      const result = exportEngine.exportToSvg(
        { svg: mapResult.svg, width: mapResult.width, height: mapResult.height },
        {
          pageSize: { width: 500, height: 300 }, // Custom panoramic size
          orientation: 'portrait',
        }
      );

      expect(result.widthMm).toBe(500);
      expect(result.heightMm).toBe(300);
      expect(result.data).toContain('width="500mm"');
      expect(result.data).toContain('height="300mm"');
    });

    it('should handle custom page sizes for PDF', async () => {
      const mapEngine = new MapEngine();
      const mapResult = mapEngine.renderMap({
        style: {
          provider: 'openstreetmap',
          zoom: 12,
          center: { latitude: 0, longitude: 0 },
        },
        width: 400,
        height: 300,
      });

      const exportEngine = new ExportEngine();
      const result = await exportEngine.exportToPdf(
        { svg: mapResult.svg, width: mapResult.width, height: mapResult.height },
        {
          pageSize: { width: 250, height: 250 }, // Square format
          orientation: 'portrait',
        }
      );

      expect(result.widthMm).toBe(250);
      expect(result.heightMm).toBe(250);
    });
  });
});

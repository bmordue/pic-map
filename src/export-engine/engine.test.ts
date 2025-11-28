import { describe, it, expect } from 'vitest';
import {
  ExportEngine,
  ExportError,
  ExportConfig,
  ExportInput,
  PAGE_SIZES,
  DEFAULT_EXPORT_CONFIG,
  exportToSvg,
} from './index';

describe('ExportEngine', () => {
  const sampleSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
    <rect width="800" height="600" fill="#f0f0f0"/>
    <rect x="100" y="100" width="100" height="100" fill="#ff0000"/>
    <circle cx="400" cy="300" r="50" fill="#00ff00"/>
    <text x="400" y="500" text-anchor="middle" font-size="24">Test</text>
  </svg>`;

  const sampleInput: ExportInput = {
    svg: sampleSvg,
    width: 800,
    height: 600,
  };

  describe('constructor', () => {
    it('should create instance with default config', () => {
      const engine = new ExportEngine();
      expect(engine).toBeDefined();
    });

    it('should create instance with custom default config', () => {
      const engine = new ExportEngine({
        format: 'pdf',
        dpi: 150,
      });
      expect(engine).toBeDefined();
    });
  });

  describe('static methods', () => {
    it('should return available formats', () => {
      const formats = ExportEngine.getAvailableFormats();
      expect(formats).toContain('svg');
      expect(formats).toContain('pdf');
    });

    it('should return page size presets', () => {
      const presets = ExportEngine.getPageSizePresets();
      expect(presets).toContain('A4');
      expect(presets).toContain('A3');
      expect(presets).toContain('Letter');
      expect(presets).toContain('Legal');
    });

    it('should return page dimensions for presets', () => {
      const a4Portrait = ExportEngine.getPageDimensions('A4', 'portrait');
      expect(a4Portrait.width).toBe(210);
      expect(a4Portrait.height).toBe(297);

      const a4Landscape = ExportEngine.getPageDimensions('A4', 'landscape');
      expect(a4Landscape.width).toBe(297);
      expect(a4Landscape.height).toBe(210);
    });
  });

  describe('SVG export', () => {
    it('should export to SVG format', () => {
      const engine = new ExportEngine();
      const result = engine.exportToSvg(sampleInput);

      expect(result.format).toBe('svg');
      expect(typeof result.data).toBe('string');
      expect(result.data).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result.data).toContain('<svg');
      expect(result.data).toContain('</svg>');
    });

    it('should include correct dimensions in SVG', () => {
      const engine = new ExportEngine();
      const result = engine.exportToSvg(sampleInput, {
        pageSize: 'A4',
        orientation: 'portrait',
      });

      expect(result.widthMm).toBe(210);
      expect(result.heightMm).toBe(297);
      expect(result.data).toContain('width="210mm"');
      expect(result.data).toContain('height="297mm"');
    });

    it('should handle landscape orientation', () => {
      const engine = new ExportEngine();
      const result = engine.exportToSvg(sampleInput, {
        pageSize: 'A4',
        orientation: 'landscape',
      });

      expect(result.widthMm).toBe(297);
      expect(result.heightMm).toBe(210);
      expect(result.data).toContain('width="297mm"');
      expect(result.data).toContain('height="210mm"');
    });

    it('should include metadata when provided', () => {
      const engine = new ExportEngine();
      const result = engine.exportToSvg(sampleInput, {
        title: 'Test Map',
        author: 'Test Author',
      });

      expect(result.data).toContain('<metadata>');
      expect(result.data).toContain('<title>Test Map</title>');
      expect(result.data).toContain('<author>Test Author</author>');
    });

    it('should handle custom page sizes', () => {
      const engine = new ExportEngine();
      const result = engine.exportToSvg(sampleInput, {
        pageSize: { width: 300, height: 400 },
        orientation: 'portrait',
      });

      expect(result.widthMm).toBe(300);
      expect(result.heightMm).toBe(400);
    });

    it('should escape XML special characters in metadata', () => {
      const engine = new ExportEngine();
      const result = engine.exportToSvg(sampleInput, {
        title: 'Test <>&"\' Map',
      });

      expect(result.data).toContain('Test &lt;&gt;&amp;&quot;&apos; Map');
    });
  });

  describe('PDF export', () => {
    it('should export to PDF format', async () => {
      const engine = new ExportEngine();
      const result = await engine.exportToPdf(sampleInput);

      expect(result.format).toBe('pdf');
      expect(Buffer.isBuffer(result.data)).toBe(true);
    });

    it('should include correct dimensions', async () => {
      const engine = new ExportEngine();
      const result = await engine.exportToPdf(sampleInput, {
        pageSize: 'A4',
        orientation: 'portrait',
      });

      expect(result.widthMm).toBe(210);
      expect(result.heightMm).toBe(297);
    });

    it('should handle landscape orientation', async () => {
      const engine = new ExportEngine();
      const result = await engine.exportToPdf(sampleInput, {
        pageSize: 'A4',
        orientation: 'landscape',
      });

      expect(result.widthMm).toBe(297);
      expect(result.heightMm).toBe(210);
    });

    it('should generate valid PDF buffer', async () => {
      const engine = new ExportEngine();
      const result = await engine.exportToPdf(sampleInput);

      // PDF files start with %PDF
      const pdfHeader = (result.data as Buffer).subarray(0, 4).toString('utf-8');
      expect(pdfHeader).toBe('%PDF');
    });

    it('should handle SVG with single-quoted attributes', async () => {
      const singleQuoteSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
        <rect width='100' height='100' fill='#ff0000'/>
        <circle cx='150' cy='150' r='30' fill='blue'/>
      </svg>`;
      const engine = new ExportEngine();
      const result = await engine.exportToPdf(
        { svg: singleQuoteSvg, width: 200, height: 200 },
        { pageSize: 'A4' }
      );

      expect(result.format).toBe('pdf');
      expect(Buffer.isBuffer(result.data)).toBe(true);
      const pdfHeader = (result.data as Buffer).subarray(0, 4).toString('utf-8');
      expect(pdfHeader).toBe('%PDF');
    });
  });

  describe('generic export method', () => {
    it('should export to SVG via generic export', async () => {
      const engine = new ExportEngine();
      const result = await engine.export(sampleInput, { format: 'svg' });

      expect(result.format).toBe('svg');
      expect(typeof result.data).toBe('string');
    });

    it('should export to PDF via generic export', async () => {
      const engine = new ExportEngine();
      const result = await engine.export(sampleInput, { format: 'pdf' });

      expect(result.format).toBe('pdf');
      expect(Buffer.isBuffer(result.data)).toBe(true);
    });

    it('should use default format when not specified', async () => {
      const engine = new ExportEngine({ format: 'svg' });
      const result = await engine.export(sampleInput);

      expect(result.format).toBe('svg');
    });
  });

  describe('validation', () => {
    it('should throw ExportError for unsupported format', async () => {
      const engine = new ExportEngine();
      await expect(
        engine.export(sampleInput, { format: 'eps' as ExportConfig['format'] })
      ).rejects.toThrow(ExportError);
    });

    it('should throw ExportError for invalid DPI', async () => {
      const engine = new ExportEngine();
      await expect(engine.export(sampleInput, { dpi: 50 })).rejects.toThrow(ExportError);
      await expect(engine.export(sampleInput, { dpi: 1500 })).rejects.toThrow(ExportError);
    });

    it('should throw ExportError for invalid page size preset', async () => {
      const engine = new ExportEngine();
      await expect(
        engine.export(sampleInput, { pageSize: 'InvalidSize' as ExportConfig['pageSize'] })
      ).rejects.toThrow(ExportError);
    });

    it('should throw ExportError for invalid custom page size', async () => {
      const engine = new ExportEngine();
      await expect(
        engine.export(sampleInput, { pageSize: { width: -100, height: 200 } })
      ).rejects.toThrow(ExportError);
    });

    it('should throw ExportError for invalid orientation', async () => {
      const engine = new ExportEngine();
      await expect(
        engine.export(sampleInput, { orientation: 'invalid' as ExportConfig['orientation'] })
      ).rejects.toThrow(ExportError);
    });

    it('should throw ExportError for empty SVG input', async () => {
      const engine = new ExportEngine();
      await expect(engine.export({ svg: '', width: 100, height: 100 })).rejects.toThrow(
        ExportError
      );
    });

    it('should throw ExportError for invalid dimensions', async () => {
      const engine = new ExportEngine();
      await expect(engine.export({ svg: sampleSvg, width: 0, height: 100 })).rejects.toThrow(
        ExportError
      );
      await expect(engine.export({ svg: sampleSvg, width: 100, height: -50 })).rejects.toThrow(
        ExportError
      );
    });
  });
});

describe('exportToSvg function', () => {
  const sampleInput: ExportInput = {
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="red"/></svg>',
    width: 100,
    height: 100,
  };

  it('should export directly without engine instance', () => {
    const result = exportToSvg(sampleInput, DEFAULT_EXPORT_CONFIG);

    expect(result.format).toBe('svg');
    expect(typeof result.data).toBe('string');
    expect(result.data).toContain('<svg');
  });
});

describe('PAGE_SIZES', () => {
  it('should have correct A4 dimensions', () => {
    expect(PAGE_SIZES.A4.width).toBe(210);
    expect(PAGE_SIZES.A4.height).toBe(297);
  });

  it('should have correct A3 dimensions', () => {
    expect(PAGE_SIZES.A3.width).toBe(297);
    expect(PAGE_SIZES.A3.height).toBe(420);
  });

  it('should have correct Letter dimensions', () => {
    expect(PAGE_SIZES.Letter.width).toBe(215.9);
    expect(PAGE_SIZES.Letter.height).toBe(279.4);
  });

  it('should have correct Legal dimensions', () => {
    expect(PAGE_SIZES.Legal.width).toBe(215.9);
    expect(PAGE_SIZES.Legal.height).toBe(355.6);
  });
});

describe('DEFAULT_EXPORT_CONFIG', () => {
  it('should have sensible defaults', () => {
    expect(DEFAULT_EXPORT_CONFIG.format).toBe('svg');
    expect(DEFAULT_EXPORT_CONFIG.pageSize).toBe('A4');
    expect(DEFAULT_EXPORT_CONFIG.orientation).toBe('portrait');
    expect(DEFAULT_EXPORT_CONFIG.dpi).toBe(300);
    expect(DEFAULT_EXPORT_CONFIG.embedImages).toBe(true);
  });
});

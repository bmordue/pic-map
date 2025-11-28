# Export Engine

The Export Engine provides functionality for exporting maps to print-ready formats, including SVG and PDF.

## Features

- **SVG Export**: Generates print-ready SVG files with proper dimensions (in millimeters) and viewBox settings
- **PDF Export**: Converts maps to PDF format with configurable DPI and metadata
- **Multiple Page Sizes**: Supports A4, A3, Letter, Legal, and custom page sizes
- **Orientation Support**: Portrait and landscape orientations
- **Metadata Support**: Optional title and author metadata

## Installation

The export engine is included in the main Pic-Map package:

```typescript
import { ExportEngine } from 'picmap';
```

## Basic Usage

### Export to SVG

```typescript
import { MapEngine, ExportEngine } from 'picmap';

// First, render a map
const mapEngine = new MapEngine();
const mapResult = mapEngine.renderMap({
  style: {
    provider: 'openstreetmap',
    zoom: 12,
    center: { latitude: 51.5074, longitude: -0.1278 },
  },
  width: 800,
  height: 600,
  markers: [
    { location: { latitude: 51.5074, longitude: -0.1278 }, label: 'A' }
  ],
});

// Export to SVG
const exportEngine = new ExportEngine();
const svgResult = exportEngine.exportToSvg(
  {
    svg: mapResult.svg,
    width: mapResult.width,
    height: mapResult.height,
  },
  {
    pageSize: 'A4',
    orientation: 'landscape',
    title: 'My Map',
  }
);

// svgResult.data contains the SVG string
console.log(svgResult.widthMm); // 297 (A4 landscape)
console.log(svgResult.heightMm); // 210
```

### Export to PDF

```typescript
import { writeFile } from 'fs/promises';
import { MapEngine, ExportEngine } from 'picmap';

// Render a map (same as above)
const mapEngine = new MapEngine();
const mapResult = mapEngine.renderMap({
  style: {
    provider: 'openstreetmap',
    zoom: 12,
    center: { latitude: 51.5074, longitude: -0.1278 },
  },
  width: 800,
  height: 600,
});

// Export to PDF
const exportEngine = new ExportEngine();
const pdfResult = await exportEngine.exportToPdf(
  {
    svg: mapResult.svg,
    width: mapResult.width,
    height: mapResult.height,
  },
  {
    pageSize: 'A4',
    orientation: 'portrait',
    dpi: 300,
    title: 'My Map',
    author: 'Pic-Map',
  }
);

// pdfResult.data contains the PDF buffer
await writeFile('map.pdf', pdfResult.data as Buffer);
```

### Using the Generic Export Method

```typescript
const exportEngine = new ExportEngine();

// Export based on format parameter
const result = await exportEngine.export(
  { svg: mapSvg, width: 800, height: 600 },
  { format: 'pdf', pageSize: 'A3' }
);
```

## Configuration Options

### ExportConfig

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `format` | `'svg' \| 'pdf'` | `'svg'` | Output format |
| `pageSize` | `PageSizePreset \| { width: number; height: number }` | `'A4'` | Page size (preset name or custom dimensions in mm) |
| `orientation` | `'portrait' \| 'landscape'` | `'portrait'` | Page orientation |
| `dpi` | `number` | `300` | Output resolution in DPI (for PDF) |
| `embedImages` | `boolean` | `true` | Whether to embed images as base64 (for SVG) |
| `title` | `string` | - | Document title for metadata |
| `author` | `string` | - | Document author for metadata |

### Available Page Sizes

| Preset | Portrait (mm) | Landscape (mm) |
|--------|---------------|----------------|
| A4 | 210 × 297 | 297 × 210 |
| A3 | 297 × 420 | 420 × 297 |
| Letter | 215.9 × 279.4 | 279.4 × 215.9 |
| Legal | 215.9 × 355.6 | 355.6 × 215.9 |

## Static Methods

### `ExportEngine.getAvailableFormats()`

Returns an array of supported export formats.

```typescript
const formats = ExportEngine.getAvailableFormats();
// ['svg', 'pdf']
```

### `ExportEngine.getPageSizePresets()`

Returns an array of available page size presets.

```typescript
const presets = ExportEngine.getPageSizePresets();
// ['A4', 'A3', 'Letter', 'Legal']
```

### `ExportEngine.getPageDimensions(preset, orientation)`

Returns the dimensions for a page size preset.

```typescript
const dims = ExportEngine.getPageDimensions('A4', 'landscape');
// { width: 297, height: 210 }
```

## Export Result

The `ExportResult` object contains:

| Property | Type | Description |
|----------|------|-------------|
| `data` | `string \| Buffer` | The exported content (string for SVG, Buffer for PDF) |
| `format` | `'svg' \| 'pdf'` | The export format |
| `widthMm` | `number` | Width in millimeters |
| `heightMm` | `number` | Height in millimeters |
| `widthPx` | `number` | Width in pixels (at specified DPI) |
| `heightPx` | `number` | Height in pixels (at specified DPI) |

## Default Configuration

You can set default configuration when creating an ExportEngine instance:

```typescript
const exportEngine = new ExportEngine({
  format: 'pdf',
  pageSize: 'A3',
  dpi: 150,
});

// All exports will use these defaults unless overridden
const result = await exportEngine.export(input);
```

## Error Handling

The export engine throws `ExportError` for invalid configurations:

```typescript
import { ExportEngine, ExportError } from 'picmap';

try {
  const engine = new ExportEngine();
  await engine.export(input, { dpi: 50 }); // Invalid DPI
} catch (error) {
  if (error instanceof ExportError) {
    console.error('Export failed:', error.message);
  }
}
```

## Print Quality Considerations

### DPI Settings

- **72 DPI**: Screen resolution, suitable for web preview
- **150 DPI**: Acceptable for draft prints
- **300 DPI**: Standard print quality (recommended)
- **600 DPI**: High-quality prints

### SVG Considerations

SVG exports use millimeter units for print compatibility. The `viewBox` attribute ensures proper scaling when the SVG is rendered at different sizes.

### PDF Considerations

PDF exports convert SVG elements to native PDF drawing commands, ensuring vector-quality output. Text, shapes, and paths are preserved as vectors.

## Example: CLI Export

```bash
# Build the project
npm run build

# Export to SVG (default)
node dist/examples/export-map.js

# Export to PDF
node dist/examples/export-map.js pdf

# Export to specific file
node dist/examples/export-map.js pdf my-map.pdf
```

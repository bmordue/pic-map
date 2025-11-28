# Pic-Map API Reference

This document provides comprehensive API documentation for all public modules and interfaces in Pic-Map.

## Table of Contents

- [Core Types](#core-types)
- [Map Engine](#map-engine)
- [Export Engine](#export-engine)
- [Picture Border Engine](#picture-border-engine)
- [Link Manager](#link-manager)
- [Compositor](#compositor)
- [Validation](#validation)
- [Utilities](#utilities)

---

## Core Types

### GeoLocation

Geographic location with coordinates and optional metadata.

```typescript
interface GeoLocation {
  latitude: number;   // -90 to 90
  longitude: number;  // -180 to 180
  name?: string;
  description?: string;
}
```

### ImageMetadata

Information about an image to be placed in the picture border.

```typescript
interface ImageMetadata {
  filePath: string;
  caption?: string;
  dimensions?: ImageDimensions;
  altText?: string;
  credit?: string;
}

interface ImageDimensions {
  width: number;   // pixels
  height: number;  // pixels
}
```

### ImageLocationLink

Links an image to a geographic location on the map.

```typescript
interface ImageLocationLink {
  imageId: string;
  location: GeoLocation;
  label?: string;
}
```

### LayoutOptions

Page layout configuration.

```typescript
interface LayoutOptions {
  pageSize: 'A4' | 'Letter' | 'A3' | 'custom';
  customDimensions?: { width: number; height: number };  // mm
  orientation: 'portrait' | 'landscape';
  borderWidth: number;      // mm
  pictureSpacing: number;   // mm
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}
```

### MapStyle

Map rendering configuration.

```typescript
interface MapStyle {
  provider: 'openstreetmap' | 'custom';
  zoom: number;          // 0-20
  center: GeoLocation;
  showScale?: boolean;
  showAttribution?: boolean;
}
```

### MapMarker

Marker configuration for map display.

```typescript
interface MapMarker {
  location: GeoLocation;
  label?: string;
  style?: {
    color?: string;
    size?: number;
    shape?: 'circle' | 'pin' | 'square';
  };
}
```

### PictureBorderStyle

Styling for the picture border frames.

```typescript
interface PictureBorderStyle {
  backgroundColor?: string;
  borderColor?: string;
  borderThickness?: number;
  cornerRadius?: number;
}
```

### LinkStyle

Styling for link indicators.

```typescript
interface LinkStyle {
  type: 'line' | 'label' | 'both' | 'none';
  lineColor?: string;
  lineWidth?: number;
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  labelStyle?: {
    fontFamily?: string;
    fontSize?: number;
    color?: string;
  };
}
```

### PicMapConfig

Complete configuration for a Pic-Map project.

```typescript
interface PicMapConfig {
  title: string;
  description?: string;
  layout: LayoutOptions;
  map: MapStyle;
  pictureBorder?: PictureBorderStyle;
  linkStyle?: LinkStyle;
  images: ImageMetadata[];
  links: ImageLocationLink[];
}
```

### RenderedMap

Output from map rendering.

```typescript
interface RenderedMap {
  svg: string;
  width: number;
  height: number;
  bounds: BoundingBox;
}

interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}
```

---

## Map Engine

The Map Engine renders SVG-based maps with markers, scale bars, and attribution.

### MapEngine Class

```typescript
import { MapEngine } from 'picmap';
```

#### Constructor

```typescript
const engine = new MapEngine();
```

#### renderMap()

Renders a map to SVG format.

```typescript
renderMap(config: MapRenderConfig): RenderedMap
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `config.style` | `MapStyle` | Map style configuration |
| `config.width` | `number` | Output width in pixels |
| `config.height` | `number` | Output height in pixels |
| `config.markers` | `MapMarker[]` | Optional markers to render |
| `config.backgroundColor` | `string` | Optional background color |

**Returns:** `RenderedMap`

**Example:**

```typescript
const engine = new MapEngine();

const result = engine.renderMap({
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
      style: { color: '#e74c3c', size: 20, shape: 'pin' }
    }
  ],
  backgroundColor: '#f0f0f0'
});
```

#### Static: createMarkersFromLinks()

Creates markers from image-location links.

```typescript
static createMarkersFromLinks(links: ImageLocationLink[]): MapMarker[]
```

**Example:**

```typescript
const markers = MapEngine.createMarkersFromLinks(config.links);
```

### Coordinate Functions

Import coordinate utilities:

```typescript
import {
  geoToPixel,
  pixelToGeo,
  geoToViewportPixel,
  calculateBounds,
  calculateCenter,
  calculateZoomToFit
} from 'picmap';
```

#### geoToPixel()

Converts geographic coordinates to pixel coordinates.

```typescript
geoToPixel(location: GeoLocation, zoom: number): PixelCoordinate
```

**Example:**

```typescript
const pixel = geoToPixel({ latitude: 51.5074, longitude: -0.1278 }, 12);
// Returns: { x: 130552, y: 86863 }
```

#### pixelToGeo()

Converts pixel coordinates to geographic coordinates.

```typescript
pixelToGeo(pixel: PixelCoordinate, zoom: number): GeoLocation
```

#### geoToViewportPixel()

Converts a geographic location to viewport-relative pixel coordinates.

```typescript
geoToViewportPixel(
  location: GeoLocation,
  center: GeoLocation,
  zoom: number,
  viewportWidth: number,
  viewportHeight: number
): PixelCoordinate
```

#### calculateCenter()

Calculates the center point of multiple locations.

```typescript
calculateCenter(locations: GeoLocation[]): GeoLocation
```

**Example:**

```typescript
const center = calculateCenter([
  { latitude: 51.5074, longitude: -0.1278 },
  { latitude: 51.5033, longitude: -0.1195 }
]);
```

#### calculateZoomToFit()

Calculates optimal zoom level to fit all locations.

```typescript
calculateZoomToFit(
  locations: GeoLocation[],
  width: number,
  height: number,
  padding?: number
): number
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `locations` | `GeoLocation[]` | Locations to fit |
| `width` | `number` | Viewport width in pixels |
| `height` | `number` | Viewport height in pixels |
| `padding` | `number` | Optional padding in pixels (default: 50) |

#### calculateBounds()

Calculates the geographic bounding box for a map.

```typescript
calculateBounds(
  center: GeoLocation,
  zoom: number,
  width: number,
  height: number
): BoundingBox
```

---

## Export Engine

The Export Engine converts rendered maps to print-ready formats.

### ExportEngine Class

```typescript
import { ExportEngine } from 'picmap';
```

#### Constructor

```typescript
const engine = new ExportEngine(defaultConfig?: ExportConfig);
```

#### exportToSvg()

Exports to print-ready SVG format.

```typescript
exportToSvg(input: ExportInput, config?: ExportConfig): ExportResult
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `input.svg` | `string` | SVG content to export |
| `input.width` | `number` | Original width in pixels |
| `input.height` | `number` | Original height in pixels |
| `config.pageSize` | `PageSizePreset \| Dimensions` | Page size |
| `config.orientation` | `'portrait' \| 'landscape'` | Page orientation |
| `config.title` | `string` | Optional document title |

**Returns:** `ExportResult`

```typescript
interface ExportResult {
  data: string | Buffer;
  format: 'svg' | 'pdf';
  widthMm: number;
  heightMm: number;
  widthPx: number;
  heightPx: number;
}
```

**Example:**

```typescript
const result = exportEngine.exportToSvg(
  { svg: mapSvg, width: 800, height: 600 },
  { pageSize: 'A4', orientation: 'landscape', title: 'My Map' }
);
```

#### exportToPdf()

Exports to PDF format.

```typescript
async exportToPdf(input: ExportInput, config?: ExportConfig): Promise<ExportResult>
```

**Additional PDF Configuration:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `config.dpi` | `number` | 300 | Output resolution |
| `config.author` | `string` | - | Document author |
| `config.embedImages` | `boolean` | true | Embed images in PDF |

**Example:**

```typescript
const result = await exportEngine.exportToPdf(
  { svg: mapSvg, width: 800, height: 600 },
  { 
    pageSize: 'A4', 
    dpi: 300, 
    title: 'My Map',
    author: 'Map Creator'
  }
);

// Write to file
import { writeFile } from 'fs/promises';
await writeFile('output.pdf', result.data);
```

#### export()

Generic export method that supports both formats.

```typescript
async export(input: ExportInput, config: ExportConfig): Promise<ExportResult>
```

**Example:**

```typescript
const result = await engine.export(
  { svg: mapSvg, width: 800, height: 600 },
  { format: 'pdf', pageSize: 'A4' }
);
```

#### Static Methods

```typescript
// Get supported export formats
ExportEngine.getAvailableFormats(): string[]
// Returns: ['svg', 'pdf']

// Get page size presets
ExportEngine.getPageSizePresets(): string[]
// Returns: ['A4', 'A3', 'Letter', 'Legal']

// Get dimensions for a page size
ExportEngine.getPageDimensions(
  preset: PageSizePreset,
  orientation: Orientation
): Dimensions
```

---

## Picture Border Engine

Renders picture frames around the map area.

### PictureBorderEngine Class

```typescript
import { PictureBorderEngine } from 'picmap';
```

#### renderBorder()

Renders the complete picture border.

```typescript
renderBorder(config: PictureBorderRenderConfig): RenderedPictureBorder
```

**Parameters:**

```typescript
interface PictureBorderRenderConfig {
  layout: LayoutOptions;
  images: ImageMetadata[];
  style?: PictureBorderStyle;
  links?: Array<{ imageId: string; label?: string }>;
  dpi?: number;
  borderBackgroundColor?: string;
}
```

**Returns:**

```typescript
interface RenderedPictureBorder {
  svg: string;
  width: number;
  height: number;
  layout: BorderLayout;
  positionedPictures: PositionedPicture[];
}
```

**Example:**

```typescript
const borderEngine = new PictureBorderEngine();

const border = borderEngine.renderBorder({
  layout: config.layout,
  images: config.images,
  style: config.pictureBorder,
  links: config.links.map(l => ({ imageId: l.imageId, label: l.label })),
  dpi: 300
});
```

#### getLayout()

Gets layout information without rendering.

```typescript
getLayout(
  layoutOptions: LayoutOptions,
  pictureCount: number,
  dpi?: number
): BorderLayout
```

---

## Link Manager

Manages connections between pictures and map markers.

### LinkManager Class

```typescript
import { LinkManager } from 'picmap';
```

#### resolveLinks()

Resolves links with position information.

```typescript
resolveLinks(
  links: ImageLocationLink[],
  picturePositions: PicturePosition[],
  config: LinkRenderConfig
): ResolvedLink[]
```

#### renderLinks()

Renders link visualizations to SVG.

```typescript
renderLinks(
  resolvedLinks: ResolvedLink[],
  config: LinkRenderConfig
): RenderedLinks
```

**Returns:**

```typescript
interface RenderedLinks {
  svg: string;
  linkCount: number;
  warnings: string[];
}
```

#### renderAllLinks()

Convenience method that resolves and renders in one step.

```typescript
renderAllLinks(
  links: ImageLocationLink[],
  picturePositions: PicturePosition[],
  config: LinkRenderConfig
): RenderedLinks
```

#### groupLinksByLocation()

Groups links that share the same location.

```typescript
groupLinksByLocation(resolvedLinks: ResolvedLink[]): LocationGroup[]
```

#### Static: validateLinks()

Validates that all image IDs have corresponding positions.

```typescript
static validateLinks(
  links: ImageLocationLink[],
  picturePositions: PicturePosition[]
): string[]
```

#### Static: createPicturePositions()

Creates picture positions for a rectangular border layout.

```typescript
static createPicturePositions(
  pictureCount: number,
  borderConfig: BorderConfig
): PicturePosition[]
```

---

## Compositor

Combines all elements into a final composition.

### Compositor Class

```typescript
import { Compositor, createCompositorFromLayout } from 'picmap';
```

#### Constructor

```typescript
const compositor = new Compositor(config: CompositorConfig);
```

**Configuration:**

```typescript
interface CompositorConfig {
  pageSize: 'A4' | 'Letter' | 'A3' | 'custom';
  customDimensions?: Dimensions;
  orientation: 'portrait' | 'landscape';
  borderWidth: number;      // mm
  pictureSpacing: number;   // mm
  margin: Margin;
  dpi?: number;             // default: 300
  pictureBorderStyle?: PictureBorderStyle;
  linkStyle?: LinkStyle;
}
```

#### render()

Renders the complete composition.

```typescript
render(input: CompositionInput): RenderedComposition
```

**Input:**

```typescript
interface CompositionInput {
  map: RenderedMap;
  images: ImageMetadata[];
  links: Array<{
    imageIndex: number;
    markerPosition: { x: number; y: number };
    label?: string;
  }>;
}
```

**Output:**

```typescript
interface RenderedComposition {
  svg: string;
  width: number;
  height: number;
  dpi: number;
  pageSizeMm: Dimensions;
}
```

#### preview()

Generates a lower-resolution preview.

```typescript
preview(input: CompositionInput, previewDpi?: number): RenderedComposition
```

#### createLayout()

Creates layout without rendering.

```typescript
createLayout(input: CompositionInput): CompositionLayout
```

#### Factory Function

```typescript
function createCompositorFromLayout(
  layout: LayoutOptions,
  pictureBorder?: PictureBorderStyle,
  linkStyle?: LinkStyle,
  dpi?: number
): Compositor
```

**Example:**

```typescript
const compositor = createCompositorFromLayout(
  config.layout,
  config.pictureBorder,
  config.linkStyle,
  300
);

const composition = compositor.render({
  map: renderedMap,
  images: config.images,
  links: processedLinks
});
```

---

## Validation

Data validation utilities.

```typescript
import {
  validatePicMapConfig,
  validateGeoLocation,
  validateImageMetadata,
  validateLayoutOptions,
  validateMapStyle,
  validateImageLocationLink,
  isGeoLocation,
  isImageMetadata,
  isPicMapConfig
} from 'picmap';
```

### ValidationResult

```typescript
interface ValidationResult {
  valid: boolean;
  errors: string[];
}
```

### Validation Functions

#### validatePicMapConfig()

Validates a complete configuration.

```typescript
validatePicMapConfig(config: unknown): ValidationResult
```

**Example:**

```typescript
const result = validatePicMapConfig(config);
if (!result.valid) {
  console.error('Errors:', result.errors);
}
```

#### validateGeoLocation()

```typescript
validateGeoLocation(location: unknown): ValidationResult
```

#### validateImageMetadata()

```typescript
validateImageMetadata(metadata: unknown): ValidationResult
```

#### validateLayoutOptions()

```typescript
validateLayoutOptions(layout: unknown): ValidationResult
```

#### validateMapStyle()

```typescript
validateMapStyle(mapStyle: unknown): ValidationResult
```

### Type Guards

```typescript
isGeoLocation(value: unknown): value is GeoLocation
isImageMetadata(value: unknown): value is ImageMetadata
isPicMapConfig(value: unknown): value is PicMapConfig
```

---

## Utilities

### Configuration Loading

```typescript
import { loadConfigFromFile, normalizeConfig } from 'picmap';
```

#### loadConfigFromFile()

Loads and validates configuration from a JSON file.

```typescript
async loadConfigFromFile(filePath: string): Promise<PicMapConfig>
```

**Example:**

```typescript
const config = await loadConfigFromFile('examples/sample-config.json');
```

#### normalizeConfig()

Applies default values to a configuration.

```typescript
normalizeConfig(config: PicMapConfig): PicMapConfig
```

---

## Error Handling

### ExportError

Thrown for export-related errors.

```typescript
import { ExportError } from 'picmap';

try {
  await exportEngine.export(input, config);
} catch (error) {
  if (error instanceof ExportError) {
    console.error('Export failed:', error.message);
  }
}
```

---

## Constants

### Page Sizes

```typescript
import { PAGE_SIZES } from 'picmap';

// PAGE_SIZES = {
//   A4: { width: 210, height: 297 },
//   Letter: { width: 215.9, height: 279.4 },
//   A3: { width: 297, height: 420 },
// }
```

### Default DPI

```typescript
const DEFAULT_DPI = 300;
```

---

## Complete Example

```typescript
import { writeFile } from 'fs/promises';
import {
  loadConfigFromFile,
  MapEngine,
  ExportEngine,
  Compositor,
  createCompositorFromLayout,
  PictureBorderEngine
} from 'picmap';

async function createFullComposition() {
  // 1. Load configuration
  const config = await loadConfigFromFile('config.json');

  // 2. Render map
  const mapEngine = new MapEngine();
  const markers = MapEngine.createMarkersFromLinks(config.links);
  const map = mapEngine.renderMap({
    style: config.map,
    width: 800,
    height: 600,
    markers
  });

  // 3. Create compositor
  const compositor = createCompositorFromLayout(
    config.layout,
    config.pictureBorder,
    config.linkStyle,
    300
  );

  // 4. Prepare links with marker positions
  const links = config.links.map((link, index) => ({
    imageIndex: index,
    markerPosition: { x: 100 + index * 50, y: 100 + index * 30 },
    label: link.label
  }));

  // 5. Render composition
  const composition = compositor.render({
    map,
    images: config.images,
    links
  });

  // 6. Export to PDF
  const exportEngine = new ExportEngine();
  const pdf = await exportEngine.exportToPdf(
    { svg: composition.svg, width: composition.width, height: composition.height },
    { pageSize: 'A4', orientation: 'landscape', dpi: 300 }
  );

  await writeFile('output.pdf', pdf.data);
}
```

# Map Engine

The Map Engine module provides core map rendering functionality for Pic-Map. It includes coordinate conversion utilities and an SVG-based map rendering engine optimized for print output.

## Features

- **Web Mercator Projection**: Industry-standard coordinate system for web maps
- **SVG Output**: Vector-based rendering perfect for print
- **Customizable Markers**: Support for multiple marker shapes (pin, circle, square)
- **Auto-fit**: Automatic zoom and center calculation for multiple markers
- **Scale Bar**: Configurable scale display with metric units
- **Attribution**: Proper map attribution for different providers

## Usage

### Basic Map Rendering

```typescript
import { MapEngine } from 'picmap';

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
});

console.log(result.svg); // SVG string
console.log(result.bounds); // Geographic bounds of the map
```

### Adding Markers

```typescript
import { MapEngine, MapMarker } from 'picmap';

const markers: MapMarker[] = [
  {
    location: { latitude: 51.5074, longitude: -0.1278 },
    label: 'A',
    style: {
      color: '#e74c3c',
      size: 20,
      shape: 'pin',
    },
  },
  {
    location: { latitude: 51.51, longitude: -0.13 },
    label: 'B',
    style: {
      color: '#3498db',
      size: 20,
      shape: 'circle',
    },
  },
];

const engine = new MapEngine();
const result = engine.renderMap({
  style: {
    provider: 'openstreetmap',
    zoom: 12,
    center: { latitude: 51.5074, longitude: -0.1278 },
  },
  width: 800,
  height: 600,
  markers,
});
```

### Creating Markers from Configuration

```typescript
import { MapEngine, loadConfigFromFile } from 'picmap';

const config = await loadConfigFromFile('config.json');
const markers = MapEngine.createMarkersFromLinks(config.links);

const engine = new MapEngine();
const result = engine.renderMap({
  style: config.map,
  width: 800,
  height: 600,
  markers,
});
```

### Coordinate Utilities

```typescript
import { 
  geoToPixel,
  pixelToGeo,
  calculateBounds,
  calculateCenter,
  calculateZoomToFit,
  geoToViewportPixel,
} from 'picmap';

// Convert geographic coordinates to pixel coordinates
const pixel = geoToPixel({ latitude: 51.5074, longitude: -0.1278 }, 12);

// Convert pixel coordinates back to geographic
const geo = pixelToGeo({ x: 2048, y: 1536 }, 12);

// Calculate center of multiple locations
const locations = [
  { latitude: 51.5074, longitude: -0.1278 },
  { latitude: 48.8566, longitude: 2.3522 },
];
const center = calculateCenter(locations);

// Calculate appropriate zoom level to fit all locations
const zoom = calculateZoomToFit(locations, 800, 600);

// Calculate bounding box for a map
const bounds = calculateBounds(center, zoom, 800, 600);
```

## API Reference

### MapEngine

#### renderMap(config: MapRenderConfig): RenderedMap

Renders a map to SVG based on the provided configuration.

**Parameters:**
- `config.style` - Map style configuration (provider, zoom, center, etc.)
- `config.width` - Width of the output map in pixels
- `config.height` - Height of the output map in pixels
- `config.markers` - Optional array of markers to render
- `config.backgroundColor` - Optional background color (default: '#f0f0f0')

**Returns:** `RenderedMap` object containing:
- `svg` - SVG string
- `width` - Map width in pixels
- `height` - Map height in pixels
- `bounds` - Geographic bounding box

#### static createMarkersFromLinks(links): MapMarker[]

Creates an array of map markers from image-location links.

### Coordinate Functions

#### geoToPixel(location: GeoLocation, zoom: number): PixelCoordinate

Converts geographic coordinates to pixel coordinates at a given zoom level.

#### pixelToGeo(pixel: PixelCoordinate, zoom: number): GeoLocation

Converts pixel coordinates to geographic coordinates at a given zoom level.

#### geoToViewportPixel(location, center, zoom, width, height): PixelCoordinate

Converts a geographic location to pixel coordinates relative to a map viewport.

#### calculateBounds(center, zoom, width, height): BoundingBox

Calculates the bounding box for a map centered at a given location.

#### calculateCenter(locations: GeoLocation[]): GeoLocation

Calculates the center point of a collection of locations.

#### calculateZoomToFit(locations, width, height, padding?): number

Calculates the appropriate zoom level to fit all locations within a viewport.

## Marker Styles

### Shapes

- **pin**: Classic map pin (teardrop shape)
- **circle**: Simple circular marker
- **square**: Square marker

### Customization

```typescript
const marker: MapMarker = {
  location: { latitude: 51.5074, longitude: -0.1278 },
  label: 'A',
  style: {
    color: '#e74c3c',   // Marker color
    size: 20,           // Marker size in pixels
    shape: 'pin',       // Marker shape
  },
};
```

## Map Providers

Currently supported providers:
- `openstreetmap` - OpenStreetMap with standard attribution
- `custom` - Custom map tiles with custom attribution

## Print Output

The Map Engine generates high-quality SVG output optimized for print:

- **Vector-based**: Scales to any resolution without loss of quality
- **Standard DPI**: Designed for 96 DPI (web) to 300 DPI (print)
- **Editable**: SVG can be opened in vector graphics editors
- **Convertible**: Easy to convert to PDF, EPS, or PNG

### Recommended Dimensions

For print output:
- **A4 Portrait (300 DPI)**: 2480 x 3508 pixels
- **A4 Landscape (300 DPI)**: 3508 x 2480 pixels
- **Letter Portrait (300 DPI)**: 2550 x 3300 pixels
- **Letter Landscape (300 DPI)**: 3300 x 2550 pixels

For web preview:
- **A4 Landscape (96 DPI)**: 1122 x 794 pixels
- **Letter Landscape (96 DPI)**: 1056 x 816 pixels

## Examples

See `src/examples/render-map.ts` for a complete example of rendering a map from a configuration file.

```bash
# Build the project
npm run build

# Run the example
node dist/examples/render-map.js [config-file]
```

## Testing

The Map Engine includes comprehensive test coverage:

```bash
npm test
```

Test files:
- `coordinates.test.ts` - Unit tests for coordinate utilities
- `engine.test.ts` - Unit tests for map rendering
- `integration.test.ts` - Integration tests for complete workflows
